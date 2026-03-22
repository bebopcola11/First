const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');

const W = canvas.width;
const H = canvas.height;

const PADDLE_W = 12;
const P1_PADDLE_H = H;       // BebopCola covers entire height
const P2_PADDLE_H = 30;      // Bobby is tiny
const PADDLE_SPEED = 5;
const BALL_SIZE = 22;
const WINNING_SCORE = 7;

const state = {
  running: false,
  over: false,
  ball: { x: W / 2, y: H / 2, vx: 0, vy: 0, angle: 0 },
  p1: { y: 0, score: 0 },
  p2: { y: H / 2 - P2_PADDLE_H / 2, score: 0 },
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
  state.p1.y = 0;
  state.p2.y = H / 2 - P2_PADDLE_H / 2;
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

function clampPaddle(y, h) {
  return Math.max(0, Math.min(H - h, y));
}

function update() {
  if (!state.running) return;

  // BebopCola (P1): W / S — paddle is full height so movement is cosmetic
  if (state.keys['KeyW']) state.p1.y = clampPaddle(state.p1.y - PADDLE_SPEED, P1_PADDLE_H);
  if (state.keys['KeyS']) state.p1.y = clampPaddle(state.p1.y + PADDLE_SPEED, P1_PADDLE_H);

  // Bobby (P2): Arrow keys
  if (state.keys['ArrowUp'])   state.p2.y = clampPaddle(state.p2.y - PADDLE_SPEED, P2_PADDLE_H);
  if (state.keys['ArrowDown']) state.p2.y = clampPaddle(state.p2.y + PADDLE_SPEED, P2_PADDLE_H);

  const b = state.ball;
  b.x += b.vx;
  b.y += b.vy;

  // Rotate ship based on velocity
  b.angle = Math.atan2(b.vy, b.vx);

  // Top / bottom wall bounce
  if (b.y - BALL_SIZE / 2 <= 0) {
    b.y = BALL_SIZE / 2;
    b.vy = Math.abs(b.vy);
  }
  if (b.y + BALL_SIZE / 2 >= H) {
    b.y = H - BALL_SIZE / 2;
    b.vy = -Math.abs(b.vy);
  }

  function hitPaddle(px, py, ph) {
    return (
      b.x - BALL_SIZE / 2 < px + PADDLE_W &&
      b.x + BALL_SIZE / 2 > px &&
      b.y + BALL_SIZE / 2 > py &&
      b.y - BALL_SIZE / 2 < py + ph
    );
  }

  const p1x = 20;
  const p2x = W - 20 - PADDLE_W;

  // Left paddle (BebopCola)
  if (b.vx < 0 && hitPaddle(p1x, state.p1.y, P1_PADDLE_H)) {
    b.x = p1x + PADDLE_W + BALL_SIZE / 2;
    const hit = (b.y - (state.p1.y + P1_PADDLE_H / 2)) / (P1_PADDLE_H / 2);
    const angle = hit * (Math.PI / 4);
    const speed = Math.min(Math.hypot(b.vx, b.vy) * 1.05, 14);
    b.vx = speed * Math.cos(angle);
    b.vy = speed * Math.sin(angle);
  }

  // Right paddle (Bobby)
  if (b.vx > 0 && hitPaddle(p2x, state.p2.y, P2_PADDLE_H)) {
    b.x = p2x - BALL_SIZE / 2;
    const hit = (b.y - (state.p2.y + P2_PADDLE_H / 2)) / (P2_PADDLE_H / 2);
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

function drawSpaceship(x, y, angle, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Engine glow
  const glowGrad = ctx.createRadialGradient(-size * 0.6, 0, 0, -size * 0.6, 0, size * 0.7);
  glowGrad.addColorStop(0, 'rgba(0, 150, 255, 0.8)');
  glowGrad.addColorStop(1, 'rgba(0, 0, 255, 0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(-size * 0.6, 0, size * 0.7, 0, Math.PI * 2);
  ctx.fill();

  // Main body
  ctx.fillStyle = '#c0c0ff';
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(-size * 0.6, -size * 0.45);
  ctx.lineTo(-size * 0.3, 0);
  ctx.lineTo(-size * 0.6, size * 0.45);
  ctx.closePath();
  ctx.fill();

  // Cockpit
  const cockpitGrad = ctx.createRadialGradient(size * 0.2, -size * 0.05, 0, size * 0.2, -size * 0.05, size * 0.25);
  cockpitGrad.addColorStop(0, '#88ffff');
  cockpitGrad.addColorStop(1, '#0044aa');
  ctx.fillStyle = cockpitGrad;
  ctx.beginPath();
  ctx.ellipse(size * 0.15, 0, size * 0.25, size * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wings
  ctx.fillStyle = '#8888cc';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size * 0.5, -size * 0.9);
  ctx.lineTo(-size * 0.6, -size * 0.45);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size * 0.5, size * 0.9);
  ctx.lineTo(-size * 0.6, size * 0.45);
  ctx.closePath();
  ctx.fill();

  // Engine flames
  const flameLen = size * (0.5 + Math.random() * 0.4);
  const flameGrad = ctx.createLinearGradient(-size * 0.3, 0, -size * 0.3 - flameLen, 0);
  flameGrad.addColorStop(0, 'rgba(255,200,50,1)');
  flameGrad.addColorStop(0.5, 'rgba(255,80,0,0.8)');
  flameGrad.addColorStop(1, 'rgba(255,0,0,0)');
  ctx.fillStyle = flameGrad;
  ctx.beginPath();
  ctx.moveTo(-size * 0.3, -size * 0.15);
  ctx.lineTo(-size * 0.3 - flameLen, 0);
  ctx.lineTo(-size * 0.3, size * 0.15);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function draw() {
  // Space background
  ctx.fillStyle = '#000008';
  ctx.fillRect(0, 0, W, H);

  // Stars
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  // Use a seeded pattern for stable stars
  for (let i = 0; i < 80; i++) {
    const sx = ((i * 173 + 11) % W);
    const sy = ((i * 97 + 37) % H);
    const sr = (i % 3 === 0) ? 1.5 : 0.8;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Center dashed line
  ctx.setLineDash([10, 10]);
  ctx.strokeStyle = '#224';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2, 0);
  ctx.lineTo(W / 2, H);
  ctx.stroke();
  ctx.setLineDash([]);

  // Player names
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#00ffff';
  ctx.fillText('BebopCola', W / 4, 80);
  ctx.fillStyle = '#ff6666';
  ctx.fillText('Bobby', (W * 3) / 4, 80);

  // Scores
  ctx.font = 'bold 48px monospace';
  ctx.fillStyle = '#00ffff';
  ctx.fillText(state.p1.score, W / 4, 60);
  ctx.fillStyle = '#ff6666';
  ctx.fillText(state.p2.score, (W * 3) / 4, 60);

  // BebopCola paddle (full height, glowing cyan)
  const p1Grad = ctx.createLinearGradient(20, 0, 20 + PADDLE_W, 0);
  p1Grad.addColorStop(0, '#00ffff');
  p1Grad.addColorStop(1, '#004488');
  ctx.fillStyle = p1Grad;
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 12;
  ctx.fillRect(20, state.p1.y, PADDLE_W, P1_PADDLE_H);
  ctx.shadowBlur = 0;

  // Bobby paddle (tiny, glowing red)
  const p2Grad = ctx.createLinearGradient(W - 20 - PADDLE_W, 0, W - 20, 0);
  p2Grad.addColorStop(0, '#884400');
  p2Grad.addColorStop(1, '#ff4444');
  ctx.fillStyle = p2Grad;
  ctx.shadowColor = '#ff4444';
  ctx.shadowBlur = 10;
  ctx.fillRect(W - 20 - PADDLE_W, state.p2.y, PADDLE_W, P2_PADDLE_H);
  ctx.shadowBlur = 0;

  // Spaceship ball
  drawSpaceship(state.ball.x, state.ball.y, state.ball.angle, BALL_SIZE / 2);

  // Overlay messages
  if (!state.running && !state.over) {
    ctx.fillStyle = 'rgba(0,0,20,0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 40px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SPACE PONG', W / 2, H / 2 - 40);
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText('Press SPACE to start', W / 2, H / 2 + 10);
    ctx.font = '14px monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText('BebopCola: W/S   |   Bobby: ↑/↓', W / 2, H / 2 + 45);
  }

  if (state.over) {
    ctx.fillStyle = 'rgba(0,0,20,0.75)';
    ctx.fillRect(0, 0, W, H);
    ctx.font = 'bold 40px monospace';
    ctx.textAlign = 'center';
    const winner = state.p1.score >= WINNING_SCORE ? 'BebopCola' : 'Bobby';
    ctx.fillStyle = state.p1.score >= WINNING_SCORE ? '#00ffff' : '#ff6666';
    ctx.fillText(`${winner} wins!`, W / 2, H / 2 - 20);
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText('Press SPACE to play again', W / 2, H / 2 + 30);
  }

  if (!state.running && !state.over && (state.p1.score > 0 || state.p2.score > 0)) {
    ctx.fillStyle = 'rgba(0,0,20,0.65)';
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
