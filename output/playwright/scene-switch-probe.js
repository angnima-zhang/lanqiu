() => {
    window.switchRecords = [];
    const find = (name) => {
        let result;
        const visit = (node) => {
            result ??= node.getComponent(name);
            node.children.forEach(visit);
        };
        visit(cc.director.getScene());
        return result;
    };
    window.prepareQaMatch = async () => {
        const controller = find('PreMatchController');
        await controller.ensureDataLoaded();
        await controller.refreshPage();
        return controller;
    };
    window.measureSwitch = async (target, openPreMatch = false) => {
        const controller = find(target === 'Match' ? 'PreMatchController' : 'MatchController');
        const started = performance.now();
        const record = { target, loads: [], maxFrame: 0 };
        const loadScene = cc.director.loadScene;
        const load = cc.resources.load;
        let running = true;
        let last = started;
        const frame = () => {
            if (!running) return;
            const now = performance.now();
            record.maxFrame = Math.max(record.maxFrame, now - last);
            last = now;
            requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
        cc.resources.load = function (...args) {
            const begin = performance.now();
            const callback = args[args.length - 1];
            if (typeof callback === 'function') args[args.length - 1] = function (...values) {
                record.loads.push({ path: args[0], start: begin - started, ms: performance.now() - begin });
                return callback(...values);
            };
            return load.apply(this, args);
        };
        cc.director.loadScene = function (name, callback, ...rest) {
            record.sceneRequested = performance.now() - started;
            return loadScene.call(this, name, (...values) => {
                record.sceneLaunched = performance.now() - started;
                callback?.(...values);
            }, ...rest);
        };
        try {
            if (target === 'Match') controller.startMatch();
            else controller.returnToHomepage(openPreMatch);
            await new Promise((resolve, reject) => {
                const check = () => {
                    const current = find(target === 'Match' ? 'MatchController' : 'PreMatchController');
                    if (cc.director.getScene().name === target && current
                        && (target !== 'Match' || current.courtSimulation)) {
                        record.contentReady = performance.now() - started;
                        setTimeout(resolve, 1000);
                    } else if (performance.now() - started > 20000) reject(new Error('Switch timed out'));
                    else setTimeout(check, 10);
                };
                check();
            });
            switchRecords.push(record);
            return record;
        } finally {
            running = false;
            cc.resources.load = load;
            cc.director.loadScene = loadScene;
        }
    };
    return 'Scene switch probe installed';
}
