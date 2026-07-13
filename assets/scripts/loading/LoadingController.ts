import { _decorator, Component, director, Font, Label, ProgressBar, resources } from 'cc';
import { applyGameFont } from './GameFont';

const { ccclass, property } = _decorator;

const HOME_SCENE = 'Homepage';
const FONT_PATH = 'fonts/zpix';
const MIN_DISPLAY_SECONDS = 1;
const PROGRESS_SPEED = 1.2;
const FONT_PROGRESS_WEIGHT = 0.1;

@ccclass('LoadingController')
export class LoadingController extends Component {
    @property(ProgressBar)
    public progressBar: ProgressBar | null = null;

    @property(Label)
    public progressLabel: Label | null = null;

    @property(Label)
    public statusLabel: Label | null = null;

    private gameFont: Font | null = null;
    private targetProgress = 0;
    private displayProgress = 0;
    private elapsedSeconds = 0;
    private dotElapsedSeconds = 0;
    private dotCount = 0;
    private retryCount = 0;
    private loadComplete = false;
    private switchingScene = false;
    private stopped = false;
    private statusText = '正在初始化';

    protected onLoad(): void {
        this.progressBar ??= this.node.getComponentInChildren(ProgressBar);
        this.progressLabel ??= this.findLabel('progress-num');
        this.statusLabel ??= this.findLabel('loading');

        if (!this.progressBar || !this.progressLabel || !this.statusLabel) {
            console.error('[LoadingController] Missing ProgressBar, progress-num Label, or loading Label.');
            this.enabled = false;
            return;
        }

        this.updateProgressUI(0);
        this.updateStatusUI();
    }

    protected start(): void {
        if (this.enabled) {
            this.loadFont();
        }
    }

    protected update(deltaTime: number): void {
        if (this.stopped) {
            return;
        }

        this.elapsedSeconds += deltaTime;
        this.updateLoadingDots(deltaTime);

        if (this.displayProgress < this.targetProgress) {
            this.displayProgress = Math.min(
                this.targetProgress,
                this.displayProgress + PROGRESS_SPEED * deltaTime,
            );
            this.updateProgressUI(this.displayProgress);
        }

        if (
            this.loadComplete
            && this.elapsedSeconds >= MIN_DISPLAY_SECONDS
            && this.displayProgress >= 0.999
        ) {
            this.enterHomepage();
        }
    }

    protected onDestroy(): void {
        this.stopped = true;
        this.unscheduleAllCallbacks();
    }

    private loadFont(): void {
        this.setStatus('正在加载字体');
        resources.load(FONT_PATH, Font, (error, font) => {
            if (!this.isValid) {
                return;
            }
            if (error || !font) {
                this.handleLoadError(error ?? new Error('zpix font asset is missing'));
                return;
            }

            this.gameFont = font;
            applyGameFont(this.node.scene, font);
            this.targetProgress = FONT_PROGRESS_WEIGHT;
            this.preloadHomepage();
        });
    }

    private preloadHomepage(): void {
        this.setStatus('正在加载游戏资源');
        director.preloadScene(
            HOME_SCENE,
            (completedCount, totalCount) => {
                if (totalCount <= 0) {
                    return;
                }
                const sceneProgress = Math.min(1, completedCount / totalCount);
                this.targetProgress = Math.max(
                    this.targetProgress,
                    FONT_PROGRESS_WEIGHT + sceneProgress * (1 - FONT_PROGRESS_WEIGHT),
                );
            },
            (error) => {
                if (!this.isValid) {
                    return;
                }
                if (error) {
                    this.handleLoadError(error);
                    return;
                }

                this.targetProgress = 1;
                this.loadComplete = true;
                this.setStatus('加载完成', false);
            },
        );
    }

    private handleLoadError(error: Error): void {
        console.error('[LoadingController] Failed to load:', error);
        if (this.retryCount < 1) {
            this.retryCount += 1;
            this.setStatus('加载失败，正在重试');
            this.scheduleOnce(() => {
                if (this.gameFont) {
                    this.preloadHomepage();
                } else {
                    this.loadFont();
                }
            }, 1);
            return;
        }

        this.stopped = true;
        this.setStatus('加载失败，请重新启动游戏', false);
    }

    private enterHomepage(): void {
        if (this.switchingScene) {
            return;
        }

        this.switchingScene = true;
        this.updateProgressUI(1);
        this.setStatus('加载完成', false);
        director.loadScene(HOME_SCENE, (error, scene) => {
            if (error) {
                this.switchingScene = false;
                this.handleLoadError(error);
                return;
            }
            if (scene && this.gameFont) {
                applyGameFont(scene, this.gameFont);
            }
        });
    }

    private updateProgressUI(progress: number): void {
        const safeProgress = Math.max(0, Math.min(1, progress));
        if (this.progressBar) {
            this.progressBar.progress = safeProgress;
        }
        if (this.progressLabel) {
            this.progressLabel.string = `${Math.floor(safeProgress * 100)}%`;
        }
    }

    private updateLoadingDots(deltaTime: number): void {
        if (this.loadComplete) {
            return;
        }
        this.dotElapsedSeconds += deltaTime;
        if (this.dotElapsedSeconds < 0.35) {
            return;
        }
        this.dotElapsedSeconds = 0;
        this.dotCount = (this.dotCount + 1) % 4;
        this.updateStatusUI();
    }

    private setStatus(text: string, animated = true): void {
        this.statusText = text;
        if (!animated) {
            this.dotCount = 0;
        }
        this.updateStatusUI(animated);
    }

    private updateStatusUI(animated = !this.loadComplete): void {
        if (this.statusLabel) {
            this.statusLabel.string = this.statusText + (animated ? '.'.repeat(this.dotCount) : '');
        }
    }

    private findLabel(nodeName: string): Label | null {
        const labels = this.node.getComponentsInChildren(Label);
        return labels.find((label) => label.node.name === nodeName) ?? null;
    }
}
