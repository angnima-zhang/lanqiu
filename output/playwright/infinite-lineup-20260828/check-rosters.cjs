const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { createHash } = require('node:crypto');
const ts = require('C:/ProgramData/cocos/editors/Creator/3.8.7/resources/app.asar.unpacked/node_modules/typescript/lib/typescript.js');
const root = 'D:/篮球/篮球CocosProject/';
const json = path => JSON.parse(fs.readFileSync(root + 'assets/resources/data/' + path + '.json', 'utf8'));
const compile = source => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;
const progression = { exports: {} };
vm.runInNewContext(compile(fs.readFileSync(root + 'assets/scripts/home/RecruitmentProgression.ts', 'utf8')), progression);
const source = fs.readFileSync(root + 'assets/scripts/home/PreMatchController.ts', 'utf8');
const ast = ts.createSourceFile('PreMatchController.ts', source, ts.ScriptTarget.Latest, true);
const cls = ast.statements.find(node => ts.isClassDeclaration(node));
const names = ['createOpponentRoster', 'ensureOpponentConceptGod', 'applyInfiniteOpponentLineup', 'allocateAttributes', 'shuffleDeterministically', 'drawWeightedIndex', 'createDeterministicRandom', 'getStableSeed'];
const methods = cls.members.filter(m => names.includes(m.name?.getText(ast))).map(m => m.getText(ast)).join('\n');
const context = {
  exports: {}, console, OPPONENT_ROSTER_SIZE: 12, STANDARD_MATCH_COUNT: 100,
  ATTRIBUTE_KEYS: ['scoring', 'rebound', 'assist', 'steal', 'block'],
  resolveOpponentQualityWeights: progression.exports.resolveOpponentQualityWeights,
};
vm.runInNewContext(compile('export class Harness {' + methods + '}'), context);
const pre = new context.exports.Harness();
pre.playerConfig = json('player_config_fame_v3');
pre.playerOvrRanges = json('balance/player_ovr_ranges');
pre.recruitmentProbability = json('balance/recruitment_probability');
pre.conceptGodConfig = json('balance/concept_god_upgrade');
const plain = value => JSON.parse(JSON.stringify(value));
const standard = Array.from({ length: 100 }, (_, i) => plain(pre.createOpponentRoster(i + 1, 'standard-' + (i + 1))));
const standardHashes = standard.map(roster => createHash('sha256').update(JSON.stringify(roster)).digest('hex'));
if (process.argv.includes('--snapshot')) {
  console.log(JSON.stringify(standardHashes));
  process.exit(0);
}
assert.deepEqual(standardHashes, JSON.parse(fs.readFileSync(__dirname + '/standard-baseline.json', 'utf8')), 'all standard rosters must remain unchanged');
assert(standard[99].every(card => card.qualityId === 15), 'final remains all GOAT');
const definitions = new Map(Object.values(pre.conceptGodConfig.conceptGodDefinitions).flat().map(d => [d.conceptGodId, d]));
const ids = [...definitions.keys()].sort();
const signatures = new Set();
for (let round = 1; round <= ids.length + 200; round++) {
  const matchId = 'infinite-' + round;
  const roster = plain(pre.createOpponentRoster(100, matchId));
  assert.equal(roster.length, 12);
  assert.equal(new Set(roster.map(card => card.instanceId)).size, 12);
  assert.deepEqual(roster, plain(pre.createOpponentRoster(100, matchId)), 'retry must preserve roster and OVR');
  const gods = roster.filter(card => card.isConceptGod);
  if (round <= ids.length) {
    assert.equal(gods.length, 1);
    assert.equal(gods[0].conceptGodId, ids[round - 1]);
    assert.equal(roster.filter(card => card.qualityId === 15).length, 11);
  } else {
    assert.equal(gods.length, 12);
    assert.equal(new Set(gods.map(card => card.conceptGodId)).size, 12);
    signatures.add(gods.map(card => card.conceptGodId).join(','));
  }
  for (const card of roster) {
    assert.equal(Object.values(card.attributes).reduce((a, b) => a + b, 0), card.overall);
    const goat = pre.playerOvrRanges.ranges.find(r => r.qualityId === 15);
    const multiplier = card.isConceptGod ? 1.01 : 1;
    assert(card.overall >= Math.floor(goat.minOvr * multiplier) && card.overall <= Math.floor(goat.maxOvr * multiplier));
    if (card.isConceptGod) {
      assert.equal(card.qualityId, 16);
      assert.equal(card.displayName, definitions.get(card.conceptGodId).displayName);
      assert(pre.conceptGodConfig.conceptGodDefinitions[card.sourcePlayerName].some(d => d.conceptGodId === card.conceptGodId));
    }
  }
}
assert.equal(signatures.size, 200, 'later rounds must vary');
for (const round of [1000, 2147483647]) {
  const roster = pre.createOpponentRoster(100, 'infinite-' + round);
  assert.equal(new Set(roster.map(card => card.conceptGodId)).size, 12);
  assert(roster.every(card => card.isConceptGod));
}
console.log(JSON.stringify({ passed: true, standardRostersUnchanged: 100, uniqueLeaders: ids.length, mixedRounds: signatures.size, highRoundBoundaries: 2 }));
