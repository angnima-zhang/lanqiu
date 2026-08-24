import {
    _decorator,
    Button,
    Color,
    Component,
    Label,
    Node,
    Sprite,
} from 'cc';
import {
    GAME_STATE_EVENT_MANAGEMENT_CHANGED,
    GAME_STATE_EVENT_RECRUITMENT_PROTECTION_CHANGED,
    GAME_STATE_EVENT_SEASON_CHANGED,
    addLowestRecruitmentQualityProtection,
    gameStateEvents,
    getLowestRecruitmentQualityProtectionCount,
    getManagementEffects,
    loadJson,
    loadManagementLevels,
    loadSeasonState,
} from './GameState';
import { playFullScreenEntrance, stopFullScreenEntrance } from './FullScreenEntrance';
import { playFullScreenExit as exitWithFade } from './FullScreenEntrance';
import { loadThinQualityFrame } from './PlayerAssets';
import { getQualityFrameIndex } from './RosterSlotView';
import {
    RecruitmentProbabilityConfig,
    ResolvedRecruitmentWindow,
    resolveRecruitmentQualityWeights,
    resolveRecruitmentWindow,
} from './RecruitmentProgression';
import { showRewardedVideo } from './RewardedAdService';
import {
    getStoredMarketValueLevel,
    TEAM_PROGRESSION_EVENT_MARKET_VALUE_CHANGED,
    TeamLevelController,
    teamProgressionEvents,
} from './TeamLevelController';

const { ccclass } = _decorator;

const CONFIG_PATH = 'data/balance/recruitment_probability';
const DISPLAY_ROW_COUNT = 5;
const PERCENT_BASIS_POINTS = 10_000;

interface DisplayQuality {
    qualityId: number;
    qualityName: string;
    baseWeight: number;
    finalWeight: number;
}

interface ProbabilityRowView {
    root: Node;
    frame: Sprite | null;
    qualityLabel: Label | null;
    probabilityLabel: Label | null;
}

@ccclass('RecruitmentProbabilityController')
export class RecruitmentProbabilityController extends Component {
    private page: Node | null = null;
    private closeButton: Button | null = null;
    private upgradeButton: Button | null = null;
    private rows: ProbabilityRowView[] = [];
    private configPromise: Promise<RecruitmentProbabilityConfig> | null = null;
    private renderVersion = 0;
    private upgradeAdProcessing = false;

    protected onLoad(): void {
        this.resolveHierarchy();
        if (!this.page) {
            console.error('[RecruitmentProbabilityController] 招募概率弹窗不存在。');
            return;
        }
        this.page.active = false;
    }

    protected onEnable(): void {
        this.resolveHierarchy();
        this.closeButton?.node.on(Button.EventType.CLICK, this.closePage, this);
        this.upgradeButton?.node.on(
            Button.EventType.CLICK,
            this.activateLowestQualityProtection,
            this,
        );
        gameStateEvents.on(
            GAME_STATE_EVENT_MANAGEMENT_CHANGED,
            this.refreshIfVisible,
            this,
        );
        gameStateEvents.on(
            GAME_STATE_EVENT_SEASON_CHANGED,
            this.refreshIfVisible,
            this,
        );
        gameStateEvents.on(
            GAME_STATE_EVENT_RECRUITMENT_PROTECTION_CHANGED,
            this.refreshIfVisible,
            this,
        );
        teamProgressionEvents.on(
            TEAM_PROGRESSION_EVENT_MARKET_VALUE_CHANGED,
            this.refreshIfVisible,
            this,
        );
    }

    protected onDisable(): void {
        this.closeButton?.node.off(Button.EventType.CLICK, this.closePage, this);
        this.upgradeButton?.node.off(
            Button.EventType.CLICK,
            this.activateLowestQualityProtection,
            this,
        );
        gameStateEvents.off(
            GAME_STATE_EVENT_MANAGEMENT_CHANGED,
            this.refreshIfVisible,
            this,
        );
        gameStateEvents.off(
            GAME_STATE_EVENT_SEASON_CHANGED,
            this.refreshIfVisible,
            this,
        );
        gameStateEvents.off(
            GAME_STATE_EVENT_RECRUITMENT_PROTECTION_CHANGED,
            this.refreshIfVisible,
            this,
        );
        teamProgressionEvents.off(
            TEAM_PROGRESSION_EVENT_MARKET_VALUE_CHANGED,
            this.refreshIfVisible,
            this,
        );
    }

