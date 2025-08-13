const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let width, height;

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}
resize();
window.addEventListener('resize', resize);

const dinoImg = new Image();
dinoImg.src = './dinosaur.png';

const meteorImg = new Image();
meteorImg.src = './meteor.png';

// ====== Easy to edit meteor size here =======
const METEOR_HEIGHT = 64;  // Change this value to resize meteors easily
// ============================================

const dino = {
  x: 0,
  y: 0,
  width: 128,
  height: 128,
  speedX: 10,
};

let meteors = [];
let distance = 0;
let gameOver = false;
let lastMeteorTime = 0;
let meteorInterval = 1500; // ms between meteors
let meteorSpeed = 3;
let difficultyIncreaseTime = 60000; // 1 minute
let startTime = null;

let meteorAspectRatio = 1;

function resetGame() {
  distance = 0;
  updateScoreDisplay();
  meteors = [];
  gameOver = false;
  meteorInterval = 1500;
  meteorSpeed = 3;
  startTime = performance.now();
  dino.x = width / 2 - dino.width / 2;
  dino.y = height - dino.height - 20;
  lastMeteorTime = 0;
  hideRestartPrompt();
  requestAnimationFrame(gameLoop);
}

function spawnMeteor() {
  const meteorWidth = METEOR_HEIGHT * meteorAspectRatio;
  const x = Math.random() * (width - meteorWidth);
  meteors.push({ x, y: -METEOR_HEIGHT, width: meteorWidth, height: METEOR_HEIGHT, speed: meteorSpeed });
}

function rectsOverlap(r1, r2) {
  return !(
    r2.x > r1.x + r1.width ||
    r2.x + r2.width < r1.x ||
    r2.y > r1.y + r1.height ||
    r2.y + r2.height < r1.y
  );
}

// Pixel-perfect collision detection
function pixelPerfectCollision(dino, meteor, dinoImg, meteorImg) {
  // Calculate intersection rectangle
  const x1 = Math.max(dino.x, meteor.x);
  const y1 = Math.max(dino.y, meteor.y);
  const x2 = Math.min(dino.x + dino.width, meteor.x + meteor.width);
  const y2 = Math.min(dino.y + dino.height, meteor.y + meteor.height);

  if (x2 <= x1 || y2 <= y1) return false; // No overlap

  const width = Math.floor(x2 - x1);
  const height = Math.floor(y2 - y1);

  // Create offscreen canvases
  const dinoCanvas = document.createElement('canvas');
  dinoCanvas.width = width;
  dinoCanvas.height = height;
  const dinoCtx = dinoCanvas.getContext('2d');

  const meteorCanvas = document.createElement('canvas');
  meteorCanvas.width = width;
  meteorCanvas.height = height;
  const meteorCtx = meteorCanvas.getContext('2d');

  // Draw overlapping parts onto canvases
  dinoCtx.drawImage(
    dinoImg,
    x1 - dino.x, y1 - dino.y, width, height,
    0, 0, width, height
  );

  meteorCtx.drawImage(
    meteorImg,
    x1 - meteor.x, y1 - meteor.y, width, height,
    0, 0, width, height
  );

  const dinoData = dinoCtx.getImageData(0, 0, width, height).data;
  const meteorData = meteorCtx.getImageData(0, 0, width, height).data;

  for (let i = 3; i < dinoData.length; i += 4) {
    if (dinoData[i] > 0 && meteorData[i] > 0) {
      return true;
    }
  }

  return false;
}

function update(delta) {
  if (gameOver) return;

  distance += delta * 0.1;
  updateScoreDisplay();

  const elapsed = performance.now() - startTime;
  if (elapsed > difficultyIncreaseTime) {
    startTime = performance.now();
    meteorSpeed += 1;
    meteorInterval = Math.max(400, meteorInterval - 200);
  }

  if (performance.now() - lastMeteorTime > meteorInterval) {
    spawnMeteor();
    lastMeteorTime = performance.now();
  }

  meteors.forEach(m => {
    m.y += m.speed;
  });

  meteors = meteors.filter(m => m.y < height + 50);

  for (const m of meteors) {
    if (pixelPerfectCollision(dino, m, dinoImg, meteorImg)) {
      gameOver = true;
      showRestartPrompt(`Game Over!\nDistance traveled: ${Math.floor(distance)}`);
      break;
    }
  }
}

function draw() {
  ctx.fillStyle = '#006400';
  ctx.fillRect(0, 0, width, height);

  ctx.drawImage(dinoImg, dino.x, dino.y, dino.width, dino.height);

  meteors.forEach(m => {
    ctx.drawImage(meteorImg, m.x, m.y, m.width, m.height);
  });
}

function updateScoreDisplay() {
  document.getElementById('score').innerText = `Distance: ${Math.floor(distance)}`;
}

let lastTime = 0;
function gameLoop(timestamp = 0) {
  if (!lastTime) lastTime = timestamp;
  const delta = timestamp - lastTime;
  lastTime = timestamp;

  update(delta);
  draw();

  if (!gameOver) {
    requestAnimationFrame(gameLoop);
  }
}

let dragging = false;
let dragX = 0;
canvas.addEventListener('touchstart', e => {
  dragging = true;
  dragX = e.touches[0].clientX;
});
canvas.addEventListener('touchmove', e => {
  if (!dragging) return;
  const touchX = e.touches[0].clientX;
  const diff = touchX - dragX;
  dino.x += diff;
  if (dino.x < 0) dino.x = 0;
  if (dino.x > width - dino.width) dino.x = width - dino.width;
  dragX = touchX;
  e.preventDefault();
});
canvas.addEventListener('touchend', e => {
  dragging = false;
});

const restartPrompt = document.getElementById('restartPrompt');
const restartMessage = document.getElementById('restartMessage');
const restartBtn = document.getElementById('restartBtn');

function showRestartPrompt(message) {
  restartMessage.textContent = message;
  restartPrompt.style.display = 'block';
}

function hideRestartPrompt() {
  restartPrompt.style.display = 'none';
}

restartBtn.addEventListener('click', () => {
  hideRestartPrompt();
  resetGame();
});

let imagesLoaded = 0;
dinoImg.onload = () => {
  imagesLoaded++;
  if (imagesLoaded === 2) resetGame();
};
dinoImg.onerror = () => console.error('Failed to load dinosaur.png');

meteorImg.onload = () => {
  meteorAspectRatio = meteorImg.naturalWidth / meteorImg.naturalHeight;
  imagesLoaded++;
  if (imagesLoaded === 2) resetGame();
};
meteorImg.onerror = () => console.error('Failed to load meteor.png');
