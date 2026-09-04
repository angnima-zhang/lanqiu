import { game, Game, sys } from 'cc';
import { PREVIEW } from 'cc/env';

const ARCHIVE_NAME = 'basketball_auto_save_v1';
const UPLOAD_INTERVAL_MS = 65_000;
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_SAVE_BYTES = 10 * 1024 * 1024;
const KNOWN_ARCHIVE_KEY = 'basketball.cloud.known-archive.v1';
const LAST_UPLOAD_KEY = 'basketball.cloud.last-upload-at.v1';
const JSON_SAVE_KEYS = new Set([
    'basketball.roster.v2', 'basketball.management.v2', 'basketball.player-history.v2',
    'basketball.settings.v1', 'basketball.idle.v2', 'basketball.season.v2',
    'basketball.team.progression.v2', 'basketball.player-knowledge.v1',
]);

interface Callbacks<T> {
    success: (result: T) => void;
    fail: (error: unknown) => void;
}

interface Archive {
    uuid: string;
    fileId: string;
    name: string;
    modifiedTime?: number;
    saveSize?: number;
}

interface UploadOptions extends Callbacks<{ uuid: string; fileId: string }> {
    archiveMetaData: { name: string; summary: string };
    archiveFilePath: string;
}

interface CloudManager {
    getArchiveList(options: Callbacks<{ saves: Archive[] }>): void;
    getArchiveData(options: Callbacks<{ filePath: string }> & {
        archiveUUID: string;
        archiveFileId: string;
        targetFilePath: string;
    }): void;
    createArchive(options: UploadOptions): void;
    updateArchive(options: UploadOptions & { archiveUUID: string }): void;
}

interface FileManager {
    writeFile(options: Callbacks<unknown> & {
        filePath: string; data: string; encoding: 'utf8';
    }): void;
    readFile(options: Callbacks<{ data: string }> & {
        filePath: string; encoding: 'utf8';
    }): void;
}

interface TapCloudPlatform {
    getCloudSaveManager(): CloudManager;
    getFileSystemManager(): FileManager;
    env?: { USER_DATA_PATH?: string };
    showModal?(options: Callbacks<{ confirm: boolean; cancel: boolean }> & {
        title: string; content: string; confirmText: string; cancelText: string;
    }): void;
    showToast?(options: { title: string; icon: 'none'; duration: number }): void;
}

interface SaveSnapshot {
    game: 'basketball';
    version: 1;
    savedAt: number;
    data: Record<string, string>;
}

class CloudRequestTimeout extends Error { }

function request<T>(invoke: (callbacks: Callbacks<T>) => void): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new CloudRequestTimeout('TapTap cloud request timed out')), REQUEST_TIMEOUT_MS);
        const finish = (callback: () => void): void => {
            clearTimeout(timer);
            callback();
        };
        try {
            invoke({
                success: (result) => finish(() => resolve(result)),
                fail: (error) => finish(() => reject(error)),
            });
        } catch (error) {
            finish(() => reject(error));
        }
    });
}

function isSaveKey(key: string): boolean {
    return key.startsWith('basketball.')
        && !key.startsWith('basketball.cloud.')
        && key !== 'basketball.local-preview-reset-revision';
}

function localSaveKeys(): string[] {
    const keys: string[] = [];
    for (let index = 0; index < sys.localStorage.length; index += 1) {
        const key = sys.localStorage.key(index);
        if (key && isSaveKey(key)) keys.push(key);
    }
    return keys;
}

function captureSnapshot(): SaveSnapshot {
    const data: Record<string, string> = {};
    for (const key of localSaveKeys()) {
        const value = sys.localStorage.getItem(key);
        if (value != null && String(value).trim() !== '') data[key] = String(value);
    }
    return { game: 'basketball', version: 1, savedAt: Date.now(), data };
}

function signature(snapshot: SaveSnapshot): string {
    return JSON.stringify(Object.keys(snapshot.data).sort().map((key) => [key, snapshot.data[key]]));
}

function checkSize(text: string): void {
    if (text.length > MAX_SAVE_BYTES) throw new Error('Cloud save exceeds 10 MB');
    const bytes = encodeURIComponent(text).replace(/%[\dA-F]{2}/g, 'x').length;
    if (bytes > MAX_SAVE_BYTES) throw new Error('Cloud save exceeds 10 MB');
}

