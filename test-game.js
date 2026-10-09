/* Headless test harness for game.js — stubs the DOM, injects state hooks,
   and verifies core mechanics. Run: node test-game.js */
const fs = require("fs");
const path = require("path");

// ---------- stubs ----------
const listeners = {};
function makeEl(id) {
  const el = {
    id, textContent: "", hidden: true, value: "",
    style: {}, dataset: { dx: "0", dy: "0" },
    classList: { add() {}, remove() {}, toggle() { return false; }, contains() { return false; } },
    handlers: {},
    addEventListener(ev, fn) { (this.handlers[ev] = this.handlers[ev] || []).push(fn); },
    setAttribute() {}, getAttribute() { return null; },
    focus() {},
    click() { (this.handlers.click || []).forEach((f) => f({ preventDefault() {} })); },
    dispatch(ev, e) { (this.handlers[ev] || []).forEach((f) => f(e || { preventDefault() {} })); },
  };
  return el;
}
const gradStub = { addColorStop() {} };
const ctxStub = new Proxy(
  { canvas: null },
  { get(t, p) {
      if (p === "createRadialGradient" || p === "createLinearGradient") return () => gradStub;
      if (p === "measureText") return () => ({ width: 0 });
      if (typeof p === "string") return t[p] !== undefined ? t[p] : (() => {});
      return undefined;
    },
    set(t, p, v) { t[p] = v; return true; } }
);
const canvasEl = makeEl("game-canvas");
canvasEl.clientWidth = 400;
canvasEl.getContext = () => ctxStub;
canvasEl.width = 400; canvasEl.height = 400;

const els = {
  "game-canvas": canvasEl,
  "game-score": makeEl("game-score"),
  "game-best": makeEl("game-best"),
  "game-overlay": makeEl("game-overlay"),
  "game-overlay-title": makeEl("game-overlay-title"),
  "game-overlay-text": makeEl("game-overlay-text"),
  "game-overlay-btn": makeEl("game-overlay-btn"),
  "game-pause": makeEl("game-pause"),
  "game-sound": makeEl("game-sound"),
};
const store = {};
global.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
};
global.document = {
  getElementById: (id) => els[id] || null,
  querySelectorAll: () => [],
  querySelector: () => null,
  addEventListener(ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); },
  hidden: false,
};
let rafCb = null;
global.requestAnimationFrame = (cb) => { rafCb = cb; return 1; };
global.cancelAnimationFrame = () => { rafCb = null; };
global.window = global;
global.addEventListener = (ev, fn) => { (listeners["win:" + ev] = listeners["win:" + ev] || []).push(fn); };
global.performance = { now: () => simTime };
let simTime = 1000;
global.AudioContext = undefined;

// ---------- load game with injected hooks ----------
let src = fs.readFileSync(path.join(__dirname, "assets/js/game.js"), "utf8");
const hook = `\n;window.__sg = {
  getState: () => state, getScore: () => score, getBest: () => best,
  getSnake: () => snake.map(s => ({...s})), getDir: () => ({...dir}),
  getFood: () => ({...food}), getTick: () => tickMs,
  start, step, queueDir,
  setFood: (x, y) => { food = {x, y}; },
  setSnake: (arr) => { snake = arr.map(s => ({...s})); },
  fireKey: (code) => (listeners.keydown || []).forEach(f => f({ code, target: { tagName: "BODY" }, preventDefault() {} })),
};\n`;
src = src.replace(/\}\)\(\);\s*$/, hook + "})();");
eval(src);
const g = window.__sg;

// ---------- assertions ----------
let pass = 0, fail = 0;
function ok(cond, name) {
  if (cond) { pass++; console.log("  PASS " + name); }
  else { fail++; console.log("  FAIL " + name); }
}

console.log("Test 1: start via overlay button");
els["game-overlay-btn"].click();
ok(g.getState() === "playing", "state=playing after Jugar click");
ok(g.getSnake().length === 3, "snake length 3 at start");
ok(g.getScore() === 0, "score 0 at start");
ok(els["game-overlay"].hidden === true, "overlay hidden while playing");

console.log("Test 2: movement + queued turns (no 180 reversal)");
const h0 = g.getSnake()[0];
g.step(); // moves right
const h1 = g.getSnake()[0];
ok(h1.x === h0.x + 1 && h1.y === h0.y, "head moves right");
g.queueDir(-1, 0); // illegal reverse -> ignored
g.step();
const h2 = g.getSnake()[0];
ok(h2.x === h1.x + 1, "180-degree reversal ignored");
g.queueDir(0, 1); g.queueDir(0, -1); // queue down then up; down applies, up is reverse-of-down? no: reverse of current dir check uses queued last
g.step();
const h3 = g.getSnake()[0];
ok(h3.y === h2.y + 1, "queued direction change applied (down)");

