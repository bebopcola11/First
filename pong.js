const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');

const W = canvas.width;
const H = canvas.height;

const PADDLE_W = 12;
const PADDLE_H = 80;
const PADDLE_SPEED = 5;
const BALL_SIZE = 10;
const WINNING_SCORE = 7;

const state = {
  running: false,
  over: false,
  ball: { x: W / 2, y: H / 2, vx: 0, vy: 0 },
  p1: { y: H / 2 - PADDLE_H / 2, score: 0 },
  p2: { y: H / 2 - PADDLE_H / 2, score: 0 },
  keys: {},
};

function resetBall(direction = 1) {
  state.ball.x = W / 2;
  state.ball.y = H / 2;
  const angle = (Math.random() * Math.PI) / 4 - Math.PI / 8;
  const speed = 5;
  state.ball.vx = direction * speed * Math.cos(angle);
  state.ball.vy = speed * Math.sin(angle);
}

function startGame() {
  state.p1.score = 0;
  state.p2.score = 0;
  state.p1.y = H / 2 - PADDLE_H / 2;
  state.p2.y = H / 2 - PADDLE_H / 2;
  state.over = false;
  resetBall(Math.random() < 0.5 ? 1 : -1);
  state.running = true;
}

document.addEventListener('keydown', e => {
  state.keys[e.code] = true;
  if (e.code === 'Space') {
    e.preventDefault();
    if (state.over || !state.running) {
      startGame();
    } else {
      state.running = !state.running;
    }
  }
});
document.addEventListener('keyup', e => { state.keys[e.code] = false; });

function clampPaddle(y) {
  return Math.max(0, Math.min(H - PADDLE_H, y));
}

function update() {
  if (!state.running) return;

  // Player 1: W / S
  if (state.keys['KeyW']) state.p1.y = clampPaddle(state.p1.y - PADDLE_SPEED);
  if (state.keys['KeyS']) state.p1.y = clampPaddle(state.p1.y + PADDLE_SPEED);

  // Player 2: Arrow keys
  if (state.keys['ArrowUp'])   state.p2.y = clampPaddle(state.p2.y - PADDLE_SPEED);
  if (state.keys['ArrowDown']) state.p2.y = clampPaddle(state.p2.y + PADDLE_SPEED);

  const b = state.ball;
  b.x += b.vx;
  b.y += b.vy;

  // Top / bottom wall bounce
  if (b.y - BALL_SIZE / 2 <= 0) {
    b.y = BALL_SIZE / 2;
    b.vy = Math.abs(b.vy);
  }
  if (b.y + BALL_SIZE / 2 >= H) {
    b.y = H - BALL_SIZE / 2;
    b.vy = -Math.abs(b.vy);
  }

  // Paddle collision helper
  function hitPaddle(px, py) {
    return (
      b.x - BALL_SIZE / 2 < px + PADDLE_W &&
      b.x + BALL_SIZE / 2 > px &&
      b.y + BALL_SIZE / 2 > py &&
      b.y - BALL_SIZE / 2 < py + PADDLE_H
    );
  }

  const p1x = 20;
  const p2x = W - 20 - PADDLE_W;

  // Left paddle (P1)
  if (b.vx < 0 && hitPaddle(p1x, state.p1.y)) {
    b.x = p1x + PADDLE_W + BALL_SIZE / 2;
    const hit = (b.y - (state.p1.y + PADDLE_H / 2)) / (PADDLE_H / 2);
    const angle = hit * (Math.PI / 4);
    const speed = Math.min(Math.hypot(b.vx, b.vy) * 1.05, 14);
    b.vx = speed * Math.cos(angle);
    b.vy = speed * Math.sin(angle);
  }

  // Right paddle (P2)
  if (b.vx > 0 && hitPaddle(p2x, state.p2.y)) {
    b.x = p2x - BALL_SIZE / 2;
    const hit = (b.y - (state.p2.y + PADDLE_H / 2)) / (PADDLE_H / 2);
    const angle = hit * (Math.PI / 4);
    const speed = Math.min(Math.hypot(b.vx, b.vy) * 1.05, 14);
    b.vx = -speed * Math.cos(angle);
    b.vy = speed * Math.sin(angle);
  }

  // Scoring
  if (b.x < 0) {
    state.p2.score++;
    if (state.p2.score >= WINNING_SCORE) { state.running = false; state.over = true; }
    else resetBall(1);
  }
  if (b.x > W) {
    state.p1.score++;
    if (state.p1.score >= WINNING_SCORE) { state.running = false; state.over = true; }
    else resetBall(-1);
  }
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  // Center dashed line
  ctx.setLineDash([10, 10]);
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2, 0);
  ctx.lineTo(W / 2, H);
  ctx.stroke();
  ctx.setLineDash([]);

  // Scores
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(state.p1.score, W / 4, 60);
  ctx.fillText(state.p2.score, (W * 3) / 4, 60);

  // Paddles
  ctx.fillStyle = '#fff';
  ctx.fillRect(20, state.p1.y, PADDLE_W, PADDLE_H);
  ctx.fillRect(W - 20 - PADDLE_W, state.p2.y, PADDLE_W, PADDLE_H);

  // Ball
  ctx.fillStyle = '#fff';
  ctx.fillRect(
    state.ball.x - BALL_SIZE / 2,
    state.ball.y - BALL_SIZE / 2,
    BALL_SIZE,
    BALL_SIZE
  );

  // Overlay messages
  if (!state.running && !state.over) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PONG', W / 2, H / 2 - 30);
    ctx.font = '20px monospace';
    ctx.fillText('Press SPACE to start', W / 2, H / 2 + 20);
    ctx.font = '15px monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText('P1: W/S   |   P2: ↑/↓', W / 2, H / 2 + 55);
  }

  if (state.over) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    const winner = state.p1.score >= WINNING_SCORE ? 'Player 1' : 'Player 2';
    ctx.fillText(`${winner} wins!`, W / 2, H / 2 - 20);
    ctx.font = '20px monospace';
    ctx.fillText('Press SPACE to play again', W / 2, H / 2 + 30);
  }

  if (state.running === false && !state.over && (state.p1.score > 0 || state.p2.score > 0)) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 30px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', W / 2, H / 2);
    ctx.font = '18px monospace';
    ctx.fillText('Press SPACE to resume', W / 2, H / 2 + 40);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
