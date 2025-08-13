const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const width = canvas.width;
const height = canvas.height;

let keys = {};
let touchX = null;
let touchY = null;

// Game state
let score = 0;
let enemiesLeft = 0;
let hitsLeft = 3;

const dinosaur = {
  x: width / 2 - 20,
  y: height - 80,
  width: 40,
  height: 40,
  speed: 4,
  color: "#228B22",
};

class Bird {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 20;
    this.speed = 2;
    this.direction = 1;
    this.projectiles = [];
    this.shootCooldown = 0;
    this.color = "#555";
  }
  update() {
    this.x += this.speed * this.direction;
    if (this.x <= 0 || this.x + this.width >= width) {
      this.direction *= -1;
    }
    if (this.shootCooldown > 0) this.shootCooldown--;
    else {
      this.shoot();
      this.shootCooldown = 100; // cooldown frames
    }
    this.projectiles.forEach((p, i) => {
      p.update();
      if (p.y > height) {
        this.projectiles.splice(i, 1);
      }
    });
  }
  shoot() {
    this.projectiles.push(new Projectile(this.x + this.width / 2, this.y + this.height));
  }
  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#222";
    this.projectiles.forEach(p => p.draw());
  }
}

class Projectile {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 5;
    this.speed = 6;
    this.color = "black";
  }
  update() {
    this.y += this.speed;
  }
  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Enemy array
let birds = [];
const enemiesPerRoom = 5;

// Initialize new room
function setupRoom() {
  birds = [];
  hitsLeft = 3;
  enemiesLeft = enemiesPerRoom;
  for (let i = 0; i < enemiesPerRoom; i++) {
    const x = Math.random() * (width - 30);
    const y = 50 + Math.random() * 100;
    birds.push(new Bird(x, y));
  }
  updateUI();
}

// Collision helpers
function rectsCollide(r1, r2) {
  return !(r2.x > r1.x + r1.width ||
           r2.x + r2.width < r1.x ||
           r2.y > r1.y + r1.height ||
           r2.y + r2.height < r1.y);
}

function circleRectCollision(circle, rect) {
  let distX = Math.abs(circle.x - rect.x - rect.width / 2);
  let distY = Math.abs(circle.y - rect.y - rect.height / 2);

  if (distX > (rect.width / 2 + circle.radius)) return false;
  if (distY > (rect.height / 2 + circle.radius)) return false;

  if (distX <= (rect.width / 2)) return true;
  if (distY <= (rect.height / 2)) return true;

  let dx = distX - rect.width / 2;
  let dy = distY - rect.height / 2;
  return (dx * dx + dy * dy <= (circle.radius * circle.radius));
}

// Update UI
function updateUI() {
  document.getElementById("score").textContent = score;
  document.getElementById("enemiesLeft").textContent = enemiesLeft;
  document.getElementById("hitsLeft").textContent = hitsLeft;
}

// Game loop
function update() {
  // Move dinosaur
  if (keys["ArrowLeft"] && dinosaur.x > 0) dinosaur.x -= dinosaur.speed;
  if (keys["ArrowRight"] && dinosaur.x + dinosaur.width < width) dinosaur.x += dinosaur.speed;
  if (keys["ArrowUp"] && dinosaur.y > height / 2) dinosaur.y -= dinosaur.speed;
  if (keys["ArrowDown"] && dinosaur.y + dinosaur.height < height) dinosaur.y += dinosaur.speed;

  // Touch move (simple follow)
  if (touchX !== null && touchY !== null) {
    let dx = touchX - (dinosaur.x + dinosaur.width / 2);
    let dy = touchY - (dinosaur.y + dinosaur.height / 2);
    let dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > dinosaur.speed) {
      dinosaur.x += (dx / dist) * dinosaur.speed;
      dinosaur.y += (dy / dist) * dinosaur.speed;
    }
  }

  // Update birds and their projectiles
  birds.forEach((bird, bIndex) => {
    bird.update();

    // Ch
