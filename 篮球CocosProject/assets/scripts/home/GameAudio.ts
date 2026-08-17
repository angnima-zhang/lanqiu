import {
    AudioClip,
    AudioSource,
    director,
    Node,
    resources,
} from 'cc';
import { loadGameSettings } from './GameState';

type GameAudioKey = 'bgm' | 'victory' | 'ad-success' | 'upgrade-success';

const AUDIO_RESOURCE_PATHS: Record<GameAudioKey, string> = {
    bgm: 'audios/bgm',
    victory: 'audios/胜利',
    'ad-success': 'audios/看广告成功',
    'upgrade-success': 'audios/升级成功',
};

const BGM_VOLUME = 0.4;

class GameAudioService {
    private root: Node | null = null;
    private bgmSource: AudioSource | null = null;
    private soundSource: AudioSource | null = null;
    private readonly clips = new Map<GameAudioKey, AudioClip>();
    private readonly loading = new Map<GameAudioKey, Promise<AudioClip>>();

    public initialize(): void {
        if (!this.ensureSources()) {
            return;
        }
        this.syncSettings();
    }

    public syncSettings(): void {
        const settings = loadGameSettings();
        if (!settings.musicEnabled) {
            this.bgmSource?.stop();
            return;
        }
        void this.playBgm();
    }

    public playVictory(): void {
        this.playSound('victory');
    }

    public playAdSuccess(): void {
        this.playSound('ad-success');
    }

    public playUpgradeSuccess(): void {
        this.playSound('upgrade-success');
    }

    private async playBgm(): Promise<void> {
        if (!this.ensureSources() || !loadGameSettings().musicEnabled) {
            return;
        }

        try {
            const clip = await this.loadClip('bgm');
            if (!this.bgmSource || !loadGameSettings().musicEnabled) {
                return;
            }
            if (this.bgmSource.clip !== clip) {
                this.bgmSource.stop();
                this.bgmSource.clip = clip;
            }
            this.bgmSource.loop = true;
            this.bgmSource.volume = BGM_VOLUME;
            if (!this.bgmSource.playing) {
                this.bgmSource.play();
            }
        } catch (error) {
            console.error('[GameAudio] Failed to play BGM.', error);
        }
    }

    private playSound(key: Exclude<GameAudioKey, 'bgm'>): void {
        if (!this.ensureSources() || !loadGameSettings().soundEnabled) {
            return;
        }

        void this.loadClip(key).then((clip) => {
            if (!this.soundSource || !loadGameSettings().soundEnabled) {
                return;
            }
            this.soundSource.playOneShot(clip);
        }).catch((error) => {
            console.error(`[GameAudio] Failed to play ${key}.`, error);
        });
    }

    private ensureSources(): boolean {
        if (this.root && this.bgmSource && this.soundSource) {
            return true;
        }

        const scene = director.getScene();
        if (!scene) {
            return false;
        }

        this.root = new Node('__GameAudio');
        scene.addChild(this.root);
        director.addPersistRootNode(this.root);
        this.bgmSource = this.root.addComponent(AudioSource);
        this.soundSource = this.root.addComponent(AudioSource);
        this.bgmSource.playOnAwake = false;
        this.soundSource.playOnAwake = false;
        return true;
    }

    private loadClip(key: GameAudioKey): Promise<AudioClip> {
        const cached = this.clips.get(key);
        if (cached) {
            return Promise.resolve(cached);
        }
        const pending = this.loading.get(key);
        if (pending) {
            return pending;
        }

        const loading = new Promise<AudioClip>((resolve, reject) => {
            resources.load(AUDIO_RESOURCE_PATHS[key], AudioClip, (error, clip) => {
                if (error || !clip) {
                    reject(error ?? new Error(`Missing audio clip: ${key}`));
                    return;
                }
                this.clips.set(key, clip);
                resolve(clip);
            });
        });
        this.loading.set(key, loading);
        void loading.then(
            () => this.loading.delete(key),
            () => this.loading.delete(key),
        );
        return loading;
    }
}

export const gameAudio = new GameAudioService();
