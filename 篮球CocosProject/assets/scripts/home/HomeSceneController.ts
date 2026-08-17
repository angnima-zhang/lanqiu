import { _decorator, Component, Node } from 'cc';
import { PlayerAvatarChip } from './PlayerAvatarChip';
import { RosterSlotView } from './RosterSlotView';
import { ManagerSlotView } from './ManagerSlotView';
import { BottomNavItemView } from './BottomNavItemView';
import { ProgressBarView } from '../common/ProgressBarView';
import { PrimaryButtonView } from '../common/PrimaryButtonView';

const { ccclass, property } = _decorator;

@ccclass('HomeSceneController')
export class HomeSceneController extends Component {
    @property({ type: [PlayerAvatarChip] })
    public courtPlayers: PlayerAvatarChip[] = [];

    @property({ type: [RosterSlotView] })
    public rosterSlots: RosterSlotView[] = [];

    @property({ type: [ManagerSlotView] })
    public managerSlots: ManagerSlotView[] = [];

    @property({ type: [BottomNavItemView] })
    public bottomNavItems: BottomNavItemView[] = [];

    @property(ProgressBarView)
    public spiritBar: ProgressBarView | null = null;

    @property(PrimaryButtonView)
    public recruitButton: PrimaryButtonView | null = null;

    @property(Node)
    public modalLayer: Node | null = null;
}
