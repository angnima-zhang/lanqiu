import {
    _decorator,
    Button,
    Component,
    EditBox,
    Font,
    Label,
    Node,
    resources,
    RichText,
    Sprite,
    SpriteFrame,
    sys,
    UITransform,
} from 'cc';
import {
    calculateTeamOverall,
    GAME_STATE_EVENT_PLAYER_DETAILS_REQUESTED,
    GAME_STATE_EVENT_MANAGEMENT_CHANGED,
    GAME_STATE_EVENT_ROSTER_CHANGED,
    GAME_STATE_EVENT_TEAM_IDENTITY_CHANGED,
    gameStateEvents,
    getManagementEffects,
    getPlayerAcquisitionCount,
    getPlayerServiceDurationMs,
    getTeamAbbreviation,
    INT32_MAX,
    loadGameSettings,
    loadManagementLevels,
    loadRoster,
    loadSeasonState,
    PlayerCard,
    saveGameSettings,
    TEAM_ABBREVIATION_STORAGE_KEY,
    TEAM_NAME_STORAGE_KEY,
} from './GameState';
import {
    loadPlayerPortrait,
    loadPlayerEventIcon,
    loadQualityBadge,
    loadQualityFrame,
    loadQualityNameplate,
    loadQualityPosition,
    loadThinQualityFrame,
    loadQualityWheat,
    loadRecruitmentBackground,
} from './PlayerAssets';
import {
    formatPlayerOverall,
    RosterSlotView,
} from './RosterSlotView';
import {
    TEAM_PROGRESSION_EVENT_WIN_UPGRADE_REQUESTED,
    teamProgressionEvents,
} from './TeamLevelController';
import { TopTeamInfoController } from './TopTeamInfoController';
import { PreMatchController } from './PreMatchController';
import { applyGameFont } from '../loading/GameFont';
import { playFullScreenEntrance } from './FullScreenEntrance';
import { stopFullScreenEntrance } from './FullScreenEntrance';
import { playFullScreenExit as exitWithFade } from './FullScreenEntrance';
import { ManagementController } from './ManagementController';
import { ManagerSlotView } from './ManagerSlotView';
import { consumeHomepageReturnTarget } from './MatchSession';
import { ManagementRole } from './GameState';
import { IdleIncomeController } from './IdleIncomeController';
import { RecruitmentProbabilityController } from './RecruitmentProbabilityController';
import { gameAudio } from './GameAudio';
import { installGoldAdButtonGlows } from './GoldAdButtonGlow';
import {
    applyOverallTrendArrow,
    applyOverallNumberQuality,
    applyPlayerQualityVisuals,
    getOverallDefaultColor,
    getOverallTrendColor,
    OverallTrend,
} from './PlayerQualityVisuals';
import { PlayerEventController } from './PlayerEventController';
import { setGrowingNumber } from './NumberGrowthAnimator';
import { showRewardedVideo } from './RewardedAdService';
import {
    addPermanentOverallForPlayerKnowledge,
    advancePlayerKnowledgeQuestion,
    calculatePlayerKnowledgeReward,
    formatPlayerKnowledgeText,
    formatPlayerProfile,
    getPlayerKnowledgeProgress,
    hasAnsweredPlayerKnowledgeQuestion,
    loadPlayerKnowledgeConfig,
    recordPlayerKnowledgeAnswer,
    recordPlayerKnowledgeReward,
    unlockPlayerKnowledgeAnswers,
} from './PlayerKnowledge';

const { ccclass } = _decorator;

interface BoundButton {
    button: Button;
    callback: () => void;
}

interface ButtonVisualBinding {
    button: Button;
    sprite: Sprite | null;
    originalGrayscale: boolean;
    lastInteractable: boolean | null;
}

interface SettingToggleSprites {
    onSprite: SpriteFrame | null;
    offSprite: SpriteFrame | null;
}

@ccclass('HomeUiController')
export class HomeUiController extends Component {
    private canvas: Node | null = null;
    private homeRoot: Node | null = null;
    private teamInfoPage: Node | null = null;
    private settingsPage: Node | null = null;
    private playerDetailsPage: Node | null = null;
    private managementPage: Node | null = null;
    private managementController: ManagementController | null = null;
    private idleIncomeController: IdleIncomeController | null = null;
    private recruitmentProbabilityController: RecruitmentProbabilityController | null = null;
    private playerEventController: PlayerEventController | null = null;
    private topTeamInfoController: TopTeamInfoController | null = null;
    private rosterSlots: RosterSlotView[] = [];
    private boundButtons: BoundButton[] = [];
    private teamNameEditBox: EditBox | null = null;
    private teamNameDisplayLabel: Label | null = null;
    private teamNameInputLabel: Label | null = null;
    private editingTeamName = false;
    private cardRenderVersion = 0;
    private knowledgeRenderVersion = 0;
    private currentKnowledgeSourceName: string | null = null;
    private readonly playerKnowledgeQuestionWidths = new WeakMap<Node, number>();
    private teamInfoRequestVersion = 0;
    private buttonVisualBindings: ButtonVisualBinding[] = [];
    private readonly buttonGrayscaleOverrides = new WeakMap<Button, boolean>();
    private recruitButtonWithPressedSprite: Button | null = null;
    private readonly settingToggleSprites = new WeakMap<Button, SettingToggleSprites>();

    protected onLoad(): void {
        this.resolveSceneReferences();
        if (
            !this.canvas
            || !this.homeRoot
            || !this.teamInfoPage
            || !this.settingsPage
            || !this.playerDetailsPage
        ) {
            console.error('[HomeUiController] Missing Homepage UI references.');
            this.enabled = false;
            return;
        }

        this.teamInfoPage.active = false;
        this.settingsPage.active = false;
        this.playerDetailsPage.active = false;
        this.ensurePlayerKnowledgeButtons();
        this.playerEventController = this.node.getComponent(PlayerEventController)
            ?? this.node.addComponent(PlayerEventController);
        this.managementController = this.node.getComponent(ManagementController)
            ?? this.node.addComponent(ManagementController);
        this.recruitmentProbabilityController = this.node.getComponent(
            RecruitmentProbabilityController,
        ) ?? this.node.addComponent(RecruitmentProbabilityController);
        this.recruitButtonWithPressedSprite = this.findByPath(
            this.homeRoot,
            '底部按钮/招募/招募',
        )?.getComponent(Button) ?? null;
        this.captureSettingToggleSprites();
        this.prepareAllButtonVisuals(this.canvas);
        installGoldAdButtonGlows(this.canvas);
        this.syncDisabledButtonVisuals(true);
        this.prepareTeamNameEditor();
    }

