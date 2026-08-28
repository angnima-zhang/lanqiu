import { resources, SpriteFrame } from 'cc';
import { getQualityFrameIndex } from './RosterSlotView';
import { PlayerCard, PlayerEventType } from './GameState';

const PORTRAIT_SOURCE_ALIASES: Readonly<Record<string, string>> = {
    阿不都沙拉木: 'Abudushalamu Abudurexiti',
    巴特尔: 'Mengke Bateer',
    丁彦雨航: 'Ding Yanyuhang',
    杜锋: 'Du Feng',
    巩晓彬: 'Gong Xiaobin',
    贺希宁: 'He Xining',
    胡金秋: 'Hu Jinqiu',
    胡卫东: 'Hu Weidong',
    刘玉栋: 'Liu Yudong',
    马健: 'Ma Jian',
    孙军: 'Sun Jun',
    唐正东: 'Tang Zhengdong',
    王仕鹏: 'Wang Shipeng',
    王哲林: 'Wang Zhelin',
    王治郅: 'Wang Zhizhi',
    吴前: 'Wu Qian',
    姚明: 'Yao Ming',
    易建联: 'Yi Jianlian',
    张卫平: 'Zhang Weiping',
    赵继伟: 'Zhao Jiwei',
    朱芳雨: 'Zhu Fangyu',
};

