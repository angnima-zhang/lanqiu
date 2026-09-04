import { _decorator, Component, director, Label, ProgressBar } from 'cc';
import { preloadHomepageRuntimeAssets, preloadHomepageStaticAssets } from '../home/HomepagePreloader';
import { initializeTapCloudSave } from '../home/TapCloudSaveService';
import { markStartupStage } from './StartupTiming';

const { ccclass, property } = _decorator;

const HOME_SCENE = 'Homepage';
const MIN_DISPLAY_SECONDS = 0.2;
const PROGRESS_SPEED = 4;

@ccclass('LoadingController')
export class LoadingController extends Component {
    @property(ProgressBar)
    public progressBar: ProgressBar | null = null;

    @property(Label)
    public progressLabel: Label | null = null;

    @property(Label)
    public statusLabel: Label | null = null;

    private targetProgress = 0;
    private displayProgress = 0;
    private elapsedSeconds = 0;
    private dotElapsedSeconds = 0;
    private dotCount = 0;
    private retryCount = 0;
    private homepagePreloadProgress = 0;
    private cloudRestorePromise: Promise<void> = Promise.resolve();
    private scenePreloadPromise: Promise<void> | null = null;
    private runtimePreloadPromise: Promise<void> | null = null;
    private loadComplete = false;
    private switchingScene = false;
    private stopped = false;
    private statusText = '正在初始化';

    protected onLoad(): void {
        markStartupStage('loading-scene-onload');
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
            this.setStatus('正在读取存档并加载资源');
            markStartupStage('cloud-restore-start');
            this.cloudRestorePromise = initializeTapCloudSave().then(() => {
                if (this.isValid && !this.stopped) {
                    markStartupStage('cloud-restore-ready');
                    this.setStatus('正在加载游戏资源');
                }
            });
            this.preloadHomepage();
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

    private preloadHomepage(): void {
        markStartupStage('homepage-static-start');
        void Promise.all([
            preloadHomepageStaticAssets().then(() => markStartupStage('homepage-static-ready')),
            this.preloadHomepageScene(),
            this.preloadHomepageRuntime(),
        ]).then(() => {
            if (!this.isValid || this.stopped) return;
            this.targetProgress = 1;
            this.loadComplete = true;
            markStartupStage('homepage-dependencies-ready');
            this.setStatus('加载完成', false);
        }).catch((error) => {
            if (this.isValid && !this.stopped) {
                this.handleLoadError(error, () => this.preloadHomepage());
            }
        });
    }

    private preloadHomepageRuntime(): Promise<void> {
        this.runtimePreloadPromise ??= this.cloudRestorePromise.then(async () => {
            if (!this.isValid || this.stopped) return;
            markStartupStage('homepage-roster-warmup-start');
            await preloadHomepageRuntimeAssets();
            markStartupStage('homepage-roster-warmup-ready');
        }).catch((error) => {
            this.runtimePreloadPromise = null;
            throw error;
        });
        return this.runtimePreloadPromise;
    }

    private preloadHomepageScene(): Promise<void> {
        this.scenePreloadPromise ??= new Promise<void>((resolve, reject) => {
            markStartupStage('homepage-scene-preload-start');
            director.preloadScene(
                HOME_SCENE,
                (completedCount, totalCount) => {
                    if (!this.isValid || this.stopped || totalCount <= 0) {
                        return;
                    }
                    const sceneProgress = Math.min(1, completedCount / totalCount);
                    this.homepagePreloadProgress = Math.max(this.homepagePreloadProgress, sceneProgress);
                    this.updateTargetProgress();
                },
                (error) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    markStartupStage('homepage-scene-preload-ready');
                    this.homepagePreloadProgress = 1;
                    if (this.isValid && !this.stopped) this.updateTargetProgress();
                    resolve();
                },
            );
        }).catch((error) => {
            this.scenePreloadPromise = null;
            throw error;
        });
        return this.scenePreloadPromise;
    }

    private updateTargetProgress(): void {
        this.targetProgress = Math.max(
            this.targetProgress,
            // Scene files may finish before cloud recovery; never show a false 100%.
            this.homepagePreloadProgress * 0.9,
        );
    }

    private handleLoadError(error: Error, retry: () => void): void {
        console.error('[LoadingController] Failed to load:', error);
        if (this.retryCount < 1) {
            this.retryCount += 1;
            this.setStatus('加载失败，正在重试');
            this.scheduleOnce(() => {
                if (this.isValid && !this.stopped) retry();
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
        markStartupStage('homepage-activation-start');
        director.loadScene(HOME_SCENE, (error, scene) => {
            if (error) {
                this.loadComplete = false;
                this.switchingScene = false;
                this.handleLoadError(error, () => this.enterHomepage());
                return;
            }
            markStartupStage('homepage-scene-activated');
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