function parseSnapshot(text: string): SaveSnapshot {
    if (typeof text !== 'string') throw new Error('Cloud save is not UTF-8 text');
    checkSize(text);
    const value = JSON.parse(text) as SaveSnapshot;
    if (!value || value.game !== 'basketball' || value.version !== 1
        || !Number.isFinite(value.savedAt) || value.savedAt < 0
        || !value.data || typeof value.data !== 'object' || Array.isArray(value.data)
        || Object.keys(value.data).length === 0) {
        throw new Error('Invalid cloud save format/version');
    }
    for (const [key, entry] of Object.entries(value.data)) {
        if (!isSaveKey(key) || typeof entry !== 'string' || entry.trim() === '') {
            throw new Error('Invalid cloud save entry');
        }
        if (JSON_SAVE_KEYS.has(key)) {
            const parsed = JSON.parse(entry);
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)
                || (key === 'basketball.roster.v2' && !Array.isArray(parsed.cards))) {
                throw new Error(`Invalid structured save: ${key}`);
            }
        }
    }
    const budget = value.data['basketball.economy.budget.v2'];
    if (budget !== undefined && (!Number.isFinite(Number(budget)) || Number(budget) < 0)) {
        throw new Error('Invalid cloud budget');
    }
    return value;
}

function sameArchive(first: Pick<Archive, 'uuid' | 'fileId'> | null, second: Pick<Archive, 'uuid' | 'fileId'> | null): boolean {
    return first?.uuid === second?.uuid && first?.fileId === second?.fileId;
}

function showMessage(platform: TapCloudPlatform, title: string): void {
    try {
        platform.showToast?.({ title, icon: 'none', duration: 3000 });
    } catch (error) {
        console.warn('[TapCloudSave] Could not display status.', error);
    }
}

class TapCloudSaveService {
    private readonly cloud: CloudManager;
    private readonly files: FileManager;
    private readonly basePath: string;
    private archive: Archive | null = null;
    private uploadedSignature = '';
    private syncing = false;
    private paused = false;

    public constructor(private readonly platform: TapCloudPlatform) {
        this.cloud = platform.getCloudSaveManager();
        this.files = platform.getFileSystemManager();
        this.basePath = platform.env?.USER_DATA_PATH ?? 'tapfile://usr';
    }

    public async initialize(): Promise<void> {
        this.archive = await this.findArchive();
        const local = captureSnapshot();
        const hasLocal = Object.keys(local.data).length > 0;
        let known: Pick<Archive, 'uuid' | 'fileId'> | null = null;
        try {
            known = JSON.parse(sys.localStorage.getItem(KNOWN_ARCHIVE_KEY) || 'null');
        } catch { /* Older local saves have no cloud metadata. */ }

        // If cloud has not changed since this device last synced, local progress is authoritative.
        if (this.archive && !(hasLocal && sameArchive(known, this.archive))) {
            const downloaded = await request<{ filePath: string }>((callbacks) => this.cloud.getArchiveData({
                archiveUUID: this.archive!.uuid,
                archiveFileId: this.archive!.fileId,
                targetFilePath: `${this.basePath}/basketball_cloud_previous.json`,
                ...callbacks,
            }));
            const file = await request<{ data: string }>((callbacks) => this.files.readFile({
                filePath: downloaded.filePath, encoding: 'utf8', ...callbacks,
            }));
            const remote = parseSnapshot(file.data);
            const equal = signature(local) === signature(remote);
            if (!hasLocal || (!equal && await this.chooseCloud(local, remote))) {
                await this.writeFile('basketball_before_cloud_restore.json', JSON.stringify(local));
                this.restore(remote, local);
                this.uploadedSignature = signature(remote);
            } else if (equal) {
                this.uploadedSignature = signature(remote);
            }
        }
        this.rememberArchive();
        // Module lifetime spans scene switches. Defer hide/show capture until gameplay listeners save idle state.
        setInterval(() => { void this.flush(); }, UPLOAD_INTERVAL_MS);
        const flushAfterLifecycle = (): void => { void Promise.resolve().then(() => this.flush()); };
        game.on(Game.EVENT_HIDE, flushAfterLifecycle);
        game.on(Game.EVENT_SHOW, flushAfterLifecycle);
        console.info('[TapCloudSave] Initialized; autosave interval is 65 seconds.');
    }

    private async findArchive(): Promise<Archive | null> {
        const result = await request<{ saves: Archive[] }>((callbacks) => this.cloud.getArchiveList(callbacks));
        if (!Array.isArray(result?.saves)) throw new Error('Invalid archive list');
        const matches = result.saves.filter((entry) => entry.name === ARCHIVE_NAME);
        if (matches.length > 1) throw new Error('Multiple automatic cloud saves found; refusing to overwrite');
        const archive = matches[0] ?? null;
        if (archive && (!archive.uuid || !archive.fileId || (archive.saveSize ?? 0) > MAX_SAVE_BYTES)) {
            throw new Error('Invalid or oversized cloud archive');
        }
        return archive;
    }