    public openPage = (): void => {
        this.resolveHierarchy();
        if (!this.page) {
            return;
        }

        this.bringToFront(this.page);
        const requestVersion = ++this.renderVersion;
        void this.refreshPage(requestVersion);
        void playFullScreenEntrance(this.page, {
            backgroundNodes: this.namedChildren(this.page, ['遮罩', 'bg']),
            moduleGroups: [
                {
                    nodes: this.namedChildren(this.page, ['球队信息', '关闭']),
                    order: 0,
                },
                ...this.rows.map((row, index) => ({
                    nodes: [row.root],
                    order: index + 1,
                })),
                { nodes: this.namedChildren(this.page, ['球探加成']), order: 6 },
                { nodes: this.upgradeButton ? [this.upgradeButton.node] : [], order: 7 },
            ],
        });
    };

    public closePage = (): void => {
        this.renderVersion += 1;
        if (!this.page) {
            return;
        }
        void exitWithFade(this.page).then(() => {
            this.page!.active = false;
        });
    };

    private activateLowestQualityProtection = (): void => {
        if (this.upgradeAdProcessing) {
            return;
        }
        this.upgradeAdProcessing = true;
        if (this.upgradeButton) {
            this.upgradeButton.interactable = false;
        }
        void showRewardedVideo().then((completed) => {
            if (completed) {
                addLowestRecruitmentQualityProtection();
            }
        }).catch((error) => {
            console.error('[RecruitmentProbabilityController] 低档保护广告播放失败。', error);
        }).finally(() => {
            this.upgradeAdProcessing = false;
            this.refreshIfVisible();
        });
    };

    private refreshIfVisible = (): void => {
        if (!this.page?.active) {
            return;
        }
        void this.refreshPage(++this.renderVersion);
    };

    private async refreshPage(requestVersion: number): Promise<void> {
        try {
            const [config, effects] = await Promise.all([
                this.loadConfig(),
                getManagementEffects(),
            ]);
            if (requestVersion !== this.renderVersion || !this.page?.active) {
                return;
            }

            const marketValueLevel = TeamLevelController.instance
                ?.getSnapshot()?.marketValueLevel
                ?? getStoredMarketValueLevel();
            const levelConfig = resolveRecruitmentWindow(
                config,
                marketValueLevel,
                loadSeasonState(),
            );
            if (!levelConfig) {
                throw new Error(`缺少球队等级 ${marketValueLevel} 的招募配置。`);
            }

            const qualities = this.buildDisplayQualities(
                config,
                levelConfig,
                effects.scoutingDirectorHighestQualityWeightBonus,
                getLowestRecruitmentQualityProtectionCount(),
            );
            const displayedPercentages = this.toPercentBasisPoints(
                qualities.map((quality) => quality.finalWeight),
            );
            const scoutLevel = loadManagementLevels().scoutingDirector;
            const baseTotal = qualities.reduce(
                (sum, quality) => sum + quality.baseWeight,
                0,
            );
            const finalTotal = qualities.reduce(
                (sum, quality) => sum + quality.finalWeight,
                0,
            );
            const highest = qualities[qualities.length - 1];
            const baseHighestProbability = highest && baseTotal > 0
                ? highest.baseWeight / baseTotal * 100
                : 0;
            const finalHighestProbability = highest && finalTotal > 0
                ? highest.finalWeight / finalTotal * 100
                : 0;

            this.setLabel('球探加成/球探等级', `球探 Lv.${scoutLevel}`);
            this.setLabel(
                '球探加成/概率加成',
                `最高品质概率 +${Math.max(
                    0,
                    finalHighestProbability - baseHighestProbability,
                ).toFixed(2)}%`,
            );
            if (this.upgradeButton) {
                this.upgradeButton.interactable = !this.upgradeAdProcessing;
            }

            await Promise.all(this.rows.map(async (row, index) => {
                const quality = qualities[index];
                row.root.active = Boolean(quality);
                if (!quality) {
                    return;
                }

                const color = this.getQualityColor(quality.qualityId);
                if (row.qualityLabel) {
                    row.qualityLabel.string = quality.qualityName;
                    row.qualityLabel.color = color;
                }
                if (row.probabilityLabel) {
                    row.probabilityLabel.string = `${(
                        (displayedPercentages[index] ?? 0) / 100
                    ).toFixed(2)}%`;
                    row.probabilityLabel.color = color;
                }
                const spriteFrame = await loadThinQualityFrame(quality.qualityId);
                if (
                    requestVersion === this.renderVersion
                    && this.page?.active
                    && spriteFrame
                    && row.frame
                ) {
                    row.frame.spriteFrame = spriteFrame;
                }
            }));
        } catch (error) {
            console.error('[RecruitmentProbabilityController] 刷新招募概率失败。', error);
        }
    }

