/*
 * Builds the shared player-knowledge/profile configuration from the canonical
 * card and award data.  Run with: node scripts/generate_player_knowledge.js
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const readJson = (relativePath) => JSON.parse(fs.readFileSync(
    path.join(root, relativePath),
    'utf8',
));
const writeJson = (relativePath, value) => fs.writeFileSync(
    path.join(root, relativePath),
    `${JSON.stringify(value, null, 2)}\n`,
    'utf8',
);
const nbaTeamNamesZh = readJson('data/nba_team_names_zh.json');

function localizeNbaTeamName(team) {
    const normalized = String(team ?? '').trim();
    return nbaTeamNamesZh[normalized] ?? normalized;
}

function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;
    for (let index = 0; index < text.length; index += 1) {
        const char = text[index];
        if (char === '"') {
            if (quoted && text[index + 1] === '"') {
                field += '"';
                index += 1;
            } else {
                quoted = !quoted;
            }
        } else if (char === ',' && !quoted) {
            row.push(field);
            field = '';
        } else if ((char === '\n' || char === '\r') && !quoted) {
            if (char === '\r' && text[index + 1] === '\n') index += 1;
            row.push(field);
            field = '';
            if (row.length > 1 || row[0]) rows.push(row);
            row = [];
        } else {
            field += char;
        }
    }
    if (field || row.length > 0) {
        row.push(field);
        rows.push(row);
    }
    const [headers, ...records] = rows;
    return records.map((values) => Object.fromEntries(
        headers.map((header, index) => [header, values[index] ?? '']),
    ));
}

const NATIONALITY_BY_SOURCE = {
    'Andrew Wiggins': '加拿大',
    'Ben Simmons': '澳大利亚',
    'Dikembe Mutombo': '刚果民主共和国',
    'Dirk Nowitzki': '德国',
    'Giannis Antetokounmpo': '希腊',
    'Hakeem Olajuwon': '尼日利亚',
    'Kyrie Irving': '澳大利亚/美国',
    'Kyle Anderson': '中国（归化）',
    'Luka Dončić': '斯洛文尼亚',
    'Manu Ginóbili': '阿根廷',
    'Marc Gasol': '西班牙',
    'Nikola Jokić': '塞尔维亚',
    'Pau Gasol': '西班牙',
    'Shai Gilgeous-Alexander': '加拿大',
    'Steve Nash': '加拿大',
    'Toni Kukoč': '克罗地亚',
    'Tony Parker': '法国',
    'Victor Wembanyama': '法国',
    'Vlade Divac': '塞尔维亚',
    'Yao Ming': '中国',
    '姚明': '中国',
    'Yang Hansen': '中国',
};

// 姚明的 CBA 特例卡沿用同一张 NBA 生涯档案，避免资料页误展示 CBA 荣誉与数据。
const NBA_PROFILE_SOURCE_OVERRIDES = {
    '姚明': 'Yao Ming',
};

const CAREER_SPAN_OVERRIDES = {
    '姚明': '2002-2011',
    'Yao Ming': '2002-2011',
};

// Championship and scoring-title data are not available in the local
// NBA-ABA-BAA award-share dataset, so keep the two missing honor dimensions
// explicit and auditable here instead of inferring them from card quality.
const CHAMPIONSHIP_COUNT_BY_SOURCE = {
    'Ben Wallace': 1,
    'Bill Russell': 11,
    'Bill Walton': 2,
    'Bob Pettit': 1,
    'Chauncey Billups': 1,
    'Clyde Drexler': 1,
    'David Robinson': 2,
    'Dennis Rodman': 5,
    'Dirk Nowitzki': 1,
    'Draymond Green': 4,
    'Dwyane Wade': 3,
    'Dwight Howard': 1,
    'Fred VanVleet': 1,
    'Gary Payton': 1,
    'George Mikan': 5,
    'Giannis Antetokounmpo': 1,
    'Hakeem Olajuwon': 2,
    'Isiah Thomas': 2,
    'J.R. Smith': 2,
    'Jalen Brunson': 1,
    'Jalen Williams': 1,
    'James Worthy': 3,
    'Jason Kidd': 1,
    'Jason Terry': 1,
    'Jaylen Brown': 1,
    'Jayson Tatum': 1,
    'Jerry West': 1,
    'Julius Erving': 3,
    'Kareem Abdul-Jabbar': 6,
    'Kawhi Leonard': 2,
    'Kevin Durant': 2,
    'Kevin Garnett': 1,
    'Kevin McHale': 3,
    'Klay Thompson': 4,
    'Kobe Bryant': 5,
    'Kyrie Irving': 1,
    'Larry Bird': 3,
    'LeBron James': 4,
    'Magic Johnson': 5,
    'Manu Ginóbili': 4,
    'Marc Gasol': 1,
    'Mengke Bateer': 1,
    'Michael Jordan': 6,
    'Moses Malone': 1,
    'Nikola Jokić': 1,
    'Pau Gasol': 2,
    'Paul Pierce': 1,
    'Rajon Rondo': 1,
    'Ray Allen': 2,
    'Robert Parish': 4,
    'Scottie Pippen': 6,
    'Shaquille O\'Neal': 4,
    'Shai Gilgeous-Alexander': 1,
    'Stephen Curry': 4,
    'Sun Yue': 1,
    'Tim Duncan': 5,
    'Toni Kukoč': 3,
    'Tony Parker': 4,
    'Wilt Chamberlain': 2,
    'Andrew Wiggins': 1,
};

const SCORING_TITLE_COUNT_BY_SOURCE = {
    'Allen Iverson': 4,
    'Bob Pettit': 1,
    'Carmelo Anthony': 1,
    'George Gervin': 4,
    'James Harden': 3,
    'Jerry West': 1,
    'Kareem Abdul-Jabbar': 2,
    'Kevin Durant': 4,
    'Kobe Bryant': 2,
    'LeBron James': 1,
    'Luka Dončić': 1,
    'Michael Jordan': 10,
    'Moses Malone': 1,
    'Russell Westbrook': 2,
    'Shaquille O\'Neal': 2,
    'Shai Gilgeous-Alexander': 1,
    'Stephen Curry': 2,
    'Tracy McGrady': 2,
    'Wilt Chamberlain': 7,
};

// NBA 官方 Finals MVP 历史页核对至 2025-26 赛季；CBA 次数仍取
// cba_local_award_stars.json 的 fmvpSeasons。
const FMVP_COUNT_BY_SOURCE = {
    'Bill Walton': 1,
    'Chauncey Billups': 1,
    'Dirk Nowitzki': 1,
    'Dwyane Wade': 1,
    'Giannis Antetokounmpo': 1,
    'Hakeem Olajuwon': 2,
    'Isiah Thomas': 1,
    'Jalen Brunson': 1,
    'James Worthy': 1,
    'Jaylen Brown': 1,
    'Jerry West': 1,
    'Kareem Abdul-Jabbar': 2,
    'Kawhi Leonard': 2,
    'Kevin Durant': 2,
    'Kobe Bryant': 2,
    'Larry Bird': 2,
    'LeBron James': 4,
    'Magic Johnson': 3,
    'Michael Jordan': 6,
    'Moses Malone': 1,
    'Nikola Jokić': 1,
    'Paul Pierce': 1,
    'Shai Gilgeous-Alexander': 1,
    'Shaquille O\'Neal': 3,
    'Stephen Curry': 1,
    'Tim Duncan': 3,
    'Tony Parker': 1,
};

const FUN_QUESTIONS = {
    '阿不都沙拉木': [
        { text: '{{playerName}} 曾随金州勇士参加NBA夏季联赛。', answer: true },
    ],
    '巴特尔': [
        { text: '{{playerName}} 是首位在NBA常规赛首发的中国球员。', answer: true },
    ],
    '丁彦雨航': [
        { text: '{{playerName}} 曾代表独行侠参加NBA夏季联赛。', answer: true },
    ],
    '杜锋': [
        { text: '{{playerName}} 球员时期获得过CBA总决赛MVP。', answer: true },
    ],
    '巩晓彬': [
        { text: '“逍遥王”是{{playerName}}广为人知的绰号。', answer: true },
    ],
    '贺希宁': [
        { text: '{{playerName}} 的CBA生涯长期效力于深圳队。', answer: true },
    ],
    '胡金秋': [
        { text: '{{playerName}} 获得过CBA常规赛MVP。', answer: true },
    ],
    '马健': [
        { text: '{{playerName}} 曾在美国NCAA一级联盟打球。', answer: true },
    ],
    '孙军': [
        { text: '“虎王”{{playerName}} 曾在一场CBA比赛中得到70分。', answer: true },
    ],
    '唐正东': [
        { text: '{{playerName}} 曾三次获得CBA常规赛MVP。', answer: true },
    ],
    '王哲林': [
        { text: '{{playerName}} 曾在2016年NBA选秀中被灰熊选中。', answer: true },
    ],
    '吴前': [
        { text: '{{playerName}} 获得过CBA常规赛MVP。', answer: true },
    ],
    '张卫平': [
        { text: '“这球打得合理”是球迷模仿{{playerName}}解说时常用的梗。', answer: true },
    ],
    '赵继伟': [
        { text: '{{playerName}} 获得过CBA总决赛MVP。', answer: true },
    ],
    'Allen Iverson': [
        { text: '{{playerName}} 曾在发布会上反复追问“训练？你说训练？”。', answer: true },
    ],
    'Alonzo Mourning': [
        { text: '{{playerName}} 接受肾移植后重返 NBA，并随队夺得总冠军。', answer: true },
    ],
    'Amar\'e Stoudemire': [
        { text: '{{playerName}} 在2003年最佳新秀评选中击败了姚明。', answer: true },
    ],
    'Amen Thompson': [
        { text: '{{playerName}} 与双胞胎兄弟在同一届选秀中连续第4、第5顺位被选中。', answer: true },
    ],
    'Andrew Wiggins': [
        { text: '“{{playerName}}的保温杯里泡枸杞”是围绕他的中文球迷梗。', answer: true },
        { text: '{{playerName}} 是2014年NBA选秀状元。', answer: true },
    ],
    'Anthony Edwards': [
        { text: '{{playerName}} 是2020年NBA选秀状元。', answer: true },
    ],
    'Anthony Davis': [
        { text: '{{playerName}} 曾在一场NBA比赛中得到59分并抢下20个篮板。', answer: true },
    ],
    'Ben Simmons': [
        { text: '{{playerName}} 在 NBA 常规赛中投进过三分球。', answer: true },
        { text: '{{playerName}} 投进个人首记NBA常规赛三分前，已经打了171场常规赛。', answer: true },
    ],
    'Ben Wallace': [
        { text: '{{playerName}} 是落选秀，却四次获得DPOY。', answer: true },
    ],
    'Bill Russell': [
        { text: 'NBA总决赛MVP奖杯以{{playerName}}命名。', answer: true },
    ],
    'Bill Walton': [
        { text: '{{playerName}} 是著名乐队“感恩而死”的铁杆歌迷。', answer: true },
    ],
    'Blake Griffin': [
        { text: '{{playerName}} 因伤错过被选中后的整个赛季，下一季仍获得最佳新秀。', answer: true },
    ],
    'Bob Pettit': [
        { text: '{{playerName}} 是NBA历史上第一位常规赛MVP。', answer: true },
    ],
    'Cade Cunningham': [
        { text: '{{playerName}} 是2021年NBA选秀状元。', answer: true },
    ],
    'Carmelo Anthony': [
        { text: '{{playerName}} 随美国男篮获得过三枚奥运会金牌。', answer: true },
    ],
    'Charles Barkley': [
        { text: '{{playerName}} 曾因打赌姚明拿不到19分而在节目中亲吻驴屁股。', answer: true },
    ],
    'Chauncey Billups': [
        { text: '{{playerName}} 在2004年总决赛击败湖人后获得FMVP。', answer: true },
    ],
    'Chet Holmgren': [
        { text: '{{playerName}} 因脚部伤势缺席了被选中后的整个2022-23赛季。', answer: true },
    ],
    'Chris Bosh': [
        { text: '{{playerName}} 曾在队友电视采访时反复抢镜，被球迷做成“视频炸弹”集锦。', answer: true },
    ],
    'Chris Mullin': [
        { text: '{{playerName}} 与蒂姆·哈达威、里奇蒙德组成的组合被称为“Run TMC”。', answer: true },
    ],
    'Chris Paul': [
        { text: '{{playerName}} 直到2018年才首次踏上西部决赛赛场。', answer: true },
    ],
    'Chris Webber': [
        { text: '{{playerName}} 在大学决赛关键时刻叫了一个球队已经没有的暂停。', answer: true },
    ],
    'Clyde Drexler': [
        { text: '“滑翔机”是{{playerName}}广为人知的绰号。', answer: true },
    ],
    'Cooper Flagg': [
        { text: '{{playerName}} 是2025年NBA选秀状元。', answer: true },
    ],
    'Cui Yongxi': [
        { text: '{{playerName}} 曾与篮网签下双向合同。', answer: true },
    ],
    'Damian Lillard': [
        { text: '{{playerName}} 曾分别用压哨远投终结火箭和雷霆的季后赛系列赛。', answer: true },
    ],
    'David Robinson': [
        { text: '{{playerName}} 曾在一场NBA比赛中得到四双。', answer: true },
    ],
    'Deandre Ayton': [
        { text: '{{playerName}} 在2018年NBA选秀中以状元身份被太阳选中。', answer: true },
    ],
    'DeMarcus Cousins': [
        { text: '“考神”是中文球迷对{{playerName}}的常用昵称。', answer: true },
    ],
    'Dennis Rodman': [
        { text: '{{playerName}} 曾连续7个赛季获得篮板王。', answer: true },
    ],
    'Derrick Rose': [
        { text: '{{playerName}} 获得常规赛MVP时只有22岁，是NBA历史最年轻MVP。', answer: true },
    ],
    'Devin Booker': [
        { text: '{{playerName}} 曾在波士顿单场得到70分。', answer: true },
    ],
    'Dikembe Mutombo': [
        { text: '{{playerName}} 完成封盖后摇手指，是他的标志性庆祝动作。', answer: true },
    ],
    'Dirk Nowitzki': [
        { text: '{{playerName}} 在2011年总决赛期间曾带着手指肌腱伤势继续比赛。', answer: true },
    ],
    'Donovan Mitchell': [
        { text: '{{playerName}} 曾在一场NBA常规赛中得到71分。', answer: true },
    ],
    'Dominique Wilkins': [
        { text: '“人类电影精华”是{{playerName}}广为人知的绰号。', answer: true },
    ],
    'Draymond Green': [
        { text: '{{playerName}} 因累计恶意犯规积分被禁赛，缺席了2016年总决赛第5场。', answer: true },
    ],
    'Dwyane Wade': [
        { text: '{{playerName}} 命中绝杀后曾跳上技术台高喊“这是我的主场”。', answer: true },
    ],
    'Dwight Howard': [
        { text: '{{playerName}} 曾连续三个赛季获得DPOY。', answer: true },
    ],
    'Dylan Harper': [
        { text: '{{playerName}} 是2025年NBA选秀榜眼。', answer: true },
    ],
    'Evan Mobley': [
        { text: '{{playerName}} 是2024-25赛季DPOY。', answer: true },
    ],
    'Franz Wagner': [
        { text: '{{playerName}} 与哥哥莫里茨·瓦格纳曾在魔术成为队友。', answer: true },
    ],
    'Fred VanVleet': [
        { text: '{{playerName}} 是落选秀，却在2019年总决赛MVP投票中获得过选票。', answer: true },
    ],
    'Gary Payton': [
        { text: '“手套”是{{playerName}}因防守能力得到的绰号。', answer: true },
    ],
    'George Gervin': [
        { text: '{{playerName}} 的标志性终结动作是挑指上篮。', answer: true },
    ],
    'George Mikan': [
        { text: '篮球训练中的“麦肯练习”以{{playerName}}命名。', answer: true },
    ],
    'Grant Hill': [
        { text: '{{playerName}} 与杰森·基德共享了1994-95赛季最佳新秀。', answer: true },
    ],
    'Giannis Antetokounmpo': [
        { text: '对手球迷曾在{{playerName}}罚球时集体倒数10秒。', answer: true },
    ],
    'Greg Oden': [
        { text: '{{playerName}} 在2007年选秀中排在杜兰特之前被选中。', answer: true },
    ],
    'Hakeem Olajuwon': [
        { text: '{{playerName}} 曾在同一赛季包揽MVP、DPOY和FMVP。', answer: true },
    ],
    'Isiah Thomas': [
        { text: '{{playerName}} 没有入选1992年美国“梦一队”。', answer: true },
    ],
    'J.R. Smith': [
        { text: '{{playerName}} 在2018年总决赛第1场末段曾因误判比分而没有及时出手。', answer: true },
    ],
    'Jalen Brunson': [
        { text: '{{playerName}} 是2025-26赛季NBA总决赛MVP。', answer: true },
    ],
    'Jalen Williams': [
        { text: '{{playerName}} 出身圣塔克拉拉大学，并在2022年首轮第12顺位被选中。', answer: true },
    ],
    'Jaylen Brown': [
        { text: '{{playerName}} 是2023-24赛季NBA总决赛MVP。', answer: true },
    ],
    'Jason Kidd': [
        { text: '{{playerName}} 执教时曾故意让球员撞自己洒掉饮料，以获得布置战术的时间。', answer: true },
    ],
    'Jason Terry': [
        { text: '{{playerName}} 在2010-11赛季开始前就纹上了总冠军奖杯，随后真的夺冠。', answer: true },
    ],
    'James Harden': [
        { text: '{{playerName}} 在成为常规赛MVP之前，曾以替补身份获得最佳第六人。', answer: true },
    ],
    'James Worthy': [
        { text: '“Big Game James”是{{playerName}}因关键比赛表现得到的绰号。', answer: true },
    ],
    'Jayson Tatum': [
        { text: '{{playerName}} 新秀赛季就随凯尔特人打进了东部决赛。', answer: true },
    ],
    'Jeremy Lamb': [
        { text: '{{playerName}} 曾命中过一记超过半场距离的压哨绝杀。', answer: true },
    ],
    'Jeremy Lin': [
        { text: '“林疯狂”期间，{{playerName}} 曾面对湖人单场得到38分。', answer: true },
    ],
    'Jerry West': [
        { text: '{{playerName}} 是NBA历史上唯一以总决赛失利方身份获得FMVP的球员。', answer: true },
    ],
    'Jimmy Butler': [
        { text: '{{playerName}} 是NBA落选秀。', answer: false },
    ],
    'Joel Embiid': [
        { text: '“相信过程”与{{playerName}}的NBA生涯紧密相关。', answer: true },
    ],
    'John Stockton': [
        { text: '{{playerName}} 同时保持NBA生涯总助攻和总抢断纪录。', answer: true },
    ],
    'John Wall': [
        { text: '{{playerName}} 是2010年NBA选秀状元。', answer: true },
    ],
    'Julius Erving': [
        { text: '{{playerName}} 曾在扣篮大赛中从罚球线起跳完成扣篮。', answer: true },
    ],
    'Kareem Abdul-Jabbar': [
        { text: '{{playerName}} 共获得过6次常规赛MVP。', answer: true },
    ],
    'Karl Malone': [
        { text: '1997年总决赛，皮蓬曾在{{playerName}}罚球前说“邮差周日不上班”。', answer: true },
    ],
    'Kawhi Leonard': [
        { text: '{{playerName}} 在2018-19常规赛只出战60场，却最终夺冠并获得FMVP。', answer: true },
    ],
    'Kevin Durant': [
        { text: '{{playerName}} 在2016年西决3比1领先勇士被逆转后，休赛期加盟了勇士。', answer: true },
    ],
    'Kevin Garnett': [
        { text: '“一切皆有可能”是{{playerName}}夺冠后的经典怒吼。', answer: true },
    ],
    'Kevin McHale': [
        { text: '{{playerName}} 单场得到56分刷新队史纪录后，伯德很快用60分再次改写纪录。', answer: true },
    ],
    'Klay Thompson': [
        { text: '{{playerName}} 曾在单节得到37分。', answer: true },
    ],
    'Kobe Bryant': [
        { text: '{{playerName}} 新秀赛季季后赛对爵士曾连续投出4次三不沾。', answer: true },
    ],
    'Kyrie Irving': [
        { text: '{{playerName}} 在2016年总决赛第7场命中了反超比分的关键三分。', answer: true },
    ],
    'Kyle Anderson': [
        { text: '“人类蠕动精华”和“慢动作”都是球迷对{{playerName}}比赛节奏的调侃。', answer: true },
    ],
    'Larry Bird': [
        { text: '{{playerName}} 曾在三分大赛开始前问其他参赛者“你们谁准备拿第二”。', answer: true },
    ],
    'LaMarcus Aldridge': [
        { text: '{{playerName}} 曾因心律问题宣布退役，之后又复出重返NBA。', answer: true },
    ],
    'LeBron James': [
        { text: '{{playerName}} 前10次打进NBA总决赛时取得4次总冠军。', answer: true },
    ],
    'Luka Dončić': [
        { text: '{{playerName}} 在选秀夜先被老鹰选中，随后被交易到独行侠。', answer: true },
    ],
    'Magic Johnson': [
        { text: '{{playerName}} 新秀赛季就获得了总决赛MVP。', answer: true },
    ],
    'Marc Gasol': [
        { text: '{{playerName}} 获得DPOY的同一赛季只入选了最佳防守阵容二阵。', answer: true },
    ],
    'Mengke Bateer': [
        { text: '{{playerName}} 随马刺获得过NBA总冠军戒指。', answer: true },
    ],
    'Manu Ginóbili': [
        { text: '{{playerName}} 曾在比赛中徒手拍下一只飞进球场的蝙蝠。', answer: true },
    ],
    'Michael Jordan': [
        { text: '{{playerName}} 生涯参加过3场季后赛抢七，全部获胜。', answer: true },
    ],
    'Moses Malone': [
        { text: '{{playerName}} 的“Fo’ Fo’ Fo’”预测最终实际打成了“Fo’ Fi’ Fo’”。', answer: true },
    ],
    'Nick Young': [
        { text: '{{playerName}} 曾在三分球尚未命中时提前转身庆祝，结果篮球弹框而出。', answer: true },
    ],
    'Nikola Jokić': [
        { text: '{{playerName}} 被选中时，电视转播画面正在播放快餐广告。', answer: true },
    ],
    'Oscar Robertson': [
        { text: '{{playerName}} 是NBA历史上第一位达成赛季场均三双的球员。', answer: true },
    ],
    'Paul Pierce': [
        { text: '{{playerName}} 在2008年总决赛曾坐轮椅离场，随后又回到比赛。', answer: true },
    ],
    'Paolo Banchero': [
        { text: '{{playerName}} 是2022年NBA选秀状元。', answer: true },
    ],
    'Patrick Ewing': [
        { text: '{{playerName}} 是NBA首次乐透抽签产生的状元。', answer: true },
    ],
    'Pau Gasol': [
        { text: '{{playerName}} 是NBA历史上首位获得最佳新秀的非美国球员。', answer: true },
    ],
    'Paul George': [
        { text: '“Playoff P”是{{playerName}}为自己的季后赛模式起过的称呼。', answer: true },
    ],
    'Rajon Rondo': [
        { text: '{{playerName}} 曾在一场NBA比赛中送出25次助攻。', answer: true },
    ],
    'Ray Allen': [
        { text: '{{playerName}} 在2013年总决赛第6场命中扳平比分的底角三分。', answer: true },
    ],
    'Robert Parish': [
        { text: '{{playerName}} 保持着NBA常规赛生涯出场次数纪录。', answer: true },
    ],
    'Reggie Miller': [
        { text: '{{playerName}} 曾在季后赛对尼克斯的8.9秒内得到8分。', answer: true },
    ],
    'Russell Westbrook': [
        { text: '{{playerName}} 是NBA历史上第一位连续3个赛季场均三双的球员。', answer: true },
    ],
    'Scottie Pippen': [
        { text: '{{playerName}} 随公牛六次夺冠，六次都与乔丹并肩作战。', answer: true },
    ],
    'Shai Gilgeous-Alexander': [
        { text: '{{playerName}} 是2024-25赛季NBA总决赛MVP。', answer: true },
    ],
    'Shaquille O\'Neal': [
        { text: '“砍鲨战术”得名于{{playerName}}罚球命中率偏低。', answer: true },
    ],
    'Stephen Curry': [
        { text: '{{playerName}} 直到个人第4次夺冠时才首次获得FMVP。', answer: true },
    ],
    'Steve Nash': [
        { text: '{{playerName}} 获得过两次常规赛MVP，但从未打进NBA总决赛。', answer: true },
    ],
    'Stephon Castle': [
        { text: '{{playerName}} 是2024-25赛季NBA最佳新秀。', answer: true },
    ],
    'Sun Yue': [
        { text: '{{playerName}} 随湖人夺冠，成为第二位获得NBA总冠军戒指的中国球员。', answer: true },
    ],
    'Tim Duncan': [
        { text: '{{playerName}} 在替补席大笑被吹技术犯规并驱逐，是在对阵独行侠时发生的。', answer: true },
        { text: '做出该判罚的裁判随后被NBA无限期停赛。', answer: true },
    ],
    'Tony Parker': [
        { text: '{{playerName}} 是首位获得NBA总决赛MVP的欧洲球员。', answer: true },
    ],
    'Toni Kukoč': [
        { text: '“欧洲魔术师”是{{playerName}}球员时期的绰号之一。', answer: true },
    ],
    'Tracy McGrady': [
        { text: '{{playerName}} 的“35秒13分”发生在对阵马刺的比赛中。', answer: true },
    ],
    'Trae Young': [
        { text: '{{playerName}} 曾在同一个NCAA赛季同时领跑全美场均得分和场均助攻。', answer: true },
    ],
    'Tyrese Haliburton': [
        { text: '{{playerName}} 曾在连续两场比赛中合计送出32次助攻且0失误。', answer: true },
    ],
    'Victor Wembanyama': [
        { text: '{{playerName}} 新秀赛季就完成过单场5×5数据。', answer: true },
    ],
    'Vince Carter': [
        { text: '{{playerName}} 在2000年奥运会曾飞跃一名身高2.18米的法国中锋完成扣篮。', answer: true },
    ],
    'Vlade Divac': [
        { text: '{{playerName}} 曾在选秀夜被湖人交易，以换取科比的签约权。', answer: true },
    ],
    'VJ Edgecombe': [
        { text: '{{playerName}} 来自巴哈马，并在2025年NBA选秀第三顺位被选中。', answer: true },
    ],
    'Walt Frazier': [
        { text: '{{playerName}} 在1970年总决赛第7场得到36分并送出19次助攻。', answer: true },
    ],
    'Wang Zhizhi': [
        { text: '{{playerName}} 是第一位正式登陆NBA的中国球员。', answer: true },
    ],
    'Wilt Chamberlain': [
        { text: '{{playerName}} 保持着NBA单场100分纪录。', answer: true },
    ],
    'Yang Hansen': [
        { text: '{{playerName}} 在2025年NBA选秀第16顺位被选中，随后被交易到开拓者。', answer: true },
    ],
    'Yi Jianlian': [
        { text: '{{playerName}} 是2007年NBA选秀第6顺位新秀。', answer: true },
    ],
    'Zach LaVine': [
        { text: '{{playerName}} 曾连续两年获得NBA扣篮大赛冠军。', answer: true },
    ],
    'Zhou Qi': [
        { text: '{{playerName}} 在2016年NBA选秀第43顺位被火箭选中。', answer: true },
    ],
    'Zion Williamson': [
        { text: '{{playerName}} NBA首秀第四节曾连续命中4记三分球。', answer: true },
    ],
    'Yao Ming': [
        { text: '{{playerName}} NBA生涯共入选过8次全明星。', answer: true },
    ],
    '姚明': [
        { text: '{{playerName}} NBA生涯共入选过8次全明星。', answer: true },
    ],
    '易建联': [
        { text: '“嚼绿箭放轻松”是中文球迷围绕{{playerName}}创作的篮球梗。', answer: true },
    ],
    '王治郅': [
        { text: '{{playerName}} 是第一位正式登陆NBA的中国球员。', answer: true },
    ],
    '王仕鹏': [
        { text: '{{playerName}} 曾在2006年世锦赛命中压哨三分绝杀斯洛文尼亚。', answer: true },
    ],
    '刘玉栋': [
        { text: '“战神”是{{playerName}}广为人知的绰号。', answer: true },
    ],
    '胡卫东': [
        { text: '{{playerName}} 曾被球迷称为“中国乔丹”。', answer: true },
    ],
    '朱芳雨': [
        { text: '{{playerName}} 共获得过4次CBA总决赛MVP。', answer: true },
    ],
};

const playerConfig = readJson('篮球CocosProject/assets/resources/data/player_config_fame_v3.json');
const qualityProfiles = readJson('data/star_card_quality_profiles.json').players;
const cbaProfiles = readJson('data/cba_local_award_stars.json').players;
const careerRows = parseCsv(fs.readFileSync(
    path.join(root, 'data/raw/nba-aba-baa-stats/Player Career Info.csv'),
    'utf8',
));
const awardRows = parseCsv(fs.readFileSync(
    path.join(root, 'data/raw/nba-aba-baa-stats/Player Award Shares.csv'),
    'utf8',
));
const endOfSeasonTeamRows = parseCsv(fs.readFileSync(
    path.join(root, 'data/raw/nba-aba-baa-stats/End of Season Teams.csv'),
    'utf8',
));

const careerById = new Map(careerRows.map((row) => [row.player_id, row]));
const qualityBySource = new Map(
    qualityProfiles.map((profile) => [profile.source_player_name, profile]),
);
const cbaByName = new Map(cbaProfiles.map((profile) => [profile.name, profile]));
const awardWinnerCountsByPlayerId = new Map();
for (const award of awardRows) {
    if (award.winner !== 'TRUE') continue;
    const counts = awardWinnerCountsByPlayerId.get(award.player_id) ?? {};
    counts[award.award] = (counts[award.award] ?? 0) + 1;
    awardWinnerCountsByPlayerId.set(award.player_id, counts);
}
const endOfSeasonTeamCountsByPlayerId = new Map();
for (const selection of endOfSeasonTeamRows) {
    const counts = endOfSeasonTeamCountsByPlayerId.get(selection.player_id) ?? {};
    counts[selection.type] = (counts[selection.type] ?? 0) + 1;
    endOfSeasonTeamCountsByPlayerId.set(selection.player_id, counts);
}
const cardsBySource = new Map();
for (const card of playerConfig.players) {
    const cards = cardsBySource.get(card.sourcePlayerName) ?? [];
    cards.push(card);
    cardsBySource.set(card.sourcePlayerName, cards);
}

function number(value) {
    return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function fixed(value) {
    return number(value).toFixed(1);
}

function getPeakCard(cards) {
    return cards.reduce((best, card) => {
        const bestStats = best.sourceStats ?? {};
        const stats = card.sourceStats ?? {};
        const bestScore = number(bestStats.points_per_game) * 4
            + number(bestStats.rebounds_per_game)
            + number(bestStats.assists_per_game);
        const score = number(stats.points_per_game) * 4
            + number(stats.rebounds_per_game)
            + number(stats.assists_per_game);
        return score > bestScore ? card : best;
    }, cards[0]);
}

function countAwards(playerId, ...awardNames) {
    const counts = awardWinnerCountsByPlayerId.get(playerId) ?? {};
    return awardNames.reduce((total, awardName) => total + (counts[awardName] ?? 0), 0);
}

function countEndOfSeasonTeams(playerId, ...teamTypes) {
    const counts = endOfSeasonTeamCountsByPlayerId.get(playerId) ?? {};
    return teamTypes.reduce((total, teamType) => total + (counts[teamType] ?? 0), 0);
}

function honorLabel(count, name) {
    return count > 1 ? `${count}次${name}` : name;
}

function buildHonors(sourceName, playerId, profile, career, cba) {
    const championshipCount = (CHAMPIONSHIP_COUNT_BY_SOURCE[sourceName] ?? 0)
        + (cba?.championshipCount ?? 0);
    const fmvpCount = (
        FMVP_COUNT_BY_SOURCE[sourceName]
        ?? (profile?.has_fmvp ? 1 : 0)
    ) + (cba?.fmvpSeasons?.length ?? 0);
    const mvpCount = (profile?.mvp_seasons?.length ?? 0) + (cba?.mvpSeasons?.length ?? 0);
    const scoringTitleCount = (SCORING_TITLE_COUNT_BY_SOURCE[sourceName] ?? 0)
        + (cba?.scoringTitleCount ?? 0);
    const allNbaCount = profile?.all_nba_count
        ?? countEndOfSeasonTeams(playerId, 'All-NBA', 'All-ABA', 'All-BAA');
    const allStarCount = profile?.all_star_count ?? 0;
    const dpoyCount = countAwards(playerId, 'nba dpoy');
    const allDefenseCount = countEndOfSeasonTeams(playerId, 'All-Defense');
    const sixthManCount = Math.max(
        countAwards(playerId, 'nba smoy'),
        profile?.has_sixth_man ? 1 : 0,
    );
    const rookieCount = countAwards(playerId, 'nba roy', 'aba roy', 'baa roy');
    const honorsByPriority = [
        profile?.is_official_75 ? '75大' : '',
        career?.hof === 'TRUE' ? '名人堂' : '',
        championshipCount > 0 ? honorLabel(championshipCount, '总冠军') : '',
        fmvpCount > 0 ? `${fmvpCount}次FMVP` : '',
        mvpCount > 0 ? honorLabel(mvpCount, 'MVP') : '',
        scoringTitleCount > 0 ? honorLabel(scoringTitleCount, '得分王') : '',
        allNbaCount > 0 ? honorLabel(allNbaCount, '最佳阵容') : '',
        allStarCount > 0 ? honorLabel(allStarCount, '全明星') : '',
        dpoyCount > 0 ? honorLabel(dpoyCount, 'DPOY') : '',
        allDefenseCount > 0 ? honorLabel(allDefenseCount, '最佳防阵') : '',
        sixthManCount > 0 ? honorLabel(sixthManCount, '最佳第六人') : '',
        rookieCount > 0 ? '最佳新秀' : '',
    ];
    const honors = honorsByPriority.filter(Boolean);
    return honors.length > 0 ? honors : ['职业篮球运动员'];
}

function getPeakSeason(card, cba) {
    const stats = card.sourceStats ?? {};
    const peakSeason = cba?.peakSeason ?? {
        season: card.season,
        team: card.team,
        pointsPerGame: number(stats.points_per_game),
        reboundsPerGame: number(stats.rebounds_per_game),
        assistsPerGame: number(stats.assists_per_game),
        stealsPerGame: number(stats.steals_per_game),
        blocksPerGame: number(stats.blocks_per_game),
    };
    return {
        ...peakSeason,
        team: localizeNbaTeamName(peakSeason.team),
    };
}

function buildQuestions(sourceName, card, profile, career, cba, peakSeason) {
    const season = peakSeason.season;
    const team = localizeNbaTeamName(peakSeason.team || card.team) || '其所在球队';
    const mvp = Boolean(profile?.mvp_seasons?.length) || Boolean(cba?.mvpSeasons?.length);
    const funQuestions = FUN_QUESTIONS[sourceName] ?? [];
    const questions = [
        ...funQuestions,
        { text: '{{playerName}} 在 ' + season + ' 赛季效力过 ' + team + '。', answer: true },
        { text: '{{playerName}} 的代表赛季场均得分达到 ' + fixed(peakSeason.pointsPerGame) + ' 分。', answer: true },
        {
            text: '{{playerName}} 的代表赛季场均篮板高于场均助攻。',
            answer: number(peakSeason.reboundsPerGame) > number(peakSeason.assistsPerGame),
        },
        { text: '{{playerName}} 是 NBA75 大球星。', answer: Boolean(profile?.is_official_75) },
        { text: '{{playerName}} 获得过常规赛 MVP。', answer: mvp },
        { text: '{{playerName}} 已入选奈·史密斯篮球名人堂。', answer: career?.hof === 'TRUE' },
    ];
    return questions.map((question, index) => ({
        id: `q${index + 1}`,
        text: question.text,
        answer: question.answer,
        rewardOverall: 5 + index % 3,
    }));
}

const players = {};
for (const [sourceName, cards] of [...cardsBySource.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const sourcePeakCard = getPeakCard(cards);
    const profileSourceName = NBA_PROFILE_SOURCE_OVERRIDES[sourceName] ?? sourceName;
    const profileCards = cardsBySource.get(profileSourceName) ?? cards;
    const peakCard = getPeakCard(profileCards);
    const career = careerById.get(peakCard.playerId);
    const profile = qualityBySource.get(profileSourceName);
    const cba = sourcePeakCard.playerId.startsWith('cba_')
        && profileSourceName === sourceName
        ? cbaByName.get(sourcePeakCard.originalChineseSurname)
            ?? cbaByName.get(sourceName)
        : null;
    const peakSeason = getPeakSeason(peakCard, cba);
    const careerFrom = profile?.from_season ?? (Number(career?.from) || peakCard.season);
    const careerTo = profile?.to_season ?? (Number(career?.to) || peakCard.season);
    const active = Boolean(peakCard.isActiveEra);
    const nationality = NATIONALITY_BY_SOURCE[sourceName]
        ?? NATIONALITY_BY_SOURCE[profileSourceName]
        ?? (peakCard.isChineseNationalSpecial || cba ? '中国' : '美国');
    players[sourceName] = {
        profile: {
            country: nationality,
            careerSpan: CAREER_SPAN_OVERRIDES[sourceName]
                ?? cba?.careerSpan
                ?? `${careerFrom}-${active ? '至今' : careerTo}`,
            honors: buildHonors(sourceName, peakCard.playerId, profile, career, cba),
            peakSeason: {
                season: peakSeason.season,
                team: peakSeason.team,
                pointsPerGame: number(peakSeason.pointsPerGame),
                reboundsPerGame: number(peakSeason.reboundsPerGame),
                assistsPerGame: number(peakSeason.assistsPerGame),
                stealsPerGame: number(peakSeason.stealsPerGame),
                blocksPerGame: number(peakSeason.blocksPerGame),
            },
        },
        questions: buildQuestions(sourceName, peakCard, profile, career, cba, peakSeason),
    };
}

const output = {
    _meta: {
        version: 1,
        description: 'Player knowledge questions and recruitment-result profiles. Generated from canonical card, award, and career datasets.',
        playerCount: Object.keys(players).length,
        questionCountPerPlayer: '7-8',
    },
    players,
};

writeJson('data/player_knowledge.json', output);
writeJson('篮球CocosProject/assets/resources/data/player_knowledge.json', output);
console.log(`Generated player knowledge for ${Object.keys(players).length} players.`);