// Portrait filenames are legacy asset identifiers, while display names can change
// for localization, concept-god upgrades, or saved cards from older versions.
// Always resolve by the immutable source name to keep existing saves compatible.
const PORTRAIT_FILE_PREFIXES: Readonly<Record<string, string>> = {
    'Abudushalamu Abudurexiti': '雅不都沙拉木',
    'Allen Iverson': '爱弗森',
    'Alonzo Mourning': '墨宁',
    'Amar\'e Stoudemire': '司塔德迈尔',
    'Amen Thompson': '唐普森',
    'Andrew Wiggins': '维津斯',
    'Antawn Jamison': '假米森',
    'Anthony Davis': '戴维思',
    'Anthony Edwards': '爱得划兹',
    'Arvydas Sabonis': '飒博尼斯',
    'Ben Simmons': '熙蒙斯',
    'Ben Wallace': '桦莱士',
    'Bill Russell': '啦塞尔',
    'Bill Walton': '渥顿',
    'Blake Griffin': '阁里芬',
    'Bob Pettit': '沛蒂特',
    'Cade Cunningham': '侃宁安',
    'Carmelo Anthony': '桉东尼',
    'Charles Barkley': '芭克利',
    'Chauncey Billups': '比炉普斯',
    'Chet Holmgren': '豁姆格伦',
    'Chris Bosh': '泊什',
    'Chris Mullin': '木林',
    'Chris Paul': '宝罗',
    'Chris Webber': '维伯',
    'Clyde Drexler': '得雷克斯勒',
    'Cooper Flagg': '芙拉格',
    'Cui Yongxi': '崔勇熙',
    'Damian Lillard': '立拉德',
    'David Robinson': '洛宾逊',
    'Deandre Ayton': '爱顿',
    'DeMarcus Cousins': '烤辛斯',
    'Dennis Rodman': '洛德曼',
    'Derrick Rose': '洛斯',
    'Devin Booker': '步克',
    'Dikembe Mutombo': '慕托姆博',
    'Ding Yanyuhang': '玎彦雨航',
    'Dirk Nowitzki': '糯维茨基',
    'Dominique Wilkins': '维尔金斯',
    'Donovan Mitchell': '弥切尔',
    'Draymond Green': '阁林',
    'Du Feng': '渡锋',
    'Dwight Howard': '豁华德',
    'Dwyane Wade': '维德',
    'Dylan Harper': '哈魄',
    'Evan Mobley': '墨布里',
    'Franz Wagner': '瓦阁纳',
    'Fred VanVleet': '范芙利特',
    'Gary Payton': '沛顿',
    'George Gervin': '格雯',
    'George Mikan': '麦垦',
    'Giannis Antetokounmpo': '雅德托昆博',
    'Gong Xiaobin': '汞小彬',
    'Grant Hill': '熙尔',
    'Greg Oden': '傲登',
    'Hakeem Olajuwon': '傲拉朱旺',
    'He Xining': '鹤希宁',
    'Hu Jinqiu': '湖金秋',
    'Hu Weidong': '湖卫东',
    'Isiah Thomas': '拓马斯',
    'J.R. Smith': 'JR史秘司',
    'Jalen Brunson': '步伦森',
    'Jalen Green': '阁林',
    'Jalen Williams': '维廉姆斯',
    'James Harden': '哈灯',
    'James Worthy': '渥西',
    'Jason Kidd': '吉德',
    'Jason Terry': '忒里',
    'Jaylen Brown': '步朗',
    'Jayson Tatum': '榙图姆',
    'Jeremy Lamb': '蓝姆',
    'Jeremy Lin': '林书皓',
    'Jerry West': '维斯特',
    'Jimmy Butler': '芭特勒',
    'Joe Dumars': '杜码斯',
    'Joel Embiid': '蒽比德',
    'John Stockton': '思托克顿',
    'John Wall': '我尔',
    'Julius Erving': '殴文',
    'Kareem Abdul-Jabbar': '佳巴尔',
    'Karl Malone': '玛龙',
    'Kawhi Leonard': '纶纳德',
    'Kevin Durant': '渡兰特',
    'Kevin Garnett': '嘉内特',
    'Kevin Johnson': '越翰逊',
    'Kevin McHale': '迈克海尔',
    'Klay Thompson': '唐普森',
    'Kobe Bryant': '颗比',
    'Kyle Anderson': '理凯尔',
    'Kyrie Irving': '殴文',
    'LaMarcus Aldridge': '阿尔德里齐',
    'Larry Bird': '柏德',
    'LeBron James': '瞻姆斯',
    'Liu Yudong': '柳玉栋',
    'Luka Dončić': '冬契奇',
    'Ma Jian': '玛健',
    'Magic Johnson': '魔术师',
    'Manu Ginóbili': '季诺比利',
    'Marc Gasol': '嘉索尔',
    'Mengke Bateer': '芭特尔',
    'Michael Jordan': '侨丹',
    'Moses Malone': '玛龙',
    'Nick Young': '阳',
    'Nikola Jokić': '约吉奇',
    'Oscar Robertson': '洛伯特森',
    'Paolo Banchero': '班恺罗',
    'Patrick Ewing': '游因',
    'Pau Gasol': '嘉索尔',
    'Paul George': '侨治',
    'Paul Pierce': '琵尔斯',
    'Rajon Rondo': '胧多',
    'Ray Allen': '雅伦',
    'Reggie Miller': '米乐',
    'Robert Parish': '琶里什',
    'Russell Westbrook': '维司布鲁克',
    'Scottie Barnes': '芭恩斯',
    'Scottie Pippen': '琵蓬',
    'Shai Gilgeous-Alexander': '鸭梨山大',
    'Shaquille O\'Neal': '傲尼尔',
    'Stephen Curry': '酷里',
    'Stephon Castle': '喀斯尔',
    'Steve Nash': '娜什',
    'Sun Jun': '荪军',
    'Sun Yue': '荪悦',
    'Tang Zhengdong': '塘正东',
    'Tim Duncan': '登肯',
    'Toni Kukoč': '库颗奇',
    'Tony Parker': '琶克',
    'Tracy McGrady': '卖迪',
    'Trae Young': '阳',
    'Tyrese Haliburton': '哈里搏顿',
    'Victor Wembanyama': '文般亚玛',
    'Vince Carter': '喀特',
    'VJ Edgecombe': '埃奇酷姆',
    'Vlade Divac': '迪瓦慈',
    'Walt Frazier': '芙雷泽',
    'Wang Shipeng': '望仕鹏',
    'Wang Zhelin': '望哲林',
    'Wang Zhizhi': '望治郅',
    'Wilt Chamberlain': '璋伯伦',
    'Wu Qian': '梧前',
    'Yang Hansen': '阳瀚森',
    'Yao Ming': '尧明',
    'Yi Jianlian': '奕建联',
    'Zach LaVine': '啦文',
    'Zhang Weiping': '璋卫平',
    'Zhao Jiwei': '照继伟',
    'Zhou Qi': '洲琦',
    'Zhu Fangyu': '珠芳雨',
    'Zion Williamson': '锡暗',
};

