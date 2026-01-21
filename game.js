const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const playerImg = new Image();
playerImg.src = "vijay.jpeg";

const bgImg = new Image();
bgImg.src = "galaxy.jpg";

/* ---------- SCORING CONSTANTS ---------- */
const GOOD_HIT_POINTS = 10;
const BAD_HIT_POINTS = -15;
const GOOD_SKIP_PENALTY = -10;
const GAME_OVER_SCORE = -20;

/* ---------- SOUND EFFECTS ---------- */

// Game over sound
const gameOverSound = new Audio("y2mate_HOnnyD0.mp3");
gameOverSound.volume = 0.7;
gameOverSound.loop = false;

// GOOD decision sounds WITH INDIVIDUAL DURATIONS (RANDOM)
const goodSounds = [
  { audio: new Audio("airhorn.mp3"), duration: 600 },
  { audio: new Audio("punjabi.mp3"), duration: 1200 }
];

// BAD decision sounds WITH INDIVIDUAL DURATIONS (RANDOM)
const badSounds = [
  { audio: new Audio("Fahhhh.mp3"), duration: 800 },
  { audio: new Audio("getfromytcom-the-angriest-scamme-1.mp3"), duration: 2000 },
  { audio: new Audio("Voicy_Hey Ma Mataji.mp3"), duration: 3000 }
];

// Configure all sounds
[...goodSounds, ...badSounds].forEach(s => {
  s.audio.volume = 0.5;
  s.audio.playbackRate = 1.0;
});

/* ---------- SOUND HELPERS ---------- */
function playRandomGoodSound() {
  const item = goodSounds[Math.floor(Math.random() * goodSounds.length)];
  item.audio.currentTime = 0;
  item.audio.play();
  setTimeout(() => item.audio.pause(), item.duration);
}

function playRandomBadSound() {
  const item = badSounds[Math.floor(Math.random() * badSounds.length)];
  item.audio.currentTime = 0;
  item.audio.play();
  setTimeout(() => item.audio.pause(), item.duration);
}

/* ---------- UI ELEMENTS ---------- */
const scoreValue = document.getElementById("scoreValue");
const progressBar = document.getElementById("progressBar");

/* ---------- BACKGROUND ---------- */
let bgX = 0;
const BG_SPEED = 1.2;

/* ---------- PLAYER ---------- */
const player = { x: 80, y: 160, w: 70, h: 110 };

/* ---------- GAME STATE ---------- */
let obstacles = [];
let score = 0;
let speed = 3;
let gameOver = false;

/* ---------- OBSTRUCTION CONTROL ---------- */
const MAX_OBSTACLES = 4;
const OBSTACLE_WIDTH = 220;
const OBSTACLE_HEIGHT = 55;
const MIN_VERTICAL_GAP = 90;
const MIN_HORIZONTAL_GAP = 280;
const SPEED_INCREMENT = 0.4;

/* ---------- DATA ---------- */
const goodItems = [
  "Start Early","Budgeting Monthly","Emergency Fund","Diversified Investing",
  "Debt Payoff","Tax Planning","Career Growth","Limiting Debt",
  "Term Insurance","Living Modestly","Continuous Learning",
  "Index Funds","Retirement Accounts","Health Insurance","Business Equity",
  "Delay gratification","Limit lifestyle","REITs","Corporate Bonds","Think long-term",
  "Sovereign Gold","Target Funds","Diversify risk","Research assets","Network effectively",
  "Optimize taxes","Private equity","Venture capital","Value stocks",
];

const badItems = [
  "Delaying Savings","Overspending","High-Interest Debt","Panic Selling",
  "Lifestyle Inflation","Emotional Spending","Maxing Cards",
  "Skipping Insurance","Status Chasing","Impulsive Buying",
  "Luxury Cars","Fast Fashion","Lottery Tickets","Speculative Coins",
  "No Plan","Penny stocks","Chit funds","Ponzi schemes",
  "Skipping audits","Single-stock focus","No insurance","Chasing hype","Blindly trusting",
  "Penny stocks","Naked options","High-Risk Speculation","Poor Value Tools","Unregulated bonds",
  "P2P lending","ULIP plans"
];

/* ---------- DECISION QUEUE SYSTEM ---------- */
let decisionQueue = [];
let decisionIndex = 0;
let round = 1;

function buildDecisionQueue() {
  decisionQueue = [];

  goodItems.forEach(item => decisionQueue.push({ label: item, type: "good" }));
  badItems.forEach(item => decisionQueue.push({ label: item, type: "bad" }));

  for (let i = decisionQueue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [decisionQueue[i], decisionQueue[j]] =
      [decisionQueue[j], decisionQueue[i]];
  }

  decisionIndex = 0;
}

