/* Serpiente de Google — playable Snake game.
   Vanilla JS, no dependencies. Keyboard (arrows/WASD), touch swipe, on-screen d-pad. */
(function () {
  "use strict";

  var canvas = document.getElementById("game-canvas");
  if (!canvas) return;

  var GRID = 20;               // 20 x 20 cells
  var START_TICK = 150;        // ms per step at start
  var MIN_TICK = 70;           // fastest speed
  var SPEED_STEP = 4;          // ms faster per food eaten

  var ctx = canvas.getContext("2d");
  var cell = 0;

  var snake, dir, dirQueue, food, score, best, tickMs, acc, lastTime, rafId;
  var state = "ready"; // ready | playing | paused | over | win
  var soundOn = true;
  var audioCtx = null;

  var elScore = document.getElementById("game-score");
  var elBest = document.getElementById("game-best");
  var overlay = document.getElementById("game-overlay");
  var overlayTitle = document.getElementById("game-overlay-title");
  var overlayText = document.getElementById("game-overlay-text");
  var overlayBtn = document.getElementById("game-overlay-btn");
  var btnPause = document.getElementById("game-pause");
  var btnSound = document.getElementById("game-sound");

  try {
    best = parseInt(localStorage.getItem("sg_best") || "0", 10) || 0;
  } catch (e) { best = 0; }
  updateHud();

  /* ---------- audio (tiny WebAudio beeps) ---------- */
  function beep(freq, dur, type) {
    if (!soundOn) return;
    try {
      if (!audioCtx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        audioCtx = new AC();
      }
      if (audioCtx.state === "suspended") audioCtx.resume();
      var o = audioCtx.createOscillator();
      var g = audioCtx.createGain();
      o.type = type || "square";
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.08, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      o.connect(g); g.connect(audioCtx.destination);
      o.start();
      o.stop(audioCtx.currentTime + dur);
    } catch (e) { /* audio unavailable — play silently */ }
  }

  /* ---------- sizing (crisp on retina) ---------- */
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    var size = canvas.clientWidth;
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    cell = canvas.width / GRID;
    draw();
  }
  window.addEventListener("resize", resize);

  /* ---------- game state ---------- */
  function reset() {
    snake = [
      { x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }
    ];
    dir = { x: 1, y: 0 };
    dirQueue = [];
    score = 0;
    tickMs = START_TICK;
    acc = 0; lastTime = 0;
    placeFood();
    updateHud();
    draw();
  }

  function placeFood() {
    var i, p, ok, guard = 0;
    do {
      p = {
        x: Math.floor(Math.random() * GRID),
        y: Math.floor(Math.random() * GRID)
      };
      ok = true;
      for (i = 0; i < snake.length; i++) {
        if (snake[i].x === p.x && snake[i].y === p.y) { ok = false; break; }
      }
      guard++;
    } while (!ok && guard < 2000);
    if (!ok) { food = null; return false; } // board completely full
    food = p;
    return true;
  }

  function updateHud() {
    if (elScore) elScore.textContent = score;
    if (elBest) elBest.textContent = best;
  }

  /* ---------- flow ---------- */
  function showOverlay(title, text, btnLabel) {
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    overlayBtn.textContent = btnLabel;
    overlay.hidden = false;
  }
  function hideOverlay() { overlay.hidden = true; }

  function start() {
    reset();
    state = "playing";
    hideOverlay();
    if (btnPause) btnPause.textContent = "⏸";
    lastTime = performance.now();
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
    canvas.focus({ preventScroll: true });
  }

  function togglePause() {
    if (state === "playing") {
      state = "paused";
      cancelAnimationFrame(rafId);
      if (btnPause) btnPause.textContent = "▶";
      showOverlay("En pausa", "La serpiente descansa. Pulsa continuar cuando quieras.", "Continuar");
    } else if (state === "paused") {
      state = "playing";
      hideOverlay();
      if (btnPause) btnPause.textContent = "⏸";
      lastTime = performance.now();
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(loop);
    }
  }

  function gameOver() {
    state = "over";
    cancelAnimationFrame(rafId);
    beep(160, 0.35, "sawtooth");
    if (score > best) {
      best = score;
      try { localStorage.setItem("sg_best", String(best)); } catch (e) {}
    }
    updateHud();
    if (btnPause) btnPause.textContent = "⏸";
    showOverlay(
      "¡Fin del juego!",
      "Conseguiste " + score + " punto" + (score === 1 ? "" : "s") +
      ". Tu récord es " + best + ". ¿Otra partida?",
      "Jugar de nuevo"
    );
  }

  function win() {
    state = "win";
    cancelAnimationFrame(rafId);
    beep(880, 0.15, "square");
    if (score > best) {
      best = score;
      try { localStorage.setItem("sg_best", String(best)); } catch (e) {}
    }
    updateHud();
    if (btnPause) btnPause.textContent = "⏸";
    showOverlay(
      "¡Has ganado! 🏆",
      "Increíble: llenaste todo el tablero con " + score + " puntos. ¿Otra partida?",
      "Jugar de nuevo"
    );
  }

  /* ---------- main loop ---------- */
  function loop(now) {
    if (state !== "playing") return;
    if (!lastTime) lastTime = now;
    acc += now - lastTime;
    lastTime = now;
    while (acc >= tickMs) {
      acc -= tickMs;
      step();
      if (state !== "playing") return;
    }
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function step() {
    // apply queued direction (prevents 180° reversal and eats fast inputs)
    while (dirQueue.length) {
      var n = dirQueue.shift();
      if ((n.x !== -dir.x || n.y !== -dir.y) && (n.x !== dir.x || n.y !== dir.y)) {
        dir = n;
        break;
      }
    }
    var head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    // wall collision
    if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) {
      gameOver(); return;
    }
    // self collision (ignore tail cell that will move away, unless growing)
    var growing = (head.x === food.x && head.y === food.y);
    var lim = growing ? snake.length : snake.length - 1;
    for (var i = 0; i < lim; i++) {
      if (snake[i].x === head.x && snake[i].y === head.y) { gameOver(); return; }
    }

    snake.unshift(head);
    if (growing) {
      score++;
      tickMs = Math.max(MIN_TICK, tickMs - SPEED_STEP);
      beep(660, 0.09, "square");
      updateHud();
      if (snake.length >= GRID * GRID) { win(); return; } // board full: victory
      placeFood();
    } else {
      snake.pop();
    }
  }

  /* ---------- drawing ---------- */
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function draw() {
    if (!cell) return;
    var x, y;
    // board
    for (y = 0; y < GRID; y++) {
      for (x = 0; x < GRID; x++) {
        ctx.fillStyle = ((x + y) % 2 === 0) ? "#edf7dc" : "#ddf0c4";
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
    // food: apple
    if (food) {
      var fx = food.x * cell + cell / 2, fy = food.y * cell + cell / 2;
      var r = cell * 0.36;
      ctx.fillStyle = "#5b3a1e";
      ctx.fillRect(fx - cell * 0.03, fy - r - cell * 0.16, cell * 0.06, cell * 0.18);
      ctx.fillStyle = "#2e9e5b";
      ctx.beginPath();
      ctx.ellipse(fx + cell * 0.16, fy - r - cell * 0.1, cell * 0.14, cell * 0.08, 0.5, 0, Math.PI * 2);
      ctx.fill();
      var grd = ctx.createRadialGradient(fx - r * 0.3, fy - r * 0.3, r * 0.2, fx, fy, r);
      grd.addColorStop(0, "#ff7a5c");
      grd.addColorStop(1, "#e23a1f");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(fx, fy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.55)";
      ctx.beginPath();
      ctx.arc(fx - r * 0.32, fy - r * 0.32, r * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }
    // snake (tail to head, rounded segments)
    for (var i = snake.length - 1; i >= 0; i--) {
      var s = snake[i];
      var px = s.x * cell, py = s.y * cell;
      var pad = cell * 0.08;
      var shade = 1 - (i / snake.length) * 0.35;
      var green = Math.round(157 * shade + 40 * (1 - shade));
      ctx.fillStyle = "rgb(31," + green + ",99)";
      roundRect(px + pad, py + pad, cell - pad * 2, cell - pad * 2, cell * 0.32);
      ctx.fill();
      if (i === 0) {
        // head: eyes looking in movement direction
        var ex = dir.x, ey = dir.y;
        var cx = px + cell / 2, cy = py + cell / 2;
        var eo = cell * 0.18, fo = cell * 0.12;
        var px1 = cx - ey * eo + ex * fo, py1 = cy - ex * eo + ey * fo;
        var px2 = cx + ey * eo + ex * fo, py2 = cy + ex * eo + ey * fo;
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(px1, py1, cell * 0.15, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(px2, py2, cell * 0.15, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#10261e";
        ctx.beginPath(); ctx.arc(px1 + ex * cell * 0.05, py1 + ey * cell * 0.05, cell * 0.07, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(px2 + ex * cell * 0.05, py2 + ey * cell * 0.05, cell * 0.07, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  /* ---------- input ---------- */
  function queueDir(x, y) {
    if (state === "ready" || state === "over" || state === "win") start();
    var last = dirQueue.length ? dirQueue[dirQueue.length - 1] : dir;
    if ((x === -last.x && y === -last.y) || (x === last.x && y === last.y)) return;
    if (dirQueue.length < 3) dirQueue.push({ x: x, y: y });
  }

  var KEYMAP = {
    ArrowUp: [0, -1], KeyW: [0, -1],
    ArrowDown: [0, 1], KeyS: [0, 1],
    ArrowLeft: [-1, 0], KeyA: [-1, 0],
    ArrowRight: [1, 0], KeyD: [1, 0]
  };

  document.addEventListener("keydown", function (e) {
    if (KEYMAP[e.code]) {
      // don't hijack arrows when user is typing in a form field
      var t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      e.preventDefault();
      var d = KEYMAP[e.code];
      queueDir(d[0], d[1]);
    } else if (e.code === "Space") {
      var t2 = e.target;
      if (t2 && (t2.tagName === "INPUT" || t2.tagName === "TEXTAREA" || t2.tagName === "BUTTON")) return;
      e.preventDefault();
      if (state === "ready" || state === "over" || state === "win") start();
      else togglePause();
    }
  });

  // swipe
  var touchStart = null;
  canvas.addEventListener("touchstart", function (e) {
    var t = e.changedTouches[0];
    touchStart = { x: t.clientX, y: t.clientY };
  }, { passive: true });
  canvas.addEventListener("touchmove", function (e) {
    e.preventDefault(); // stop page scroll while swiping on the board
  }, { passive: false });
  canvas.addEventListener("touchend", function (e) {
    if (!touchStart) return;
    var t = e.changedTouches[0];
    var dx = t.clientX - touchStart.x, dy = t.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) {
      // tap: start / pause
      if (state === "ready" || state === "over" || state === "win") start();
      return;
    }
    if (Math.abs(dx) > Math.abs(dy)) queueDir(dx > 0 ? 1 : -1, 0);
    else queueDir(0, dy > 0 ? 1 : -1);
  }, { passive: true });

  // d-pad buttons
  document.querySelectorAll(".dpad button").forEach(function (b) {
    b.addEventListener("click", function () {
      queueDir(parseInt(b.dataset.dx, 10), parseInt(b.dataset.dy, 10));
    });
  });

  // click on board starts the game
  canvas.addEventListener("click", function () {
    if (state === "ready" || state === "over" || state === "win") start();
  });

  if (overlayBtn) overlayBtn.addEventListener("click", function () {
    if (state === "paused") togglePause();
    else start();
  });
  if (btnPause) btnPause.addEventListener("click", function () {
    if (state === "playing" || state === "paused") togglePause();
  });
  if (btnSound) btnSound.addEventListener("click", function () {
    soundOn = !soundOn;
    btnSound.textContent = soundOn ? "🔊" : "🔇";
    btnSound.setAttribute("aria-label", soundOn ? "Silenciar sonido" : "Activar sonido");
  });

  // auto-pause when tab hidden
  document.addEventListener("visibilitychange", function () {
    if (document.hidden && state === "playing") togglePause();
  });

  /* ---------- init ---------- */
  reset();
  resize();
  showOverlay(
    "¡A jugar!",
    "Usa las flechas del teclado o desliza el dedo para mover la serpiente. Come manzanas y evita los bordes y tu propia cola.",
    "Jugar"
  );
  // draw again after fonts/layout settle
  window.addEventListener("load", resize);
})();
