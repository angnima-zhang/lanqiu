import { _decorator, Component } from 'cc';
import { clearAllBasketballSaveData } from './GameState';

const { ccclass, executionOrder, property } = _decorator;
let hasHandledStartupReset = false;

@ccclass('HomepageDebugManager')
@executionOrder(-1000)
export class HomepageDebugManager extends Component {
    @property({
        displayName: '启动时重置全部存档',
        tooltip: '勾选并保存 Homepage.scene 后，每次启动游戏首次进入 Homepage 时清除一次本游戏全部存档。',
    })
    public resetAllSavesOnStart = false;

    protected onLoad(): void {
        if (hasHandledStartupReset) {
            return;
        }
        hasHandledStartupReset = true;

        if (!this.resetAllSavesOnStart) {
            return;
        }
        const removedCount = clearAllBasketballSaveData();
        console.info(`[HomepageDebugManager] 启动时已清除 ${removedCount} 项存档。`);
    }
}
