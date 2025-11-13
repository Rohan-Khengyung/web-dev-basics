const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreBoard = document.getElementById("scoreBoard");

let baseWidth = 500;
let baseHeight = 600;

function resizeCanvas() {
  const width = Math.min(window.innerWidth * 0.9, 500);
  const height = Math.min(window.innerHeight * 0.7, 600);
  canvas.width = width;
  canvas.height = height;

  scaleX = canvas.width / baseWidth;
  scaleY = canvas.height / baseHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

let basket = {
  x: 0,
  y: 0,
  width: 80,
  height: 20,
  speed: 7
};

let objects = [];
let score = 0;
let gameOver = false;

// Initialize basket position
function initBasket() {
  basket.width = 80 * scaleX;
  basket.height = 20 * scaleY;
  basket.y = canvas.height - basket.height - 10;
  if (basket.x === 0) basket.x = (canvas.width - basket.width) / 2;
}
initBasket();

// Movement controls
let rightPressed = false;
let leftPressed = false;

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") rightPressed = true;
  if (e.key === "ArrowLeft") leftPressed = true;
});
document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowRight") rightPressed = false;
  if (e.key === "ArrowLeft") leftPressed = false;
});

// Mouse controls
let isMouseDown = false;
canvas.addEventListener("mousedown", (e) => {
  isMouseDown = true;
  moveBasket(e.offsetX);
});
canvas.addEventListener("mouseup", () => (isMouseDown = false));
canvas.addEventListener("mousemove", (e) => {
  if (isMouseDown) moveBasket(e.offsetX);
});

// Touch controls
canvas.addEventListener("touchstart", (e) => {
  const touch = e.touches[0];
  moveBasket(getTouchPos(touch));
});
canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  moveBasket(getTouchPos(touch));
});

function getTouchPos(touch) {
  const rect = canvas.getBoundingClientRect();
  return touch.clientX - rect.left;
}

function moveBasket(positionX) {
  basket.x = positionX - basket.width / 2;
  if (basket.x < 0) basket.x = 0;
  if (basket.x + basket.width > canvas.width) basket.x = canvas.width - basket.width;
}

// Spawn falling objects
function spawnObject() {
  const radius = 15 * ((scaleX + scaleY) / 2);
  const x = Math.random() * (canvas.width - radius * 2) + radius;
  const y = -radius;
  const speed = (Math.random() * 2 + 2) * ((scaleY + scaleX) / 2);
  objects.push({ x, y, radius, speed });
}

function update() {
  if (gameOver) return;

  // Move basket
  const moveSpeed = basket.speed * scaleX;
  if (rightPressed && basket.x + basket.width < canvas.width) basket.x += moveSpeed;
  if (leftPressed && basket.x > 0) basket.x -= moveSpeed;

  // Move objects
  for (let i = 0; i < objects.length; i++) {
    objects[i].y += objects[i].speed;

    // Catch condition
    if (
      objects[i].y + objects[i].radius >= basket.y &&
      objects[i].x > basket.x &&
      objects[i].x < basket.x + basket.width
    ) {
      objects.splice(i, 1);
      score++;
      scoreBoard.textContent = "Score: " + score;
      i--;
      continue;
    }

    // Missed object
    if (objects[i].y > canvas.height) {
      gameOver = true;
      alert("Game Over! Final Score: " + score);
      document.location.reload();
    }
  }
}

// Draw everything
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Basket
  ctx.fillStyle = "#333";
  ctx.fillRect(basket.x, basket.y, basket.width, basket.height);

  // Falling objects
  for (let obj of objects) {
    ctx.beginPath();
    ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
    ctx.fillStyle = "tomato";
    ctx.fill();
    ctx.closePath();
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

setInterval(spawnObject, 1000);
gameLoop();
