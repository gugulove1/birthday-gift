/* ============================================================
   生日礼物 · 手势翻页相册
   说明：核心翻页逻辑不依赖任何外部库，保证断网/网络受限时也能用。
   手势识别（MediaPipe）是「按需加载」的，加载失败也不影响看照片。
   ============================================================ */

const cfg = window.GIFT_CONFIG;
const slides = cfg.slides || [];
const SWIPE_INVERT = cfg.swipeInvert === true;

const track = document.getElementById("track");
const dots = document.getElementById("dots");
const titleEl = document.getElementById("title");
const subtitleEl = document.getElementById("subtitle");
const statusEl = document.getElementById("status");
const btnPrev = document.getElementById("btnPrev");
const btnNext = document.getElementById("btnNext");
const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");
const cameraWrap = document.getElementById("cameraWrap");
const intro = document.getElementById("intro");
const startBtn = document.getElementById("startBtn");

// 手部骨架连接关系（MediaPipe 21 个关键点）
const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17]
];

let current = 0;
let landmarker = null;
let stream = null;
let lastVideoTime = -1;
let samples = [];
let cooldownUntil = 0;

// ---------- 标题 ----------
titleEl.textContent = cfg.title || "生日快乐";
subtitleEl.textContent = cfg.subtitle || "";

// ---------- 构建幻灯片 ----------
function buildSlides() {
  slides.forEach((s, i) => {
    const slide = document.createElement("div");
    slide.className = "slide";

    // 背景：同一张照片模糊放大，铺满屏幕
    const bg = document.createElement("img");
    bg.className = "photo-bg";
    bg.src = s.src;
    bg.alt = "";
    bg.loading = "lazy";
    bg.decoding = "async";
    slide.appendChild(bg);

    // 前景：照片完整显示、居中缩小
    const stage = document.createElement("div");
    stage.className = "photo-stage";
    const photo = document.createElement("img");
    photo.className = "photo";
    photo.src = s.src;
    photo.alt = "";
    photo.loading = "lazy";
    photo.decoding = "async";
    stage.appendChild(photo);
    slide.appendChild(stage);

    const cap = document.createElement("div");
    cap.className = "caption";
    const t = document.createElement("div");
    t.className = "caption-text";
    t.textContent = s.caption || "";
    cap.appendChild(t);
    if (s.sub) {
      const sub = document.createElement("div");
      sub.className = "caption-sub";
      sub.textContent = s.sub;
      cap.appendChild(sub);
    }
    slide.appendChild(cap);
    track.appendChild(slide);

    const d = document.createElement("button");
    d.className = "dot" + (i === 0 ? " active" : "");
    d.setAttribute("aria-label", "第 " + (i + 1) + " 张");
    d.addEventListener("click", () => goTo(i));
    dots.appendChild(d);
  });
}

function render() {
  track.style.transform = "translateX(-" + current * 100 + "%)";
  document.querySelectorAll(".dot").forEach((d, i) => {
    d.classList.toggle("active", i === current);
  });
}

function goTo(i) {
  current = (i + slides.length) % slides.length;
  render();
}

const next = () => goTo(current + 1);
const prev = () => goTo(current - 1);

// ---------- 备用控制：按钮 / 键盘 / 手指滑动 ----------
btnNext.addEventListener("click", next);
btnPrev.addEventListener("click", prev);

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight" || e.key === "ArrowDown") next();
  if (e.key === "ArrowLeft" || e.key === "ArrowUp") prev();
});

let touchX = null;
window.addEventListener("touchstart", (e) => {
  touchX = e.touches[0].clientX;
}, { passive: true });
window.addEventListener("touchend", (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (dx < -40) next();
  else if (dx > 40) prev();
  touchX = null;
}, { passive: true });

// ---------- 手势识别工具函数 ----------
function palmCenterX(lm) {
  const idx = [0, 5, 9, 13, 17];
  let x = 0;
  for (const i of idx) x += lm[i].x;
  return x / idx.length;
}