console.log("Test 3: eating food grows snake + scores + speeds up");
g.start();
const head = g.getSnake()[0];
const tickBefore = g.getTick();
g.setFood(head.x + 1, head.y); // food directly ahead (dir=right)
g.step();
ok(g.getScore() === 1, "score=1 after eating");
ok(g.getSnake().length === 4, "snake grew to 4");
ok(g.getTick() < tickBefore, "speed increased after eating");
ok(els["game-score"].textContent === 1, "HUD score updated");

console.log("Test 4: wall collision ends game");
g.start();
for (let i = 0; i < 25; i++) { if (g.getState() !== "playing") break; g.step(); } // run right into wall
ok(g.getState() === "over", "state=over after wall hit");
ok(els["game-overlay"].hidden === false, "game-over overlay shown");
ok(/Fin del juego/.test(els["game-overlay-title"].textContent), "overlay title correct");
ok(store["sg_best"] === undefined && g.getBest() === 0, "no best saved when score is 0 (correct)");

console.log("Test 5: best score persists");
g.start();
const hd = g.getSnake()[0];
g.setFood(hd.x + 1, hd.y); g.step();
g.setFood(g.getSnake()[0].x + 1, g.getSnake()[0].y); g.step();
for (let i = 0; i < 25; i++) { if (g.getState() !== "playing") break; g.step(); }
ok(g.getState() === "over", "game over again");
ok(store["sg_best"] === "2", "best=2 saved to localStorage");
ok(els["game-best"].textContent === 2, "HUD best updated");

console.log("Test 6: self collision ends game (head hits non-tail segment)");
g.start();
g.setFood(0, 0); // keep food away from the test area
// head (5,5) moving down will hit (5,6) which is a middle segment, not the tail
g.setSnake([{x:5,y:5},{x:4,y:5},{x:3,y:5},{x:3,y:6},{x:4,y:6},{x:5,y:6},{x:6,y:6}]);
g.queueDir(0, 1);
g.step();
ok(g.getState() === "over", "state=over after self collision");

console.log("Test 6b: moving into the vacating tail cell is LEGAL");
g.start();
g.setFood(0, 0);
// head (5,5) moving down into (5,6): tail cell that moves away this step
g.setSnake([{x:5,y:5},{x:4,y:5},{x:3,y:5},{x:3,y:6},{x:4,y:6},{x:5,y:6}]);
g.queueDir(0, 1);
g.step();
ok(g.getState() === "playing", "no false collision on tail cell");

console.log("Test 7: restart after game over");
els["game-overlay-btn"].click();
ok(g.getState() === "playing", "restart works");
ok(g.getScore() === 0 && g.getSnake().length === 3, "fresh state on restart");

console.log("Test 8: keyboard input starts game from ready");
g.start();
// force back to ready-like via fresh eval? simulate: set state over then keydown
for (let i = 0; i < 25; i++) { if (g.getState() !== "playing") break; g.step(); }
ok(g.getState() === "over", "over again");
g.fireKey("ArrowUp");
ok(g.getState() === "playing", "arrow key restarts game");
g.step(); // queued direction applies on the next tick
ok(g.getDir().y === -1, "direction set to up via keyboard");

console.log("Test 9: food never spawns on snake (60 placements)");
g.start();
let bad = 0;
for (let i = 0; i < 60; i++) {
  if (g.getState() !== "playing") { g.start(); continue; }
  const hh = g.getSnake()[0];
  if (hh.x > 16) { g.start(); continue; } // stay away from the wall; keep it clean
  g.setFood(hh.x + 1, hh.y); // cell ahead is always free (snake trails behind)
  g.step(); // eats -> real placeFood() runs inside
  if (g.getState() !== "playing") continue;
  const f = g.getFood();
  const onSnake = g.getSnake().some((s) => s.x === f.x && s.y === f.y);
  if (onSnake) bad++;
}
ok(bad === 0, "food never placed on snake in 60 placements");

console.log("Test 10: filling the whole board triggers WIN");
g.start();
// all cells except (19,19); head (18,19) first, moving right onto the last food
const cells = [];
for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) {
  if (x === 19 && y === 19) continue;
  cells.push({ x, y });
}
const hi = cells.findIndex((c) => c.x === 18 && c.y === 19);
cells.unshift(cells.splice(hi, 1)[0]);
g.setSnake(cells);
g.setFood(19, 19);
g.step();
ok(g.getState() === "win", "state=win when board is full");
ok(/Has ganado/.test(els["game-overlay-title"].textContent), "win overlay shown");
ok(els["game-overlay"].hidden === false, "win overlay visible");
els["game-overlay-btn"].click();
ok(g.getState() === "playing" && g.getScore() === 0, "restart works after win");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