    protected lateUpdate(): void {
        this.syncDisabledButtonVisuals(false);
    }

    protected start(): void {
        this.scheduleOnce(this.applyHomepageFont, 0.25);
        this.scheduleOnce(() => gameAudio.initialize(), 0.5);
        if (consumeHomepageReturnTarget() === 'pre-match') {
            this.scheduleOnce(this.openPreMatchPage, 0);
        }
    }

    protected onEnable(): void {
        this.bindAllButtons();
        gameStateEvents.on(
            GAME_STATE_EVENT_ROSTER_CHANGED,
            this.onRosterChanged,
            this,
        );
        gameStateEvents.on(
            GAME_STATE_EVENT_TEAM_IDENTITY_CHANGED,
            this.onTeamIdentityChanged,
            this,
        );
        gameStateEvents.on(
            GAME_STATE_EVENT_PLAYER_DETAILS_REQUESTED,
            this.openPlayerDetails,
            this,
        );
        gameStateEvents.on(
            GAME_STATE_EVENT_MANAGEMENT_CHANGED,
            this.onManagementChanged,
            this,
        );
        teamProgressionEvents.on(
            TEAM_PROGRESSION_EVENT_WIN_UPGRADE_REQUESTED,
            this.openPreMatchPage,
            this,
        );
    }

    protected onDisable(): void {
        for (const binding of this.boundButtons) {
            binding.button.node.off(Button.EventType.CLICK, binding.callback, this);
        }
        this.boundButtons = [];
        gameStateEvents.off(
            GAME_STATE_EVENT_ROSTER_CHANGED,
            this.onRosterChanged,
            this,
        );
        gameStateEvents.off(
            GAME_STATE_EVENT_TEAM_IDENTITY_CHANGED,
            this.onTeamIdentityChanged,
            this,
        );
        gameStateEvents.off(
            GAME_STATE_EVENT_PLAYER_DETAILS_REQUESTED,
            this.openPlayerDetails,
            this,
        );
        gameStateEvents.off(
            GAME_STATE_EVENT_MANAGEMENT_CHANGED,
            this.onManagementChanged,
            this,
        );
        teamProgressionEvents.off(
            TEAM_PROGRESSION_EVENT_WIN_UPGRADE_REQUESTED,
            this.openPreMatchPage,
            this,
        );
    }

    private bindAllButtons(): void {
        this.bindButton(
            this.findByPath(this.homeRoot, '顶部球队信息/球队简称')?.getComponent(Button),
            this.openTeamInfoPage,
        );
        this.bindButton(
            this.findByPath(this.homeRoot, '顶部球队信息/设置')?.getComponent(Button),
            this.openSettingsPage,
        );

        this.bindButton(
            this.teamInfoPage?.getChildByName('关闭')?.getComponent(Button),
            this.closeTeamInfoPage,
        );
        this.bindButton(
            this.findByPath(this.teamInfoPage, '球队名/改名')?.getComponent(Button),
            this.beginTeamNameEdit,
        );
        this.bindButton(
            this.teamInfoPage?.getChildByName('保存并关闭')?.getComponent(Button),
            this.saveTeamIdentity,
        );

        this.bindButton(
            this.findByPath(this.settingsPage, '标题/关闭')?.getComponent(Button),
            this.closeSettingsPage,
        );
        this.bindButton(
            this.findByPath(this.settingsPage, '音乐/开关')?.getComponent(Button),
            this.toggleMusic,
        );
        this.bindButton(
            this.findByPath(this.settingsPage, '音效/开关')?.getComponent(Button),
            this.toggleSound,
        );

        this.bindButton(
            this.playerDetailsPage?.getChildByName('返回')?.getComponent(Button),
            this.closePlayerDetails,
        );
        this.bindButton(
            this.findByPath(this.playerDetailsPage, '球员知识/是')?.getComponent(Button),
            () => { void this.answerPlayerKnowledge(true); },
        );
        this.bindButton(
            this.findByPath(this.playerDetailsPage, '球员知识/否')?.getComponent(Button),
            () => { void this.answerPlayerKnowledge(false); },
        );
        this.bindButton(
            this.findByPath(this.playerDetailsPage, '球员知识/答对全部')?.getComponent(Button),
            () => { void this.unlockPlayerKnowledgeWithAd(); },
        );
        this.bindButton(
            this.findByPath(this.playerDetailsPage, '球员知识/下一题')?.getComponent(Button),
            () => { void this.showNextPlayerKnowledgeQuestion(); },
        );

        const seasonButton = this.findByPath(
            this.homeRoot,
            '底部按钮/右侧2个/赛季',
        )?.getComponentInChildren(Button);
        this.bindButton(seasonButton, this.openPreMatchPage);

        const teamButton = this.findByPath(
            this.homeRoot,
            '底部按钮/左侧2个/球队',
        )?.getComponentInChildren(Button);
        this.bindButton(teamButton, this.openTeamInfoPage);

        const recruitmentProbabilityButton = this.findByPath(
            this.homeRoot,
            '底部按钮/左侧2个/招募概率',
        )?.getComponentInChildren(Button);
        this.bindButton(
            recruitmentProbabilityButton,
            this.recruitmentProbabilityController?.openPage ?? (() => undefined),
        );

        const trainingButton = this.findByPath(
            this.homeRoot,
            '底部按钮/右侧2个/训练',
        )?.getComponentInChildren(Button);
        this.bindButton(trainingButton, this.openIdleIncomePage);

        this.rosterSlots.forEach((slot, index) => {
            this.bindButton(slot.selectButton, () => this.openPlayerDetails(index));
        });
        this.bindManagementEntrypoints();
    }

    private ensurePlayerKnowledgeButtons(): void {
        for (const name of ['是', '否', '答对全部', '下一题']) {
            const node = this.findByPath(this.playerDetailsPage, `球员知识/${name}`);
            if (node && !node.getComponent(Button)) {
                node.addComponent(Button);
            }
        }
    }