const PLAYER_EVENT_ICON_PATHS: Readonly<Record<PlayerEventType, string>> = {
    injury: 'images/UI/事件/伤病/spriteFrame',
    retirement: 'images/UI/事件/退役/spriteFrame',
    training: 'images/UI/事件/训练/spriteFrame',
};

export function loadPlayerPortrait(
    player: Pick<PlayerCard, 'sourcePlayerName' | 'displayName'>,
): Promise<SpriteFrame | null> {
    const portraitSource = PORTRAIT_SOURCE_ALIASES[player.sourcePlayerName]
        ?? player.sourcePlayerName;
    const portraitDisplayName = PORTRAIT_FILE_PREFIXES[portraitSource]
        ?? player.displayName;
    return loadSpriteFrame(
        `images/头像/${portraitDisplayName}_${portraitSource}/spriteFrame`,
    );
}

export function loadPlayerEventIcon(eventType: PlayerEventType): Promise<SpriteFrame | null> {
    return loadSpriteFrame(PLAYER_EVENT_ICON_PATHS[eventType]);
}

export function loadQualityFrame(qualityId: number): Promise<SpriteFrame | null> {
    const frameIndex = formatQualityFrameIndex(qualityId);
    return loadSpriteFrame(
        `images/UI/球员/头像框-方/头像框${frameIndex}-方/spriteFrame`,
    );
}

export function loadRoundQualityFrame(qualityId: number): Promise<SpriteFrame | null> {
    const frameIndex = formatQualityFrameIndex(qualityId);
    return loadSpriteFrame(
        `images/UI/球员/头像框-圆/头像框${frameIndex}-圆/spriteFrame`,
    );
}

export function loadThinQualityFrame(qualityId: number): Promise<SpriteFrame | null> {
    const frameIndex = formatQualityFrameIndex(qualityId);
    return loadSpriteFrame(
        `images/UI/球员/细边框/细边框${frameIndex}/spriteFrame`,
    );
}

export function loadRecruitmentBackground(qualityId: number): Promise<SpriteFrame | null> {
    return loadSpriteFrame(
        `images/UI/球员/招募背景/招募背景${formatQualityFrameIndex(qualityId)}/spriteFrame`,
    );
}

export function loadQualityWheat(qualityId: number): Promise<SpriteFrame | null> {
    return loadSpriteFrame(
        `images/UI/球员/麦穗/麦穗${formatQualityFrameIndex(qualityId)}/spriteFrame`,
    );
}

export function loadQualityNameplate(qualityId: number): Promise<SpriteFrame | null> {
    return loadSpriteFrame(
        `images/UI/球员/名牌/名牌${formatQualityFrameIndex(qualityId)}/spriteFrame`,
    );
}

export function loadQualityBadge(qualityId: number): Promise<SpriteFrame | null> {
    return loadSpriteFrame(
        `images/UI/球员/品质标签/品质标签${formatQualityFrameIndex(qualityId)}/spriteFrame`,
    );
}

export function loadQualityPosition(qualityId: number): Promise<SpriteFrame | null> {
    return loadSpriteFrame(
        `images/UI/球员/位置/位置${formatQualityFrameIndex(qualityId)}/spriteFrame`,
    );
}

function formatQualityFrameIndex(qualityId: number): string {
    return String(getQualityFrameIndex(qualityId)).padStart(2, '0');
}

export function loadSpriteFrame(path: string): Promise<SpriteFrame | null> {
    return new Promise((resolve) => {
        resources.load(path, SpriteFrame, (error, spriteFrame) => {
            if (error || !spriteFrame) {
                console.error(`[PlayerAssets] Failed to load SpriteFrame: ${path}`, error);
                resolve(null);
                return;
            }
            resolve(spriteFrame);
        });
    });
}
