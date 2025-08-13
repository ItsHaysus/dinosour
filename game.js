document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // Game variables
  let distance = 0;
  let gameSpeed = 3; // decreased speed
  let obstacles = [];
  let gameOver = false;
  let obstacleInterval = 90;
  let obstacleTimer = 0;

  // Dino properties, will be scaled
  let dino = {
    x: 50,
    y: 0,      // set later based on canvas height
    width: 50,
    height: 50,
    dy: 0,
    gravity: 0.5,
    jumpForce: -15,
    grounded: false,
    jumping: false,
  };

  const dinoImg = new Image();
  dinoImg.src = 'dinosaur.png';

  // Resize canvas and reset ground/dino on window resize
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Adjust dino size relative to screen height (about 1/4th height)
    dino.height = canvas.height / 4;
    dino.width = dino.height; // square

    // Position dino above ground
    dino.y = canvas.height - groundHeight() - dino.height;

    if (dino.y + dino.height > canvas.height) {
      dino.y = canvas.height - dino.height;
    }
  }

  // Ground height relative to canvas height (like 10% of height)
  function groundHeight() {
    return canvas.height * 0.1;
  }

  // Jump function
  function jump() {
    if (!gameOver && dino.grounded) {
      dino.dy = dino.jumpForce;
      dino.grounded = false;
      dino.jumping = true;
    }
  }

  // Event listeners for jump input
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      jump();
    }
  });
  document.addEventListener('touchstart', (e) => {
    e.preventDefault();
    jump();
  }, { passive: false });
  document.addEventListener('mousedown', () => {
    jump();
  });

  // Create obstacles scaled to screen
  function createObstacle() {
    const height = (30 + Math.random() * 20) * (canvas.height / 200);
    obstacles.push({
      x: canvas.width,
      y: canvas.height - groundHeight() - height,
      width: 20 * (canvas.width / 800), // scale width
      height: height,
    });
  }

  // Reset game function
  function resetGame() {
    distance = 0;
    obstacles = [];
    dino.dy = 0;
    dino.grounded = false;
    gameSpeed = 3;
    obstacleInterval = 90;
    obstacleTimer = 0;
    gameOver = false;
    document.getElementById('restart-btn').style.display = 'none';

    resize();
    loop();
  }

  document.getElementById('restart-btn').addEventListener('click', () => {
    resetGame();
  });

  // Main game loop
  function loop() {
    if (gameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw ground
    ctx.fillStyle = '#555';
    ctx.fillRect(0, canvas.height - groundHeight(), canvas.width, groundHeight());

    // Dino physics
    dino.dy += dino.gravity;
    dino.y += dino.dy;

    if (dino.y + dino.height >= canvas.height - groundHeight()) {
      dino.y = canvas.height - groundHeight() - dino.height;
      dino.dy = 0;
      dino.grounded = true;
      dino.jumping = false;
    }

    // Draw dino
    ctx.drawImage(dinoImg, dino.x, dino.y, dino.width, dino.height);

    // Increase difficulty every 100 distance
    const difficultyLevel = Math.floor(distance / 250);
    gameSpeed = 3 + difficultyLevel * 1.5;
    obstacleInterval = Math.max(30, 90 - difficultyLevel * 10);

    // Spawn obstacles
    obstacleTimer++;
    if (obstacleTimer > obstacleInterval) {
      createObstacle();
      obstacleTimer = 0;
    }

    // Update obstacles
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

      // Remove obstacles off screen
      if (obs.x + obs.width < 0) {
        obstacles.splice(i, 1);
        i--;
      }
    }

    // Update distance score
    distance += 0.1;
    document.getElementById('score').textContent = `Distance: ${Math.floor(distance)}`;

    requestAnimationFrame(loop);
  }

  // Initial setup
  window.addEventListener('resize', resize);

  dinoImg.onload = () => {
    resetGame();
  };

  // Run initial resize to set sizes
  resize();
});
