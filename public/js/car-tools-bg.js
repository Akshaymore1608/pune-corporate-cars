/**
 * Pune Corporate Cars - Luxury Automotive Background Canvas
 * Theme: Premium Black, Gold & Silver Automotive Silhouette & Constellation
 * Palette:
 * - Luxury Gold: #C9A24A
 * - Light Gold:  #E5C77B
 * - Silver Grey: #D9D9D9
 * - Deep Black:  #080808
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
    initParticles();
  });

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  });

  window.addEventListener('mouseleave', () => {
    mouse.active = false;
  });

  const particles = [];
  const PARTICLE_COUNT = 45;

  function initParticles() {
    particles.length = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 2 + 0.8,
        color: Math.random() > 0.4 ? '#C9A24A' : '#D9D9D9',
        alpha: Math.random() * 0.45 + 0.15
      });
    }
  }

  // Draw Sleek Aerodynamic Luxury Car Silhouette Symbol
  function drawCarSilhouette(x, y, scale, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;

    // Subtle Ground Reflection Horizon
    const grad = ctx.createLinearGradient(-350, 0, 350, 0);
    grad.addColorStop(0, 'rgba(201, 162, 74, 0)');
    grad.addColorStop(0.5, 'rgba(229, 199, 123, 0.45)');
    grad.addColorStop(1, 'rgba(201, 162, 74, 0)');

    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-380, 75);
    ctx.lineTo(380, 75);
    ctx.stroke();

    // Streamlined Roofline and Hood Silhouette
    ctx.strokeStyle = '#E5C77B';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    // Front splitter
    ctx.moveTo(-290, 65);
    ctx.bezierCurveTo(-260, 60, -220, 50, -180, 35);
    // Hood to windshield
    ctx.bezierCurveTo(-140, 20, -100, -10, -50, -45);
    // Roofline apex
    ctx.bezierCurveTo(0, -65, 60, -65, 110, -45);
    // Fastback rear slope
    ctx.bezierCurveTo(160, -20, 210, 20, 250, 40);
    // Ducktail spoiler & rear bumper
    ctx.bezierCurveTo(275, 48, 290, 60, 285, 70);
    ctx.stroke();

    // Secondary Shoulder Flow Line
    ctx.strokeStyle = 'rgba(217, 217, 217, 0.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-240, 48);
    ctx.bezierCurveTo(-160, 35, -40, 18, 60, 20);
    ctx.bezierCurveTo(140, 22, 210, 38, 260, 52);
    ctx.stroke();

    // Side Window Coupe Glass
    ctx.strokeStyle = 'rgba(201, 162, 74, 0.65)';
    ctx.fillStyle = 'rgba(201, 162, 74, 0.05)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-45, -35);
    ctx.bezierCurveTo(-10, -52, 50, -52, 95, -35);
    ctx.bezierCurveTo(115, -20, 110, 0, 85, 0);
    ctx.bezierCurveTo(10, -5, -40, 0, -55, 0);
    ctx.bezierCurveTo(-65, -15, -60, -28, -45, -35);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Front Headlight Beam (Glowing LED Line)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-270, 52);
    ctx.lineTo(-210, 42);
    ctx.stroke();

    // Rear OLED Light Line
    ctx.strokeStyle = '#C9A24A';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(255, 45);
    ctx.lineTo(280, 54);
    ctx.stroke();

    // Front Wheel Assembly
    drawWheel(-160, 72, 38);
    // Rear Wheel Assembly
    drawWheel(180, 72, 38);

    // Rocker Panel between wheels
    ctx.strokeStyle = '#C9A24A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-122, 72);
    ctx.lineTo(142, 72);
    ctx.stroke();

    ctx.restore();
  }

  function drawWheel(wx, wy, r) {
    // Outer tire / arch
    ctx.strokeStyle = '#C9A24A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(wx, wy, r, 0, Math.PI * 2);
    ctx.stroke();

    // Inner rim
    ctx.strokeStyle = '#d9d9d9';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(wx, wy, r * 0.65, 0, Math.PI * 2);
    ctx.stroke();

    // Hub center
    ctx.fillStyle = '#C9A24A';
    ctx.beginPath();
    ctx.arc(wx, wy, r * 0.22, 0, Math.PI * 2);
    ctx.fill();

    // Spokes
    ctx.strokeStyle = 'rgba(229, 199, 123, 0.65)';
    ctx.lineWidth = 1;
    for (let a = 0; a < 5; a++) {
      const angle = (a * Math.PI * 2) / 5;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.lineTo(wx + Math.cos(angle) * r, wy + Math.sin(angle) * r);
      ctx.stroke();
    }
  }

  initParticles();

  let time = 0;
  function animate() {
    time += 0.015;
    ctx.clearRect(0, 0, width, height);

    // Parallax offset from mouse
    const offsetX = mouse.active ? (mouse.x - width / 2) * 0.04 : 0;
    const offsetY = mouse.active ? (mouse.y - height / 2) * 0.04 : 0;

    // Draw Subtle Ambient Connecting Constellation Lines
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 130) {
          ctx.strokeStyle = '#C9A24A';
          ctx.globalAlpha = (1 - dist / 130) * 0.12;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw Particle Nodes
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Primary Luxury Car Symbol Watermark (Upper Right / Center Ambient)
    const carX = width * 0.72 + offsetX;
    const carY = Math.min(height * 0.38, 380) + offsetY + Math.sin(time) * 4;
    const carScale = Math.max(0.65, Math.min(1.1, width / 1400));
    drawCarSilhouette(carX, carY, carScale, 0.28);

    // Draw Secondary Faint Accent Symbol (Lower Left Ambient)
    if (width > 800) {
      const carX2 = width * 0.2 - offsetX * 0.5;
      const carY2 = height * 0.82 - offsetY * 0.5 + Math.cos(time) * 3;
      drawCarSilhouette(carX2, carY2, carScale * 0.65, 0.16);
    }

    requestAnimationFrame(animate);
  }

  animate();
})();