    private bindButton(
        button: Button | null | undefined,
        callback: () => void,
    ): void {
        if (!button) {
            return;
        }
        button.node.on(Button.EventType.CLICK, callback, this);
        this.boundButtons.push({ button, callback });
    }

    private openTeamInfoPage = (): void => {
        const requestVersion = ++this.teamInfoRequestVersion;
        this.cancelTeamNameEdit();
        void this.refreshTeamInfoPage().then(() => {
            if (requestVersion === this.teamInfoRequestVersion) {
                this.bringToFront(this.teamInfoPage);
                this.playTeamInfoEntrance();
            }
        });
    };

    private closeTeamInfoPage = (): void => {
        this.teamInfoRequestVersion += 1;
        this.cancelTeamNameEdit();
        if (this.teamInfoPage) {
            void exitWithFade(this.teamInfoPage).then(() => {
                this.teamInfoPage!.active = false;
            });
        }
    };

    private beginTeamNameEdit = (): void => {
        const nameLabel = this.findByPath(this.teamInfoPage, '球队名/名字')
            ?.getComponent(Label) ?? null;
        if (!nameLabel || !this.teamNameEditBox) {
            return;
        }
        this.editingTeamName = true;
        nameLabel.enabled = false;
        if (this.teamNameInputLabel) {
            this.teamNameInputLabel.enabled = true;
        }
        this.teamNameEditBox.enabled = true;
        this.teamNameEditBox.string = nameLabel.string;
        this.teamNameEditBox.focus();
    };

    private saveTeamIdentity = (): void => {
        const oldName = sys.localStorage.getItem(TEAM_NAME_STORAGE_KEY)?.trim()
            || '我的球队';
        const proposedName = this.editingTeamName && this.teamNameEditBox
            ? this.teamNameEditBox.string.trim()
            : this.findByPath(this.teamInfoPage, '球队名/名字')
                ?.getComponent(Label)
                ?.string
                .trim() ?? oldName;
        const teamName = proposedName || oldName;
        const abbreviation = getTeamAbbreviation(teamName);
        this.topTeamInfoController?.setTeamIdentity(teamName);
        if (!this.topTeamInfoController) {
            sys.localStorage.setItem(TEAM_NAME_STORAGE_KEY, teamName);
            sys.localStorage.setItem(TEAM_ABBREVIATION_STORAGE_KEY, abbreviation);
            gameStateEvents.emit(
                GAME_STATE_EVENT_TEAM_IDENTITY_CHANGED,
                teamName,
                abbreviation,
            );
        }
        this.closeTeamInfoPage();
    };

    private openSettingsPage = (): void => {
        this.teamInfoRequestVersion += 1;
        this.refreshSettingsPage();
        this.bringToFront(this.settingsPage, true);
    };

    private closeSettingsPage = (): void => {
        if (this.settingsPage) {
            void exitWithFade(this.settingsPage).then(() => {
                this.settingsPage!.active = false;
            });
        }
    };

    private toggleMusic = (): void => {
        const settings = loadGameSettings();
        settings.musicEnabled = !settings.musicEnabled;
        saveGameSettings(settings);
        gameAudio.syncSettings();
        this.refreshSettingsPage();
    };

    private toggleSound = (): void => {
        const settings = loadGameSettings();
        settings.soundEnabled = !settings.soundEnabled;
        saveGameSettings(settings);
        gameAudio.syncSettings();
        this.refreshSettingsPage();
    };

    private openPlayerDetails(index: number): void {
        const card = loadRoster(this.rosterSlots.length)[index];
        if (!card) {
            return;
        }
        void this.renderDetailedPlayerCard(this.playerDetailsPage, card);
        this.bringToFront(this.playerDetailsPage, true);
    }

    private closePlayerDetails = (): void => {
        this.cardRenderVersion += 1;
        this.knowledgeRenderVersion += 1;
        this.currentKnowledgeSourceName = null;
        if (this.playerDetailsPage) {
            void exitWithFade(this.playerDetailsPage).then(() => {
                this.playerDetailsPage!.active = false;
            });
        }
    };

    private openPreMatchPage = (): void => {
        const openPage = (): void => {
            this.closeFullScreenPages();
            void PreMatchController.instance?.openPage();
        };
        if (this.playerEventController?.runAfterPendingEvents(openPage)) {
            return;
        }
        openPage();
    };

    private openIdleIncomePage = (): void => {
        this.idleIncomeController?.openPage();
    };

    private closeFullScreenPages = (): void => {
        if (this.playerDetailsPage?.active) {
            void exitWithFade(this.playerDetailsPage).then(() => {
                this.playerDetailsPage!.active = false;
            });
        }
        PreMatchController.instance?.closePage();
        this.managementController?.closeManagement();
        this.playerEventController?.closePage();
    };

    private async refreshTeamInfoPage(): Promise<void> {
        if (!this.teamInfoPage) {
            return;
        }
        const roster = loadRoster(this.rosterSlots.length);
        const effects = await getManagementEffects();
        const teamName = sys.localStorage.getItem(TEAM_NAME_STORAGE_KEY)?.trim()
            || '我的球队';
        const teamOverall = calculateTeamOverall(
            roster,
            effects.headCoachBattleOvrBonus,
        );
        const bestPlayer = roster.reduce<PlayerCard | null>((best, card) => {
            if (!card || (best && best.overall >= card.overall)) {
                return best;
            }
            return card;
        }, null);

        this.setLabel('球队名/名字', teamName, this.teamInfoPage);
        this.setLabel(
            '球队总评/总评数值',
            this.formatOverall(teamOverall),
            this.teamInfoPage,
        );
        this.setLabel(
            '累计胜场/胜场数',
            String(loadSeasonState().officialWins),
            this.teamInfoPage,
        );
        this.setLabel(
            '最佳球员/名字',
            bestPlayer?.displayName ?? '暂无球员',
            this.teamInfoPage,
        );
        this.setLabel(
            '最佳球员/总评',
            bestPlayer ? this.formatOverall(bestPlayer.overall) : '0',
            this.teamInfoPage,
        );

        const portrait = this.findByPath(this.teamInfoPage, '最佳球员/头像')
            ?.getComponent(Sprite) ?? null;
        const frame = this.findByPath(this.teamInfoPage, '最佳球员/边框')
            ?.getComponent(Sprite) ?? null;
        if (!bestPlayer) {
            if (portrait) {
                portrait.spriteFrame = null;
            }
            if (frame) {
                frame.spriteFrame = null;
            }
            return;
        }
        const [portraitFrame, qualityFrame] = await Promise.all([
            loadPlayerPortrait(bestPlayer),
            loadThinQualityFrame(bestPlayer.qualityId),
        ]);
        if (portrait) {
            portrait.spriteFrame = portraitFrame;
        }
        if (frame && qualityFrame) {
            frame.spriteFrame = qualityFrame;
        }
    }

