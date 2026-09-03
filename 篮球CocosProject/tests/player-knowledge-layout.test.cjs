const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const project = path.resolve(__dirname, '..');
const ts = require(require.resolve('typescript', { paths: [
    project, path.join(project, 'extensions/cocos-code-mode'),
] }));
const source = fs.readFileSync(
    path.join(project, 'assets/scripts/home/HomeUiController.ts'),
    'utf8',
);
const compiled = ts.transpileModule(source, {
    compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
        experimentalDecorators: true,
    },
}).outputText;

class Component {}
class Color {
    constructor(r = 255, g = 255, b = 255, a = 255) {
        Object.assign(this, { r, g, b, a });
    }
}
class UITransform {
    constructor(width = 0, height = 0) {
        this.width = width;
        this.height = height;
        this.anchor = [0.5, 0.5];
    }
    setAnchorPoint(x, y) { this.anchor = [x, y]; }
    setContentSize(width, height) {
        this.width = width;
        this.height = height;
    }
}
class Label {
    constructor() {
        this.enabled = true;
        this.string = '';
        this.fontSize = 55;
        this.lineHeight = 66;
        this.horizontalAlign = 0;
        this.verticalAlign = 0;
        this.useSystemFont = true;
        this.fontFamily = 'Arial';
        this.font = null;
        this.color = new Color(221, 209, 193, 255);
    }
}
class RichText {
    set string(value) {
        this._string = value;
        this.node.getComponent(UITransform).height = 132;
    }
    get string() { return this._string; }
}
class Node {
    constructor(name = '') {
        this.name = name;
        this.children = [];
        this.components = new Map();
        this.position = [0, 0, 0];
    }
    addChild(child) {
        child.parent = this;
        this.children.push(child);
    }
    getChildByName(name) {
        return this.children.find(child => child.name === name) ?? null;
    }
    getComponent(Type) { return this.components.get(Type) ?? null; }
    addComponent(Type) {
        if (Type === RichText && !this.getComponent(UITransform)) {
            this.addComponent(UITransform);
        }
        const component = new Type();
        component.node = this;
        this.components.set(Type, component);
        return component;
    }
    setPosition(x, y, z = 0) { this.position = [x, y, z]; }
}

function loadController(moduleOverrides = {}) {
    const exports = {};
    const cc = new Proxy({
        _decorator: { ccclass: () => target => target },
        Color,
        Component,
        Label,
        Node,
        RichText,
        UITransform,
    }, {
        get(target, key) { return key in target ? target[key] : class {}; },
    });
    const emptyDependency = new Proxy({}, {
        get() { return () => undefined; },
    });
    vm.runInContext(compiled, vm.createContext({
        exports,
        console,
        require(id) {
            if (id === 'cc') return cc;
            const override = moduleOverrides[id];
            return override
                ? new Proxy(override, {
                    get(target, key) {
                        return key in target ? target[key] : () => undefined;
                    },
                })
                : emptyDependency;
        },
    }));
    return new exports.HomeUiController();
}

function createKnowledgeHarness(questionCount = 2, cardOverrides = {}) {
    const questions = Array.from({ length: questionCount }, (_, index) => ({
        id: `q${index + 1}`,
        answer: true,
    }));
    const progress = {
        currentQuestionIndex: 0,
        correctQuestionIds: [],
        wrongQuestionIds: [],
    };
    let card = {
        sourcePlayerName: '测试球员',
        displayName: '测试球员',
        overall: 80,
        activeInjury: { overallPenalty: 20, remainingMatches: 2 },
        ...cardOverrides,
    };
    const rewardInputs = [];
    const renders = [];
    const playerKnowledge = {
        loadPlayerKnowledgeConfig: async () => ({
            players: { 测试球员: { questions } },
        }),
        getPlayerKnowledgeProgress: () => progress,
        recordPlayerKnowledgeAnswer: (_name, questionId, correct) => {
            const target = correct ? progress.correctQuestionIds : progress.wrongQuestionIds;
            if (!target.includes(questionId)) target.push(questionId);
            return correct;
        },
        hasAnsweredPlayerKnowledgeQuestion: (_state, questionId) => (
            progress.correctQuestionIds.includes(questionId)
            || progress.wrongQuestionIds.includes(questionId)
        ),
        calculatePlayerKnowledgeReward: (overall) => {
            rewardInputs.push(overall);
            return 5;
        },
        recordPlayerKnowledgeReward: () => {},
        addPermanentOverallForPlayerKnowledge: (_name, reward) => {
            card = { ...card, overall: card.overall + reward };
            return card;
        },
    };
    const controller = loadController({ './PlayerKnowledge': playerKnowledge });
    controller.playerDetailsPage = {};
    controller.getCurrentKnowledgeCard = () => card;
    controller.renderDetailedPlayerCard = async (...args) => { renders.push(args); };
    return {
        controller,
        progress,
        rewardInputs,
        renders,
        get card() { return card; },
    };
}

