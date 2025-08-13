document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = 800;
  canvas.height = 200;

  const dinoImg = new Image();
  dinoImg.src = 'dinosaur.png';

  let distance = 0;
  let gameSpeed = 5;
  let obstacles = [];
  let gameOver = false;

  // Control obstacle spawn interval (decreases to spawn more frequently)
  let obstacleInterval = 90;
  let obstacleTimer = 0;

  const dino = {
    x: 50,
    y: 150,
    width: 50,
    height: 50,
    dy: 0,
    gravity: 1,
    jumpForce: -15,
    grounded: false,
    jumping: false,
  };

  function jump() {
    if (!gameOver && dino.grounded) {
      dino.dy = dino.jumpForce;
      dino.grounded = false;
      dino.jumping = true;
    }
  }

  // Jump on keyboard (space/up)
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      jump();
    }
  });

  // Jump on screen tap or mouse click
  document.addEventListener('touchstart', (e) => {
    e.preventDefault();
    jump();
  }, { passive: false });

  document.addEventListener('mousedown', () => {
    jump();
  });

  function createObstacle() {
    const height = 30 + Math.random() * 20;
    obstacles.push({
      x: canvas.width,
      y: canvas.height - height,
      width: 20,
      height: height,
    });
  }

  function resetGame() {
    distance = 0;
    obstacles = [];
    dino.y = 150;
    dino.dy = 0;
    gameSpeed = 5;
    obstacleInterval = 90;
    obstacleTimer = 0;
    gameOver = false;
    document.getElementById('restart-btn').style.display = 'none';
    loop();
  }

  document.getElementById('restart-btn').addEventListener('click', () => {
    resetGame();
  });

  function loop() {
    if (gameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Ground
    ctx.fillStyle = '#555';
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);

    // Dino physics
    dino.dy += dino.gravity;
    dino.y += dino.dy;

    if (dino.y + dino.height >= canvas.height - 20) {
      dino.y = canvas.height - 20 - dino.height;
      dino.dy = 0;
      dino.grounded = true;
      dino.jumping = false;
    }

    // Draw dino
    ctx.drawImage(dinoImg, dino.x, dino.y, dino.width, dino.height);

    // Increase difficulty every 100 distance
    const difficultyLevel = Math.floor(distance / 100);
    gameSpeed = 5 + difficultyLevel * 1.5;
    obstacleInterval = Math.max(30, 90 - difficultyLevel * 10);

    // Obstacles spawning
    obstacleTimer++;
    if (obstacleTimer > obstacleInterval) {
      createObstacle();
      obstacleTimer = 0;
    }

    // Update and draw obstacles
    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];
      obs.x -= gameSpeed;

      ctx.fillStyle = '#333';
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

      // Collision detection
      if (
        dino.x < obs.x + obs.width &&
        dino.x + dino.width > obs.x &&
        dino.y < obs.y + obs.height &&
        dino.y + dino.height > obs.y
      ) {
        gameOver = true;
        document.getElementById('restart-btn').style.display = 'block';
      }

      // Remove off-screen obstacles
      if (obs.x + obs.width < 0) {
        obstacles.splice(i, 1);
        i--;
      }
    }

    // Update score/distance
    distance += 0.1;
    document.getElementById('score').textContent = `Distance: ${Math.floor(distance)}`;

    requestAnimationFrame(loop);
  }

  dinoImg.onload = () => {
    loop();
  };
});
