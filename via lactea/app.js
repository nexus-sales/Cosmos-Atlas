const canvas = document.getElementById("space");
const ctx = canvas.getContext("2d");
const zoomSlider = document.getElementById("zoomSlider");

let width = 0;
let height = 0;
let stars = [];
let nebula = [];
let zoom = 1;

function resize() {
  width = canvas.width = window.innerWidth * devicePixelRatio;
  height = canvas.height = window.innerHeight * devicePixelRatio;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  createSky();
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function createSky() {
  stars = [];
  nebula = [];

  const starCount = Math.floor((width * height) / 4200);

  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: random(0.35, 1.85) * devicePixelRatio,
      alpha: random(0.35, 1),
      tint: Math.random() > 0.9 ? "warm" : Math.random() > 0.75 ? "blue" : "white"
    });
  }

  // Nubes luminosas que forman la Vía Láctea.
  for (let i = 0; i < 850; i++) {
    const t = Math.random();
    const bandY = height * (0.18 + 0.6 * t);
    const bandX = width * (0.08 + 0.86 * t);
    const wave = Math.sin(t * Math.PI * 2.1) * height * 0.08;
    const spread = random(-height * 0.085, height * 0.085);

    nebula.push({
      x: bandX + random(-width * 0.06, width * 0.06),
      y: bandY + wave + spread,
      r: random(12, 54) * devicePixelRatio,
      a: random(0.015, 0.085),
      color: Math.random() > 0.55 ? "255,220,185" : Math.random() > 0.5 ? "185,195,255" : "230,230,240"
    });
  }
}

function drawBackground() {
  const gradient = ctx.createRadialGradient(width * 0.5, height * 0.55, 0, width * 0.5, height * 0.55, width);
  gradient.addColorStop(0, "#101726");
  gradient.addColorStop(0.45, "#060913");
  gradient.addColorStop(1, "#010208");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawMilkyWay() {
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-width / 2, -height / 2);
  ctx.rotate(-0.18);

  // Banda base difusa.
  for (let i = 0; i < 13; i++) {
    ctx.beginPath();
    ctx.ellipse(
      width * 0.5,
      height * 0.42,
      width * (0.56 + i * 0.015),
      height * (0.055 + i * 0.01),
      0.28,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = `rgba(190, 205, 230, ${0.018 - i * 0.0008})`;
    ctx.fill();
  }

  nebula.forEach((n) => {
    const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
    g.addColorStop(0, `rgba(${n.color}, ${n.a})`);
    g.addColorStop(0.45, `rgba(${n.color}, ${n.a * 0.45})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // Polvo oscuro central.
  for (let i = 0; i < 115; i++) {
    const t = Math.random();
    const x = width * (0.08 + 0.86 * t);
    const y = height * (0.18 + 0.6 * t) + Math.sin(t * Math.PI * 2.1) * height * 0.08;
    ctx.fillStyle = `rgba(0,0,0,${random(0.025, 0.09)})`;
    ctx.beginPath();
    ctx.ellipse(x, y, random(20, 95) * devicePixelRatio, random(5, 24) * devicePixelRatio, random(-0.8, 0.8), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawStars() {
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-width / 2, -height / 2);

  stars.forEach((s) => {
    const color =
      s.tint === "warm" ? `rgba(255,210,155,${s.alpha})` :
      s.tint === "blue" ? `rgba(170,195,255,${s.alpha})` :
      `rgba(255,255,255,${s.alpha})`;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();

    if (s.r > 1.4 * devicePixelRatio) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 8 * devicePixelRatio;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  });

  ctx.restore();
}

function drawVignette() {
  const g = ctx.createRadialGradient(width / 2, height / 2, width * 0.2, width / 2, height / 2, width * 0.72);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
}

function render() {
  drawBackground();
  drawMilkyWay();
  drawStars();
  drawVignette();
  requestAnimationFrame(render);
}

zoomSlider.addEventListener("input", (event) => {
  zoom = Number(event.target.value);
});

window.addEventListener("resize", resize);
resize();
render();