function addSample(x, t) {
  samples.push({ x, t });
  const cutoff = t - 600; // 只看最近 600ms 内的位移
  while (samples.length && samples[0].t < cutoff) samples.shift();
}

function evaluateSwipe(t) {
  if (t < cooldownUntil) return 0;
  if (samples.length < 6) return 0;
  const first = samples[0];
  const last = samples[samples.length - 1];
  const dx = last.x - first.x;
  const dt = (last.t - first.t) / 1000;
  const speed = Math.abs(dx) / Math.max(dt, 1e-3);
  if (Math.abs(dx) >= 0.22 && speed > 0.35) {
    return dx > 0 ? 1 : -1; // 1 = 下一张，-1 = 上一张
  }
  return 0;
}

function drawHand(lm) {
  const pts = lm.map((p) => [p.x * canvas.width, p.y * canvas.height]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  for (const [a, b] of CONNECTIONS) {
    ctx.beginPath();
    ctx.moveTo(pts[a][0], pts[a][1]);
    ctx.lineTo(pts[b][0], pts[b][1]);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,214,90,0.95)";
  for (const [x, y] of pts) {
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------- 按需加载 MediaPipe（失败不影响翻页） ----------
async function initLandmarker() {
  const baseUrl = new URL(".", import.meta.url);
  const mod = await import(new URL("lib/vision_bundle.js", baseUrl).href);
  const { FilesetResolver, HandLandmarker } = mod;
  const vision = await FilesetResolver.forVisionTasks(
    new URL("lib/wasm", baseUrl).href
  );
  const base = {
    baseOptions: {
      modelAssetPath: new URL("models/hand_landmarker.task", baseUrl).href,
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numHands: 1,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5
  };
  try {
    landmarker = await HandLandmarker.createFromOptions(vision, base);
  } catch (e) {
    // GPU 不可用时退回 CPU
    base.baseOptions.delegate = "CPU";
    landmarker = await HandLandmarker.createFromOptions(vision, base);
  }
}

async function startCamera() {
  statusEl.textContent = "📷 正在打开摄像头…";
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false
    });
    video.srcObject = stream;
    await video.play();
    cameraWrap.classList.remove("hidden");
    statusEl.textContent = "🤖 加载手势模型…";
    try {
      await initLandmarker();
      statusEl.textContent = "👋 举手左右挥动换照片";
      loop();
    } catch (e) {
      console.error(e);
      const msg = (e && e.message ? e.message : String(e)).slice(0, 80);
      statusEl.textContent = "⚠️ 手势失败：" + msg + "（可用箭头翻页）";
    }
  } catch (err) {
    console.error(err);
    statusEl.textContent = "📷 摄像头不可用 · 用箭头/方向键/滑动翻页";
    cameraWrap.classList.add("hidden");
  }
}

function loop() {
  requestAnimationFrame(loop);
  if (!landmarker || video.readyState < 2) return;
  const t = performance.now();
  if (video.currentTime === lastVideoTime) return;
  lastVideoTime = video.currentTime;

  if (canvas.width !== video.videoWidth) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let results;
  try {
    results = landmarker.detectForVideo(video, t);
  } catch (e) {
    return;
  }

  if (results.landmarks && results.landmarks.length) {
    const lm = results.landmarks[0];
    drawHand(lm);
    addSample(palmCenterX(lm), t);
    const dir = evaluateSwipe(t);
    if (dir !== 0) {
      samples = [];
      cooldownUntil = t + 800; // 触发后冷却，避免一次挥手翻好几张
      if (SWIPE_INVERT) {
        dir === 1 ? prev() : next();
      } else {
        dir === 1 ? next() : prev();
      }
    }
  }
}

// ---------- 启动 ----------
buildSlides();
render();
startBtn.addEventListener("click", () => {
  intro.classList.add("hidden");
  startCamera();
});