    private refreshSettingsPage(): void {
        const settings = loadGameSettings();
        this.setLabel(
            '音乐/开关/状态',
            settings.musicEnabled ? '开' : '关',
            this.settingsPage,
        );
        this.setLabel(
            '音效/开关/状态',
            settings.soundEnabled ? '开' : '关',
            this.settingsPage,
        );
        this.refreshSettingsToggle('音乐/开关', settings.musicEnabled);
        this.refreshSettingsToggle('音效/开关', settings.soundEnabled);
    }

    private captureSettingToggleSprites(): void {
        this.captureSettingToggleSpritesAtPath('音乐/开关');
        this.captureSettingToggleSpritesAtPath('音效/开关');
    }

    private captureSettingToggleSpritesAtPath(path: string): void {
        const button = this.findByPath(this.settingsPage, path)?.getComponent(Button) ?? null;
        if (!button || this.settingToggleSprites.has(button)) {
            return;
        }
        this.settingToggleSprites.set(button, {
            onSprite: button.normalSprite,
            offSprite: button.disabledSprite,
        });
    }

    private refreshSettingsToggle(path: string, enabled: boolean): void {
        const button = this.findByPath(this.settingsPage, path)?.getComponent(Button) ?? null;
        if (!button) {
            return;
        }
        const sprites = this.settingToggleSprites.get(button);
        const spriteFrame = enabled
            ? sprites?.onSprite
            : sprites?.offSprite ?? sprites?.onSprite;
        if (!spriteFrame) {
            return;
        }
        button.normalSprite = spriteFrame;
        button.interactable = true;
        const targetSprite = button.target?.getComponent(Sprite)
            ?? button.node.getComponent(Sprite);
        if (targetSprite) {
            targetSprite.spriteFrame = spriteFrame;
        }
    }

    private async renderDetailedPlayerCard(
        root: Node | null,
        card: PlayerCard,
        overallAnimationFrom?: number,
    ): Promise<void> {
        if (!root) {
            return;
        }
        const renderVersion = ++this.cardRenderVersion;
        const portraitRoot = root.getChildByName('球员头像');
        const portraitSprite = portraitRoot?.getChildByName('头像')
            ?.getComponent(Sprite) ?? null;
        const backgroundSprite = portraitRoot?.getChildByName('bg')?.getComponent(Sprite)
            ?? null;
        const wheatSprites = portraitRoot?.children
            .filter((child) => child.name === '麦穗')
            .map((child) => child.getComponent(Sprite))
            .filter((sprite): sprite is Sprite => Boolean(sprite)) ?? [];
        const frameSprite = portraitRoot?.getChildByName('头像框')?.getComponent(Sprite)
            ?? null;
        const nameplateSprite = portraitRoot?.getChildByName('名牌')?.getComponent(Sprite)
            ?? null;
        const qualityBadgeSprite = portraitRoot
            ?.getChildByName('品质标签')
            ?.getComponent(Sprite) ?? null;
        const positionBadgeSprite = portraitRoot?.getChildByName('位置')?.getComponent(Sprite)
            ?? null;
        const eventNode = portraitRoot?.getChildByName('事件') ?? null;
        const eventIcon = eventNode?.getComponent(Sprite) ?? null;
        const eventType = card.pendingEvent?.type
            ?? (card.activeInjury
                ? 'injury'
                : card.activeTraining
                    ? 'training'
                    : null);
        if (eventNode) {
            eventNode.active = eventType !== null;
        }
        if (eventIcon) {
            eventIcon.spriteFrame = null;
        }

        this.setLabel('球员头像/名牌/名字', card.displayName, root);
        this.setLabel('球员头像/品质标签/品质', card.qualityName, root);
        this.setLabel('球员头像/位置/位置', card.position, root);
        const roster = loadRoster(this.rosterSlots.length);
        this.setLabel(
            '累计获得次数/累计获得次数数值',
            String(Math.max(1, getPlayerAcquisitionCount(card.displayName))),
            root,
        );
        this.setLabel(
            '效力时长/累计效力时长数值',
            this.formatPlayerServiceDuration(
                getPlayerServiceDurationMs(card.displayName, roster),
            ),
            root,
        );
        const overallRoot = root.getChildByName('总评') ?? null;
        const overallLabel = overallRoot?.getChildByName('数值')
            ?.getComponent(Label) ?? null;
        const eventOverallTrend: OverallTrend = card.activeInjury
            ? 'injury'
            : card.activeTraining || card.pendingEvent?.type === 'training'
                ? 'training'
                : null;
        const overallTrend: OverallTrend = overallAnimationFrom !== undefined
            && card.overall > overallAnimationFrom
            ? 'training'
            : eventOverallTrend;
        this.animateDetailedOverall(
            overallLabel,
            card,
            overallTrend,
            overallAnimationFrom,
        );
        applyOverallNumberQuality(
            overallLabel,
            card.qualityId,
        );
        applyOverallTrendArrow(overallRoot, overallTrend);
        this.currentKnowledgeSourceName = card.sourcePlayerName;
        void this.renderPlayerKnowledge(root, card);

        const [
            portrait,
            background,
            wheat,
            frame,
            nameplate,
            qualityBadge,
            positionBadge,
            eventSpriteFrame,
        ] = await Promise.all([
            loadPlayerPortrait(card),
            loadRecruitmentBackground(card.qualityId),
            loadQualityWheat(card.qualityId),
            loadQualityFrame(card.qualityId),
            loadQualityNameplate(card.qualityId),
            loadQualityBadge(card.qualityId),
            loadQualityPosition(card.qualityId),
            eventType ? loadPlayerEventIcon(eventType) : Promise.resolve(null),
        ]);
        if (renderVersion !== this.cardRenderVersion) {
            return;
        }
        // 仅在加载成功时覆盖 spriteFrame，避免 null 把默认头像清掉
        if (portraitSprite && portrait) {
            portraitSprite.spriteFrame = portrait;
        }
        if (backgroundSprite && background) {
            backgroundSprite.spriteFrame = background;
        }
        if (wheat) {
            wheatSprites.forEach((sprite) => {
                sprite.spriteFrame = wheat;
            });
        }
        if (frameSprite && frame) {
            frameSprite.spriteFrame = frame;
        }
        if (nameplateSprite && nameplate) {
            nameplateSprite.spriteFrame = nameplate;
        }
        if (qualityBadgeSprite && qualityBadge) {
            qualityBadgeSprite.spriteFrame = qualityBadge;
        }
        if (positionBadgeSprite && positionBadge) {
            positionBadgeSprite.spriteFrame = positionBadge;
        }
        if (eventIcon && eventSpriteFrame) {
            eventIcon.spriteFrame = eventSpriteFrame;
        }
        applyPlayerQualityVisuals(portraitRoot ?? null, card.qualityId);
    }

