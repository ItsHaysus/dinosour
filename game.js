if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(err => {
      console.log('Service Worker registration failed:', err);
    });
  });
}
(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const uiRoom = document.getElementById('roomNumber');
  const uiBirdsLeft = document.getElementById('birdsLeft');
  const uiHitsLeft = document.getElementById('hitsLeft');
  const messageBox = document.getElementById('messageBox');
  const messageText = document.getElementById('messageText');
  const confirmBtn = document.getElementById('confirmBtn');

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  // Game variables
  let room = 1;
  let birdsToEat = 5;
  let birds = [];
  let hitsLeft = 3;
  let gameOver = false;

  // Dinosaur player
  const dino = {
    x: WIDTH / 2,
    y: HEIGHT - 60,
    width: 60,
    height: 60,
    speed: 5,
    color: '#557722',
    dx: 0,
    dy: 0,
    draw() {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.beginPath();
      ctx.ellipse(this.x + this.width/2, this.y - 10, 15, 20, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tail
      ctx.beginPath();
      ctx.moveTo(this.x - this.width/2, this.y);
      ctx.lineTo(this.x - this.width/2 - 25, this.y + 15);
      ctx.lineTo(this.x - this.width/2 - 10, this.y + 10);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      this.x += this.dx;
      this.y += this.dy;

      // Keep inside canvas
      if (this.x < this.width/2) this.x = this.width/2;
      if (this.x > WIDTH - this.width/2) this.x = WIDTH - this.width/2;
      if (this.y < this.height/2) this.y = this.height/2;
      if (this.y > HEIGHT - this.height/2) this.y = HEIGHT - this.height/2;
    },
    rect() {
      return {
        left: this.x - this.width/2,
        right: this.x + this.width/2,
        top: this.y - this.height/2,
        bottom: this.y + this.height/2,
      };
    }
  };

  // Birds
  class Bird {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.size = 30;
      this.color = '#aa2233';
      this.speed = 2 + Math.random() * 2;
      this.direction = Math.random() < 0.5 ? 1 : -1;
      this.alive = true;
      this.attackCooldown = 0;
      this.state = 'patrol';
      this.attackSpeed = 5;
      this.attackTargetX = null;
      this.attackTargetY = null;
    }

    draw() {
      if (!this.alive) return;

      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, this.size/2, this.size/3, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x + 15 * this.direction, this.y - 10);
      ctx.lineTo(this.x + 15 * this.direction, this.y + 10);
      ctx.closePath();
      ctx.fill();
    }

    update() {
      if (!this.alive) return;

      if(this.state === 'patrol') {
        this.x += this.speed * this.direction;

        if (this.x < this.size/2 || this.x > WIDTH - this.size/2) {
          this.direction *= -1;
        }

        if (this.attackCooldown <= 0 && Math.random() < 0.01) {
          this.state = 'attack';
          this.attackTargetX = dino.x;
          this.attackTargetY = dino.y;
        } else {
          this.attackCooldown--;
        }
      }
      else if (this.state === 'attack') {
        let dx = this.attackTargetX - this.x;
        let dy = this.attackTargetY - this.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < this.attackSpeed || dist === 0) {
          this.state = 'patrol';
          this.attackCooldown = 100 + Math.floor(Math.random()*100);
        } else {
          this.x += this.attackSpeed * dx / dist;
          this.y += this.attackSpeed * dy / dist;
        }
      }
    }

    rect() {
      return {
        left: this.x - this.size/2,
        right: this.x + this.size/2,
        top: this.y - this.size/3,
        bottom: this.y + this.size/3,
      };
    }
  }

  // Input
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
  });
  window.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
  });

  // Helpers
  function rectsOverlap(r1, r2) {
    return !(r2.left > r1.right ||
             r2.right < r1.left ||
             r2.top > r1.bottom ||
             r2.bottom < r1.top);
  }

  // Spawn birds for the room
  function spawnBirds(count) {
    birds = [];
    for(let i = 0; i < count; i++) {
      let x = 50 + Math.random() * (WIDTH - 100);
      let y = 50 + Math.random() * (HEIGHT / 2 - 60);
      birds.push(new Bird(x, y));
    }
  }

  function resetGame() {
    room = 1;
    hitsLeft = 3;
    birdsToEat = 5;
    spawnBirds(birdsToEat);
    updateUI();
    gameOver = false;
    messageBox.style.display = 'none';
    dino.x = WIDTH / 2;
    dino.y = HEIGHT - 60;
  }

  function nextRoom() {
    room++;
    birdsToEat = 5 + room * 2;
    spawnBirds(birdsToEat);
    updateUI();
  }

  function updateUI() {
    uiRoom.textContent = room;
    uiBirdsLeft.textContent = birdsToEat;
    uiHitsLeft.textContent = hitsLeft;
  }

  function showMessage(text) {
    messageText.textContent = text;
    messageBox.style.display = 'block';
  }

  confirmBtn.addEventListener('click', () => {
    resetGame();
  });

  // Game loop
  function gameLoop() {
    if (gameOver) {
      requestAnimationFrame(gameLoop);
      return;
    }

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    dino.dx = 0;
    dino.dy = 0;
    if (keys['arrowleft'] || keys['a']) dino.dx = -dino.speed;
    if (keys['arrowright'] || keys['d']) dino.dx = dino.speed;
    if (keys['arrowup'] || keys['w']) dino.dy = -dino.speed;
    if (keys['arrowdown'] || keys['s']) dino.dy = dino.speed;
    dino.update();

    dino.draw();

    birds.forEach(bird => {
      bird.update();
      bird.draw();
    });

    birds.forEach((bird) => {
      if (!bird.alive) return;

      if (rectsOverlap(dino.rect(), bird.rect())) {
        bird.alive = false;
        birdsToEat--;
        updateUI();

        if (birdsToEat <= 0) {
          setTimeout(() => {
            nextRoom();
          }, 1000);
        }
      }
    });

    birds.forEach(bird => {
      if (!bird.alive) return;
      if (bird.state === 'attack' && rectsOverlap(dino.rect(), bird.rect())) {
        bird.state = 'patrol';
        bird.attackCooldown = 100;
        hitsLeft--;
        updateUI();
        if (hitsLeft <= 0) {
          gameOver = true;
          showMessage(`You died in room ${room}!`);
        }
      }
    });

    requestAnimationFrame(gameLoop);
  }

  resetGame();
  gameLoop();
})();