/* ---------- CONTROLS ---------- */
document.addEventListener("keydown", e => {
  if (gameOver) return;
  if (e.key === "ArrowUp" && player.y > 0) player.y -= 28;
  if (e.key === "ArrowDown" && player.y < canvas.height - player.h)
    player.y += 28;
});

/* ---------- SPAWN HELPERS ---------- */
function canSpawnAt(y) {
  return obstacles.every(o => Math.abs(o.y - y) > MIN_VERTICAL_GAP);
}

/* ---------- SPAWN OBSTACLE ---------- */
function spawnObstacle() {
  if (gameOver || obstacles.length >= MAX_OBSTACLES) return;

  if (decisionIndex >= decisionQueue.length) {
    round++;
    speed += SPEED_INCREMENT;
    buildDecisionQueue();
  }

  let y, attempts = 0;
  do {
    y = Math.random() * (canvas.height - OBSTACLE_HEIGHT - 20) + 10;
    attempts++;
  } while (!canSpawnAt(y) && attempts < 10);

  const decision = decisionQueue[decisionIndex++];
  const last = obstacles[obstacles.length - 1];
  const randomGap = MIN_HORIZONTAL_GAP + Math.random() * 120;

  obstacles.push({
    x: last ? Math.max(canvas.width, last.x + randomGap) : canvas.width,
    y,
    w: OBSTACLE_WIDTH,
    h: OBSTACLE_HEIGHT,
    type: decision.type,
    label: decision.label
  });
}

/* ---------- SPAWN LOOP ---------- */
function spawnLoop() {
  spawnObstacle();
  setTimeout(spawnLoop, 900);
}

/* ---------- SCORE UPDATE ---------- */
function updateScore(change) {
  score += change;
  scoreValue.innerText = score;

  scoreValue.classList.add(change > 0 ? "score-up" : "score-down");
  setTimeout(() => scoreValue.classList.remove("score-up", "score-down"), 200);

  const progress = Math.max(
    0,
    Math.min(100, ((Math.abs(GAME_OVER_SCORE) + score) / Math.abs(GAME_OVER_SCORE)) * 100)
  );
  progressBar.style.width = progress + "%";

  if (score <= GAME_OVER_SCORE) endGame();
}

/* ---------- COLLISION ---------- */
function collide(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

/* ---------- DRAW ---------- */
function drawBackground() {
  bgX -= BG_SPEED;
  if (bgX <= -canvas.width) bgX = 0;
  ctx.drawImage(bgImg, bgX, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImg, bgX + canvas.width, 0, canvas.width, canvas.height);
}

function drawPlayer() {
  ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);
}

/* ---------- GAME LOOP ---------- */
function draw() {
  if (gameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawPlayer();

  obstacles.forEach((o, i) => {
    o.x -= speed;

    ctx.fillStyle = "#ff9800";
    ctx.shadowBlur = 10;
    ctx.fillRect(o.x, o.y, o.w, o.h);

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#000";
    ctx.font = "bold 14px Segoe UI";
    ctx.textAlign = "center";
    ctx.fillText(o.label, o.x + o.w / 2, o.y + o.h / 2 + 5);

    if (collide(player, o)) {
      if (o.type === "good") {
        playRandomGoodSound();
        updateScore(GOOD_HIT_POINTS);
      } else {
        playRandomBadSound();
        updateScore(BAD_HIT_POINTS);
      }
      obstacles.splice(i, 1);
    }

    // SKIPPED OBSTACLE
    if (o.x < -o.w) {
      if (o.type === "good") {
        updateScore(GOOD_SKIP_PENALTY);
      }
      obstacles.splice(i, 1);
    }
  });

  requestAnimationFrame(draw);
}

/* ---------- GAME OVER ---------- */
function endGame() {
  if (gameOver) return;
  gameOver = true;

  gameOverSound.currentTime = 0;
  gameOverSound.play();

  document.getElementById("finalScore").innerText = score;
  document.getElementById("gameOverScreen").style.display = "flex";
}

/* ---------- START ---------- */
let loaded = 0;
[playerImg, bgImg].forEach(img => {
  img.onload = () => {
    loaded++;
    // Game will start ONLY when user clicks "Start Game"
  };
});


/* ---------- RESTART ---------- */
function restartGame() {
  obstacles = [];
  score = 0;
  speed = 3;
  gameOver = false;
  bgX = 0;
  decisionIndex = 0;
  round = 1;

  gameOverSound.pause();
  gameOverSound.currentTime = 0;

  buildDecisionQueue();

  scoreValue.innerText = "0";
  progressBar.style.width = "100%";
  document.getElementById("gameOverScreen").style.display = "none";

  draw();
}

/* ---------- START FROM INSTRUCTIONS ---------- */
function startGame() {
  document.getElementById("instructionsScreen").style.display = "none";
  document.getElementById("gameArea").classList.remove("hidden");

  buildDecisionQueue();
  spawnLoop();
  draw();
}