    private animateDetailedOverall(
        label: Label | null,
        card: PlayerCard,
        trend: OverallTrend,
        fromOverall?: number,
    ): void {
        const target = card.overall;
        if (fromOverall !== undefined && target > fromOverall) {
            setGrowingNumber(
                label,
                target,
                (value) => this.formatOverall(Math.floor(value)),
                {
                    from: fromOverall,
                    duration: 1.5,
                    colorFrom: getOverallDefaultColor(label),
                    colorTo: getOverallTrendColor('training'),
                },
            );
            return;
        }
        const penalty = card.activeInjury?.overallPenalty ?? 0;
        const bonus = card.activeTraining?.overallBonus ?? 0;
        if (penalty <= 0 && bonus <= 0) {
            if (label) {
                label.string = this.formatOverall(target);
                label.color = trend
                    ? getOverallTrendColor(trend)
                    : getOverallDefaultColor(label);
            }
            return;
        }
        setGrowingNumber(
            label,
            target,
            (value) => this.formatOverall(Math.floor(value)),
            {
                from: penalty > 0
                    ? target + penalty
                    : Math.max(1, target - bonus),
                duration: 1.5,
                animateDecrease: penalty > 0,
                colorFrom: getOverallDefaultColor(label),
                colorTo: getOverallTrendColor(
                    penalty > 0 ? 'injury' : 'training',
                ),
            },
        );
    }

    private prepareTeamNameEditor(): void {
        const nameLabel = this.findByPath(this.teamInfoPage, '球队名/名字')
            ?.getComponent(Label) ?? null;
        if (!nameLabel) {
            return;
        }
        const inputLabelNode = new Node('球队名输入文本');
        nameLabel.node.addChild(inputLabelNode);
        const sourceTransform = nameLabel.node.getComponent(UITransform);
        const inputTransform = inputLabelNode.addComponent(UITransform);
        if (sourceTransform) {
            inputTransform.setContentSize(sourceTransform.contentSize);
            inputTransform.setAnchorPoint(sourceTransform.anchorPoint);
        }
        const inputLabel = inputLabelNode.addComponent(Label);
        inputLabel.font = nameLabel.font;
        inputLabel.fontSize = nameLabel.fontSize;
        inputLabel.lineHeight = nameLabel.lineHeight;
        inputLabel.color = nameLabel.color;
        inputLabel.horizontalAlign = nameLabel.horizontalAlign;
        inputLabel.verticalAlign = nameLabel.verticalAlign;
        inputLabel.overflow = nameLabel.overflow;
        inputLabel.enableWrapText = false;
        inputLabel.enabled = false;

        this.teamNameDisplayLabel = nameLabel;
        this.teamNameInputLabel = inputLabel;
        this.teamNameEditBox = nameLabel.getComponent(EditBox)
            ?? nameLabel.addComponent(EditBox);
        this.teamNameEditBox.textLabel = inputLabel;
        this.teamNameEditBox.maxLength = 12;
        this.teamNameEditBox.string = nameLabel.string;
        this.teamNameEditBox.enabled = false;
    }

    private applyHomepageFont(): void {
        if (!this.canvas) {
            return;
        }
        resources.load('fonts/zpix', Font, (error, font) => {
            if (error || !font || !this.canvas?.isValid) {
                console.error('[HomeUiController] Failed to apply zpix font.', error);
                return;
            }
            applyGameFont(this.canvas, font);
            this.scheduleOnce(() => {
                if (this.canvas?.isValid) {
                    applyGameFont(this.canvas, font);
                }
            }, 0);
        });
    }

    private cancelTeamNameEdit(): void {
        this.editingTeamName = false;
        if (this.teamNameEditBox) {
            this.teamNameEditBox.blur();
            this.teamNameEditBox.enabled = false;
        }
        if (this.teamNameInputLabel) {
            this.teamNameInputLabel.enabled = false;
        }
        if (this.teamNameDisplayLabel) {
            this.teamNameDisplayLabel.enabled = true;
        }
        const teamName = sys.localStorage.getItem(TEAM_NAME_STORAGE_KEY)?.trim()
            || '我的球队';
        this.setLabel('球队名/名字', teamName, this.teamInfoPage);
    }

