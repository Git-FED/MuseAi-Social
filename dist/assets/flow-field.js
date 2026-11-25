(() => {
  const canvas = document.querySelector('.flow-field');
  if (!canvas) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduceMotion.matches) return;

  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  if (!ctx) return;
  let width = 0;
  let height = 0;
  let scale = 1;
  let frame = 0;
  let lastPaint = 0;
  let paused = document.hidden;
  const TAU = Math.PI * 2;

  function resize() {
    scale = Math.min(window.devicePixelRatio || 1, 1.5);
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }

  function draw(now) {
    if (paused) { frame = 0; return; }
    if (now - lastPaint < 32) { frame = requestAnimationFrame(draw); return; }
    lastPaint = now;
    const t = now * 0.000055;
    ctx.clearRect(0, 0, width, height);
    const bandHeight = Math.min(height * 0.64, 620);
    const centerY = height * 0.47 + Math.sin(t * 0.7) * height * 0.035;
    const lines = Math.max(28, Math.min(48, Math.round(height / 19)));
    const xStep = Math.max(13, Math.round(width / 96));
    const gradient = ctx.createLinearGradient(0, 0, width, height * 0.14);
    gradient.addColorStop(0, 'rgba(124,92,252,0.02)');
    gradient.addColorStop(0.27, 'rgba(124,92,252,0.31)');
    gradient.addColorStop(0.56, 'rgba(198,135,245,0.25)');
    gradient.addColorStop(0.73, 'rgba(244,114,182,0.25)');
    gradient.addColorStop(1, 'rgba(124,92,252,0.035)');

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = gradient;
    for (let row = 0; row < lines; row++) {
      const n = row / (lines - 1) - 0.5;
      const base = centerY + n * bandHeight;
      const rowPhase = row * 0.18;
      const alpha = 0.22 + (1 - Math.abs(n) * 1.65) * 0.2;
      ctx.globalAlpha = Math.max(0.035, alpha);
      ctx.beginPath();
      for (let x = -8; x <= width + 8; x += xStep) {
        const u = x / Math.max(width, 1);
        const longWave = Math.sin(u * TAU * 1.24 + t * 2.1 + rowPhase) * height * 0.033;
        const crossWave = Math.sin(u * TAU * 2.63 - t * 1.15 + rowPhase * 0.63) * height * 0.011;
        const movingFold = Math.sin(u * TAU * 0.46 - t * 0.78) * height * 0.095;
        const foldCenter = 0.5 + Math.sin(t * 0.61) * 0.18;
        const fold = Math.exp(-Math.pow((u - foldCenter) / 0.23, 2));
        const crease = Math.sin(u * TAU * 4.1 + t * 1.3 + rowPhase * 0.38) * height * 0.019 * fold;
        const y = base + longWave + crossWave + movingFold * (0.22 - Math.abs(n)) + crease;
        if (x === -8) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
    frame = requestAnimationFrame(draw);
  }

  function start() {
    if (!paused && !frame) frame = requestAnimationFrame(draw);
  }
  function stop() {
    paused = true;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }
  function visibility() {
    paused = document.hidden;
    if (paused) stop();
    else start();
  }

  resize();
  start();
  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', visibility);
  reduceMotion.addEventListener?.('change', event => event.matches ? stop() : (paused = false, start()));
})();
