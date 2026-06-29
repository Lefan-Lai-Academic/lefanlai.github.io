const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

document.getElementById("year").textContent = new Date().getFullYear();

document.querySelectorAll("[data-reveal]").forEach((element) => {
  const delay = Number(element.dataset.delay || 0);
  element.style.setProperty("--reveal-delay", `${delay}ms`);
});

if (prefersReducedMotion.matches) {
  document.querySelectorAll("[data-reveal]").forEach((element) => {
    element.classList.add("is-visible");
  });
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
  );

  document.querySelectorAll("[data-reveal]").forEach((element) => {
    revealObserver.observe(element);
  });
}

const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const navItems = document.querySelectorAll(".nav-links a");
const sections = Array.from(document.querySelectorAll("main section[id]"));
const rootElement = document.documentElement;

function closeNavigation() {
  navToggle?.setAttribute("aria-expanded", "false");
  navLinks?.classList.remove("is-open");
  document.body.classList.remove("menu-open");
}

navToggle?.addEventListener("click", () => {
  const isOpen = navToggle.getAttribute("aria-expanded") === "true";
  navToggle.setAttribute("aria-expanded", String(!isOpen));
  navLinks?.classList.toggle("is-open", !isOpen);
  document.body.classList.toggle("menu-open", !isOpen);
});

navItems.forEach((link) => {
  link.addEventListener("click", () => {
    const targetId = link.hash?.slice(1);
    if (targetId) {
      setActiveNavigation(targetId);
    }
    closeNavigation();
  });
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeNavigation();
  }
});

function setActiveNavigation(sectionId) {
  navItems.forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === `#${sectionId}`);
  });
}

function isNearPageTop() {
  return window.scrollY <= 8;
}

function isNearPageBottom() {
  const documentHeight = Math.max(rootElement.scrollHeight, document.body.scrollHeight);
  return window.scrollY + window.innerHeight >= documentHeight - 8;
}

function setEdgeNavigationIfNeeded() {
  if (!sections.length) return;

  if (isNearPageTop()) {
    setActiveNavigation(sections[0].id);
    return;
  }

  if (isNearPageBottom()) {
    setActiveNavigation(sections[sections.length - 1].id);
  }
}

const activeSectionIds = new Set();

function applyObservedNavigation() {
  if (!sections.length) return;

  if (isNearPageTop() || isNearPageBottom()) {
    setEdgeNavigationIfNeeded();
    return;
  }

  let activeSection = null;
  for (let index = sections.length - 1; index >= 0; index -= 1) {
    if (activeSectionIds.has(sections[index].id)) {
      activeSection = sections[index];
      break;
    }
  }

  if (activeSection) {
    setActiveNavigation(activeSection.id);
  }
}

const activeNavObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        activeSectionIds.add(entry.target.id);
      } else {
        activeSectionIds.delete(entry.target.id);
      }
    });

    applyObservedNavigation();
  },
  { threshold: 0, rootMargin: "-32% 0px -54% 0px" },
);

sections.forEach((section) => activeNavObserver.observe(section));

let edgeNavigationTicking = false;

function updateActiveNavigationEdges() {
  if (edgeNavigationTicking) return;
  edgeNavigationTicking = true;
  window.requestAnimationFrame(() => {
    if (isNearPageTop() || isNearPageBottom()) {
      setEdgeNavigationIfNeeded();
    }
    edgeNavigationTicking = false;
  });
}

window.addEventListener("scroll", updateActiveNavigationEdges, { passive: true });
window.addEventListener("resize", applyObservedNavigation);
window.addEventListener("hashchange", () => {
  const targetId = window.location.hash.slice(1);
  if (targetId) {
    setActiveNavigation(targetId);
  }
});
setEdgeNavigationIfNeeded();

