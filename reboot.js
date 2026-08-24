const rebootRoot = document.querySelector("[data-reboot-site]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

document.documentElement.classList.remove("prologue-active");
document.documentElement.classList.add("reboot-active");

const rebootYear = document.querySelector("[data-reboot-year]");
if (rebootYear) {
  rebootYear.textContent = new Date().getFullYear();
}

const panelAliases = {
  home: "start",
  start: "start",
  about: "me",
  me: "me",
  education: "me",
  research: "ideas",
  ideas: "ideas",
  publications: "paper",
  paper: "paper",
  contact: "contact",
};

const panelButtons = document.querySelectorAll("[data-reboot-target]");
const panels = document.querySelectorAll("[data-reboot-panel]");

function normalizePanel(panelId) {
  const normalized = panelAliases[panelId] || "start";
  return document.querySelector(`[data-reboot-panel="${normalized}"]`) ? normalized : "start";
}

function showPanel(panelId, options = {}) {
  const activeId = normalizePanel(panelId);

  panels.forEach((panel) => {
    const isActive = panel.dataset.rebootPanel === activeId;
    panel.hidden = !isActive;
    panel.classList.toggle("is-active", isActive);
  });

  panelButtons.forEach((button) => {
    const isActive = button.dataset.rebootTarget === activeId;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  if (options.updateHash !== false) {
    history.pushState(null, "", `#${activeId}`);
  }

  if (activeId === "ideas") {
    requestAnimationFrame(refreshCloudLens);
  }
}

panelButtons.forEach((button) => {
  button.addEventListener("click", () => showPanel(button.dataset.rebootTarget));
});

window.addEventListener("hashchange", () => {
  showPanel(location.hash.slice(1), { updateHash: false });
});

showPanel(location.hash.slice(1), { updateHash: false });

const ambientCanvas = document.querySelector("[data-ambient-canvas]");
const ambientContext = ambientCanvas?.getContext("2d");
let ambientPoints = [];
let ambientFrame = 0;

function resizeAmbientCanvas() {
  if (!ambientCanvas || !ambientContext) return;

  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = window.innerWidth;
  const height = window.innerHeight;
  ambientCanvas.width = Math.floor(width * ratio);
  ambientCanvas.height = Math.floor(height * ratio);
  ambientCanvas.style.width = `${width}px`;
  ambientCanvas.style.height = `${height}px`;
  ambientContext.setTransform(ratio, 0, 0, ratio, 0, 0);

  const count = width < 720 ? 22 : 38;
  ambientPoints = Array.from({ length: count }, (_, index) => {
    const seed = ((index + 1) * 47) % 113;
    return {
      x: (index * 193) % Math.max(width, 1),
      y: (index * 149) % Math.max(height, 1),
      radius: 1.2 + (seed % 7) * 0.22,
      phase: seed / 113 * Math.PI * 2,
      speed: 0.00016 + (seed % 9) * 0.00001,
    };
  });
}

function drawAmbient(time = 0) {
  if (!ambientCanvas || !ambientContext) return;

  const width = window.innerWidth;
  const height = window.innerHeight;
  ambientContext.clearRect(0, 0, width, height);

  const shifted = ambientPoints.map((point) => ({
    ...point,
    x: point.x + Math.sin(time * point.speed + point.phase) * 18,
    y: point.y + Math.cos(time * point.speed + point.phase) * 14,
  }));

  shifted.forEach((point, index) => {
    for (let next = index + 1; next < shifted.length; next += 1) {
      const other = shifted[next];
      const distance = Math.hypot(point.x - other.x, point.y - other.y);
      if (distance < 170) {
        ambientContext.strokeStyle = `rgba(42, 139, 170, ${0.08 * (1 - distance / 170)})`;
        ambientContext.lineWidth = 1;
        ambientContext.beginPath();
        ambientContext.moveTo(point.x, point.y);
        ambientContext.lineTo(other.x, other.y);
        ambientContext.stroke();
      }
    }

    ambientContext.fillStyle = index % 3 === 0
      ? "rgba(24, 168, 173, 0.18)"
      : "rgba(104, 142, 224, 0.14)";
    ambientContext.beginPath();
    ambientContext.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
    ambientContext.fill();
  });

  if (!reduceMotion.matches) {
    ambientFrame = requestAnimationFrame(drawAmbient);
  }
}

resizeAmbientCanvas();
drawAmbient();

window.addEventListener("resize", () => {
  resizeAmbientCanvas();
  drawAmbient();
  refreshCloudLens();
});

reduceMotion.addEventListener("change", () => {
  cancelAnimationFrame(ambientFrame);
  resizeAmbientCanvas();
  drawAmbient();
});

const cloudLab = document.querySelector("[data-reboot-cloud]");
const cloudStage = document.querySelector("[data-cloud-stage-v2]");
const cloudLens = document.querySelector("[data-cloud-lens-v2]");
const lensCopy = document.querySelector("[data-lens-copy]");

function syncLensWords() {
  if (!cloudStage || !lensCopy) return;
  lensCopy.innerHTML = cloudStage.innerHTML;
  lensCopy.querySelectorAll(".cloud-word").forEach((word) => {
    word.setAttribute("aria-hidden", "true");
  });
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function moveLens(clientX, clientY) {
  if (!cloudLab || !cloudStage || !cloudLens || !lensCopy) return;

  const rect = cloudStage.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  const x = clamp(clientX - rect.left, 0, rect.width);
  const y = clamp(clientY - rect.top, 0, rect.height);
  const scale = window.matchMedia("(max-width: 720px)").matches ? 1.38 : 1.58;
  const lensSize = cloudLens.getBoundingClientRect().width || 150;

  cloudLab.style.setProperty("--lens-x", `${(x / rect.width) * 100}%`);
  cloudLab.style.setProperty("--lens-y", `${(y / rect.height) * 100}%`);
  cloudLens.style.left = `${rect.left + x - cloudLab.getBoundingClientRect().left}px`;
  cloudLens.style.top = `${rect.top + y - cloudLab.getBoundingClientRect().top}px`;
  lensCopy.style.width = `${rect.width}px`;
  lensCopy.style.height = `${rect.height}px`;
  lensCopy.style.transform = `translate(${lensSize / 2 - x * scale}px, ${lensSize / 2 - y * scale}px) scale(${scale})`;

  const focused = document
    .elementsFromPoint(clientX, clientY)
    .find((element) => element.classList?.contains("cloud-word"));

  cloudStage.querySelectorAll(".cloud-word").forEach((word) => {
    word.classList.toggle("is-focus", word === focused);
  });
}

function refreshCloudLens() {
  if (!cloudStage) return;
  syncLensWords();
  requestAnimationFrame(() => {
    const rect = cloudStage.getBoundingClientRect();
    if (rect.width && rect.height) {
      moveLens(rect.left + rect.width * 0.67, rect.top + rect.height * 0.34);
    }
  });
}

if (cloudStage) {
  syncLensWords();
  refreshCloudLens();

  cloudStage.addEventListener("pointermove", (event) => {
    cloudLab?.classList.add("is-exploring");
    moveLens(event.clientX, event.clientY);
  });

  cloudStage.addEventListener("pointerleave", () => {
    cloudLab?.classList.remove("is-exploring");
  });
}