    private async renderPlayerKnowledge(root: Node, card: PlayerCard): Promise<void> {
        const renderVersion = ++this.knowledgeRenderVersion;
        const knowledgeRoot = root.getChildByName('球员知识');
        const titleLabel = knowledgeRoot?.getChildByName('题目')?.getComponent(Label) ?? null;
        const questionLabel = knowledgeRoot?.getChildByName('问题')?.getComponent(Label) ?? null;
        const yesButton = knowledgeRoot?.getChildByName('是')?.getComponent(Button) ?? null;
        const noButton = knowledgeRoot?.getChildByName('否')?.getComponent(Button) ?? null;
        const answerAllButton = knowledgeRoot?.getChildByName('答对全部')?.getComponent(Button) ?? null;
        const nextButton = knowledgeRoot?.getChildByName('下一题')?.getComponent(Button) ?? null;
        if (!knowledgeRoot || !titleLabel || !questionLabel || !yesButton || !noButton) {
            return;
        }

        try {
            const config = await loadPlayerKnowledgeConfig();
            if (
                renderVersion !== this.knowledgeRenderVersion
                || this.currentKnowledgeSourceName !== card.sourcePlayerName
            ) {
                return;
            }
            const entry = config.players[card.sourcePlayerName];
            if (!entry || entry.questions.length === 0) {
                titleLabel.string = '球员知识';
                this.setPlayerKnowledgeQuestionText(
                    questionLabel,
                    '该球员的资料正在整理中。',
                );
                yesButton.node.active = false;
                noButton.node.active = false;
                if (answerAllButton) answerAllButton.node.active = false;
                if (nextButton) nextButton.node.active = false;
                return;
            }

            const progress = getPlayerKnowledgeProgress(card.sourcePlayerName);
            const completedCount = entry.questions.filter((question) => (
                hasAnsweredPlayerKnowledgeQuestion(progress, question.id)
            )).length;
            if (completedCount >= entry.questions.length) {
                titleLabel.string = '球员荣誉';
                this.setPlayerKnowledgeQuestionText(
                    questionLabel,
                    formatPlayerProfile(entry.profile),
                );
                yesButton.node.active = false;
                noButton.node.active = false;
                if (answerAllButton) answerAllButton.node.active = false;
                if (nextButton) nextButton.node.active = false;
                return;
            }

            const index = progress.currentQuestionIndex % entry.questions.length;
            const question = entry.questions[index];
            titleLabel.string = `球员知识 ${index + 1}/${entry.questions.length}`;
            const alreadyCorrect = progress.correctQuestionIds.includes(question.id);
            const answeredWrong = progress.wrongQuestionIds.includes(question.id);
            const correctButton = question.answer ? yesButton : noButton;
            const wrongButton = question.answer ? noButton : yesButton;
            yesButton.node.active = true;
            noButton.node.active = true;

            if (alreadyCorrect) {
                const rewardedOverall = progress.rewardOverallByQuestionId[question.id]
                    ?? question.rewardOverall;
                this.setPlayerKnowledgeQuestionText(
                    questionLabel,
                    `答对了！${card.displayName} 总评永久提升 ${rewardedOverall}。`,
                );
                this.setKnowledgeAnswerButtonState(correctButton, false, false);
                this.setKnowledgeAnswerButtonState(wrongButton, false, true);
                if (answerAllButton) answerAllButton.node.active = false;
                if (nextButton) {
                    nextButton.node.active = true;
                    this.setKnowledgeAnswerButtonState(nextButton, true, false);
                }
                return;
            }

            if (answeredWrong) {
                this.setPlayerKnowledgeQuestionText(
                    questionLabel,
                    formatPlayerKnowledgeText(question.text, card.displayName),
                    `可惜了，正确答案是：${question.answer ? '是' : '否'}`,
                );
                this.setKnowledgeAnswerButtonState(correctButton, false, false);
                this.setKnowledgeAnswerButtonState(wrongButton, false, true);
                if (answerAllButton) answerAllButton.node.active = false;
                if (nextButton) {
                    nextButton.node.active = true;
                    this.setKnowledgeAnswerButtonState(nextButton, true, false);
                }
                return;
            }

            this.setPlayerKnowledgeQuestionText(
                questionLabel,
                formatPlayerKnowledgeText(question.text, card.displayName),
            );
            this.setKnowledgeAnswerButtonState(correctButton, true, false);
            this.setKnowledgeAnswerButtonState(
                wrongButton,
                !progress.answerAllUnlocked,
                progress.answerAllUnlocked,
            );
            if (answerAllButton) {
                answerAllButton.node.active = !progress.answerAllUnlocked;
                if (!progress.answerAllUnlocked) {
                    this.setKnowledgeAnswerButtonState(answerAllButton, true, false);
                }
            }
            if (nextButton) {
                nextButton.node.active = progress.answerAllUnlocked;
                if (progress.answerAllUnlocked) {
                    this.setKnowledgeAnswerButtonState(nextButton, false, true);
                }
            }
        } catch (error) {
            console.error('[HomeUiController] Failed to load player knowledge.', error);
            titleLabel.string = '球员知识';
            this.setPlayerKnowledgeQuestionText(
                questionLabel,
                '资料加载失败，请稍后重试。',
            );
        }
    }

    private async answerPlayerKnowledge(answer: boolean): Promise<void> {
        const card = this.getCurrentKnowledgeCard();
        if (!card || !this.playerDetailsPage) {
            return;
        }
        const config = await loadPlayerKnowledgeConfig();
        const entry = config.players[card.sourcePlayerName];
        if (!entry || entry.questions.length === 0) {
            return;
        }
        const progress = getPlayerKnowledgeProgress(card.sourcePlayerName);
        const question = entry.questions[progress.currentQuestionIndex % entry.questions.length];
        const correct = answer === question.answer;
        const newlyCorrect = recordPlayerKnowledgeAnswer(
            card.sourcePlayerName,
            question.id,
            correct,
        );
        let overallAnimationFrom: number | undefined;
        if (newlyCorrect) {
            const rewardOverall = calculatePlayerKnowledgeReward(card.overall);
            recordPlayerKnowledgeReward(
                card.sourcePlayerName,
                question.id,
                rewardOverall,
            );
            const rewardedCard = addPermanentOverallForPlayerKnowledge(
                card.sourcePlayerName,
                rewardOverall,
            );
            if (rewardedCard && rewardedCard.overall > card.overall) {
                overallAnimationFrom = card.overall;
            }
        }
        const latestCard = this.getCurrentKnowledgeCard() ?? card;
        await this.renderDetailedPlayerCard(
            this.playerDetailsPage,
            latestCard,
            overallAnimationFrom,
        );
    }