if (!prefersReducedMotion.matches && window.matchMedia("(hover: hover)").matches) {
  document.querySelectorAll("[data-tilt-card]").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${y * -4}deg) rotateY(${x * 5}deg) translateY(-4px)`;
    });

    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });
}

const coastalVoyage = document.querySelector(".coastal-voyage");
let voyageTicking = false;

function updateCoastalVoyage() {
  const maxScroll = Math.max(rootElement.scrollHeight - window.innerHeight, 1);
  const progress = prefersReducedMotion.matches
    ? 0
    : Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
  rootElement.style.setProperty("--voyage-progress", progress.toFixed(4));

  if (coastalVoyage) {
    const routeHeight = coastalVoyage.getBoundingClientRect().height;
    const travelDistance = Math.max(routeHeight - 78, 0);
    const boatY = 8 + progress * travelDistance;
    const boatX = Math.sin(progress * Math.PI * 4.2) * 11;
    const boatTilt = Math.sin(progress * Math.PI * 5.4) * 7;

    rootElement.style.setProperty("--boat-y", `${boatY.toFixed(2)}px`);
    rootElement.style.setProperty("--boat-x", `${boatX.toFixed(2)}px`);
    rootElement.style.setProperty("--boat-tilt", `${boatTilt.toFixed(2)}deg`);
  }

  voyageTicking = false;
}

function requestCoastalVoyageUpdate() {
  if (voyageTicking) return;
  voyageTicking = true;
  window.requestAnimationFrame(updateCoastalVoyage);
}

window.addEventListener("scroll", requestCoastalVoyageUpdate, { passive: true });
window.addEventListener("resize", requestCoastalVoyageUpdate);
updateCoastalVoyage();

const canvas = document.getElementById("spatial-canvas");
const context = canvas.getContext("2d");
const pointer = { x: 0, y: 0, active: false };
let points = [];
let frameId = null;

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width * ratio);
  canvas.height = Math.floor(rect.height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  buildSpatialField(rect.width, rect.height);
  drawSpatialField(0);
}

function buildSpatialField(width, height) {
  points = [];
  const count = width < 720 ? 18 : 32;

  for (let index = 0; index < count; index += 1) {
    const seed = (index * 37) % 101;
    const drift = seed / 101;
    points.push({
      x: ((index * 193) % Math.max(width, 1)) + (drift - 0.5) * 60,
      y: ((index * 149) % Math.max(height, 1)) + (0.5 - drift) * 44,
      phase: drift * Math.PI * 2,
      depth: 0.35 + drift * 0.65,
      length: 18 + ((index * 11) % 34),
    });
  }
}

function drawSpatialField(time) {
  const rect = canvas.getBoundingClientRect();
  context.clearRect(0, 0, rect.width, rect.height);
  context.lineCap = "round";
  context.lineJoin = "round";

  const t = time * 0.00018;
  const pointerShiftX = pointer.active ? (pointer.x - rect.width / 2) * 0.012 : 0;
  const pointerShiftY = pointer.active ? (pointer.y - rect.height / 2) * 0.012 : 0;

  const rendered = points.map((point, index) => {
    const wave = prefersReducedMotion.matches ? 0 : Math.sin(t + point.phase);
    return {
      x: point.x + wave * 13 * point.depth + pointerShiftX * point.depth,
      y: point.y + Math.cos(t + point.phase) * 10 * point.depth + pointerShiftY * point.depth,
      depth: point.depth,
      length: point.length,
      kind: index % 4,
    };
  });

  for (let index = 0; index < rendered.length; index += 1) {
    const point = rendered[index];

    if (point.kind === 0) {
      context.strokeStyle = `rgba(45, 149, 189, ${0.035 + point.depth * 0.045})`;
      context.lineWidth = 1.4;
      context.beginPath();
      context.moveTo(point.x, point.y);
      context.bezierCurveTo(
        point.x + point.length * 0.3,
        point.y - 8,
        point.x + point.length * 0.7,
        point.y + 8,
        point.x + point.length,
        point.y,
      );
      context.stroke();
    } else if (point.kind === 1) {
      context.strokeStyle = `rgba(105, 209, 228, ${0.04 + point.depth * 0.045})`;
      context.lineWidth = 1.2;
      context.beginPath();
      context.arc(point.x, point.y, point.length * 0.28, 0.18 * Math.PI, 1.18 * Math.PI);
      context.stroke();
    } else if (point.kind === 2) {
      context.fillStyle = `rgba(174, 185, 255, ${0.035 + point.depth * 0.045})`;
      context.beginPath();
      context.arc(point.x, point.y, 2 + point.depth * 1.6, 0, Math.PI * 2);
      context.fill();
    } else {
      context.strokeStyle = `rgba(23, 168, 161, ${0.035 + point.depth * 0.04})`;
      context.lineWidth = 1.2;
      context.beginPath();
      context.moveTo(point.x, point.y);
      context.lineTo(point.x + point.length * 1.2, point.y + Math.sin(t + point.depth) * 1.4);
      context.stroke();
    }
  }

  if (!prefersReducedMotion.matches) {
    frameId = window.requestAnimationFrame(drawSpatialField);
  }
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("pointermove", (event) => {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  pointer.active = true;
});
window.addEventListener("pointerleave", () => {
  pointer.active = false;
});

prefersReducedMotion.addEventListener("change", () => {
  if (frameId) {
    window.cancelAnimationFrame(frameId);
    frameId = null;
  }

  document.querySelectorAll("[data-reveal]").forEach((element) => {
    element.classList.add("is-visible");
  });

  resizeCanvas();

  if (!prefersReducedMotion.matches) {
    frameId = window.requestAnimationFrame(drawSpatialField);
  }

  requestCoastalVoyageUpdate();
});

resizeCanvas();

if (!prefersReducedMotion.matches) {
  frameId = window.requestAnimationFrame(drawSpatialField);
}
