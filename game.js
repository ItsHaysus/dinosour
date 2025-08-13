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
const METEOR_HEIGHT = 128;  // Change this value to resize meteors easily
// ============================================

// ====== Hitbox margin for smaller collision box =======
const HITBOX_MARGIN = 0;  // pixels to shrink hitbox on all sides
// ======================================================

const dino = {
  x: 0,
  y: 0,
  width: 128,  // bigger dinosaur width
  height: 128, // bigger dinosaur height
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

let meteorAspectRatio = 1; // default aspect ratio for meteors

function resetGame() {
  distance = 0;
  updateScoreDisplay(); // immediately reset score display on restart
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

function update(delta) {
  if (gameOver) return;

  distance += delta * 0.05;
  updateScoreDisplay();

  // Increase difficulty every 1 minute
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
    const dinoHitbox = {
      x: dino.x + HITBOX_MARGIN,
      y: dino.y + HITBOX_MARGIN,
      width: dino.width - HITBOX_MARGIN * 2,
      height: dino.height - HITBOX_MARGIN * 2,
    };

    const meteorHitbox = {
      x: m.x + HITBOX_MARGIN,
      y: m.y + HITBOX_MARGIN,
      width: m.width - HITBOX_MARGIN * 2,
      height: m.height - HITBOX_MARGIN * 2,
    };

    if (rectsOverlap(dinoHitbox, meteorHitbox)) {
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