    private setPlayerKnowledgeQuestionText(
        label: Label,
        question: string,
        highlightedSuffix?: string,
    ): void {
        const transform = label.node.getComponent(UITransform);
        let richText = label.node.getComponent(RichText);
        let fixedWidth = this.playerKnowledgeQuestionWidths.get(label.node);
        if (fixedWidth === undefined && transform) {
            fixedWidth = transform.width;
            this.playerKnowledgeQuestionWidths.set(label.node, fixedWidth);
        }
        if (!highlightedSuffix) {
            if (richText) {
                richText.enabled = false;
            }
            label.enabled = true;
            label.string = question;
            if (transform && fixedWidth !== undefined) {
                transform.setContentSize(fixedWidth, transform.height);
            }
            return;
        }
        if (!richText) {
            richText = label.node.addComponent(RichText);
            richText.fontSize = label.fontSize;
            richText.lineHeight = label.lineHeight;
            richText.horizontalAlign = label.horizontalAlign;
            richText.verticalAlign = label.verticalAlign;
            richText.useSystemFont = label.useSystemFont;
            richText.fontFamily = label.fontFamily;
            richText.font = label.font;
            richText.handleTouchEvent = false;
        }
        richText.maxWidth = fixedWidth ?? 0;
        const baseColor = `#${[label.color.r, label.color.g, label.color.b]
            .map((value) => value.toString(16).padStart(2, '0'))
            .join('')}`;
        const escapeRichText = (value: string): string => value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        label.enabled = false;
        richText.enabled = true;
        richText.string = `<color=${baseColor}><b>${escapeRichText(question)}</b></color>\n<color=#FFD15A><b>${escapeRichText(highlightedSuffix)}</b></color>`;
        if (transform && fixedWidth !== undefined) {
            transform.setContentSize(fixedWidth, transform.height);
        }
    }

    private async unlockPlayerKnowledgeWithAd(): Promise<void> {
        const card = this.getCurrentKnowledgeCard();
        if (!card || !this.playerDetailsPage) {
            return;
        }
        const answerAllButton = this.findByPath(
            this.playerDetailsPage,
            '球员知识/答对全部',
        )?.getComponent(Button) ?? null;
        if (answerAllButton) {
            answerAllButton.interactable = false;
        }
        const completed = await showRewardedVideo();
        if (completed) {
            unlockPlayerKnowledgeAnswers(card.sourcePlayerName);
        }
        const latestCard = this.getCurrentKnowledgeCard() ?? card;
        await this.renderDetailedPlayerCard(this.playerDetailsPage, latestCard);
    }

    private async showNextPlayerKnowledgeQuestion(): Promise<void> {
        const card = this.getCurrentKnowledgeCard();
        if (!card || !this.playerDetailsPage) {
            return;
        }
        const config = await loadPlayerKnowledgeConfig();
        const entry = config.players[card.sourcePlayerName];
        if (!entry) {
            return;
        }
        const progress = getPlayerKnowledgeProgress(card.sourcePlayerName);
        const currentQuestion = entry.questions[
            progress.currentQuestionIndex % entry.questions.length
        ];
        if (
            !currentQuestion
            || !hasAnsweredPlayerKnowledgeQuestion(progress, currentQuestion.id)
        ) {
            await this.renderDetailedPlayerCard(this.playerDetailsPage, card);
            return;
        }
        advancePlayerKnowledgeQuestion(card.sourcePlayerName, entry.questions);
        await this.renderDetailedPlayerCard(this.playerDetailsPage, card);
    }

    private getCurrentKnowledgeCard(): PlayerCard | null {
        if (!this.currentKnowledgeSourceName) {
            return null;
        }
        return loadRoster(this.rosterSlots.length).find((card) => (
            card?.sourcePlayerName === this.currentKnowledgeSourceName
        )) ?? null;
    }

    private async refreshVisibleRosterSlots(): Promise<void> {
        const roster = loadRoster(this.rosterSlots.length);
        await Promise.all(this.rosterSlots.map(async (slot, index) => {
            const card = roster[index];
            if (!card) {
                slot.clear();
                return;
            }
            slot.setup(card.overall, card.qualityId, await loadPlayerPortrait(card));
        }));
        this.topTeamInfoController?.refreshOverallFromRoster();
    }

    private onRosterChanged(): void {
        void this.refreshVisibleRosterSlots();
        if (this.teamInfoPage?.active) {
            void this.refreshTeamInfoPage();
        }
        if (this.playerDetailsPage?.active && this.currentKnowledgeSourceName) {
            const card = loadRoster(this.rosterSlots.length).find((candidate) => (
                candidate?.sourcePlayerName === this.currentKnowledgeSourceName
            ));
            if (card) {
                void this.renderDetailedPlayerCard(this.playerDetailsPage, card);
            }
        }
    }

    private onTeamIdentityChanged(): void {
        if (this.teamInfoPage?.active) {
            void this.refreshTeamInfoPage();
        }
    }

    private onManagementChanged(): void {
        this.refreshManagementSlotLevels();
        if (this.teamInfoPage?.active) {
            void this.refreshTeamInfoPage();
        }
    }

    private bindManagementEntrypoints(): void {
        const root = this.findByPath(this.homeRoot, '球队/管理层');
        if (!root) {
            return;
        }
        const bindings: Array<[string, ManagementRole]> = [
            ['运营', 'operationPresident'],
            ['教练', 'headCoach'],
            ['球探', 'scoutingDirector'],
            ['队医', 'medicalTeam'],
            ['管理层-长方', 'mediaTeam'],
        ];
        for (const [nodeName, role] of bindings) {
            const slotRoot = this.findDescendantByName(root, nodeName);
            const slot = slotRoot?.getComponent(ManagerSlotView)
                ?? slotRoot?.getComponentInChildren(ManagerSlotView)
                ?? slotRoot?.addComponent(ManagerSlotView)
                ?? null;
            const button = slot?.resolveOpenButton()
                ?? slotRoot?.getChildByName('bg')?.getComponent(Button)
                ?? slotRoot?.getChildByName('背景')?.getComponent(Button)
                ?? slotRoot?.getComponent(Button)
                ?? slotRoot?.getComponentInChildren(Button)
                ?? null;
            this.bindButton(button, () => {
                this.closeFullScreenPages();
                this.managementController?.openManagement(role);
            });
        }
        this.refreshManagementSlotLevels();
    }

    private refreshManagementSlotLevels(): void {
        const root = this.findByPath(this.homeRoot, '球队/管理层');
        if (!root) {
            return;
        }
        const levels = loadManagementLevels();
        const bindings: Array<[string, ManagementRole]> = [
            ['运营', 'operationPresident'],
            ['教练', 'headCoach'],
            ['球探', 'scoutingDirector'],
            ['队医', 'medicalTeam'],
            ['管理层-长方', 'mediaTeam'],
        ];
        for (const [nodeName, role] of bindings) {
            const slotRoot = this.findDescendantByName(root, nodeName);
            const slot = slotRoot?.getComponent(ManagerSlotView)
                ?? slotRoot?.getComponentInChildren(ManagerSlotView)
                ?? null;
            if (slot) {
                slot.setup(`Lv.${levels[role]}`);
                continue;
            }
            const levelLabel = slotRoot?.getChildByName('等级')?.getComponent(Label)
                ?? slotRoot?.getChildByName('LevelText')?.getComponent(Label)
                ?? null;
            if (levelLabel) {
                levelLabel.string = `Lv.${levels[role]}`;
            }
        }
    }

