/**
 * Pune Corporate Cars - Automotive Engineering & Car Tools Background Canvas
 * Redesigned in Luxury Black, Gold & Silver Palette:
 * - Luxury Gold: #C9A24A
 * - Light Gold: #E5C77B
 * - Silver Grey: #D9D9D9
 * - Subtle ambient opacity for maximum luxury legibility
 */

(function () {
  const canvas = document.getElementById('carToolsCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  let mouse = { x: width / 2, y: height / 2, active: false };

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    initElements();
  });

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  });

  window.addEventListener('mouseleave', () => {
    mouse.active = false;
  });

  const elements = [];
  const particles = [];

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  // Draw Gears with Luxury Gold / Silver styling
  function drawGear(ctx, x, y, radius, teeth, angle, color, strokeWidth = 1.2) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;

    const step = (Math.PI * 2) / teeth;
    ctx.beginPath();
    for (let i = 0; i < teeth; i++) {
      const a = i * step;
      const rInner = radius * 0.84;
      const rOuter = radius * 1.1;

      const p1x = Math.cos(a) * rInner;
      const p1y = Math.sin(a) * rInner;
      const p2x = Math.cos(a + step * 0.2) * rOuter;
      const p2y = Math.sin(a + step * 0.2) * rOuter;
      const p3x = Math.cos(a + step * 0.5) * rOuter;
      const p3y = Math.sin(a + step * 0.5) * rOuter;
      const p4x = Math.cos(a + step * 0.7) * rInner;
      const p4y = Math.sin(a + step * 0.7) * rInner;

      if (i === 0) ctx.moveTo(p1x, p1y);
      else ctx.lineTo(p1x, p1y);
      ctx.lineTo(p2x, p2y);
      ctx.lineTo(p3x, p3y);
      ctx.lineTo(p4x, p4y);
    }
    ctx.closePath();
    ctx.stroke();

    // Inner axle ring
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.42, 0, Math.PI * 2);
    ctx.stroke();

    // Center hub hole
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.16, 0, Math.PI * 2);
    ctx.stroke();

    // Spokes
    for (let s = 0; s < 4; s++) {
      ctx.beginPath();
      ctx.rotate(Math.PI / 2);
      ctx.moveTo(radius * 0.16, 0);
      ctx.lineTo(radius * 0.42, 0);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Draw Precision Wrench
  function drawWrench(ctx, x, y, length, angle, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.strokeStyle = color;
    ctx.fillStyle = 'rgba(8, 8, 8, 0.3)';
    ctx.lineWidth = 1.2;

    const headR = length * 0.22;
    const shaftW = length * 0.12;
    const halfL = length / 2;

    ctx.beginPath();
    // Open-end head
    ctx.arc(-halfL, 0, headR, 0.5, 5.8, false);
    ctx.lineTo(halfL - headR * 0.9, shaftW / 2);
    ctx.arc(halfL, 0, headR * 0.85, 0.7, 5.6, false);
    ctx.lineTo(-halfL + headR * 0.9, -shaftW / 2);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(halfL, 0, headR * 0.45, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // Draw Luxury Speedometer Dial
  function drawGauge(ctx, x, y, radius, needleAngle, color, accentColor) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    ctx.arc(0, 0, radius, Math.PI * 0.75, Math.PI * 2.25);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.86, Math.PI * 0.75, Math.PI * 2.25);
    ctx.strokeStyle = 'rgba(217, 217, 217, 0.08)';
    ctx.stroke();

    const totalTicks = 16;
    for (let t = 0; t <= totalTicks; t++) {
      const a = Math.PI * 0.75 + (t / totalTicks) * (Math.PI * 1.5);
      ctx.strokeStyle = color;
      ctx.lineWidth = t % 4 === 0 ? 1.8 : 1;

      const inner = t % 4 === 0 ? radius * 0.72 : radius * 0.8;
      const x1 = Math.cos(a) * inner;
      const y1 = Math.sin(a) * inner;
      const x2 = Math.cos(a) * (radius * 0.95);
      const y2 = Math.sin(a) * (radius * 0.95);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Gauge Center Pivot
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = accentColor;
    ctx.fill();

    // Needle
    ctx.save();
    ctx.rotate(needleAngle);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.15, 0);
    ctx.lineTo(radius * 0.76, 0);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  // Draw Piston Vector
  function drawPiston(ctx, x, y, size, angle, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;

    const w = size * 0.6;
    const h = size * 0.7;

    ctx.strokeRect(-w / 2, -h / 2, w, h);

    for (let r = 0; r < 3; r++) {
      const ry = -h / 2 + 6 + r * 6;
      ctx.beginPath();
      ctx.moveTo(-w / 2 - 2, ry);
      ctx.lineTo(-w / 2, ry);
      ctx.moveTo(w / 2, ry);
      ctx.lineTo(w / 2 + 2, ry);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(0, 0, w * 0.18, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-w * 0.1, h / 2);
    ctx.lineTo(-w * 0.15, h / 2 + size * 0.8);
    ctx.arc(0, h / 2 + size * 0.8, w * 0.25, 0, Math.PI);
    ctx.lineTo(w * 0.1, h / 2);
    ctx.stroke();

    ctx.restore();
  }

  function initElements() {
    elements.length = 0;
    particles.length = 0;

    const count = Math.min(16, Math.max(8, Math.floor((width * height) / 110000)));

    for (let i = 0; i < count; i++) {
      const type = i % 4;
      elements.push({
        type: type,
        x: rand(60, width - 60),
        y: rand(80, height - 80),
        vx: rand(-0.12, 0.12),
        vy: rand(-0.12, 0.12),
        size: type === 0 ? rand(35, 70) : type === 1 ? rand(60, 100) : type === 2 ? rand(45, 75) : rand(40, 65),
        angle: rand(0, Math.PI * 2),
        angularVelocity: rand(-0.004, 0.004),
        teeth: Math.floor(rand(10, 16)),
        baseColor: i % 2 === 0 ? 'rgba(201, 162, 74, 0.12)' : 'rgba(217, 217, 217, 0.08)',
        glowColor: i % 2 === 0 ? '#C9A24A' : '#E5C77B'
      });
    }

    for (let p = 0; p < 40; p++) {
      particles.push({
        x: rand(0, width),
        y: rand(0, height),
        vx: rand(-0.25, 0.25),
        vy: rand(-0.18, 0.18),
        r: rand(1, 2.2),
        color: Math.random() > 0.5 ? 'rgba(201, 162, 74, 0.25)' : 'rgba(217, 217, 217, 0.18)'
      });
    }
  }

  initElements();

  let time = 0;
  function animate() {
    requestAnimationFrame(animate);
    time += 0.012;

    ctx.clearRect(0, 0, width, height);

    // Subtle Grid in background
    ctx.save();
    ctx.strokeStyle = 'rgba(217, 217, 217, 0.02)';
    ctx.lineWidth = 1;
    const gridSpacing = 90;
    for (let x = 0; x < width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();

    // Render particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          ctx.strokeStyle = `rgba(201, 162, 74, ${0.06 * (1 - dist / 100)})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    }

    // Render Tools
    for (let el of elements) {
      el.x += el.vx;
      el.y += el.vy;
      el.angle += el.angularVelocity;

      let color = el.baseColor;
      if (mouse.active) {
        const dx = mouse.x - el.x;
        const dy = mouse.y - el.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          const intensity = 1 - dist / 200;
          color = `rgba(201, 162, 74, ${0.15 + intensity * 0.35})`;
          el.angle += el.angularVelocity * 2;
        }
      }

      if (el.x < -60) el.x = width + 60;
      if (el.x > width + 60) el.x = -60;
      if (el.y < -60) el.y = height + 60;
      if (el.y > height + 60) el.y = -60;

      switch (el.type) {
        case 0:
          drawGear(ctx, el.x, el.y, el.size, el.teeth, el.angle, color);
          break;
        case 1:
          drawWrench(ctx, el.x, el.y, el.size, el.angle, color);
          break;
        case 2:
          const needleAngle = Math.PI * 0.75 + Math.sin(time + el.x * 0.01) * 1.1 + 0.7;
          drawGauge(ctx, el.x, el.y, el.size, needleAngle, color, el.glowColor);
          break;
        case 3:
          drawPiston(ctx, el.x, el.y, el.size, el.angle, color);
          break;
      }
    }
  }

  animate();
})();
