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

const dino = {
  x: 0,
  y: 0,
  width: 64,
  height: 64,
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

// Place dino initially at bottom center
function resetGame() {
  distance = 0;
  meteors = [];
  gameOver = false;
  meteorInterval = 1500;
  meteorSpeed = 3;
  startTime = performance.now();
  dino.x = width / 2 - dino.width / 2;
  dino.y = height - dino.height - 20;
  lastMeteorTime = 0;
  requestAnimationFrame(gameLoop);
}

function spawnMeteor() {
  const x = Math.random() * (width - 48);
  meteors.push({ x, y: -48, width: 48, height: 48, speed: meteorSpeed });
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

  distance += delta * 0.1;

  // Increase difficulty every 1 minute
  const elapsed = performance.now() - startTime;
  if (elapsed > difficultyIncreaseTime) {
    startTime = performance.now();
    meteorSpeed += 1;
    meteorInterval = Math.max(400, meteorInterval - 200);
  }

  // Spawn meteors
  if (performance.now() - lastMeteorTime > meteorInterval) {
    spawnMeteor();
    lastMeteorTime = performance.now();
  }

  // Update meteors position
  meteors.forEach(m => {
    m.y += m.speed;
  });

  // Remove meteors out of screen
  meteors = meteors.filter(m => m.y < height + 50);

  // Check collision
  for (const m of meteors) {
    if (rectsOverlap(dino, m)) {
      gameOver = true;
      setTimeout(() => {
        if (confirm(`Game Over!\nDistance traveled: ${Math.floor(distance)}\nRestart?`)) {
          resetGame();
        }
      }, 100);
      break;
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, width, height);

  // Draw dinosaur
  ctx.drawImage(dinoImg, dino.x, dino.y, dino.width, dino.height);

  // Draw meteors
  meteors.forEach(m => {
    ctx.drawImage(meteorImg, m.x, m.y, m.width, m.height);
  });

  // Update score display
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

// Control dino horizontal movement on touch drag
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

// Start game after images loaded
let imagesLoaded = 0;
[dinoImg, meteorImg].forEach(img => {
  img.onload = () => {
    imagesLoaded++;
    if (imagesLoaded === 2) resetGame();
  };
});
