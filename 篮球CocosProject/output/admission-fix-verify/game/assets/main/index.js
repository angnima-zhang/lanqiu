function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return r; }; var t, r = {}, e = Object.prototype, n = e.hasOwnProperty, o = "function" == typeof Symbol ? Symbol : {}, i = o.iterator || "@@iterator", a = o.asyncIterator || "@@asyncIterator", u = o.toStringTag || "@@toStringTag"; function c(t, r, e, n) { return Object.defineProperty(t, r, { value: e, enumerable: !n, configurable: !n, writable: !n }); } try { c({}, ""); } catch (t) { c = function c(t, r, e) { return t[r] = e; }; } function h(r, e, n, o) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype); return c(a, "_invoke", function (r, e, n) { var o = 1; return function (i, a) { if (3 === o) throw Error("Generator is already running"); if (4 === o) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var u = n.delegate; if (u) { var c = d(u, n); if (c) { if (c === f) continue; return c; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (1 === o) throw o = 4, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = 3; var h = s(r, e, n); if ("normal" === h.type) { if (o = n.done ? 4 : 2, h.arg === f) continue; return { value: h.arg, done: n.done }; } "throw" === h.type && (o = 4, n.method = "throw", n.arg = h.arg); } }; }(r, n, new Context(o || [])), !0), a; } function s(t, r, e) { try { return { type: "normal", arg: t.call(r, e) }; } catch (t) { return { type: "throw", arg: t }; } } r.wrap = h; var f = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var l = {}; c(l, i, function () { return this; }); var p = Object.getPrototypeOf, y = p && p(p(x([]))); y && y !== e && n.call(y, i) && (l = y); var v = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(l); function g(t) { ["next", "throw", "return"].forEach(function (r) { c(t, r, function (t) { return this._invoke(r, t); }); }); } function AsyncIterator(t, r) { function e(o, i, a, u) { var c = s(t[o], t, i); if ("throw" !== c.type) { var h = c.arg, f = h.value; return f && "object" == _typeof(f) && n.call(f, "__await") ? r.resolve(f.__await).then(function (t) { e("next", t, a, u); }, function (t) { e("throw", t, a, u); }) : r.resolve(f).then(function (t) { h.value = t, a(h); }, function (t) { return e("throw", t, a, u); }); } u(c.arg); } var o; c(this, "_invoke", function (t, n) { function i() { return new r(function (r, o) { e(t, n, r, o); }); } return o = o ? o.then(i, i) : i(); }, !0); } function d(r, e) { var n = e.method, o = r.i[n]; if (o === t) return e.delegate = null, "throw" === n && r.i["return"] && (e.method = "return", e.arg = t, d(r, e), "throw" === e.method) || "return" !== n && (e.method = "throw", e.arg = new TypeError("The iterator does not provide a '" + n + "' method")), f; var i = s(o, r.i, e.arg); if ("throw" === i.type) return e.method = "throw", e.arg = i.arg, e.delegate = null, f; var a = i.arg; return a ? a.done ? (e[r.r] = a.value, e.next = r.n, "return" !== e.method && (e.method = "next", e.arg = t), e.delegate = null, f) : a : (e.method = "throw", e.arg = new TypeError("iterator result is not an object"), e.delegate = null, f); } function w(t) { this.tryEntries.push(t); } function m(r) { var e = r[4] || {}; e.type = "normal", e.arg = t, r[4] = e; } function Context(t) { this.tryEntries = [[-1]], t.forEach(w, this), this.reset(!0); } function x(r) { if (null != r) { var e = r[i]; if (e) return e.call(r); if ("function" == typeof r.next) return r; if (!isNaN(r.length)) { var o = -1, a = function e() { for (; ++o < r.length;) if (n.call(r, o)) return e.value = r[o], e.done = !1, e; return e.value = t, e.done = !0, e; }; return a.next = a; } } throw new TypeError(_typeof(r) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(v, "constructor", GeneratorFunctionPrototype), c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, u, "GeneratorFunction"), r.isGeneratorFunction = function (t) { var r = "function" == typeof t && t.constructor; return !!r && (r === GeneratorFunction || "GeneratorFunction" === (r.displayName || r.name)); }, r.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, c(t, u, "GeneratorFunction")), t.prototype = Object.create(v), t; }, r.awrap = function (t) { return { __await: t }; }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, a, function () { return this; }), r.AsyncIterator = AsyncIterator, r.async = function (t, e, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(h(t, e, n, o), i); return r.isGeneratorFunction(e) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, g(v), c(v, u, "Generator"), c(v, i, function () { return this; }), c(v, "toString", function () { return "[object Generator]"; }), r.keys = function (t) { var r = Object(t), e = []; for (var n in r) e.unshift(n); return function t() { for (; e.length;) if ((n = e.pop()) in r) return t.value = n, t.done = !1, t; return t.done = !0, t; }; }, r.values = x, Context.prototype = { constructor: Context, reset: function reset(r) { if (this.prev = this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(m), !r) for (var e in this) "t" === e.charAt(0) && n.call(this, e) && !isNaN(+e.slice(1)) && (this[e] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0][4]; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(r) { if (this.done) throw r; var e = this; function n(t) { a.type = "throw", a.arg = r, e.next = t; } for (var o = e.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i[4], u = this.prev, c = i[1], h = i[2]; if (-1 === i[0]) return n("end"), !1; if (!c && !h) throw Error("try statement without catch or finally"); if (null != i[0] && i[0] <= u) { if (u < c) return this.method = "next", this.arg = t, n(c), !0; if (u < h) return n(h), !1; } } }, abrupt: function abrupt(t, r) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var n = this.tryEntries[e]; if (n[0] > -1 && n[0] <= this.prev && this.prev < n[2]) { var o = n; break; } } o && ("break" === t || "continue" === t) && o[0] <= r && r <= o[2] && (o = null); var i = o ? o[4] : {}; return i.type = t, i.arg = r, o ? (this.method = "next", this.next = o[2], f) : this.complete(i); }, complete: function complete(t, r) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && r && (this.next = r), f; }, finish: function finish(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[2] === t) return this.complete(e[4], e[3]), m(e), f; } }, "catch": function _catch(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[0] === t) { var n = e[4]; if ("throw" === n.type) { var o = n.arg; m(e); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(r, e, n) { return this.delegate = { i: x(r), r: e, n: n }, "next" === this.method && (this.arg = t), f; } }, r; }
System.register("chunks:///_virtual/BottomNavItemView.ts", ["./rollupPluginModLoBabelHelpers.js", "cc"], function (t) {
  var e, i, n, o, l, r, a, u, c, s;
  return {
    setters: [function (t) {
      e = t.applyDecoratedDescriptor, i = t.inheritsLoose, n = t.initializerDefineProperty, o = t.assertThisInitialized;
    }, function (t) {
      l = t.cclegacy, r = t._decorator, a = t.Sprite, u = t.Label, c = t.Button, s = t.Component;
    }],
    execute: function execute() {
      var p, b, f, h, m, v, y, g, L;
      l._RF.push({}, "37a1fctxxJPLpV3eCR2lQTa", "BottomNavItemView", void 0);
      var d = r.ccclass,
        w = r.property;
      t("BottomNavItemView", (p = d("BottomNavItemView"), b = w(a), f = w(u), h = w(c), p((y = e((v = function (t) {
        function e() {
          for (var e, i = arguments.length, l = new Array(i), r = 0; r < i; r++) l[r] = arguments[r];
          return e = t.call.apply(t, [this].concat(l)) || this, n(e, "icon", y, o(e)), n(e, "titleLabel", g, o(e)), n(e, "button", L, o(e)), e;
        }
        i(e, t);
        var l = e.prototype;
        return l.onLoad = function () {
          var t, e;
          null != this.titleLabel || (this.titleLabel = null != (t = null == (e = this.node.getChildByName("Text")) ? void 0 : e.getComponent(u)) ? t : null), null != this.button || (this.button = this.node.getComponent(c));
        }, l.setup = function (t) {
          this.titleLabel && (this.titleLabel.string = t);
        }, e;
      }(s)).prototype, "icon", [b], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return null;
        }
      }), g = e(v.prototype, "titleLabel", [f], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return null;
        }
      }), L = e(v.prototype, "button", [h], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return null;
        }
      }), m = v)) || m));
      l._RF.pop();
    }
  };
});
System.register("chunks:///_virtual/CourtSimulationController.ts", ["./rollupPluginModLoBabelHelpers.js", "cc", "./GameState.ts", "./PlayerAssets.ts"], function (t) {
  var e, o, n, r, i, a, s, l, c, h, u, d, m, f, v, g, p, A, T, P, w;
  return {
    setters: [function (t) {
      e = t.applyDecoratedDescriptor, o = t.inheritsLoose, n = t.initializerDefineProperty, r = t.assertThisInitialized, i = t.createForOfIteratorHelperLoose;
    }, function (t) {
      a = t.cclegacy, s = t._decorator, l = t.Node, c = t.Label, h = t.resources, u = t.JsonAsset, d = t.Vec3, m = t.tween, f = t.instantiate, v = t.Sprite, g = t.sys, p = t.Tween, A = t.Component;
    }, function (t) {
      T = t.loadRoster;
    }, function (t) {
      P = t.loadPlayerPortrait, w = t.loadRoundQualityFrame;
    }],
    execute: function execute() {
      var y, b, M, B, k, S, C, N, R, x, D, O, I, H, F;
      a._RF.push({}, "43ba7ayCSpEIrEYkc3PJMsA", "CourtSimulationController", void 0);
      var z = s.ccclass,
        W = s.property,
        j = ["five-out", "four-out-one-in", "pick-and-roll", "low-post", "horns"],
        E = {
          "five-out": {
            ballHandler: 1.2,
            offBall: 1,
            defense: 1.05,
            action: 1
          },
          "four-out-one-in": {
            ballHandler: 1.28,
            offBall: 1.1,
            defense: 1.1,
            action: 1.1
          },
          "pick-and-roll": {
            ballHandler: 1.15,
            offBall: .95,
            defense: 1,
            action: .92
          },
          "low-post": {
            ballHandler: 1.4,
            offBall: 1.2,
            defense: 1.15,
            action: 1.22
          },
          horns: {
            ballHandler: 1.25,
            offBall: 1.05,
            defense: 1.08,
            action: 1
          }
        },
        L = {
          "five-out": {
            2: [[.72, .68], [.6, .5], [.78, .34], [.58, .78]],
            3: [[.68, .22], [.78, .42], [.62, .54], [.86, .12]],
            4: [[.68, .78], [.78, .58], [.62, .46], [.86, .88]]
          },
          "four-out-one-in": {
            1: [[.7, .3], [.58, .52], [.8, .18], [.58, .2]],
            2: [[.7, .7], [.58, .48], [.8, .82], [.58, .8]],
            3: [[.68, .28], [.82, .44], [.7, .62], [.82, .14]]
          },
          "pick-and-roll": {
            2: [[.8, .12], [.62, .34], [.76, .48], [.68, .18]],
            3: [[.8, .88], [.62, .66], [.76, .52], [.68, .82]],
            4: [[.72, .64], [.82, .42], [.68, .3], [.86, .82]]
          },
          "low-post": {
            1: [[.68, .62], [.54, .42], [.74, .28], [.54, .76]],
            2: [[.82, .3], [.62, .48], [.78, .62], [.72, .14]],
            3: [[.62, .7], [.8, .58], [.66, .4], [.72, .86]]
          },
          horns: {
            3: [[.68, .24], [.82, .42], [.64, .56], [.84, .12]],
            4: [[.68, .76], [.82, .58], [.64, .44], [.84, .88]]
          }
        },
        Q = {
          "three-point": 30,
          "free-throw": 30,
          dunk: 15,
          scrimmage: 120
        },
        V = {
          threeDrillMade: ["T01", "T02"],
          threeDrillMissed: ["T03", "T04"],
          freeThrowDrillMade: ["T05", "T06"],
          freeThrowDrillMissed: ["T07", "T08"],
          dunkDrillMade: ["T09", "T10"],
          dunkDrillMissed: ["T11", "T12"],
          scrimmage: ["T13", "T14", "T15", "T16"],
          fiveOut: ["T17", "T18"],
          fourOutOneIn: ["T19", "T20"],
          pickAndRoll: ["T21", "T22"],
          lowPost: ["T23", "T24"],
          horns: ["T25", "T26"],
          reboundSelf: ["T27", "T28"],
          reboundTeammateSingle: ["T29", "T30"],
          reboundTeammateContested: ["T31", "T32"],
          reboundOpponentSingle: ["T33", "T34"],
          reboundOpponentContested: ["T35", "T36"],
          threeMade: ["A01"],
          threeCornerMade: ["A04"],
          threeMissed: ["C01", "C02"],
          jumperMade: ["A06", "A08", "A09"],
          jumperMissed: ["C06"],
          layupMade: ["A16", "A17", "A18", "A19", "A41", "A42"],
          layupMissed: ["C03", "C05"],
          dunkMade: ["A11", "A12", "A13", "A15"],
          dunkMissed: ["C04"],
          assistMade: ["A33", "A34", "A35", "A36", "A37"]
        };
      t("CourtSimulationController", (y = z("CourtSimulationController"), b = W(l), M = W(l), B = W(c), k = W(l), S = W(l), C = W({
        min: 3
      }), y((x = e((R = function (t) {
        function e() {
          for (var e, o = arguments.length, i = new Array(o), a = 0; a < o; a++) i[a] = arguments[a];
          return e = t.call.apply(t, [this].concat(i)) || this, n(e, "ballNode", x, r(e)), n(e, "playersRoot", D, r(e)), n(e, "commentaryLabel", O, r(e)), n(e, "courtRange", I, r(e)), n(e, "rosterContainer", H, r(e)), n(e, "actionIntervalSeconds", F, r(e)), e.actors = [], e.commentaryById = new Map(), e.activeTweenTargets = [], e.cornerNodes = [], e.hoopNodes = [], e.ballDropNodes = [], e.ballRetrievers = [], e.ballRetrieverCarriers = [], e.ballRetrieverPlayers = [null, null], e.basketballs = [], e.ballOwners = new Map(), e.freeThrowNodes = [], e.threePointNodes = [[], []], e.possessionTeam = 0, e.eventToken = 0, e.lastCommentaryId = "", e.lastShooterId = "", e.simulationReady = !1, e.currentMode = "scrimmage", e.currentTactic = "five-out", e.lastTactic = null, e.scrimmageTacticAnchors = new Map(), e.scrimmageTacticRoles = [], e.scrimmageMovementSteps = new Map(), e.activeReboundPlan = null, e.scrimmageActionActors = new Set(), e.boundVisualPlayerIds = new Map(), e.modeRound = 0, e.modeElapsedSeconds = 0, e.drillTurns = [0, 0], e.freeThrowQueues = [[], []], e.hasStartedMode = !1, e.scrimmagePossessionActive = !1, e.runNextEvent = function () {
            if (e.simulationReady && !e.actors.some(function (t) {
              return !t.player;
            })) if ("scrimmage" === e.currentMode && e.scrimmagePossessionActive) e.modeElapsedSeconds += e.actionIntervalSeconds;else {
              e.eventToken += 1;
              var t = e.eventToken;
              e.stopAnimations(), e.refreshRosterBindings(), (!e.hasStartedMode || e.modeElapsedSeconds >= Q[e.currentMode]) && e.startNextMode(), "scrimmage" === e.currentMode ? e.runScrimmageEvent(t) : e.runDrillEvent(t), e.modeRound += 1, e.modeElapsedSeconds += e.actionIntervalSeconds;
            }
          }, e;
        }
        o(e, t);
        var a = e.prototype;
        return a.onLoad = function () {
          var t,
            e,
            o,
            n,
            r,
            i,
            a,
            s,
            l,
            h = "球场模拟" === this.node.name ? this.node : null != (t = null == (e = this.node.parent) ? void 0 : e.getChildByName("球场模拟")) ? t : null;
          null != this.ballNode || (this.ballNode = null != (o = null == h ? void 0 : h.getChildByName("篮球")) ? o : null), null != this.playersRoot || (this.playersRoot = null != (n = null == h ? void 0 : h.getChildByName("players")) ? n : null), null != this.commentaryLabel || (this.commentaryLabel = null != (r = null == h || null == (i = h.getChildByName("文字播报")) || null == (i = i.getChildByName("播报内容")) ? void 0 : i.getComponent(c)) ? r : null), null != this.courtRange || (this.courtRange = null != (a = null == h ? void 0 : h.getChildByName("球场范围")) ? a : null), null != this.rosterContainer || (this.rosterContainer = null != (s = null == h || null == (l = h.parent) || null == (l = l.getChildByName("球队")) ? void 0 : l.getChildByName("阵容槽位")) ? s : null), this.rosterContainer && this.resolveReferenceNodes() ? (this.collectCourtActors(), this.collectBallRetrieverCarriers(), this.refreshRosterBindings(), this.prepareBasketballs(), this.placeBallRetrievers(), this.sortActorDepth(), this.setCommentary("球队正在进行日常训练……")) : this.enabled = !1;
        }, a.start = function () {
          this.enabled && this.loadCommentary();
        }, a.onDisable = function () {
          this.stopSimulation();
        }, a.onDestroy = function () {
          this.eventToken += 1, this.unscheduleAllCallbacks(), this.stopAnimations(), this.ballOwners.clear();
        }, a.lateUpdate = function () {
          for (var t, e = i(this.ballOwners); !(t = e()).done;) {
            var o = t.value,
              n = o[0],
              r = o[1];
            "anchor" === r.visual && r.actor.node.active && n.setWorldPosition(this.getBallAnchorPosition(r.actor, r.kind));
          }
        }, a.refreshRosterBindings = function () {
          var t, e;
          if (!(this.actors.length < 10)) {
            var o = this.readRosterPlayers(),
              n = [].concat(o).sort(function (t, e) {
                return e.ovr - t.ovr || t.originalIndex - e.originalIndex;
              }).slice(0, 10),
              r = new Set(n.map(function (t) {
                return t.id;
              })),
              a = o.filter(function (t) {
                return !r.has(t.id);
              }).sort(function (t, e) {
                return t.ovr - e.ovr || t.originalIndex - e.originalIndex;
              }).slice(0, 2);
            this.ballRetrieverPlayers = [null != (t = a[0]) ? t : null, null != (e = a[1]) ? e : null];
            for (var s = 0; s < this.ballRetrievers.length; s += 1) {
              var l, c;
              this.bindPlayerVisual(this.ballRetrievers[s], null != (l = null == (c = this.ballRetrieverPlayers[s]) ? void 0 : c.card) ? l : null);
            }
            for (var h, u = [[], []], d = [0, 0], m = i(n); !(h = m()).done;) {
              var f = h.value,
                v = d[0] <= d[1] ? 0 : 1;
              u[v].length >= 5 && (v = 1 - v), u[v].push(f), d[v] += f.ovr;
            }
            for (var g = 0; g < 2; g += 1) for (var p = 0; p < 5; p += 1) {
              var A,
                T,
                P = this.actors[5 * g + p],
                w = null != (A = u[g][p]) ? A : null;
              P.team = g, P.facing = 0 === g ? "right" : "left", P.player = w, P.node.active = Boolean(w), this.bindPlayerVisual(P.node, null != (T = null == w ? void 0 : w.card) ? T : null);
            }
          }
        }, a.restartSimulation = function () {
          this.simulationReady && (this.actors.some(function (t) {
            return !t.player;
          }) || this.ballRetrieverPlayers.some(function (t) {
            return !t;
          }) ? this.showWaitingForRoster() : (this.stopAnimations(), this.unschedule(this.runNextEvent), this.restoreActorsHome(), this.placeBallRetrievers(), this.hasStartedMode = !1, this.startNextMode(), this.runNextEvent(), this.schedule(this.runNextEvent, this.actionIntervalSeconds)));
        }, a.loadCommentary = function () {
          var t = this;
          h.load("data/basketball_commentary", u, function (e, o) {
            if (t.isValid && t.enabled) {
              if (e || !o) return console.error("[CourtSimulationController] Failed to load commentary data.", e), void t.setCommentary("训练播报加载失败");
              for (var n, r = o.json, a = i(null != (s = r.entries) ? s : []); !(n = a()).done;) {
                var s,
                  l = n.value;
                t.commentaryById.set(l.id, l);
              }
              t.simulationReady = !0, t.refreshRosterBindings(), t.restartSimulation();
            }
          });
        }, a.runScrimmageEvent = function (t) {
          var e, o, n;
          this.scrimmagePossessionActive = !0;
          var r = this.possessionTeam,
            i = this.getTeamActors(r),
            a = this.getTeamActors(1 - r);
          this.currentTactic = this.pickScrimmageTactic();
          var s = this.prepareScrimmageTactic(i, this.currentTactic),
            l = null != (e = this.findNearestActor(a, s.finisher.node.worldPosition)) ? e : a[0],
            c = s.finishType,
            h = Math.random() < this.getSuccessChance(c, null != (o = null == (n = s.finisher.player) ? void 0 : n.ovr) ? o : 70),
            u = this.basketballs[0];
          this.setBallOwner(u, s.passer), this.activeReboundPlan = h ? null : this.createReboundPlan(s.finisher, i, a, r), this.scrimmageActionActors = new Set(this.getTacticActionActors(s)), this.moveScrimmageActors(s.finisher, s.passer, r), this.executeScrimmageTactic(s, u, h, t), this.showActionCommentary(s.commentaryCategory, s.finisher, l, s.passer);
        }, a.runDrillEvent = function (t) {
          for (var e, o = [], n = 0; n < 2; n += 1) {
            var r,
              i,
              a = this.getTeamActors(n),
              s = this.drillTurns[n] % a.length,
              l = "free-throw" === this.currentMode ? this.freeThrowQueues[n] : a,
              c = "free-throw" === this.currentMode ? l[0] : l[s],
              h = "free-throw" === this.currentMode ? l[1] : l[(s + 1) % l.length],
              u = "dunk" === this.currentMode ? "dunk" : "jump-shot",
              d = null != (r = null == (i = c.player) ? void 0 : i.ovr) ? r : 70,
              m = "free-throw" === this.currentMode ? Math.max(.45, Math.min(.94, .76 + .007 * (d - 70))) : this.getSuccessChance(u, d);
            o.push({
              shooter: c,
              nextShooter: h,
              ball: this.basketballs[n],
              made: Math.random() < m
            }), this.drillTurns[n] = (s + 1) % a.length;
          }
          var f = o[this.modeRound % o.length],
            v = null != (e = this.findNearestActor(this.getTeamActors(1 - f.shooter.team), f.shooter.node.worldPosition)) ? e : f.nextShooter,
            g = "three-point" === this.currentMode ? "threeDrillMade" : "free-throw" === this.currentMode ? "freeThrowDrillMade" : "dunkDrillMade",
            p = "three-point" === this.currentMode ? "threeDrillMissed" : "free-throw" === this.currentMode ? "freeThrowDrillMissed" : "dunkDrillMissed";
          this.showActionCommentary(f.made ? g : p, f.shooter, v, f.nextShooter);
          for (var A = 0, T = o; A < T.length; A++) {
            var P = T[A];
            "three-point" === this.currentMode ? this.playThreePointDrill(P.shooter, P.nextShooter, P.ball, P.made, t) : "free-throw" === this.currentMode ? this.playFreeThrowDrill(P.shooter, P.nextShooter, P.ball, P.made, t) : this.playDunkDrill(P.shooter, P.nextShooter, P.ball, P.made, t);
          }
        }, a.playThreePointDrill = function (t, e, o, n, r) {
          var i = this.getAttackingHoop(t.team);
          this.setBallOwner(o, t), this.jumpActor(t, 1.08, .36), this.shootDrillBall(o, t, e, i, n, .72, r), this.returnDrillShooter(t, r);
        }, a.playFreeThrowDrill = function (t, e, o, n, r) {
          var i = this,
            a = this.getAttackingHoop(t.team),
            s = this.freeThrowNodes[this.hoopNodes.indexOf(a)].worldPosition;
          this.dribbleTo(o, t, s, .38, r, function () {
            i.jumpActor(t, 1.05, .32), i.shootDrillBall(o, t, e, a, n, .68, r);
          }), this.scheduleOnce(function () {
            return i.rotateFreeThrowQueue(t.team, o, r);
          }, 2.15);
        }, a.playDunkDrill = function (t, e, o, n, r) {
          var i = this,
            a = this.getAttackingHoop(t.team),
            s = this.getTakeoffPoint(a, t.team, 72, 0);
          this.setBallOwner(o, t), this.dribbleTo(o, t, s, .86, r, function () {
            i.playDunkMotion(o, t, a, n, r, function (t) {
              i.retrieveDrillBall(o, a, t, e, r);
            });
          }), this.returnDrillShooter(t, r, 2.45);
        }, a.shootDrillBall = function (t, e, o, n, r, i, a) {
          var s,
            l,
            c = this,
            h = null != (s = null == (l = n.getChildByName("进球点")) ? void 0 : l.worldPosition) ? s : n.worldPosition,
            u = r ? h : new d(h.x + (Math.random() < .5 ? -24 : 24), h.y + 10, h.z);
          this.gatherBallForShot(t, e, a, function (e) {
            c.animateBallArc(t, e, u, i, r ? 92 : 76, a, function () {
              c.retrieveDrillBall(t, n, u, o, a);
            });
          });
        }, a.retrieveDrillBall = function (t, e, o, n, r) {
          var i = this,
            a = this.hoopNodes.indexOf(e),
            s = this.ballDropNodes[a],
            l = this.ballRetrievers[a],
            c = this.ballRetrieverCarriers[a];
          this.animateBallArc(t, o, s.worldPosition, .34, 10, r, function () {
            i.pulseNode(l), i.setBallOwner(t, c), i.scheduleOnce(function () {
              r === i.eventToken && i.passBall(t, i.getBallAnchorPosition(c, "hold"), n, "control", r, function () {});
            }, .12);
          });
        }, a.returnDrillShooter = function (t, e, o) {
          var n = this;
          void 0 === o && (o = 2.25), this.scheduleOnce(function () {
            e === n.eventToken && n.moveActor(t, t.modePosition, .35);
          }, o);
        }, a.getTacticActionActors = function (t) {
          return "five-out" === this.currentTactic ? [t.handler, t.roles[1], t.finisher] : "four-out-one-in" === this.currentTactic ? [t.handler, t.roles[4], t.finisher] : "pick-and-roll" === this.currentTactic ? [t.handler, t.roles[1]] : "low-post" === this.currentTactic ? [t.handler, t.finisher] : [t.handler, t.roles[1], t.roles[2]];
        }, a.executeScrimmageTactic = function (t, e, o, n) {
          "five-out" === this.currentTactic ? this.playFiveOutTactic(t, e, o, n) : "four-out-one-in" === this.currentTactic ? this.playFourOutOneInTactic(t, e, o, n) : "pick-and-roll" === this.currentTactic ? this.playPickAndRollTactic(t, e, o, n) : "low-post" === this.currentTactic ? this.playLowPostTactic(t, e, o, n) : this.playHornsTactic(t, e, o, n);
        }, a.playFiveOutTactic = function (t, e, o, n) {
          var r = this,
            i = t.roles[1],
            a = t.finisher,
            s = this.getScrimmageAnchor(i),
            l = this.getScrimmageAnchor(a),
            c = this.getTacticalMoveDuration(i, s, .28),
            h = this.getTacticalMoveDuration(a, l, .34);
          this.moveAndPass(e, t.handler, i, s, c, "control", n, function () {
            r.moveAndPass(e, i, a, l, h, "shoot", n, function () {
              r.jumpActor(a, 1.06, .35), r.shootBall(e, a, r.getAttackingHoop(a.team), o, .72, n);
            });
          });
        }, a.playFourOutOneInTactic = function (t, e, o, n) {
          var r = this,
            i = t.roles[4],
            a = t.finisher,
            s = this.getScrimmageAnchor(i),
            l = this.getTakeoffPoint(this.getAttackingHoop(a.team), a.team, 94, a === t.roles[2] ? -34 : 34),
            c = this.getTacticalMoveDuration(i, s, .32),
            h = this.getTacticalMoveDuration(a, l, .38);
          this.moveAndPass(e, t.handler, i, s, c, "control", n, function () {
            r.moveAndPass(e, i, a, l, h, "shoot", n, function () {
              r.jumpActor(a, 1.1, .42), r.shootBall(e, a, r.getAttackingHoop(a.team), o, .46, n);
            });
          });
        }, a.playPickAndRollTactic = function (t, e, o, n) {
          var r = this,
            i = t.handler,
            a = t.roles[1],
            s = this.getScrimmageAnchor(a),
            l = this.getTacticalMoveDuration(a, s, .28);
          this.moveActor(a, s, l), this.scheduleOnce(function () {
            if (n === r.eventToken) {
              var s = r.getAttackingHoop(i.team),
                l = r.getTakeoffPoint(s, i.team, t.finisher === i ? 174 : 142, -28),
                c = r.getTacticalMoveDuration(i, l, .42);
              r.dribbleTo(e, i, l, c, n, function () {
                if (t.finisher === i) return r.jumpActor(i, 1.06, .34), void r.shootBall(e, i, s, o, .62, n);
                var l = r.getTakeoffPoint(s, a.team, 86, 26),
                  c = r.getTacticalMoveDuration(a, l, .34);
                r.moveAndPass(e, i, a, l, c, "shoot", n, function () {
                  r.jumpActor(a, 1.1, .4), r.shootBall(e, a, s, o, .46, n);
                });
              });
            }
          }, Math.min(.26, .5 * l));
        }, a.playLowPostTactic = function (t, e, o, n) {
          var r = this,
            i = t.finisher,
            a = this.getScrimmageAnchor(i),
            s = this.getTacticalMoveDuration(i, a, .34);
          this.moveAndPass(e, t.handler, i, a, s, "control", n, function () {
            var t = r.getAttackingHoop(i.team),
              a = r.getTakeoffPoint(t, i.team, 112, 28),
              s = r.getTacticalMoveDuration(i, a, .46);
            r.dribbleTo(e, i, a, s, n, function () {
              r.jumpActor(i, 1.08, .38), r.shootBall(e, i, t, o, .58, n);
            });
          });
        }, a.playHornsTactic = function (t, e, o, n) {
          var r = this,
            i = t.handler,
            a = t.roles[1],
            s = t.roles[2],
            l = this.getScrimmageAnchor(a),
            c = this.getScrimmageAnchor(s);
          this.moveActor(a, l, this.getTacticalMoveDuration(a, l, .28)), this.moveActor(s, c, this.getTacticalMoveDuration(s, c, .28));
          var h = this.getScrimmageAnchor(i),
            u = this.getTacticalMoveDuration(i, h, .38);
          this.dribbleTo(e, i, h, u, n, function () {
            r.passBall(e, r.getBallAnchorPosition(i, "hold"), a, "control", n, function () {
              var t = r.getTakeoffPoint(r.getAttackingHoop(s.team), s.team, 88, -28),
                i = r.getTacticalMoveDuration(s, t, .36);
              r.moveAndPass(e, a, s, t, i, "shoot", n, function () {
                r.jumpActor(s, 1.1, .4), r.shootBall(e, s, r.getAttackingHoop(s.team), o, .46, n);
              });
            });
          });
        }, a.moveAndPass = function (t, e, o, n, r, i, a, s) {
          var l = this,
            c = o.node.worldPosition.clone(),
            h = "shoot" === i ? .78 : .68,
            u = d.lerp(new d(), c, n, h),
            m = Math.max(.4, r * h),
            f = Math.max(.12, r - m);
          this.moveActor(o, u, m);
          var v = e.node.worldPosition.clone(),
            g = this.getBallAnchorPosition(e, "hold", v),
            p = this.getBallAnchorPosition(o, "hold", u),
            A = Math.max(.2, Math.min(.38, d.distance(g, p) / 1100)),
            T = Math.max(.12, m - A - .08),
            P = new d();
          d.subtract(P, u, v);
          var w = P.length();
          w > 0 && P.normalize();
          var y = Math.min(96, .32 * w, 240 * T),
            b = Math.max(.08, y / 240),
            M = Math.max(0, T - b),
            B = v.clone().add3f(P.x * y, P.y * y, 0);
          this.scheduleOnce(function () {
            a === l.eventToken && l.dribbleTo(t, e, B, b, a, function () {
              l.passBall(t, l.getBallAnchorPosition(e, "hold"), o, i, a, function () {
                "control" !== i ? (l.moveActor(o, n, f), l.scheduleOnce(function () {
                  a === l.eventToken && s();
                }, f + .08)) : l.dribbleTo(t, o, n, f, a, s);
              });
            });
          }, M);
        }, a.getScrimmageAnchor = function (t) {
          var e, o;
          return null != (e = null == (o = this.scrimmageTacticAnchors.get(t)) ? void 0 : o.clone()) ? e : t.node.worldPosition.clone();
        }, a.getTacticalMoveDuration = function (t, e, o) {
          var n = E[this.currentTactic].action,
            r = d.distance(t.node.worldPosition, e) / (250 / n);
          return Math.max(o, r);
        }, a.playJumpShot = function (t, e, o, n, r, i) {
          var a,
            s = this,
            l = this.getAttackingHoop(t.team),
            c = this.pickThreePointNode(t.team),
            h = null != (a = null == c ? void 0 : c.worldPosition) ? a : this.pointInCourt(0 === t.team ? .66 : .34, .5),
            u = null != c && c.name.includes("底角") ? "threeCornerMade" : "threeMade",
            d = this.getScrimmageActionDuration(.45);
          this.showActionCommentary(r ? u : "threeMissed", t, o, e), this.moveAndPass(n, e, t, h, d, "shoot", i, function () {
            s.shootBall(n, t, l, r, .78, i);
          });
        }, a.playLayup = function (t, e, o, n, r) {
          var i = this,
            a = this.getAttackingHoop(t.team),
            s = this.getTakeoffPoint(a, t.team, 86, Math.random() < .5 ? -32 : 32);
          this.showActionCommentary(n ? "layupMade" : "layupMissed", t, e, t), this.dribbleTo(o, t, s, .82, r, function () {
            i.jumpActor(t, 1.1, .48), i.shootBall(o, t, a, n, .48, r);
          });
        }, a.playDunk = function (t, e, o, n, r) {
          var i = this,
            a = this.getAttackingHoop(t.team),
            s = this.getTakeoffPoint(a, t.team, 72, 0);
          this.showActionCommentary(n ? "dunkMade" : "dunkMissed", t, e, t), this.dribbleTo(o, t, s, .7, r, function () {
            var e,
              s = n ? null : null != (e = i.activeReboundPlan) ? e : {
                scenario: "self",
                winner: t,
                contenders: [t],
                offenseTeam: t.team
              },
              l = s ? i.getReboundPoint(a) : null;
            s && l && i.startReboundPositioning(s, l, .48, r), i.playDunkMotion(o, t, a, n, r, function (e) {
              n ? i.retrieveMadeBall(o, a, e, r) : s && l && i.finishRebound(o, a, e, l, s, t, r);
            });
          });
        }, a.playDunkMotion = function (t, e, o, n, r, i) {
          var a,
            s,
            l = this,
            c = e.node.worldPosition.clone(),
            h = this.getTakeoffPoint(o, e.team, 48, 0),
            u = null != (a = null == (s = o.getChildByName("进球点")) ? void 0 : s.worldPosition) ? a : o.worldPosition,
            f = n ? u.clone() : new d(u.x + (Math.random() < .5 ? -26 : 26), u.y + 12, u.z),
            v = this.trackTweenTarget({
              progress: 0
            }),
            g = !1;
          this.setBallMotionOwner(t, e, "shot"), m(v).to(.62, {
            progress: 1
          }, {
            onUpdate: function onUpdate() {
              if (r === l.eventToken) {
                var o = d.lerp(new d(), c, h, v.progress),
                  n = 52 * Math.sin(v.progress * Math.PI),
                  i = new d(o.x, o.y + n, o.z);
                e.node.setWorldPosition(i), l.applyPerspectiveScale(e, i);
                var a = e.node.scale.clone(),
                  s = 1 + .24 * Math.sin(v.progress * Math.PI);
                if (e.node.setScale(a.x * s, a.y * s, a.z), !g) {
                  var u = Math.min(1, v.progress / .48),
                    m = l.getBallAnchorPosition(e, "hold"),
                    f = l.getBallAnchorPosition(e, "shot");
                  t.setWorldPosition(d.lerp(new d(), m, f, u));
                }
              }
            }
          }).call(function () {
            l.applyPerspectiveScale(e, h), l.sortActorDepth();
          }).start(), this.scheduleOnce(function () {
            if (r === l.eventToken) {
              g = !0, n && l.shakeHoop(o);
              var a = l.getBallAnchorPosition(e, "shot");
              l.animateBallArc(t, a, f, .18, n ? 12 : 32, r, function () {
                i(f);
              });
            }
          }, .3);
        }, a.playAssistFinish = function (t, e, o, n, r, i) {
          var a = this,
            s = this.getAttackingHoop(t.team),
            l = this.getTakeoffPoint(s, t.team, 96, Math.random() < .5 ? -42 : 42),
            c = this.getScrimmageActionDuration(.55);
          this.showActionCommentary(r ? "assistMade" : "layupMissed", t, o, e), this.moveAndPass(n, e, t, l, c, "shoot", i, function () {
            a.jumpActor(t, 1.1, .45), a.shootBall(n, t, s, r, .46, i);
          });
        }, a.shootBall = function (t, e, o, n, r, i) {
          var a,
            s,
            l,
            c = this,
            h = null != (a = null == (s = o.getChildByName("进球点")) ? void 0 : s.worldPosition) ? a : o.worldPosition,
            u = n ? h : new d(h.x, h.y + 12, h.z),
            m = n ? null : null != (l = this.activeReboundPlan) ? l : {
              scenario: "self",
              winner: e,
              contenders: [e],
              offenseTeam: e.team
            },
            f = m ? this.getReboundPoint(o) : null;
          this.gatherBallForShot(t, e, i, function (a) {
            m && f && c.startReboundPositioning(m, f, r, i), c.animateBallArc(t, a, u, r, n ? 95 : 82, i, function () {
              n ? c.retrieveMadeBall(t, o, u, i) : m && f && c.finishRebound(t, o, u, f, m, e, i);
            });
          });
        }, a.retrieveMadeBall = function (t, e, o, n) {
          var r = this,
            i = this.hoopNodes.indexOf(e),
            a = this.ballDropNodes[i],
            s = this.ballRetrievers[i];
          if (a && s) {
            if ("scrimmage" === this.currentMode) {
              var l,
                c = 1 - (e === this.hoopNodes[1] ? 0 : 1),
                h = this.getTeamActors(c),
                u = this.findNearestActor(h, a.worldPosition);
              if (!u) return void (this.scrimmagePossessionActive = !1);
              var d = h.filter(function (t) {
                  return t !== u;
                }),
                m = null != (l = d[Math.floor(Math.random() * d.length)]) ? l : u,
                f = this.getTacticalMoveDuration(u, a.worldPosition, .34);
              return this.moveActor(u, a.worldPosition, f), this.animateBallArc(t, o, a.worldPosition, .32, 8, n), void this.scheduleOnce(function () {
                n === r.eventToken && (r.possessionTeam = c, r.setBallOwner(t, u), r.scheduleOnce(function () {
                  n === r.eventToken && r.passBall(t, r.getBallAnchorPosition(u, "hold"), m, "control", n, function () {
                    r.completeScrimmagePossession(n);
                  });
                }, .18));
              }, Math.max(.34, f));
            }
            this.animateBallArc(t, o, a.worldPosition, .32, 8, n, function () {
              var e = r.getTeamActors(r.possessionTeam),
                o = e[Math.floor(Math.random() * e.length)];
              if (o) {
                var i = "scrimmage" === r.currentMode ? a.worldPosition : s.worldPosition;
                "scrimmage" !== r.currentMode && r.pulseNode(s), r.passBall(t, r.getLegacyBallHandPosition(i), o, "control", n, function () {});
              }
            });
          }
        }, a.completeScrimmagePossession = function (t) {
          var e = this;
          t === this.eventToken && "scrimmage" === this.currentMode && this.scrimmagePossessionActive && (this.scrimmagePossessionActive = !1, this.activeReboundPlan = null, this.scheduleOnce(function () {
            t !== e.eventToken || e.scrimmagePossessionActive || e.runNextEvent();
          }, .3));
        }, a.getReboundPoint = function (t) {
          var e = t === this.hoopNodes[1];
          return this.pointInCourt(e ? .73 + .08 * Math.random() : .19 + .08 * Math.random(), .34 + .32 * Math.random());
        }, a.startReboundPositioning = function (t, e, o, n) {
          for (var r, a = this, s = i(t.contenders); !(r = s()).done;) {
            var l = r.value;
            this.scrimmageActionActors.add(l);
          }
          for (var c = 0; c < t.contenders.length; c += 1) {
            var h = t.contenders[c],
              u = (c / Math.max(1, t.contenders.length - 1) - .5) * Math.PI * .8,
              m = h === t.winner ? 0 : 24,
              f = new d(e.x + Math.cos(u) * m, e.y + Math.sin(u) * m, e.z);
            this.moveActor(h, f, Math.max(.34, .78 * o));
          }
          this.scheduleOnce(function () {
            if (n === a.eventToken) for (var e, o = i(t.contenders); !(e = o()).done;) {
              var r = e.value;
              a.jumpActor(r, r === t.winner ? 1.14 : 1.09, .34);
            }
          }, Math.max(.2, .7 * o));
        }, a.finishRebound = function (t, e, o, n, r, i, a) {
          var s = this;
          this.animateBallArc(t, o, n, .52, 38, a, function () {
            if (s.setBallOwner(t, r.winner), s.possessionTeam = r.winner.team, s.showReboundCommentary(r, i), "self" === r.scenario) {
              var o = s.getTakeoffPoint(e, i.team, 118, Math.random() < .5 ? -34 : 34),
                n = Math.min(.32, s.getScrimmageActionDuration(.45));
              s.dribbleTo(t, r.winner, o, n, a, function () {
                s.setBallOwner(t, r.winner), s.completeScrimmagePossession(a);
              });
            } else s.completeScrimmagePossession(a);
          });
        }, a.showReboundCommentary = function (t, e) {
          var o,
            n = "self" === t.scenario ? "reboundSelf" : "teammate-single" === t.scenario ? "reboundTeammateSingle" : "teammate-contested" === t.scenario ? "reboundTeammateContested" : "opponent-single" === t.scenario ? "reboundOpponentSingle" : "reboundOpponentContested",
            r = null != (o = t.contenders.find(function (e) {
              return e.team !== t.winner.team;
            })) ? o : e;
          this.showActionCommentary(n, t.winner, r, e);
        }, a.prepareBasketballs = function () {
          if (this.ballNode && this.ballNode.parent) {
            var t = f(this.ballNode);
            t.name = "训练篮球2", this.ballNode.parent.addChild(t), t.setWorldPosition(this.ballNode.worldPosition), t.active = !1, this.basketballs = [this.ballNode, t];
          }
        }, a.startNextMode = function () {
          var t = this,
            e = ["three-point", "free-throw", "dunk", "scrimmage"],
            o = this.hasStartedMode ? e.filter(function (e) {
              return e !== t.currentMode;
            }) : e;
          this.currentMode = o[Math.floor(Math.random() * o.length)], this.hasStartedMode = !0, this.modeRound = 0, this.modeElapsedSeconds = 0, this.drillTurns = [0, 0], this.freeThrowQueues = [[], []], this.configureCurrentMode();
        }, a.configureCurrentMode = function () {
          var t = "scrimmage" !== this.currentMode;
          this.scrimmagePossessionActive = !1, this.clearBallOwners(), this.scrimmageTacticAnchors.clear(), this.activeReboundPlan = null, this.scrimmageActionActors.clear(), this.setBasketballCount(t ? 2 : 1);
          for (var e, o = i(this.ballRetrievers); !(e = o()).done;) {
            e.value.active = t;
          }
          if (this.placeBallRetrievers(), "scrimmage" !== this.currentMode) {
            for (var n = 0; n < 2; n += 1) {
              for (var r = this.getTeamActors(n), a = 0 === n ? 1 : 0, s = "free-throw" === this.currentMode ? this.freeThrowQueues[n] = [].concat(r) : r, l = 0; l < s.length; l += 1) {
                var c = s[l];
                c.modePosition = "free-throw" === this.currentMode ? this.getFreeThrowQueuePosition(a, l) : this.threePointNodes[a][l].worldPosition.clone(), c.node.setWorldPosition(c.modePosition), this.applyPerspectiveScale(c, c.modePosition);
              }
              if ("free-throw" === this.currentMode) {
                var h = this.freeThrowQueues[n][0];
                this.setBallOwner(this.basketballs[n], h);
              }
            }
            this.sortActorDepth();
          } else this.placeScrimmageStartingFormation();
        }, a.placeScrimmageStartingFormation = function () {
          for (var t = [[[.18, .24], [.18, .76], [.32, .16], [.32, .5], [.32, .84]], [[.82, .24], [.82, .76], [.68, .16], [.68, .5], [.68, .84]]], e = 0; e < 2; e += 1) for (var o = this.getTeamActors(e), n = t[e], r = 0; r < o.length; r += 1) {
            var i,
              a = o[r],
              s = null != (i = n[r]) ? i : n[n.length - 1],
              l = s[0],
              c = s[1];
            a.modePosition = this.pointInCourt(l, c), a.node.setWorldPosition(a.modePosition), this.applyPerspectiveScale(a, a.modePosition);
          }
          this.sortActorDepth();
        }, a.setBasketballCount = function (t) {
          for (var e = 0; e < this.basketballs.length; e += 1) this.basketballs[e].active = e < t;
        }, a.getFreeThrowQueuePosition = function (t, e) {
          var o = this.freeThrowNodes[t].worldPosition;
          if (0 === e) return o.clone();
          var n = this.hoopNodes[t].worldPosition,
            r = Math.sign(o.x - n.x);
          return new d(o.x + r * e * 54, o.y, o.z);
        }, a.rotateFreeThrowQueue = function (t, e, o) {
          if (o === this.eventToken && "free-throw" === this.currentMode) {
            var n = this.freeThrowQueues[t],
              r = n.shift();
            if (r) {
              n.push(r);
              for (var i = 0 === t ? 1 : 0, a = 0; a < n.length; a += 1) {
                var s = n[a];
                s.modePosition = this.getFreeThrowQueuePosition(i, a), 0 === a ? this.dribbleTo(e, s, s.modePosition, .36, o) : this.moveActor(s, s.modePosition, .36);
              }
            }
          }
        }, a.pickScrimmageTactic = function () {
          var t = this,
            e = this.lastTactic ? j.filter(function (e) {
              return e !== t.lastTactic;
            }) : j,
            o = e[Math.floor(Math.random() * e.length)];
          return this.lastTactic = o, o;
        }, a.createReboundPlan = function (t, e, o, n) {
          var r = ["self", "teammate-single", "teammate-contested", "opponent-single", "opponent-contested"],
            i = r[Math.floor(Math.random() * r.length)],
            a = e.filter(function (e) {
              return e !== t;
            });
          if ("self" === i) return {
            scenario: i,
            winner: t,
            contenders: [t],
            offenseTeam: n
          };
          if ("teammate-single" === i || "teammate-contested" === i) {
            var s = a[Math.floor(Math.random() * a.length)],
              l = "teammate-single" === i ? [s] : [s].concat(this.pickDistinctActors(o, 2));
            return {
              scenario: i,
              winner: s,
              contenders: l,
              offenseTeam: n
            };
          }
          var c = o[Math.floor(Math.random() * o.length)],
            h = "opponent-single" === i ? [c] : [c, t].concat(this.pickDistinctActors(a, 1));
          return {
            scenario: i,
            winner: c,
            contenders: h,
            offenseTeam: n
          };
        }, a.pickDistinctActors = function (t, e) {
          for (var o = [].concat(t), n = []; o.length > 0 && n.length < e;) {
            var r = Math.floor(Math.random() * o.length);
            n.push(o.splice(r, 1)[0]);
          }
          return n;
        }, a.prepareScrimmageTactic = function (t, e) {
          var o,
            n,
            r,
            i = this,
            a = null == (o = this.ballOwners.get(this.basketballs[0])) ? void 0 : o.actor,
            s = null != (n = t.find(function (t) {
              return t === a;
            })) ? n : this.pickShooter(t),
            l = 0,
            c = "fiveOut",
            h = "layup";
          "five-out" === e ? (r = [[.42, .5], [.58, .22], [.58, .78], [.86, .12], [.86, .88]], l = Math.random() < .5 ? 3 : 4, h = "jump-shot") : "four-out-one-in" === e ? (r = [[.4, .5], [.58, .2], [.58, .8], [.82, .14], [.84, .62]], l = Math.random() < .5 ? 2 : 3, c = "fourOutOneIn") : "pick-and-roll" === e ? (r = [[.38, .5], [.48, .5], [.68, .18], [.68, .82], [.86, .82]], h = 0 === (l = Math.random() < .45 ? 0 : 1) ? "jump-shot" : "layup", c = "pickAndRoll") : "low-post" === e ? (r = [[.48, .28], [.54, .76], [.72, .14], [.72, .86], [.88, .62]], l = 4, h = "jump-shot", c = "lowPost") : (r = [[.34, .5], [.55, .4], [.55, .6], [.84, .12], [.84, .88]], l = 2, c = "horns");
          for (var u = [s], m = t.filter(function (t) {
              return t !== s;
            }), f = function f() {
              var t = r[v],
                e = t[0],
                o = t[1],
                n = i.getAttackingHalfPoint(s.team, e, o);
              m.sort(function (t, e) {
                return d.distance(t.node.worldPosition, n) - d.distance(e.node.worldPosition, n);
              }), u.push(m.shift());
            }, v = 1; v < r.length; v += 1) f();
          this.scrimmageTacticAnchors.clear(), this.scrimmageTacticRoles = u, this.scrimmageMovementSteps.clear();
          for (var g = 0; g < u.length; g += 1) {
            var p = r[g],
              A = p[0],
              T = p[1];
            this.scrimmageTacticAnchors.set(u[g], this.getAttackingHalfPoint(u[g].team, A, T));
          }
          return {
            roles: u,
            handler: s,
            finisher: u[l],
            passer: s,
            commentaryCategory: c,
            finishType: h
          };
        }, a.getAttackingHalfPoint = function (t, e, o) {
          var n = 0 === t ? .5 + .46 * e : .5 - .46 * e;
          return this.pointInCourt(n, o);
        }, a.moveScrimmageActors = function (t, e, o) {
          for (var n, r = i(this.actors); !(n = r()).done;) {
            var a = n.value;
            a === t || this.scrimmageActionActors.has(a) || this.moveScrimmageActorContinuously(a, t, e, o, this.eventToken);
          }
        }, a.moveScrimmageActorContinuously = function (t, e, o, n, r) {
          var i = this;
          if (r === this.eventToken && "scrimmage" === this.currentMode && t !== e && !this.scrimmageActionActors.has(t)) {
            var a = t.node.worldPosition.clone(),
              s = this.getScrimmageMovementTarget(t, n),
              l = this.trackTweenTarget({
                progress: 0
              }),
              c = this.getScrimmageMovementDuration(t, o, n, s);
            m(l).to(c, {
              progress: 1
            }, {
              onUpdate: function onUpdate() {
                if (r === i.eventToken && !i.scrimmageActionActors.has(t)) {
                  var e = d.lerp(new d(), a, s, l.progress);
                  t.node.setWorldPosition(e), i.applyPerspectiveScale(t, e);
                }
              }
            }).call(function () {
              i.sortActorDepth();
              var a = Math.max(0, i.scrimmageTacticRoles.indexOf(t)),
                s = t.team === n ? .08 + a % 3 * .04 : .04;
              i.scheduleOnce(function () {
                i.moveScrimmageActorContinuously(t, e, o, n, r);
              }, s);
            }).start();
          }
        }, a.getScrimmageMovementDuration = function (t, e, o, n) {
          var r = E[this.currentTactic],
            i = t === e ? r.ballHandler : t.team === o ? r.offBall : r.defense,
            a = d.distance(t.node.worldPosition, n),
            s = 240 + 40 * Math.random();
          return Math.max(.12, a / s * i);
        }, a.getScrimmageActionDuration = function (t) {
          return "scrimmage" !== this.currentMode ? t : Math.max(.45, 1.45 * t * E[this.currentTactic].action);
        }, a.getScrimmageMovementTarget = function (t, e) {
          var o;
          if (t.team === e) {
            var n = this.scrimmageTacticRoles.indexOf(t),
              r = L[this.currentTactic][n];
            if (r && r.length > 0) {
              var i,
                a = null != (i = this.scrimmageMovementSteps.get(t)) ? i : 0;
              this.scrimmageMovementSteps.set(t, a + 1);
              var s = r[a % r.length],
                l = s[0],
                c = s[1];
              return this.getAttackingHalfPoint(t.team, l, c);
            }
            var h = this.scrimmageTacticAnchors.get(t);
            return h ? h.clone() : this.pointInCourt(.5, .5);
          }
          var u = this.getTeamActors(e),
            m = this.getTeamActors(t.team).indexOf(t),
            f = null != (o = this.scrimmageTacticRoles[Math.max(0, m)]) ? o : u[Math.max(0, m) % u.length],
            v = this.getAttackingHoop(e),
            g = "pick-and-roll" === this.currentTactic && m < 2 ? .2 : "low-post" === this.currentTactic && 4 !== m ? .16 : .12,
            p = d.lerp(new d(), f.node.worldPosition, v.worldPosition, g),
            A = new d();
          d.subtract(A, v.worldPosition, f.node.worldPosition), A.length() > 0 && A.normalize();
          var T = 6 * (m - 2);
          return p.add3f(-A.y * T, A.x * T, 0), p;
        }, a.placeBallRetrievers = function () {
          for (var t = 0; t < this.ballRetrievers.length; t += 1) this.ballRetrievers[t].setWorldPosition(this.ballDropNodes[t].worldPosition);
        }, a.restoreActorsHome = function () {
          for (var t, e = i(this.actors); !(t = e()).done;) {
            var o = t.value;
            o.node.setWorldPosition(o.homePosition), o.node.setScale(o.homeScale);
          }
          this.sortActorDepth();
        }, a.collectCourtActors = function () {
          var t = this;
          this.playersRoot && (this.actors = [].concat(this.playersRoot.children).filter(function (t) {
            return /^球员\d+$/.test(t.name);
          }).sort(function (t, e) {
            return t.name.localeCompare(e.name, "zh-CN", {
              numeric: !0
            });
          }).slice(0, 10).map(function (e, o) {
            var n = {
              node: e,
              ballAnchors: t.collectBallAnchors(e),
              facing: o < 5 ? "right" : "left",
              homePosition: e.worldPosition.clone(),
              modePosition: e.worldPosition.clone(),
              homeScale: e.scale.clone(),
              homePerspectiveFactor: t.getPerspectiveFactor(e.worldPosition),
              player: null,
              team: o < 5 ? 0 : 1
            };
            return t.hideActorBallAnchors(n), n;
          }));
        }, a.collectBallRetrieverCarriers = function () {
          var t = this;
          this.ballRetrieverCarriers = this.ballRetrievers.map(function (e, o) {
            var n = {
              node: e,
              ballAnchors: t.collectBallAnchors(e),
              facing: 0 === o ? "right" : "left"
            };
            return t.hideActorBallAnchors(n), n;
          });
        }, a.collectBallAnchors = function (t) {
          return {
            left: {
              hold: t.getChildByName("持球点-左"),
              dribble: t.getChildByName("运球点-左"),
              shot: t.getChildByName("投射点-左")
            },
            right: {
              hold: t.getChildByName("持球点-右"),
              dribble: t.getChildByName("运球点-右"),
              shot: t.getChildByName("投射点-右")
            }
          };
        }, a.readRosterPlayers = function () {
          return T().map(function (t, e) {
            return t ? {
              id: t.instanceId,
              name: t.displayName,
              ovr: t.overall,
              originalIndex: e,
              card: t
            } : null;
          }).filter(function (t) {
            return Boolean(t);
          });
        }, a.bindPlayerVisual = function (t, e) {
          var o,
            n,
            r,
            i,
            a,
            s = this,
            l = null != (o = null == e ? void 0 : e.instanceId) ? o : "";
          if (this.boundVisualPlayerIds.get(t) !== l) {
            this.boundVisualPlayerIds.set(t, l);
            var c = null != (n = null == (r = t.getChildByName("头像")) ? void 0 : r.getComponent(v)) ? n : null,
              h = null != (i = null == (a = t.getChildByName("边框")) ? void 0 : a.getComponent(v)) ? i : null;
            e ? Promise.all([P(e), w(e.qualityId)]).then(function (o) {
              var n = o[0],
                r = o[1];
              s.boundVisualPlayerIds.get(t) === e.instanceId && (c && (c.spriteFrame = n), h && r && (h.spriteFrame = r));
            }) : c && (c.spriteFrame = null);
          }
        }, a.showWaitingForRoster = function () {
          this.eventToken += 1, this.scrimmagePossessionActive = !1, this.unschedule(this.runNextEvent), this.stopAnimations(), this.clearBallOwners(), this.setBasketballCount(0);
          for (var t, e = i(this.ballRetrievers); !(t = e()).done;) {
            t.value.active = !1;
          }
          this.setCommentary("暂无足够球员，请先完成招募");
        }, a.resolveReferenceNodes = function () {
          var t = this;
          if (!(this.ballNode && this.playersRoot && this.commentaryLabel && this.courtRange && this.rosterContainer)) return console.error("[CourtSimulationController] Missing ball, players, commentary, court range, or roster."), !1;
          return this.cornerNodes = ["左上角", "右上角", "左下角", "右下角"].map(function (e) {
            var o, n;
            return null != (o = null == (n = t.courtRange) ? void 0 : n.getChildByName(e)) ? o : null;
          }).filter(function (t) {
            return Boolean(t);
          }), this.hoopNodes = ["篮筐1", "篮筐2"].map(function (e) {
            var o, n;
            return null != (o = null == (n = t.courtRange) ? void 0 : n.getChildByName(e)) ? o : null;
          }).filter(function (t) {
            return Boolean(t);
          }), this.ballDropNodes = ["进球后下落终点1", "进球后下落终点2"].map(function (e) {
            var o, n;
            return null != (o = null == (n = t.courtRange) ? void 0 : n.getChildByName(e)) ? o : null;
          }).filter(function (t) {
            return Boolean(t);
          }), this.ballRetrievers = ["捡球球员1", "捡球球员2"].map(function (e) {
            var o, n;
            return null != (o = null == (n = t.playersRoot) ? void 0 : n.getChildByName(e)) ? o : null;
          }).filter(function (t) {
            return Boolean(t);
          }), this.freeThrowNodes = ["罚球点2", "罚球点1"].map(function (e) {
            var o, n;
            return null != (o = null == (n = t.courtRange) ? void 0 : n.getChildByName(e)) ? o : null;
          }).filter(function (t) {
            return Boolean(t);
          }), this.threePointNodes = [this.courtRange.children.filter(function (t) {
            return t.name.startsWith("左半场-") && t.name.includes("三分");
          }), this.courtRange.children.filter(function (t) {
            return t.name.startsWith("右半场-") && t.name.includes("三分");
          })], 4 === this.cornerNodes.length && 2 === this.hoopNodes.length && 2 === this.ballDropNodes.length && 2 === this.ballRetrievers.length && 2 === this.freeThrowNodes.length && !this.threePointNodes.some(function (t) {
            return t.length < 5;
          }) || (console.error("[CourtSimulationController] Court corners, hoops, free throws, ball drops, or retrievers are incomplete."), !1);
        }, a.pickAction = function () {
          var t = Math.random();
          return t < .34 ? "jump-shot" : t < .62 ? "layup" : t < .82 ? "dunk" : "assist";
        }, a.getSuccessChance = function (t, e) {
          var o = Math.max(-.12, Math.min(.16, .008 * (e - 70))),
            n = "jump-shot" === t ? .56 : "dunk" === t ? .82 : .7;
          return Math.max(.35, Math.min(.92, n + o));
        }, a.pickShooter = function (t) {
          var e,
            o,
            n,
            r = this,
            i = t.filter(function (t) {
              var e;
              return (null == (e = t.player) ? void 0 : e.id) !== r.lastShooterId;
            }),
            a = null != (e = i[Math.floor(Math.random() * i.length)]) ? e : t[0];
          return this.lastShooterId = null != (o = null == (n = a.player) ? void 0 : n.id) ? o : "", a;
        }, a.pickDifferentActor = function (t, e) {
          var o,
            n = t.filter(function (t) {
              return t !== e;
            });
          return null != (o = n[Math.floor(Math.random() * n.length)]) ? o : e;
        }, a.getTeamActors = function (t) {
          return this.actors.filter(function (e) {
            return e.team === t && e.node.active && Boolean(e.player);
          });
        }, a.getAttackingHoop = function (t) {
          return 0 === t ? this.hoopNodes[1] : this.hoopNodes[0];
        }, a.pickThreePointNode = function (t) {
          var e,
            o = 0 === t ? this.threePointNodes[1] : this.threePointNodes[0];
          return null != (e = o[Math.floor(Math.random() * o.length)]) ? e : null;
        }, a.pointInCourt = function (t, e) {
          var o = new d(),
            n = new d();
          return d.lerp(o, this.cornerNodes[0].worldPosition, this.cornerNodes[1].worldPosition, t), d.lerp(n, this.cornerNodes[2].worldPosition, this.cornerNodes[3].worldPosition, t), d.lerp(new d(), o, n, e);
        }, a.getTakeoffPoint = function (t, e, o, n) {
          var r,
            i,
            a = null != (r = null == (i = this.courtRange) || null == (i = i.getChildByName("中场点")) ? void 0 : i.worldPosition) ? r : this.pointInCourt(.5, .5),
            s = new d();
          d.subtract(s, a, t.worldPosition).normalize();
          var l = new d(-s.y, s.x, 0),
            c = t.worldPosition.clone();
          return c.add3f(s.x * o, s.y * o, 0), c.add3f(l.x * n, l.y * n, 0), c;
        }, a.moveActor = function (t, e, o) {
          var n = this,
            r = t.node.worldPosition.clone(),
            i = this.trackTweenTarget({
              progress: 0
            });
          m(i).to(o, {
            progress: 1
          }, {
            onUpdate: function onUpdate() {
              var o = d.lerp(new d(), r, e, i.progress);
              t.node.setWorldPosition(o), n.applyPerspectiveScale(t, o);
            }
          }).call(function () {
            return n.sortActorDepth();
          }).start();
        }, a.dribbleTo = function (t, e, o, n, r, i) {
          var a = this;
          void 0 === i && (i = function i() {}), this.setBallMotionOwner(t, e, "dribble");
          var s = e.node.worldPosition.clone(),
            l = Math.max(1, Math.round(n / .32)),
            c = this.trackTweenTarget({
              progress: 0
            });
          m(c).to(n, {
            progress: 1
          }, {
            onUpdate: function onUpdate() {
              if (r === a.eventToken) {
                var n = d.lerp(new d(), s, o, c.progress);
                e.node.setWorldPosition(n), a.applyPerspectiveScale(e, n);
                var i = a.getBallAnchorPosition(e, "hold"),
                  h = a.getBallAnchorPosition(e, "dribble"),
                  u = Math.abs(Math.sin(c.progress * Math.PI * l));
                t.setWorldPosition(d.lerp(new d(), i, h, u));
              }
            }
          }).call(function () {
            a.sortActorDepth(), r === a.eventToken && (a.setBallOwner(t, e, "hold"), i());
          }).start();
        }, a.gatherBallForShot = function (t, e, o, n) {
          var r = this;
          this.setBallMotionOwner(t, e, "shot");
          var i = this.trackTweenTarget({
            progress: 0
          });
          m(i).to(.12, {
            progress: 1
          }, {
            onUpdate: function onUpdate() {
              if (o === r.eventToken) {
                var n = r.getBallAnchorPosition(e, "hold"),
                  a = r.getBallAnchorPosition(e, "shot");
                t.setWorldPosition(d.lerp(new d(), n, a, i.progress));
              }
            }
          }).call(function () {
            if (o === r.eventToken) {
              var i = r.getBallAnchorPosition(e, "shot");
              t.setWorldPosition(i), n(i);
            }
          }).start();
        }, a.passBall = function (t, e, o, n, r, i) {
          var a = this,
            s = new d(e.x, e.y, e.z),
            l = this.getBallAnchorPosition(o, "hold"),
            c = .08 + this.getPassFlightDuration(s, o),
            h = .08 / c,
            u = l.x >= s.x ? 1 : -1,
            f = new d(s.x + 18 * u, s.y + 10, s.z),
            v = d.distance(s, l),
            g = Math.min(52, 18 + .06 * v),
            p = this.trackTweenTarget({
              progress: 0
            });
          this.releaseBall(t), t.setWorldPosition(s), m(p).to(c, {
            progress: 1
          }, {
            onUpdate: function onUpdate() {
              if (r === a.eventToken) if (p.progress < h) {
                var e = p.progress / h;
                t.setWorldPosition(d.lerp(new d(), s, f, e));
              } else {
                var n = (p.progress - h) / (1 - h),
                  i = a.getBallAnchorPosition(o, "hold"),
                  l = d.lerp(new d(), f, i, .5);
                l.y += g;
                var c = 1 - n;
                t.setWorldPosition(new d(c * c * f.x + 2 * c * n * l.x + n * n * i.x, c * c * f.y + 2 * c * n * l.y + n * n * i.y, i.z));
              }
            }
          }).call(function () {
            if (r === a.eventToken) {
              if (t.setWorldPosition(a.getBallAnchorPosition(o, "hold")), a.setBallOwner(t, o), "shoot" === n) return void i();
              a.scheduleOnce(function () {
                r === a.eventToken && i();
              }, .16);
            }
          }).start();
        }, a.getPassFlightDuration = function (t, e) {
          var o = this.getBallAnchorPosition(e, "hold");
          return Math.max(.2, Math.min(.38, d.distance(t, o) / 1100));
        }, a.animateBallArc = function (t, e, o, n, r, i, a) {
          var s = this;
          this.releaseBall(t);
          var l = this.trackTweenTarget({
            progress: 0
          });
          t.setWorldPosition(e), m(l).to(n, {
            progress: 1
          }, {
            onUpdate: function onUpdate() {
              if (i === s.eventToken) {
                var n = d.lerp(new d(), e, o, l.progress);
                n.y += Math.sin(l.progress * Math.PI) * r, t.setWorldPosition(n);
              }
            }
          }).call(function () {
            i === s.eventToken && (null == a || a());
          }).start();
        }, a.jumpActor = function (t, e, o) {
          var n = t.node.scale.clone(),
            r = new d(n.x * e, n.y * e, n.z);
          m(t.node).to(.45 * o, {
            scale: r
          }).to(.55 * o, {
            scale: n
          }).start();
        }, a.pulseNode = function (t) {
          var e = t.scale.clone();
          m(t).to(.1, {
            scale: new d(1.08 * e.x, 1.08 * e.y, e.z)
          }).to(.12, {
            scale: e
          }).start();
        }, a.shakeHoop = function (t) {
          var e = t.scale.clone();
          m(t).to(.08, {
            scale: new d(1.08 * e.x, .92 * e.y, e.z)
          }).to(.12, {
            scale: e
          }).start();
        }, a.applyPerspectiveScale = function (t, e) {
          var o = this.getPerspectiveFactor(e) / t.homePerspectiveFactor;
          t.node.setScale(t.homeScale.x * o, t.homeScale.y * o, t.homeScale.z);
        }, a.getPerspectiveFactor = function (t) {
          var e = .5 * (this.cornerNodes[0].worldPosition.y + this.cornerNodes[1].worldPosition.y),
            o = .5 * (this.cornerNodes[2].worldPosition.y + this.cornerNodes[3].worldPosition.y);
          return .82 + .22 * Math.max(0, Math.min(1, (e - t.y) / (e - o)));
        }, a.sortActorDepth = function () {
          [].concat(this.actors).filter(function (t) {
            return t.node.active;
          }).sort(function (t, e) {
            return e.node.worldPosition.y - t.node.worldPosition.y;
          }).forEach(function (t, e) {
            return t.node.setSiblingIndex(e);
          });
        }, a.findNearestActor = function (t, e) {
          for (var o, n = null, r = Number.POSITIVE_INFINITY, a = i(t); !(o = a()).done;) {
            var s = o.value,
              l = d.distance(s.node.worldPosition, e);
            l < r && (n = s, r = l);
          }
          return n;
        }, a.getLegacyBallHandPosition = function (t) {
          return new d(t.x + 15, t.y + 12, t.z);
        }, a.getBallAnchorPosition = function (t, e, o) {
          void 0 === o && (o = t.node.worldPosition);
          var n = t.ballAnchors[t.facing][e];
          if (!n) {
            var r = "dribble" === e ? -6 : "shot" === e ? 30 : 12,
              i = "right" === t.facing ? 1 : -1;
            return new d(o.x + 15 * i, o.y + r, o.z);
          }
          var a = t.node.worldPosition,
            s = n.worldPosition;
          return new d(o.x + s.x - a.x, o.y + s.y - a.y, o.z + s.z - a.z);
        }, a.setBallOwner = function (t, e, o) {
          void 0 === o && (o = "hold");
          var n = this.ballOwners.get(t);
          n && this.hideActorBallAnchors(n.actor), this.ballOwners.set(t, {
            actor: e,
            kind: o,
            visual: "anchor"
          }), this.showActorBallAnchor(e, o), t.setWorldPosition(this.getBallAnchorPosition(e, o)), t.active = !1;
        }, a.setBallMotionOwner = function (t, e, o) {
          var n = this.ballOwners.get(t);
          n && this.hideActorBallAnchors(n.actor), this.hideActorBallAnchors(e), this.ballOwners.set(t, {
            actor: e,
            kind: o,
            visual: "motion"
          }), t.setWorldPosition(this.getBallAnchorPosition(e, "hold")), t.active = !0;
        }, a.releaseBall = function (t) {
          var e = this.ballOwners.get(t);
          e && this.hideActorBallAnchors(e.actor), this.ballOwners["delete"](t), t.active = !0;
        }, a.clearBallOwners = function () {
          for (var t = 0, e = [].concat(this.actors, this.ballRetrieverCarriers); t < e.length; t++) {
            var o = e[t];
            this.hideActorBallAnchors(o);
          }
          this.ballOwners.clear();
        }, a.hideActorBallAnchors = function (t) {
          for (var e = 0, o = [t.ballAnchors.left, t.ballAnchors.right]; e < o.length; e++) for (var n = o[e], r = 0, i = [n.hold, n.dribble, n.shot]; r < i.length; r++) {
            var a = i[r];
            a && (a.active = !1);
          }
        }, a.showActorBallAnchor = function (t, e) {
          this.hideActorBallAnchors(t);
          var o = t.ballAnchors[t.facing][e];
          o && (o.active = !0);
        }, a.showActionCommentary = function (t, e, o, n) {
          var r,
            i,
            a,
            s,
            l,
            c,
            h,
            u,
            d = this,
            m = null != (r = V[t]) ? r : [],
            f = m.filter(function (t) {
              return t !== d.lastCommentaryId;
            }),
            v = (f.length > 0 ? f : m)[Math.floor(Math.random() * Math.max(1, f.length || m.length))],
            p = this.commentaryById.get(v);
          if (p) {
            this.lastCommentaryId = v;
            for (var A = (null == (i = g.localStorage.getItem("basketball.team.name")) ? void 0 : i.trim()) || "我的球队", T = {
                "{{player}}": null != (a = null == (s = e.player) ? void 0 : s.name) ? a : e.node.name,
                "{{defender}}": null != (l = null == (c = o.player) ? void 0 : c.name) ? l : o.node.name,
                "{{teammate}}": null != (h = null == (u = n.player) ? void 0 : u.name) ? h : n.node.name,
                "{{team}}": A + (0 === e.team ? "A队" : "B队"),
                "{{opponent_team}}": A + (0 === e.team ? "B队" : "A队"),
                "{{coach}}": "球队教练"
              }, P = p.text, w = 0, y = Object.entries(T); w < y.length; w++) {
              var b = y[w],
                M = b[0],
                B = b[1];
              P = P.split(M).join(B);
            }
            this.setCommentary(P);
          } else {
            var k, S;
            this.setCommentary((null != (k = null == (S = e.player) ? void 0 : S.name) ? k : "球员") + "正在进行训练。");
          }
        }, a.setCommentary = function (t) {
          this.commentaryLabel && (this.commentaryLabel.string = t);
        }, a.trackTweenTarget = function (t) {
          return this.activeTweenTargets.push(t), t;
        }, a.stopAnimations = function () {
          for (var t, e = i(this.activeTweenTargets); !(t = e()).done;) {
            var o = t.value;
            p.stopAllByTarget(o);
          }
          this.activeTweenTargets.length = 0;
          for (var n, r = i(this.actors); !(n = r()).done;) {
            var a = n.value;
            p.stopAllByTarget(a.node);
          }
          for (var s, l = i(this.hoopNodes); !(s = l()).done;) {
            var c = s.value;
            p.stopAllByTarget(c);
          }
          for (var h, u = i(this.ballRetrievers); !(h = u()).done;) {
            var d = h.value;
            p.stopAllByTarget(d);
          }
          for (var m, f = i(this.basketballs); !(m = f()).done;) {
            var v = m.value;
            p.stopAllByTarget(v);
          }
        }, a.stopSimulation = function () {
          this.eventToken += 1, this.scrimmagePossessionActive = !1, this.unscheduleAllCallbacks(), this.stopAnimations(), this.clearBallOwners(), this.restoreActorsHome(), this.setBasketballCount(1);
          for (var t, e = i(this.ballRetrievers); !(t = e()).done;) {
            t.value.active = !0;
          }
          this.placeBallRetrievers(), this.simulationReady = !1;
        }, e;
      }(A)).prototype, "ballNode", [b], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return null;
        }
      }), D = e(R.prototype, "playersRoot", [M], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return null;
        }
      }), O = e(R.prototype, "commentaryLabel", [B], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return null;
        }
      }), I = e(R.prototype, "courtRange", [k], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return null;
        }
      }), H = e(R.prototype, "rosterContainer", [S], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return null;
        }
      }), F = e(R.prototype, "actionIntervalSeconds", [C], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return 3;
        }
      }), N = R)) || N));
      a._RF.pop();
    }
  };
});
System.register("chunks:///_virtual/FullScreenEntrance.ts", ["./rollupPluginModLoBabelHelpers.js", "cc"], function (n) {
  var e, t, r, o, u, a;
  return {
    setters: [function (n) {
      e = n.createForOfIteratorHelperLoose;
    }, function (n) {
      t = n.cclegacy, r = n.Tween, o = n.UITransform, u = n.UIOpacity, a = n.tween;
    }],
    execute: function execute() {
      n({
        playFullScreenEntrance: function playFullScreenEntrance(n, t) {
          var f, p, s;
          void 0 === t && (t = {});
          l(n), n.active = !0;
          for (var d, g = null != (f = null == (p = n.parent) ? void 0 : p.getComponent(o)) ? f : n.getComponent(o), h = (F = null != (s = t.backgroundNodes) ? s : n.children.filter(function (n) {
              if (i.has(n.name)) return !0;
              var e = n.getComponent(o);
              return Boolean(g && e && e.width >= .9 * g.width && e.height >= .9 * g.height);
            }), [].concat(new Set(F))), v = new Set(h), m = t.moduleGroups ? function (n, e) {
              var t = new Set(e);
              return n.map(function (n, e) {
                return {
                  group: n,
                  index: e
                };
              }).sort(function (n, e) {
                var t, r;
                return (null != (t = n.group.order) ? t : n.index) - (null != (r = e.group.order) ? r : e.index);
              }).map(function (n) {
                return n.group.nodes.filter(function (n) {
                  return !(!n.active || t.has(n)) && (t.add(n), !0);
                });
              }).filter(function (n) {
                return n.length > 0;
              });
            }(t.moduleGroups, v) : n.children.filter(function (n) {
              return n.active && !v.has(n);
            }).sort(function (n, e) {
              return e.position.y - n.position.y;
            }).map(function (n) {
              return [n];
            }), y = h.map(function (n) {
              var e;
              return null != (e = n.getComponent(u)) ? e : n.addComponent(u);
            }), w = m.map(function (n) {
              return n.map(function (n) {
                var e;
                return null != (e = n.getComponent(u)) ? e : n.addComponent(u);
              });
            }), E = w.reduce(function (n, e) {
              return n.push.apply(n, e), n;
            }, [].concat(y)), S = e(E); !(d = S()).done;) {
            var C = d.value;
            r.stopAllByTarget(C), C.opacity = 0;
          }
          var F;
          if (0 === E.length) return Promise.resolve();
          var b = .2 + .08 * Math.max(0, w.length - 1);
          return new Promise(function (e) {
            var t = !1,
              r = function r() {
                var o;
                t || (t = !0, (null == (o = c.get(n)) ? void 0 : o.finish) === r && c["delete"](n), e());
              };
            c.set(n, {
              opacities: E,
              finish: r
            }), y.forEach(function (n, e) {
              var t = a(n).to(b, {
                opacity: 255
              }, {
                easing: "quadOut"
              });
              0 === w.length && e === y.length - 1 && t.call(r), t.start();
            }), 0 !== w.length && w.forEach(function (n, e) {
              n.forEach(function (t, o) {
                var u = a(t).delay(.08 * e).to(.2, {
                  opacity: 255
                }, {
                  easing: "quadOut"
                });
                e === w.length - 1 && o === n.length - 1 && u.call(r), u.start();
              });
            });
          });
        },
        stopFullScreenEntrance: l
      }), t._RF.push({}, "fbbf2d+Y8ZEy5/3wKVj2Cuh", "FullScreenEntrance", void 0);
      var i = new Set(["bg", "bg-001"]),
        c = new WeakMap();
      function l(n) {
        var e = c.get(n);
        e && (e.opacities.forEach(function (n) {
          r.stopAllByTarget(n), n.opacity = 255;
        }), e.finish());
      }
      t._RF.pop();
    }
  };
});
System.register("chunks:///_virtual/GameFont.ts", ["./rollupPluginModLoBabelHelpers.js", "cc"], function (e) {
  var o, n, t;
  return {
    setters: [function (e) {
      o = e.createForOfIteratorHelperLoose;
    }, function (e) {
      n = e.cclegacy, t = e.Label;
    }],
    execute: function execute() {
      e("applyGameFont", function e(n, r) {
        for (var a, u = o(n.getComponents(t)); !(a = u()).done;) {
          a.value.font = r;
        }
        for (var c, l = o(n.children); !(c = l()).done;) {
          var s = c.value;
          e(s, r);
        }
      }), n._RF.push({}, "1d3a8Sor5xAsYiuf5AyMA6/", "GameFont", void 0), n._RF.pop();
    }
  };
});
System.register("chunks:///_virtual/GameState.ts", ["./rollupPluginModLoBabelHelpers.js", "cc"], function (e) {
  var t, n, a, r, i, o, u, s;
  return {
    setters: [function (e) {
      t = e["extends"], n = e.asyncToGenerator, a = e.createForOfIteratorHelperLoose;
    }, function (e) {
      r = e.cclegacy, i = e.EventTarget, o = e.sys, u = e.resources, s = e.JsonAsset;
    }],
    execute: function execute() {
      e({
        add: function add(e) {
          return G(e);
        },
        addBudget: G,
        advanceSeasonAfterWin: function advanceSeasonAfterWin(e) {
          var t = Y();
          if (!ie(t, e) || t.goatCompleted || t.lastAdvancedMatchId === e) return !1;
          t.lastAdvancedMatchId = e, t.officialWins = Math.min(l, t.officialWins + 1), t.matchNumber < 98 ? t.matchNumber += 1 : t.seasonNumber < 13 ? (t.seasonNumber += 1, t.matchNumber = 1) : t.goatCompleted = !0;
          return K(t), !0;
        },
        calculateTeamOverall: function calculateTeamOverall(e, t) {
          var n = e.reduce(function (e, t) {
            var n;
            return Math.min(l, e + (null != (n = null == t ? void 0 : t.overall) ? n : 0));
          }, 0);
          return Math.min(l, Math.floor(n * (1 + Math.max(0, t))));
        },
        emitMatchSettled: function emitMatchSettled(e) {
          var n = oe(e.matchId);
          if (!n) return;
          var a = Y();
          a.lastSettledMatchId !== n && (a.lastSettledMatchId = n, K(a));
          var r = t({}, e, {
            matchId: n,
            baseReward: he(e.baseReward),
            adReward: he(e.adReward),
            seasonState: t({}, Y())
          });
          h.emit(g, r);
        },
        getBalance: function getBalance(e) {
          void 0 === e && (e = 100);
          return D(e);
        },
        getBudget: D,
        getConceptGodAcquisitionCount: function getConceptGodAcquisitionCount() {
          return Math.max(0, pe(le().conceptGodAcquiredCount, 0));
        },
        getCurrentMatchId: Q,
        getManagementEffects: function getManagementEffects() {
          return U.apply(this, arguments);
        },
        getManagementUpgradeCost: function getManagementUpgradeCost(e) {
          return J.apply(this, arguments);
        },
        getPlayerAcquisitionCount: function getPlayerAcquisitionCount(e) {
          return pe(le().acquiredCounts[me(e)], 0);
        },
        getPlayerServiceDurationMs: function getPlayerServiceDurationMs(e, t, n) {
          void 0 === t && (t = w());
          void 0 === n && (n = Date.now());
          var a = me(e),
            r = ve(le().serviceDurationMsByDisplayName[a]);
          return t.reduce(function (e, t) {
            var r;
            if (!t || me(t.displayName) !== a) return e;
            var i = null != (r = t.lineupSinceMs) ? r : t.acquiredAtMs,
              o = Math.max(0, n - i);
            return Math.min(Number.MAX_SAFE_INTEGER, e + o);
          }, r);
        },
        getRosterSnapshot: P,
        getTeamAbbreviation: function getTeamAbbreviation(e, t) {
          var n;
          void 0 === t && (t = "我");
          return null != (n = Array.from(e.trim())[0]) ? n : t;
        },
        loadGameSettings: function loadGameSettings() {
          var e = {
              musicEnabled: !0,
              soundEnabled: !0
            },
            t = o.localStorage.getItem(N);
          if (!t) return V(e), e;
          try {
            var n = JSON.parse(t);
            return {
              musicEnabled: "boolean" == typeof n.musicEnabled ? n.musicEnabled : e.musicEnabled,
              soundEnabled: "boolean" == typeof n.soundEnabled ? n.soundEnabled : e.soundEnabled
            };
          } catch (t) {
            return e;
          }
        },
        loadIdleState: function loadIdleState(e) {
          void 0 === e && (e = Date.now());
          var t = {
              version: 2,
              accrualStartedAtMs: e,
              lastOnlineTickAtMs: e,
              offlineStartedAtMs: null,
              pendingOfflineSeconds: 0,
              unpromptedOfflineSeconds: 0
            },
            n = o.localStorage.getItem(y);
          if (!n) return X(t), t;
          try {
            var a = JSON.parse(n),
              r = Number(a.offlineStartedAtMs);
            return {
              version: 2,
              accrualStartedAtMs: be(a.accrualStartedAtMs, e),
              lastOnlineTickAtMs: be(a.lastOnlineTickAtMs, e),
              offlineStartedAtMs: Number.isFinite(r) && r > 0 ? Math.floor(r) : null,
              pendingOfflineSeconds: Math.max(0, Number.isFinite(Number(a.pendingOfflineSeconds)) ? Number(a.pendingOfflineSeconds) : 0),
              unpromptedOfflineSeconds: Math.max(0, Number.isFinite(Number(a.unpromptedOfflineSeconds)) ? Number(a.unpromptedOfflineSeconds) : 0)
            };
          } catch (e) {
            return t;
          }
        },
        loadJson: z,
        loadManagementEffectsConfig: H,
        loadManagementLevels: F,
        loadRoster: w,
        loadSeasonState: Y,
        migratePlayerHistoryToDisplayNames: function migratePlayerHistoryToDisplayNames(e, t) {
          for (var n = le(), a = new Map(e.map(function (e) {
              return [e.id, me(e.displayName)];
            })), r = {}, i = {}, o = 0, u = Object.entries(n.acquiredCounts); o < u.length; o++) {
            var s,
              l = u[o],
              c = l[0],
              d = pe(l[1], 0);
            if (!(d <= 0)) {
              var m = null != (s = a.get(c)) ? s : me(c);
              r[m] = pe(r[m], 0) + d;
            }
          }
          for (var f = de(t), v = 0, g = Object.entries(f); v < g.length; v++) {
            var h = g[v],
              p = h[0],
              M = h[1];
            r[p] = Math.max(pe(r[p], 0), M);
          }
          for (var S = 0, b = Object.entries(n.serviceDurationMsByDisplayName); S < b.length; S++) {
            var N,
              y = b[S],
              A = y[0],
              E = y[1],
              T = null != (N = a.get(A)) ? N : me(A);
            i[T] = Math.min(Number.MAX_SAFE_INTEGER, ve(i[T]) + ve(E));
          }
          ce({
            version: 4,
            acquiredCounts: r,
            conceptGodAcquiredCount: n.conceptGodAcquiredCount,
            serviceDurationMsByDisplayName: i
          });
        },
        recordConceptGodAcquisition: function recordConceptGodAcquisition() {
          var e = le();
          return e.version = 4, e.conceptGodAcquiredCount = Math.max(0, pe(e.conceptGodAcquiredCount, 0)) + 1, ce(e), e.conceptGodAcquiredCount;
        },
        recordPlayerAcquisition: function recordPlayerAcquisition(e) {
          var t = le(),
            n = me(e.displayName),
            a = pe(t.acquiredCounts[n], 0);
          return t.version = 4, t.acquiredCounts[n] = a + 1, ce(t), t.acquiredCounts[n];
        },
        saveGameSettings: V,
        saveIdleState: X,
        saveManagementLevels: k,
        saveRoster: function saveRoster(e) {
          x(e, !0);
        },
        saveSeasonState: K,
        setBudget: R,
        settleAdMatchReward: function settleAdMatchReward(e, t) {
          return re(e, t, "ad");
        },
        settleBaseMatchReward: function settleBaseMatchReward(e, t) {
          return re(e, t, "base");
        },
        trySpend: function trySpend(e) {
          return q(e);
        },
        trySpendBudget: q,
        upgradeManagementWithAd: function upgradeManagementWithAd(e, n) {
          var a,
            r = F();
          if (!$(e)) return Z(!1, "invalid-role", r, 0, 0);
          var i = r[e];
          if (i >= E) return Z(!1, "max-level", r, i, 0);
          if (i >= Se(n)) return Z(!1, "team-level-cap", r, i, 0);
          var o = t({}, r, ((a = {})[e] = i + 1, a));
          return k(o), Z(!0, "ok", o, i, 0);
        },
        upgradeManagementWithBudget: function upgradeManagementWithBudget(e, t) {
          return W.apply(this, arguments);
        }
      }), r._RF.push({}, "7ee74HBOgBJko857oW+3i03", "GameState", void 0);
      var l = e("INT32_MAX", 2147483647),
        c = e("ROSTER_SLOT_COUNT", 12),
        d = e("GAME_STATE_EVENT_BUDGET_CHANGED", "game-state-budget-changed"),
        m = e("GAME_STATE_EVENT_ROSTER_CHANGED", "game-state-roster-changed"),
        f = (e("GAME_STATE_EVENT_TEAM_IDENTITY_CHANGED", "game-state-team-identity-changed"), e("GAME_STATE_EVENT_PLAYER_DETAILS_REQUESTED", "game-state-player-details-requested"), e("GAME_STATE_EVENT_MANAGEMENT_CHANGED", "game-state-management-changed")),
        v = e("GAME_STATE_EVENT_SEASON_CHANGED", "game-state-season-changed"),
        g = e("GAME_STATE_EVENT_MATCH_SETTLED", "game-state-match-settled"),
        h = e("gameStateEvents", new i()),
        p = e("BUDGET_STORAGE_KEY", "basketball.economy.budget.v1"),
        M = e("ROSTER_STORAGE_KEY", "basketball.roster.v1"),
        S = (e("TEAM_NAME_STORAGE_KEY", "basketball.team.name"), e("TEAM_ABBREVIATION_STORAGE_KEY", "basketball.team.abbreviation"), "basketball.management.v1"),
        b = "basketball.player-history.v1",
        N = "basketball.settings.v1",
        y = "basketball.idle.v1",
        A = "basketball.season.v1",
        E = 520,
        T = 1e6,
        I = e("ATTRIBUTE_KEYS", ["scoring", "rebound", "assist", "steal", "block"]);
      var C = {
          operationPresident: 0,
          headCoach: 0,
          scoutingDirector: 0,
          medicalTeam: 0,
          mediaTeam: 0
        },
        O = {
          operationPresidentBudgetBonus: 0,
          headCoachBattleOvrBonus: 0,
          scoutingDirectorHighestQualityWeightBonus: 0,
          medicalTeamOvrRollPercentileShift: 0,
          mediaTeamOfflineBudgetBonus: 0
        },
        _ = null,
        B = null;
      function D(e) {
        void 0 === e && (e = 100);
        var t = o.localStorage.getItem(p);
        if (null !== t) {
          var n = Number(t);
          if (Number.isFinite(n) && n >= 0) return n;
        }
        var a = he(e);
        return o.localStorage.setItem(p, String(a)), a;
      }
      function R(e) {
        var t = he(e);
        return o.localStorage.setItem(p, String(t)), h.emit(d, t), t;
      }
      function G(e) {
        var t = Number.isFinite(e) ? Math.max(0, e) : 0;
        return R(D() + t);
      }
      function q(e) {
        var t = Number.isFinite(e) ? Math.max(0, e) : 0,
          n = D();
        return !(n + Number.EPSILON < t) && (R(n - t), !0);
      }
      function w(e) {
        void 0 === e && (e = c);
        var t = Array(e).fill(null),
          n = o.localStorage.getItem(M);
        if (!n) return x(t, !1), t;
        try {
          var a = JSON.parse(n);
          if (!Array.isArray(a.cards)) return t;
          var r = Date.now(),
            i = t.map(function (e, t) {
              return ue(a.cards[t], r);
            });
          return x(i, !1), function (e) {
            var t = le();
            if (t.version < 3) return;
            for (var n = de(e), a = !1, r = 0, i = Object.entries(n); r < i.length; r++) {
              var o = i[r],
                u = o[0],
                s = o[1];
              pe(t.acquiredCounts[u], 0) < s && (t.acquiredCounts[u] = s, a = !0);
            }
            a && ce(t);
          }(i), i;
        } catch (e) {
          return t;
        }
      }
      function x(e, t) {
        var n = Date.now(),
          r = Array(c).fill(null).map(function (t, n) {
            return e[n] ? se(e[n]) : null;
          });
        t && function (e, t) {
          for (var n = function (e) {
              var t = o.localStorage.getItem(M);
              if (!t) return [];
              try {
                var n = JSON.parse(t);
                return Array.isArray(n.cards) ? n.cards.map(function (t) {
                  return ue(t, e);
                }) : [];
              } catch (e) {
                return [];
              }
            }(t), r = new Set(e.flatMap(function (e) {
              return e ? [e.instanceId] : [];
            })), i = new Set(n.flatMap(function (e) {
              return e ? [e.instanceId] : [];
            })), u = le(), s = !1, l = 0, c = n; l < c.length; l++) {
            var d,
              m = c[l];
            if (m && !r.has(m.instanceId)) {
              var f = me(m.displayName),
                v = null != (d = m.lineupSinceMs) ? d : m.acquiredAtMs,
                g = Math.max(0, t - v);
              u.serviceDurationMsByDisplayName[f] = Math.min(Number.MAX_SAFE_INTEGER, ve(u.serviceDurationMsByDisplayName[f]) + g), s = !0;
            }
          }
          for (var h, p = a(e); !(h = p()).done;) {
            var S = h.value;
            S && !i.has(S.instanceId) && (S.lineupSinceMs = t);
          }
          s && ce(u);
        }(r, n);
        var i = {
          version: 2,
          cards: r
        };
        o.localStorage.setItem(M, JSON.stringify(i)), t && h.emit(m, P(r));
      }
      function P(e) {
        return (null != e ? e : w()).map(function (e) {
          return e ? se(e) : null;
        });
      }
      function F() {
        var e = t({}, C),
          n = o.localStorage.getItem(S);
        if (!n) return L(e, !1), e;
        try {
          var a = JSON.parse(n),
            r = {
              operationPresident: Me(a.operationPresident),
              headCoach: Me(a.headCoach),
              scoutingDirector: Me(a.scoutingDirector),
              medicalTeam: Me(a.medicalTeam),
              mediaTeam: Me(a.mediaTeam)
            };
          return L(r, !1), r;
        } catch (t) {
          return L(e, !1), e;
        }
      }
      function k(e) {
        L(e, !0);
      }
      function L(e, n) {
        var a = {
          operationPresident: Me(e.operationPresident),
          headCoach: Me(e.headCoach),
          scoutingDirector: Me(e.scoutingDirector),
          medicalTeam: Me(e.medicalTeam),
          mediaTeam: Me(e.mediaTeam)
        };
        o.localStorage.setItem(S, JSON.stringify(a)), n && h.emit(f, t({}, a));
      }
      function J() {
        return (J = n( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(e) {
          var t, n, a, r;
          return _regeneratorRuntime().wrap(function _callee$(_context2) {
            while (1) switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return j();
              case 2:
                a = _context2.sent;
                r = Me(e);
                return _context2.abrupt("return", r >= ee(a) ? 0 : null != (t = null == (n = te(a, r)) ? void 0 : n.budgetCost) ? t : 0);
              case 5:
              case "end":
                return _context2.stop();
            }
          }, _callee);
        }))).apply(this, arguments);
      }
      function W() {
        return (W = n( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(e, n) {
          var a, r, i, o, u, s, l;
          return _regeneratorRuntime().wrap(function _callee2$(_context3) {
            while (1) switch (_context3.prev = _context3.next) {
              case 0:
                o = F();
                if ($(e)) {
                  _context3.next = 3;
                  break;
                }
                return _context3.abrupt("return", Z(!1, "invalid-role", o, 0, 0));
              case 3:
                _context3.next = 5;
                return j();
              case 5:
                u = _context3.sent;
                s = (o = F())[e];
                if (!(s >= ee(u))) {
                  _context3.next = 9;
                  break;
                }
                return _context3.abrupt("return", Z(!1, "max-level", o, s, 0));
              case 9:
                l = null != (a = null == (r = te(u, s)) ? void 0 : r.budgetCost) ? a : 0;
                return _context3.abrupt("return", s >= Se(n) ? Z(!1, "team-level-cap", o, s, l) : l <= 0 || !q(l) ? Z(!1, "insufficient-budget", o, s, l) : (k(o = t({}, o, ((i = {})[e] = s + 1, i))), Z(!0, "ok", o, s, l)));
              case 11:
              case "end":
                return _context3.stop();
            }
          }, _callee2);
        }))).apply(this, arguments);
      }
      function H() {
        return null != _ || (_ = z("data/balance/management_effects").then(function (e) {
          if (!Array.isArray(e.levelEffects) || 0 === e.levelEffects.length) throw new Error("Invalid management effects configuration.");
          return e;
        })), _;
      }
      function j() {
        return null != B || (B = z("data/balance/economy").then(function (e) {
          if (!e.managementUpgradeCost || !Array.isArray(e.managementUpgradeCost.upgradeCostToNextLevel)) throw new Error("Invalid management upgrade cost configuration.");
          return e;
        })), B;
      }
      function U() {
        return (U = n( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3() {
          var e, n;
          return _regeneratorRuntime().wrap(function _callee3$(_context4) {
            while (1) switch (_context4.prev = _context4.next) {
              case 0:
                _context4.prev = 0;
                _context4.next = 3;
                return H();
              case 3:
                e = _context4.sent;
                n = F();
                return _context4.abrupt("return", {
                  operationPresidentBudgetBonus: ge(e, n.operationPresident).operationPresidentBudgetBonus,
                  headCoachBattleOvrBonus: ge(e, n.headCoach).headCoachBattleOvrBonus,
                  scoutingDirectorHighestQualityWeightBonus: ge(e, n.scoutingDirector).scoutingDirectorHighestQualityWeightBonus,
                  medicalTeamOvrRollPercentileShift: ge(e, n.medicalTeam).medicalTeamOvrRollPercentileShift,
                  mediaTeamOfflineBudgetBonus: ge(e, n.mediaTeam).mediaTeamOfflineBudgetBonus
                });
              case 8:
                _context4.prev = 8;
                _context4.t0 = _context4["catch"](0);
                return _context4.abrupt("return", (console.error("[GameState] Failed to load management effects.", _context4.t0), t({}, O)));
              case 11:
              case "end":
                return _context4.stop();
            }
          }, _callee3, null, [[0, 8]]);
        }))).apply(this, arguments);
      }
      function V(e) {
        o.localStorage.setItem(N, JSON.stringify({
          musicEnabled: Boolean(e.musicEnabled),
          soundEnabled: Boolean(e.soundEnabled)
        }));
      }
      function X(e) {
        o.localStorage.setItem(y, JSON.stringify({
          version: 2,
          accrualStartedAtMs: be(e.accrualStartedAtMs, Date.now()),
          lastOnlineTickAtMs: be(e.lastOnlineTickAtMs, Date.now()),
          offlineStartedAtMs: null === e.offlineStartedAtMs ? null : be(e.offlineStartedAtMs, Date.now()),
          pendingOfflineSeconds: Math.max(0, Number.isFinite(e.pendingOfflineSeconds) ? e.pendingOfflineSeconds : 0),
          unpromptedOfflineSeconds: Math.max(0, Number.isFinite(e.unpromptedOfflineSeconds) ? e.unpromptedOfflineSeconds : 0)
        }));
      }
      function Y() {
        var e = {
            version: 2,
            seasonNumber: 1,
            matchNumber: 1,
            officialWins: 0,
            schedulePhase: "regular-season",
            playoffRound: 0,
            playoffWinsInRound: 0,
            goatCompleted: !1,
            lastSettledMatchId: null,
            lastBaseRewardMatchId: null,
            lastAdRewardMatchId: null,
            lastAdvancedMatchId: null
          },
          t = o.localStorage.getItem(A);
        if (!t) return ae(e, !1), e;
        try {
          var n = ne(JSON.parse(t));
          return ae(n, !1), n;
        } catch (t) {
          return e;
        }
      }
      function K(e) {
        var t = ne(e);
        return ae(t, !0), t;
      }
      function Q(e) {
        return void 0 === e && (e = Y()), e.seasonNumber + "-" + e.matchNumber;
      }
      function z(e) {
        return new Promise(function (t, n) {
          u.load(e, s, function (a, r) {
            !a && r ? t(r.json) : n(null != a ? a : new Error("Missing JSON asset: " + e));
          });
        });
      }
      function Z(e, n, a, r, i) {
        return {
          success: e,
          reason: n,
          levels: t({}, a),
          previousLevel: r,
          newLevel: e ? r + 1 : r,
          budgetCost: he(i)
        };
      }
      function $(e) {
        return "string" == typeof e && Object.prototype.hasOwnProperty.call(C, e);
      }
      function ee(e) {
        return Math.min(E, Math.max(0, pe(e.managementUpgradeCost.maxLevel, E)));
      }
      function te(e, t) {
        var n = e.managementUpgradeCost.upgradeCostToNextLevel.find(function (e) {
          return pe(e.fromLevel, -1) === t && pe(e.toLevel, -1) === t + 1;
        });
        return n && Number.isFinite(Number(n.budgetCost)) ? {
          fromLevel: t,
          toLevel: t + 1,
          budgetCost: he(Number(n.budgetCost))
        } : null;
      }
      function ne(e) {
        var n = Math.min(13, Math.max(1, pe(e.seasonNumber, 1))),
          a = Boolean(e.goatCompleted) && 13 === n,
          r = a ? 98 : Math.min(98, Math.max(1, pe(e.matchNumber, 1))),
          i = 98 * (n - 1) + (a ? 98 : r - 1),
          o = Math.max(0, pe(e.officialWins, i)),
          u = Math.min(l, Math.max(i, o)),
          s = function (e, t) {
            if (t) return {
              schedulePhase: "goat-complete",
              playoffRound: 4,
              playoffWinsInRound: 4
            };
            if (e <= 82) return {
              schedulePhase: "regular-season",
              playoffRound: 0,
              playoffWinsInRound: 0
            };
            var n = e - 82 - 1;
            return {
              schedulePhase: "playoffs",
              playoffRound: Math.min(4, Math.floor(n / 4) + 1),
              playoffWinsInRound: n % 4
            };
          }(r, a);
        return t({
          version: 2,
          seasonNumber: n,
          matchNumber: r,
          officialWins: u
        }, s, {
          goatCompleted: a,
          lastSettledMatchId: oe(e.lastSettledMatchId),
          lastBaseRewardMatchId: oe(e.lastBaseRewardMatchId),
          lastAdRewardMatchId: oe(e.lastAdRewardMatchId),
          lastAdvancedMatchId: oe(e.lastAdvancedMatchId)
        });
      }
      function ae(e, n) {
        var a = ne(e);
        o.localStorage.setItem(A, JSON.stringify(a)), n && h.emit(v, t({}, a));
      }
      function re(e, t, n) {
        var a = oe(e),
          r = he(t);
        if (!a || r <= 0) return !1;
        var i = Y();
        return !(!function (e, t) {
          return ie(e, t) || e.lastAdvancedMatchId === t || e.lastSettledMatchId === t;
        }(i, a) || ("base" === n ? i.lastBaseRewardMatchId === a : i.lastAdRewardMatchId === a)) && ("base" === n ? i.lastBaseRewardMatchId = a : i.lastAdRewardMatchId = a, K(i), G(r), !0);
      }
      function ie(e, t) {
        var n = oe(t);
        return Boolean(n) && Q(e) === n;
      }
      function oe(e) {
        if ("string" != typeof e) return null;
        var t = e.trim();
        return t || null;
      }
      function ue(e, t) {
        var n, a, r;
        if (!e || "object" != _typeof(e)) return null;
        var i = e,
          o = pe(i.overall, 0);
        if (!i.instanceId || !i.templateId || !i.sourcePlayerName || !i.displayName || o <= 0) return null;
        var u = null != (n = i.attributes) ? n : {},
          s = I.reduce(function (e, t) {
            return e[t] = pe(u[t], 0), e;
          }, {});
        return {
          instanceId: String(i.instanceId),
          templateId: String(i.templateId),
          sourcePlayerName: String(i.sourcePlayerName),
          displayName: String(i.displayName),
          position: String(null != (a = i.position) ? a : ""),
          qualityId: pe(i.qualityId, 3),
          qualityName: String(null != (r = i.qualityName) ? r : ""),
          isConceptGod: Boolean(i.isConceptGod),
          overall: o,
          attributes: s,
          acquiredAtMs: be(i.acquiredAtMs, t),
          lineupSinceMs: null === i.lineupSinceMs ? null : be(i.lineupSinceMs, t)
        };
      }
      function se(e) {
        return t({}, e, {
          attributes: t({}, e.attributes)
        });
      }
      function le() {
        var e = {
            version: 4,
            acquiredCounts: {},
            conceptGodAcquiredCount: 0,
            serviceDurationMsByDisplayName: {}
          },
          n = o.localStorage.getItem(b);
        if (!n) return e;
        try {
          var a = JSON.parse(n);
          return {
            version: pe(a.version, 1),
            acquiredCounts: a.acquiredCounts && "object" == _typeof(a.acquiredCounts) ? t({}, a.acquiredCounts) : {},
            conceptGodAcquiredCount: Math.max(0, pe(a.conceptGodAcquiredCount, 0)),
            serviceDurationMsByDisplayName: a.serviceDurationMsByDisplayName && "object" == _typeof(a.serviceDurationMsByDisplayName) ? fe(a.serviceDurationMsByDisplayName) : {}
          };
        } catch (t) {
          return e;
        }
      }
      function ce(e) {
        var n = {
          version: 4,
          acquiredCounts: t({}, e.acquiredCounts),
          conceptGodAcquiredCount: Math.max(0, pe(e.conceptGodAcquiredCount, 0)),
          serviceDurationMsByDisplayName: fe(e.serviceDurationMsByDisplayName)
        };
        o.localStorage.setItem(b, JSON.stringify(n));
      }
      function de(e) {
        for (var t, n = {}, r = a(e); !(t = r()).done;) {
          var i = t.value;
          if (i) {
            var o = me(i.displayName);
            n[o] = pe(n[o], 0) + 1;
          }
        }
        return n;
      }
      function me(e) {
        return e.trim();
      }
      function fe(e) {
        for (var t = {}, n = 0, a = Object.entries(e); n < a.length; n++) {
          var r = a[n],
            i = r[0],
            o = r[1],
            u = me(i);
          u && (t[u] = Math.min(Number.MAX_SAFE_INTEGER, ve(t[u]) + ve(o)));
        }
        return t;
      }
      function ve(e) {
        var t = Number(e);
        return Number.isFinite(t) ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(t))) : 0;
      }
      function ge(e, t) {
        var n;
        return null != (n = e.levelEffects[Math.min(Me(t), e.levelEffects.length - 1)]) ? n : e.levelEffects[0];
      }
      function he(e) {
        var t = Number.isFinite(e) ? Math.max(0, e) : 0;
        return Math.round(Math.min(Number.MAX_SAFE_INTEGER, t) * T) / T;
      }
      function pe(e, t) {
        var n = Number(e);
        return Number.isFinite(n) ? Math.floor(n) : t;
      }
      function Me(e) {
        return Math.min(E, Math.max(0, pe(e, 0)));
      }
      function Se(e) {
        return Math.min(E, Math.max(1, pe(e, 1)));
      }
      function be(e, t) {
        var n = Number(e);
        return Number.isFinite(n) && n > 0 ? Math.floor(n) : t;
      }
      r._RF.pop();
    }
  };
});
System.register("chunks:///_virtual/HomeSceneController.ts", ["./rollupPluginModLoBabelHelpers.js", "cc", "./PlayerAvatarChip.ts", "./RosterSlotView.ts", "./ManagerSlotView.ts", "./BottomNavItemView.ts", "./ProgressBarView.ts", "./PrimaryButtonView.ts"], function (e) {
  var t, r, o, i, n, a, l, u, c, s, p, f, m, y;
  return {
    setters: [function (e) {
      t = e.applyDecoratedDescriptor, r = e.inheritsLoose, o = e.initializerDefineProperty, i = e.assertThisInitialized;
    }, function (e) {
      n = e.cclegacy, a = e._decorator, l = e.Node, u = e.Component;
    }, function (e) {
      c = e.PlayerAvatarChip;
    }, function (e) {
      s = e.RosterSlotView;
    }, function (e) {
      p = e.ManagerSlotView;
    }, function (e) {
      f = e.BottomNavItemView;
    }, function (e) {
      m = e.ProgressBarView;
    }, function (e) {
      y = e.PrimaryButtonView;
    }],
    execute: function execute() {
      var b, g, w, S, v, B, P, V, d, h, z, C, R, H, I, L, N;
      n._RF.push({}, "2038ds719BLRKbRWgS54Fa5", "HomeSceneController", void 0);
      var _ = a.ccclass,
        A = a.property;
      e("HomeSceneController", (b = _("HomeSceneController"), g = A({
        type: [c]
      }), w = A({
        type: [s]
      }), S = A({
        type: [p]
      }), v = A({
        type: [f]
      }), B = A(m), P = A(y), V = A(l), b((z = t((h = function (e) {
        function t() {
          for (var t, r = arguments.length, n = new Array(r), a = 0; a < r; a++) n[a] = arguments[a];
          return t = e.call.apply(e, [this].concat(n)) || this, o(t, "courtPlayers", z, i(t)), o(t, "rosterSlots", C, i(t)), o(t, "managerSlots", R, i(t)), o(t, "bottomNavItems", H, i(t)), o(t, "spiritBar", I, i(t)), o(t, "recruitButton", L, i(t)), o(t, "modalLayer", N, i(t)), t;
        }
        return r(t, e), t;
      }(u)).prototype, "courtPlayers", [g], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return [];
        }
      }), C = t(h.prototype, "rosterSlots", [w], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return [];
        }
      }), R = t(h.prototype, "managerSlots", [S], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return [];
        }
      }), H = t(h.prototype, "bottomNavItems", [v], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return [];
        }
      }), I = t(h.prototype, "spiritBar", [B], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return null;
        }
      }), L = t(h.prototype, "recruitButton", [P], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return null;
        }
      }), N = t(h.prototype, "modalLayer", [V], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return null;
        }
      }), d = h)) || d));
      n._RF.pop();
    }
  };
});
System.register("chunks:///_virtual/HomeUiController.ts", ["./rollupPluginModLoBabelHelpers.js", "cc", "./GameState.ts", "./PlayerAssets.ts", "./RosterSlotView.ts", "./TeamLevelController.ts", "./TopTeamInfoController.ts", "./PreMatchController.ts", "./GameFont.ts", "./FullScreenEntrance.ts", "./ManagementController.ts", "./ManagerSlotView.ts", "./MatchSession.ts", "./IdleIncomeController.ts", "./RecruitmentProbabilityController.ts"], function (e) {
  var t, n, a, o, i, l, r, s, u, h, m, d, g, c, f, v, p, P, C, y, I, b, B, E, T, N, S, M, R, L, A, D, F, _, V, x, G, H, O, U, q, z, w, k, K, W, Y, Q, X, j, J, Z;
  return {
    setters: [function (e) {
      t = e.inheritsLoose, n = e.createForOfIteratorHelperLoose, a = e.asyncToGenerator;
    }, function (e) {
      o = e.cclegacy, i = e._decorator, l = e.Button, r = e.Label, s = e.Node, u = e.UITransform, h = e.EditBox, m = e.resources, d = e.Font, g = e.sys, c = e.Sprite, f = e.Component;
    }, function (e) {
      v = e.gameStateEvents, p = e.GAME_STATE_EVENT_ROSTER_CHANGED, P = e.GAME_STATE_EVENT_TEAM_IDENTITY_CHANGED, C = e.GAME_STATE_EVENT_PLAYER_DETAILS_REQUESTED, y = e.GAME_STATE_EVENT_MANAGEMENT_CHANGED, I = e.loadRoster, b = e.loadGameSettings, B = e.TEAM_NAME_STORAGE_KEY, E = e.loadManagementLevels, T = e.INT32_MAX, N = e.getTeamAbbreviation, S = e.TEAM_ABBREVIATION_STORAGE_KEY, M = e.saveGameSettings, R = e.getManagementEffects, L = e.calculateTeamOverall, A = e.loadSeasonState, D = e.ATTRIBUTE_KEYS, F = e.getPlayerAcquisitionCount, _ = e.getPlayerServiceDurationMs;
    }, function (e) {
      V = e.loadPlayerPortrait, x = e.loadQualityFrame, G = e.loadSpriteFrame;
    }, function (e) {
      H = e.formatPlayerOverall, O = e.RosterSlotView, U = e.getQualityFrameIndex;
    }, function (e) {
      q = e.teamProgressionEvents, z = e.TEAM_PROGRESSION_EVENT_CHAMPIONSHIP_REQUESTED;
    }, function (e) {
      w = e.TopTeamInfoController;
    }, function (e) {
      k = e.PreMatchController;
    }, function (e) {
      K = e.applyGameFont;
    }, function (e) {
      W = e.playFullScreenEntrance, Y = e.stopFullScreenEntrance;
    }, function (e) {
      Q = e.ManagementController;
    }, function (e) {
      X = e.ManagerSlotView;
    }, function (e) {
      j = e.consumeHomepageReturnTarget;
    }, function (e) {
      J = e.IdleIncomeController;
    }, function (e) {
      Z = e.RecruitmentProbabilityController;
    }],
    execute: function execute() {
      var $;
      o._RF.push({}, "ca63f9bcMhAcabdvi/S1EzA", "HomeUiController", void 0);
      var ee = i.ccclass;
      e("HomeUiController", ee("HomeUiController")($ = function (e) {
        function o() {
          for (var t, n = arguments.length, a = new Array(n), o = 0; o < n; o++) a[o] = arguments[o];
          return (t = e.call.apply(e, [this].concat(a)) || this).canvas = null, t.homeRoot = null, t.teamInfoPage = null, t.settingsPage = null, t.playerDetailsPage = null, t.managementPage = null, t.managementController = null, t.idleIncomeController = null, t.recruitmentProbabilityController = null, t.topTeamInfoController = null, t.rosterSlots = [], t.boundButtons = [], t.teamNameEditBox = null, t.teamNameDisplayLabel = null, t.teamNameInputLabel = null, t.editingTeamName = !1, t.cardRenderVersion = 0, t.teamInfoRequestVersion = 0, t.buttonVisualBindings = [], t.recruitButtonWithPressedSprite = null, t.openTeamInfoPage = function () {
            var e = ++t.teamInfoRequestVersion;
            t.cancelTeamNameEdit(), t.refreshTeamInfoPage().then(function () {
              e === t.teamInfoRequestVersion && (t.bringToFront(t.teamInfoPage), t.playTeamInfoEntrance());
            });
          }, t.closeTeamInfoPage = function () {
            t.teamInfoRequestVersion += 1, t.cancelTeamNameEdit(), t.teamInfoPage && (Y(t.teamInfoPage), t.teamInfoPage.active = !1);
          }, t.beginTeamNameEdit = function () {
            var e,
              n,
              a = null != (e = null == (n = t.findByPath(t.teamInfoPage, "球队名/名字")) ? void 0 : n.getComponent(r)) ? e : null;
            a && t.teamNameEditBox && (t.editingTeamName = !0, a.enabled = !1, t.teamNameInputLabel && (t.teamNameInputLabel.enabled = !0), t.teamNameEditBox.enabled = !0, t.teamNameEditBox.string = a.string, t.teamNameEditBox.focus());
          }, t.saveTeamIdentity = function () {
            var e,
              n,
              a,
              o,
              i = (null == (e = g.localStorage.getItem(B)) ? void 0 : e.trim()) || "我的球队",
              l = (t.editingTeamName && t.teamNameEditBox ? t.teamNameEditBox.string.trim() : null != (n = null == (a = t.findByPath(t.teamInfoPage, "球队名/名字")) || null == (a = a.getComponent(r)) ? void 0 : a.string.trim()) ? n : i) || i,
              s = N(l);
            null == (o = t.topTeamInfoController) || o.setTeamIdentity(l), t.topTeamInfoController || (g.localStorage.setItem(B, l), g.localStorage.setItem(S, s), v.emit(P, l, s)), t.closeTeamInfoPage();
          }, t.openSettingsPage = function () {
            t.teamInfoRequestVersion += 1, t.refreshSettingsPage(), t.bringToFront(t.settingsPage);
          }, t.closeSettingsPage = function () {
            t.settingsPage && (t.settingsPage.active = !1);
          }, t.toggleMusic = function () {
            var e = b();
            e.musicEnabled = !e.musicEnabled, M(e), t.refreshSettingsPage();
          }, t.toggleSound = function () {
            var e = b();
            e.soundEnabled = !e.soundEnabled, M(e), t.refreshSettingsPage();
          }, t.closePlayerDetails = function () {
            t.cardRenderVersion += 1, t.playerDetailsPage && (t.playerDetailsPage.active = !1);
          }, t.openPreMatchPage = function () {
            var e;
            t.closeFullScreenPages(), null == (e = k.instance) || e.openPage();
          }, t.openIdleIncomePage = function () {
            var e;
            null == (e = t.idleIncomeController) || e.openPage();
          }, t.closeFullScreenPages = function () {
            var e, n;
            t.playerDetailsPage && (t.playerDetailsPage.active = !1), null == (e = k.instance) || e.closePage(), null == (n = t.managementController) || n.closeManagement();
          }, t;
        }
        t(o, e);
        var i = o.prototype;
        return i.onLoad = function () {
          var e, t, n, a;
          if (this.resolveSceneReferences(), !(this.canvas && this.homeRoot && this.teamInfoPage && this.settingsPage && this.playerDetailsPage)) return console.error("[HomeUiController] Missing Homepage UI references."), void (this.enabled = !1);
          this.teamInfoPage.active = !1, this.settingsPage.active = !1, this.playerDetailsPage.active = !1, this.managementController = null != (e = this.node.getComponent(Q)) ? e : this.node.addComponent(Q), this.recruitmentProbabilityController = null != (t = this.node.getComponent(Z)) ? t : this.node.addComponent(Z), this.recruitButtonWithPressedSprite = null != (n = null == (a = this.findByPath(this.homeRoot, "底部按钮/招募/招募")) ? void 0 : a.getComponent(l)) ? n : null, this.prepareAllButtonVisuals(this.canvas), this.syncDisabledButtonVisuals(!0), this.prepareTeamNameEditor(), this.applyHomepageFont();
        }, i.lateUpdate = function () {
          this.syncDisabledButtonVisuals(!1);
        }, i.start = function () {
          "pre-match" === j() && this.scheduleOnce(this.openPreMatchPage, 0);
        }, i.onEnable = function () {
          this.bindAllButtons(), v.on(p, this.onRosterChanged, this), v.on(P, this.onTeamIdentityChanged, this), v.on(C, this.openPlayerDetails, this), v.on(y, this.onManagementChanged, this), q.on(z, this.openPreMatchPage, this);
        }, i.onDisable = function () {
          for (var e, t = n(this.boundButtons); !(e = t()).done;) {
            var a = e.value;
            a.button.node.off(l.EventType.CLICK, a.callback, this);
          }
          this.boundButtons = [], v.off(p, this.onRosterChanged, this), v.off(P, this.onTeamIdentityChanged, this), v.off(C, this.openPlayerDetails, this), v.off(y, this.onManagementChanged, this), q.off(z, this.openPreMatchPage, this);
        }, i.bindAllButtons = function () {
          var e,
            t,
            n,
            a,
            o,
            i,
            r,
            s,
            u,
            h,
            m,
            d,
            g,
            c,
            f,
            v = this;
          this.bindButton(null == (e = this.findByPath(this.homeRoot, "顶部球队信息/球队简称")) ? void 0 : e.getComponent(l), this.openTeamInfoPage), this.bindButton(null == (t = this.findByPath(this.homeRoot, "顶部球队信息/设置")) ? void 0 : t.getComponent(l), this.openSettingsPage), this.bindButton(null == (n = this.teamInfoPage) || null == (n = n.getChildByName("关闭")) ? void 0 : n.getComponent(l), this.closeTeamInfoPage), this.bindButton(null == (a = this.findByPath(this.teamInfoPage, "球队名/改名")) ? void 0 : a.getComponent(l), this.beginTeamNameEdit), this.bindButton(null == (o = this.teamInfoPage) || null == (o = o.getChildByName("保存并关闭")) ? void 0 : o.getComponent(l), this.saveTeamIdentity), this.bindButton(null == (i = this.findByPath(this.settingsPage, "标题/关闭")) ? void 0 : i.getComponent(l), this.closeSettingsPage), this.bindButton(null == (r = this.findByPath(this.settingsPage, "音乐/开关")) ? void 0 : r.getComponent(l), this.toggleMusic), this.bindButton(null == (s = this.findByPath(this.settingsPage, "音效/开关")) ? void 0 : s.getComponent(l), this.toggleSound), this.bindButton(null == (u = this.playerDetailsPage) || null == (u = u.getChildByName("返回")) ? void 0 : u.getComponent(l), this.closePlayerDetails);
          var p = null == (h = this.findByPath(this.homeRoot, "底部按钮/右侧2个/赛季")) ? void 0 : h.getComponentInChildren(l);
          this.bindButton(p, this.openPreMatchPage);
          var P = null == (m = this.findByPath(this.homeRoot, "底部按钮/左侧2个/球队")) ? void 0 : m.getComponentInChildren(l);
          this.bindButton(P, this.openTeamInfoPage);
          var C = null == (d = this.findByPath(this.homeRoot, "底部按钮/左侧2个/招募概率")) ? void 0 : d.getComponentInChildren(l);
          this.bindButton(C, null != (g = null == (c = this.recruitmentProbabilityController) ? void 0 : c.openPage) ? g : function () {});
          var y = null == (f = this.findByPath(this.homeRoot, "底部按钮/右侧2个/训练")) ? void 0 : f.getComponentInChildren(l);
          this.bindButton(y, this.openIdleIncomePage), this.rosterSlots.forEach(function (e, t) {
            v.bindButton(e.selectButton, function () {
              return v.openPlayerDetails(t);
            });
          }), this.bindManagementEntrypoints();
        }, i.bindButton = function (e, t) {
          e && (e.node.on(l.EventType.CLICK, t, this), this.boundButtons.push({
            button: e,
            callback: t
          }));
        }, i.openPlayerDetails = function (e) {
          var t = I(this.rosterSlots.length)[e];
          t && (this.renderDetailedPlayerCard(this.playerDetailsPage, t), this.bringToFront(this.playerDetailsPage, !0));
        }, i.refreshTeamInfoPage = function () {
          var e = a( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4() {
            var e, t, n, a, o, i, l, r, s, u, h, m, d, f, v, p;
            return _regeneratorRuntime().wrap(function _callee4$(_context5) {
              while (1) switch (_context5.prev = _context5.next) {
                case 0:
                  if (!this.teamInfoPage) {
                    _context5.next = 18;
                    break;
                  }
                  l = I(this.rosterSlots.length);
                  _context5.next = 4;
                  return R();
                case 4:
                  r = _context5.sent;
                  s = (null == (e = g.localStorage.getItem(B)) ? void 0 : e.trim()) || "我的球队";
                  u = L(l, r.headCoachBattleOvrBonus);
                  h = l.reduce(function (e, t) {
                    return !t || e && e.overall >= t.overall ? e : t;
                  }, null);
                  this.setLabel("球队名/名字", s, this.teamInfoPage), this.setLabel("球队总评/总评数值", this.formatOverall(u), this.teamInfoPage), this.setLabel("累计胜场/胜场数", String(A().officialWins), this.teamInfoPage), this.setLabel("最佳球员/名字", null != (t = null == h ? void 0 : h.displayName) ? t : "暂无球员", this.teamInfoPage), this.setLabel("最佳球员/总评", h ? this.formatOverall(h.overall) : "0", this.teamInfoPage);
                  m = null != (n = null == (a = this.findByPath(this.teamInfoPage, "最佳球员/头像")) ? void 0 : a.getComponent(c)) ? n : null, d = null != (o = null == (i = this.findByPath(this.teamInfoPage, "最佳球员/边框")) ? void 0 : i.getComponent(c)) ? o : null;
                  if (h) {
                    _context5.next = 12;
                    break;
                  }
                  return _context5.abrupt("return", (m && (m.spriteFrame = null), void (d && (d.spriteFrame = null))));
                case 12:
                  _context5.next = 14;
                  return Promise.all([V(h), x(h.qualityId)]);
                case 14:
                  f = _context5.sent;
                  v = f[0];
                  p = f[1];
                  m && (m.spriteFrame = v), d && p && (d.spriteFrame = p);
                case 18:
                case "end":
                  return _context5.stop();
              }
            }, _callee4, this);
          }));
          return function () {
            return e.apply(this, arguments);
          };
        }(), i.refreshSettingsPage = function () {
          var e = b();
          this.setLabel("音乐/开关/状态", e.musicEnabled ? "开" : "关", this.settingsPage), this.setLabel("音效/开关/状态", e.soundEnabled ? "开" : "关", this.settingsPage);
        }, i.renderDetailedPlayerCard = function () {
          var e = a( /*#__PURE__*/_regeneratorRuntime().mark(function _callee5(e, t) {
            var a, o, i, l, r, s, u, h, m, d, g, f, v, p, P, C, y, I, b, B, E, T, N, S, M, R, L, A, H, O, q;
            return _regeneratorRuntime().wrap(function _callee5$(_context6) {
              while (1) switch (_context6.prev = _context6.next) {
                case 0:
                  if (!e) {
                    _context6.next = 15;
                    break;
                  }
                  f = ++this.cardRenderVersion, v = U(t.qualityId), p = e.getChildByName("球员头像"), P = null != (a = null == p || null == (o = p.children.find(function (e) {
                    return e.name.includes("_");
                  })) ? void 0 : o.getComponent(c)) ? a : null, C = null != (i = null == p || null == (l = p.getChildByName("bg")) ? void 0 : l.getComponent(c)) ? i : null, y = null != (r = null == p ? void 0 : p.children.filter(function (e) {
                    return "麦穗" === e.name;
                  }).map(function (e) {
                    return e.getComponent(c);
                  }).filter(function (e) {
                    return Boolean(e);
                  })) ? r : [], I = null != (s = null == p || null == (u = p.getChildByName("头像框")) ? void 0 : u.getComponent(c)) ? s : null, b = null != (h = null == p || null == (m = p.getChildByName("名牌")) ? void 0 : m.getComponent(c)) ? h : null, B = null != (d = null == p || null == (g = p.getChildByName("品质标签")) ? void 0 : g.getComponent(c)) ? d : null;
                  this.setLabel("球员头像/名牌/名字", t.displayName, e), this.setLabel("球员头像/品质标签/品质", t.qualityName, e), this.setLabel("球员头像/位置/位置", t.position, e), this.setLabel("总评/数值", this.formatOverall(t.overall), e);
                  for (T = {
                    scoring: "得分",
                    rebound: "篮板",
                    assist: "助攻",
                    steal: "抢断",
                    block: "盖帽"
                  }, N = n(D); !(E = N()).done;) {
                    S = E.value;
                    this.setLabel("五项数据/" + T[S] + "/数值", this.formatOverall(t.attributes[S]), e);
                  }
                  this.setLabel("累计获得次数/累计获得次数数值", String(F(t.displayName)), e), this.setLabel("效力时长/累计效力时长数值", this.formatServiceDuration(_(t.displayName)), e);
                  _context6.next = 7;
                  return Promise.all([V(t), G("images/UI/球员/招募背景/招募背景0" + v + "/spriteFrame"), G("images/UI/球员/麦穗/麦穗0" + v + "/spriteFrame"), x(t.qualityId), G("images/UI/球员/名牌/名牌0" + v + "/spriteFrame"), G("images/UI/球员/品质标签/品质标签0" + v + "/spriteFrame")]);
                case 7:
                  M = _context6.sent;
                  R = M[0];
                  L = M[1];
                  A = M[2];
                  H = M[3];
                  O = M[4];
                  q = M[5];
                  f === this.cardRenderVersion && (P && (P.spriteFrame = R), C && L && (C.spriteFrame = L), A && y.forEach(function (e) {
                    e.spriteFrame = A;
                  }), I && H && (I.spriteFrame = H), b && O && (b.spriteFrame = O), B && q && (B.spriteFrame = q));
                case 15:
                case "end":
                  return _context6.stop();
              }
            }, _callee5, this);
          }));
          return function (t, n) {
            return e.apply(this, arguments);
          };
        }(), i.prepareTeamNameEditor = function () {
          var e,
            t,
            n,
            a = null != (e = null == (t = this.findByPath(this.teamInfoPage, "球队名/名字")) ? void 0 : t.getComponent(r)) ? e : null;
          if (a) {
            var o = new s("球队名输入文本");
            a.node.addChild(o);
            var i = a.node.getComponent(u),
              l = o.addComponent(u);
            i && (l.setContentSize(i.contentSize), l.setAnchorPoint(i.anchorPoint));
            var m = o.addComponent(r);
            m.font = a.font, m.fontSize = a.fontSize, m.lineHeight = a.lineHeight, m.color = a.color, m.horizontalAlign = a.horizontalAlign, m.verticalAlign = a.verticalAlign, m.overflow = a.overflow, m.enableWrapText = !1, m.enabled = !1, this.teamNameDisplayLabel = a, this.teamNameInputLabel = m, this.teamNameEditBox = null != (n = a.getComponent(h)) ? n : a.addComponent(h), this.teamNameEditBox.textLabel = m, this.teamNameEditBox.maxLength = 12, this.teamNameEditBox.string = a.string, this.teamNameEditBox.enabled = !1;
          }
        }, i.applyHomepageFont = function () {
          var e = this;
          this.canvas && m.load("fonts/zpix", d, function (t, n) {
            var a;
            !t && n && null != (a = e.canvas) && a.isValid ? (K(e.canvas, n), e.scheduleOnce(function () {
              var t;
              null != (t = e.canvas) && t.isValid && K(e.canvas, n);
            }, 0)) : console.error("[HomeUiController] Failed to apply zpix font.", t);
          });
        }, i.cancelTeamNameEdit = function () {
          var e;
          this.editingTeamName = !1, this.teamNameEditBox && (this.teamNameEditBox.blur(), this.teamNameEditBox.enabled = !1), this.teamNameInputLabel && (this.teamNameInputLabel.enabled = !1), this.teamNameDisplayLabel && (this.teamNameDisplayLabel.enabled = !0);
          var t = (null == (e = g.localStorage.getItem(B)) ? void 0 : e.trim()) || "我的球队";
          this.setLabel("球队名/名字", t, this.teamInfoPage);
        }, i.onRosterChanged = function () {
          var e;
          null != (e = this.teamInfoPage) && e.active && this.refreshTeamInfoPage();
        }, i.onTeamIdentityChanged = function () {
          var e;
          null != (e = this.teamInfoPage) && e.active && this.refreshTeamInfoPage();
        }, i.onManagementChanged = function () {
          var e;
          this.refreshManagementSlotLevels(), null != (e = this.teamInfoPage) && e.active && this.refreshTeamInfoPage();
        }, i.bindManagementEntrypoints = function () {
          var e = this,
            t = this.findByPath(this.homeRoot, "球队/管理层");
          if (t) {
            for (var n = function n() {
                var n,
                  i,
                  r,
                  s,
                  u,
                  h,
                  m = o[a],
                  d = m[0],
                  g = m[1],
                  c = e.findDescendantByName(t, d),
                  f = null != (n = null != (i = null != (r = null == c ? void 0 : c.getComponent(X)) ? r : null == c ? void 0 : c.getComponentInChildren(X)) ? i : null == c ? void 0 : c.addComponent(X)) ? n : null,
                  v = null != (s = null != (u = null != (h = null == f ? void 0 : f.openButton) ? h : null == c ? void 0 : c.getComponent(l)) ? u : null == c ? void 0 : c.getComponentInChildren(l)) ? s : null;
                e.bindButton(v, function () {
                  var t;
                  e.closeFullScreenPages(), null == (t = e.managementController) || t.openManagement(g);
                });
              }, a = 0, o = [["运营", "operationPresident"], ["教练", "headCoach"], ["球探", "scoutingDirector"], ["队医", "medicalTeam"], ["管理层-长方", "mediaTeam"]]; a < o.length; a++) n();
            this.refreshManagementSlotLevels();
          }
        }, i.refreshManagementSlotLevels = function () {
          var e = this.findByPath(this.homeRoot, "球队/管理层");
          if (e) for (var t = E(), n = 0, a = [["运营", "operationPresident"], ["教练", "headCoach"], ["球探", "scoutingDirector"], ["队医", "medicalTeam"], ["管理层-长方", "mediaTeam"]]; n < a.length; n++) {
            var o,
              i,
              l,
              s,
              u,
              h,
              m = a[n],
              d = m[0],
              g = m[1],
              c = this.findDescendantByName(e, d),
              f = null != (o = null != (i = null == c ? void 0 : c.getComponent(X)) ? i : null == c ? void 0 : c.getComponentInChildren(X)) ? o : null;
            if (f) f.setup("Lv." + t[g]);else {
              var v = null != (l = null != (s = null == c || null == (u = c.getChildByName("等级")) ? void 0 : u.getComponent(r)) ? s : null == c || null == (h = c.getChildByName("LevelText")) ? void 0 : h.getComponent(r)) ? l : null;
              v && (v.string = "Lv." + t[g]);
            }
          }
        }, i.playTeamInfoEntrance = function () {
          this.teamInfoPage && W(this.teamInfoPage, {
            backgroundNodes: [this.teamInfoPage.getChildByName("遮罩"), this.teamInfoPage.getChildByName("bg"), this.teamInfoPage.getChildByName("内容背景")].filter(function (e) {
              return Boolean(e);
            }),
            moduleGroups: [{
              nodes: [this.teamInfoPage.getChildByName("球队信息"), this.teamInfoPage.getChildByName("关闭")].filter(function (e) {
                return Boolean(e);
              }),
              order: 0
            }, {
              nodes: this.namedChildren(this.teamInfoPage, ["球队名"]),
              order: 1
            }, {
              nodes: this.namedChildren(this.teamInfoPage, ["球队总评"]),
              order: 2
            }, {
              nodes: this.namedChildren(this.teamInfoPage, ["最佳球员"]),
              order: 3
            }, {
              nodes: this.namedChildren(this.teamInfoPage, ["累计胜场"]),
              order: 4
            }, {
              nodes: this.namedChildren(this.teamInfoPage, ["保存并关闭"]),
              order: 5
            }]
          });
        }, i.prepareAllButtonVisuals = function (e) {
          for (var t, a = n(e.getComponents(l)); !(t = a()).done;) {
            var o,
              i,
              r,
              s = t.value,
              u = null != (o = null == (i = s.target) ? void 0 : i.getComponent(c)) ? o : s.node.getComponent(c);
            s.hoverSprite = null, s !== this.recruitButtonWithPressedSprite && (s.pressedSprite = null), s.disabledSprite = null, !s.interactable && s.transition === l.Transition.SPRITE && s.normalSprite && u && (u.spriteFrame = s.normalSprite), this.buttonVisualBindings.push({
              button: s,
              sprite: u,
              originalGrayscale: null != (r = null == u ? void 0 : u.grayscale) && r,
              lastInteractable: null
            });
          }
          for (var h, m = n(e.children); !(h = m()).done;) {
            var d = h.value;
            this.prepareAllButtonVisuals(d);
          }
        }, i.syncDisabledButtonVisuals = function (e) {
          for (var t, a = n(this.buttonVisualBindings); !(t = a()).done;) {
            var o,
              i = t.value;
            if (i.button.isValid) {
              var l = i.button.interactable;
              (e || i.lastInteractable !== l) && (i.lastInteractable = l, null != (o = i.sprite) && o.isValid && (i.sprite.grayscale = !l || i.originalGrayscale));
            }
          }
        }, i.bringToFront = function (e, t) {
          if (void 0 === t && (t = !1), e) {
            var n = e.parent;
            n && e.setSiblingIndex(n.children.length - 1), t ? W(e) : e.active = !0;
          }
        }, i.setLabel = function (e, t, n) {
          var a,
            o = null == (a = this.findByPath(n, e)) ? void 0 : a.getComponent(r);
          o && (o.string = t);
        }, i.formatOverall = function (e) {
          return e >= T ? "MAX" : H(e);
        }, i.formatServiceDuration = function (e) {
          var t = Math.max(0, Math.floor(e / 6e4)),
            n = Math.floor(t / 1440),
            a = Math.floor(t % 1440 / 60),
            o = t % 60;
          return n > 0 ? n + "天" + a + "小时" : a > 0 ? a + "小时" + o + "分" : o + "分钟";
        }, i.resolveSceneReferences = function () {
          var e, t, n, a, o, i, l, r, s, u, h, m;
          this.canvas = this.node.parent, this.homeRoot = null != (e = null == (t = this.canvas) ? void 0 : t.getChildByName("主页")) ? e : null, this.teamInfoPage = null != (n = null == (a = this.canvas) ? void 0 : a.getChildByName("球队信息弹窗")) ? n : null, this.settingsPage = null != (o = null == (i = this.canvas) ? void 0 : i.getChildByName("设置弹窗")) ? o : null, this.playerDetailsPage = null != (l = null == (r = this.canvas) ? void 0 : r.getChildByName("球员详情页面")) ? l : null, this.managementPage = null != (s = null == (u = this.canvas) ? void 0 : u.getChildByName("管理层页面")) ? s : null, this.idleIncomeController = this.node.getComponent(J), this.topTeamInfoController = null != (h = null == (m = this.homeRoot) ? void 0 : m.getComponentInChildren(w)) ? h : null;
          var d = this.findByPath(this.homeRoot, "球队/阵容槽位");
          this.rosterSlots = d ? d.children.map(function (e) {
            return e.getComponent(O);
          }).filter(function (e) {
            return Boolean(e);
          }).sort(function (e, t) {
            return e.node.name.localeCompare(t.node.name, "zh-CN", {
              numeric: !0
            });
          }) : [];
        }, i.namedChildren = function (e, t) {
          return t.flatMap(function (t) {
            var n = e.getChildByName(t);
            return n ? [n] : [];
          });
        }, i.findDescendantByName = function (e, t) {
          if (e.name === t) return e;
          for (var a, o = n(e.children); !(a = o()).done;) {
            var i = a.value,
              l = this.findDescendantByName(i, t);
            if (l) return l;
          }
          return null;
        }, i.findByPath = function (e, t) {
          for (var a, o = e, i = n(t.split("/")); !(a = i()).done;) {
            var l,
              r,
              s = a.value;
            if (!(o = null != (l = null == (r = o) ? void 0 : r.getChildByName(s)) ? l : null)) return null;
          }
          return o;
        }, o;
      }(f)) || $);
      o._RF.pop();
    }
  };
});
System.register("chunks:///_virtual/IdleIncomeController.ts", ["./rollupPluginModLoBabelHelpers.js", "cc", "./GameState.ts", "./RosterSlotView.ts", "./TeamLevelController.ts", "./NumberGrowthAnimator.ts", "./RewardedAdService.ts", "./FullScreenEntrance.ts"], function (e) {
  var t, n, i, a, l, o, s, r, d, h, u, c, f, m, g, p, S, v, C, B, b, w, M;
  return {
    setters: [function (e) {
      t = e.inheritsLoose, n = e.createForOfIteratorHelperLoose, i = e.asyncToGenerator;
    }, function (e) {
      a = e.cclegacy, l = e._decorator, o = e.Button, s = e.game, r = e.Game, d = e.Label, h = e.Component;
    }, function (e) {
      u = e.saveIdleState, c = e.add, f = e.loadJson, m = e.getManagementEffects, g = e.getBalance, p = e.loadIdleState;
    }, function (e) {
      S = e.formatPlayerOverall;
    }, function (e) {
      v = e.TeamLevelController, C = e.getStoredMarketValueLevel;
    }, function (e) {
      B = e.setGrowingNumber;
    }, function (e) {
      b = e.showRewardedVideo;
    }, function (e) {
      w = e.playFullScreenEntrance, M = e.stopFullScreenEntrance;
    }],
    execute: function execute() {
      var R;
      a._RF.push({}, "5664bpkR3BHf4sw2HrVBpQ4", "IdleIncomeController", void 0);
      var y = l.ccclass;
      e("IdleIncomeController", y("IdleIncomeController")(R = function (e) {
        function a() {
          for (var t, n = arguments.length, i = new Array(n), a = 0; a < n; a++) i[a] = arguments[a];
          return (t = e.call.apply(e, [this].concat(i)) || this).page = null, t.closeButton = null, t.claimButton = null, t.adClaimButton = null, t.durationLabel = null, t.remainingLabel = null, t.reachedCapLabel = null, t.baseRewardLabel = null, t.mediaBonusLabel = null, t.claimRewardLabel = null, t.adRewardLabel = null, t.config = null, t.idleState = null, t.operationPresidentBonus = 0, t.mediaTeamBonus = 0, t.initialized = !1, t.adClaimProcessing = !1, t.onOnlineTick = function () {
            t.initialized && t.flushOnlineIncome(Date.now());
          }, t;
        }
        t(a, e);
        var l = a.prototype;
        return l.onLoad = function () {
          if (this.resolveSceneReferences(), !(this.page && this.closeButton && this.claimButton && this.adClaimButton)) return console.error("[IdleIncomeController] Missing offline income UI references."), void (this.enabled = !1);
          this.page.active = !1;
        }, l.onEnable = function () {
          var e, t, n;
          null == (e = this.closeButton) || e.node.on(o.EventType.CLICK, this.closePage, this), null == (t = this.claimButton) || t.node.on(o.EventType.CLICK, this.claimOfflineIncome, this), null == (n = this.adClaimButton) || n.node.on(o.EventType.CLICK, this.onAdClaimClicked, this), s.on(r.EVENT_HIDE, this.onGameHide, this), s.on(r.EVENT_SHOW, this.onGameShow, this);
        }, l.start = function () {
          this.initialize();
        }, l.onDisable = function () {
          var e, t, n;
          null == (e = this.closeButton) || e.node.off(o.EventType.CLICK, this.closePage, this), null == (t = this.claimButton) || t.node.off(o.EventType.CLICK, this.claimOfflineIncome, this), null == (n = this.adClaimButton) || n.node.off(o.EventType.CLICK, this.onAdClaimClicked, this), s.off(r.EVENT_HIDE, this.onGameHide, this), s.off(r.EVENT_SHOW, this.onGameShow, this), this.unschedule(this.onOnlineTick);
        }, l.initialize = function () {
          var e = i( /*#__PURE__*/_regeneratorRuntime().mark(function _callee6() {
            var e, t, n, i, a, l;
            return _regeneratorRuntime().wrap(function _callee6$(_context7) {
              while (1) switch (_context7.prev = _context7.next) {
                case 0:
                  e = this;
                  _context7.prev = 1;
                  _context7.next = 4;
                  return Promise.all([f("data/balance/economy"), m()]);
                case 4:
                  t = _context7.sent;
                  n = t[0];
                  i = t[1];
                  this.config = n, this.operationPresidentBonus = i.operationPresidentBudgetBonus, this.mediaTeamBonus = i.mediaTeamOfflineBudgetBonus, g(n.initialBudget);
                  a = Date.now();
                  this.idleState = p(a);
                  if (!(null !== this.idleState.offlineStartedAtMs)) {
                    _context7.next = 14;
                    break;
                  }
                  this.accumulateOfflineSeconds(a);
                  _context7.next = 16;
                  break;
                case 14:
                  _context7.next = 16;
                  return this.flushOnlineIncome(a);
                case 16:
                  this.initialized = !0;
                  l = Math.max(1, Math.floor(n.budgetSources.onlineIdle.claimTickSeconds));
                  this.schedule(this.onOnlineTick, l), this.refreshPage(), this.shouldAutoOpenPage() && this.scheduleOnce(function () {
                    return e.openPageForNewOfflineIncome();
                  }, 0);
                  _context7.next = 24;
                  break;
                case 21:
                  _context7.prev = 21;
                  _context7.t0 = _context7["catch"](1);
                  console.error("[IdleIncomeController] Failed to initialize.", _context7.t0);
                case 24:
                case "end":
                  return _context7.stop();
              }
            }, _callee6, this, [[1, 21]]);
          }));
          return function () {
            return e.apply(this, arguments);
          };
        }(), l.onGameHide = function () {
          var e = this;
          if (this.initialized) {
            var t = Date.now();
            this.flushOnlineIncome(t)["finally"](function () {
              e.idleState && (e.idleState.accrualStartedAtMs = t, e.idleState.lastOnlineTickAtMs = t, e.idleState.offlineStartedAtMs = t, u(e.idleState));
            });
          }
        }, l.onGameShow = function () {
          var e = this;
          this.initialized && this.refreshManagementEffects().then(function () {
            var t;
            if (null !== (null == (t = e.idleState) ? void 0 : t.offlineStartedAtMs)) {
              var n = Date.now();
              e.accumulateOfflineSeconds(n), e.refreshPage(), e.shouldAutoOpenPage() && e.openPageForNewOfflineIncome();
            }
          });
        }, l.flushOnlineIncome = function () {
          var e = i( /*#__PURE__*/_regeneratorRuntime().mark(function _callee7(e) {
            var t, n, i;
            return _regeneratorRuntime().wrap(function _callee7$(_context8) {
              while (1) switch (_context8.prev = _context8.next) {
                case 0:
                  if (!(this.config && this.idleState)) {
                    _context8.next = 6;
                    break;
                  }
                  _context8.next = 3;
                  return this.refreshManagementEffects();
                case 3:
                  t = Math.max(0, (e - this.idleState.lastOnlineTickAtMs) / 1e3);
                  if (t > 0) {
                    n = this.getMarketValueMultiplier(), i = t / 60 * Math.max(0, this.config.budgetSources.onlineIdle.baseBudgetPerMinute) * n * (1 + this.operationPresidentBonus);
                    i > 0 && c(i);
                  }
                  this.idleState.lastOnlineTickAtMs = e, this.idleState.accrualStartedAtMs = e, u(this.idleState);
                case 6:
                case "end":
                  return _context8.stop();
              }
            }, _callee7, this);
          }));
          return function (t) {
            return e.apply(this, arguments);
          };
        }(), l.accumulateOfflineSeconds = function (e) {
          if (this.config && this.idleState) {
            var t = Math.max(0, 3600 * this.config.budgetSources.offlineIdle.maxAccrualHours),
              n = this.idleState.offlineStartedAtMs;
            if (null !== n) {
              var i = Math.max(0, (e - n) / 1e3);
              this.idleState.pendingOfflineSeconds = Math.min(t, this.idleState.pendingOfflineSeconds + i), this.idleState.unpromptedOfflineSeconds = Math.min(t, this.idleState.unpromptedOfflineSeconds + i), this.idleState.accrualStartedAtMs = e, this.idleState.lastOnlineTickAtMs = e, this.idleState.offlineStartedAtMs = null, u(this.idleState);
            }
          }
        }, l.refreshManagementEffects = function () {
          var e = i( /*#__PURE__*/_regeneratorRuntime().mark(function _callee8() {
            var e;
            return _regeneratorRuntime().wrap(function _callee8$(_context9) {
              while (1) switch (_context9.prev = _context9.next) {
                case 0:
                  _context9.next = 2;
                  return m();
                case 2:
                  e = _context9.sent;
                  this.operationPresidentBonus = e.operationPresidentBudgetBonus, this.mediaTeamBonus = e.mediaTeamOfflineBudgetBonus;
                case 4:
                case "end":
                  return _context9.stop();
              }
            }, _callee8, this);
          }));
          return function () {
            return e.apply(this, arguments);
          };
        }(), l.claimOfflineIncome = function () {
          this.adClaimProcessing || this.settleOfflineIncome(1);
        }, l.onAdClaimClicked = function () {
          this.claimDoubleOfflineIncome();
        }, l.claimDoubleOfflineIncome = function () {
          var e = i( /*#__PURE__*/_regeneratorRuntime().mark(function _callee9() {
            var e;
            return _regeneratorRuntime().wrap(function _callee9$(_context10) {
              while (1) switch (_context10.prev = _context10.next) {
                case 0:
                  if (this.adClaimProcessing || this.getRewardSnapshot().totalReward < 1) {
                    _context10.next = 11;
                    break;
                  }
                  this.adClaimProcessing = !0, this.refreshPage();
                  _context10.prev = 2;
                  _context10.next = 5;
                  return b();
                case 5:
                  _context10.t0 = _context10.sent;
                  if (!_context10.t0) {
                    _context10.next = 8;
                    break;
                  }
                  this.settleOfflineIncome(2);
                case 8:
                  _context10.prev = 8;
                  this.adClaimProcessing = !1, null != (e = this.page) && e.active && this.refreshPage();
                  return _context10.finish(8);
                case 11:
                case "end":
                  return _context10.stop();
              }
            }, _callee9, this, [[2,, 8, 11]]);
          }));
          return function () {
            return e.apply(this, arguments);
          };
        }(), l.settleOfflineIncome = function (e) {
          if (this.idleState) {
            var t = this.getRewardSnapshot();
            if (!(t.totalReward < 1)) {
              c(t.totalReward * Math.max(1, e));
              var n = Date.now();
              this.idleState.pendingOfflineSeconds = 0, this.idleState.unpromptedOfflineSeconds = 0, this.idleState.accrualStartedAtMs = n, this.idleState.lastOnlineTickAtMs = n, this.idleState.offlineStartedAtMs = null, u(this.idleState), this.closePage();
            }
          }
        }, l.openPage = function () {
          if (this.page) {
            var e = this.page.parent;
            e && this.page.setSiblingIndex(e.children.length - 1), this.refreshPage(!0), w(this.page, {
              backgroundNodes: [this.page.getChildByName("遮罩"), this.page.getChildByName("bg")].filter(function (e) {
                return Boolean(e);
              }),
              moduleGroups: [{
                nodes: [this.page.getChildByName("标题"), this.page.getChildByName("关闭")].filter(function (e) {
                  return Boolean(e);
                }),
                order: 0
              }, {
                nodes: this.namedChildren(["计时"]),
                order: 1
              }, {
                nodes: this.namedChildren(["基础收益"]),
                order: 2
              }, {
                nodes: this.namedChildren(["媒体团队加成"]),
                order: 3
              }, {
                nodes: this.namedChildren(["领取"]),
                order: 4
              }, {
                nodes: this.namedChildren(["看广告双倍领取"]),
                order: 5
              }]
            });
          }
        }, l.openPageForNewOfflineIncome = function () {
          this.idleState && this.shouldAutoOpenPage() && (this.idleState.unpromptedOfflineSeconds = 0, u(this.idleState), this.openPage());
        }, l.closePage = function () {
          this.page && (M(this.page), this.page.active = !1);
        }, l.refreshPage = function (e) {
          if (void 0 === e && (e = !1), this.config && this.idleState) {
            var t = this.getRewardSnapshot(),
              n = 3600 * this.config.budgetSources.offlineIdle.maxAccrualHours,
              i = Math.max(0, n - t.seconds);
            this.durationLabel && (this.durationLabel.string = "已离线 " + this.formatDuration(t.seconds)), this.remainingLabel && (this.remainingLabel.node.active = i > 0, this.remainingLabel.string = i > 0 ? "距离上限还有 " + this.formatDuration(i) : "离线收益已达到上限"), this.reachedCapLabel && (this.reachedCapLabel.node.active = i <= 0), this.setRewardLabel(this.baseRewardLabel, t.baseReward, e), this.setRewardLabel(this.mediaBonusLabel, t.mediaBonusReward, e), this.setRewardLabel(this.claimRewardLabel, t.totalReward, e), this.setRewardLabel(this.adRewardLabel, 2 * t.totalReward, e), this.claimButton && (this.claimButton.interactable = t.totalReward >= 1 && !this.adClaimProcessing), this.adClaimButton && (this.adClaimButton.interactable = t.totalReward >= 1 && !this.adClaimProcessing);
          }
        }, l.getRewardSnapshot = function () {
          return this.config && this.idleState ? this.getRewardSnapshotForSeconds(this.idleState.pendingOfflineSeconds) : {
            seconds: 0,
            baseReward: 0,
            mediaBonusReward: 0,
            totalReward: 0
          };
        }, l.getRewardSnapshotForSeconds = function (e) {
          if (!this.config) return {
            seconds: 0,
            baseReward: 0,
            mediaBonusReward: 0,
            totalReward: 0
          };
          var t = Math.max(0, e),
            n = t / 3600 * Math.max(0, this.config.budgetSources.offlineIdle.baseBudgetPerHour) * this.getMarketValueMultiplier(),
            i = n * Math.max(0, this.mediaTeamBonus);
          return {
            seconds: t,
            baseReward: n,
            mediaBonusReward: i,
            totalReward: n + i
          };
        }, l.shouldAutoOpenPage = function () {
          return !!this.idleState && this.idleState.unpromptedOfflineSeconds > 0 && this.getRewardSnapshot().totalReward >= 1;
        }, l.getMarketValueMultiplier = function () {
          var e,
            t,
            n = null != (e = null == (t = v.instance) || null == (t = t.getSnapshot()) ? void 0 : t.marketValueLevel) ? e : C();
          return 1 + .02 * Math.max(0, n - 1);
        }, l.setRewardLabel = function (e, t, n) {
          void 0 === n && (n = !1);
          var i = Math.floor(Math.max(0, t));
          B(e, i, function (e) {
            return S(Math.floor(Math.max(0, e)));
          }, {
            animateGrowth: !0,
            from: n ? 0 : void 0
          });
        }, l.formatDuration = function (e) {
          var t = Math.max(0, Math.floor(e)),
            n = Math.floor(t / 3600),
            i = Math.floor(t % 3600 / 60);
          return n + "小时" + String(i).padStart(2, "0") + "分";
        }, l.resolveSceneReferences = function () {
          var e,
            t,
            n,
            i,
            a,
            l,
            s,
            r,
            h,
            u,
            c,
            f,
            m,
            g,
            p,
            S,
            v,
            C,
            B,
            b,
            w,
            M = this.node.parent;
          this.page = null != (e = null == M ? void 0 : M.getChildByName("离线收益弹窗")) ? e : null, this.closeButton = null != (t = null == (n = this.page) || null == (n = n.getChildByName("关闭")) ? void 0 : n.getComponent(o)) ? t : null, this.claimButton = null != (i = null == (a = this.page) || null == (a = a.getChildByName("领取")) ? void 0 : a.getComponent(o)) ? i : null, this.adClaimButton = null != (l = null == (s = this.page) || null == (s = s.getChildByName("看广告双倍领取")) ? void 0 : s.getComponent(o)) ? l : null, this.durationLabel = null != (r = null == (h = this.findByPath(this.page, "计时/离线时长")) ? void 0 : h.getComponent(d)) ? r : null, this.remainingLabel = null != (u = null == (c = this.findByPath(this.page, "计时/剩余时间")) ? void 0 : c.getComponent(d)) ? u : null, this.reachedCapLabel = null != (f = null == (m = this.findByPath(this.page, "计时/已到上限")) ? void 0 : m.getComponent(d)) ? f : null, this.baseRewardLabel = null != (g = null == (p = this.findByPath(this.page, "基础收益/基础数值")) ? void 0 : p.getComponent(d)) ? g : null, this.mediaBonusLabel = null != (S = null == (v = this.findByPath(this.page, "媒体团队加成/加成数值")) ? void 0 : v.getComponent(d)) ? S : null, this.claimRewardLabel = null != (C = null == (B = this.findByPath(this.page, "领取/基础数值")) ? void 0 : B.getComponent(d)) ? C : null, this.adRewardLabel = null != (b = null == (w = this.findByPath(this.page, "看广告双倍领取/数值")) ? void 0 : w.getComponent(d)) ? b : null;
        }, l.findByPath = function (e, t) {
          for (var i, a = e, l = n(t.split("/")); !(i = l()).done;) {
            var o,
              s,
              r = i.value;
            if (!(a = null != (o = null == (s = a) ? void 0 : s.getChildByName(r)) ? o : null)) return null;
          }
          return a;
        }, l.namedChildren = function (e) {
          var t = this;
          return this.page ? e.flatMap(function (e) {
            var n = t.page.getChildByName(e);
            return n ? [n] : [];
          }) : [];
        }, a;
      }(h)) || R);
      a._RF.pop();
    }
  };
});
System.register("chunks:///_virtual/LoadingController.ts", ["./rollupPluginModLoBabelHelpers.js", "cc", "./GameFont.ts"], function (t) {
  var e, s, o, r, n, i, a, l, u, d, h, p, g;
  return {
    setters: [function (t) {
      e = t.applyDecoratedDescriptor, s = t.inheritsLoose, o = t.initializerDefineProperty, r = t.assertThisInitialized;
    }, function (t) {
      n = t.cclegacy, i = t._decorator, a = t.ProgressBar, l = t.Label, u = t.resources, d = t.Font, h = t.director, p = t.Component;
    }, function (t) {
      g = t.applyGameFont;
    }],
    execute: function execute() {
      var c, f, L, b, m, S, C, y, P;
      n._RF.push({}, "920dbfH201DRKPGS01ijUDH", "LoadingController", void 0);
      var v = i.ccclass,
        F = i.property,
        I = "Homepage";
      t("LoadingController", (c = v("LoadingController"), f = F(a), L = F(l), b = F(l), c((C = e((S = function (t) {
        function e() {
          for (var e, s = arguments.length, n = new Array(s), i = 0; i < s; i++) n[i] = arguments[i];
          return e = t.call.apply(t, [this].concat(n)) || this, o(e, "progressBar", C, r(e)), o(e, "progressLabel", y, r(e)), o(e, "statusLabel", P, r(e)), e.gameFont = null, e.targetProgress = 0, e.displayProgress = 0, e.elapsedSeconds = 0, e.dotElapsedSeconds = 0, e.dotCount = 0, e.retryCount = 0, e.loadComplete = !1, e.switchingScene = !1, e.stopped = !1, e.statusText = "正在初始化", e;
        }
        s(e, t);
        var n = e.prototype;
        return n.onLoad = function () {
          if (null != this.progressBar || (this.progressBar = this.node.getComponentInChildren(a)), null != this.progressLabel || (this.progressLabel = this.findLabel("progress-num")), null != this.statusLabel || (this.statusLabel = this.findLabel("loading")), !this.progressBar || !this.progressLabel || !this.statusLabel) return console.error("[LoadingController] Missing ProgressBar, progress-num Label, or loading Label."), void (this.enabled = !1);
          this.updateProgressUI(0), this.updateStatusUI();
        }, n.start = function () {
          this.enabled && this.loadFont();
        }, n.update = function (t) {
          this.stopped || (this.elapsedSeconds += t, this.updateLoadingDots(t), this.displayProgress < this.targetProgress && (this.displayProgress = Math.min(this.targetProgress, this.displayProgress + 1.2 * t), this.updateProgressUI(this.displayProgress)), this.loadComplete && this.elapsedSeconds >= 1 && this.displayProgress >= .999 && this.enterHomepage());
        }, n.onDestroy = function () {
          this.stopped = !0, this.unscheduleAllCallbacks();
        }, n.loadFont = function () {
          var t = this;
          this.setStatus("正在加载字体"), u.load("fonts/zpix", d, function (e, s) {
            t.isValid && (!e && s ? (t.gameFont = s, g(t.node.scene, s), t.targetProgress = .1, t.preloadHomepage()) : t.handleLoadError(null != e ? e : new Error("zpix font asset is missing")));
          });
        }, n.preloadHomepage = function () {
          var t = this;
          this.setStatus("正在加载游戏资源"), h.preloadScene(I, function (e, s) {
            if (!(s <= 0)) {
              var o = Math.min(1, e / s);
              t.targetProgress = Math.max(t.targetProgress, .1 + .9 * o);
            }
          }, function (e) {
            t.isValid && (e ? t.handleLoadError(e) : (t.targetProgress = 1, t.loadComplete = !0, t.setStatus("加载完成", !1)));
          });
        }, n.handleLoadError = function (t) {
          var e = this;
          if (console.error("[LoadingController] Failed to load:", t), this.retryCount < 1) return this.retryCount += 1, this.setStatus("加载失败，正在重试"), void this.scheduleOnce(function () {
            e.gameFont ? e.preloadHomepage() : e.loadFont();
          }, 1);
          this.stopped = !0, this.setStatus("加载失败，请重新启动游戏", !1);
        }, n.enterHomepage = function () {
          var t = this;
          this.switchingScene || (this.switchingScene = !0, this.updateProgressUI(1), this.setStatus("加载完成", !1), h.loadScene(I, function (e, s) {
            if (e) return t.switchingScene = !1, void t.handleLoadError(e);
            s && t.gameFont && g(s, t.gameFont);
          }));
        }, n.updateProgressUI = function (t) {
          var e = Math.max(0, Math.min(1, t));
          this.progressBar && (this.progressBar.progress = e), this.progressLabel && (this.progressLabel.string = Math.floor(100 * e) + "%");
        }, n.updateLoadingDots = function (t) {
          this.loadComplete || (this.dotElapsedSeconds += t, this.dotElapsedSeconds < .35 || (this.dotElapsedSeconds = 0, this.dotCount = (this.dotCount + 1) % 4, this.updateStatusUI()));
        }, n.setStatus = function (t, e) {
          void 0 === e && (e = !0), this.statusText = t, e || (this.dotCount = 0), this.updateStatusUI(e);
        }, n.updateStatusUI = function (t) {
          void 0 === t && (t = !this.loadComplete), this.statusLabel && (this.statusLabel.string = this.statusText + (t ? ".".repeat(this.dotCount) : ""));
        }, n.findLabel = function (t) {
          var e;
          return null != (e = this.node.getComponentsInChildren(l).find(function (e) {
            return e.node.name === t;
          })) ? e : null;
        }, e;
      }(p)).prototype, "progressBar", [f], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return null;
        }
      }), y = e(S.prototype, "progressLabel", [L], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return null;
        }
      }), P = e(S.prototype, "statusLabel", [b], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return null;
        }
      }), m = S)) || m));
      n._RF.pop();
    }
  };
});
System.register("chunks:///_virtual/main", ["./PrimaryButtonView.ts", "./ProgressBarView.ts", "./BottomNavItemView.ts", "./CourtSimulationController.ts", "./FullScreenEntrance.ts", "./GameState.ts", "./HomeSceneController.ts", "./HomeUiController.ts", "./IdleIncomeController.ts", "./ManagementController.ts", "./ManagerSlotView.ts", "./MatchController.ts", "./MatchCourtSimulation.ts", "./MatchSession.ts", "./NumberGrowthAnimator.ts", "./PlayerAssets.ts", "./PlayerAvatarChip.ts", "./PreMatchController.ts", "./RecruitmentController.ts", "./RecruitmentProbabilityController.ts", "./RecruitmentRules.ts", "./RewardedAdService.ts", "./RosterSlotView.ts", "./TeamLevelController.ts", "./TopTeamInfoController.ts", "./GameFont.ts", "./LoadingController.ts"], function () {
  return {
    setters: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
    execute: function execute() {}
  };
});
System.register("chunks:///_virtual/ManagementController.ts", ["./rollupPluginModLoBabelHelpers.js", "cc", "./GameState.ts", "./FullScreenEntrance.ts", "./NumberGrowthAnimator.ts", "./RewardedAdService.ts", "./TeamLevelController.ts"], function (e) {
  var t, n, i, o, a, l, r, s, u, d, h, c, g, f, v, m, p, C, b, y, B, L, R, N, E, T, M, U, w, P;
  return {
    setters: [function (e) {
      t = e.inheritsLoose, n = e.createForOfIteratorHelperLoose, i = e.createClass, o = e["extends"], a = e.asyncToGenerator;
    }, function (e) {
      l = e.cclegacy, r = e._decorator, s = e.Color, u = e.director, d = e.Label, h = e.Button, c = e.Sprite, g = e.ProgressBar, f = e.Component;
    }, function (e) {
      v = e.gameStateEvents, m = e.GAME_STATE_EVENT_BUDGET_CHANGED, p = e.GAME_STATE_EVENT_MANAGEMENT_CHANGED, C = e.loadManagementEffectsConfig, b = e.loadJson, y = e.loadManagementLevels, B = e.getBudget, L = e.upgradeManagementWithBudget, R = e.upgradeManagementWithAd;
    }, function (e) {
      N = e.stopFullScreenEntrance, E = e.playFullScreenEntrance;
    }, function (e) {
      T = e.setGrowingNumber;
    }, function (e) {
      M = e.showRewardedVideo;
    }, function (e) {
      U = e.teamProgressionEvents, w = e.TEAM_PROGRESSION_EVENT_LEVEL_CHANGED, P = e.getStoredTeamLevel;
    }],
    execute: function execute() {
      var S, D;
      l._RF.push({}, "eb6efu13F1N9buNjelxjm/q", "ManagementController", void 0);
      var V = r.ccclass,
        H = 520,
        F = new s(112, 112, 112, 255),
        G = ["operationPresident", "headCoach", "scoutingDirector", "medicalTeam", "mediaTeam"],
        A = {
          operationPresident: {
            nodeName: "管理层-运营",
            tabName: "运营",
            effectDescription: "在线收益和比赛预算奖励",
            effectKey: "operationPresidentBudgetBonus",
            percentDisplay: !0
          },
          headCoach: {
            nodeName: "管理层-教练",
            tabName: "教练",
            effectDescription: "比赛球队总评",
            effectKey: "headCoachBattleOvrBonus",
            percentDisplay: !0
          },
          scoutingDirector: {
            nodeName: "管理层-球探",
            tabName: "球探",
            effectDescription: "招募池最高品质概率",
            effectKey: "scoutingDirectorHighestQualityWeightBonus",
            percentDisplay: !0
          },
          medicalTeam: {
            nodeName: "管理层-队医",
            tabName: "队医",
            effectDescription: "招募球员OVR向品质上限偏移",
            effectKey: "medicalTeamOvrRollPercentileShift",
            percentDisplay: !0
          },
          mediaTeam: {
            nodeName: "管理层-媒体",
            tabName: "媒体",
            effectDescription: "离线收益",
            effectKey: "mediaTeamOfflineBudgetBonus",
            percentDisplay: !0
          }
        };
      e("ManagementController", V("ManagementController")(((D = function (e) {
        function l() {
          for (var t, n = arguments.length, i = new Array(n), o = 0; o < n; o++) i[o] = arguments[o];
          return (t = e.call.apply(e, [this].concat(i)) || this).navigationRoot = null, t.budgetLabel = null, t.backButton = null, t.roleViews = new Map(), t.tabButtons = new Map(), t.tabHandlers = new Map(), t.budgetUpgradeHandlers = new Map(), t.adUpgradeHandlers = new Map(), t.originalSpriteGrayscale = new WeakMap(), t.originalLabelColors = new WeakMap(), t.selectedTabSpriteFrame = null, t.unselectedTabSpriteFrame = null, t.selectedTabLabelColor = null, t.unselectedTabLabelColor = null, t.selectedRole = "operationPresident", t.effectsConfig = null, t.economyConfig = null, t.loadingPromise = null, t.budgetUpgradeProcessing = !1, t.adUpgradeProcessing = !1, t.eventsBound = !1, t;
        }
        t(l, e);
        var r = l.prototype;
        return r.onLoad = function () {
          var e = this;
          l.instance = this, this.resolveHierarchy(), this.initializeVisibility(), this.ensureConfigurations().then(function () {
            return e.refreshCurrentRole(!1);
          });
        }, r.onEnable = function () {
          this.resolveHierarchy(), this.bindEvents();
        }, r.onDisable = function () {
          this.unbindEvents();
        }, r.onDestroy = function () {
          this.unbindEvents(), l.instance === this && (l.instance = null);
        }, r.openManagement = function (e) {
          var t,
            i,
            o = this;
          if (this.resolveHierarchy(), this.navigationRoot && this.roleViews.size === G.length) {
            var a = e && G.includes(e) ? e : this.selectedRole;
            this.selectedRole = a;
            for (var l, r = n(this.roleViews); !(l = r()).done;) {
              var s = l.value,
                u = s[0];
              s[1].root.active = u === a;
            }
            this.refreshTabStates(), this.navigationRoot.active = !0, this.navigationRoot.setSiblingIndex(Math.max(0, (null != (t = null == (i = this.navigationRoot.parent) ? void 0 : i.children.length) ? t : 1) - 1)), this.refreshCurrentRole(!1), this.ensureConfigurations().then(function () {
              return o.refreshCurrentRole(!1);
            }), this.playCombinedEntrance(a);
          } else console.error("[ManagementController] Management navigation or role content is missing.");
        }, r.switchRole = function (e) {
          var t,
            i,
            o = this;
          if (G.includes(e)) {
            if (this.resolveHierarchy(), this.navigationRoot && this.navigationRoot.active) {
              if (e !== this.selectedRole || null == (t = this.roleViews.get(e)) || !t.root.active) {
                N(this.navigationRoot);
                for (var a, l = n(this.roleViews); !(a = l()).done;) {
                  var r = a.value,
                    s = r[0],
                    u = r[1];
                  this.resetEntrance(u.root), u.root.active = s === e;
                }
                this.selectedRole = e, this.refreshTabStates(), this.refreshCurrentRole(!1), this.ensureConfigurations().then(function () {
                  return o.refreshCurrentRole(!1);
                });
                var d = null == (i = this.roleViews.get(e)) ? void 0 : i.root;
                d && E(d);
              }
            } else this.openManagement(e);
          } else console.warn("[ManagementController] Unknown management role.", e);
        }, r.closeManagement = function () {
          if (this.resolveHierarchy(), this.navigationRoot) {
            N(this.navigationRoot);
            for (var e, t = n(this.roleViews.values()); !(e = t()).done;) {
              var i = e.value;
              N(i.root), i.root.active = !1;
            }
            this.navigationRoot.active = !1;
          }
        }, r.resolveHierarchy = function () {
          var e,
            t,
            n,
            i,
            o,
            a = u.getScene();
          if (a && (this.navigationRoot = null != (e = this.findDescendantByName(a, "管理层-导航")) ? e : this.findCompatibleNavigationRoot(a), this.navigationRoot)) {
            this.budgetLabel = null != (t = null == (n = this.findByPath(this.navigationRoot, "顶部/预算/预算数量")) ? void 0 : n.getComponent(d)) ? t : null, this.backButton = null != (i = null == (o = this.findByPath(this.navigationRoot, "顶部/返回")) ? void 0 : o.getComponent(h)) ? i : null;
            for (var l = 0, r = G; l < r.length; l++) {
              var s,
                c = r[l],
                g = A[c],
                f = this.findDescendantByName(this.navigationRoot, g.nodeName);
              if (f) {
                var v = this.createRoleView(f);
                this.roleViews.set(c, v);
                var m = null == (s = this.findByPath(this.navigationRoot, "五个管理层/" + g.tabName)) ? void 0 : s.getComponent(h);
                m && this.tabButtons.set(c, m);
              }
            }
            this.captureTabVisualTemplates();
          }
        }, r.captureTabVisualTemplates = function () {
          var e, t, n, i, o, a, l, r, s, u;
          if (!(this.selectedTabSpriteFrame && this.unselectedTabSpriteFrame && this.selectedTabLabelColor && this.unselectedTabLabelColor)) {
            var h = this.tabButtons.get("operationPresident"),
              g = this.tabButtons.get("headCoach");
            this.selectedTabSpriteFrame = null != (e = null != (t = null == h ? void 0 : h.normalSprite) ? t : null == h || null == (n = h.target) || null == (n = n.getComponent(c)) ? void 0 : n.spriteFrame) ? e : null, this.unselectedTabSpriteFrame = null != (i = null != (o = null == g ? void 0 : g.normalSprite) ? o : null == g || null == (a = g.target) || null == (a = a.getComponent(c)) ? void 0 : a.spriteFrame) ? i : null, this.selectedTabLabelColor = null != (l = null == h || null == (r = h.node.getChildByName("Label")) || null == (r = r.getComponent(d)) ? void 0 : r.color.clone()) ? l : null, this.unselectedTabLabelColor = null != (s = null == g || null == (u = g.node.getChildByName("Label")) || null == (u = u.getComponent(d)) ? void 0 : u.color.clone()) ? s : null;
          }
        }, r.refreshTabStates = function () {
          this.captureTabVisualTemplates();
          for (var e, t = n(this.tabButtons); !(e = t()).done;) {
            var i,
              o,
              a,
              l = e.value,
              r = l[0],
              s = l[1],
              u = r === this.selectedRole,
              h = u ? this.selectedTabSpriteFrame : this.unselectedTabSpriteFrame,
              g = null != (i = null == (o = s.target) ? void 0 : o.getComponent(c)) ? i : s.node.getComponent(c);
            h && (s.normalSprite = h, g && (g.spriteFrame = h));
            var f = u ? this.selectedTabLabelColor : this.unselectedTabLabelColor,
              v = null == (a = s.node.getChildByName("Label")) ? void 0 : a.getComponent(d);
            f && v && (v.color = f.clone());
          }
        }, r.createRoleView = function (e) {
          var t,
            n,
            i,
            o,
            a,
            l,
            r,
            s,
            u,
            c,
            f,
            v,
            m,
            p,
            C,
            b,
            y,
            B,
            L,
            R,
            N,
            E,
            T,
            M,
            U,
            w,
            P,
            S,
            D = e.getChildByName("效果"),
            V = null != (t = null == D ? void 0 : D.children.find(function (e) {
              return "当前效果" === e.name && null !== e.getChildByName("效果数值");
            })) ? t : null,
            H = null != (n = null == D ? void 0 : D.getChildByName("下级效果")) ? n : null,
            F = null != (i = null == (o = e.getChildByName("使用预算升级")) ? void 0 : o.getComponent(h)) ? i : null,
            G = null != (a = null == (l = e.getChildByName("看广告升级")) ? void 0 : l.getComponent(h)) ? a : null;
          return {
            root: e,
            levelLabel: null != (r = null == (s = this.findByPath(e, "图/等级")) ? void 0 : s.getComponent(d)) ? r : null,
            progressBar: null != (u = null == (c = this.findByPath(e, "图/ProgressBar")) ? void 0 : c.getComponent(g)) ? u : null,
            currentDescriptionLabel: null != (f = null == V || null == (v = V.getChildByName("效果描述")) ? void 0 : v.getComponent(d)) ? f : null,
            currentEffectLabel: null != (m = null == V || null == (p = V.getChildByName("效果数值")) ? void 0 : p.getComponent(d)) ? m : null,
            nextDescriptionLabel: null != (C = null == H || null == (b = H.getChildByName("效果描述")) ? void 0 : b.getComponent(d)) ? C : null,
            nextEffectLabel: null != (y = null == H || null == (B = H.getChildByName("下级效果数值")) ? void 0 : B.getComponent(d)) ? y : null,
            deltaEffectLabel: null != (L = null == H || null == (R = H.getChildByName("升级提升数值")) ? void 0 : R.getComponent(d)) ? L : null,
            hintLabel: null != (N = null == (E = this.findByPath(D, "提示/提示")) ? void 0 : E.getComponent(d)) ? N : null,
            costLabel: null != (T = null == (M = this.findByPath(e, "升级消耗/消耗数值")) ? void 0 : M.getComponent(d)) ? T : null,
            budgetUpgradeButton: F,
            budgetUpgradeButtonLabel: null != (U = null == F || null == (w = F.node.getChildByName("Label")) ? void 0 : w.getComponent(d)) ? U : null,
            adUpgradeButton: G,
            adUpgradeButtonLabel: null != (P = null == G || null == (S = G.node.getChildByName("Label")) ? void 0 : S.getComponent(d)) ? P : null
          };
        }, r.initializeVisibility = function () {
          if (this.navigationRoot) if (this.roleViews.size === G.length) {
            if (this.navigationRoot.active) for (var e, t = n(this.roleViews); !(e = t()).done;) {
              var i = e.value,
                o = i[0];
              i[1].root.active = o === this.selectedRole;
            } else for (var a, l = n(this.roleViews.values()); !(a = l()).done;) {
              a.value.root.active = !1;
            }
          } else this.navigationRoot.active = !1;
        }, r.bindEvents = function () {
          var e,
            t = this;
          if (!this.eventsBound) {
            this.eventsBound = !0, null == (e = this.backButton) || e.node.on(h.EventType.CLICK, this.closeManagement, this);
            for (var n = function n() {
                var e,
                  n,
                  a,
                  l = o[i],
                  r = function r() {
                    return t.switchRole(l);
                  },
                  s = function s() {
                    t.onBudgetUpgradeClicked(l);
                  },
                  u = function u() {
                    t.onAdUpgradeClicked(l);
                  };
                t.tabHandlers.set(l, r), t.budgetUpgradeHandlers.set(l, s), t.adUpgradeHandlers.set(l, u), null == (e = t.tabButtons.get(l)) || e.node.on(h.EventType.CLICK, r, t), null == (n = t.roleViews.get(l)) || null == (n = n.budgetUpgradeButton) || n.node.on(h.EventType.CLICK, s, t), null == (a = t.roleViews.get(l)) || null == (a = a.adUpgradeButton) || a.node.on(h.EventType.CLICK, u, t);
              }, i = 0, o = G; i < o.length; i++) n();
            v.on(m, this.onBudgetChanged, this), v.on(p, this.onManagementChanged, this), U.on(w, this.onTeamLevelChanged, this);
          }
        }, r.unbindEvents = function () {
          var e;
          if (this.eventsBound) {
            this.eventsBound = !1, null == (e = this.backButton) || e.node.off(h.EventType.CLICK, this.closeManagement, this);
            for (var t = 0, n = G; t < n.length; t++) {
              var i,
                o,
                a,
                l = n[t],
                r = this.tabHandlers.get(l),
                s = this.budgetUpgradeHandlers.get(l),
                u = this.adUpgradeHandlers.get(l);
              if (r) null == (i = this.tabButtons.get(l)) || i.node.off(h.EventType.CLICK, r, this);
              if (s) null == (o = this.roleViews.get(l)) || null == (o = o.budgetUpgradeButton) || o.node.off(h.EventType.CLICK, s, this);
              if (u) null == (a = this.roleViews.get(l)) || null == (a = a.adUpgradeButton) || a.node.off(h.EventType.CLICK, u, this);
            }
            this.tabHandlers.clear(), this.budgetUpgradeHandlers.clear(), this.adUpgradeHandlers.clear(), v.off(m, this.onBudgetChanged, this), v.off(p, this.onManagementChanged, this), U.off(w, this.onTeamLevelChanged, this);
          }
        }, r.onBudgetUpgradeClicked = function () {
          var e = a( /*#__PURE__*/_regeneratorRuntime().mark(function _callee10(e) {
            var t, n;
            return _regeneratorRuntime().wrap(function _callee10$(_context11) {
              while (1) switch (_context11.prev = _context11.next) {
                case 0:
                  if (!(!this.budgetUpgradeProcessing && !this.adUpgradeProcessing)) {
                    _context11.next = 17;
                    break;
                  }
                  t = y()[e];
                  if (!this.canUpgrade(e, !0)) {
                    _context11.next = 17;
                    break;
                  }
                  this.budgetUpgradeProcessing = !0, this.refreshCurrentRole(!1);
                  _context11.prev = 4;
                  _context11.next = 7;
                  return L(e, P());
                case 7:
                  n = y()[e] > t;
                  this.refreshCurrentRole(n);
                  _context11.next = 14;
                  break;
                case 11:
                  _context11.prev = 11;
                  _context11.t0 = _context11["catch"](4);
                  console.error("[ManagementController] Budget upgrade failed.", _context11.t0);
                case 14:
                  _context11.prev = 14;
                  this.budgetUpgradeProcessing = !1, this.refreshCurrentRole(!1);
                  return _context11.finish(14);
                case 17:
                case "end":
                  return _context11.stop();
              }
            }, _callee10, this, [[4, 11, 14, 17]]);
          }));
          return function (t) {
            return e.apply(this, arguments);
          };
        }(), r.onAdUpgradeClicked = function () {
          var e = a( /*#__PURE__*/_regeneratorRuntime().mark(function _callee11(e) {
            var t, n;
            return _regeneratorRuntime().wrap(function _callee11$(_context12) {
              while (1) switch (_context12.prev = _context12.next) {
                case 0:
                  if (!(!this.adUpgradeProcessing && !this.budgetUpgradeProcessing && this.canUpgrade(e, !1))) {
                    _context12.next = 19;
                    break;
                  }
                  this.adUpgradeProcessing = !0, this.refreshCurrentRole(!1);
                  _context12.prev = 2;
                  _context12.next = 5;
                  return M();
                case 5:
                  if (_context12.sent) {
                    _context12.next = 7;
                    break;
                  }
                  return _context12.abrupt("return");
                case 7:
                  t = y()[e];
                  R(e, P());
                  n = y()[e] > t;
                  this.refreshCurrentRole(n);
                  _context12.next = 16;
                  break;
                case 13:
                  _context12.prev = 13;
                  _context12.t0 = _context12["catch"](2);
                  console.error("[ManagementController] Ad upgrade failed.", _context12.t0);
                case 16:
                  _context12.prev = 16;
                  this.adUpgradeProcessing = !1, this.refreshCurrentRole(!1);
                  return _context12.finish(16);
                case 19:
                case "end":
                  return _context12.stop();
              }
            }, _callee11, this, [[2, 13, 16, 19]]);
          }));
          return function (t) {
            return e.apply(this, arguments);
          };
        }(), r.onBudgetChanged = function () {
          this.refreshCurrentRole(!1);
        }, r.onManagementChanged = function () {
          this.refreshCurrentRole(!0);
        }, r.onTeamLevelChanged = function () {
          this.refreshCurrentRole(!1);
        }, r.ensureConfigurations = function () {
          var e = this;
          return null != this.loadingPromise || (this.loadingPromise = Promise.all([C(), b("data/balance/economy")]).then(function (t) {
            var n = t[0],
              i = t[1];
            e.effectsConfig = n, e.economyConfig = i;
          })["catch"](function (e) {
            console.error("[ManagementController] Failed to load management configuration.", e);
          })), this.loadingPromise;
        }, r.refreshCurrentRole = function (e) {
          var t,
            n,
            i = this,
            o = this.roleViews.get(this.selectedRole);
          if (o) {
            var a = this.selectedRole,
              l = A[a],
              r = y()[a],
              s = P(),
              u = r >= Math.min(H, s),
              d = this.getEffectRow(r),
              h = this.getEffectRow(u ? r : r + 1),
              c = null != (t = null == d ? void 0 : d[l.effectKey]) ? t : 0,
              g = null != (n = null == h ? void 0 : h[l.effectKey]) ? n : c,
              f = Math.max(0, g - c),
              v = this.getUpgradeCost(r),
              m = B(),
              p = !u && null !== v && m + Number.EPSILON >= v && !this.budgetUpgradeProcessing && !this.adUpgradeProcessing,
              C = !u && !this.budgetUpgradeProcessing && !this.adUpgradeProcessing;
            T(this.budgetLabel, m, function (e) {
              return String(Math.floor(e));
            }, {
              animateGrowth: e
            }), T(o.levelLabel, r, function (e) {
              return "Lv. " + Math.floor(e) + " / " + H;
            }, {
              animateGrowth: e
            }), o.progressBar && (o.progressBar.progress = Math.max(0, Math.min(1, r / H))), o.currentDescriptionLabel && (o.currentDescriptionLabel.string = l.effectDescription), o.nextDescriptionLabel && (o.nextDescriptionLabel.string = l.effectDescription), T(o.currentEffectLabel, c, function (e) {
              return i.formatEffect(e, l.percentDisplay);
            }, {
              animateGrowth: e
            }), T(o.nextEffectLabel, g, function (e) {
              return i.formatEffect(e, l.percentDisplay);
            }, {
              animateGrowth: e
            }), T(o.deltaEffectLabel, f, function (e) {
              return i.formatEffect(e, l.percentDisplay);
            }, {
              animateGrowth: e
            }), T(o.costLabel, null != v ? v : 0, function (e) {
              return u ? "MAX" : String(Math.floor(e));
            }, {
              animateGrowth: e
            }), o.hintLabel && (o.hintLabel.string = r >= H ? "已达到520级上限" : r >= s ? "管理层等级不能超过球队等级" : p ? "升级后效果立即生效" : "预算不足，可观看广告免费升级"), o.budgetUpgradeButtonLabel && (o.budgetUpgradeButtonLabel.string = u ? "已达上限" : p ? "升级" : "预算不足"), o.adUpgradeButtonLabel && (o.adUpgradeButtonLabel.string = u ? "已达上限" : "免费升级"), this.setButtonAvailable(o.budgetUpgradeButton, p), this.setButtonAvailable(o.adUpgradeButton, C);
          }
        }, r.canUpgrade = function (e, t) {
          var n = y()[e];
          if (n >= Math.min(H, P())) return !1;
          if (!t) return !0;
          var i = this.getUpgradeCost(n);
          return null !== i && B() + Number.EPSILON >= i;
        }, r.getEffectRow = function (e) {
          var t, n, i;
          if (null == (t = this.effectsConfig) || !t.levelEffects.length) return null;
          var o = Math.min(H, Math.max(0, Math.floor(e)));
          return null != (n = null != (i = this.effectsConfig.levelEffects.find(function (e) {
            return e.managementLevel === o;
          })) ? i : this.effectsConfig.levelEffects[Math.min(o, this.effectsConfig.levelEffects.length - 1)]) ? n : null;
        }, r.getUpgradeCost = function (e) {
          var t,
            n = null == (t = this.economyConfig) ? void 0 : t.managementUpgradeCost;
          if (!n || e >= Math.min(H, n.maxLevel)) return null;
          var i = n.upgradeCostToNextLevel.find(function (t) {
            return t.fromLevel === e;
          });
          return i && Number.isFinite(i.budgetCost) ? Math.max(0, i.budgetCost) : null;
        }, r.formatEffect = function (e, t) {
          var n = Number.isFinite(e) ? Math.max(0, e) : 0;
          return t ? "+" + this.trimTrailingZeros(100 * n) + "%" : "+" + this.trimTrailingZeros(n);
        }, r.trimTrailingZeros = function (e) {
          return e.toFixed(2).replace(/\.?0+$/, "");
        }, r.setButtonAvailable = function (e, t) {
          if (e) {
            e.enabled = !0, e.interactable = t, e.hoverSprite = null, e.disabledSprite = null;
            for (var i, o = n(e.node.getComponentsInChildren(c)); !(i = o()).done;) {
              var a,
                l = i.value,
                r = null != (a = this.originalSpriteGrayscale.get(l)) ? a : l.grayscale;
              this.originalSpriteGrayscale.set(l, r), l.grayscale = !t || r;
            }
            for (var s, u = n(e.node.getComponentsInChildren(d)); !(s = u()).done;) {
              var h,
                g = s.value,
                f = null != (h = this.originalLabelColors.get(g)) ? h : g.color.clone();
              this.originalLabelColors.set(g, f), g.color = t ? f.clone() : F.clone();
            }
          }
        }, r.playCombinedEntrance = function (e) {
          var t;
          if (this.navigationRoot) {
            var n = null == (t = this.roleViews.get(e)) ? void 0 : t.root;
            if (n) {
              var i = this.navigationRoot.getChildByName("bg"),
                o = this.navigationRoot.getChildByName("顶部"),
                a = this.navigationRoot.getChildByName("五个管理层"),
                l = n.getChildByName("图"),
                r = n.getChildByName("效果"),
                s = n.getChildByName("升级消耗"),
                u = n.getChildByName("使用预算升级"),
                d = n.getChildByName("看广告升级");
              E(this.navigationRoot, {
                backgroundNodes: i ? [i] : [],
                moduleGroups: [{
                  nodes: [o, a].filter(function (e) {
                    return Boolean(e);
                  }),
                  order: 0
                }, {
                  nodes: [l].filter(function (e) {
                    return Boolean(e);
                  }),
                  order: 1
                }, {
                  nodes: [r].filter(function (e) {
                    return Boolean(e);
                  }),
                  order: 2
                }, {
                  nodes: [s].filter(function (e) {
                    return Boolean(e);
                  }),
                  order: 3
                }, {
                  nodes: [u, d].filter(function (e) {
                    return Boolean(e);
                  }),
                  order: 4
                }]
              });
            }
          }
        }, r.resetEntrance = function (e) {
          N(e);
        }, r.findCompatibleNavigationRoot = function (e) {
          var t = this,
            n = this.findDescendantByName(e, "管理层页面");
          return n && G.every(function (e) {
            return t.findDescendantByName(n, A[e].nodeName);
          }) ? n : null;
        }, r.findDescendantByName = function (e, t) {
          if (e.name === t) return e;
          for (var i, o = n(e.children); !(i = o()).done;) {
            var a = i.value,
              l = this.findDescendantByName(a, t);
            if (l) return l;
          }
          return null;
        }, r.findByPath = function (e, t) {
          for (var i, o = e, a = n(t.split("/")); !(i = a()).done;) {
            var l,
              r,
              s = i.value;
            if (!(o = null != (l = null == (r = o) ? void 0 : r.getChildByName(s)) ? l : null)) return null;
          }
          return o;
        }, i(l, [{
          key: "currentRole",
          get: function get() {
            return this.selectedRole;
          }
        }, {
          key: "managementLevelsSnapshot",
          get: function get() {
            return o({}, y());
          }
        }]), l;
      }(f)).instance = null, S = D)) || S);
      l._RF.pop();
    }
  };
});
System.register("chunks:///_virtual/ManagerSlotView.ts", ["./rollupPluginModLoBabelHelpers.js", "cc"], function (e) {
  var t, n, i, l, o, r, a, u, c, p;
  return {
    setters: [function (e) {
      t = e.applyDecoratedDescriptor, n = e.inheritsLoose, i = e.initializerDefineProperty, l = e.assertThisInitialized;
    }, function (e) {
      o = e.cclegacy, r = e._decorator, a = e.Sprite, u = e.Label, c = e.Button, p = e.Component;
    }],
    execute: function execute() {
      var s, h, b, g, f, d, y, L, m;
      o._RF.push({}, "41008hGiwRI6JubA5qLFukl", "ManagerSlotView", void 0);
      var v = r.ccclass,
        w = r.property;
      e("ManagerSlotView", (s = v("ManagerSlotView"), h = w(a), b = w(u), g = w(c), s((y = t((d = function (e) {
        function t() {
          for (var t, n = arguments.length, o = new Array(n), r = 0; r < n; r++) o[r] = arguments[r];
          return t = e.call.apply(e, [this].concat(o)) || this, i(t, "icon", y, l(t)), i(t, "titleLabel", L, l(t)), i(t, "openButton", m, l(t)), t;
        }
        n(t, e);
        var o = t.prototype;
        return o.onLoad = function () {
          var e, t, n, i, l;
          null != this.titleLabel || (this.titleLabel = null != (e = null != (t = null == (n = this.node.getChildByName("等级")) ? void 0 : n.getComponent(u)) ? t : null == (i = this.node.getChildByName("LevelText")) ? void 0 : i.getComponent(u)) ? e : null), null != this.openButton || (this.openButton = null != (l = this.node.getComponent(c)) ? l : this.node.getComponentInChildren(c));
        }, o.setup = function (e) {
          this.titleLabel && (this.titleLabel.string = e);
        }, t;
      }(p)).prototype, "icon", [h], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return null;
        }
      }), L = t(d.prototype, "titleLabel", [b], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return null;
        }
      }), m = t(d.prototype, "openButton", [g], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return null;
        }
      }), f = d)) || f));
      o._RF.pop();
    }
  };
});
System.register("chunks:///_virtual/MatchController.ts", ["./rollupPluginModLoBabelHelpers.js", "cc", "./GameState.ts", "./MatchSession.ts", "./PlayerAssets.ts", "./RosterSlotView.ts", "./RewardedAdService.ts", "./FullScreenEntrance.ts", "./NumberGrowthAnimator.ts", "./GameFont.ts", "./CourtSimulationController.ts", "./MatchCourtSimulation.ts"], function (t) {
  var e, n, i, o, r, a, s, l, h, u, c, d, f, p, m, y, g, v, P, C, M, S, B, b, w, R, T, x, L, I, A, N, W, F, k, G, Q;
  return {
    setters: [function (t) {
      e = t.inheritsLoose, n = t.createForOfIteratorHelperLoose, i = t.asyncToGenerator;
    }, function (t) {
      o = t.cclegacy, r = t._decorator, a = t.Button, s = t.Label, l = t.director, h = t.Sprite, u = t.RichText, c = t.UITransform, d = t.TTFFont, f = t.resources, p = t.Color, m = t.Component, y = t.Prefab, g = t.Font, v = t.instantiate;
    }, function (t) {
      P = t.INT32_MAX, C = t.settleBaseMatchReward, M = t.advanceSeasonAfterWin, S = t.emitMatchSettled, B = t.loadSeasonState, b = t.settleAdMatchReward;
    }, function (t) {
      w = t.getCurrentMatchSession, R = t.clearCurrentMatchSession, T = t.setHomepageReturnTarget;
    }, function (t) {
      x = t.loadPlayerPortrait, L = t.loadRoundQualityFrame;
    }, function (t) {
      I = t.formatPlayerOverall;
    }, function (t) {
      A = t.showRewardedVideo;
    }, function (t) {
      N = t.playFullScreenEntrance, W = t.stopFullScreenEntrance;
    }, function (t) {
      F = t.setGrowingNumber;
    }, function (t) {
      k = t.applyGameFont;
    }, function (t) {
      G = t.CourtSimulationController;
    }, function (t) {
      Q = t.MatchCourtSimulation;
    }],
    execute: function execute() {
      var E;
      o._RF.push({}, "a02d8uLMcFGvpOkZX2YlnOH", "MatchController", void 0);
      var V = r.ccclass,
        z = 120,
        H = 30,
        O = 60;
      t("MatchController", V("MatchController")(E = function (t) {
        function o() {
          for (var e, n = arguments.length, i = new Array(n), o = 0; o < n; o++) i[o] = arguments[o];
          return (e = t.call.apply(t, [this].concat(i)) || this).page = null, e.session = null, e.result = null, e.victoryPage = null, e.defeatPage = null, e.doubleSpeedButton = null, e.forcedWinButton = null, e.skipButton = null, e.speedMultiplier = 1, e.requestedSpeedMultiplier = 1, e.elapsedMatchSeconds = 0, e.commentaryLines = [], e.plannedPlays = [], e.nextPlayIndex = 0, e.playerQuarterScores = [0, 0, 0, 0], e.opponentQuarterScores = [0, 0, 0, 0], e.awardedPointsByPlay = new Map(), e.commentaryTeamColors = [new p(65, 147, 132, 255), new p(204, 87, 40, 255)], e.courtSimulation = null, e.initialized = !1, e.finished = !1, e.adProcessing = !1, e.retryCount = 0, e.originalButtonGrayscale = new WeakMap(), e.onCourtScore = function (t, n, i) {
            var o;
            if (!(e.finished || n <= 0)) {
              var r = null != (o = e.awardedPointsByPlay.get(i.index)) ? o : 0,
                a = Math.max(0, i.points - r),
                s = Math.min(n, a);
              if (!(s <= 0)) (0 === t ? e.playerQuarterScores : e.opponentQuarterScores)[i.quarter] += s, e.awardedPointsByPlay.set(i.index, r + s), e.refreshScorePresentation(!0);
            }
          }, e.onCourtCommentary = function (t, n, i) {
            e.pushCommentary(Math.max(n.startSecond, e.elapsedMatchSeconds), t, i);
          }, e.onCourtPlayComplete = function () {
            e.speedMultiplier = e.requestedSpeedMultiplier, e.startDueCourtPlay();
          }, e.claimVictoryAdReward = function () {
            e.claimVictoryAdRewardAsync();
          }, e.retryWithAdBonus = function () {
            e.retryWithAdBonusAsync();
          }, e.onForcedWinClicked = function () {
            e.forceWinWithAd();
          }, e.toggleDoubleSpeed = function () {
            var t;
            e.requestedSpeedMultiplier = 1 === e.requestedSpeedMultiplier ? 2 : 1, null != (t = e.courtSimulation) && t.isBusy || (e.speedMultiplier = e.requestedSpeedMultiplier), e.setButtonLabel(e.doubleSpeedButton, 2 === e.requestedSpeedMultiplier ? "一倍速" : "二倍速");
          }, e.skipMatch = function () {
            e.initialized && !e.finished && (e.settleRemainingPlays(), e.elapsedMatchSeconds = z, e.finishMatch());
          }, e;
        }
        e(o, t);
        var r = o.prototype;
        return r.onLoad = function () {
          var t;
          if (this.page = this.node.getChildByName("比赛页面"), this.session = w(), !this.page || !this.session) return console.error("[MatchController] Missing match page or prepared match session."), void (this.enabled = !1);
          var e = null == (t = this.findByPath(this.page, "球场模拟")) ? void 0 : t.getComponent(G);
          e && (e.enabled = !1), this.resolveButtons(), this.prepareButtonVisuals(this.node);
        }, r.onEnable = function () {
          var t, e, n;
          null == (t = this.doubleSpeedButton) || t.node.on(a.EventType.CLICK, this.toggleDoubleSpeed, this), null == (e = this.forcedWinButton) || e.node.on(a.EventType.CLICK, this.onForcedWinClicked, this), null == (n = this.skipButton) || n.node.on(a.EventType.CLICK, this.skipMatch, this);
        }, r.start = function () {
          this.initialize();
        }, r.update = function (t) {
          var e;
          this.initialized && !this.finished && this.result && (this.elapsedMatchSeconds = Math.min(z, this.elapsedMatchSeconds + t * this.speedMultiplier), this.refreshClockPresentation(), this.startDueCourtPlay(), this.elapsedMatchSeconds >= z && this.nextPlayIndex >= this.plannedPlays.length && (null == (e = this.courtSimulation) || !e.isBusy) && this.finishMatch());
        }, r.onDisable = function () {
          var t, e, n;
          null == (t = this.doubleSpeedButton) || t.node.off(a.EventType.CLICK, this.toggleDoubleSpeed, this), null == (e = this.forcedWinButton) || e.node.off(a.EventType.CLICK, this.onForcedWinClicked, this), null == (n = this.skipButton) || n.node.off(a.EventType.CLICK, this.skipMatch, this), this.stopAllMotion();
        }, r.initialize = function () {
          var t = i( /*#__PURE__*/_regeneratorRuntime().mark(function _callee12() {
            var t, e, n, i;
            return _regeneratorRuntime().wrap(function _callee12$(_context13) {
              while (1) switch (_context13.prev = _context13.next) {
                case 0:
                  _context13.prev = 0;
                  _context13.next = 3;
                  return Promise.all([this.loadResource("prefabs/比赛/胜利弹窗", y), this.loadResource("prefabs/比赛/失败弹窗", y), this.loadResource("fonts/zpix", g)]);
                case 3:
                  t = _context13.sent;
                  e = t[0];
                  n = t[1];
                  i = t[2];
                  if (!(!this.isValid || !this.page || !this.session)) {
                    _context13.next = 9;
                    break;
                  }
                  return _context13.abrupt("return");
                case 9:
                  this.victoryPage = v(e);
                  this.defeatPage = v(n);
                  this.node.addChild(this.victoryPage);
                  this.node.addChild(this.defeatPage);
                  this.victoryPage.active = !1;
                  this.defeatPage.active = !1;
                  k(this.node.scene, i);
                  this.bindResultButtons();
                  _context13.next = 19;
                  return this.bindCourtPlayers();
                case 19:
                  this.startPreparedMatch();
                  _context13.next = 25;
                  break;
                case 22:
                  _context13.prev = 22;
                  _context13.t0 = _context13["catch"](0);
                  console.error("[MatchController] Failed to initialize match.", _context13.t0);
                case 25:
                case "end":
                  return _context13.stop();
              }
            }, _callee12, this, [[0, 22]]);
          }));
          return function () {
            return t.apply(this, arguments);
          };
        }(), r.startPreparedMatch = function (t) {
          var e, n, i;
          void 0 === t && (t = !1), this.session && (this.stopAllMotion(), this.finished = !1, this.adProcessing = !1, this.speedMultiplier = 1, this.requestedSpeedMultiplier = 1, this.elapsedMatchSeconds = 0, this.commentaryLines = [], this.nextPlayIndex = 0, this.playerQuarterScores = [0, 0, 0, 0], this.opponentQuarterScores = [0, 0, 0, 0], this.awardedPointsByPlay.clear(), this.result = this.createMatchResult(t), this.plannedPlays = this.createPlayPlan(this.result), this.victoryPage && (this.victoryPage.active = !1), this.defeatPage && (this.defeatPage.active = !1), this.setButtonLabel(this.doubleSpeedButton, "二倍速"), this.forcedWinButton && (this.forcedWinButton.node.active = "uncertain" === this.result.band && !this.result.won, this.setButtonAvailable(this.forcedWinButton, this.forcedWinButton.node.active)), this.refreshTeamIdentity(), this.refreshScorePresentation(!1), this.refreshClockPresentation(), this.pushCommentary(0, t ? "广告助威生效，球队士气被彻底点燃，比赛从第一节重新开始！" : this.retryCount > 0 ? "广告加成生效，本场球队总评临时提升" + this.session.temporaryBonusPercent + "%！" : this.session.playerTeamName + "与" + this.session.opponentTeamName + "的比赛正式开始！"), null == (e = this.courtSimulation) || e.reset(null != (n = null == (i = this.plannedPlays[0]) ? void 0 : i.offenseTeam) ? n : 0), this.initialized = !0, this.startDueCourtPlay());
        }, r.createMatchResult = function (t) {
          var e = this.session,
            n = Math.min(P, Math.floor(e.playerOverall * (1 + Math.max(0, e.temporaryBonusPercent) / 100))),
            i = e.playerRoster.length >= 12 && e.playerRoster.every(function (t) {
              return null == t ? void 0 : t.isConceptGod;
            }),
            o = e.opponentOverall > 0 ? n / e.opponentOverall : Number.POSITIVE_INFINITY,
            r = i ? "full-concept" : o >= 1.1 ? "auto-win" : o <= .9 ? "auto-lose" : "uncertain",
            a = this.createSeededRandom(e.matchId + ":" + this.retryCount + ":" + e.temporaryBonusPercent),
            s = t || "full-concept" === r || "auto-win" === r || "uncertain" === r && a() < .5,
            l = this.calculateRawScore(e.playerRoster, a),
            h = this.calculateRawScore(e.opponentRoster, a),
            u = Math.abs(n - e.opponentOverall) / Math.max(1, n, e.opponentOverall),
            c = s ? l : h,
            d = s ? h : l,
            f = Math.max(1, Math.ceil(c * (.01 + .25 * u + .03 * a()))),
            p = "uncertain" === r ? Math.min(f, Math.max(1, Math.ceil(.12 * c))) : f,
            m = Math.min(P - 1, d),
            y = Math.min(P, Math.max(c, m + p)),
            g = s ? y : m,
            v = s ? m : y,
            C = this.normalizeVisibleScores(g, v, s),
            M = C[0],
            S = C[1];
          return {
            band: r,
            won: s,
            forcedWin: t,
            playerFinalScore: M,
            opponentFinalScore: S,
            playerQuarterScores: this.distributeQuarterScores(M, a),
            opponentQuarterScores: this.distributeQuarterScores(S, a)
          };
        }, r.calculateRawScore = function (t, e) {
          var n = t.filter(function (t) {
            return Boolean(t);
          });
          if (0 === n.length) return 0;
          var i = n.reduce(function (t, e) {
            return t + Math.max(0, e.attributes.scoring);
          }, 0);
          return Math.min(P, Math.floor(i / n.length * 5 * .1 * (.9 + .2 * e())));
        }, r.distributeQuarterScores = function (t, e) {
          for (var n = Array.from({
              length: 4
            }, function () {
              return Math.floor(t / 4);
            }), i = t % 4, o = [0, 1, 2, 3].sort(function () {
              return e() - .5;
            }), r = 0; i > 0; r += 1, i -= 1) n[o[r % o.length]] += 1;
          return n;
        }, r.normalizeVisibleScores = function (t, e, n) {
          var i = Math.max(1, t, e),
            o = Math.min(1, O / i),
            r = t > 0 ? Math.max(1, Math.floor(t * o)) : 0,
            a = e > 0 ? Math.max(1, Math.floor(e * o)) : 0;
          return n && r <= a ? (a >= O && (a = 59), r = Math.min(O, a + 1)) : !n && a <= r && (r >= O && (r = 59), a = Math.min(O, r + 1)), [r, a];
        }, r.createPlayPlan = function (t) {
          for (var e, n = this.createSeededRandom((null == (e = this.session) ? void 0 : e.matchId) + ":plays:" + this.retryCount + ":" + t.forcedWin), i = [], o = ["five-out", "four-out-one-in", "pick-and-roll", "low-post", "horns"], r = n() < .5 ? 0 : 1, a = null, s = 0; s < 4; s += 1) for (var l = [this.createPossessionPoints(t.playerQuarterScores[s], n), this.createPossessionPoints(t.opponentQuarterScores[s], n)], h = [0, 0], u = 0; u < 10; u += 1) {
            var c = l[r][h[r]];
            h[r] += 1;
            var d = a ? o.filter(function (t) {
                return t !== a;
              }) : o,
              f = d[Math.floor(n() * d.length)];
            a = f;
            var p = this.pickPlayAction(c, n),
              m = this.pickReboundResult(n);
            i.push({
              index: i.length,
              quarter: s,
              startSecond: s * H + 3 * u,
              offenseTeam: r,
              tactic: f,
              action: p,
              points: c,
              shooterIndex: Math.floor(5 * n()),
              handlerIndex: Math.floor(5 * n()),
              passerIndex: Math.floor(5 * n()),
              made: c > 0,
              foul: "free-throw" === p || "and-one" === p,
              rebound: m,
              contestedRebound: n() < .58
            }), r = 1 - r;
          }
          return i;
        }, r.createPossessionPoints = function (t, e) {
          for (var n = [0, 0, 0, 0, 0], i = Math.max(0, Math.min(15, t)), o = function o() {
              var t = n.length - r - 1,
                o = Math.max(0, i - 3 * t),
                a = Math.min(3, i);
              if (a <= o) n[r] = o;else {
                var s = Array.from({
                    length: a - o + 1
                  }, function (t, e) {
                    return o + e;
                  }),
                  l = s.filter(function (t) {
                    return 0 === t || 2 === t || 3 === t || 1 === i;
                  }),
                  h = l.length > 0 ? l : s;
                n[r] = h[Math.floor(e() * h.length)];
              }
              i -= n[r];
            }, r = 0; r < n.length; r += 1) o();
          return n.sort(function () {
            return e() - .5;
          });
        }, r.pickPlayAction = function (t, e) {
          if (3 === t) return e() < .84 ? "three" : "and-one";
          if (2 === t) {
            if (e() < .14) return "free-throw";
            var n = ["jumper", "layup", "dunk"];
            return n[Math.floor(e() * n.length)];
          }
          if (1 === t) return "free-throw";
          var i = e();
          if (i < .18) return "turnover";
          if (i < .26) return "free-throw";
          var o = ["three", "jumper", "layup", "dunk"];
          return o[Math.floor(e() * o.length)];
        }, r.pickReboundResult = function (t) {
          var e = t();
          return e < .16 ? "self" : e < .42 ? "teammate" : "opponent";
        }, r.startDueCourtPlay = function () {
          if (!(!this.courtSimulation || this.courtSimulation.isBusy || this.nextPlayIndex >= this.plannedPlays.length)) {
            var t = this.plannedPlays[this.nextPlayIndex];
            t.startSecond > this.elapsedMatchSeconds + .001 || this.courtSimulation.play(t, this.speedMultiplier) && (this.nextPlayIndex += 1);
          }
        }, r.refreshScorePresentation = function (t) {
          if (this.page) {
            for (var e = 0; e < 4; e += 1) this.setGrowingScoreLabel("比分/每节比分/Q" + (e + 1) + "/自己", this.playerQuarterScores[e], t), this.setGrowingScoreLabel("比分/每节比分/Q" + (e + 1) + "/对方", this.opponentQuarterScores[e], t);
            this.setGrowingScoreLabel("比分/总比分/自己", this.playerQuarterScores.reduce(function (t, e) {
              return t + e;
            }, 0), t), this.setGrowingScoreLabel("比分/总比分/对方", this.opponentQuarterScores.reduce(function (t, e) {
              return t + e;
            }, 0), t);
          }
        }, r.refreshClockPresentation = function () {
          if (this.page) {
            var t = Math.min(3, Math.floor(this.elapsedMatchSeconds / H)),
              e = this.elapsedMatchSeconds >= z ? H : this.elapsedMatchSeconds % H,
              n = Math.max(0, Math.ceil(H - e));
            this.setLabel("标题", "第" + (t + 1) + "节 " + this.formatClock(n));
          }
        }, r.refreshTeamIdentity = function () {
          var t,
            e,
            n = this.session;
          this.setLabel("比分/我的球队/球队简称/Label", null != (t = Array.from(n.playerTeamName)[0]) ? t : "我"), this.setLabel("比分/我的球队/球队名", n.playerTeamName), this.setLabel("比分/对方球队/球队简称/Label", null != (e = Array.from(n.opponentTeamName)[0]) ? e : "敌"), this.setLabel("比分/对方球队/球队名", n.opponentTeamName), this.captureCommentaryTeamColors();
          for (var i = 0; i < 4; i += 1) this.setLabel("比分/每节比分/Q" + (i + 1) + "/自己", "0"), this.setLabel("比分/每节比分/Q" + (i + 1) + "/对方", "0");
        }, r.pushCommentary = function (t, e, n) {
          var i = this;
          if (void 0 === n && (n = []), this.session && e) {
            this.commentaryLines.push({
              time: this.formatClock(Math.floor(t)),
              richText: this.createRichCommentary(e, n)
            }), this.commentaryLines = this.commentaryLines.slice(-5);
            var o = ["过去01", "过去02", "过去03", "过去04", "最新"];
            o.forEach(function (t, e) {
              var n,
                r,
                a = i.commentaryLines[i.commentaryLines.length - o.length + e];
              i.setLabel("文字播报/" + t + "/时间", null != (n = null == a ? void 0 : a.time) ? n : "--:--"), i.setCommentaryRichText("文字播报/" + t + "/播报内容", null != (r = null == a ? void 0 : a.richText) ? r : "");
            });
          }
        }, r.bindCourtPlayers = function () {
          var t = i( /*#__PURE__*/_regeneratorRuntime().mark(function _callee14() {
            var t, e, n, o, r, a, l;
            return _regeneratorRuntime().wrap(function _callee14$(_context15) {
              while (1) switch (_context15.prev = _context15.next) {
                case 0:
                  if (!(this.page && this.session)) {
                    _context15.next = 8;
                    break;
                  }
                  t = this.findByPath(this.page, "球场模拟/players");
                  if (!t) {
                    _context15.next = 8;
                    break;
                  }
                  e = [].concat(t.children.filter(function (t) {
                    return /^我方球员\d+$/.test(t.name);
                  }), t.children.filter(function (t) {
                    return /^敌方球员\d+$/.test(t.name);
                  })).slice(0, 10), n = this.getTopFive(this.session.playerRoster), o = this.getTopFive(this.session.opponentRoster), r = [].concat(n, o);
                  _context15.next = 6;
                  return Promise.all(e.map(i( /*#__PURE__*/_regeneratorRuntime().mark(function _callee13(t, e) {
                    var n, i, o, a, l, u, c, d, f, p, m, y, g, v, C;
                    return _regeneratorRuntime().wrap(function _callee13$(_context14) {
                      while (1) switch (_context14.prev = _context14.next) {
                        case 0:
                          l = null != (n = r[e]) ? n : null;
                          if (!(t.active = Boolean(l), l)) {
                            _context14.next = 12;
                            break;
                          }
                          u = null == (i = t.getChildByName("头像")) ? void 0 : i.getComponent(h);
                          c = null == (o = t.getChildByName("边框")) ? void 0 : o.getComponent(h);
                          d = null == (a = t.getChildByName("ovr")) ? void 0 : a.getComponent(s);
                          _context14.next = 7;
                          return Promise.all([x(l), L(l.qualityId)]);
                        case 7:
                          f = _context14.sent;
                          p = f[0];
                          m = f[1];
                          u && (u.spriteFrame = p), c && m && (c.spriteFrame = m), d && (d.string = l.overall >= P ? "MAX" : I(l.overall));
                          for (y = 0, g = ["持球点-右", "运球点-右", "投射点-右", "持球点-左", "运球点-左", "投射点-左"]; y < g.length; y++) {
                            v = g[y], C = t.getChildByName(v);
                            C && (C.active = !1);
                          }
                        case 12:
                        case "end":
                          return _context14.stop();
                      }
                    }, _callee13);
                  }))));
                case 6:
                  a = this.findByPath(this.page, "球场模拟/球场范围"), l = this.findByPath(this.page, "球场模拟/篮球");
                  a && l ? (this.courtSimulation = new Q(t, a, l, n, o, {
                    onScore: this.onCourtScore,
                    onCommentary: this.onCourtCommentary,
                    onPlayComplete: this.onCourtPlayComplete
                  }), this.courtSimulation.isReady || (console.error("[MatchController] Match court simulation references are incomplete."), this.courtSimulation = null)) : console.error("[MatchController] Match court markers or ball are incomplete.");
                case 8:
                case "end":
                  return _context15.stop();
              }
            }, _callee14, this);
          }));
          return function () {
            return t.apply(this, arguments);
          };
        }(), r.finishMatch = function () {
          !this.finished && this.result && this.session && (this.finished = !0, this.elapsedMatchSeconds = z, this.refreshClockPresentation(), this.refreshScorePresentation(!1), this.stopAllMotion(), this.forcedWinButton && (this.forcedWinButton.node.active = !1), this.result.won ? this.showVictory() : this.showDefeat());
        }, r.showVictory = function () {
          var t, e, n;
          if (this.victoryPage && this.result && this.session) {
            var i = this.calculateMatchReward(),
              o = C(this.session.matchId, i),
              r = M(this.session.matchId);
            S({
              matchId: this.session.matchId,
              won: !0,
              baseReward: o ? i : 0,
              adReward: 0,
              advanced: r
            }), this.setResultPageLabels(this.victoryPage);
            var l = null != (t = null == (e = this.findByPath(this.victoryPage, "本场奖励/管理层-选中背景/获得数值")) ? void 0 : e.getComponent(s)) ? t : null,
              h = B().lastAdRewardMatchId === this.session.matchId;
            F(l, h ? 2 * i : i, function (t) {
              return "+" + I(Math.floor(t));
            }, {
              from: 0,
              animateGrowth: !0
            }), this.setNodeLabel(this.victoryPage, "看广告双倍领取/数值", I(2 * i));
            var u = null == (n = this.victoryPage.getChildByName("看广告双倍领取")) ? void 0 : n.getComponent(a);
            u && this.setButtonAvailable(u, !h), N(this.victoryPage, {
              backgroundNodes: this.nodes(this.victoryPage, ["遮罩", "bg"]),
              moduleGroups: [{
                nodes: this.nodes(this.victoryPage, ["顶部装饰"]),
                order: 0
              }, {
                nodes: this.nodes(this.victoryPage, ["赛程"]),
                order: 1
              }, {
                nodes: this.nodes(this.victoryPage, ["比分"]),
                order: 2
              }, {
                nodes: this.nodes(this.victoryPage, ["本场奖励"]),
                order: 3
              }, {
                nodes: this.nodes(this.victoryPage, ["看广告双倍领取"]),
                order: 4
              }, {
                nodes: this.nodes(this.victoryPage, ["继续下一场", "返回"]),
                order: 5
              }]
            });
          }
        }, r.showDefeat = function () {
          this.defeatPage && this.result && this.session && (S({
            matchId: this.session.matchId,
            won: !1,
            baseReward: 0,
            adReward: 0,
            advanced: !1
          }), this.setResultPageLabels(this.defeatPage), N(this.defeatPage, {
            backgroundNodes: this.nodes(this.defeatPage, ["遮罩", "bg"]),
            moduleGroups: [{
              nodes: this.nodes(this.defeatPage, ["失败"]),
              order: 0
            }, {
              nodes: this.nodes(this.defeatPage, ["赛程"]),
              order: 1
            }, {
              nodes: this.nodes(this.defeatPage, ["比分"]),
              order: 2
            }, {
              nodes: this.nodes(this.defeatPage, ["看广告获得加成重来"]),
              order: 3
            }, {
              nodes: this.nodes(this.defeatPage, ["调整阵容"]),
              order: 4
            }]
          }));
        }, r.setResultPageLabels = function (t) {
          if (this.session && this.result) {
            var e = this.session.matchNumber <= 82,
              n = e ? "常规赛" : "季后赛",
              i = e ? this.session.matchNumber : this.session.matchNumber - 82;
            this.setNodeLabel(t, "赛程/赛程", this.session.difficultyQualityName + " " + n + " 第" + i + "场"), this.setNodeLabel(t, "比分/总比分/自己", String(this.result.playerFinalScore)), this.setNodeLabel(t, "比分/总比分/对方", String(this.result.opponentFinalScore)), this.setNodeLabel(t, "比分/自己球队名", this.session.playerTeamName), this.setNodeLabel(t, "比分/对手球队名", this.session.opponentTeamName);
          }
        }, r.bindResultButtons = function () {
          var t,
            e,
            n,
            i,
            o,
            r = this,
            s = null == (t = this.victoryPage) || null == (t = t.getChildByName("看广告双倍领取")) ? void 0 : t.getComponent(a),
            l = null == (e = this.victoryPage) || null == (e = e.getChildByName("继续下一场")) ? void 0 : e.getComponent(a),
            h = null == (n = this.victoryPage) || null == (n = n.getChildByName("返回")) ? void 0 : n.getComponent(a),
            u = null == (i = this.defeatPage) || null == (i = i.getChildByName("看广告获得加成重来")) ? void 0 : i.getComponent(a),
            c = null == (o = this.defeatPage) || null == (o = o.getChildByName("调整阵容")) ? void 0 : o.getComponent(a);
          null == s || s.node.on(a.EventType.CLICK, this.claimVictoryAdReward, this), null == l || l.node.on(a.EventType.CLICK, function () {
            return r.returnToHomepage(!0);
          }, this), null == h || h.node.on(a.EventType.CLICK, function () {
            return r.returnToHomepage(!1);
          }, this), null == u || u.node.on(a.EventType.CLICK, this.retryWithAdBonus, this), null == c || c.node.on(a.EventType.CLICK, function () {
            return r.returnToHomepage(!0);
          }, this), this.prepareButtonVisuals(this.node);
        }, r.claimVictoryAdRewardAsync = function () {
          var t = i( /*#__PURE__*/_regeneratorRuntime().mark(function _callee15() {
            var t, e, n, i, o, r;
            return _regeneratorRuntime().wrap(function _callee15$(_context16) {
              while (1) switch (_context16.prev = _context16.next) {
                case 0:
                  if (!(!this.adProcessing && this.session && this.victoryPage)) {
                    _context16.next = 13;
                    break;
                  }
                  e = null == (t = this.victoryPage.getChildByName("看广告双倍领取")) ? void 0 : t.getComponent(a);
                  this.adProcessing = !0, this.setButtonAvailable(null != e ? e : null, !1);
                  _context16.prev = 3;
                  _context16.next = 6;
                  return A();
                case 6:
                  if (_context16.sent) {
                    _context16.next = 8;
                    break;
                  }
                  return _context16.abrupt("return");
                case 8:
                  n = this.calculateMatchReward();
                  if (b(this.session.matchId, n)) {
                    S({
                      matchId: this.session.matchId,
                      won: !0,
                      baseReward: 0,
                      adReward: n,
                      advanced: !1
                    });
                    r = null != (i = null == (o = this.findByPath(this.victoryPage, "本场奖励/管理层-选中背景/获得数值")) ? void 0 : o.getComponent(s)) ? i : null;
                    F(r, 2 * n, function (t) {
                      return "+" + I(Math.floor(t));
                    }, {
                      from: n,
                      animateGrowth: !0
                    });
                  }
                case 10:
                  _context16.prev = 10;
                  this.adProcessing = !1, e && this.session && this.setButtonAvailable(e, B().lastAdRewardMatchId !== this.session.matchId);
                  return _context16.finish(10);
                case 13:
                case "end":
                  return _context16.stop();
              }
            }, _callee15, this, [[3,, 10, 13]]);
          }));
          return function () {
            return t.apply(this, arguments);
          };
        }(), r.retryWithAdBonusAsync = function () {
          var t = i( /*#__PURE__*/_regeneratorRuntime().mark(function _callee16() {
            var t, e;
            return _regeneratorRuntime().wrap(function _callee16$(_context17) {
              while (1) switch (_context17.prev = _context17.next) {
                case 0:
                  if (!(!this.adProcessing && this.session && this.defeatPage)) {
                    _context17.next = 12;
                    break;
                  }
                  e = null == (t = this.defeatPage.getChildByName("看广告获得加成重来")) ? void 0 : t.getComponent(a);
                  this.adProcessing = !0, this.setButtonAvailable(null != e ? e : null, !1);
                  _context17.prev = 3;
                  _context17.next = 6;
                  return A();
                case 6:
                  if (_context17.sent) {
                    _context17.next = 8;
                    break;
                  }
                  return _context17.abrupt("return");
                case 8:
                  this.retryCount += 1, this.session.temporaryBonusPercent = Math.floor(20 * Math.random()) + 1, W(this.defeatPage), this.defeatPage.active = !1, this.startPreparedMatch();
                case 9:
                  _context17.prev = 9;
                  this.adProcessing = !1, null != e && e.isValid && this.setButtonAvailable(e, !0);
                  return _context17.finish(9);
                case 12:
                case "end":
                  return _context17.stop();
              }
            }, _callee16, this, [[3,, 9, 12]]);
          }));
          return function () {
            return t.apply(this, arguments);
          };
        }(), r.forceWinWithAd = function () {
          var t = i( /*#__PURE__*/_regeneratorRuntime().mark(function _callee17() {
            return _regeneratorRuntime().wrap(function _callee17$(_context18) {
              while (1) switch (_context18.prev = _context18.next) {
                case 0:
                  if (!(!this.adProcessing && this.result && "uncertain" === this.result.band && !this.result.won)) {
                    _context18.next = 11;
                    break;
                  }
                  this.adProcessing = !0, this.setButtonAvailable(this.forcedWinButton, !1);
                  _context18.prev = 2;
                  _context18.next = 5;
                  return A();
                case 5:
                  if (_context18.sent) {
                    _context18.next = 7;
                    break;
                  }
                  return _context18.abrupt("return");
                case 7:
                  this.startPreparedMatch(!0), this.forcedWinButton && (this.forcedWinButton.node.active = !1);
                case 8:
                  _context18.prev = 8;
                  this.adProcessing = !1, this.forcedWinButton && this.forcedWinButton.node.active && this.result && this.setButtonAvailable(this.forcedWinButton, !this.result.won);
                  return _context18.finish(8);
                case 11:
                case "end":
                  return _context18.stop();
              }
            }, _callee17, this, [[2,, 8, 11]]);
          }));
          return function () {
            return t.apply(this, arguments);
          };
        }(), r.settleRemainingPlays = function () {
          var t;
          null == (t = this.courtSimulation) || t.settleImmediately();
          for (var e, i = n(this.plannedPlays); !(e = i()).done;) {
            var o,
              r = e.value,
              a = null != (o = this.awardedPointsByPlay.get(r.index)) ? o : 0,
              s = Math.max(0, r.points - a);
            if (!(s <= 0)) (0 === r.offenseTeam ? this.playerQuarterScores : this.opponentQuarterScores)[r.quarter] += s, this.awardedPointsByPlay.set(r.index, r.points);
          }
          this.nextPlayIndex = this.plannedPlays.length, this.refreshScorePresentation(!1);
        }, r.returnToHomepage = function (t) {
          R(), T(t ? "pre-match" : "home"), l.loadScene("Homepage");
        }, r.calculateMatchReward = function () {
          var t = this.session,
            e = Math.max(1, Math.ceil(t.opponentOverall / 696));
          return Math.ceil(e * (1 + Math.max(0, t.operationPresidentBonus)));
        }, r.resolveButtons = function () {
          var t, e, n, i, o, r;
          this.doubleSpeedButton = null != (t = null == (e = this.page) || null == (e = e.getChildByName("二倍速")) ? void 0 : e.getComponent(a)) ? t : null, this.forcedWinButton = null != (n = null == (i = this.page) || null == (i = i.getChildByName("看广告获胜")) ? void 0 : i.getComponent(a)) ? n : null, this.skipButton = null != (o = null == (r = this.page) || null == (r = r.getChildByName("跳过")) ? void 0 : r.getComponent(a)) ? o : null;
        }, r.prepareButtonVisuals = function (t) {
          for (var e, i = n(t.getComponentsInChildren(a)); !(e = i()).done;) {
            var o,
              r,
              s = e.value;
            s.hoverSprite = null, s.pressedSprite = null, s.disabledSprite = null;
            var l = null != (o = null == (r = s.target) ? void 0 : r.getComponent(h)) ? o : s.node.getComponent(h);
            l && (this.originalButtonGrayscale.has(l) || this.originalButtonGrayscale.set(l, l.grayscale), l.grayscale = !s.interactable || this.originalButtonGrayscale.get(l));
          }
        }, r.setButtonAvailable = function (t, e) {
          var n, i;
          if (t) {
            t.enabled = !0, t.interactable = e, t.hoverSprite = null, t.pressedSprite = null, t.disabledSprite = null;
            var o = null != (n = null == (i = t.target) ? void 0 : i.getComponent(h)) ? n : t.node.getComponent(h);
            o && (this.originalButtonGrayscale.has(o) || this.originalButtonGrayscale.set(o, o.grayscale), o.grayscale = !e || this.originalButtonGrayscale.get(o));
          }
        }, r.setButtonLabel = function (t, e) {
          var n,
            i = null == t || null == (n = t.node.getChildByName("Label")) ? void 0 : n.getComponent(s);
          i && (i.string = e);
        }, r.setLabel = function (t, e) {
          this.setNodeLabel(this.page, t, e);
        }, r.setGrowingScoreLabel = function (t, e, n) {
          var i,
            o,
            r = null != (i = null == (o = this.findByPath(this.page, t)) ? void 0 : o.getComponent(s)) ? i : null;
          F(r, e, function (t) {
            return String(Math.floor(t));
          }, {
            animateGrowth: n
          });
        }, r.setNodeLabel = function (t, e, n) {
          var i,
            o = null == (i = this.findByPath(t, e)) ? void 0 : i.getComponent(s);
          o && (o.string = n);
        }, r.captureCommentaryTeamColors = function () {
          var t,
            e,
            n = null == (t = this.findByPath(this.page, "比分/我的球队/球队名")) || null == (t = t.getComponent(s)) ? void 0 : t.color,
            i = null == (e = this.findByPath(this.page, "比分/对方球队/球队名")) || null == (e = e.getComponent(s)) ? void 0 : e.color;
          n && this.commentaryTeamColors[0].set(n), i && this.commentaryTeamColors[1].set(i);
        }, r.createRichCommentary = function (t, e) {
          for (var i, o = 0, r = "", a = n(e); !(i = a()).done;) {
            var s = i.value,
              l = t.indexOf(s.name, o);
            l < 0 || (r += this.escapeRichText(t.slice(o, l)), r += "<color=" + this.colorToHex(this.commentaryTeamColors[1 === s.team ? 1 : 0]) + ">" + this.escapeRichText(s.name) + "</color>", o = l + s.name.length);
          }
          return r += this.escapeRichText(t.slice(o));
        }, r.setCommentaryRichText = function (t, e) {
          var n = this.findByPath(this.page, t);
          if (n) {
            var i = n.getComponent(s),
              o = n.getComponent(u);
            if (!o && i) {
              var r,
                a,
                l = null != (r = null == (a = n.getComponent(c)) ? void 0 : a.width) ? r : 0;
              (o = n.addComponent(u)).fontSize = i.fontSize, o.lineHeight = i.lineHeight, o.horizontalAlign = i.horizontalAlign, o.verticalAlign = i.verticalAlign, o.fontColor = i.color.clone(), o.maxWidth = l, o.useSystemFont = i.useSystemFont, o.fontFamily = i.fontFamily, i.font instanceof d && (o.font = i.font), o.handleTouchEvent = !1, i.enabled = !1;
            }
            o && (o.string = e);
          }
        }, r.colorToHex = function (t) {
          return "#" + [t.r, t.g, t.b].map(function (t) {
            return t.toString(16).padStart(2, "0");
          }).join("");
        }, r.escapeRichText = function (t) {
          return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        }, r.nodes = function (t, e) {
          return e.flatMap(function (e) {
            var n = t.getChildByName(e);
            return n ? [n] : [];
          });
        }, r.findByPath = function (t, e) {
          for (var i, o = t, r = n(e.split("/")); !(i = r()).done;) {
            var a,
              s,
              l = i.value;
            if (!(o = null != (a = null == (s = o) ? void 0 : s.getChildByName(l)) ? a : null)) return null;
          }
          return o;
        }, r.getTopFive = function (t) {
          return t.filter(function (t) {
            return Boolean(t);
          }).sort(function (t, e) {
            return e.overall - t.overall;
          }).slice(0, 5);
        }, r.formatClock = function (t) {
          var e = Math.max(0, Math.floor(t));
          return String(Math.floor(e / 60)).padStart(2, "0") + ":" + String(e % 60).padStart(2, "0");
        }, r.createSeededRandom = function (t) {
          for (var e, i = 2166136261, o = n(t); !(e = o()).done;) {
            var r = e.value;
            i ^= r.charCodeAt(0), i = Math.imul(i, 16777619);
          }
          return function () {
            return i ^= i << 13, i ^= i >>> 17, ((i ^= i << 5) >>> 0) / 4294967296;
          };
        }, r.stopAllMotion = function () {
          var t;
          null == (t = this.courtSimulation) || t.stop();
        }, r.loadResource = function (t, e) {
          return new Promise(function (n, i) {
            f.load(t, e, function (e, o) {
              !e && o ? n(o) : i(null != e ? e : new Error("Missing resource: " + t));
            });
          });
        }, o;
      }(m)) || E);
      o._RF.pop();
    }
  };
});
System.register("chunks:///_virtual/MatchCourtSimulation.ts", ["./rollupPluginModLoBabelHelpers.js", "cc"], function (t) {
  var e, o, n, i, a, r;
  return {
    setters: [function (t) {
      e = t.createForOfIteratorHelperLoose, o = t.createClass;
    }, function (t) {
      n = t.cclegacy, i = t.Vec3, a = t.tween, r = t.Tween;
    }],
    execute: function execute() {
      n._RF.push({}, "eaa4d7Ba8FAaKD5XJpd9Ojh", "MatchCourtSimulation", void 0);
      var s = {
          "five-out": "五外拉开",
          "four-out-one-in": "四外一内",
          "pick-and-roll": "高位挡拆",
          "low-post": "低位单打",
          horns: "牛角战术"
        },
        l = {
          "five-out": [[.38, .5], [.58, .2], [.58, .8], [.86, .12], [.86, .88]],
          "four-out-one-in": [[.4, .5], [.6, .2], [.6, .8], [.84, .15], [.86, .62]],
          "pick-and-roll": [[.38, .5], [.5, .5], [.7, .18], [.7, .82], [.86, .82]],
          "low-post": [[.46, .28], [.54, .76], [.72, .14], [.72, .86], [.88, .62]],
          horns: [[.34, .5], [.56, .4], [.56, .6], [.84, .12], [.84, .88]]
        },
        c = [[[.18, .24], [.18, .76], [.32, .16], [.32, .5], [.32, .84]], [[.82, .24], [.82, .76], [.68, .16], [.68, .5], [.68, .84]]];
      t("MatchCourtSimulation", function () {
        function t(t, e, o, n, i, a) {
          this.actors = [], this.cornerNodes = [], this.hoopNodes = [], this.freeThrowNodes = [], this.ballDropNodes = [], this.threePointNodes = [[], []], this.activeTweenTargets = [], this.callbacks = void 0, this.ballOwners = new Map(), this.token = 0, this.speedMultiplier = 1, this.busy = !1, this.activeEvent = null, this.playersRoot = t, this.courtRange = e, this.ball = o, this.callbacks = a, this.collectCourtReferences(), this.collectActors(n, i);
        }
        var n = t.prototype;
        return n.reset = function (t) {
          void 0 === t && (t = 0), this.stop(), this.placeStartingFormation();
          var e = this.getTeamActors(t)[0];
          e && (this.faceTeamTowardAttack(t), this.setBallOwner(e));
        }, n.play = function (t, e) {
          var o,
            n,
            i = this;
          if (!this.isReady || this.busy) return !1;
          this.busy = !0, this.activeEvent = t, this.speedMultiplier = Math.max(1, e), this.token += 1;
          var a = this.token;
          this.stopTweens(), this.faceTeamTowardAttack(t.offenseTeam);
          var r = this.createTacticSetup(t),
            s = null != (o = null == (n = this.ballOwners.get(this.ball)) ? void 0 : n.actor) ? o : null,
            l = (null == s ? void 0 : s.team) === t.offenseTeam ? s : r.handler;
          return s !== l && this.setBallOwner(l), this.moveIntoTactic(r, l, a, function () {
            i.executeTactic(r, t, a);
          }), !0;
        }, n.stop = function () {
          this.token += 1, this.busy = !1, this.activeEvent = null, this.stopTweens(), this.clearBallOwner();
        }, n.settleImmediately = function () {
          this.stop();
        }, n.collectCourtReferences = function () {
          var t,
            e,
            o,
            n,
            i = this;
          (t = this.cornerNodes).push.apply(t, ["左上角", "右上角", "左下角", "右下角"].map(function (t) {
            return i.courtRange.getChildByName(t);
          }).filter(function (t) {
            return Boolean(t);
          })), (e = this.hoopNodes).push.apply(e, ["篮筐1", "篮筐2"].map(function (t) {
            return i.courtRange.getChildByName(t);
          }).filter(function (t) {
            return Boolean(t);
          })), (o = this.freeThrowNodes).push.apply(o, ["罚球点1", "罚球点2"].map(function (t) {
            return i.courtRange.getChildByName(t);
          }).filter(function (t) {
            return Boolean(t);
          })), (n = this.ballDropNodes).push.apply(n, ["进球后下落终点1", "进球后下落终点2"].map(function (t) {
            return i.courtRange.getChildByName(t);
          }).filter(function (t) {
            return Boolean(t);
          })), this.threePointNodes[0] = this.courtRange.children.filter(function (t) {
            return t.name.startsWith("左半场-") && t.name.includes("三分");
          }), this.threePointNodes[1] = this.courtRange.children.filter(function (t) {
            return t.name.startsWith("右半场-") && t.name.includes("三分");
          });
        }, n.collectActors = function (t, e) {
          var o = this,
            n = [].concat(this.playersRoot.children.filter(function (t) {
              return /^我方球员\d+$/.test(t.name);
            }), this.playersRoot.children.filter(function (t) {
              return /^敌方球员\d+$/.test(t.name);
            })),
            i = [].concat(t.slice(0, 5), e.slice(0, 5));
          n.slice(0, 10).forEach(function (t, e) {
            var n,
              a = e < 5 ? 0 : 1,
              r = {
                node: t,
                team: a,
                teamIndex: e % 5,
                card: null != (n = i[e]) ? n : null,
                homeScale: t.scale.clone(),
                homePerspectiveFactor: o.getPerspectiveFactor(t.worldPosition),
                facing: 0 === a ? "right" : "left",
                ballAnchors: o.collectBallAnchors(t)
              };
            o.hideActorBallAnchors(r), o.actors.push(r);
          });
        }, n.collectBallAnchors = function (t) {
          return {
            left: {
              hold: t.getChildByName("持球点-左"),
              dribble: t.getChildByName("运球点-左"),
              shot: t.getChildByName("投射点-左")
            },
            right: {
              hold: t.getChildByName("持球点-右"),
              dribble: t.getChildByName("运球点-右"),
              shot: t.getChildByName("投射点-右")
            }
          };
        }, n.placeStartingFormation = function () {
          for (var t = this, e = function e() {
              var e = t.getTeamActors(o),
                n = c[o];
              e.forEach(function (e, o) {
                var i = n[o],
                  a = i[0],
                  r = i[1],
                  s = t.pointInCourt(a, r);
                e.node.setWorldPosition(s), t.applyPerspectiveScale(e, s);
              });
            }, o = 0; o < 2; o += 1) e();
          this.sortActorDepth();
        }, n.createTacticSetup = function (t) {
          var e,
            o,
            n,
            i,
            a,
            r = this.getTeamActors(t.offenseTeam),
            s = this.getTeamActors(1 - t.offenseTeam),
            c = null != (e = r[t.handlerIndex % r.length]) ? e : r[0],
            h = null != (o = r[t.shooterIndex % r.length]) ? o : r[0];
          "turnover" !== t.action && h === c && r.length > 1 && (h = r[(t.shooterIndex + 1) % r.length]);
          var f = null != (n = r[t.passerIndex % r.length]) ? n : c,
            d = null != (i = null != (a = r.find(function (t) {
              return t !== c && t !== h && t !== f;
            })) ? a : r[1]) ? i : c;
          return {
            offense: r,
            defense: s,
            handler: c,
            passer: f,
            shooter: h,
            helper: d,
            points: l[t.tactic]
          };
        }, n.moveIntoTactic = function (t, e, o, n) {
          var a,
            r = this,
            s = this.orderRolesForTactic(t),
            l = new Map();
          s.forEach(function (e, o) {
            var n = t.points[o],
              i = n[0],
              a = n[1];
            l.set(e, r.getAttackingHalfPoint(e.team, i, a));
          });
          var c = Math.max.apply(Math, s.map(function (t) {
              var e;
              return i.distance(t.node.worldPosition, null != (e = l.get(t)) ? e : t.node.worldPosition);
            })),
            h = Math.max(.78, Math.min(1.9, c / 230));
          s.forEach(function (t, o) {
            if (t !== e) {
              var n = l.get(t);
              n && r.moveActor(t, n, r.scaled(h));
            }
          }), t.defense.forEach(function (e, o) {
            var n,
              a,
              l,
              c = null != (n = s[o]) ? n : t.offense[o],
              f = r.getAttackingHoop(t.handler.team),
              d = t.points[o],
              u = d[0],
              p = d[1],
              m = r.getAttackingHalfPoint(c.team, u, p),
              v = i.lerp(new i(), m, f.worldPosition, function (t, e) {
                if ("pick-and-roll" === t && e < 2) return .22;
                if ("low-post" === t && 4 !== e) return .18;
                return .12;
              }(null != (a = null == (l = r.activeEvent) ? void 0 : l.tactic) ? a : "five-out", o)),
              g = new i();
            i.subtract(g, f.worldPosition, m), g.length() > 0 && g.normalize();
            var P = o % 2 == 0 ? -1 : 1,
              w = 12 + 4 * Math.floor(o / 2);
            v.add3f(-g.y * w * P, g.x * w * P, 0), r.moveActor(e, v, r.scaled(h));
          });
          var f = null != (a = l.get(e)) ? a : e.node.worldPosition.clone();
          this.dribbleTo(e, f, h, o, function () {
            if (o === r.token) {
              var i = function i() {
                r.startOffBallRoutes(t, s, o), n();
              };
              e === t.handler ? i() : r.passBall(e, t.handler, o, i);
            }
          });
        }, n.orderRolesForTactic = function (t) {
          for (var o = [t.handler], n = 0, i = [t.helper, t.passer, t.shooter]; n < i.length; n++) {
            var a = i[n];
            o.includes(a) || o.push(a);
          }
          for (var r, s = e(t.offense); !(r = s()).done;) {
            var l = r.value;
            o.includes(l) || o.push(l);
          }
          return o.slice(0, 5);
        }, n.startOffBallRoutes = function (t, e, o) {
          var n = this;
          e.forEach(function (e, i) {
            if (e !== t.handler && e !== t.passer && e !== t.shooter) {
              var a = t.points[i],
                r = a[0],
                s = a[1],
                l = n.getAttackingHalfPoint(e.team, Math.max(.4, r - .12), 1 - s),
                c = n.getAttackingHalfPoint(e.team, r, s);
              n.moveActor(e, l, n.scaled(.62), function () {
                o === n.token && n.moveActor(e, c, n.scaled(.58));
              });
            }
          }), t.defense.forEach(function (o, a) {
            var r,
              s = null != (r = e[a]) ? r : t.offense[a],
              l = i.lerp(new i(), o.node.worldPosition, s.node.worldPosition, .58);
            n.moveActor(o, l, n.scaled(.82));
          });
        }, n.executeTactic = function (t, e, o) {
          if ("free-throw" !== e.action) {
            if ("turnover" !== e.action) switch (e.tactic) {
              case "five-out":
                this.playFiveOut(t, e, o);
                break;
              case "four-out-one-in":
                this.playFourOutOneIn(t, e, o);
                break;
              case "pick-and-roll":
                this.playPickAndRoll(t, e, o);
                break;
              case "low-post":
                this.playLowPost(t, e, o);
                break;
              default:
                this.playHorns(t, e, o);
            } else this.playTurnover(t, e, o);
          } else this.playFreeThrows(t, e, o);
        }, n.playFiveOut = function (t, e, o) {
          var n = this,
            i = t.helper,
            a = this.getAttackingHalfPoint(e.offenseTeam, .62, .28);
          this.dribbleTo(t.handler, a, .34, o, function () {
            n.passBall(t.handler, i, o, function () {
              var a = n.getFinishPoint(e, t.shooter, 0);
              n.moveAndPass(i, t.shooter, a, o, function () {
                n.finishPlayAtBasket(t, e, o);
              });
            });
          });
        }, n.playFourOutOneIn = function (t, e, o) {
          var n = this,
            i = t.passer === t.handler ? t.helper : t.passer,
            a = this.getAttackingHalfPoint(e.offenseTeam, .82, .62);
          this.moveAndPass(t.handler, i, a, o, function () {
            var a = n.getFinishPoint(e, t.shooter, 34);
            n.moveAndPass(i, t.shooter, a, o, function () {
              n.finishPlayAtBasket(t, e, o);
            });
          });
        }, n.playPickAndRoll = function (t, e, o) {
          var n = this,
            i = t.helper,
            a = this.getAttackingHalfPoint(e.offenseTeam, .5, .5);
          this.moveActor(i, a, this.scaled(.28));
          var r = this.getFinishPoint(e, t.handler, -26);
          this.after(.16, o, function () {
            n.dribbleTo(t.handler, r, .54, o, function () {
              if (t.shooter !== t.handler) {
                var i = n.getFinishPoint(e, t.shooter, 24);
                n.moveAndPass(t.handler, t.shooter, i, o, function () {
                  return n.finishPlayAtBasket(t, e, o);
                });
              } else n.finishPlayAtBasket(t, e, o);
            });
          });
        }, n.playLowPost = function (t, e, o) {
          var n = this,
            i = t.shooter,
            a = this.getAttackingHalfPoint(e.offenseTeam, .84, .62);
          this.moveAndPass(t.handler, i, a, o, function () {
            var a = n.getFinishPoint(e, i, 26);
            n.dribbleTo(i, a, .5, o, function () {
              n.finishPlayAtBasket(t, e, o);
            });
          });
        }, n.playHorns = function (t, e, o) {
          var n = this,
            i = t.helper,
            a = this.getAttackingHalfPoint(e.offenseTeam, .58, .42);
          this.moveActor(i, a, this.scaled(.3));
          var r = this.getAttackingHalfPoint(e.offenseTeam, .5, .5);
          this.dribbleTo(t.handler, r, .38, o, function () {
            n.passBall(t.handler, i, o, function () {
              var a = n.getFinishPoint(e, t.shooter, -30);
              n.moveAndPass(i, t.shooter, a, o, function () {
                n.finishPlayAtBasket(t, e, o);
              });
            });
          });
        }, n.finishPlayAtBasket = function (t, e, o) {
          var n = this;
          "and-one" !== e.action ? this.shootBall(t.shooter, e, o, e.points) : this.shootBall(t.shooter, e, o, 2, function () {
            n.after(.12, o, function () {
              n.playSingleAndOneFreeThrow(t, e, o);
            });
          });
        }, n.playSingleAndOneFreeThrow = function (t, e, o) {
          var n = this,
            i = this.getFreeThrowPoint(e.offenseTeam);
          this.moveActor(t.shooter, i, this.scaled(.24), function () {
            o === n.token && (n.setBallOwner(t.shooter), n.animateFreeThrowShot(t.shooter, !0, o, function () {
              n.callbacks.onScore(e.offenseTeam, 1, e), n.emitCommentary(n.playerName(t.shooter) + "打成2+1，罚球稳稳命中，本回合得到3分。", e, t.shooter), n.completeMadePlay(e, o);
            }));
          });
        }, n.playFreeThrows = function (t, e, o) {
          var n = this,
            i = t.shooter,
            a = this.getFreeThrowPoint(e.offenseTeam),
            r = this.getAttackingHoop(e.offenseTeam),
            s = [this.getTakeoffPoint(r, 150, -72), this.getTakeoffPoint(r, 150, 72), this.getTakeoffPoint(r, 190, -88), this.getTakeoffPoint(r, 190, 88)];
          [].concat(t.offense.filter(function (t) {
            return t !== i;
          }), t.defense).slice(0, 8).forEach(function (t, e) {
            n.moveActor(t, s[e % s.length], n.scaled(.34));
          }), this.moveActor(i, a, this.scaled(.34), function () {
            if (o === n.token) {
              n.setBallOwner(i);
              var t = Math.max(0, Math.min(2, e.points));
              n.animateFreeThrowSequence(i, e, o, 0, t);
            }
          });
        }, n.animateFreeThrowSequence = function (t, e, o, n, i) {
          var a = this;
          if (n >= 2) {
            var r = 2 === i ? "两罚两中" : 1 === i ? "两罚一中" : "两罚全部偏出";
            2 === i ? (this.emitCommentary(this.playerName(t) + "造成投篮犯规，站上罚球线" + r + "，得到" + i + "分。", e, t), this.completeMadePlay(e, o)) : this.resolveMissedShot(t, e, o, this.playerName(t) + "造成投篮犯规，站上罚球线" + r + "，得到" + i + "分");
          } else {
            var s = n < i;
            this.animateFreeThrowShot(t, s, o, function () {
              if (s && a.callbacks.onScore(e.offenseTeam, 1, e), o === a.token) if (n + 1 >= 2) a.animateFreeThrowSequence(t, e, o, n + 1, i);else {
                var r = a.getBallAnchorPosition(t, "hold");
                a.after(.12, o, function () {
                  a.animateBallArc(a.ball.worldPosition.clone(), r, .18, 12, o, function () {
                    a.setBallOwner(t), a.animateFreeThrowSequence(t, e, o, n + 1, i);
                  });
                });
              }
            });
          }
        }, n.animateFreeThrowShot = function (t, e, o, n) {
          var a,
            r,
            s = this,
            l = this.getAttackingHoop(t.team),
            c = null != (a = null == (r = l.getChildByName("进球点")) ? void 0 : r.worldPosition) ? a : l.worldPosition,
            h = e ? c : new i(c.x, c.y + 16, c.z);
          this.gatherBallForShot(t, o, function (t) {
            s.animateBallArc(t, h, .42, e ? 78 : 64, o, n);
          });
        }, n.playTurnover = function (t, e, o) {
          var n = this,
            a = t.defense[(e.shooterIndex + e.handlerIndex) % t.defense.length],
            r = i.lerp(new i(), t.handler.node.worldPosition, a.node.worldPosition, .48);
          this.after(.58, o, function () {
            n.dribbleTo(t.handler, r, .5, o, function () {
              var r = i.lerp(new i(), t.handler.node.worldPosition, a.node.worldPosition, .72);
              n.moveActor(a, r, n.scaled(.24)), n.passBall(t.handler, a, o, function () {
                n.emitCommentary(s[e.tactic] + "没有打成，" + n.playerName(a) + "判断传球路线完成抢断，球权交换。", e, a), n.completePlay(1 - e.offenseTeam, e, o);
              });
            });
          });
        }, n.shootBall = function (t, e, o, n, a) {
          var r,
            s,
            l = this,
            c = this.getAttackingHoop(e.offenseTeam),
            h = null != (r = null == (s = c.getChildByName("进球点")) ? void 0 : s.worldPosition) ? r : c.worldPosition,
            f = e.made ? h : new i(h.x + (e.index % 2 == 0 ? -24 : 24), h.y + 14, h.z);
          "dunk" !== e.action ? (this.jumpActor(t, "layup" === e.action ? 1.1 : 1.06, .36), this.gatherBallForShot(t, o, function (i) {
            var r = "three" === e.action ? 92 : "jumper" === e.action ? 76 : 58;
            l.animateBallArc(i, f, .52, r, o, function () {
              if (e.made) {
                if (n > 0 && l.callbacks.onScore(e.offenseTeam, n, e), a) return void a();
                l.emitCommentary(l.createMadeCommentary(t, e), e, t), l.completeMadePlay(e, o);
              } else l.resolveMissedShot(t, e, o);
            });
          })) : this.playDunkMotion(t, c, f, e, o, n, a);
        }, n.playDunkMotion = function (t, e, o, n, r, s, l) {
          var c = this,
            h = t.node.worldPosition.clone(),
            f = this.getTakeoffPoint(e, 42, 0),
            d = this.trackTweenTarget({
              progress: 0
            }),
            u = !1;
          this.setBallMotionOwner(t, "shot"), a(d).to(this.scaled(.5), {
            progress: 1
          }, {
            onUpdate: function onUpdate() {
              if (r === c.token) {
                var e = i.lerp(new i(), h, f, d.progress);
                e.y += 48 * Math.sin(d.progress * Math.PI), t.node.setWorldPosition(e), c.applyPerspectiveScale(t, e);
                var o = t.node.scale.clone(),
                  n = 1 + .18 * Math.sin(d.progress * Math.PI);
                if (t.node.setScale(o.x * n, o.y * n, o.z), !u) {
                  var a = c.getBallAnchorPosition(t, "hold"),
                    s = c.getBallAnchorPosition(t, "shot");
                  c.ball.setWorldPosition(i.lerp(new i(), a, s, Math.min(1, d.progress / .48)));
                }
              }
            }
          }).start(), this.after(.24, r, function () {
            u = !0;
            var e = c.getBallAnchorPosition(t, "shot");
            c.animateBallArc(e, o, .18, n.made ? 10 : 32, r, function () {
              if (n.made) {
                if (s > 0 && c.callbacks.onScore(n.offenseTeam, s, n), l) return void l();
                c.emitCommentary(c.createMadeCommentary(t, n), n, t), c.completeMadePlay(n, r);
              } else c.resolveMissedShot(t, n, r);
            });
          });
        }, n.resolveMissedShot = function (t, e, o, n) {
          var a,
            r = this;
          void 0 === n && (n = "");
          var s,
            l = this.getTeamActors(e.offenseTeam),
            c = this.getTeamActors(1 - e.offenseTeam),
            h = this.getReboundPoint(this.getAttackingHoop(e.offenseTeam), e.index),
            f = t;
          if ("teammate" === e.rebound) f = null != (s = l.find(function (e) {
            return e !== t;
          })) ? s : t;else if ("opponent" === e.rebound) {
            var d;
            f = null != (d = c[e.shooterIndex % c.length]) ? d : c[0];
          }
          var u = e.contestedRebound ? [f].concat(f.team === e.offenseTeam ? c.slice(0, 2) : [t, null != (a = l.find(function (e) {
            return e !== t;
          })) ? a : t]) : [f];
          u.forEach(function (t, e) {
            var o = .65 * (e - (u.length - 1) / 2),
              n = t === f ? 0 : 22,
              a = new i(h.x + Math.cos(o) * n, h.y + Math.sin(o) * n, h.z);
            r.moveActor(t, a, r.scaled(.34));
          }), this.after(.28, o, function () {
            u.forEach(function (t) {
              r.jumpActor(t, t === f ? 1.14 : 1.08, .32);
            });
          });
          var p = this.ball.worldPosition.clone();
          this.animateBallArc(p, h, .42, 34, o, function () {
            r.setBallOwner(f);
            var i = e.contestedRebound ? "多人争抢后" : "",
              a = f === t ? "自投自抢" : f.team === e.offenseTeam ? "队友保护下进攻篮板" : "防守方收下篮板",
              s = n || "" + r.playerName(t) + r.actionName(e.action) + "偏出";
            r.emitCommentary(s + "，" + i + r.playerName(f) + a + "。", e, t, f), r.completePlay(f.team, e, o);
          });
        }, n.completeMadePlay = function (t, e) {
          var o,
            n = this,
            i = this.getAttackingHoop(t.offenseTeam),
            a = this.hoopNodes.indexOf(i),
            r = this.ballDropNodes[a],
            s = 1 - t.offenseTeam,
            l = this.getTeamActors(s),
            c = null != (o = l[t.index % l.length]) ? o : l[0];
          if (r && c) {
            var h = this.ball.worldPosition.clone();
            this.animateBallArc(h, r.worldPosition, .22, 8, e, function () {
              n.moveActor(c, r.worldPosition, n.scaled(.2), function () {
                e === n.token && (n.setBallOwner(c), n.completePlay(s, t, e));
              });
            });
          } else this.completePlay(s, t, e);
        }, n.completePlay = function (t, e, o) {
          o === this.token && this.activeEvent === e && (this.busy = !1, this.activeEvent = null, this.callbacks.onPlayComplete(t, e));
        }, n.createMadeCommentary = function (t, e) {
          var o = s[e.tactic],
            n = this.playerName(t);
          return "three" === e.action ? o + "拉出空位，" + n + "三分命中，比分增加3分。" : "dunk" === e.action ? o + "撕开防线，" + n + "完成扣篮，比分增加2分。" : "layup" === e.action ? o + "形成突破，" + n + "上篮得手，比分增加2分。" : o + "创造出手机会，" + n + "中距离命中，比分增加2分。";
        }, n.emitCommentary = function (t, e) {
          for (var o = this, n = arguments.length, i = new Array(n > 2 ? n - 2 : 0), a = 2; a < n; a++) i[a - 2] = arguments[a];
          this.callbacks.onCommentary(t, e, i.map(function (t) {
            return {
              name: o.playerName(t),
              team: t.team
            };
          }));
        }, n.moveAndPass = function (t, e, o, n, a) {
          var r = this,
            s = e.node.worldPosition.clone(),
            l = i.lerp(new i(), s, o, .7);
          this.moveActor(e, l, this.scaled(.34));
          var c = new i();
          i.subtract(c, l, t.node.worldPosition), c.length() > 0 && c.normalize();
          var h = Math.min(72, .28 * i.distance(t.node.worldPosition, l)),
            f = t.node.worldPosition.clone().add3f(c.x * h, c.y * h, 0);
          this.dribbleTo(t, f, .26, n, function () {
            r.passBall(t, e, n, function () {
              r.moveActor(e, o, r.scaled(.2), a);
            });
          });
        }, n.dribbleTo = function (t, e, o, n, r) {
          var s = this;
          this.setBallMotionOwner(t, "dribble");
          var l = t.node.worldPosition.clone(),
            c = this.trackTweenTarget({
              progress: 0
            }),
            h = this.scaled(o),
            f = Math.max(1, Math.round(o / .22));
          a(c).to(h, {
            progress: 1
          }, {
            onUpdate: function onUpdate() {
              if (n === s.token) {
                var o = i.lerp(new i(), l, e, c.progress);
                t.node.setWorldPosition(o), s.applyPerspectiveScale(t, o);
                var a = s.getBallAnchorPosition(t, "hold"),
                  r = s.getBallAnchorPosition(t, "dribble"),
                  h = Math.abs(Math.sin(c.progress * Math.PI * f));
                s.ball.setWorldPosition(i.lerp(new i(), a, r, h));
              }
            }
          }).call(function () {
            n === s.token && (s.setBallOwner(t), r());
          }).start();
        }, n.passBall = function (t, e, o, n) {
          var r = this,
            s = this.getBallAnchorPosition(t, "hold"),
            l = new i(s.x + (e.node.worldPosition.x >= s.x ? 18 : -18), s.y + 10, s.z),
            c = this.getBallAnchorPosition(e, "hold"),
            h = i.distance(s, c),
            f = this.scaled(Math.max(.2, Math.min(.36, h / 1050))),
            d = this.trackTweenTarget({
              progress: 0
            });
          this.clearBallOwner(), this.ball.active = !0, this.ball.setWorldPosition(s), a(d).to(f, {
            progress: 1
          }, {
            onUpdate: function onUpdate() {
              if (o === r.token) {
                var t = r.getBallAnchorPosition(e, "hold"),
                  n = i.lerp(new i(), l, t, .5);
                n.y += Math.min(52, 18 + .06 * h);
                var a = d.progress,
                  s = 1 - a;
                r.ball.setWorldPosition(new i(s * s * l.x + 2 * s * a * n.x + a * a * t.x, s * s * l.y + 2 * s * a * n.y + a * a * t.y, t.z));
              }
            }
          }).call(function () {
            o === r.token && (r.setBallOwner(e), n());
          }).start();
        }, n.gatherBallForShot = function (t, e, o) {
          var n = this;
          this.setBallMotionOwner(t, "shot");
          var r = this.trackTweenTarget({
            progress: 0
          });
          a(r).to(this.scaled(.12), {
            progress: 1
          }, {
            onUpdate: function onUpdate() {
              if (e === n.token) {
                var o = n.getBallAnchorPosition(t, "hold"),
                  a = n.getBallAnchorPosition(t, "shot");
                n.ball.setWorldPosition(i.lerp(new i(), o, a, r.progress));
              }
            }
          }).call(function () {
            e === n.token && o(n.getBallAnchorPosition(t, "shot"));
          }).start();
        }, n.animateBallArc = function (t, e, o, n, r, s) {
          var l = this;
          this.clearBallOwner(), this.ball.active = !0;
          var c = this.trackTweenTarget({
            progress: 0
          });
          this.ball.setWorldPosition(t), a(c).to(this.scaled(o), {
            progress: 1
          }, {
            onUpdate: function onUpdate() {
              if (r === l.token) {
                var o = i.lerp(new i(), t, e, c.progress);
                o.y += Math.sin(c.progress * Math.PI) * n, l.ball.setWorldPosition(o);
              }
            }
          }).call(function () {
            r === l.token && s();
          }).start();
        }, n.moveActor = function (t, e, o, n) {
          var r = this,
            s = t.node.worldPosition.clone(),
            l = this.trackTweenTarget({
              progress: 0
            });
          a(l).to(o, {
            progress: 1
          }, {
            onUpdate: function onUpdate() {
              var o = i.lerp(new i(), s, e, l.progress);
              t.node.setWorldPosition(o), r.applyPerspectiveScale(t, o);
            }
          }).call(function () {
            r.sortActorDepth(), null == n || n();
          }).start();
        }, n.jumpActor = function (t, e, o) {
          var n = t.node.scale.clone(),
            r = new i(n.x * e, n.y * e, n.z);
          a(t.node).to(this.scaled(.45 * o), {
            scale: r
          }).to(this.scaled(.55 * o), {
            scale: n
          }).start();
        }, n.getFinishPoint = function (t, e, o) {
          if ("three" === t.action) {
            var n,
              a = 0 === t.offenseTeam ? 1 : 0,
              r = this.threePointNodes[a],
              s = r[(t.index + e.teamIndex) % r.length];
            return null != (n = null == s ? void 0 : s.worldPosition.clone()) ? n : this.getAttackingHalfPoint(t.offenseTeam, .72, .5);
          }
          if ("jumper" === t.action) {
            var l = this.getFreeThrowPoint(t.offenseTeam);
            return new i(l.x, l.y + .4 * o, l.z);
          }
          var c = "dunk" === t.action ? 68 : 88;
          return this.getTakeoffPoint(this.getAttackingHoop(t.offenseTeam), c, o);
        }, n.getFreeThrowPoint = function (t) {
          var e, o;
          return null != (e = null == (o = this.freeThrowNodes[t]) ? void 0 : o.worldPosition.clone()) ? e : this.getAttackingHalfPoint(t, .62, .5);
        }, n.getAttackingHoop = function (t) {
          return 0 === t ? this.hoopNodes[1] : this.hoopNodes[0];
        }, n.getAttackingHalfPoint = function (t, e, o) {
          var n = 0 === t ? .5 + .46 * e : .5 - .46 * e;
          return this.pointInCourt(n, o);
        }, n.pointInCourt = function (t, e) {
          var o = i.lerp(new i(), this.cornerNodes[0].worldPosition, this.cornerNodes[1].worldPosition, t),
            n = i.lerp(new i(), this.cornerNodes[2].worldPosition, this.cornerNodes[3].worldPosition, t);
          return i.lerp(new i(), o, n, e);
        }, n.getTakeoffPoint = function (t, e, o) {
          var n,
            a,
            r = null != (n = null == (a = this.courtRange.getChildByName("中场点")) ? void 0 : a.worldPosition) ? n : this.pointInCourt(.5, .5),
            s = new i();
          i.subtract(s, r, t.worldPosition), s.length() > 0 && s.normalize();
          var l = new i(-s.y, s.x, 0);
          return t.worldPosition.clone().add3f(s.x * e + l.x * o, s.y * e + l.y * o, 0);
        }, n.getReboundPoint = function (t, e) {
          var o = t === this.hoopNodes[1] ? .72 + e % 3 * .035 : .28 - e % 3 * .035,
            n = .38 + e % 4 * .08;
          return this.pointInCourt(o, n);
        }, n.faceTeamTowardAttack = function (t) {
          for (var o, n = e(this.getTeamActors(t)); !(o = n()).done;) {
            var i = o.value;
            i.facing = 0 === t ? "right" : "left", this.hideActorBallAnchors(i);
          }
          for (var a, r = e(this.getTeamActors(1 - t)); !(a = r()).done;) {
            var s = a.value;
            s.facing = 0 === t ? "left" : "right", this.hideActorBallAnchors(s);
          }
        }, n.getTeamActors = function (t) {
          return this.actors.filter(function (e) {
            return e.team === t && e.node.active && Boolean(e.card);
          });
        }, n.getBallAnchorPosition = function (t, e, o) {
          void 0 === o && (o = t.node.worldPosition);
          var n = t.ballAnchors[t.facing][e];
          if (!n) {
            var a = "dribble" === e ? -6 : "shot" === e ? 30 : 12,
              r = "right" === t.facing ? 1 : -1;
            return new i(o.x + 15 * r, o.y + a, o.z);
          }
          var s = t.node.worldPosition,
            l = n.worldPosition;
          return new i(o.x + l.x - s.x, o.y + l.y - s.y, o.z + l.z - s.z);
        }, n.setBallOwner = function (t, e) {
          void 0 === e && (e = "hold"), this.clearBallOwner(), this.ballOwners.set(this.ball, {
            actor: t,
            kind: e,
            visual: "anchor"
          }), this.showActorBallAnchor(t, e), this.ball.setWorldPosition(this.getBallAnchorPosition(t, e)), this.ball.active = !1;
        }, n.setBallMotionOwner = function (t, e) {
          this.clearBallOwner(), this.hideActorBallAnchors(t), this.ballOwners.set(this.ball, {
            actor: t,
            kind: e,
            visual: "motion"
          }), this.ball.setWorldPosition(this.getBallAnchorPosition(t, "hold")), this.ball.active = !0;
        }, n.clearBallOwner = function () {
          var t = this.ballOwners.get(this.ball);
          t && this.hideActorBallAnchors(t.actor), this.ballOwners["delete"](this.ball);
        }, n.hideActorBallAnchors = function (t) {
          for (var e = 0, o = [t.ballAnchors.left, t.ballAnchors.right]; e < o.length; e++) for (var n = o[e], i = 0, a = [n.hold, n.dribble, n.shot]; i < a.length; i++) {
            var r = a[i];
            r && (r.active = !1);
          }
        }, n.showActorBallAnchor = function (t, e) {
          this.hideActorBallAnchors(t);
          var o = t.ballAnchors[t.facing][e];
          o && (o.active = !0);
        }, n.getPerspectiveFactor = function (t) {
          if (this.cornerNodes.length < 4) return 1;
          var e = .5 * (this.cornerNodes[0].worldPosition.y + this.cornerNodes[1].worldPosition.y),
            o = e - .5 * (this.cornerNodes[2].worldPosition.y + this.cornerNodes[3].worldPosition.y);
          return .82 + .22 * (0 === o ? .5 : Math.max(0, Math.min(1, (e - t.y) / o)));
        }, n.applyPerspectiveScale = function (t, e) {
          var o = this.getPerspectiveFactor(e) / (t.homePerspectiveFactor || 1);
          t.node.setScale(t.homeScale.x * o * .86, t.homeScale.y * o * .86, t.homeScale.z);
        }, n.sortActorDepth = function () {
          [].concat(this.actors).filter(function (t) {
            return t.node.active;
          }).sort(function (t, e) {
            return e.node.worldPosition.y - t.node.worldPosition.y;
          }).forEach(function (t, e) {
            return t.node.setSiblingIndex(e);
          }), this.ball.parent && this.ball.setSiblingIndex(this.ball.parent.children.length - 1);
        }, n.playerName = function (t) {
          var e, o;
          return null != (e = null == (o = t.card) ? void 0 : o.displayName) ? e : t.node.name;
        }, n.actionName = function (t) {
          return "three" === t ? "三分投篮" : "dunk" === t ? "扣篮" : "layup" === t ? "上篮" : "投篮";
        }, n.scaled = function (t) {
          return t / this.speedMultiplier;
        }, n.after = function (t, e, o) {
          var n = this,
            i = this.trackTweenTarget({});
          a(i).delay(this.scaled(t)).call(function () {
            e === n.token && o();
          }).start();
        }, n.trackTweenTarget = function (t) {
          return this.activeTweenTargets.push(t), t;
        }, n.stopTweens = function () {
          for (var t, o = e(this.activeTweenTargets); !(t = o()).done;) {
            var n = t.value;
            r.stopAllByTarget(n);
          }
          this.activeTweenTargets.length = 0;
          for (var i, a = e(this.actors); !(i = a()).done;) {
            var s = i.value;
            r.stopAllByTarget(s.node);
          }
          r.stopAllByTarget(this.ball);
          for (var l, c = e(this.hoopNodes); !(l = c()).done;) {
            var h = l.value;
            r.stopAllByTarget(h);
          }
        }, o(t, [{
          key: "isReady",
          get: function get() {
            return 10 === this.actors.length && 4 === this.cornerNodes.length && 2 === this.hoopNodes.length && 2 === this.freeThrowNodes.length;
          }
        }, {
          key: "isBusy",
          get: function get() {
            return this.busy;
          }
        }]), t;
      }());
      n._RF.pop();
    }
  };
});
System.register("chunks:///_virtual/MatchSession.ts", ["./rollupPluginModLoBabelHelpers.js", "cc"], function (t) {
  var e, n;
  return {
    setters: [function (t) {
      e = t["extends"];
    }, function (t) {
      n = t.cclegacy;
    }],
    execute: function execute() {
      t({
        clearCurrentMatchSession: function clearCurrentMatchSession() {
          r = null;
        },
        consumeHomepageReturnTarget: function consumeHomepageReturnTarget() {
          var t = u;
          return u = "home", t;
        },
        getCurrentMatchSession: function getCurrentMatchSession() {
          return r ? o(r) : null;
        },
        setCurrentMatchSession: function setCurrentMatchSession(t) {
          r = o(t);
        },
        setHomepageReturnTarget: function setHomepageReturnTarget(t) {
          u = t;
        }
      }), n._RF.push({}, "ba011lyU9xFJ5KfgdTP08+t", "MatchSession", void 0);
      var r = null,
        u = "home";
      function o(t) {
        return e({}, t, {
          playerRoster: t.playerRoster.map(function (t) {
            return t ? s(t) : null;
          }),
          opponentRoster: t.opponentRoster.map(s)
        });
      }
      function s(t) {
        return e({}, t, {
          attributes: e({}, t.attributes)
        });
      }
      n._RF.pop();
    }
  };
});
System.register("chunks:///_virtual/NumberGrowthAnimator.ts", ["cc"], function (e) {
  var t, r, n;
  return {
    setters: [function (e) {
      t = e.cclegacy, r = e.Tween, n = e.tween;
    }],
    execute: function execute() {
      e({
        forgetGrowingNumber: function forgetGrowingNumber(e) {
          if (!e) return;
          var t = i.get(e);
          t && r.stopAllByTarget(t);
          i["delete"](e), a["delete"](e);
        },
        setGrowingNumber: function setGrowingNumber(e, t, u, l) {
          var o, s, v;
          void 0 === l && (l = {});
          if (!e || !e.isValid) return;
          var c = Number.isFinite(t) ? t : 0,
            d = i.get(e);
          d && (r.stopAllByTarget(d), i["delete"](e));
          var g = null != (o = null != (s = l.from) ? s : null == d ? void 0 : d.value) ? o : a.get(e);
          if (!(!1 !== l.animateGrowth && void 0 !== g && c > g)) return e.string = u(c), void a.set(e, c);
          var f = {
              value: g
            },
            m = Math.max(.05, null != (v = l.duration) ? v : .5);
          i.set(e, f), n(f).to(m, {
            value: c
          }, {
            easing: "cubicOut",
            onUpdate: function onUpdate() {
              e.isValid ? (e.string = u(f.value), a.set(e, f.value)) : r.stopAllByTarget(f);
            }
          }).call(function () {
            e.isValid && (e.string = u(c), a.set(e, c)), i["delete"](e);
          }).start();
        }
      }), t._RF.push({}, "aa53a0vOGdEf4sMiQTvRt5A", "NumberGrowthAnimator", void 0);
      var a = new WeakMap(),
        i = new WeakMap();
      t._RF.pop();
    }
  };
});
System.register("chunks:///_virtual/PlayerAssets.ts", ["cc", "./RosterSlotView.ts"], function (e) {
  var n, a, i, r;
  return {
    setters: [function (e) {
      n = e.cclegacy, a = e.resources, i = e.SpriteFrame;
    }, function (e) {
      r = e.getQualityFrameIndex;
    }],
    execute: function execute() {
      e({
        loadPlayerPortrait: function loadPlayerPortrait(e) {
          var n,
            a = null != (n = t[e.sourcePlayerName]) ? n : e.sourcePlayerName;
          return u("images/头像/" + e.displayName + "_" + a + "/spriteFrame");
        },
        loadQualityFrame: function loadQualityFrame(e) {
          return u("images/UI/球员/头像框-方/头像框" + r(e) + "-方/spriteFrame");
        },
        loadRoundQualityFrame: function loadRoundQualityFrame(e) {
          return u("images/UI/球员/头像框-圆/头像框" + r(e) + "-圆/spriteFrame");
        },
        loadSpriteFrame: u,
        loadThinQualityFrame: function loadThinQualityFrame(e) {
          return u("images/UI/球员/细边框/细边框0" + r(e) + "/spriteFrame");
        }
      }), n._RF.push({}, "16b968Rz2VELZtLFz0F7DhT", "PlayerAssets", void 0);
      var t = {
        "阿不都沙拉木": "Abudushalamu Abudurexiti",
        "巴特尔": "Mengke Bateer",
        "丁彦雨航": "Ding Yanyuhang",
        "杜锋": "Du Feng",
        "巩晓彬": "Gong Xiaobin",
        "贺希宁": "He Xining",
        "胡金秋": "Hu Jinqiu",
        "胡卫东": "Hu Weidong",
        "刘玉栋": "Liu Yudong",
        "马健": "Ma Jian",
        "孙军": "Sun Jun",
        "唐正东": "Tang Zhengdong",
        "王仕鹏": "Wang Shipeng",
        "王哲林": "Wang Zhelin",
        "王治郅": "Wang Zhizhi",
        "吴前": "Wu Qian",
        "姚明": "Yao Ming",
        "易建联": "Yi Jianlian",
        "张卫平": "Zhang Weiping",
        "赵继伟": "Zhao Jiwei",
        "朱芳雨": "Zhu Fangyu"
      };
      function u(e) {
        return new Promise(function (n) {
          a.load(e, i, function (a, i) {
            if (a || !i) return console.error("[PlayerAssets] Failed to load SpriteFrame: " + e, a), void n(null);
            n(i);
          });
        });
      }
      n._RF.pop();
    }
  };
});
System.register("chunks:///_virtual/PlayerAvatarChip.ts", ["./rollupPluginModLoBabelHelpers.js", "cc"], function (e) {
  var t, r, i, a, n, l, o, u, p, c;
  return {
    setters: [function (e) {
      t = e.applyDecoratedDescriptor, r = e.inheritsLoose, i = e.initializerDefineProperty, a = e.assertThisInitialized;
    }, function (e) {
      n = e.cclegacy, l = e._decorator, o = e.Sprite, u = e.Label, p = e.Node, c = e.Component;
    }],
    execute: function execute() {
      var s, y, h, v, b, f, d, m, g;
      n._RF.push({}, "26469DzO6VJCKdbtnT+oeEV", "PlayerAvatarChip", void 0);
      var L = l.ccclass,
        C = l.property;
      e("PlayerAvatarChip", (s = L("PlayerAvatarChip"), y = C(o), h = C(u), v = C(p), s((d = t((f = function (e) {
        function t() {
          for (var t, r = arguments.length, n = new Array(r), l = 0; l < r; l++) n[l] = arguments[l];
          return t = e.call.apply(e, [this].concat(n)) || this, i(t, "portrait", d, a(t)), i(t, "ovrLabel", m, a(t)), i(t, "qualityFrame", g, a(t)), t;
        }
        r(t, e);
        var n = t.prototype;
        return n.onLoad = function () {
          var e, t, r;
          null != this.ovrLabel || (this.ovrLabel = null != (e = null == (t = this.node.getChildByName("OVR")) ? void 0 : t.getComponent(u)) ? e : null), null != this.qualityFrame || (this.qualityFrame = null != (r = this.node.getChildByName("QualityFrame")) ? r : null);
        }, n.setup = function (e) {
          this.ovrLabel && (this.ovrLabel.string = String(e));
        }, t;
      }(c)).prototype, "portrait", [y], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return null;
        }
      }), m = t(f.prototype, "ovrLabel", [h], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return null;
        }
      }), g = t(f.prototype, "qualityFrame", [v], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return null;
        }
      }), b = f)) || b));
      n._RF.pop();
    }
  };
});
System.register("chunks:///_virtual/PreMatchController.ts", ["./rollupPluginModLoBabelHelpers.js", "cc", "./GameState.ts", "./PlayerAssets.ts", "./RosterSlotView.ts", "./FullScreenEntrance.ts", "./MatchController.ts", "./MatchSession.ts"], function (t) {
  var e, n, a, r, o, i, l, s, u, h, c, d, p, f, m, g, v, y, C, M, B, b, N, E, P, T, R, A, S, _, I, L, F;
  return {
    setters: [function (t) {
      e = t.inheritsLoose, n = t.createForOfIteratorHelperLoose, a = t.asyncToGenerator;
    }, function (t) {
      r = t.cclegacy, o = t._decorator, i = t.director, l = t.find, s = t.Button, u = t.UITransform, h = t.Sprite, c = t.Label, d = t.Component, p = t.sys;
    }, function (t) {
      f = t.loadRoster, m = t.gameStateEvents, g = t.GAME_STATE_EVENT_ROSTER_CHANGED, v = t.GAME_STATE_EVENT_TEAM_IDENTITY_CHANGED, y = t.GAME_STATE_EVENT_MANAGEMENT_CHANGED, C = t.loadJson, M = t.ATTRIBUTE_KEYS, B = t.INT32_MAX, b = t.GAME_STATE_EVENT_PLAYER_DETAILS_REQUESTED, N = t.loadSeasonState, E = t.getManagementEffects, P = t.calculateTeamOverall, T = t.TEAM_NAME_STORAGE_KEY;
    }, function (t) {
      R = t.loadPlayerPortrait, A = t.loadThinQualityFrame;
    }, function (t) {
      S = t.formatPlayerOverall;
    }, function (t) {
      _ = t.stopFullScreenEntrance, I = t.playFullScreenEntrance;
    }, function (t) {
      L = t.MatchController;
    }, function (t) {
      F = t.setCurrentMatchSession;
    }],
    execute: function execute() {
      var O, D;
      r._RF.push({}, "0333bHUYfdOVqz4M3W06Ukd", "PreMatchController", void 0);
      var w = o.ccclass;
      t("PreMatchController", w("PreMatchController")(((D = function (t) {
        function r() {
          for (var e, n = arguments.length, a = new Array(n), r = 0; r < n; r++) a[r] = arguments[r];
          return (e = t.call.apply(t, [this].concat(a)) || this).page = null, e.returnButton = null, e.startButton = null, e.playerTeamCardsRoot = null, e.opponentTeamCardsRoot = null, e.playerConfig = null, e.matchRewards = null, e.loadPromise = null, e.cardRenderVersion = 0, e.pageRequestVersion = 0, e.playerCardButtons = [], e.preparedMatch = null, e.defaultQualityFrames = new WeakMap(), e.startingMatch = !1, e.portraitBounds = new WeakMap(), e.closePage = function () {
            e.pageRequestVersion += 1, e.cardRenderVersion += 1, e.page && (_(e.page), e.page.active = !1);
          }, e.startMatch = function () {
            e.startingMatch || !e.preparedMatch || f().filter(Boolean).length < 5 || (e.startingMatch = !0, e.startButton && (e.startButton.interactable = !1), F(e.preparedMatch), i.loadScene("Match", function (t) {
              if (t) return console.error("[PreMatchController] Failed to load Match scene.", t), e.startingMatch = !1, void (e.startButton && (e.startButton.interactable = !0));
              var n = l("Canvas");
              n ? n.getComponent(L) || n.addComponent(L) : console.error("[PreMatchController] Match scene is missing Canvas.");
            }));
          }, e;
        }
        e(r, t);
        var o = r.prototype;
        return o.onLoad = function () {
          if (r.instance = this, this.resolveSceneReferences(), !this.page || !this.returnButton || !this.startButton) return console.error("[PreMatchController] Missing pre-match UI references."), void (this.enabled = !1);
          this.page.active = !1, this.startButton.interactable = !1;
        }, o.onEnable = function () {
          var t, e;
          null == (t = this.returnButton) || t.node.on(s.EventType.CLICK, this.closePage, this), null == (e = this.startButton) || e.node.on(s.EventType.CLICK, this.startMatch, this), m.on(g, this.onDataChanged, this), m.on(v, this.onDataChanged, this), m.on(y, this.onDataChanged, this), this.bindPlayerCardButtons();
        }, o.onDisable = function () {
          var t, e;
          null == (t = this.returnButton) || t.node.off(s.EventType.CLICK, this.closePage, this), null == (e = this.startButton) || e.node.off(s.EventType.CLICK, this.startMatch, this), m.off(g, this.onDataChanged, this), m.off(v, this.onDataChanged, this), m.off(y, this.onDataChanged, this);
          for (var a, r = n(this.playerCardButtons); !(a = r()).done;) {
            var o = a.value;
            o.button.node.off(s.EventType.CLICK, o.callback, this);
          }
          this.playerCardButtons = [];
        }, o.onDestroy = function () {
          r.instance === this && (r.instance = null);
        }, o.openPage = function () {
          var t = a( /*#__PURE__*/_regeneratorRuntime().mark(function _callee18() {
            var t, e;
            return _regeneratorRuntime().wrap(function _callee18$(_context19) {
              while (1) switch (_context19.prev = _context19.next) {
                case 0:
                  if (!this.page) {
                    _context19.next = 8;
                    break;
                  }
                  t = ++this.pageRequestVersion, e = this.page.parent;
                  e && this.page.setSiblingIndex(e.children.length - 1);
                  _context19.next = 5;
                  return this.ensureDataLoaded();
                case 5:
                  _context19.next = 7;
                  return this.refreshPage();
                case 7:
                  t === this.pageRequestVersion && I(this.page, {
                    backgroundNodes: this.namedChildren(["bg"]),
                    moduleGroups: [{
                      nodes: this.namedChildren(["顶部"]),
                      order: 0
                    }, {
                      nodes: this.namedChildren(["双方阵容"]),
                      order: 1
                    }, {
                      nodes: this.namedChildren(["管理层加成"]),
                      order: 2
                    }, {
                      nodes: this.namedChildren(["底部按钮"]),
                      order: 3
                    }]
                  });
                case 8:
                case "end":
                  return _context19.stop();
              }
            }, _callee18, this);
          }));
          return function () {
            return t.apply(this, arguments);
          };
        }(), o.ensureDataLoaded = function () {
          var t = this;
          return null != this.loadPromise || (this.loadPromise = Promise.all([C("data/player_config_fame_v3"), C("data/balance/match_rewards")]).then(function (e) {
            var n = e[0],
              a = e[1];
            if (!Array.isArray(n.players) || !Array.isArray(a.seasons)) throw new Error("Invalid pre-match configuration.");
            t.playerConfig = n, t.matchRewards = a;
          })["catch"](function (t) {
            console.error("[PreMatchController] Failed to load pre-match data.", t);
          })), this.loadPromise;
        }, o.refreshPage = function () {
          var t = a( /*#__PURE__*/_regeneratorRuntime().mark(function _callee19() {
            var t, e, n, a, r, o, i, l, s, u, h, c, d, m, g, v, y, C, M, B, b;
            return _regeneratorRuntime().wrap(function _callee19$(_context20) {
              while (1) switch (_context20.prev = _context20.next) {
                case 0:
                  l = this;
                  if (!(this.page && this.playerConfig && this.matchRewards)) {
                    _context20.next = 18;
                    break;
                  }
                  s = N(), u = null != (t = this.matchRewards.seasons.find(function (t) {
                    return t.seasonNumber === s.seasonNumber;
                  })) ? t : this.matchRewards.seasons[0], h = null != (e = null == u ? void 0 : u.matches.find(function (t) {
                    return t.matchNumber === s.matchNumber;
                  })) ? e : null == u ? void 0 : u.matches[0];
                  if (!(u && h)) {
                    _context20.next = 18;
                    break;
                  }
                  c = ++this.cardRenderVersion;
                  d = f();
                  _context20.next = 8;
                  return E();
                case 8:
                  m = _context20.sent;
                  g = P(d, m.headCoachBattleOvrBonus);
                  v = this.createOpponentRoster(u, h);
                  y = (null == (n = p.localStorage.getItem(T)) ? void 0 : n.trim()) || "我的球队";
                  C = d.filter(Boolean).length;
                  M = Boolean(s.goatCompleted);
                  this.setLabel("顶部/赛程", M ? "概念神赛程待开放" : u.difficultyQualityName + "赛季 第" + h.matchNumber + "场"), this.setLabel("双方阵容/球队总览/我方球队/球队总评/球队名", y), this.setLabel("双方阵容/球队总览/我方球队/球队总评/球队总评", this.formatOverall(g)), this.setLabel("双方阵容/球队总览/对方球队/球队总评/球队名", u.difficultyQualityName + "对手"), this.setLabel("双方阵容/球队总览/对方球队/球队总评/球队总评", this.formatOverall(h.opponentOvr)), this.setLabel("管理层加成/总裁/数值", "+" + (100 * m.operationPresidentBudgetBonus).toFixed(2) + "%"), this.setLabel("管理层加成/教练/数值", "+" + (100 * m.headCoachBattleOvrBonus).toFixed(2) + "%"), this.preparedMatch = M ? null : {
                    matchId: s.seasonNumber + "-" + s.matchNumber,
                    seasonNumber: s.seasonNumber,
                    matchNumber: s.matchNumber,
                    difficultyQualityName: u.difficultyQualityName,
                    playerTeamName: y,
                    opponentTeamName: u.difficultyQualityName + "对手",
                    playerRoster: d,
                    opponentRoster: v,
                    playerOverall: g,
                    opponentOverall: h.opponentOvr,
                    operationPresidentBonus: m.operationPresidentBudgetBonus,
                    temporaryBonusPercent: 0
                  }, this.startButton && (this.startButton.interactable = C >= 5 && !this.startingMatch && Boolean(this.preparedMatch));
                  B = null != (a = null == (r = this.playerTeamCardsRoot) ? void 0 : r.children) ? a : [], b = null != (o = null == (i = this.opponentTeamCardsRoot) ? void 0 : i.children) ? o : [];
                  _context20.next = 18;
                  return Promise.all([].concat(B.slice(0, 12).map(function (t, e) {
                    var n;
                    return l.renderCompactCard(t, null != (n = d[e]) ? n : null, c);
                  }), b.slice(0, 12).map(function (t, e) {
                    var n;
                    return l.renderCompactCard(t, null != (n = v[e]) ? n : null, c);
                  })));
                case 18:
                case "end":
                  return _context20.stop();
              }
            }, _callee19, this);
          }));
          return function () {
            return t.apply(this, arguments);
          };
        }(), o.createOpponentRoster = function (t, e) {
          var n = this,
            a = this.playerConfig.players.filter(function (e) {
              return e.quality === t.difficultyQualityId;
            }),
            r = a.length > 0 ? a : this.playerConfig.players,
            o = this.shuffleDeterministically(r, 1e4 * t.seasonNumber + e.matchNumber),
            i = Math.floor(e.opponentOvr / 12),
            l = Math.max(0, e.opponentOvr - 12 * i);
          return Array.from({
            length: 12
          }, function (a, r) {
            var s = o[r % o.length],
              u = i + (r < l ? 1 : 0);
            return {
              instanceId: "opponent-" + t.seasonNumber + "-" + e.matchNumber + "-" + r,
              templateId: s.id,
              sourcePlayerName: s.sourcePlayerName,
              displayName: s.displayName,
              position: s.position,
              qualityId: s.quality,
              qualityName: s.qualityName,
              overall: u,
              attributes: n.allocateAttributes(u, s.attributes),
              acquiredAtMs: 0,
              lineupSinceMs: null
            };
          });
        }, o.renderCompactCard = function () {
          var t = a( /*#__PURE__*/_regeneratorRuntime().mark(function _callee20(t, e, n) {
            var a, r, o, i, l, s, u, d, p, f, m, g, v, y, C, M;
            return _regeneratorRuntime().wrap(function _callee20$(_context21) {
              while (1) switch (_context21.prev = _context21.next) {
                case 0:
                  p = null != (a = null == (r = t.getChildByName("头像")) ? void 0 : r.getComponent(h)) ? a : null, f = null != (o = null == (i = t.getChildByName("名字")) ? void 0 : i.getComponent(c)) ? o : null, m = null != (l = null == (s = t.getChildByName("总评")) ? void 0 : s.getComponent(c)) ? l : null, g = null != (u = null == (d = t.getChildByName("边框")) ? void 0 : d.getComponent(h)) ? u : null;
                  if (!(g && !this.defaultQualityFrames.has(g) && this.defaultQualityFrames.set(g, g.spriteFrame), !e)) {
                    _context21.next = 4;
                    break;
                  }
                  if (p && (p.spriteFrame = null), g) g.spriteFrame = null != (v = this.defaultQualityFrames.get(g)) ? v : null;
                  return _context21.abrupt("return", (f && (f.string = "空缺"), void (m && (m.string = ""))));
                case 4:
                  f && (f.string = e.displayName), m && (m.overflow = c.Overflow.SHRINK, m.enableWrapText = !1, m.string = this.formatOverall(e.overall));
                  _context21.next = 7;
                  return Promise.all([R(e), A(e.qualityId)]);
                case 7:
                  y = _context21.sent;
                  C = y[0];
                  M = y[1];
                  n === this.cardRenderVersion && (p && this.setPortraitFramePreservingAspect(p, C), g && M && (g.spriteFrame = M));
                case 11:
                case "end":
                  return _context21.stop();
              }
            }, _callee20, this);
          }));
          return function (e, n, a) {
            return t.apply(this, arguments);
          };
        }(), o.setPortraitFramePreservingAspect = function (t, e) {
          var n = t.getComponent(u);
          if (n) {
            var a = this.portraitBounds.get(n);
            a || (a = n.contentSize.clone(), this.portraitBounds.set(n, a)), t.sizeMode = h.SizeMode.CUSTOM, t.spriteFrame = e;
            var r = null == e ? void 0 : e.originalSize;
            if (!r || r.width <= 0 || r.height <= 0) n.setContentSize(a);else {
              var o = Math.min(a.width / r.width, a.height / r.height);
              n.setContentSize(r.width * o, r.height * o);
            }
          } else t.spriteFrame = e;
        }, o.bindPlayerCardButtons = function () {
          var t,
            e,
            n = this;
          (null != (t = null == (e = this.playerTeamCardsRoot) ? void 0 : e.children.slice(0, 12)) ? t : []).forEach(function (t, e) {
            var a,
              r = null != (a = t.getComponent(s)) ? a : t.addComponent(s),
              o = function o() {
                f()[e] && m.emit(b, e);
              };
            r.node.on(s.EventType.CLICK, o, n), n.playerCardButtons.push({
              button: r,
              callback: o
            });
          });
        }, o.onDataChanged = function () {
          var t,
            e = this;
          null != (t = this.page) && t.active && this.ensureDataLoaded().then(function () {
            return e.refreshPage();
          });
        }, o.allocateAttributes = function (t, e) {
          for (var n = M.map(function (t) {
              var n;
              return Math.max(0, null != (n = e[t]) ? n : 0);
            }), a = n.reduce(function (t, e) {
              return t + e;
            }, 0) > 0 ? n : M.map(function () {
              return 1;
            }), r = a.reduce(function (t, e) {
              return t + e;
            }, 0), o = a.map(function (e) {
              return t * e / r;
            }), i = o.map(Math.floor), l = t - i.reduce(function (t, e) {
              return t + e;
            }, 0), s = o.map(function (t, e) {
              return {
                index: e,
                fraction: t - Math.floor(t)
              };
            }).sort(function (t, e) {
              return e.fraction - t.fraction;
            }); l > 0;) i[s[(t - l) % s.length].index] += 1, l -= 1;
          return {
            scoring: i[0],
            rebound: i[1],
            assist: i[2],
            steal: i[3],
            block: i[4]
          };
        }, o.shuffleDeterministically = function (t, e) {
          for (var n = [].concat(t), a = e || 1, r = n.length - 1; r > 0; r -= 1) {
            var o = Math.floor((a ^= a << 13, a ^= a >>> 17, ((a ^= a << 5) >>> 0) / 4294967296 * (r + 1))),
              i = [n[o], n[r]];
            n[r] = i[0], n[o] = i[1];
          }
          return n;
        }, o.setLabel = function (t, e) {
          var n,
            a = null == (n = this.findByPath(this.page, t)) ? void 0 : n.getComponent(c);
          a && (a.string = e);
        }, o.formatOverall = function (t) {
          return t >= B ? "MAX" : S(t);
        }, o.resolveSceneReferences = function () {
          var t,
            e,
            n,
            a,
            r,
            o = this.node.parent;
          this.page = null != (t = null == o ? void 0 : o.getChildByName("备赛页面")) ? t : null, this.returnButton = null != (e = null == (n = this.findByPath(this.page, "顶部/返回")) ? void 0 : n.getComponent(s)) ? e : null, this.startButton = null != (a = null == (r = this.findByPath(this.page, "底部按钮/Button")) ? void 0 : r.getComponent(s)) ? a : null, this.playerTeamCardsRoot = this.findByPath(this.page, "双方阵容/球队总览/我方球队/球员"), this.opponentTeamCardsRoot = this.findByPath(this.page, "双方阵容/球队总览/对方球队/球员");
        }, o.findByPath = function (t, e) {
          for (var a, r = t, o = n(e.split("/")); !(a = o()).done;) {
            var i,
              l,
              s = a.value;
            if (!(r = null != (i = null == (l = r) ? void 0 : l.getChildByName(s)) ? i : null)) return null;
          }
          return r;
        }, o.namedChildren = function (t) {
          var e = this;
          return this.page ? t.flatMap(function (t) {
            var n = e.page.getChildByName(t);
            return n ? [n] : [];
          }) : [];
        }, r;
      }(d)).instance = null, O = D)) || O);
      r._RF.pop();
    }
  };
});
System.register("chunks:///_virtual/PrimaryButtonView.ts", ["./rollupPluginModLoBabelHelpers.js", "cc"], function (t) {
  var e, i, n, r, o, l, u, a, s;
  return {
    setters: [function (t) {
      e = t.applyDecoratedDescriptor, i = t.inheritsLoose, n = t.initializerDefineProperty, r = t.assertThisInitialized;
    }, function (t) {
      o = t.cclegacy, l = t._decorator, u = t.Button, a = t.Label, s = t.Component;
    }],
    execute: function execute() {
      var c, p, b, h, f, y, g;
      o._RF.push({}, "67f54Yc0i1KPqgsqW9jL835", "PrimaryButtonView", void 0);
      var m = l.ccclass,
        L = l.property;
      t("PrimaryButtonView", (c = m("PrimaryButtonView"), p = L(u), b = L(a), c((y = e((f = function (t) {
        function e() {
          for (var e, i = arguments.length, o = new Array(i), l = 0; l < i; l++) o[l] = arguments[l];
          return e = t.call.apply(t, [this].concat(o)) || this, n(e, "button", y, r(e)), n(e, "titleLabel", g, r(e)), e;
        }
        i(e, t);
        var o = e.prototype;
        return o.onLoad = function () {
          var t, e;
          null != this.button || (this.button = this.node.getComponent(u)), null != this.titleLabel || (this.titleLabel = null != (t = null == (e = this.node.getChildByName("Text")) ? void 0 : e.getComponent(a)) ? t : null);
        }, o.setup = function (t) {
          this.titleLabel && (this.titleLabel.string = t);
        }, e;
      }(s)).prototype, "button", [p], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return null;
        }
      }), g = e(f.prototype, "titleLabel", [b], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return null;
        }
      }), h = f)) || h));
      o._RF.pop();
    }
  };
});
System.register("chunks:///_virtual/ProgressBarView.ts", ["./rollupPluginModLoBabelHelpers.js", "cc"], function (e) {
  var t, r, i, n, a, o, l, s, u, c;
  return {
    setters: [function (e) {
      t = e.applyDecoratedDescriptor, r = e.inheritsLoose, i = e.initializerDefineProperty, n = e.assertThisInitialized;
    }, function (e) {
      a = e.cclegacy, o = e._decorator, l = e.Node, s = e.Label, u = e.UITransform, c = e.Component;
    }],
    execute: function execute() {
      var p, f, h, g, b, v, m;
      a._RF.push({}, "ed661DMrphFuaeWNelSXKDD", "ProgressBarView", void 0);
      var y = o.ccclass,
        d = o.property;
      e("ProgressBarView", (p = y("ProgressBarView"), f = d(l), h = d(s), p((v = t((b = function (e) {
        function t() {
          for (var t, r = arguments.length, a = new Array(r), o = 0; o < r; o++) a[o] = arguments[o];
          return t = e.call.apply(e, [this].concat(a)) || this, i(t, "fill", v, n(t)), i(t, "valueLabel", m, n(t)), t;
        }
        return r(t, e), t.prototype.setup = function (e, t) {
          var r = Math.max(1, t),
            i = Math.max(0, Math.min(1, e / r));
          if (this.fill) {
            var n = this.fill.getComponent(u),
              a = this.node.getComponent(u);
            n && a && n.setContentSize(a.contentSize.width * i, n.contentSize.height);
          }
          this.valueLabel && (this.valueLabel.string = e + "/" + t);
        }, t;
      }(c)).prototype, "fill", [f], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return null;
        }
      }), m = t(b.prototype, "valueLabel", [h], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return null;
        }
      }), g = b)) || g));
      a._RF.pop();
    }
  };
});
System.register("chunks:///_virtual/RecruitmentController.ts", ["./rollupPluginModLoBabelHelpers.js", "cc", "./RosterSlotView.ts", "./TeamLevelController.ts", "./TopTeamInfoController.ts", "./RecruitmentRules.ts", "./CourtSimulationController.ts", "./GameState.ts", "./PlayerAssets.ts", "./FullScreenEntrance.ts", "./RewardedAdService.ts", "./NumberGrowthAnimator.ts"], function (t) {
  var e, i, n, r, l, a, o, u, s, d, c, h, p, g, m, f, v, y, B, C, b, R, w, A, I, P, L, N, T, S, M, U, G, q, E, V, F, O, x, D, Q, k, _, W, z, K;
  return {
    setters: [function (t) {
      e = t.applyDecoratedDescriptor, i = t.inheritsLoose, n = t.initializerDefineProperty, r = t.assertThisInitialized, l = t.createForOfIteratorHelperLoose, a = t.asyncToGenerator;
    }, function (t) {
      o = t.cclegacy, u = t._decorator, s = t.Color, d = t.Button, c = t.Sprite, h = t.Label, p = t.UITransform, g = t.Material, m = t.Vec4, f = t.resources, v = t.EffectAsset, y = t.JsonAsset, B = t.Component;
    }, function (t) {
      C = t.RosterSlotView, b = t.formatPlayerOverall, R = t.getQualityFrameIndex;
    }, function (t) {
      w = t.TeamLevelController, A = t.getStoredMarketValueLevel;
    }, function (t) {
      I = t.TopTeamInfoController;
    }, function (t) {
      P = t.evaluateRecruitmentResult;
    }, function (t) {
      L = t.CourtSimulationController;
    }, function (t) {
      N = t.gameStateEvents, T = t.GAME_STATE_EVENT_BUDGET_CHANGED, S = t.ATTRIBUTE_KEYS, M = t.trySpend, U = t.getBalance, G = t.recordPlayerAcquisition, q = t.saveRoster, E = t.recordConceptGodAcquisition, V = t.getRosterSnapshot, F = t.getManagementEffects, O = t.loadRoster, x = t.migratePlayerHistoryToDisplayNames, D = t.calculateTeamOverall;
    }, function (t) {
      Q = t.loadPlayerPortrait, k = t.loadSpriteFrame;
    }, function (t) {
      _ = t.playFullScreenEntrance;
    }, function (t) {
      W = t.configureRewardedAdUnitIds, z = t.showRewardedVideo;
    }, function (t) {
      K = t.setGrowingNumber;
    }],
    execute: function execute() {
      var H, J, Y, j, X, $, Z;
      o._RF.push({}, "c1c67O51lxPOISndhPmqzxg", "RecruitmentController", void 0);
      var tt = u.ccclass,
        et = u.property,
        it = new s(220, 55, 55, 255);
      t("RecruitmentController", (H = tt("RecruitmentController"), J = et({
        displayName: "微信激励视频广告位ID",
        tooltip: "微信小游戏后台创建的激励视频广告位ID。Creator预览无需填写。"
      }), Y = et({
        displayName: "TapTap激励视频广告位ID",
        tooltip: "TapTap小游戏后台创建的激励视频广告位ID。Creator预览无需填写。"
      }), H(($ = e((X = function (t) {
        function e() {
          for (var e, i = arguments.length, l = new Array(i), a = 0; a < i; a++) l[a] = arguments[a];
          return e = t.call.apply(t, [this].concat(l)) || this, n(e, "wechatRewardedAdUnitId", $, r(e)), n(e, "tapRewardedAdUnitId", Z, r(e)), e.homeRoot = null, e.resultPage = null, e.rosterSlots = [], e.recruitButton = null, e.recruitButtonTargetSprite = null, e.recruitButtonNormalSprite = null, e.recruitButtonTransition = d.Transition.NONE, e.recruitingButtonSprite = null, e.recruitButtonOriginalMaterial = null, e.recruitButtonGlowMaterial = null, e.budgetLabel = null, e.dismissButton = null, e.replaceButton = null, e.replaceButtonLabel = null, e.upgradeAdButton = null, e.upgradeAdButtonLabel = null, e.replacementPanel = null, e.replacedSlot = null, e.replacedNameLabel = null, e.overallIncreaseLabel = null, e.overallIncreaseValueLabel = null, e.overallIncreaseValueDefaultColor = null, e.candidatePortrait = null, e.recruitBackground = null, e.wheatSprites = [], e.candidateFrame = null, e.candidateNameplate = null, e.candidateQualityBadge = null, e.candidateNameLabel = null, e.candidateQualityLabel = null, e.candidatePositionLabel = null, e.candidateOverallLabel = null, e.candidateAttributeLabels = new Map(), e.willpowerTextLabel = null, e.willpowerValueLabel = null, e.teamLevelController = null, e.topTeamInfoController = null, e.courtSimulationController = null, e.playerConfig = null, e.ovrConfig = null, e.probabilityConfig = null, e.economyConfig = null, e.conceptGodUpgradeConfig = null, e.managementEffects = {
            operationPresidentBudgetBonus: 0,
            headCoachBattleOvrBonus: 0,
            scoutingDirectorHighestQualityWeightBonus: 0,
            medicalTeamOvrRollPercentileShift: 0,
            mediaTeamOfflineBudgetBonus: 0
          }, e.roster = [], e.budget = 100, e.pendingCard = null, e.pendingDecision = null, e.pendingWillpowerAdded = 0, e.upgradeAdProcessing = !1, e.pendingUpgradeAdUsed = !1, e.queuedAdRecruitments = [], e.adTripleRecruitmentActive = !1, e.ready = !1, e.processing = !1, e;
        }
        i(e, t);
        var o = e.prototype;
        return o.onLoad = function () {
          if (W({
            wechat: this.wechatRewardedAdUnitId,
            tapTap: this.tapRewardedAdUnitId
          }), this.resolveSceneReferences(), !this.hasRequiredReferences()) return console.error("[RecruitmentController] Missing recruitment UI references."), void (this.enabled = !1);
          this.resultPage.active = !1;
        }, o.onEnable = function () {
          var t, e, i, n;
          null == (t = this.recruitButton) || t.node.on(d.EventType.CLICK, this.onRecruitClicked, this), null == (e = this.dismissButton) || e.node.on(d.EventType.CLICK, this.onDismissClicked, this), null == (i = this.replaceButton) || i.node.on(d.EventType.CLICK, this.onReplaceClicked, this), null == (n = this.upgradeAdButton) || n.node.on(d.EventType.CLICK, this.onUpgradeAdClicked, this), N.on(T, this.onBudgetChanged, this);
        }, o.start = function () {
          this.initialize();
        }, o.onDisable = function () {
          var t, e, i, n;
          null == (t = this.recruitButton) || t.node.off(d.EventType.CLICK, this.onRecruitClicked, this), null == (e = this.dismissButton) || e.node.off(d.EventType.CLICK, this.onDismissClicked, this), null == (i = this.replaceButton) || i.node.off(d.EventType.CLICK, this.onReplaceClicked, this), null == (n = this.upgradeAdButton) || n.node.off(d.EventType.CLICK, this.onUpgradeAdClicked, this), N.off(T, this.onBudgetChanged, this);
        }, o.resolveSceneReferences = function () {
          var t,
            e,
            i,
            n,
            r,
            l,
            a,
            o,
            u,
            s,
            p,
            g,
            m,
            f,
            v,
            y,
            B,
            b,
            R,
            A,
            P,
            N,
            T,
            S,
            M,
            U,
            G,
            q,
            E,
            V,
            F,
            O,
            x,
            D,
            Q,
            k,
            _,
            W,
            z,
            K,
            H,
            J,
            Y,
            j,
            X,
            $,
            Z,
            tt,
            et,
            it,
            nt,
            rt,
            lt,
            at,
            ot,
            ut,
            st,
            dt,
            ct,
            ht,
            pt,
            gt,
            mt,
            ft,
            vt,
            yt,
            Bt,
            Ct,
            bt = this.node.parent;
          this.homeRoot = null != (t = null == bt ? void 0 : bt.getChildByName("主页")) ? t : null, this.resultPage = null != (e = null == bt ? void 0 : bt.getChildByName("招募结果页面")) ? e : null;
          var Rt = this.findByPath(this.homeRoot, "球队/阵容槽位");
          if (this.rosterSlots = Rt ? Rt.children.map(function (t) {
            return t.getComponent(C);
          }).filter(function (t) {
            return Boolean(t);
          }).sort(function (t, e) {
            return t.node.name.localeCompare(e.node.name, "zh-CN", {
              numeric: !0
            });
          }) : [], this.recruitButton = null != (i = null == (n = this.findByPath(this.homeRoot, "底部按钮/招募/招募")) ? void 0 : n.getComponent(d)) ? i : null, this.recruitButtonTargetSprite = null != (r = null != (l = null == (a = this.recruitButton) || null == (a = a.target) ? void 0 : a.getComponent(c)) ? l : null == (o = this.recruitButton) ? void 0 : o.node.getComponent(c)) ? r : null, this.recruitButtonOriginalMaterial = null != (u = null == (s = this.recruitButtonTargetSprite) ? void 0 : s.customMaterial) ? u : null, this.recruitButtonNormalSprite = null != (p = null != (g = null == (m = this.recruitButton) ? void 0 : m.normalSprite) ? g : null == (f = this.recruitButtonTargetSprite) ? void 0 : f.spriteFrame) ? p : null, this.recruitButtonTransition = null != (v = null == (y = this.recruitButton) ? void 0 : y.transition) ? v : d.Transition.NONE, this.budgetLabel = null != (B = null == (b = this.findByPath(this.homeRoot, "底部按钮/招募/预算余额")) ? void 0 : b.getComponent(h)) ? B : null, this.teamLevelController = null != (R = null == (A = this.homeRoot) ? void 0 : A.getComponentInChildren(w)) ? R : null, this.topTeamInfoController = null != (P = null == (N = this.homeRoot) ? void 0 : N.getComponentInChildren(I)) ? P : null, this.courtSimulationController = null != (T = null == (S = this.homeRoot) ? void 0 : S.getComponentInChildren(L)) ? T : null, this.resultPage) {
            var wt = this.resultPage.getChildByName("球员头像");
            this.candidatePortrait = null != (M = null == wt || null == (U = wt.children.find(function (t) {
              return t.name.includes("_");
            })) ? void 0 : U.getComponent(c)) ? M : null, this.recruitBackground = null != (G = null == wt || null == (q = wt.getChildByName("bg")) ? void 0 : q.getComponent(c)) ? G : null, this.wheatSprites = null != (E = null == wt ? void 0 : wt.children.filter(function (t) {
              return "麦穗" === t.name;
            }).map(function (t) {
              return t.getComponent(c);
            }).filter(function (t) {
              return Boolean(t);
            })) ? E : [], this.candidateFrame = null != (V = null == wt || null == (F = wt.getChildByName("头像框")) ? void 0 : F.getComponent(c)) ? V : null, this.candidateNameplate = null != (O = null == wt || null == (x = wt.getChildByName("名牌")) ? void 0 : x.getComponent(c)) ? O : null, this.candidateQualityBadge = null != (D = null == wt || null == (Q = wt.getChildByName("品质标签")) ? void 0 : Q.getComponent(c)) ? D : null, this.candidateNameLabel = null != (k = null == (_ = this.findByPath(wt, "名牌/名字")) ? void 0 : _.getComponent(h)) ? k : null, this.candidateQualityLabel = null != (W = null == (z = this.findByPath(wt, "品质标签/品质")) ? void 0 : z.getComponent(h)) ? W : null, this.candidatePositionLabel = null != (K = null == (H = this.findByPath(wt, "位置/位置")) ? void 0 : H.getComponent(h)) ? K : null, this.candidateOverallLabel = null != (J = null == (Y = this.findByPath(this.resultPage, "总评/数值")) ? void 0 : Y.getComponent(h)) ? J : null;
            for (var At = this.resultPage.getChildByName("五项数据"), It = 0, Pt = [["scoring", "得分"], ["rebound", "篮板"], ["assist", "助攻"], ["steal", "抢断"], ["block", "盖帽"]]; It < Pt.length; It++) {
              var Lt,
                Nt = Pt[It],
                Tt = Nt[0],
                St = Nt[1],
                Mt = null == (Lt = this.findByPath(At, St + "/数值")) ? void 0 : Lt.getComponent(h);
              Mt && this.candidateAttributeLabels.set(Tt, Mt);
            }
            this.replacementPanel = null != (j = this.resultPage.children.find(function (t) {
              return "替换" === t.name && !t.getComponent(d);
            })) ? j : null, this.replacedSlot = null != (X = null == ($ = this.replacementPanel) ? void 0 : $.getComponentInChildren(C)) ? X : null, this.replacedNameLabel = null != (Z = null == (tt = this.replacementPanel) || null == (tt = tt.getChildByName("被替换球员名字")) ? void 0 : tt.getComponent(h)) ? Z : null, this.overallIncreaseLabel = null != (et = null == (it = this.replacementPanel) || null == (it = it.getChildByName("总评提升")) ? void 0 : it.getComponent(h)) ? et : null, this.overallIncreaseValueLabel = null != (nt = null == (rt = this.replacementPanel) || null == (rt = rt.getChildByName("总评提升数值")) ? void 0 : rt.getComponent(h)) ? nt : null, this.overallIncreaseValueDefaultColor = null != (lt = null == (at = this.overallIncreaseValueLabel) ? void 0 : at.color.clone()) ? lt : null, this.dismissButton = null != (ot = null == (ut = this.resultPage.getChildByName("解雇")) ? void 0 : ut.getComponent(d)) ? ot : null, this.replaceButton = null != (st = null == (dt = this.resultPage.children.find(function (t) {
              return "替换" === t.name && Boolean(t.getComponent(d));
            })) ? void 0 : dt.getComponent(d)) ? st : null, this.replaceButtonLabel = null != (ct = null == (ht = this.replaceButton) || null == (ht = ht.node.getChildByName("Label")) ? void 0 : ht.getComponent(h)) ? ct : null, this.upgradeAdButton = null != (pt = null == (gt = this.resultPage.getChildByName("看广告升级")) ? void 0 : gt.getComponent(d)) ? pt : null, this.upgradeAdButtonLabel = null != (mt = null == (ft = this.upgradeAdButton) || null == (ft = ft.node.getChildByName("Label")) ? void 0 : ft.getComponent(h)) ? mt : null, this.willpowerTextLabel = null != (vt = null == (yt = this.resultPage.getChildByName("获得斗志")) ? void 0 : yt.getComponent(h)) ? vt : null, this.willpowerValueLabel = null != (Bt = null == (Ct = this.findByPath(this.resultPage, "获得斗志/斗志数值")) ? void 0 : Ct.getComponent(h)) ? Bt : null;
          }
        }, o.hasRequiredReferences = function () {
          return Boolean(this.homeRoot && this.resultPage && 12 === this.rosterSlots.length && this.recruitButton && this.budgetLabel && this.dismissButton && this.replaceButton && this.replaceButtonLabel && this.upgradeAdButton && this.upgradeAdButtonLabel && this.replacementPanel && this.replacedSlot && this.candidatePortrait && this.candidateNameLabel && this.candidateQualityLabel && this.candidatePositionLabel && this.candidateOverallLabel && this.candidateAttributeLabels.size === S.length);
        }, o.initialize = function () {
          var t = a( /*#__PURE__*/_regeneratorRuntime().mark(function _callee21() {
            var t, e, i, n, r, l, a, o, u, s;
            return _regeneratorRuntime().wrap(function _callee21$(_context22) {
              while (1) switch (_context22.prev = _context22.next) {
                case 0:
                  _context22.prev = 0;
                  _context22.next = 3;
                  return Promise.all([this.loadJson("data/player_config_fame_v3"), this.loadJson("data/balance/player_ovr_ranges"), this.loadJson("data/balance/recruitment_probability"), this.loadJson("data/balance/economy"), this.loadJson("data/balance/concept_god_upgrade"), F(), k("images/UI/按钮/招募中/spriteFrame"), this.loadRecruitButtonGlowEffect()]);
                case 3:
                  e = _context22.sent;
                  i = e[0];
                  n = e[1];
                  r = e[2];
                  l = e[3];
                  a = e[4];
                  o = e[5];
                  u = e[6];
                  s = e[7];
                  if (Array.isArray(i.players) && Array.isArray(n.ranges) && Array.isArray(r.marketValueLevels) && Number.isFinite(l.initialBudget) && l.recruit && Array.isArray(a.eligibleSourcePlayerNames)) {
                    _context22.next = 14;
                    break;
                  }
                  throw new Error("Invalid recruitment configuration.");
                case 14:
                  this.playerConfig = i;
                  this.ovrConfig = n;
                  this.probabilityConfig = r;
                  this.economyConfig = l;
                  this.conceptGodUpgradeConfig = a;
                  this.managementEffects = o;
                  this.recruitingButtonSprite = u;
                  s && this.installRecruitButtonGlow(s);
                  this.budget = U(l.initialBudget);
                  this.roster = O(this.rosterSlots.length);
                  x(i.players, this.roster);
                  _context22.next = 27;
                  return this.refreshRosterSlots();
                case 27:
                  this.refreshCourtSimulation();
                  this.ready = !0;
                  this.refreshBudgetView();
                  null == (t = this.topTeamInfoController) || t.refreshOverallFromRoster();
                  _context22.next = 36;
                  break;
                case 33:
                  _context22.prev = 33;
                  _context22.t0 = _context22["catch"](0);
                  console.error("[RecruitmentController] Failed to initialize.", _context22.t0), this.refreshBudgetView();
                case 36:
                case "end":
                  return _context22.stop();
              }
            }, _callee21, this, [[0, 33]]);
          }));
          return function () {
            return t.apply(this, arguments);
          };
        }(), o.onRecruitClicked = function () {
          var t,
            e,
            i = this;
          if (this.ready && !this.processing && this.economyConfig) {
            var n = Math.max(0, Math.floor(this.economyConfig.recruit.budgetCost));
            if (this.budget < n) this.recruitTripleFromAd();else {
              var r = this.createRecruitedCard();
              if (r) {
                if (!M(n)) return this.budget = U(this.economyConfig.initialBudget), void this.refreshBudgetView();
                this.processing = !0, this.showRecruitingButtonVisual(), this.budget = U(this.economyConfig.initialBudget), this.refreshBudgetView(), G(r);
                var l = null != (t = null == (e = this.teamLevelController) ? void 0 : e.addRecruitWillpower()) ? t : 0;
                this.pendingCard = r, this.pendingWillpowerAdded = l, this.upgradeAdProcessing = !1, this.pendingUpgradeAdUsed = !1, this.pendingDecision = P(this.roster.map(function (t) {
                  var e;
                  return null != (e = null == t ? void 0 : t.overall) ? e : null;
                })), this.showRecruitmentResultAfterDelay(r, this.pendingDecision, l)["finally"](function () {
                  i.restoreRecruitButtonVisual(), i.processing = !1, i.refreshBudgetView();
                });
              }
            }
          }
        }, o.recruitTripleFromAd = function () {
          var t = a( /*#__PURE__*/_regeneratorRuntime().mark(function _callee22() {
            var t, e, i, n;
            return _regeneratorRuntime().wrap(function _callee22$(_context23) {
              while (1) switch (_context23.prev = _context23.next) {
                case 0:
                  t = this;
                  if (this.processing) {
                    _context23.next = 29;
                    break;
                  }
                  this.processing = !0, this.showRecruitingButtonVisual(), this.refreshBudgetView();
                  _context23.prev = 3;
                  _context23.next = 6;
                  return z({
                    wechat: this.wechatRewardedAdUnitId,
                    tapTap: this.tapRewardedAdUnitId
                  });
                case 6:
                  if (_context23.sent) {
                    _context23.next = 8;
                    break;
                  }
                  return _context23.abrupt("return");
                case 8:
                  e = [], i = 0;
                case 9:
                  if (!(i < 3)) {
                    _context23.next = 17;
                    break;
                  }
                  n = this.createRecruitedCard();
                  if (n) {
                    _context23.next = 13;
                    break;
                  }
                  throw new Error("Failed to create an ad recruitment result.");
                case 13:
                  e.push(n);
                case 14:
                  i += 1;
                  _context23.next = 9;
                  break;
                case 17:
                  this.queuedAdRecruitments = e.map(function (e) {
                    var i, n;
                    return G(e), {
                      card: e,
                      willpowerAdded: null != (i = null == (n = t.teamLevelController) ? void 0 : n.addRecruitWillpower()) ? i : 0
                    };
                  });
                  this.adTripleRecruitmentActive = !0;
                  _context23.next = 21;
                  return this.showNextAdRecruitmentResult();
                case 21:
                  _context23.next = 26;
                  break;
                case 23:
                  _context23.prev = 23;
                  _context23.t0 = _context23["catch"](3);
                  console.error("[RecruitmentController] Ad triple recruitment failed.", _context23.t0), this.queuedAdRecruitments = [], this.adTripleRecruitmentActive = !1;
                case 26:
                  _context23.prev = 26;
                  this.adTripleRecruitmentActive || (this.processing = !1, this.restoreRecruitButtonVisual(), this.refreshBudgetView());
                  return _context23.finish(26);
                case 29:
                case "end":
                  return _context23.stop();
              }
            }, _callee22, this, [[3, 23, 26, 29]]);
          }));
          return function () {
            return t.apply(this, arguments);
          };
        }(), o.showNextAdRecruitmentResult = function () {
          var t = a( /*#__PURE__*/_regeneratorRuntime().mark(function _callee23() {
            var t;
            return _regeneratorRuntime().wrap(function _callee23$(_context24) {
              while (1) switch (_context24.prev = _context24.next) {
                case 0:
                  t = this.queuedAdRecruitments.shift();
                  if (!t) {
                    _context24.next = 11;
                    break;
                  }
                  this.pendingCard = t.card;
                  this.pendingWillpowerAdded = t.willpowerAdded;
                  this.upgradeAdProcessing = !1;
                  this.pendingUpgradeAdUsed = !1;
                  this.pendingDecision = P(this.roster.map(function (t) {
                    var e;
                    return null != (e = null == t ? void 0 : t.overall) ? e : null;
                  }));
                  _context24.next = 9;
                  return this.showRecruitmentResult(t.card, this.pendingDecision, t.willpowerAdded);
                case 9:
                  _context24.next = 12;
                  break;
                case 11:
                  this.finishAdTripleRecruitment();
                case 12:
                case "end":
                  return _context24.stop();
              }
            }, _callee23, this);
          }));
          return function () {
            return t.apply(this, arguments);
          };
        }(), o.showRecruitmentResultAfterDelay = function () {
          var t = a( /*#__PURE__*/_regeneratorRuntime().mark(function _callee24(t, e, i) {
            return _regeneratorRuntime().wrap(function _callee24$(_context25) {
              while (1) switch (_context25.prev = _context25.next) {
                case 0:
                  _context25.next = 2;
                  return this.waitForSeconds(1.5);
                case 2:
                  _context25.next = 4;
                  return this.showRecruitmentResult(t, e, i);
                case 4:
                case "end":
                  return _context25.stop();
              }
            }, _callee24, this);
          }));
          return function (e, i, n) {
            return t.apply(this, arguments);
          };
        }(), o.onDismissClicked = function () {
          var t;
          this.pendingCard && "empty-slot" !== (null == (t = this.pendingDecision) ? void 0 : t.mode) && this.closeResultPage();
        }, o.onReplaceClicked = function () {
          var t,
            e,
            i = this.pendingCard,
            n = null == (t = this.pendingDecision) ? void 0 : t.targetIndex;
          i && null != n && (this.replaceButton.interactable = !1, i.lineupSinceMs = Date.now(), this.roster[n] = i, q(this.roster), this.applyCardToSlot(this.rosterSlots[n], i, !0), null == (e = this.topTeamInfoController) || e.refreshOverallFromRoster(), this.refreshCourtSimulation(), this.closeResultPage());
        }, o.onUpgradeAdClicked = function () {
          this.upgradePendingCardFromAd();
        }, o.upgradePendingCardFromAd = function () {
          var t = a( /*#__PURE__*/_regeneratorRuntime().mark(function _callee25() {
            var t;
            return _regeneratorRuntime().wrap(function _callee25$(_context26) {
              while (1) switch (_context26.prev = _context26.next) {
                case 0:
                  t = this.pendingCard;
                  if (!(t && this.pendingDecision && this.conceptGodUpgradeConfig && !this.upgradeAdProcessing && !this.pendingUpgradeAdUsed && this.canUpgradeFromAd(t))) {
                    _context26.next = 19;
                    break;
                  }
                  this.upgradeAdProcessing = !0, this.dismissButton.interactable = !1, this.replaceButton.interactable = !1, this.refreshUpgradeAdButton(t, !0);
                  _context26.prev = 3;
                  _context26.next = 6;
                  return z({
                    wechat: this.wechatRewardedAdUnitId,
                    tapTap: this.tapRewardedAdUnitId
                  });
                case 6:
                  _context26.t0 = !_context26.sent;
                  if (_context26.t0) {
                    _context26.next = 9;
                    break;
                  }
                  _context26.t0 = this.pendingCard !== t;
                case 9:
                  if (!_context26.t0) {
                    _context26.next = 11;
                    break;
                  }
                  return _context26.abrupt("return");
                case 11:
                  if (!(this.pendingUpgradeAdUsed = !0, !(this.isConceptGod(t) || this.isGoat(t) && !this.canBecomeConceptGod(t) ? this.upgradeRandomAttribute(t) : this.isGoat(t) ? this.upgradeGoatToConceptGod(t) : this.upgradeNormalQuality(t)))) {
                    _context26.next = 13;
                    break;
                  }
                  return _context26.abrupt("return", void (this.pendingUpgradeAdUsed = !1));
                case 13:
                  this.pendingDecision = P(this.roster.map(function (t) {
                    var e;
                    return null != (e = null == t ? void 0 : t.overall) ? e : null;
                  }));
                  _context26.next = 16;
                  return this.showRecruitmentResult(t, this.pendingDecision, this.pendingWillpowerAdded, !1);
                case 16:
                  _context26.prev = 16;
                  this.upgradeAdProcessing = !1, this.pendingCard && this.pendingDecision && (this.restoreResultButtons(this.pendingDecision), this.refreshUpgradeAdButton(this.pendingCard));
                  return _context26.finish(16);
                case 19:
                case "end":
                  return _context26.stop();
              }
            }, _callee25, this, [[3,, 16, 19]]);
          }));
          return function () {
            return t.apply(this, arguments);
          };
        }(), o.upgradeNormalQuality = function (t) {
          var e;
          if (!this.ovrConfig || !this.playerConfig) return !1;
          var i = this.ovrConfig.ranges.find(function (e) {
              return e.qualityId === t.qualityId;
            }),
            n = this.getNextNormalQualityRange(t.qualityId);
          if (!i || !n) return !1;
          var r = Math.max(1, i.maxOvr - i.minOvr),
            l = Math.min(1, Math.max(0, (t.overall - i.minOvr) / r)),
            a = Math.round(n.minOvr + l * (n.maxOvr - n.minOvr)),
            o = this.playerConfig.players.find(function (e) {
              return e.sourcePlayerName === t.sourcePlayerName && e.quality === n.qualityId;
            });
          return t.templateId = null != (e = null == o ? void 0 : o.id) ? e : t.templateId, t.qualityId = n.qualityId, t.qualityName = n.qualityName, t.overall = a, t.attributes = this.allocateAttributes(a, t.attributes), !0;
        }, o.upgradeGoatToConceptGod = function (t) {
          var e,
            i = this.conceptGodUpgradeConfig,
            n = null == (e = this.ovrConfig) ? void 0 : e.ranges.find(function (t) {
              return t.qualityId === (null == i ? void 0 : i.quality.goatQualityId);
            });
          if (!i || !n || !this.canBecomeConceptGod(t)) return !1;
          var r = 1 + .01 * E(),
            l = Math.floor(n.minOvr * r),
            a = Math.floor(n.maxOvr * r),
            o = this.rollOverall(l, a, 0);
          return t.qualityId = i.quality.conceptGodQualityId, t.qualityName = i.quality.conceptGodQualityName, t.isConceptGod = !0, t.overall = o, t.attributes = this.allocateAttributes(o, t.attributes), !0;
        }, o.upgradeRandomAttribute = function (t) {
          var e,
            i = null == (e = this.conceptGodUpgradeConfig) ? void 0 : e.attributeUpgrade;
          if (!i) return !1;
          var n = S.filter(function (e) {
            return t.attributes[e] < i.integerMaximum;
          });
          if (0 === n.length) return !1;
          var r = n[Math.floor(Math.random() * n.length)],
            l = Math.max(0, t.attributes[r]),
            a = Math.max(i.minimumIncrease, Math.ceil(l * i.increasePercent)),
            o = Math.min(i.integerMaximum, l + a);
          return t.attributes[r] = o, t.overall = Math.min(i.integerMaximum, t.overall + o - l), o > l;
        }, o.getNextNormalQualityRange = function (t) {
          var e, i;
          return null != (e = null == (i = this.ovrConfig) ? void 0 : i.ranges.filter(function (e) {
            return e.qualityId > t;
          }).sort(function (t, e) {
            return t.qualityId - e.qualityId;
          })[0]) ? e : null;
        }, o.isGoat = function (t) {
          var e;
          return t.qualityId === (null == (e = this.conceptGodUpgradeConfig) ? void 0 : e.quality.goatQualityId);
        }, o.isConceptGod = function (t) {
          var e = this.conceptGodUpgradeConfig;
          return Boolean(t.isConceptGod || e && (t.qualityId === e.quality.conceptGodQualityId || t.qualityName === e.quality.conceptGodQualityName));
        }, o.canBecomeConceptGod = function (t) {
          var e;
          return Boolean(this.isGoat(t) && (null == (e = this.conceptGodUpgradeConfig) ? void 0 : e.eligibleSourcePlayerNames.includes(t.sourcePlayerName)));
        }, o.canUpgradeAttribute = function (t) {
          var e,
            i = null == (e = this.conceptGodUpgradeConfig) ? void 0 : e.attributeUpgrade.integerMaximum;
          return !(void 0 === i || !Number.isFinite(i)) && S.some(function (e) {
            return t.attributes[e] < i;
          });
        }, o.canUpgradeFromAd = function (t) {
          return this.isConceptGod(t) ? this.canUpgradeAttribute(t) : this.isGoat(t) ? this.canBecomeConceptGod(t) || this.canUpgradeAttribute(t) : Boolean(this.getNextNormalQualityRange(t.qualityId));
        }, o.refreshUpgradeAdButton = function (t, e) {
          void 0 === e && (e = !1);
          var i = this.conceptGodUpgradeConfig;
          if (this.upgradeAdButton && this.upgradeAdButtonLabel && i) {
            var n = !0;
            this.isConceptGod(t) ? (this.upgradeAdButtonLabel.string = i.frontend.attributeButtonLabel, n = this.canUpgradeAttribute(t)) : this.isGoat(t) ? this.canBecomeConceptGod(t) ? this.upgradeAdButtonLabel.string = i.frontend.eligibleGoatButtonLabel : (this.upgradeAdButtonLabel.string = i.frontend.attributeButtonLabel, n = this.canUpgradeAttribute(t)) : (n = Boolean(this.getNextNormalQualityRange(t.qualityId)), this.upgradeAdButtonLabel.string = i.frontend.normalQualityButtonLabel), this.upgradeAdButton.interactable = n && !e && !this.upgradeAdProcessing && !this.pendingUpgradeAdUsed;
          }
        }, o.restoreResultButtons = function (t) {
          this.dismissButton.interactable = "empty-slot" !== t.mode, this.replaceButton.interactable = "dismiss-only" !== t.mode;
        }, o.createRecruitedCard = function () {
          if (!this.playerConfig || !this.ovrConfig || !this.probabilityConfig) return null;
          var t = this.drawQualityId(),
            e = this.playerConfig.players.filter(function (e) {
              return e.quality === t;
            }),
            i = this.ovrConfig.ranges.find(function (e) {
              return e.qualityId === t;
            });
          if (0 === e.length || !i) return console.error("[RecruitmentController] Empty player pool or missing OVR range.", t), null;
          var n = e[Math.floor(Math.random() * e.length)],
            r = this.rollOverall(i.minOvr, i.maxOvr, this.managementEffects.medicalTeamOvrRollPercentileShift),
            l = Date.now();
          return {
            instanceId: "recruit-" + Date.now() + "-" + Math.floor(1e6 * Math.random()),
            templateId: n.id,
            sourcePlayerName: n.sourcePlayerName,
            displayName: n.displayName,
            position: n.position,
            qualityId: n.quality,
            qualityName: n.qualityName,
            overall: r,
            attributes: this.allocateAttributes(r, n.attributes),
            acquiredAtMs: l,
            lineupSinceMs: null
          };
        }, o.drawQualityId = function () {
          for (var t, e, i, n, r, a, o = this, u = null == (t = this.teamLevelController) ? void 0 : t.getSnapshot(), s = null != (e = null == u ? void 0 : u.marketValueLevel) ? e : A(), d = null != (i = this.probabilityConfig.marketValueLevels.find(function (t) {
              return t.level === s;
            })) ? i : this.probabilityConfig.marketValueLevels[0], c = d.baseWeights.reduce(function (t, e, i) {
              return e > 0 ? i : t;
            }, -1), h = this.probabilityConfig.qualities.map(function (t, e) {
              var i;
              return {
                qualityId: t.qualityId,
                weight: Math.max(0, (null != (i = d.baseWeights[e]) ? i : 0) + (e === c ? o.managementEffects.scoutingDirectorHighestQualityWeightBonus : 0))
              };
            }).filter(function (t) {
              return t.weight > 0;
            }), p = h.reduce(function (t, e) {
              return t + e.weight;
            }, 0), g = Math.random() * p, m = l(h); !(a = m()).done;) {
            var f = a.value;
            if ((g -= f.weight) <= 0) return f.qualityId;
          }
          return null != (n = null == (r = h[h.length - 1]) ? void 0 : r.qualityId) ? n : 3;
        }, o.allocateAttributes = function (t, e) {
          for (var i = S.map(function (t) {
              var i;
              return Math.max(0, null != (i = e[t]) ? i : 0);
            }), n = i.reduce(function (t, e) {
              return t + e;
            }, 0) > 0 ? i : S.map(function () {
              return 1;
            }), r = n.reduce(function (t, e) {
              return t + e;
            }, 0), l = n.map(function (e) {
              return t * e / r;
            }), a = l.map(Math.floor), o = t - a.reduce(function (t, e) {
              return t + e;
            }, 0), u = l.map(function (t, e) {
              return {
                index: e,
                fraction: t - Math.floor(t)
              };
            }).sort(function (t, e) {
              return e.fraction - t.fraction;
            }), s = 0; s < o; s += 1) a[u[s % u.length].index] += 1;
          return {
            scoring: a[0],
            rebound: a[1],
            assist: a[2],
            steal: a[3],
            block: a[4]
          };
        }, o.showRecruitmentResult = function () {
          var t = a( /*#__PURE__*/_regeneratorRuntime().mark(function _callee26(t, e, i, n) {
            var r, a, o, u, d, c, h, p, g, m, f, v, y, B, C, w, A, I, P, L, N;
            return _regeneratorRuntime().wrap(function _callee26$(_context27) {
              while (1) switch (_context27.prev = _context27.next) {
                case 0:
                  void 0 === n && (n = !0);
                  r = R(t.qualityId);
                  _context27.next = 4;
                  return Promise.all([Q(t), k("images/UI/球员/招募背景/招募背景0" + r + "/spriteFrame"), k("images/UI/球员/麦穗/麦穗0" + r + "/spriteFrame"), k("images/UI/球员/头像框-方/头像框" + r + "-方/spriteFrame"), k("images/UI/球员/名牌/名牌0" + r + "/spriteFrame"), k("images/UI/球员/品质标签/品质标签0" + r + "/spriteFrame")]);
                case 4:
                  a = _context27.sent;
                  o = a[0];
                  u = a[1];
                  d = a[2];
                  c = a[3];
                  h = a[4];
                  p = a[5];
                  this.candidatePortrait.spriteFrame = o, u && this.recruitBackground && (this.recruitBackground.spriteFrame = u), d && this.wheatSprites.forEach(function (t) {
                    t.spriteFrame = d;
                  }), c && this.candidateFrame && (this.candidateFrame.spriteFrame = c), h && this.candidateNameplate && (this.candidateNameplate.spriteFrame = h), p && this.candidateQualityBadge && (this.candidateQualityBadge.spriteFrame = p), this.candidateNameLabel.string = t.displayName, this.candidateQualityLabel.string = t.qualityName, this.candidatePositionLabel.string = t.position, K(this.candidateOverallLabel, t.overall, function (t) {
                    return b(Math.floor(t));
                  }, {
                    animateGrowth: !n,
                    duration: .55
                  });
                  for (m = l(S); !(g = m()).done;) {
                    v = g.value;
                    K(null != (f = this.candidateAttributeLabels.get(v)) ? f : null, t.attributes[v], function (t) {
                      return b(Math.floor(t));
                    }, {
                      animateGrowth: !n,
                      duration: .55
                    });
                  }
                  this.willpowerTextLabel && (this.willpowerTextLabel.string = "招募获得      斗志"), K(this.willpowerValueLabel, i, function (t) {
                    return String(Math.floor(t));
                  }, {
                    animateGrowth: n,
                    from: n ? 0 : void 0
                  });
                  y = this.resultPage.parent;
                  y && this.resultPage.setSiblingIndex(y.children.length - 1);
                  B = "replace" === e.mode && null !== e.targetIndex ? this.roster[e.targetIndex] : null;
                  if (!(this.replacementPanel.active = Boolean(B), B)) {
                    _context27.next = 28;
                    break;
                  }
                  this.replacedNameLabel && (this.replacedNameLabel.string = B.displayName), this.overallIncreaseLabel && (this.overallIncreaseLabel.string = "总评提升");
                  C = this.roster.map(function (i, n) {
                    return n === e.targetIndex ? t : i;
                  }), w = D(this.roster, this.managementEffects.headCoachBattleOvrBonus), A = D(C, this.managementEffects.headCoachBattleOvrBonus) - w;
                  if (this.overallIncreaseValueLabel) {
                    P = A < 0 ? "-" : "+";
                    K(this.overallIncreaseValueLabel, Math.abs(A), function (t) {
                      return "" + P + b(Math.floor(t));
                    }, {
                      animateGrowth: n,
                      from: n ? 0 : void 0
                    }), this.overallIncreaseValueLabel.color = A < 0 ? it : null != (I = this.overallIncreaseValueDefaultColor) ? I : s.WHITE;
                  }
                  _context27.t0 = this.replacedSlot;
                  _context27.t1 = B.overall;
                  _context27.t2 = B.qualityId;
                  _context27.next = 26;
                  return Q(B);
                case 26:
                  _context27.t3 = _context27.sent;
                  _context27.t0.setup.call(_context27.t0, _context27.t1, _context27.t2, _context27.t3);
                case 28:
                  L = "empty-slot" !== e.mode, N = "dismiss-only" !== e.mode;
                  this.dismissButton.interactable = !1;
                  this.replaceButton.interactable = !1;
                  this.upgradeAdButton && (this.upgradeAdButton.interactable = !1);
                  this.replaceButtonLabel.string = "empty-slot" === e.mode ? "上阵" : "替换上阵";
                  this.refreshUpgradeAdButton(t, !0);
                  _context27.t4 = n;
                  if (!_context27.t4) {
                    _context27.next = 38;
                    break;
                  }
                  _context27.next = 38;
                  return _(this.resultPage);
                case 38:
                  this.dismissButton.interactable = L;
                  this.replaceButton.interactable = N;
                  this.refreshUpgradeAdButton(t);
                case 41:
                case "end":
                  return _context27.stop();
              }
            }, _callee26, this);
          }));
          return function (e, i, n, r) {
            return t.apply(this, arguments);
          };
        }(), o.showRecruitingButtonVisual = function () {
          this.recruitButton && this.recruitButtonTargetSprite && this.recruitingButtonSprite && (this.recruitButton.transition = d.Transition.NONE, this.recruitButtonTargetSprite.spriteFrame = this.recruitingButtonSprite);
        }, o.restoreRecruitButtonVisual = function () {
          this.recruitButton && this.recruitButtonTargetSprite && (this.recruitButtonNormalSprite && (this.recruitButtonTargetSprite.spriteFrame = this.recruitButtonNormalSprite), this.recruitButton.transition = this.recruitButtonTransition);
        }, o.waitForSeconds = function (t) {
          var e = this;
          return new Promise(function (i) {
            e.scheduleOnce(i, t);
          });
        }, o.closeResultPage = function () {
          var t = this;
          if (this.resultPage.active = !1, this.upgradeAdButton && (this.upgradeAdButton.interactable = !1), this.pendingCard = null, this.pendingDecision = null, this.pendingWillpowerAdded = 0, this.upgradeAdProcessing = !1, this.pendingUpgradeAdUsed = !1, this.adTripleRecruitmentActive) return this.queuedAdRecruitments.length > 0 ? void this.scheduleOnce(function () {
            t.showNextAdRecruitmentResult()["catch"](function (e) {
              console.error("[RecruitmentController] Failed to show queued recruitment result.", e), t.finishAdTripleRecruitment();
            });
          }) : void this.finishAdTripleRecruitment();
          this.refreshBudgetView();
        }, o.finishAdTripleRecruitment = function () {
          this.queuedAdRecruitments = [], this.adTripleRecruitmentActive = !1, this.processing = !1, this.restoreRecruitButtonVisual(), this.refreshBudgetView();
        }, o.refreshRosterSlots = function () {
          var t = a( /*#__PURE__*/_regeneratorRuntime().mark(function _callee28() {
            var t;
            return _regeneratorRuntime().wrap(function _callee28$(_context29) {
              while (1) switch (_context29.prev = _context29.next) {
                case 0:
                  t = this;
                  _context29.next = 3;
                  return Promise.all(this.rosterSlots.map(a( /*#__PURE__*/_regeneratorRuntime().mark(function _callee27(e, i) {
                    var n, r;
                    return _regeneratorRuntime().wrap(function _callee27$(_context28) {
                      while (1) switch (_context28.prev = _context28.next) {
                        case 0:
                          r = null != (n = t.roster[i]) ? n : null;
                          if (!r) {
                            _context28.next = 11;
                            break;
                          }
                          _context28.t0 = e;
                          _context28.t1 = r.overall;
                          _context28.t2 = r.qualityId;
                          _context28.next = 7;
                          return Q(r);
                        case 7:
                          _context28.t3 = _context28.sent;
                          _context28.t0.setup.call(_context28.t0, _context28.t1, _context28.t2, _context28.t3);
                          _context28.next = 12;
                          break;
                        case 11:
                          e.clear();
                        case 12:
                        case "end":
                          return _context28.stop();
                      }
                    }, _callee27);
                  }))));
                case 3:
                case "end":
                  return _context29.stop();
              }
            }, _callee28, this);
          }));
          return function () {
            return t.apply(this, arguments);
          };
        }(), o.applyCardToSlot = function (t, e, i) {
          void 0 === i && (i = !1), t.setup(e.overall, e.qualityId), Q(e).then(function (e) {
            t.setPortrait(e), i && t.playNewPlayerHighlight();
          });
        }, o.refreshCourtSimulation = function () {
          var t, e;
          null == (t = this.courtSimulationController) || t.refreshRosterBindings(), null == (e = this.courtSimulationController) || e.restartSimulation();
        }, o.refreshBudgetView = function () {
          var t,
            e,
            i,
            n = null != (t = null == (e = this.economyConfig) ? void 0 : e.recruit.budgetCost) ? t : Number.POSITIVE_INFINITY,
            r = !this.economyConfig || this.budget >= n;
          (K(this.budgetLabel, Math.floor(this.budget), r ? function (t) {
            return b(Math.floor(t)).replace(/\.00(?=[KMBTQ]$)/, "");
          } : function () {
            return "3连抽";
          }), this.recruitButton) && (this.recruitButton.interactable = this.processing || this.ready && !(null != (i = this.resultPage) && i.active));
        }, o.lateUpdate = function () {
          this.syncRecruitButtonGlow();
        }, o.onDestroy = function () {
          var t, e;
          null != (t = this.recruitButtonTargetSprite) && t.isValid && this.recruitButtonTargetSprite.customMaterial === this.recruitButtonGlowMaterial && (this.recruitButtonTargetSprite.customMaterial = this.recruitButtonOriginalMaterial), null == (e = this.recruitButtonGlowMaterial) || e.destroy(), this.recruitButtonGlowMaterial = null;
        }, o.installRecruitButtonGlow = function (t) {
          var e = this.recruitButtonTargetSprite,
            i = null == e ? void 0 : e.node.getComponent(p);
          if (e && i) {
            var n = new g();
            n.initialize({
              effectAsset: t,
              defines: {
                IS_GRAY: !1,
                USE_TEXTURE: !0
              }
            }), n.setProperty("spriteRect", new m(i.width, i.height, i.anchorPoint.x, i.anchorPoint.y)), n.setProperty("shineColor", new s(255, 255, 245, 255)), n.setProperty("sweepParams", new m(.22, 2.1, .32, 1.1)), n.setProperty("pulseParams", new m(.14, 1.2, 0, 0)), this.recruitButtonGlowMaterial = n, this.syncRecruitButtonGlow();
          }
        }, o.syncRecruitButtonGlow = function () {
          var t = this.recruitButtonTargetSprite,
            e = this.recruitButtonGlowMaterial;
          if (t && e) {
            var i = t.grayscale ? this.recruitButtonOriginalMaterial : e;
            t.customMaterial !== i && (t.customMaterial = i);
          }
        }, o.loadRecruitButtonGlowEffect = function () {
          return new Promise(function (t) {
            f.load("effects/recruit-button-glow", v, function (e, i) {
              if (e || !i) return console.warn("[RecruitmentController] Recruit button glow is unavailable.", e), void t(null);
              t(i);
            });
          });
        }, o.loadJson = function (t) {
          return new Promise(function (e, i) {
            f.load(t, y, function (n, r) {
              !n && r ? e(r.json) : i(null != n ? n : new Error("Missing JSON asset: " + t));
            });
          });
        }, o.findByPath = function (t, e) {
          for (var i, n = t, r = l(e.split("/")); !(i = r()).done;) {
            var a,
              o,
              u = i.value;
            if (!(n = null != (a = null == (o = n) ? void 0 : o.getChildByName(u)) ? a : null)) return null;
          }
          return n;
        }, o.getRosterSnapshot = function () {
          return V(this.roster);
        }, o.onBudgetChanged = function (t) {
          this.budget = t, this.refreshBudgetView();
        }, o.rollOverall = function (t, e, i) {
          var n = Math.ceil(Math.min(t, e)),
            r = Math.floor(Math.max(t, e)),
            l = Math.min(1, Math.random() + Math.max(0, i));
          return Math.min(r, n + Math.floor(l * (r - n + 1)));
        }, e;
      }(B)).prototype, "wechatRewardedAdUnitId", [J], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return "";
        }
      }), Z = e(X.prototype, "tapRewardedAdUnitId", [Y], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return "";
        }
      }), j = X)) || j));
      o._RF.pop();
    }
  };
});
System.register("chunks:///_virtual/RecruitmentProbabilityController.ts", ["./rollupPluginModLoBabelHelpers.js", "cc", "./GameState.ts", "./FullScreenEntrance.ts", "./ManagementController.ts", "./PlayerAssets.ts", "./RosterSlotView.ts", "./TeamLevelController.ts"], function (e) {
  var n, t, r, l, i, a, o, u, s, c, h, f, g, d, m, p, v, y, b, C, L, P, B, E;
  return {
    setters: [function (e) {
      n = e.inheritsLoose, t = e.createForOfIteratorHelperLoose, r = e.asyncToGenerator;
    }, function (e) {
      l = e.cclegacy, i = e._decorator, a = e.Button, o = e.Sprite, u = e.Label, s = e.Color, c = e.Component;
    }, function (e) {
      h = e.gameStateEvents, f = e.GAME_STATE_EVENT_MANAGEMENT_CHANGED, g = e.loadJson, d = e.getManagementEffects, m = e.loadManagementLevels;
    }, function (e) {
      p = e.playFullScreenEntrance, v = e.stopFullScreenEntrance;
    }, function (e) {
      y = e.ManagementController;
    }, function (e) {
      b = e.loadThinQualityFrame;
    }, function (e) {
      C = e.getQualityFrameIndex;
    }, function (e) {
      L = e.teamProgressionEvents, P = e.TEAM_PROGRESSION_EVENT_MARKET_VALUE_CHANGED, B = e.TeamLevelController, E = e.getStoredMarketValueLevel;
    }],
    execute: function execute() {
      var M;
      l._RF.push({}, "948a1sYy2hEjKuNsJHSJ/w1", "RecruitmentProbabilityController", void 0);
      var N = i.ccclass;
      e("RecruitmentProbabilityController", N("RecruitmentProbabilityController")(M = function (e) {
        function l() {
          for (var n, t = arguments.length, r = new Array(t), l = 0; l < t; l++) r[l] = arguments[l];
          return (n = e.call.apply(e, [this].concat(r)) || this).page = null, n.closeButton = null, n.upgradeButton = null, n.rows = [], n.configPromise = null, n.renderVersion = 0, n.openPage = function () {
            if (n.resolveHierarchy(), n.page) {
              n.bringToFront(n.page);
              var e = ++n.renderVersion;
              n.refreshPage(e), p(n.page, {
                backgroundNodes: n.namedChildren(n.page, ["遮罩", "bg"]),
                moduleGroups: [{
                  nodes: n.namedChildren(n.page, ["球队信息", "关闭"]),
                  order: 0
                }].concat(n.rows.map(function (e, n) {
                  return {
                    nodes: [e.root],
                    order: n + 1
                  };
                }), [{
                  nodes: n.namedChildren(n.page, ["球探加成"]),
                  order: 6
                }, {
                  nodes: n.namedChildren(n.page, ["立刻升级球探"]),
                  order: 7
                }])
              });
            }
          }, n.closePage = function () {
            n.renderVersion += 1, n.page && (v(n.page), n.page.active = !1);
          }, n.openScoutingManagement = function () {
            var e;
            n.closePage(), null == (e = y.instance) || e.openManagement("scoutingDirector");
          }, n.refreshIfVisible = function () {
            var e;
            null != (e = n.page) && e.active && n.refreshPage(++n.renderVersion);
          }, n;
        }
        n(l, e);
        var i = l.prototype;
        return i.onLoad = function () {
          this.resolveHierarchy(), this.page ? this.page.active = !1 : console.error("[RecruitmentProbabilityController] 招募概率弹窗不存在。");
        }, i.onEnable = function () {
          var e, n;
          this.resolveHierarchy(), null == (e = this.closeButton) || e.node.on(a.EventType.CLICK, this.closePage, this), null == (n = this.upgradeButton) || n.node.on(a.EventType.CLICK, this.openScoutingManagement, this), h.on(f, this.refreshIfVisible, this), L.on(P, this.refreshIfVisible, this);
        }, i.onDisable = function () {
          var e, n;
          null == (e = this.closeButton) || e.node.off(a.EventType.CLICK, this.closePage, this), null == (n = this.upgradeButton) || n.node.off(a.EventType.CLICK, this.openScoutingManagement, this), h.off(f, this.refreshIfVisible, this), L.off(P, this.refreshIfVisible, this);
        }, i.refreshPage = function () {
          var e = r( /*#__PURE__*/_regeneratorRuntime().mark(function _callee30(e) {
            var n, t, l, i, a, o, u, s, c, h, f, g, p, v, y, C, L, P;
            return _regeneratorRuntime().wrap(function _callee30$(_context31) {
              while (1) switch (_context31.prev = _context31.next) {
                case 0:
                  n = this;
                  _context31.prev = 1;
                  _context31.next = 4;
                  return Promise.all([this.loadConfig(), d()]);
                case 4:
                  o = _context31.sent;
                  u = o[0];
                  s = o[1];
                  if (!(e !== this.renderVersion || null == (t = this.page) || !t.active)) {
                    _context31.next = 9;
                    break;
                  }
                  return _context31.abrupt("return");
                case 9:
                  c = null != (l = null == (i = B.instance) || null == (i = i.getSnapshot()) ? void 0 : i.marketValueLevel) ? l : E(), h = null != (a = u.marketValueLevels.find(function (e) {
                    return e.level === c;
                  })) ? a : u.marketValueLevels[Math.max(0, Math.min(u.marketValueLevels.length - 1, c - 1))];
                  if (h) {
                    _context31.next = 12;
                    break;
                  }
                  throw new Error("缺少球队市值等级 " + c + " 的招募配置。");
                case 12:
                  f = this.buildDisplayQualities(u, h, s.scoutingDirectorHighestQualityWeightBonus), g = this.toPercentBasisPoints(f.map(function (e) {
                    return e.finalWeight;
                  })), p = m().scoutingDirector, v = f.reduce(function (e, n) {
                    return e + n.baseWeight;
                  }, 0), y = f.reduce(function (e, n) {
                    return e + n.finalWeight;
                  }, 0), C = f[f.length - 1], L = C && v > 0 ? C.baseWeight / v * 100 : 0, P = C && y > 0 ? C.finalWeight / y * 100 : 0;
                  this.setLabel("球探加成/球探等级", "球探 Lv." + p);
                  this.setLabel("球探加成/概率加成", "最高品质概率 +" + Math.max(0, P - L).toFixed(2) + "%");
                  _context31.next = 17;
                  return Promise.all(this.rows.map(r( /*#__PURE__*/_regeneratorRuntime().mark(function _callee29(t, r) {
                    var l, i, a, o, u;
                    return _regeneratorRuntime().wrap(function _callee29$(_context30) {
                      while (1) switch (_context30.prev = _context30.next) {
                        case 0:
                          i = f[r];
                          if (!(t.root.active = Boolean(i), i)) {
                            _context30.next = 8;
                            break;
                          }
                          o = n.getQualityColor(i.qualityId);
                          if (t.qualityLabel && (t.qualityLabel.string = i.qualityName, t.qualityLabel.color = o), t.probabilityLabel) t.probabilityLabel.string = ((null != (a = g[r]) ? a : 0) / 100).toFixed(2) + "%", t.probabilityLabel.color = o;
                          _context30.next = 6;
                          return b(i.qualityId);
                        case 6:
                          u = _context30.sent;
                          e === n.renderVersion && null != (l = n.page) && l.active && u && t.frame && (t.frame.spriteFrame = u);
                        case 8:
                        case "end":
                          return _context30.stop();
                      }
                    }, _callee29);
                  }))));
                case 17:
                  _context31.next = 22;
                  break;
                case 19:
                  _context31.prev = 19;
                  _context31.t0 = _context31["catch"](1);
                  console.error("[RecruitmentProbabilityController] 刷新招募概率失败。", _context31.t0);
                case 22:
                case "end":
                  return _context31.stop();
              }
            }, _callee30, this, [[1, 19]]);
          }));
          return function (n) {
            return e.apply(this, arguments);
          };
        }(), i.buildDisplayQualities = function (e, n, t) {
          var r,
            l,
            i,
            a,
            o = null != (r = n.recruitableQualityIds) && r.length ? new Set(n.recruitableQualityIds) : null,
            u = e.qualities.flatMap(function (e, t) {
              var r = Math.max(0, Number(n.baseWeights[t]) || 0);
              return r <= 0 || o && !o.has(e.qualityId) ? [] : [{
                qualityId: e.qualityId,
                qualityName: e.qualityName,
                baseWeight: r,
                finalWeight: r
              }];
            }),
            s = null != (l = n.highestUnlockedQualityId) ? l : null == (i = u[u.length - 1]) ? void 0 : i.qualityId,
            c = null != (a = u.find(function (e) {
              return e.qualityId === s;
            })) ? a : u[u.length - 1];
          return c && (c.finalWeight += Math.max(0, Number(t) || 0)), u.slice(0, 5);
        }, i.toPercentBasisPoints = function (e) {
          var n = e.reduce(function (e, n) {
            return e + Math.max(0, n);
          }, 0);
          if (n <= 0) return e.map(function () {
            return 0;
          });
          for (var t = e.map(function (e) {
              return Math.max(0, e) / n * 1e4;
            }), r = t.map(Math.floor), l = 1e4 - r.reduce(function (e, n) {
              return e + n;
            }, 0), i = t.map(function (e, n) {
              return {
                index: n,
                fraction: e - Math.floor(e)
              };
            }).sort(function (e, n) {
              return n.fraction - e.fraction || e.index - n.index;
            }), a = 0; a < l; a += 1) r[i[a % i.length].index] += 1;
          return r;
        }, i.loadConfig = function () {
          return null != this.configPromise || (this.configPromise = g("data/balance/recruitment_probability")), this.configPromise;
        }, i.resolveHierarchy = function () {
          var e,
            n,
            t,
            r,
            l,
            i,
            s,
            c,
            h,
            f = this.node.parent;
          this.page = null != (e = null != (n = null == f ? void 0 : f.getChildByName("招募概率弹窗")) ? n : null == f ? void 0 : f.getChildByName("招募概率")) ? e : null, this.closeButton = null != (t = null == (r = this.page) || null == (r = r.getChildByName("关闭")) ? void 0 : r.getComponent(a)) ? t : null;
          var g = null != (l = null == (i = this.page) ? void 0 : i.getChildByName("立刻升级球探")) ? l : null;
          this.upgradeButton = g ? null != (s = g.getComponent(a)) ? s : g.addComponent(a) : null;
          var d = null != (c = null == (h = this.page) ? void 0 : h.getChildByName("五档品质概率")) ? c : null;
          this.rows = Array.from({
            length: 5
          }, function (e, n) {
            var t,
              r,
              l,
              i,
              a,
              s,
              c,
              h = null != (t = null == d ? void 0 : d.getChildByName("品质" + (n + 1))) ? t : null;
            return h ? {
              root: h,
              frame: null != (r = null == (l = h.getChildByName("细边框01")) ? void 0 : l.getComponent(o)) ? r : null,
              qualityLabel: null != (i = null == (a = h.getChildByName("品质")) ? void 0 : a.getComponent(u)) ? i : null,
              probabilityLabel: null != (s = null == (c = h.getChildByName("概率")) ? void 0 : c.getComponent(u)) ? s : null
            } : null;
          }).filter(function (e) {
            return Boolean(e);
          });
        }, i.getQualityColor = function (e) {
          switch (C(e)) {
            case 1:
              return new s(42, 226, 76, 255);
            case 2:
              return new s(40, 139, 255, 255);
            case 3:
              return new s(180, 52, 255, 255);
            case 4:
              return new s(255, 121, 32, 255);
            case 5:
              return new s(255, 42, 58, 255);
            case 6:
              return new s(255, 67, 159, 255);
            case 7:
              return new s(255, 207, 36, 255);
            case 8:
              return new s(255, 215, 64, 255);
            default:
              return new s(210, 245, 235, 255);
          }
        }, i.setLabel = function (e, n) {
          var t,
            r = null == (t = this.findByPath(this.page, e)) ? void 0 : t.getComponent(u);
          r && (r.string = n);
        }, i.bringToFront = function (e) {
          e.parent && e.setSiblingIndex(e.parent.children.length - 1), e.active = !0;
        }, i.namedChildren = function (e, n) {
          return n.flatMap(function (n) {
            var t = e.getChildByName(n);
            return t ? [t] : [];
          });
        }, i.findByPath = function (e, n) {
          for (var r, l = e, i = t(n.split("/")); !(r = i()).done;) {
            var a,
              o,
              u = r.value;
            if (!(l = null != (a = null == (o = l) ? void 0 : o.getChildByName(u)) ? a : null)) return null;
          }
          return l;
        }, l;
      }(c)) || M);
      l._RF.pop();
    }
  };
});
System.register("chunks:///_virtual/RecruitmentRules.ts", ["cc"], function (e) {
  var t;
  return {
    setters: [function (e) {
      t = e.cclegacy;
    }],
    execute: function execute() {
      e("evaluateRecruitmentResult", function (e) {
        var t = e.findIndex(function (e) {
          return null === e;
        });
        if (t >= 0) return {
          mode: "empty-slot",
          targetIndex: t
        };
        for (var n = -1, r = Number.POSITIVE_INFINITY, u = 0; u < e.length; u += 1) {
          var c = e[u];
          null !== c && c < r && (r = c, n = u);
        }
        if (n >= 0) return {
          mode: "replace",
          targetIndex: n
        };
        return {
          mode: "dismiss-only",
          targetIndex: null
        };
      }), t._RF.push({}, "521c56ZzN9J6aOCNRf0pr52", "RecruitmentRules", void 0), t._RF.pop();
    }
  };
});
System.register("chunks:///_virtual/RewardedAdService.ts", ["./rollupPluginModLoBabelHelpers.js", "cc"], function (e) {
  var r, o;
  return {
    setters: [function (e) {
      r = e.asyncToGenerator;
    }, function (e) {
      o = e.cclegacy;
    }],
    execute: function execute() {
      e({
        configureRewardedAdUnitIds: function configureRewardedAdUnitIds(e) {
          t.wechat = e.wechat.trim(), t.tapTap = e.tapTap.trim();
        },
        showRewardedVideo: function showRewardedVideo(e) {
          return d.apply(this, arguments);
        }
      }), o._RF.push({}, "7be17VhhtdCzqhHHSILxWhy", "RewardedAdService", void 0);
      var t = {
        wechat: "",
        tapTap: ""
      };
      function d() {
        return (d = r( /*#__PURE__*/_regeneratorRuntime().mark(function _callee32(e) {
          var o, d, n, a, i, c;
          return _regeneratorRuntime().wrap(function _callee32$(_context33) {
            while (1) switch (_context33.prev = _context33.next) {
              case 0:
                void 0 === e && (e = t);
                a = globalThis, i = null != (o = a.tap) && o.createRewardedVideoAd ? a.tap : null != (d = a.wx) && d.createRewardedVideoAd ? a.wx : null, c = i === a.tap ? e.tapTap.trim() : e.wechat.trim();
                if (!(!i || !c)) {
                  _context33.next = 4;
                  break;
                }
                return _context33.abrupt("return", (console.error("[RewardedAdService] Missing rewarded-video platform or ad unit ID."), !1));
              case 4:
                _context33.prev = 4;
                n = i.createRewardedVideoAd({
                  adUnitId: c
                });
                _context33.next = 11;
                break;
              case 8:
                _context33.prev = 8;
                _context33.t0 = _context33["catch"](4);
                return _context33.abrupt("return", (console.error("[RewardedAdService] Failed to create rewarded video.", _context33.t0), !1));
              case 11:
                return _context33.abrupt("return", new Promise(function (e) {
                  var o = !1,
                    t = function t(r) {
                      o || (o = !0, null == n.offClose || n.offClose(d), null == n.offError || n.offError(a), null == n.destroy || n.destroy(), e(r));
                    },
                    d = function d(e) {
                      t(!0 === (null == e ? void 0 : e.isEnded));
                    },
                    a = function a() {
                      t(!1);
                    };
                  n.onClose(d), null == n.onError || n.onError(a), Promise.resolve().then(function () {
                    return n.show();
                  })["catch"](r( /*#__PURE__*/_regeneratorRuntime().mark(function _callee31() {
                    return _regeneratorRuntime().wrap(function _callee31$(_context32) {
                      while (1) switch (_context32.prev = _context32.next) {
                        case 0:
                          _context32.prev = 0;
                          _context32.next = 3;
                          return null == n.load ? void 0 : n.load();
                        case 3:
                          _context32.next = 5;
                          return n.show();
                        case 5:
                          _context32.next = 10;
                          break;
                        case 7:
                          _context32.prev = 7;
                          _context32.t0 = _context32["catch"](0);
                          console.error("[RewardedAdService] Failed to show rewarded video.", _context32.t0), t(!1);
                        case 10:
                        case "end":
                          return _context32.stop();
                      }
                    }, _callee31, null, [[0, 7]]);
                  })));
                }));
              case 12:
              case "end":
                return _context33.stop();
            }
          }, _callee32, null, [[4, 8]]);
        }))).apply(this, arguments);
      }
      o._RF.pop();
    }
  };
});
System.register("chunks:///_virtual/RosterSlotView.ts", ["./rollupPluginModLoBabelHelpers.js", "cc", "./NumberGrowthAnimator.ts"], function (e) {
  var t, r, i, l, n, o, a, s, u, h, c, f, m, d, v, y, p, g, w, b;
  return {
    setters: [function (e) {
      t = e.applyDecoratedDescriptor, r = e.inheritsLoose, i = e.initializerDefineProperty, l = e.assertThisInitialized, n = e.createForOfIteratorHelperLoose;
    }, function (e) {
      o = e.cclegacy, a = e._decorator, s = e.Sprite, u = e.Label, h = e.Button, c = e.resources, f = e.SpriteFrame, m = e.EffectAsset, d = e.UITransform, v = e.Material, y = e.Vec4, p = e.Color, g = e.Component;
    }, function (e) {
      w = e.setGrowingNumber, b = e.forgetGrowingNumber;
    }],
    execute: function execute() {
      var P, F, q, M, R, V, C, N, B, G, O;
      e({
        formatPlayerOverall: z,
        getQualityFrameIndex: I,
        parsePlayerOverall: T
      }), o._RF.push({}, "ebbccrCq6dGYarF+ncSCuhy", "RosterSlotView", void 0);
      var x = a.ccclass,
        L = a.property,
        S = [{
          divisor: 1e3,
          suffix: "K"
        }, {
          divisor: 1e6,
          suffix: "M"
        }, {
          divisor: 1e9,
          suffix: "B"
        }, {
          divisor: 1e12,
          suffix: "T"
        }, {
          divisor: 1e15,
          suffix: "Q"
        }],
        H = {
          K: 1e3,
          M: 1e6,
          B: 1e9,
          T: 1e12,
          Q: 1e15
        },
        Q = {
          16: 0,
          3: 1,
          4: 1,
          5: 2,
          6: 2,
          7: 3,
          8: 3,
          9: 4,
          10: 4,
          11: 5,
          12: 5,
          13: 6,
          14: 7,
          15: 8
        };
      function z(e) {
        var t = Math.max(0, Math.round(Number.isFinite(e) ? e : 0));
        if (t < 1e4) return String(t);
        for (var r = 0; r + 1 < S.length && t >= S[r + 1].divisor;) r += 1;
        var i = S[r],
          l = t / i.divisor;
        return r + 1 < S.length && Number(l.toFixed(2)) >= 1e3 && (l = t / (i = S[r + 1]).divisor), "" + l.toFixed(2) + i.suffix;
      }
      function I(e) {
        var t,
          r = Math.floor(Number.isFinite(e) ? e : 0);
        return null != (t = Q[r]) ? t : 0;
      }
      function T(e) {
        var t = e.trim().toUpperCase().match(/^(\d+(?:\.\d+)?)\s*([KMBTQ]?)$/);
        if (!t) return 0;
        var r = Number(t[1]),
          i = t[2] ? H[t[2]] : 1;
        return Math.max(0, Math.round(r * i));
      }
      e("RosterSlotView", (P = x("RosterSlotView"), F = L(s), q = L(u), M = L(s), R = L(h), P((N = t((C = function (e) {
        function t() {
          for (var t, r = arguments.length, n = new Array(r), o = 0; o < r; o++) n[o] = arguments[o];
          return t = e.call.apply(e, [this].concat(n)) || this, i(t, "portrait", N, l(t)), i(t, "ovrLabel", B, l(t)), i(t, "qualityFrame", G, l(t)), i(t, "selectButton", O, l(t)), t.qualityFrameRequestVersion = 0, t.newPlayerGlowRequestVersion = 0, t.newPlayerGlowBindings = [], t.currentOverall = 0, t;
        }
        r(t, e);
        var o = t.prototype;
        return o.onLoad = function () {
          var e,
            t,
            r,
            i,
            l,
            n,
            o,
            a = null != (e = this.node.getChildByName("头像")) ? e : this.node.getChildByName("Portrait"),
            c = null != (t = this.node.getChildByName("ovr")) ? t : this.node.getChildByName("OVR"),
            f = null != (r = this.node.getChildByName("边框")) ? r : this.node.getChildByName("QualityFrame");
          null != this.portrait || (this.portrait = null != (i = null == a ? void 0 : a.getComponent(s)) ? i : null), null != this.ovrLabel || (this.ovrLabel = null != (l = null == c ? void 0 : c.getComponent(u)) ? l : null), null != this.qualityFrame || (this.qualityFrame = null != (n = null == f ? void 0 : f.getComponent(s)) ? n : this.node.getComponent(s)), null != this.selectButton || (this.selectButton = null != (o = null == f ? void 0 : f.getComponent(h)) ? o : this.node.getComponent(h)), this.currentOverall = this.ovrLabel ? T(this.ovrLabel.string) : 0, this.qualityFrame || console.error("[RosterSlotView] Missing quality frame Sprite.", this.node.name);
        }, o.onDestroy = function () {
          this.qualityFrameRequestVersion += 1, this.newPlayerGlowRequestVersion += 1, this.clearNewPlayerHighlight();
        }, o.setup = function (e, t, r) {
          void 0 === t && (t = 3), this.setOverall(e), this.setQuality(t), void 0 !== r && this.setPortrait(r);
        }, o.setOverall = function (e) {
          var t = this.currentOverall;
          this.currentOverall = Math.max(0, Math.round(Number.isFinite(e) ? e : 0)), w(this.ovrLabel, this.currentOverall, function (e) {
            return z(Math.floor(e));
          }, {
            animateGrowth: t > 0 && this.currentOverall > t,
            from: t
          });
        }, o.getOverall = function () {
          return this.currentOverall;
        }, o.setPortrait = function (e) {
          this.portrait && (this.portrait.spriteFrame = e);
        }, o.setQuality = function (e) {
          var t = this,
            r = "images/UI/球员/头像框-方/头像框" + I(e) + "-方/spriteFrame",
            i = ++this.qualityFrameRequestVersion;
          c.load(r, f, function (e, l) {
            i === t.qualityFrameRequestVersion && t.qualityFrame && (!e && l ? t.qualityFrame.spriteFrame = l : console.error("[RosterSlotView] Failed to load quality frame: " + r, e));
          });
        }, o.playNewPlayerHighlight = function (e) {
          var t = this;
          void 0 === e && (e = 2);
          var r = ++this.newPlayerGlowRequestVersion;
          this.clearNewPlayerHighlight(), c.load("effects/recruit-button-glow", m, function (i, l) {
            if (r === t.newPlayerGlowRequestVersion && t.node.isValid) if (!i && l) {
              for (var o, a = [], u = n(t.node.getComponentsInChildren(s)); !(o = u()).done;) {
                var h = o.value,
                  c = h.node.getComponent(d);
                if (h.spriteFrame && c) {
                  var f = new v();
                  f.initialize({
                    effectAsset: l,
                    defines: {
                      IS_GRAY: !1,
                      USE_TEXTURE: !0
                    }
                  }), f.setProperty("spriteRect", new y(c.width, c.height, c.anchorPoint.x, c.anchorPoint.y)), f.setProperty("shineColor", new p(255, 255, 255, 255)), f.setProperty("sweepParams", new y(.28, .7, .32, 1)), f.setProperty("pulseParams", new y(.3, .5, 0, 0)), a.push({
                    sprite: h,
                    originalMaterial: h.customMaterial,
                    glowMaterial: f
                  }), h.customMaterial = f;
                }
              }
              t.newPlayerGlowBindings = a, t.scheduleOnce(function () {
                r === t.newPlayerGlowRequestVersion && t.clearNewPlayerHighlight();
              }, Math.max(0, e));
            } else console.warn("[RosterSlotView] New player glow is unavailable.", i);
          });
        }, o.clear = function () {
          this.qualityFrameRequestVersion += 1, this.newPlayerGlowRequestVersion += 1, this.clearNewPlayerHighlight(), this.currentOverall = 0, this.ovrLabel && (b(this.ovrLabel), this.ovrLabel.string = ""), this.setPortrait(null), this.setQuality(0);
        }, o.clearNewPlayerHighlight = function () {
          for (var e, t = n(this.newPlayerGlowBindings); !(e = t()).done;) {
            var r = e.value;
            r.sprite.isValid && r.sprite.customMaterial === r.glowMaterial && (r.sprite.customMaterial = r.originalMaterial), r.glowMaterial.destroy();
          }
          this.newPlayerGlowBindings = [];
        }, t;
      }(g)).prototype, "portrait", [F], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return null;
        }
      }), B = t(C.prototype, "ovrLabel", [q], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return null;
        }
      }), G = t(C.prototype, "qualityFrame", [M], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return null;
        }
      }), O = t(C.prototype, "selectButton", [R], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return null;
        }
      }), V = C)) || V));
      o._RF.pop();
    }
  };
});
System.register("chunks:///_virtual/TeamLevelController.ts", ["./rollupPluginModLoBabelHelpers.js", "cc", "./NumberGrowthAnimator.ts"], function (e) {
  var t, r, a, i, n, l, o, s, u, h, m, p, c, g, v, f, d, L;
  return {
    setters: [function (e) {
      t = e.applyDecoratedDescriptor, r = e.inheritsLoose, a = e.initializerDefineProperty, i = e.assertThisInitialized;
    }, function (e) {
      n = e.cclegacy, l = e._decorator, o = e.EventTarget, s = e.sys, u = e.Label, h = e.ProgressBar, m = e.Button, p = e.Vec3, c = e.resources, g = e.JsonAsset, v = e.Tween, f = e.tween, d = e.Component;
    }, function (e) {
      L = e.setGrowingNumber;
    }],
    execute: function execute() {
      var w, M, b, C, S, y, B, A, E, V, P, R, k, _, N, T, x, I;
      e({
        getStoredMarketValueLevel: function getStoredMarketValueLevel(e) {
          void 0 === e && (e = 1);
          var t = s.localStorage.getItem(q);
          if (!t) return Math.max(1, Math.floor(e));
          try {
            var r = JSON.parse(t),
              a = Number(r.marketValueLevel);
            return Number.isFinite(a) ? Math.min(520, Math.max(1, Math.floor(a))) : Math.max(1, Math.floor(e));
          } catch (t) {
            return Math.max(1, Math.floor(e));
          }
        },
        getStoredTeamLevel: function getStoredTeamLevel(e) {
          void 0 === e && (e = 1);
          var t = s.localStorage.getItem(q);
          if (!t) return Math.min(520, Math.max(1, Math.floor(e)));
          try {
            var r = JSON.parse(t),
              a = Number(r.teamLevel);
            return Number.isFinite(a) ? Math.min(520, Math.max(1, Math.floor(a))) : Math.min(520, Math.max(1, Math.floor(e)));
          } catch (t) {
            return Math.min(520, Math.max(1, Math.floor(e)));
          }
        }
      }), n._RF.push({}, "bee7aWyMCJChpM8VgzbYcH0", "TeamLevelController", void 0);
      var O = l.ccclass,
        D = l.property,
        q = e("TEAM_PROGRESSION_STORAGE_KEY", "basketball.team.progression.v1"),
        G = e("TEAM_PROGRESSION_EVENT_WILLPOWER_CHANGED", "team-progression-willpower-changed"),
        U = e("TEAM_PROGRESSION_EVENT_LEVEL_CHANGED", "team-progression-level-changed"),
        z = e("TEAM_PROGRESSION_EVENT_MARKET_VALUE_CHANGED", "team-progression-market-value-changed"),
        F = e("TEAM_PROGRESSION_EVENT_CHAMPIONSHIP_REQUESTED", "team-progression-championship-requested"),
        W = e("teamProgressionEvents", new o());
      e("TeamLevelController", (w = O("TeamLevelController"), M = D(u), b = D(u), C = D(h), S = D(m), y = D(u), B = D({
        displayName: "等级配置资源路径"
      }), A = D({
        min: .05,
        max: 1,
        step: .05,
        displayName: "进度条动画时长"
      }), w(((I = function (e) {
        function t() {
          for (var t, r = arguments.length, n = new Array(r), l = 0; l < r; l++) n[l] = arguments[l];
          return t = e.call.apply(e, [this].concat(n)) || this, a(t, "teamLevelLabel", P, i(t)), a(t, "willpowerLabel", R, i(t)), a(t, "willpowerProgress", k, i(t)), a(t, "upgradeButton", _, i(t)), a(t, "upgradeButtonLabel", N, i(t)), a(t, "progressionResourcePath", T, i(t)), a(t, "progressAnimationDuration", x, i(t)), t.config = null, t.state = t.createDefaultState(), t.buttonBaseScale = new p(1, 1, 1), t.ready = !1, t;
        }
        r(t, e);
        var n = t.prototype;
        return n.onLoad = function () {
          if (t.instance = this, this.resolveSceneReferences(), !this.hasRequiredReferences()) return console.error("[TeamLevelController] Missing team level UI references."), void (this.enabled = !1);
          this.buttonBaseScale.set(this.upgradeButton.node.scale), this.showLoadingState(), this.loadProgressionConfig();
        }, n.onEnable = function () {
          var e;
          null == (e = this.upgradeButton) || e.node.on(m.EventType.CLICK, this.onUpgradeButtonClicked, this);
        }, n.onDisable = function () {
          var e;
          null == (e = this.upgradeButton) || e.node.off(m.EventType.CLICK, this.onUpgradeButtonClicked, this), this.stopButtonPulse();
        }, n.onDestroy = function () {
          t.instance === this && (t.instance = null);
        }, n.addRecruitWillpower = function () {
          var e,
            t,
            r = null != (e = null == (t = this.config) ? void 0 : t._meta.recruitWillpowerReward) ? e : 0;
          return this.addWillpower(r);
        }, n.addWillpower = function (e) {
          if (!this.ready || this.isAtMaximumLevel()) return 0;
          var t = Math.max(0, Math.floor(Number.isFinite(e) ? e : 0));
          return t <= 0 ? 0 : (this.state.willpower = Math.min(Number.MAX_SAFE_INTEGER, this.state.willpower + t), this.saveState(), this.refreshView(!0), W.emit(G, this.getSnapshot()), t);
        }, n.upgradeOneLevel = function () {
          if (!this.ready || !this.canUpgrade()) return !1;
          var e = this.getCurrentRequirement();
          return this.state.willpower -= e, this.state.teamLevel += 1, this.saveState(), this.refreshView(!0), this.playLevelUpAnimation(), W.emit(U, this.getSnapshot()), !0;
        }, n.applyChampionshipWin = function () {
          if (!this.ready || !this.isPendingChampionship()) return !1;
          var e = this.getMaximumMarketValueLevel();
          return !(this.state.marketValueLevel >= e) && (this.state.marketValueLevel += 1, this.saveState(), this.refreshView(!0), W.emit(z, this.getSnapshot()), !0);
        }, n.getSnapshot = function () {
          return this.ready ? {
            teamLevel: this.state.teamLevel,
            marketValueLevel: this.state.marketValueLevel,
            marketLevelCap: this.getCurrentMarketLevelCap(),
            willpower: this.state.willpower,
            currentRequirement: this.getCurrentRequirement(),
            canUpgrade: this.canUpgrade(),
            pendingChampionship: this.isPendingChampionship(),
            maxLevel: this.isAtMaximumLevel()
          } : null;
        }, n.resolveSceneReferences = function () {
          var e,
            t,
            r,
            a,
            i,
            n,
            l = this.node.getChildByName("球队等级数值"),
            o = this.node.getChildByName("斗志数值"),
            s = this.node.getChildByName("进度框"),
            p = this.node.getChildByName("升级");
          null != this.teamLevelLabel || (this.teamLevelLabel = null != (e = null == l ? void 0 : l.getComponent(u)) ? e : null), null != this.willpowerLabel || (this.willpowerLabel = null != (t = null == o ? void 0 : o.getComponent(u)) ? t : null), null != this.willpowerProgress || (this.willpowerProgress = null != (r = null == s ? void 0 : s.getComponent(h)) ? r : null), null != this.upgradeButton || (this.upgradeButton = null != (a = null == p ? void 0 : p.getComponent(m)) ? a : null), null != this.upgradeButtonLabel || (this.upgradeButtonLabel = null != (i = null == p || null == (n = p.getChildByName("Label")) ? void 0 : n.getComponent(u)) ? i : null);
        }, n.hasRequiredReferences = function () {
          return Boolean(this.teamLevelLabel && this.willpowerLabel && this.willpowerProgress && this.upgradeButton && this.upgradeButtonLabel);
        }, n.showLoadingState = function () {
          this.teamLevelLabel.string = "1", this.willpowerLabel.string = "-- / --", this.willpowerProgress.progress = 0, this.upgradeButton.interactable = !1, this.upgradeButtonLabel.string = "升级";
        }, n.loadProgressionConfig = function () {
          var e = this;
          c.load(this.progressionResourcePath, g, function (t, r) {
            if (!t && r) {
              var a = r.json;
              e.isValidConfig(a) ? (e.config = a, e.state = e.loadState(), e.ready = !0, e.saveState(), e.refreshView(!1)) : console.error("[TeamLevelController] Invalid progression config.");
            } else console.error("[TeamLevelController] Failed to load progression config.", t);
          });
        }, n.isValidConfig = function (e) {
          if (null == e || !e._meta || !Array.isArray(e.marketValueLevels)) return !1;
          var t = e._meta.marketValueLevelCount;
          return !(t <= 0 || e.marketValueLevels.length !== t) && e.marketValueLevels.every(function (t) {
            return t.marketValueLevel > 0 && t.teamLevelStart > 0 && t.teamLevelCap >= t.teamLevelStart && Array.isArray(t.willpowerRequirements) && t.willpowerRequirements.length === e._meta.teamLevelsPerMarketValue && t.willpowerRequirements.every(function (e) {
              return Number.isFinite(e) && e > 0;
            });
          });
        }, n.loadState = function () {
          var e = this.createDefaultState(),
            t = s.localStorage.getItem(q);
          if (!t) return e;
          try {
            var r = JSON.parse(t),
              a = this.getMaximumTeamLevel(),
              i = this.getMaximumMarketValueLevel(),
              n = this.clampInteger(r.teamLevel, 1, a, e.teamLevel),
              l = Math.ceil(n / this.config._meta.teamLevelsPerMarketValue),
              o = Math.min(i, Math.floor(n / this.config._meta.teamLevelsPerMarketValue) + 1),
              u = this.clampInteger(r.marketValueLevel, l, o, l),
              h = this.clampInteger(r.willpower, 0, Number.MAX_SAFE_INTEGER, e.willpower);
            return {
              version: 1,
              teamLevel: n,
              marketValueLevel: u,
              willpower: n >= a ? 0 : h
            };
          } catch (t) {
            return console.warn("[TeamLevelController] Invalid save data, using defaults.", t), e;
          }
        }, n.saveState = function () {
          s.localStorage.setItem(q, JSON.stringify(this.state));
        }, n.createDefaultState = function () {
          return {
            version: 1,
            teamLevel: 1,
            marketValueLevel: 1,
            willpower: 0
          };
        }, n.refreshView = function (e) {
          var t = this.isAtMaximumLevel(),
            r = this.getCurrentRequirement(),
            a = t ? 1 : Math.max(0, Math.min(1, this.state.willpower / r));
          L(this.teamLevelLabel, this.state.teamLevel, function (e) {
            return String(Math.floor(e));
          }, {
            animateGrowth: e
          }), L(this.willpowerLabel, this.state.willpower, function (e) {
            return t ? "MAX" : Math.floor(e) + " / " + r;
          }, {
            animateGrowth: e,
            duration: this.progressAnimationDuration
          }), v.stopAllByTarget(this.willpowerProgress), e ? f(this.willpowerProgress).to(this.progressAnimationDuration, {
            progress: a
          }).start() : this.willpowerProgress.progress = a;
          var i = this.isPendingChampionship(),
            n = this.canUpgrade();
          this.upgradeButton.interactable = n || i, this.upgradeButtonLabel.string = t ? "已满级" : i ? "去夺冠" : "升级", n || i ? this.startButtonPulse() : this.stopButtonPulse();
        }, n.onUpgradeButtonClicked = function () {
          if (this.isPendingChampionship()) {
            var e = this.getSnapshot();
            return W.emit(F, e), void console.info("[TeamLevelController] Championship requested.", e);
          }
          this.upgradeOneLevel();
        }, n.canUpgrade = function () {
          return !this.isAtMaximumLevel() && !this.isAtCurrentMarketCap() && this.state.willpower >= this.getCurrentRequirement();
        }, n.isPendingChampionship = function () {
          return !this.isAtMaximumLevel() && this.isAtCurrentMarketCap() && this.state.willpower >= this.getCurrentRequirement();
        }, n.isAtCurrentMarketCap = function () {
          return this.state.teamLevel >= this.getCurrentMarketLevelCap();
        }, n.isAtMaximumLevel = function () {
          return this.state.teamLevel >= this.getMaximumTeamLevel();
        }, n.getCurrentMarketLevelCap = function () {
          return this.config.marketValueLevels[this.state.marketValueLevel - 1].teamLevelCap;
        }, n.getCurrentRequirement = function () {
          var e = this.config._meta.teamLevelsPerMarketValue,
            t = Math.min(this.config.marketValueLevels.length - 1, Math.floor((this.state.teamLevel - 1) / e)),
            r = (this.state.teamLevel - 1) % e;
          return this.config.marketValueLevels[t].willpowerRequirements[r];
        }, n.getMaximumTeamLevel = function () {
          var e, t;
          return null != (e = null == (t = this.config) ? void 0 : t._meta.totalTeamLevels) ? e : 520;
        }, n.getMaximumMarketValueLevel = function () {
          var e, t;
          return null != (e = null == (t = this.config) ? void 0 : t._meta.marketValueLevelCount) ? e : 130;
        }, n.playLevelUpAnimation = function () {
          var e = this.teamLevelLabel.node,
            t = e.scale.clone(),
            r = new p(1.2 * t.x, 1.2 * t.y, t.z);
          v.stopAllByTarget(e), f(e).to(.12, {
            scale: r
          }).to(.18, {
            scale: t
          }).start();
        }, n.startButtonPulse = function () {
          var e = this.upgradeButton.node,
            t = new p(1.06 * this.buttonBaseScale.x, 1.06 * this.buttonBaseScale.y, this.buttonBaseScale.z);
          v.stopAllByTarget(e), e.setScale(this.buttonBaseScale), f(e).to(.45, {
            scale: t
          }).to(.45, {
            scale: this.buttonBaseScale
          }).union().repeatForever().start();
        }, n.stopButtonPulse = function () {
          this.upgradeButton && (v.stopAllByTarget(this.upgradeButton.node), this.upgradeButton.node.setScale(this.buttonBaseScale));
        }, n.clampInteger = function (e, t, r, a) {
          return Number.isFinite(e) ? Math.max(t, Math.min(r, Math.floor(e))) : a;
        }, t;
      }(d)).instance = null, P = t((V = I).prototype, "teamLevelLabel", [M], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return null;
        }
      }), R = t(V.prototype, "willpowerLabel", [b], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return null;
        }
      }), k = t(V.prototype, "willpowerProgress", [C], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return null;
        }
      }), _ = t(V.prototype, "upgradeButton", [S], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return null;
        }
      }), N = t(V.prototype, "upgradeButtonLabel", [y], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return null;
        }
      }), T = t(V.prototype, "progressionResourcePath", [B], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return "data/balance/team_progression";
        }
      }), x = t(V.prototype, "progressAnimationDuration", [A], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return .25;
        }
      }), E = V)) || E));
      n._RF.pop();
    }
  };
});
System.register("chunks:///_virtual/TopTeamInfoController.ts", ["./rollupPluginModLoBabelHelpers.js", "cc", "./GameState.ts"], function (e) {
  var a, t, i, l, r, n, o, s, m, h, v, b, u, f, d, c, p, O, T, g, L, A;
  return {
    setters: [function (e) {
      a = e.applyDecoratedDescriptor, t = e.inheritsLoose, i = e.initializerDefineProperty, l = e.assertThisInitialized, r = e.asyncToGenerator;
    }, function (e) {
      n = e.cclegacy, o = e._decorator, s = e.Label, m = e.Node, h = e.Color, v = e.sys, b = e.Component;
    }, function (e) {
      u = e.gameStateEvents, f = e.GAME_STATE_EVENT_ROSTER_CHANGED, d = e.GAME_STATE_EVENT_TEAM_IDENTITY_CHANGED, c = e.TEAM_NAME_STORAGE_KEY, p = e.getTeamAbbreviation, O = e.TEAM_ABBREVIATION_STORAGE_KEY, T = e.INT32_MAX, g = e.getManagementEffects, L = e.calculateTeamOverall, A = e.loadRoster;
    }],
    execute: function execute() {
      var N, y, C, E, I, R, _, S, M, w, z, B, F;
      n._RF.push({}, "24594tFIxpKlar/P77sRzJ4", "TopTeamInfoController", void 0);
      var G = o.ccclass,
        D = o.property;
      e("TopTeamInfoController", (N = G("TopTeamInfoController"), y = D(s), C = D(s), E = D(s), I = D(m), N((S = a((_ = function (e) {
        function a() {
          for (var a, t = arguments.length, r = new Array(t), n = 0; n < t; n++) r[n] = arguments[n];
          return a = e.call.apply(e, [this].concat(r)) || this, i(a, "teamNameLabel", S, l(a)), i(a, "teamAbbreviationLabel", M, l(a)), i(a, "teamOverallLabel", w, l(a)), i(a, "rosterContainer", z, l(a)), i(a, "defaultTeamName", B, l(a)), i(a, "defaultTeamAbbreviation", F, l(a)), a.displayedOverall = 0, a.animationStartOverall = 0, a.animationTargetOverall = 0, a.animationElapsed = 0, a.isOverallAnimating = !1, a.hasRenderedOverall = !1, a.overallNormalColor = new h(), a;
        }
        t(a, e);
        var n = a.prototype;
        return n.onLoad = function () {
          var e, a, t, i, l, r;
          if (null != this.teamNameLabel || (this.teamNameLabel = null != (e = null == (a = this.node.getChildByName("球队名称")) ? void 0 : a.getComponent(s)) ? e : null), null != this.teamAbbreviationLabel || (this.teamAbbreviationLabel = null != (t = null == (i = this.node.getChildByName("球队简称")) ? void 0 : i.getComponent(s)) ? t : null), null != this.teamOverallLabel || (this.teamOverallLabel = null != (l = null == (r = this.node.getChildByName("球队总评数值")) ? void 0 : r.getComponent(s)) ? l : null), !this.teamNameLabel || !this.teamAbbreviationLabel || !this.teamOverallLabel) return console.error("[TopTeamInfoController] Missing team name, abbreviation, or overall Label."), void (this.enabled = !1);
          this.teamNameLabel.overflow = s.Overflow.SHRINK, this.teamNameLabel.enableWrapText = !1, this.overallNormalColor.set(this.teamOverallLabel.color), this.refreshTeamInfo(!1);
        }, n.onEnable = function () {
          this.teamNameLabel && this.teamAbbreviationLabel && this.teamOverallLabel && this.refreshTeamInfo(this.hasRenderedOverall), u.on(f, this.onRosterChanged, this), u.on(d, this.onTeamIdentityChanged, this);
        }, n.onDisable = function () {
          u.off(f, this.onRosterChanged, this), u.off(d, this.onTeamIdentityChanged, this);
        }, n.update = function (e) {
          if (this.isOverallAnimating && this.teamOverallLabel) {
            this.animationElapsed += e;
            var a = Math.min(1, this.animationElapsed / .45),
              t = 1 - Math.pow(1 - a, 3);
            this.displayedOverall = Math.round(this.animationStartOverall + (this.animationTargetOverall - this.animationStartOverall) * t), this.teamOverallLabel.string = this.formatOverall(this.displayedOverall), a >= 1 && (this.isOverallAnimating = !1, this.teamOverallLabel.color = this.overallNormalColor);
          }
        }, n.refreshTeamInfo = function (e) {
          var a;
          if (void 0 === e && (e = !0), this.teamNameLabel && this.teamAbbreviationLabel && this.teamOverallLabel) {
            var t = (null == (a = v.localStorage.getItem(c)) ? void 0 : a.trim()) || this.defaultTeamName,
              i = p(t, this.defaultTeamAbbreviation);
            this.teamNameLabel.string = t, this.teamAbbreviationLabel.string = i, v.localStorage.setItem(O, i), this.refreshOverallFromRoster(e);
          }
        }, n.setTeamIdentity = function (e) {
          var a = e.trim() || this.defaultTeamName,
            t = p(a, this.defaultTeamAbbreviation);
          v.localStorage.setItem(c, a), v.localStorage.setItem(O, t), u.emit(d, a, t), this.teamNameLabel && (this.teamNameLabel.string = a), this.teamAbbreviationLabel && (this.teamAbbreviationLabel.string = t);
        }, n.refreshOverallFromRoster = function () {
          var e = r( /*#__PURE__*/_regeneratorRuntime().mark(function _callee33(e) {
            var a;
            return _regeneratorRuntime().wrap(function _callee33$(_context34) {
              while (1) switch (_context34.prev = _context34.next) {
                case 0:
                  void 0 === e && (e = !0);
                  _context34.next = 3;
                  return g();
                case 3:
                  a = _context34.sent;
                  this.setLineupOverall(L(A(), a.headCoachBattleOvrBonus), e);
                case 5:
                case "end":
                  return _context34.stop();
              }
            }, _callee33, this);
          }));
          return function (a) {
            return e.apply(this, arguments);
          };
        }(), n.setLineupOverall = function (e, a) {
          void 0 === a && (a = !0);
          var t = Math.max(0, Math.round(Number.isFinite(e) ? e : 0));
          if (this.teamOverallLabel) {
            if (!a || !this.hasRenderedOverall || t === this.displayedOverall) return this.displayedOverall = t, this.animationTargetOverall = t, this.isOverallAnimating = !1, this.teamOverallLabel.string = this.formatOverall(t), this.teamOverallLabel.color = this.overallNormalColor, void (this.hasRenderedOverall = !0);
            this.animationStartOverall = this.displayedOverall, this.animationTargetOverall = t, this.animationElapsed = 0, this.isOverallAnimating = !0, this.teamOverallLabel.color = t > this.displayedOverall ? new h(92, 210, 120, 255) : new h(235, 92, 92, 255);
          }
        }, n.formatOverall = function (e) {
          return e >= T ? "MAX" : e >= 1e8 ? this.formatUnit(e / 1e8) + "亿" : e >= 1e4 ? this.formatUnit(e / 1e4) + "万" : String(Math.round(e));
        }, n.formatUnit = function (e) {
          return e.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
        }, n.onRosterChanged = function () {
          this.refreshOverallFromRoster(!0);
        }, n.onTeamIdentityChanged = function () {
          this.refreshTeamInfo(!1);
        }, a;
      }(b)).prototype, "teamNameLabel", [y], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return null;
        }
      }), M = a(_.prototype, "teamAbbreviationLabel", [C], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return null;
        }
      }), w = a(_.prototype, "teamOverallLabel", [E], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return null;
        }
      }), z = a(_.prototype, "rosterContainer", [I], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return null;
        }
      }), B = a(_.prototype, "defaultTeamName", [D], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return "我的球队";
        }
      }), F = a(_.prototype, "defaultTeamAbbreviation", [D], {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        initializer: function initializer() {
          return "我";
        }
      }), R = _)) || R));
      n._RF.pop();
    }
  };
});
(function (r) {
  r('virtual:///prerequisite-imports/main', 'chunks:///_virtual/main');
})(function (mid, cid) {
  System.register(mid, [cid], function (_export, _context) {
    return {
      setters: [function (_m) {
        var _exportObj = {};
        for (var _key in _m) {
          if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _m[_key];
        }
        _export(_exportObj);
      }],
      execute: function execute() {}
    };
  });
});