test('wrong-answer rich text cannot resize the question box or shrink the later honors text', () => {
    const controller = loadController();
    const questionNode = new Node('问题');
    const transform = questionNode.addComponent(UITransform);
    transform.setContentSize(900, 450);
    const label = questionNode.addComponent(Label);

    controller.setPlayerKnowledgeQuestionText(label, '一道很长的问题', '可惜了，正确答案是：是');

    assert.equal(transform.width, 900);
    assert.equal(transform.height, 450);
    assert.equal(label.enabled, false);
    const feedbackNode = questionNode.getChildByName('答错提示');
    assert.ok(feedbackNode);
    assert.deepEqual(feedbackNode.position, [-450, 225, 0]);
    assert.deepEqual(feedbackNode.getComponent(UITransform).anchor, [0, 1]);

    controller.setPlayerKnowledgeQuestionText(label, '荣誉：MVP\n国籍：中国');

    assert.equal(transform.width, 900);
    assert.equal(transform.height, 450);
    assert.equal(label.enabled, true);
    assert.equal(label.fontSize, 55);
    assert.equal(label.string, '荣誉：MVP\n国籍：中国');
    assert.equal(feedbackNode.getComponent(RichText).enabled, false);
});

test('knowledge answers ignore temporary event values and only correct answers change overall', async () => {
    const wrong = createKnowledgeHarness();
    await wrong.controller.answerPlayerKnowledge(false);

    assert.equal(wrong.card.overall, 80);
    assert.deepEqual(wrong.rewardInputs, []);
    assert.equal(wrong.controller.holdKnowledgeRewardTrend, false);
    assert.equal(wrong.renders[0][2].animateEventOverall, false);

    const correct = createKnowledgeHarness();
    await correct.controller.answerPlayerKnowledge(true);

    assert.deepEqual(correct.rewardInputs, [100]);
    assert.equal(correct.card.overall, 85);
    assert.equal(correct.controller.holdKnowledgeRewardTrend, true);
    assert.equal(correct.renders[0][2].overallAnimationFrom, 80);
    assert.equal(correct.renders[0][2].animateEventOverall, false);
    assert.equal(correct.renders[0][2].releaseKnowledgeRewardTrendOnComplete, false);

    const training = createKnowledgeHarness(2, {
        overall: 120,
        activeInjury: undefined,
        activeTraining: { overallBonus: 20, remainingMatches: 2 },
    });
    await training.controller.answerPlayerKnowledge(true);
    assert.deepEqual(training.rewardInputs, [100]);
    assert.equal(training.card.overall, 125);
});

test('correct-answer green trend stays across questions and releases when all are answered', async () => {
    const ongoing = createKnowledgeHarness();
    await ongoing.controller.answerPlayerKnowledge(true);
    assert.equal(
        ongoing.controller.getDetailedOverallTrend(ongoing.card, undefined),
        'training',
    );

    ongoing.progress.currentQuestionIndex = 1;
    await ongoing.controller.answerPlayerKnowledge(false);
    assert.equal(ongoing.controller.holdKnowledgeRewardTrend, false);
    assert.equal(
        ongoing.controller.getDetailedOverallTrend(ongoing.card, undefined),
        'injury',
    );

    const finalCorrect = createKnowledgeHarness(1);
    await finalCorrect.controller.answerPlayerKnowledge(true);
    assert.equal(
        finalCorrect.renders[0][2].releaseKnowledgeRewardTrendOnComplete,
        true,
    );
});

test('knowledge redraw stops an unfinished event tween instead of replaying it', () => {
    const growthCalls = [];
    const controller = loadController({
        './NumberGrowthAnimator': {
            setGrowingNumber: (...args) => { growthCalls.push(args); },
        },
        './PlayerQualityVisuals': {
            getOverallDefaultColor: () => new Color(255, 255, 255, 255),
            getOverallTrendColor: () => new Color(255, 80, 80, 255),
        },
    });
    const label = new Label();

    controller.animateDetailedOverall(
        label,
        {
            overall: 80,
            activeInjury: { overallPenalty: 20, remainingMatches: 2 },
        },
        'injury',
        { animateEventOverall: false },
    );

    assert.equal(growthCalls.length, 1);
    assert.equal(growthCalls[0][1], 80);
    assert.equal(growthCalls[0][3].animateGrowth, false);
});

test('closing player details clears the held correct-answer trend', () => {
    const controller = loadController();
    controller.holdKnowledgeRewardTrend = true;
    controller.currentKnowledgeSourceName = '测试球员';
    controller.playerDetailsPage = null;

    controller.closePlayerDetails();

    assert.equal(controller.holdKnowledgeRewardTrend, false);
    assert.equal(controller.currentKnowledgeSourceName, null);
});