    private playTeamInfoEntrance(): void {
        if (!this.teamInfoPage) {
            return;
        }
        void playFullScreenEntrance(this.teamInfoPage, {
            backgroundNodes: [
                this.teamInfoPage.getChildByName('遮罩'),
                this.teamInfoPage.getChildByName('bg'),
                this.teamInfoPage.getChildByName('内容背景'),
            ].filter((node): node is Node => Boolean(node)),
            moduleGroups: [
                {
                    nodes: [
                        this.teamInfoPage.getChildByName('球队信息'),
                        this.teamInfoPage.getChildByName('关闭'),
                    ].filter((node): node is Node => Boolean(node)),
                    order: 0,
                },
                { nodes: this.namedChildren(this.teamInfoPage, ['球队名']), order: 1 },
                { nodes: this.namedChildren(this.teamInfoPage, ['球队总评']), order: 2 },
                { nodes: this.namedChildren(this.teamInfoPage, ['最佳球员']), order: 3 },
                { nodes: this.namedChildren(this.teamInfoPage, ['累计胜场']), order: 4 },
                { nodes: this.namedChildren(this.teamInfoPage, ['保存并关闭']), order: 5 },
            ],
        });
    }

    private prepareAllButtonVisuals(root: Node): void {
        for (const button of root.getComponents(Button)) {
            const targetSprite = button.target?.getComponent(Sprite)
                ?? button.node.getComponent(Sprite);
            button.hoverSprite = null;
            if (button !== this.recruitButtonWithPressedSprite) {
                button.pressedSprite = null;
            }
            button.disabledSprite = null;
            if (
                !button.interactable
                && button.transition === Button.Transition.SPRITE
                && button.normalSprite
                && targetSprite
            ) {
                targetSprite.spriteFrame = button.normalSprite;
            }
            this.buttonVisualBindings.push({
                button,
                sprite: targetSprite,
                originalGrayscale: targetSprite?.grayscale ?? false,
                lastInteractable: null,
            });
        }
        for (const child of root.children) {
            this.prepareAllButtonVisuals(child);
        }
    }

    private syncDisabledButtonVisuals(force: boolean): void {
        for (const binding of this.buttonVisualBindings) {
            if (!binding.button.isValid) {
                continue;
            }
            const interactable = binding.button.interactable;
            if (!force && binding.lastInteractable === interactable) {
                continue;
            }
            binding.lastInteractable = interactable;
            if (binding.sprite?.isValid) {
                const grayscaleOverride = this.buttonGrayscaleOverrides.get(binding.button);
                binding.sprite.grayscale = grayscaleOverride
                    ?? (interactable ? binding.originalGrayscale : true);
            }
        }
    }

    private setKnowledgeAnswerButtonState(
        button: Button,
        interactable: boolean,
        grayscale: boolean,
    ): void {
        button.interactable = interactable;
        this.buttonGrayscaleOverrides.set(button, grayscale);
        const binding = this.buttonVisualBindings.find((candidate) => (
            candidate.button === button
        ));
        const sprite = binding?.sprite
            ?? button.target?.getComponent(Sprite)
            ?? button.node.getComponent(Sprite);
        if (sprite?.isValid) {
            sprite.grayscale = grayscale;
        }
        if (binding) {
            binding.lastInteractable = interactable;
        }
    }

    private bringToFront(page: Node | null, animateEntrance = false): void {
        if (!page) {
            return;
        }
        const parent = page.parent;
        if (parent) {
            page.setSiblingIndex(parent.children.length - 1);
        }
        if (animateEntrance) {
            void playFullScreenEntrance(page);
        } else {
            page.active = true;
        }
    }

    private setLabel(path: string, value: string, root: Node | null): void {
        const label = this.findByPath(root, path)?.getComponent(Label);
        if (label) {
            label.string = value;
        }
    }

    private formatOverall(value: number): string {
        return value >= INT32_MAX ? 'MAX' : formatPlayerOverall(value);
    }

    private formatPlayerServiceDuration(durationMs: number): string {
        const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours}H-${minutes}M-${seconds}S`;
    }

    private resolveSceneReferences(): void {
        this.canvas = this.node.parent;
        this.homeRoot = this.canvas?.getChildByName('主页') ?? null;
        this.teamInfoPage = this.canvas?.getChildByName('球队信息弹窗') ?? null;
        this.settingsPage = this.canvas?.getChildByName('设置弹窗') ?? null;
        this.playerDetailsPage = this.canvas?.getChildByName('球员详情页面') ?? null;
        this.managementPage = this.canvas?.getChildByName('管理层页面') ?? null;
        this.idleIncomeController = this.node.getComponent(IdleIncomeController);
        this.topTeamInfoController = this.homeRoot
            ?.getComponentInChildren(TopTeamInfoController) ?? null;

        const rosterRoot = this.findByPath(this.homeRoot, '球队/阵容槽位');
        this.rosterSlots = rosterRoot
            ? rosterRoot.children
                .map((child) => child.getComponent(RosterSlotView))
                .filter((slot): slot is RosterSlotView => Boolean(slot))
                .sort((a, b) => a.node.name.localeCompare(
                    b.node.name,
                    'zh-CN',
                    { numeric: true },
                ))
            : [];
    }

    private namedChildren(root: Node, names: readonly string[]): Node[] {
        return names.flatMap((name) => {
            const node = root.getChildByName(name);
            return node ? [node] : [];
        });
    }

    private findDescendantByName(root: Node, name: string): Node | null {
        if (root.name === name) {
            return root;
        }
        for (const child of root.children) {
            const result = this.findDescendantByName(child, name);
            if (result) {
                return result;
            }
        }
        return null;
    }

    private findByPath(root: Node | null, path: string): Node | null {
        let current = root;
        for (const segment of path.split('/')) {
            current = current?.getChildByName(segment) ?? null;
            if (!current) {
                return null;
            }
        }
        return current;
    }
}