    private chooseCloud(local: SaveSnapshot, remote: SaveSnapshot): Promise<boolean> {
        if (!this.platform.showModal) throw new Error('Cannot safely resolve cloud save conflict without a dialog');
        // No timeout: only an explicit player choice may replace an existing save.
        return new Promise<boolean>((resolve, reject) => this.platform.showModal!({
            title: '发现不同的存档',
            content: `本地预算：${local.data['basketball.economy.budget.v2'] ?? '未初始化'}\n云端预算：${remote.data['basketball.economy.budget.v2'] ?? '未初始化'}\n云端保存：${new Date(remote.savedAt).toLocaleString()}\n选择后将整份存档同步，未选择的版本保留本地文件备份。`,
            confirmText: '使用云端',
            cancelText: '保留本地',
            success: (result) => {
                if (result.confirm) resolve(true);
                else if (result.cancel) resolve(false);
                else reject(new Error('Cloud save choice was dismissed'));
            },
            fail: reject,
        }));
    }

    private restore(remote: SaveSnapshot, local: SaveSnapshot): void {
        const replace = (snapshot: SaveSnapshot): void => {
            localSaveKeys().forEach((key) => sys.localStorage.removeItem(key));
            Object.entries(snapshot.data).forEach(([key, value]) => sys.localStorage.setItem(key, value));
        };
        try {
            replace(remote);
        } catch (error) {
            replace(local);
            throw error;
        }
    }

    private writeFile(name: string, data: string): Promise<unknown> {
        return request((callbacks) => this.files.writeFile({
            filePath: `${this.basePath}/${name}`, data, encoding: 'utf8', ...callbacks,
        }));
    }

    private rememberArchive(): void {
        sys.localStorage.setItem(KNOWN_ARCHIVE_KEY, JSON.stringify(this.archive
            ? { uuid: this.archive.uuid, fileId: this.archive.fileId }
            : null));
    }

    private async flush(): Promise<void> {
        if (this.paused || this.syncing) return;
        this.syncing = true;
        try {
            const snapshot = captureSnapshot();
            const currentSignature = signature(snapshot);
            const lastAttempt = Number(sys.localStorage.getItem(LAST_UPLOAD_KEY)) || 0;
            if (!Object.keys(snapshot.data).length || currentSignature === this.uploadedSignature
                || Date.now() - lastAttempt < UPLOAD_INTERVAL_MS) return;
            const serialized = JSON.stringify(snapshot);
            parseSnapshot(serialized);

            // Check the remote revision again before overwriting. Never restore mid-game.
            const latest = await this.findArchive();
            if (!sameArchive(latest, this.archive)) {
                this.paused = true;
                showMessage(this.platform, '云端存档已变化，请重启游戏选择存档');
                console.warn('[TapCloudSave] Remote revision changed; uploads paused.');
                return;
            }
            await this.writeFile('basketball_auto_save.json', serialized);
            sys.localStorage.setItem(LAST_UPLOAD_KEY, String(Date.now()));
            const uploaded = await request<{ uuid: string; fileId: string }>((callbacks) => {
                const options: UploadOptions = {
                    archiveMetaData: { name: ARCHIVE_NAME, summary: `Basketball autosave ${new Date(snapshot.savedAt).toISOString()}` },
                    archiveFilePath: `${this.basePath}/basketball_auto_save.json`,
                    ...callbacks,
                };
                if (this.archive) this.cloud.updateArchive({ archiveUUID: this.archive.uuid, ...options });
                else this.cloud.createArchive(options);
            });
            const uuid = uploaded?.uuid ?? this.archive?.uuid;
            if (!uuid || !uploaded?.fileId) throw new CloudRequestTimeout('Upload result is ambiguous');
            this.archive = { uuid, fileId: uploaded.fileId, name: ARCHIVE_NAME };
            this.uploadedSignature = currentSignature;
            this.rememberArchive();
            console.info('[TapCloudSave] Progress uploaded.');
        } catch (error) {
            // A timed-out native call may still complete later; do not start another concurrent call.
            if (error instanceof CloudRequestTimeout) this.paused = true;
            console.warn('[TapCloudSave] Upload failed; local progress preserved.', error);
            showMessage(this.platform, this.paused ? '云同步超时，本地进度已保留，请重启重试' : '云同步失败，本地进度已保留');
        } finally {
            this.syncing = false;
        }
    }
}

let initialization: Promise<void> | null = null;

/** Restore before save-dependent Homepage initialization; static assets may preload in parallel. */
export function initializeTapCloudSave(): Promise<void> {
    if (initialization) return initialization;
    const platform = (globalThis as unknown as { tap?: TapCloudPlatform }).tap;
    if (PREVIEW || !platform?.getCloudSaveManager || !platform.getFileSystemManager) {
        return Promise.resolve();
    }
    initialization = Promise.resolve().then(() => new TapCloudSaveService(platform).initialize()).catch((error) => {
        console.warn('[TapCloudSave] Initialization failed; cloud sync disabled for this session.', error);
        showMessage(platform, '云存档读取失败，本次使用本地存档');
    });
    return initialization;
}