    private buildDisplayQualities(
        config: RecruitmentProbabilityConfig,
        levelConfig: ResolvedRecruitmentWindow,
        scoutBonus: number,
        lowestQualityProtectionCount: number,
    ): DisplayQuality[] {
        const finalWeights = resolveRecruitmentQualityWeights(
            config,
            levelConfig,
            scoutBonus,
            lowestQualityProtectionCount,
        );
        const recruitableIds = new Set(levelConfig.recruitableQualityIds);
        const rows = config.qualities.flatMap((quality, index) => {
            const baseWeight = Math.max(0, Number(levelConfig.baseWeights[index]) || 0);
            if (baseWeight <= 0 || (recruitableIds && !recruitableIds.has(quality.qualityId))) {
                return [];
            }
            return [{
                qualityId: quality.qualityId,
                qualityName: quality.qualityName,
                baseWeight,
                finalWeight: Math.max(0, finalWeights[index] ?? 0),
            }];
        });
        return rows.slice(0, DISPLAY_ROW_COUNT);
    }

    private toPercentBasisPoints(weights: readonly number[]): number[] {
        const total = weights.reduce((sum, weight) => sum + Math.max(0, weight), 0);
        if (total <= 0) {
            return weights.map(() => 0);
        }

        const rawValues = weights.map(
            (weight) => Math.max(0, weight) / total * PERCENT_BASIS_POINTS,
        );
        const result = rawValues.map(Math.floor);
        let remainder = PERCENT_BASIS_POINTS - result.reduce((sum, value) => sum + value, 0);
        const indexes = rawValues
            .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
            .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
        for (let index = 0; index < remainder; index += 1) {
            result[indexes[index % indexes.length].index] += 1;
        }
        return result;
    }

    private loadConfig(): Promise<RecruitmentProbabilityConfig> {
        this.configPromise ??= loadJson<RecruitmentProbabilityConfig>(CONFIG_PATH);
        return this.configPromise;
    }

    private resolveHierarchy(): void {
        const canvas = this.node.parent;
        this.page = canvas?.getChildByName('招募概率弹窗')
            ?? canvas?.getChildByName('招募概率')
            ?? null;
        this.closeButton = this.page?.getChildByName('关闭')?.getComponent(Button) ?? null;
        const upgradeNode = this.page?.getChildByName('无最低品质')
            ?? this.page?.getChildByName('立刻升级球探')
            ?? null;
        this.upgradeButton = upgradeNode
            ? upgradeNode.getComponent(Button) ?? upgradeNode.addComponent(Button)
            : null;
        const rowRoot = this.page?.getChildByName('五档品质概率') ?? null;
        this.rows = Array.from({ length: DISPLAY_ROW_COUNT }, (_, index) => {
            const root = rowRoot?.getChildByName(`品质${index + 1}`) ?? null;
            return root ? {
                root,
                frame: root.getChildByName('细边框01')?.getComponent(Sprite) ?? null,
                qualityLabel: root.getChildByName('品质')?.getComponent(Label) ?? null,
                probabilityLabel: root.getChildByName('概率')?.getComponent(Label) ?? null,
            } : null;
        }).filter((row): row is ProbabilityRowView => Boolean(row));
    }

    private getQualityColor(qualityId: number): Color {
        switch (getQualityFrameIndex(qualityId)) {
            case 0: return new Color(218, 142, 82, 255); // 铜
            case 1: return new Color(221, 234, 240, 255); // 银
            case 2: return new Color(255, 204, 32, 255); // 金
            case 3: return new Color(42, 226, 76, 255); // 绿
            case 4: return new Color(40, 139, 255, 255); // 蓝
            case 5: return new Color(255, 42, 58, 255); // 红
            case 6: return new Color(180, 52, 255, 255); // 紫
            case 7: return new Color(142, 216, 255, 255); // 冰蓝
            case 8: return new Color(255, 67, 159, 255); // 粉
            case 9: return new Color(235, 224, 255, 255); // 幻彩
            case 10: return new Color(42, 232, 244, 255); // 青蓝
            case 11: return new Color(104, 202, 255, 255); // 浅蓝
            case 12: return new Color(255, 215, 64, 255); // GOAT金
            default: return new Color(255, 255, 255, 255);
        }
    }

    private setLabel(path: string, value: string): void {
        const label = this.findByPath(this.page, path)?.getComponent(Label);
        if (label) {
            label.string = value;
        }
    }

    private bringToFront(page: Node): void {
        if (page.parent) {
            page.setSiblingIndex(page.parent.children.length - 1);
        }
        page.active = true;
    }

    private namedChildren(root: Node, names: readonly string[]): Node[] {
        return names.flatMap((name) => {
            const child = root.getChildByName(name);
            return child ? [child] : [];
        });
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
