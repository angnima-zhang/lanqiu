const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('C:/ProgramData/cocos/editors/Creator/3.8.7/resources/app.asar.unpacked/node_modules/typescript/lib/typescript.js');
const root = 'D:/篮球/篮球CocosProject/assets/';
const clone = value => JSON.parse(JSON.stringify(value));
const compile = source => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;
function ast(file) {
  return ts.createSourceFile(file, fs.readFileSync(root + 'scripts/home/' + file, 'utf8'), ts.ScriptTarget.Latest, true);
}
const keys = ['scoring', 'rebound', 'assist', 'steal', 'block'];
const player = (id, type) => ({
  instanceId: id, templateId: id, sourcePlayerName: id, displayName: id,
  position: 'PG', qualityId: 3, qualityName: 'test', overall: 100,
  attributes: { scoring: 100, rebound: 0, assist: 0, steal: 0, block: 0 },
  acquiredAtMs: 1000, lineupSinceMs: 1000, matchesPlayed: 5, retirementMatchLimit: 3,
  ...(type ? { pendingEvent: { type, occurredAtMs: 1000, descriptionTemplate: 'test', overallDelta: type === 'injury' ? -8 : 5, recoveryMatches: 3, recruit: null } } : {}),
});
const storage = new Map();
const gameAst = ast('GameState.ts');
const functions = ['loadRoster', 'writeRoster', 'clonePlayerCard', 'normalizePlayerCard', 'normalizePendingPlayerEvent', 'normalizeRetirementMatchLimit', 'normalizeActivePlayerInjury', 'normalizeActivePlayerTraining', 'sanitizeInteger', 'sanitizeTimestamp', 'normalizeMatchId'];
const gameContext = {
  exports: {}, ROSTER_SLOT_COUNT: 12, ROSTER_STORAGE_KEY: 'roster', ROSTER_SAVE_VERSION: 2,
  ATTRIBUTE_KEYS: keys, ensureCurrentRosterHistory: () => {},
  sys: { localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) } },
};
vm.runInNewContext(compile(gameAst.statements.filter(n => ts.isFunctionDeclaration(n) && functions.includes(n.name.text)).map(n => n.getText(gameAst)).join('\n')), gameContext);
const legacy = player('legacy', 'recruitment');
legacy.pendingEvent.recruit = { ...player('old-bonus'), templateId: 'bonus' };
legacy.activeInjury = { overallPenalty: 8, remainingMatches: 2 };
const input = [legacy, ...['injury', 'training', 'retirement'].map(t => player(t, t))];
storage.set('roster', JSON.stringify({ version: 2, cards: input }));
const migrated = clone(gameContext.exports.loadRoster());
assert.equal(migrated.filter(Boolean).length, 4, 'keep every player');
assert.equal(migrated[0].pendingEvent, undefined, 'discard obsolete recruitment event');
assert.deepEqual(migrated[0].activeInjury, legacy.activeInjury);
for (let i = 0; i < input.length; i++) {
  for (const key of ['instanceId', 'templateId', 'overall', 'attributes', 'matchesPlayed', 'retirementMatchLimit']) assert.deepEqual(migrated[i][key], input[i][key]);
}
assert.deepEqual(migrated.slice(1, 4).map(c => c.pendingEvent.type), ['injury', 'training', 'retirement']);
assert.equal(JSON.parse(storage.get('roster')).cards[0].pendingEvent, undefined, 'migration persisted');
assert.deepEqual(clone(gameContext.exports.loadRoster()), migrated, 'migration is idempotent');

const config = JSON.parse(fs.readFileSync(root + 'resources/data/player_events.json', 'utf8'));
assert.deepEqual(config.events.map(e => e.id).sort(), ['injury', 'retirement', 'training']);
assert.equal(config.triggerProbability, 0.3);
assert.equal(config.recruitmentCombos, undefined);
let roster = [];
const context = {
  exports: {}, Math, Date, ATTRIBUTE_KEYS: keys, ROSTER_SLOT_COUNT: 12,
  loadRoster: () => clone(roster), saveRoster: value => { roster = clone(value); },
  getManagementEffects: async () => ({ medicalTeamInjuryRiskReduction: 0 }),
};
const controllerAst = ast('PlayerEventController.ts');
const cls = controllerAst.statements.find(ts.isClassDeclaration);
const methods = ['tryCreateRandomEvent', 'createRandomEvent', 'pickWeighted', 'pickEventTarget', 'pickEventDescription', 'resolveOverallDelta', 'getPlayerTraits', 'getRetirementMatchLimit', 'clampTrait', 'applyEventResolution', 'applyOverallDelta', 'isConfigValid'];
vm.runInNewContext(compile('export class Harness {' + cls.members.filter(m => methods.includes(m.name?.getText(controllerAst))).map(m => m.getText(controllerAst)).join('\n') + '}'), context);
const controller = new context.exports.Harness();
controller.initialized = true;
controller.config = clone(config);
assert.equal(controller.isConfigValid(config), true);
assert.equal(controller.isConfigValid({ ...config, events: [...config.events, { id: 'recruitment' }] }), false);
(async () => {
  for (const definition of config.events) {
    controller.config = { ...config, triggerProbability: 1, events: [definition] };
    roster = [player('Tim Duncan'), player('Tony Parker'), ...Array(10).fill(null)];
    await controller.tryCreateRandomEvent(2);
    assert.deepEqual(roster.filter(Boolean).map(c => c.pendingEvent.type), [definition.id, definition.id]);
    for (const withAd of [false, true]) {
      const card = clone(roster[0]);
      const result = [card, ...Array(11).fill(null)];
      controller.applyEventResolution(result, 0, card, withAd);
      if (definition.id === 'retirement' && !withAd) {
        assert.equal(result[0], null);
      } else {
        assert.equal(card.pendingEvent, undefined);
        assert.equal(result.filter(Boolean).length, 1, 'events never add a recruit');
        if (definition.id === 'injury') assert.equal(card.overall, withAd ? 100 : 92);
        if (definition.id === 'training') assert.equal(card.overall, withAd ? 110 : 105);
      }
    }
  }
  console.log(JSON.stringify({ passed: true, legacySavePersisted: true, playerAndStatusesPreserved: true, eventGenerationCases: 3, resolutionCases: 6 }));
})().catch(error => { console.error(error); process.exitCode = 1; });
