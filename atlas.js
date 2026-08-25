(() => {
const atlas = document.querySelector("[data-atlas-site]");
const atlasReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

document.documentElement.classList.remove("prologue-active", "prologue-complete");
document.documentElement.classList.add("atlas-active");

const atlasYear = document.querySelector("[data-atlas-year]");
if (atlasYear) {
  atlasYear.textContent = new Date().getFullYear();
}

const atlasButtons = document.querySelectorAll("[data-atlas-target]");
const atlasPanels = document.querySelectorAll("[data-atlas-panel]");
const atlasTopbar = document.querySelector(".atlas-topbar");
const atlasNavigation = document.querySelector("#atlas-navigation");
const atlasMenuToggle = document.querySelector(".atlas-menu-toggle");
const atlasNarrowNavigation = window.matchMedia("(max-width: 980px)");
const atlasCoarsePointer = window.matchMedia("(pointer: coarse)");
const paperFilters = document.querySelectorAll("[data-paper-filter]");
const paperItems = document.querySelectorAll("[data-paper]");
const paperCount = document.querySelector("[data-paper-count]");
const paperAreaButtons = document.querySelectorAll("[data-paper-area]");
const paperTopicButtons = document.querySelectorAll("[data-paper-topic]");
const topicToggleButtons = document.querySelectorAll("[data-topic-toggle]");
const paperTopicSelect = document.querySelector('[data-paper-filter="topic"]');
const publicationList = document.querySelector("[data-paper-list]");
const publicationFlowCanvas = document.querySelector("[data-publication-flow-canvas]");
const publicationFlowContext = publicationFlowCanvas?.getContext("2d");
const postcard = document.querySelector("[data-postcard]");
const postcardLocation = document.querySelector("[data-postcard-location]");
const postcardImage = postcard?.querySelector("img");
const postcardCaption = postcard?.querySelector("[data-postcard-caption]");
const postcardPostmark = postcard?.querySelector("[data-postcard-postmark]");
const postcardStops = document.querySelectorAll("[data-postcard-place]");
const postcardPicture = postcard?.querySelector("[data-postcard-picture]");
const postcardCount = postcard?.querySelector("[data-postcard-count]");
const postcardDots = postcard?.querySelectorAll(".postcard-dots i") || [];
const postcardPrevious = postcard?.querySelector("[data-postcard-previous]");
const postcardNext = postcard?.querySelector("[data-postcard-next]");
const newsCategoryButtons = document.querySelectorAll("button[data-news-category]");
const newsStatusButtons = document.querySelectorAll("button[data-news-status]");
const newsStatusGroup = document.querySelector("[data-news-status-group]");
const newsItems = document.querySelectorAll("[data-news-item]");
const newsCount = document.querySelector("[data-news-count]");
const interactiveName = document.querySelector("[data-interactive-name]");
let activeNewsCategory = "all";
let activeNewsStatus = "accepted";

function usesMobileEffects() {
  return atlasNarrowNavigation.matches;
}

function usesTouchPointer() {
  return atlasCoarsePointer.matches;
}

function setAtlasMenuOpen(open, options = {}) {
  const narrow = atlasNarrowNavigation.matches;
  const nextOpen = narrow && open;
  document.documentElement.classList.toggle("atlas-menu-open", nextOpen);
  atlasTopbar?.classList.toggle("is-menu-open", nextOpen);
  atlasMenuToggle?.setAttribute("aria-expanded", String(nextOpen));
  atlasMenuToggle?.setAttribute("aria-label", nextOpen ? "Close navigation menu" : "Open navigation menu");
  if (atlasNavigation) {
    atlasNavigation.inert = narrow && !nextOpen;
    atlasNavigation.setAttribute("aria-hidden", String(narrow && !nextOpen));
  }
  if (!nextOpen && options.returnFocus) atlasMenuToggle?.focus();
}

atlasMenuToggle?.addEventListener("click", () => {
  setAtlasMenuOpen(atlasMenuToggle.getAttribute("aria-expanded") !== "true");
});

document.addEventListener("pointerdown", (event) => {
  if (!atlasTopbar?.classList.contains("is-menu-open")) return;
  if (!atlasTopbar.contains(event.target)) setAtlasMenuOpen(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && atlasTopbar?.classList.contains("is-menu-open")) {
    setAtlasMenuOpen(false, { returnFocus: true });
  }
});

atlasNarrowNavigation.addEventListener("change", () => setAtlasMenuOpen(false));
setAtlasMenuOpen(false);

function topicLabelFromSlug(value) {
  if (value === "mllms") return "MLLMs";
  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const paperTopicOptions = {};

function addPaperTopicOption(area, value, label) {
  if (!area || !value) return;
  paperTopicOptions[area] ||= [];
  if (!paperTopicOptions[area].some(([existingValue]) => existingValue === value)) {
    paperTopicOptions[area].push([value, label || topicLabelFromSlug(value)]);
  }
}

paperTopicButtons.forEach((button) => {
  addPaperTopicOption(button.dataset.parentArea, button.dataset.paperTopic, button.textContent.trim());
});

paperItems.forEach((paper) => {
  const fallbackArea = (paper.dataset.area || "").split(/\s+/).find(Boolean);
  (paper.dataset.topic || "").split(/\s+/).filter(Boolean).forEach((topic) => {
    const knownArea = Object.entries(paperTopicOptions)
      .find(([, options]) => options.some(([value]) => value === topic))?.[0];
    addPaperTopicOption(knownArea || fallbackArea, topic, topicLabelFromSlug(topic));
  });
});
const atlasAliases = {
  home: "index",
  start: "index",
  index: "index",
  human: "work",
  hci: "work",
  ai: "work",
  llms: "work",
  space: "work",
  xr: "work",
  interaction: "work",
  research: "work",
  work: "work",
  paper: "work",
  papers: "work",
  publications: "work",
  news: "news",
  updates: "news",
  about: "about",
  me: "about",
  education: "about",
  contact: "contact",
};

function atlasPanelId(id) {
  const normalized = atlasAliases[id] || "index";
  return document.querySelector(`[data-atlas-panel="${normalized}"]`) ? normalized : "index";
}

function paperFilterValue(name) {
  return document.querySelector(`[data-paper-filter="${name}"]`)?.value || "all";
}

function updateTopicOptions(area, requestedTopic = "all") {
  if (!paperTopicSelect) return;

  const topics = paperTopicOptions[area] || [];
  const fragment = document.createDocumentFragment();
  const defaultOption = document.createElement("option");
  defaultOption.value = "all";
  defaultOption.textContent = area === "all" ? "Choose an area first" : `All ${area === "xr" ? "XR & Spatial" : area.toUpperCase()} topics`;
  fragment.append(defaultOption);

  topics.forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    fragment.append(option);
  });

  paperTopicSelect.replaceChildren(fragment);
  paperTopicSelect.disabled = area === "all";
  paperTopicSelect.value = topics.some(([value]) => value === requestedTopic) ? requestedTopic : "all";
}

function updatePaperFilters() {
  const year = paperFilterValue("year");
  const area = paperFilterValue("area");
  const topic = paperFilterValue("topic");
  let visibleCount = 0;

  paperItems.forEach((paper) => {
    const areas = (paper.dataset.area || "").split(/\s+/).filter(Boolean);
    const topics = (paper.dataset.topic || "").split(/\s+/).filter(Boolean);
    const matchesYear = year === "all" || paper.dataset.year === year;
    const matchesArea = area === "all" || areas.includes(area);
    const matchesTopic = topic === "all" || topics.includes(topic);
    const visible = matchesYear && matchesArea && matchesTopic;

    paper.hidden = !visible;
    paper.classList.toggle("is-hidden", !visible);
    visibleCount += visible ? 1 : 0;
  });

  if (paperCount) {
    paperCount.textContent = visibleCount === 0
      ? "No papers match these filters yet."
      : `Showing ${visibleCount} ${visibleCount === 1 ? "paper" : "papers"}.`;
  }

  atlasButtons.forEach((button) => {
    const areaShortcut = button.dataset.paperAreaShortcut;
    const topicShortcut = button.dataset.paperTopicShortcut;
    if (areaShortcut) {
      const selected = area === areaShortcut && (!topicShortcut || topic === topicShortcut);
      button.classList.toggle("is-filtered", selected);
      button.setAttribute("aria-pressed", String(selected));
    }
  });

  paperFilters.forEach((filter) => {
    filter.closest("label")?.classList.toggle("has-value", filter.value !== "all");
  });

  paperAreaButtons.forEach((button) => {
    const selected = area === button.dataset.paperArea && topic === "all";
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });

  paperTopicButtons.forEach((button) => {
    const selected = area === button.dataset.parentArea && topic === button.dataset.paperTopic;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });

  requestAnimationFrame(() => drawPublicationFlow(performance.now()));
}

let publicationFlowFrame = 0;
let activePublicationIndex = -1;

function publicationCurvePoint(start, controlA, controlB, end, progress) {
  const inverse = 1 - progress;
  return {
    x: inverse ** 3 * start.x
      + 3 * inverse ** 2 * progress * controlA.x
      + 3 * inverse * progress ** 2 * controlB.x
      + progress ** 3 * end.x,
    y: inverse ** 3 * start.y
      + 3 * inverse ** 2 * progress * controlA.y
      + 3 * inverse * progress ** 2 * controlB.y
      + progress ** 3 * end.y,
  };
}

function drawPublicationFlow(time = 0) {
  if (!publicationList || !publicationFlowCanvas || !publicationFlowContext) return;

  const listRect = publicationList.getBoundingClientRect();
  if (listRect.width < 2 || listRect.height < 2) return;

  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.floor(listRect.width * ratio));
  const height = Math.max(1, Math.floor(listRect.height * ratio));
  if (publicationFlowCanvas.width !== width || publicationFlowCanvas.height !== height) {
    publicationFlowCanvas.width = width;
    publicationFlowCanvas.height = height;
    publicationFlowCanvas.style.width = `${listRect.width}px`;
    publicationFlowCanvas.style.height = `${listRect.height}px`;
  }

  publicationFlowContext.setTransform(ratio, 0, 0, ratio, 0, 0);
  publicationFlowContext.clearRect(0, 0, listRect.width, listRect.height);

  const visiblePapers = [...paperItems].filter((paper) => !paper.hidden && !paper.classList.contains("is-hidden"));
  if (visiblePapers.length < 2) return;

  const firstVisual = visiblePapers[0].querySelector(".paper-visual")?.getBoundingClientRect();
  const secondVisual = visiblePapers[1].querySelector(".paper-visual")?.getBoundingClientRect();
  if (!firstVisual || !secondVisual) return;

  const compact = window.innerWidth <= 980;
  const firstPaperRect = visiblePapers[0].getBoundingClientRect();
  const start = compact
    ? { x: listRect.width * 0.72, y: firstPaperRect.bottom - listRect.top - 1 }
    : { x: firstVisual.left + firstVisual.width * 0.72 - listRect.left, y: firstVisual.bottom - listRect.top + 8 };
  const end = compact
    ? { x: listRect.width * 0.28, y: secondVisual.top - listRect.top + 1 }
    : { x: secondVisual.left + secondVisual.width * 0.28 - listRect.left, y: secondVisual.top - listRect.top - 8 };
  const middleY = (start.y + end.y) * 0.5;
  const controlA = compact
    ? { x: listRect.width * 0.62, y: middleY - 7 }
    : { x: listRect.width * 0.7, y: middleY - 24 };
  const controlB = compact
    ? { x: listRect.width * 0.38, y: middleY + 7 }
    : { x: listRect.width * 0.3, y: middleY + 24 };
  const activePaper = visiblePapers[activePublicationIndex] || null;
  const activeColor = activePaper
    ? getComputedStyle(activePaper).getPropertyValue("--paper-accent").trim()
    : "#5269a9";
  const gradient = publicationFlowContext.createLinearGradient(start.x, start.y, end.x, end.y);
  gradient.addColorStop(0, activePublicationIndex === 0 ? activeColor : "rgba(47, 111, 159, 0.48)");
  gradient.addColorStop(0.5, "rgba(80, 105, 151, 0.3)");
  gradient.addColorStop(1, activePublicationIndex === 1 ? activeColor : "rgba(122, 63, 152, 0.48)");

  publicationFlowContext.strokeStyle = gradient;
  publicationFlowContext.lineWidth = activePublicationIndex >= 0 ? 1.6 : 1.05;
  publicationFlowContext.setLineDash([3, 9]);
  publicationFlowContext.lineDashOffset = atlasReduceMotion.matches ? 0 : -(time / 42);
  publicationFlowContext.beginPath();
  publicationFlowContext.moveTo(start.x, start.y);
  publicationFlowContext.bezierCurveTo(controlA.x, controlA.y, controlB.x, controlB.y, end.x, end.y);
  publicationFlowContext.stroke();
  publicationFlowContext.setLineDash([]);

  if (!atlasReduceMotion.matches) {
    const progress = (time / 3600) % 1;
    const point = publicationCurvePoint(start, controlA, controlB, end, progress);
    publicationFlowContext.fillStyle = activePublicationIndex >= 0 ? activeColor : "rgba(82, 105, 169, 0.78)";
    publicationFlowContext.beginPath();
    publicationFlowContext.arc(point.x, point.y, activePublicationIndex >= 0 ? 3.2 : 2.4, 0, Math.PI * 2);
    publicationFlowContext.fill();
    publicationFlowContext.strokeStyle = "rgba(255, 255, 255, 0.82)";
    publicationFlowContext.lineWidth = 1;
    publicationFlowContext.beginPath();
    publicationFlowContext.arc(point.x, point.y, 6.5, 0, Math.PI * 2);
    publicationFlowContext.stroke();
  }
}

function animatePublicationFlow(time) {
  drawPublicationFlow(time);
  if (!atlasReduceMotion.matches) {
    publicationFlowFrame = requestAnimationFrame(animatePublicationFlow);
  }
}

function setPaperFilters(values) {
  Object.entries(values).filter(([name]) => name !== "topic").forEach(([name, value]) => {
    const filter = document.querySelector(`[data-paper-filter="${name}"]`);
    if (filter) filter.value = value;
  });

  if (Object.hasOwn(values, "area")) {
    updateTopicOptions(values.area, values.topic || "all");
  } else if (Object.hasOwn(values, "topic") && paperTopicSelect) {
    paperTopicSelect.value = values.topic;
  }

  updatePaperFilters();
}

function updateNewsFilters() {
  const filteringPapers = activeNewsCategory === "paper";
  let visibleCount = 0;
  const visibleItems = [];

  if (newsStatusGroup) {
    newsStatusGroup.hidden = !filteringPapers;
  }

  newsItems.forEach((item) => {
    item.querySelector(".news-latest-label")?.remove();
    item.querySelector(".news-year-mark")?.remove();
    const isAcceptedPaper = item.dataset.newsCategory === "paper" && item.dataset.newsStatus === "accepted";
    const visible = activeNewsCategory === "all"
      ? item.dataset.newsCategory === "social" || isAcceptedPaper
      : activeNewsCategory === "social"
        ? item.dataset.newsCategory === "social"
        : item.dataset.newsCategory === "paper" && item.dataset.newsStatus === activeNewsStatus;
    item.hidden = !visible;
    item.classList.toggle("is-hidden", !visible);
    item.classList.remove("is-first-visible");
    if (visible) visibleItems.push(item);
    visibleCount += visible ? 1 : 0;
  });

  visibleItems.forEach((item, index) => {
    item.classList.toggle("is-first-visible", index === 0);
    item.style.setProperty("--news-order", index);

    if (index === 0) {
      const latestLabel = document.createElement("span");
      latestLabel.className = "news-latest-label";
      latestLabel.textContent = activeNewsCategory === "paper" && activeNewsStatus === "submitted"
        ? "Latest submission"
        : "Latest";
      item.querySelector(".news-copy")?.prepend(latestLabel);

      const yearMark = document.createElement("span");
      yearMark.className = "news-year-mark";
      yearMark.setAttribute("aria-hidden", "true");
      yearMark.textContent = item.querySelector("time")?.dateTime.slice(0, 4) || "";
      item.append(yearMark);
    }
  });

  const newsList = document.querySelector("[data-news-list]");
  if (newsList) newsList.dataset.visibleCount = String(visibleCount);

  newsCategoryButtons.forEach((button) => {
    const selected = button.dataset.newsCategory === activeNewsCategory;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });

  newsStatusButtons.forEach((button) => {
    const selected = button.dataset.newsStatus === activeNewsStatus;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });

  if (newsCount) {
    newsCount.textContent = `Showing ${visibleCount} ${visibleCount === 1 ? "update" : "updates"}.`;
  }
}

const contactLetterLayout = document.querySelector("[data-letter-layout]");
const contactLetterCanvas = document.querySelector("[data-letter-canvas]");
const contactLetterContext = contactLetterCanvas?.getContext("2d");
const contactLetterField = document.querySelector("[data-letter-field]");
const contactLetterMeta = document.querySelector("[data-letter-meta]");
const contactLetterLines = [...document.querySelectorAll("[data-letter-text]")];
const contactLetterLinks = [...document.querySelectorAll("[data-letter-link]")];
const contactLetterColors = {
  email: [24, 124, 120],
  scholar: [47, 111, 159],
  linkedin: [166, 83, 80],
  default: [66, 91, 112],
};
let contactLetterFrame = 0;
let contactLetterStartedAt = 0;
let contactLetterActive = false;
let contactLetterComplete = false;
let contactLetterTarget = null;
let contactLetterPoint = null;
let contactLetterSendingAt = 0;
let contactMailTimer = 0;

function resetContactLetterVisuals() {
  contactLetterLayout?.classList.remove("is-letter-writing", "is-letter-complete", "is-link-active");
  contactLetterField?.classList.remove("is-sending");
  contactLetterLinks.forEach((link) => link.classList.remove("is-letter-target"));
  contactLetterLines.forEach((line) => {
    line.textContent = "";
    line.classList.remove("is-current");
  });

  if (contactLetterCanvas && contactLetterContext) {
    contactLetterContext.save();
    contactLetterContext.setTransform(1, 0, 0, 1, 0, 0);
    contactLetterContext.clearRect(0, 0, contactLetterCanvas.width, contactLetterCanvas.height);
    contactLetterContext.restore();
  }
}

function resizeContactLetterCanvas(rect) {
  if (!contactLetterCanvas || !contactLetterContext) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.floor(rect.width * ratio));
  const height = Math.max(1, Math.floor(rect.height * ratio));
  if (contactLetterCanvas.width === width && contactLetterCanvas.height === height) return;
  contactLetterCanvas.width = width;
  contactLetterCanvas.height = height;
  contactLetterCanvas.style.width = `${rect.width}px`;
  contactLetterCanvas.style.height = `${rect.height}px`;
  contactLetterContext.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function contactLetterTiming() {
  return usesMobileEffects()
    ? { delay: 620, characterTime: 22, pauseTime: 160, signatureTime: 720, writingTime: 420 }
    : { delay: 1380, characterTime: 36, pauseTime: 300, signatureTime: 1180, writingTime: 780 };
}

function contactLetterDuration() {
  const { delay, characterTime, pauseTime } = contactLetterTiming();
  return delay + contactLetterLines.reduce((total, line) => (
    total + (line.dataset.letterText || "").length * characterTime + pauseTime
  ), 0);
}

function updateContactTyping(elapsed) {
  const { delay, characterTime, pauseTime } = contactLetterTiming();
  let remaining = Math.max(0, elapsed - delay);
  let unfinished = false;

  contactLetterLines.forEach((line) => line.classList.remove("is-current"));
  if (elapsed < delay) {
    contactLetterLines.forEach((line) => { line.textContent = ""; });
    contactLetterComplete = false;
    contactLetterLayout?.classList.remove("is-letter-complete");
    return;
  }
  contactLetterLines.forEach((line) => {
    const message = line.dataset.letterText || "";
    const typingTime = message.length * characterTime;
    if (unfinished) {
      line.textContent = "";
      return;
    }
    if (remaining < typingTime) {
      line.textContent = message.slice(0, Math.floor(remaining / characterTime));
      line.classList.add("is-current");
      unfinished = true;
      return;
    }
    line.textContent = message;
    remaining -= typingTime;
    if (remaining < pauseTime) {
      line.classList.add("is-current");
      unfinished = true;
      return;
    }
    remaining -= pauseTime;
  });

  contactLetterComplete = !unfinished && elapsed >= contactLetterDuration();
  if (contactLetterComplete) {
    contactLetterLines.at(-1)?.classList.add("is-current");
  }
  contactLetterLayout?.classList.toggle("is-letter-complete", contactLetterComplete);
}

function contactBezierPoint(start, controlA, controlB, end, progress) {
  const inverse = 1 - progress;
  return {
    x: inverse ** 3 * start.x + 3 * inverse ** 2 * progress * controlA.x + 3 * inverse * progress ** 2 * controlB.x + progress ** 3 * end.x,
    y: inverse ** 3 * start.y + 3 * inverse ** 2 * progress * controlA.y + 3 * inverse * progress ** 2 * controlB.y + progress ** 3 * end.y,
  };
}

function drawContactLetter(time = performance.now()) {
  if (!contactLetterActive || !contactLetterLayout || !contactLetterCanvas || !contactLetterContext || !contactLetterField) return;

  const layoutRect = contactLetterLayout.getBoundingClientRect();
  const fieldRect = contactLetterField.getBoundingClientRect();
  if (layoutRect.width < 2 || layoutRect.height < 2) return;
  resizeContactLetterCanvas(layoutRect);
  contactLetterContext.clearRect(0, 0, layoutRect.width, layoutRect.height);

  const elapsed = atlasReduceMotion.matches ? contactLetterDuration() + 900 : Math.max(0, time - contactLetterStartedAt);
  const timing = contactLetterTiming();
  const signatureProgress = Math.min(1, elapsed / timing.signatureTime);
  const signatureEase = 1 - (1 - signatureProgress) ** 3;
  const compactLetterLayout = window.innerWidth <= 980;
  const signatureX = fieldRect.left - layoutRect.left + 4;
  const signatureY = fieldRect.top - layoutRect.top + (compactLetterLayout ? 62 : 82);
  const signatureSize = compactLetterLayout
    ? Math.max(36, Math.min(48, fieldRect.width * 0.14))
    : Math.max(42, Math.min(58, fieldRect.width * 0.15));
  contactLetterContext.save();
  contactLetterContext.font = `italic ${signatureSize}px Georgia, "Times New Roman", serif`;
  const signatureWidth = contactLetterContext.measureText("Lefan Lai").width;
  contactLetterContext.beginPath();
  contactLetterContext.rect(signatureX - 2, signatureY - signatureSize, Math.max(1, signatureWidth * signatureEase + 4), signatureSize * 1.35);
  contactLetterContext.clip();
  contactLetterContext.fillStyle = "rgba(13, 23, 40, 0.96)";
  contactLetterContext.strokeStyle = "rgba(13, 23, 40, 0.62)";
  contactLetterContext.lineWidth = 0.7;
  contactLetterContext.strokeText("Lefan Lai", signatureX, signatureY);
  contactLetterContext.fillText("Lefan Lai", signatureX, signatureY);
  contactLetterContext.restore();

  if (elapsed > timing.writingTime) contactLetterLayout.classList.add("is-letter-writing");
  updateContactTyping(elapsed);

  const linksRect = contactLetterLayout.querySelector(".contact-lines")?.getBoundingClientRect();
  const targetRect = contactLetterTarget?.getBoundingClientRect();
  const desiredPoint = targetRect
    ? { x: targetRect.right - layoutRect.left + 2, y: targetRect.top - layoutRect.top + targetRect.height * 0.5 }
    : linksRect
      ? { x: linksRect.right - layoutRect.left + 2, y: linksRect.top - layoutRect.top + linksRect.height * 0.5 }
      : { x: layoutRect.width * 0.42, y: layoutRect.height * 0.65 };
  if (!contactLetterPoint) contactLetterPoint = { ...desiredPoint };
  contactLetterPoint.x += (desiredPoint.x - contactLetterPoint.x) * 0.11;
  contactLetterPoint.y += (desiredPoint.y - contactLetterPoint.y) * 0.11;

  const lineProgress = atlasReduceMotion.matches || contactLetterSendingAt
    ? 1
    : Math.max(0, Math.min(1, (elapsed - contactLetterDuration()) / 720));
  if (lineProgress > 0 && !compactLetterLayout) {
    const compact = compactLetterLayout;
    const start = compact
      ? { x: signatureX + signatureWidth * 0.62, y: signatureY + 7 }
      : { x: signatureX + 12, y: signatureY + 24 };
    const end = compact
      ? {
          x: Math.min(fieldRect.right - layoutRect.left - 10, start.x + Math.max(74, fieldRect.width * 0.28)),
          y: start.y + 8,
        }
      : contactLetterPoint;
    const horizontal = Math.abs(start.x - end.x) > Math.abs(start.y - end.y);
    const controlA = compact
      ? { x: start.x + (end.x - start.x) * 0.28, y: start.y + 11 }
      : horizontal
        ? { x: start.x - Math.max(62, (start.x - end.x) * 0.34), y: start.y + 18 }
        : { x: start.x - 42, y: start.y + (end.y - start.y) * 0.38 };
    const controlB = compact
      ? { x: start.x + (end.x - start.x) * 0.72, y: end.y - 7 }
      : horizontal
        ? { x: end.x + Math.max(52, (start.x - end.x) * 0.25), y: end.y }
        : { x: end.x + 36, y: end.y - (end.y - start.y) * 0.3 };
    const colorKey = contactLetterTarget?.dataset.letterLink || "default";
    const [red, green, blue] = contactLetterColors[colorKey] || contactLetterColors.default;

    contactLetterContext.save();
    contactLetterContext.globalAlpha = lineProgress;
    contactLetterContext.strokeStyle = `rgba(${red}, ${green}, ${blue}, ${contactLetterTarget ? 0.68 : 0.3})`;
    contactLetterContext.lineWidth = contactLetterTarget ? 1.45 : 1;
    contactLetterContext.beginPath();
    contactLetterContext.moveTo(start.x, start.y);
    contactLetterContext.bezierCurveTo(controlA.x, controlA.y, controlB.x, controlB.y, end.x, end.y);
    contactLetterContext.stroke();

    const drift = atlasReduceMotion.matches ? 0.72 : (time / 2600) % 1;
    const light = contactBezierPoint(start, controlA, controlB, end, drift);
    contactLetterContext.fillStyle = `rgba(${red}, ${green}, ${blue}, 0.75)`;
    contactLetterContext.beginPath();
    contactLetterContext.arc(light.x, light.y, contactLetterTarget ? 2.4 : 1.7, 0, Math.PI * 2);
    contactLetterContext.fill();

    if (contactLetterSendingAt) {
      const sendProgress = Math.min(1, (time - contactLetterSendingAt) / 480);
      const sent = contactBezierPoint(start, controlA, controlB, end, sendProgress);
      contactLetterContext.fillStyle = `rgba(${red}, ${green}, ${blue}, ${1 - sendProgress * 0.35})`;
      contactLetterContext.beginPath();
      contactLetterContext.arc(sent.x, sent.y, 4.2 - sendProgress * 1.2, 0, Math.PI * 2);
      contactLetterContext.fill();
    }
    contactLetterContext.restore();
  }

  if (!atlasReduceMotion.matches) {
    contactLetterFrame = requestAnimationFrame(drawContactLetter);
  }
}

function startContactLetter() {
  if (!contactLetterLayout) return;
  cancelAnimationFrame(contactLetterFrame);
  clearTimeout(contactMailTimer);
  contactLetterActive = true;
  contactLetterComplete = false;
  contactLetterTarget = null;
  contactLetterPoint = null;
  contactLetterSendingAt = 0;
  contactLetterStartedAt = performance.now();
  resetContactLetterVisuals();
  requestAnimationFrame(drawContactLetter);
}

function stopContactLetter() {
  contactLetterActive = false;
  cancelAnimationFrame(contactLetterFrame);
  resetContactLetterVisuals();
}

function setContactLetterTarget(link) {
  contactLetterTarget = link;
  contactLetterLayout?.classList.toggle("is-link-active", Boolean(link));
  contactLetterLinks.forEach((candidate) => candidate.classList.toggle("is-letter-target", candidate === link));
  if (atlasReduceMotion.matches && contactLetterActive) drawContactLetter();
}

let overviewManuscriptRequest = 0;

function scheduleOverviewManuscript(shouldPlay) {
  const request = ++overviewManuscriptRequest;
  queueMicrotask(() => {
    if (request !== overviewManuscriptRequest) return;
    if (shouldPlay) startOverviewManuscript();
    else stopOverviewManuscript();
  });
}

contactLetterLinks.forEach((link) => {
  link.addEventListener("pointerenter", () => setContactLetterTarget(link));
  link.addEventListener("pointerleave", () => setContactLetterTarget(null));
  link.addEventListener("focus", () => setContactLetterTarget(link));
  link.addEventListener("blur", () => setContactLetterTarget(null));
});

contactLetterLinks.find((link) => link.dataset.letterLink === "email")?.addEventListener("click", (event) => {
  if (atlasReduceMotion.matches) return;
  event.preventDefault();
  const link = event.currentTarget;
  setContactLetterTarget(link);
  contactLetterSendingAt = performance.now();
  contactLetterField?.classList.add("is-sending");
  clearTimeout(contactMailTimer);
  contactMailTimer = window.setTimeout(() => {
    window.location.href = link.href;
    contactLetterField?.classList.remove("is-sending");
    contactLetterSendingAt = 0;
  }, 520);
});

function activateAtlasPanel(id, options = {}) {
  const activeId = atlasPanelId(id);

  atlasPanels.forEach((panel) => {
    const active = panel.dataset.atlasPanel === activeId;
    panel.hidden = !active;
    panel.classList.toggle("is-active", active);
  });

  restartPanelEntrance(activeId);
  scheduleOverviewManuscript(activeId === "index");

  atlasButtons.forEach((button) => {
    const active = !button.dataset.paperAreaShortcut && button.dataset.atlasTarget === activeId;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });

  if (options.updateHash !== false) {
    history.pushState(null, "", `#${activeId}`);
  }

  if (activeId === "contact") {
    startContactLetter();
  } else {
    stopContactLetter();
  }

  if (activeId === "about") {
    if (postcardStops[0]) {
      setPostcardStop(postcardStops[0], { immediate: true });
    }
    startPostcardCycle();
  } else {
    stopPostcardCycle();
  }

  if (usesMobileEffects() && activeId !== "work") setPublicationFocus(-1);

  requestAnimationFrame(() => {
    drawAtlasLines();
    drawPublicationFlow(performance.now());
    syncMobileViewportFocus(activeId);
  });
}

atlasButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    if (button.matches("[data-map-node]")) return;
    event.preventDefault();
    if (button.closest(".atlas-topbar")) setAtlasMenuOpen(false);
    if (button.dataset.paperAreaShortcut) {
      setPaperFilters({
        area: button.dataset.paperAreaShortcut,
        topic: button.dataset.paperTopicShortcut || "all",
      });
    }
    activateAtlasPanel(button.dataset.atlasTarget);
  });
});

paperFilters.forEach((filter) => {
  filter.addEventListener("change", () => {
    if (filter.dataset.paperFilter === "area") {
      updateTopicOptions(filter.value);
    }
    updatePaperFilters();
  });
});

paperAreaButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setPaperFilters({ area: button.dataset.paperArea, topic: "all" });
  });
});

paperTopicButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setPaperFilters({ area: button.dataset.parentArea, topic: button.dataset.paperTopic });
  });
});

topicToggleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const topicPanel = document.getElementById(button.getAttribute("aria-controls"));
    if (!topicPanel) return;

    const expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!expanded));
    button.textContent = expanded ? "Show topics" : "Hide topics";
    topicPanel.hidden = expanded;
  });
});

publicationList?.classList.add("has-exhibition-motion");

document.querySelectorAll(".about-text p").forEach((paragraph, index) => {
  paragraph.style.setProperty("--about-order", String(index));
});

postcardStops.forEach((stop, index) => {
  stop.style.setProperty("--journey-order", String(index));
});

let panelEntranceTimers = [];

function restartPanelEntrance(activeId) {
  panelEntranceTimers.forEach((timer) => window.clearTimeout(timer));
  panelEntranceTimers = [];
  atlasPanels.forEach((panel) => panel.classList.remove("is-panel-entering"));
  const activePanel = document.querySelector(`[data-atlas-panel="${activeId}"]`);
  if (!activePanel) return;

  requestAnimationFrame(() => activePanel.classList.add("is-panel-entering"));

  if (activeId === "work") {
    paperItems.forEach((paper, index) => {
      paper.classList.remove("is-in-view");
      panelEntranceTimers.push(window.setTimeout(() => {
        paper.classList.add("is-in-view");
      }, (usesMobileEffects() ? 70 : 120) + index * (usesMobileEffects() ? 95 : 170)));
    });
  }

  if (activeId === "about" && postcard) {
    postcard.classList.remove("is-in-view");
    panelEntranceTimers.push(window.setTimeout(() => postcard.classList.add("is-in-view"), 120));
  }
}

const revealObserver = "IntersectionObserver" in window
  ? new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in-view");
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12 })
  : null;

function setPublicationFocus(index = -1) {
  activePublicationIndex = index;
  publicationList?.classList.toggle("has-paper-focus", index >= 0);
  paperItems.forEach((item, itemIndex) => item.classList.toggle("is-paper-focused", itemIndex === index));
}

paperItems.forEach((paper, index) => {
  if (revealObserver) revealObserver.observe(paper);
  else paper.classList.add("is-in-view");

  const focusPaper = () => {
    if (!usesMobileEffects()) setPublicationFocus(index);
  };
  const releasePaper = () => {
    if (!usesMobileEffects()) setPublicationFocus(-1);
  };

  paper.addEventListener("pointerenter", focusPaper);
  paper.addEventListener("pointerleave", releasePaper);
  paper.addEventListener("focusin", focusPaper);
  paper.addEventListener("focusout", () => {
    requestAnimationFrame(() => {
      if (!paper.contains(document.activeElement)) releasePaper();
    });
  });
});

const mobilePaperRatios = new Map();
const mobilePaperObserver = "IntersectionObserver" in window
  ? new IntersectionObserver((entries) => {
    entries.forEach((entry) => mobilePaperRatios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0));
    if (!usesMobileEffects() || document.querySelector('[data-atlas-panel="work"]')?.hidden) return;
    const bestPaper = [...paperItems]
      .filter((paper) => !paper.hidden && !paper.classList.contains("is-hidden"))
      .sort((left, right) => (mobilePaperRatios.get(right) || 0) - (mobilePaperRatios.get(left) || 0))[0];
    const bestRatio = bestPaper ? mobilePaperRatios.get(bestPaper) || 0 : 0;
    setPublicationFocus(bestRatio >= 0.28 ? [...paperItems].indexOf(bestPaper) : -1);
  }, { threshold: [0, 0.28, 0.48, 0.68], rootMargin: "-12% 0px -18% 0px" })
  : null;

paperItems.forEach((paper) => mobilePaperObserver?.observe(paper));

const mobileNewsRatios = new Map();
const mobileNewsObserver = "IntersectionObserver" in window
  ? new IntersectionObserver((entries) => {
    entries.forEach((entry) => mobileNewsRatios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0));
    if (!usesMobileEffects() || document.querySelector('[data-atlas-panel="news"]')?.hidden) return;
    const bestItem = [...newsItems]
      .filter((item) => !item.hidden && !item.classList.contains("is-hidden"))
      .sort((left, right) => (mobileNewsRatios.get(right) || 0) - (mobileNewsRatios.get(left) || 0))[0];
    newsItems.forEach((item) => item.classList.toggle("is-mobile-current", item === bestItem && (mobileNewsRatios.get(item) || 0) >= 0.26));
  }, { threshold: [0, 0.26, 0.5, 0.72], rootMargin: "-10% 0px -20% 0px" })
  : null;

newsItems.forEach((item) => mobileNewsObserver?.observe(item));

function syncMobileViewportFocus(activeId = atlasPanelId(window.location.hash)) {
  if (!usesMobileEffects()) return;
  const viewportCenter = window.innerHeight * 0.52;
  const selectNearest = (items) => [...items]
    .filter((item) => !item.hidden && !item.classList.contains("is-hidden"))
    .map((item) => {
      const rect = item.getBoundingClientRect();
      return { item, distance: Math.abs(rect.top + rect.height * 0.5 - viewportCenter), rect };
    })
    .filter(({ rect }) => rect.bottom > 0 && rect.top < window.innerHeight)
    .sort((left, right) => left.distance - right.distance)[0]?.item || null;

  if (activeId === "work") {
    const nearestPaper = selectNearest(paperItems);
    setPublicationFocus(nearestPaper ? [...paperItems].indexOf(nearestPaper) : -1);
  }
  if (activeId === "news") {
    const nearestNews = selectNearest(newsItems);
    newsItems.forEach((item) => item.classList.toggle("is-mobile-current", item === nearestNews));
  }
}

let mobileFocusFrame = 0;
window.addEventListener("scroll", () => {
  if (!usesMobileEffects() || mobileFocusFrame) return;
  mobileFocusFrame = requestAnimationFrame(() => {
    mobileFocusFrame = 0;
    syncMobileViewportFocus();
  });
}, { passive: true });

if (postcard) {
  if (revealObserver) revealObserver.observe(postcard);
  else postcard.classList.add("is-in-view");
}

let postcardCycleTimer = 0;
let postcardImageTimer = 0;
let postcardStopIndex = 0;

function setPostcardStop(stop, options = {}) {
  if (!postcard || !postcardLocation || !stop) return;
  postcardStopIndex = Math.max(0, [...postcardStops].indexOf(stop));
  postcardStops.forEach((item) => item.classList.toggle("is-route-active", item === stop));
  postcardDots.forEach((dot, index) => dot.classList.toggle("is-active", index === postcardStopIndex));
  if (postcardCount) {
    postcardCount.textContent = `${String(postcardStopIndex + 1).padStart(2, "0")} / ${String(postcardStops.length).padStart(2, "0")}`;
  }
  postcard.dataset.postcardTone = stop.dataset.postcardTone || "auckland";
  postcard.classList.add("is-place-changing");
  postcardLocation.textContent = `${stop.dataset.postcardPlace} · ${stop.dataset.postcardYear}`;
  postcardPostmark?.setAttribute("data-postcard-code", stop.dataset.postcardCode || "");
  if (postcardCaption) postcardCaption.textContent = stop.dataset.postcardCaption || "";

  const nextImage = stop.dataset.postcardImage;
  if (postcardImage && nextImage && !postcardImage.src.endsWith(nextImage.replace("assets/", "/assets/"))) {
    const swapImage = () => {
      postcardImage.src = nextImage;
      postcardImage.alt = `${stop.dataset.postcardPlace} period of Lefan Lai`;
      requestAnimationFrame(() => postcard.classList.remove("is-image-changing"));
    };

    window.clearTimeout(postcardImageTimer);
    if (options.immediate) swapImage();
    else {
      postcard.classList.add("is-image-changing");
      postcardImageTimer = window.setTimeout(swapImage, 180);
    }
  }
  window.setTimeout(() => postcard.classList.remove("is-place-changing"), 320);
}

function stopPostcardCycle() {
  window.clearInterval(postcardCycleTimer);
  postcardCycleTimer = 0;
}

function startPostcardCycle() {
  stopPostcardCycle();
  if (atlasReduceMotion.matches || postcardStops.length < 2) return;
  postcardCycleTimer = window.setInterval(() => {
    postcardStopIndex = (postcardStopIndex + 1) % postcardStops.length;
    setPostcardStop(postcardStops[postcardStopIndex]);
  }, 4600);
}

function movePostcard(direction) {
  if (!postcardStops.length) return;
  stopPostcardCycle();
  postcardStopIndex = (postcardStopIndex + direction + postcardStops.length) % postcardStops.length;
  setPostcardStop(postcardStops[postcardStopIndex]);
  startPostcardCycle();
}

const defaultPostcardStop = postcardStops[0];
if (defaultPostcardStop) setPostcardStop(defaultPostcardStop, { immediate: true });

postcardStops.forEach((stop) => {
  stop.addEventListener("pointerenter", () => {
    stopPostcardCycle();
    setPostcardStop(stop);
  });
  stop.addEventListener("focus", () => {
    stopPostcardCycle();
    setPostcardStop(stop);
  });
  stop.addEventListener("blur", startPostcardCycle);
});

document.querySelector(".postcard-journey")?.addEventListener("pointerleave", () => {
  startPostcardCycle();
});

let postcardSwipeStart = null;
let postcardSwipeConsumed = false;

postcardPicture?.addEventListener("pointerdown", (event) => {
  if (!usesMobileEffects()) return;
  postcardSwipeStart = { x: event.clientX, y: event.clientY, time: performance.now(), pointerId: event.pointerId };
  postcardSwipeConsumed = false;
  postcardPicture.setPointerCapture?.(event.pointerId);
});

postcardPicture?.addEventListener("pointerup", (event) => {
  if (!postcardSwipeStart || postcardSwipeStart.pointerId !== event.pointerId) return;
  const deltaX = event.clientX - postcardSwipeStart.x;
  const deltaY = event.clientY - postcardSwipeStart.y;
  const elapsed = performance.now() - postcardSwipeStart.time;
  postcardSwipeStart = null;
  if (elapsed < 720 && Math.abs(deltaX) > 42 && Math.abs(deltaX) > Math.abs(deltaY) * 1.15) {
    postcardSwipeConsumed = true;
    movePostcard(deltaX < 0 ? 1 : -1);
  }
});

postcardPicture?.addEventListener("pointercancel", () => {
  postcardSwipeStart = null;
});

postcardPicture?.addEventListener("click", (event) => {
  if (postcardSwipeConsumed) {
    postcardSwipeConsumed = false;
    event.preventDefault();
    return;
  }
  movePostcard(1);
});

postcardPrevious?.addEventListener("click", (event) => {
  event.stopPropagation();
  movePostcard(-1);
});

postcardNext?.addEventListener("click", (event) => {
  event.stopPropagation();
  movePostcard(1);
});

postcard?.addEventListener("pointermove", (event) => {
  if (atlasReduceMotion.matches) return;
  const rect = postcard.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - 0.5;
  const y = (event.clientY - rect.top) / rect.height - 0.5;
  postcard.style.setProperty("--postcard-rotate-x", `${(-y * 2.8).toFixed(2)}deg`);
  postcard.style.setProperty("--postcard-rotate-y", `${(x * 3.6).toFixed(2)}deg`);
});

postcard?.addEventListener("pointerenter", stopPostcardCycle);

postcard?.addEventListener("pointerleave", () => {
  postcard.style.setProperty("--postcard-rotate-x", "0deg");
  postcard.style.setProperty("--postcard-rotate-y", "0deg");
  startPostcardCycle();
});

newsCategoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeNewsCategory = button.dataset.newsCategory || "all";
    activeNewsStatus = "accepted";
    updateNewsFilters();
  });
});

newsStatusButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeNewsStatus = button.dataset.newsStatus || "accepted";
    updateNewsFilters();
  });
});

updateTopicOptions(paperFilterValue("area"));
updatePaperFilters();
updateNewsFilters();

window.addEventListener("hashchange", () => {
  activateAtlasPanel(location.hash.slice(1), { updateHash: false });
});

activateAtlasPanel(location.hash.slice(1), { updateHash: false });

const atlasCursor = document.querySelector("[data-atlas-cursor]");
const cursorContext = atlasCursor?.getContext("2d");
if (atlasCursor && cursorContext) {
  document.documentElement.classList.add("atlas-cursor-ready");
}
const mapCanvas = document.querySelector("[data-atlas-map-canvas]");
const mapContext = mapCanvas?.getContext("2d");
const atlasMap = mapCanvas?.closest(".atlas-map");
const topicCloud = document.querySelector("[data-topic-cloud]");
const mapPublicationLink = document.querySelector("[data-map-publication]");
const mapPaperCount = document.querySelector("[data-map-paper-count]");
const vigorEcho = document.querySelector("[data-vigor-echo]");
const graphColors = {
  human: [24, 124, 120],
  hci: [166, 83, 80],
  ai: [103, 80, 164],
  xr: [47, 111, 159],
  interaction: [47, 111, 159],
  default: [66, 91, 112],
};
const graphNodes = [];
const graphNodeByKey = new Map();
const graphPapers = [];
const graphEdges = [];
const topicMetadata = new Map();
let pointer = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 };
let cursorFrame = 0;
let cursorTarget = null;
let cursorPressed = false;
const cursorVisual = {
  x: pointer.x,
  y: pointer.y,
  scale: 1,
};
let mapFrame = 0;
let graphHoverKey = null;
let graphLockedKey = null;
let currentGraphKey = null;
let currentGraphPaperIds = new Set();
let overviewManuscriptStartedAt = 0;
let overviewManuscriptActive = false;
let overviewManuscriptTimer = 0;
let latestGraphPaper = null;
let overviewIntroEdgeMeta = [];

function graphColor(area, topic) {
  if (topic === "human-centered") return graphColors.human;
  if (topic === "interaction") return graphColors.interaction;
  if (topic === "mllms") return graphColors.ai;
  return graphColors[area] || graphColors.default;
}

function graphColorCss(color) {
  return `rgb(${color.join(", ")})`;
}

function registerGraphNode(element, descriptor) {
  const record = {
    ...descriptor,
    element,
    paperIds: new Set(),
  };
  element.dataset.graphNode = "";
  element.dataset.graphKey = descriptor.key;
  element.style.setProperty("--node-accent", graphColorCss(descriptor.color));
  graphNodes.push(record);
  graphNodeByKey.set(descriptor.key, record);
  return record;
}

paperTopicButtons.forEach((button) => {
  topicMetadata.set(button.dataset.paperTopic, {
    area: button.dataset.parentArea,
    label: button.textContent.trim(),
  });
});

paperItems.forEach((paper) => {
  const areas = (paper.dataset.area || "").split(/\s+/).filter(Boolean);
  (paper.dataset.topic || "").split(/\s+/).filter(Boolean).forEach((topic) => {
    if (!topicMetadata.has(topic)) {
      topicMetadata.set(topic, {
        area: areas[0] || "default",
        label: topicLabelFromSlug(topic),
      });
    }
  });
});

document.querySelectorAll("[data-graph-core]").forEach((element) => {
  const area = element.dataset.graphArea || null;
  const topic = element.dataset.graphTopic || null;
  const key = area ? `area:${area}` : `topic:${topic}`;
  registerGraphNode(element, {
    key,
    area,
    topic,
    type: "core",
    color: graphColor(area, topic),
  });
});

topicMetadata.forEach((metadata, topic) => {
  const key = `topic:${topic}`;
  if (!topicCloud || graphNodeByKey.has(key)) return;

  const node = document.createElement("button");
  node.className = "topic-node";
  node.type = "button";
  node.textContent = metadata.label;
  node.dataset.graphTopic = topic;
  node.dataset.graphArea = metadata.area;
  node.setAttribute("aria-label", `${metadata.label}, publication topic`);
  topicCloud.append(node);
  registerGraphNode(node, {
    key,
    area: metadata.area,
    topic,
    type: "topic",
    color: graphColor(metadata.area, topic),
  });
});

paperItems.forEach((paper, index) => {
  const paperId = paper.dataset.paperKey || `paper-${index + 1}`;
  const areas = (paper.dataset.area || "").split(/\s+/).filter(Boolean);
  const topics = (paper.dataset.topic || "").split(/\s+/).filter(Boolean);
  const areaKeys = areas.map((area) => `area:${area}`).filter((key) => graphNodeByKey.has(key));
  const topicKeys = topics.map((topic) => `topic:${topic}`).filter((key) => graphNodeByKey.has(key));
  const nodeKeys = [...new Set([...areaKeys, ...topicKeys])];
  const animation = paper.dataset.graphAnimation || "generic";
  const record = { id: paperId, element: paper, areas, topics, areaKeys, topicKeys, nodeKeys, animation };
  graphPapers.push(record);
  nodeKeys.forEach((key) => graphNodeByKey.get(key)?.paperIds.add(paperId));
});

const graphPaperById = new Map(graphPapers.map((paper) => [paper.id, paper]));

function addGraphEdge(from, to, paperId) {
  if (!from || !to || from === to) return;
  const edgeKey = [from, to].sort().join("|");
  let edge = graphEdges.find((candidate) => candidate.key === edgeKey);
  if (!edge) {
    edge = { key: edgeKey, from, to, paperIds: new Set() };
    graphEdges.push(edge);
  }
  edge.paperIds.add(paperId);
}

graphPapers.forEach((paper) => {
  const hub = paper.areaKeys[0] || paper.nodeKeys[0];
  paper.nodeKeys.filter((key) => key !== hub).forEach((key) => addGraphEdge(hub, key, paper.id));
  paper.topicKeys.slice(1).forEach((key, index) => addGraphEdge(paper.topicKeys[index], key, paper.id));
});

function configureOverviewManuscript() {
  const coreNodes = graphNodes.filter((node) => node.type === "core");
  const coreFlights = usesMobileEffects()
    ? [
      [-82, -74, -5],
      [10, -104, 4],
      [86, -68, 5],
      [-78, 92, 4],
      [82, 96, -4],
    ]
    : [
      [-230, -118, -9],
      [18, -230, 7],
      [235, -112, 10],
      [-210, 165, 8],
      [225, 172, -8],
    ];
  coreNodes.forEach((node, index) => {
    const [flightX, flightY, rotation] = coreFlights[index % coreFlights.length];
    node.element.style.setProperty("--manuscript-delay", `${50 + index * 72}ms`);
    node.element.style.setProperty("--flight-x", `${flightX}px`);
    node.element.style.setProperty("--flight-y", `${flightY}px`);
    node.element.style.setProperty("--flight-rotate", `${rotation}deg`);
  });

  const topicOrder = [];
  graphPapers.forEach((paper) => {
    paper.nodeKeys.forEach((key) => {
      const node = graphNodeByKey.get(key);
      if (node?.type === "topic" && !topicOrder.includes(key)) topicOrder.push(key);
    });
  });
  graphNodes.filter((node) => node.type === "topic").forEach((node) => {
    if (!topicOrder.includes(node.key)) topicOrder.push(node.key);
  });
  topicOrder.forEach((key, index) => {
    const node = graphNodeByKey.get(key);
    if (!node) return;
    const side = node.area === "ai" ? 1 : node.area === "hci" ? -1 : index % 2 ? 1 : -1;
    const flightX = usesMobileEffects()
      ? side * (64 + (index % 4) * 12)
      : side * (150 + (index % 4) * 34);
    const flightY = usesMobileEffects()
      ? (index % 3 - 1) * 52 + (index % 2 ? 18 : -14)
      : (index % 3 - 1) * 118 + (index % 2 ? 46 : -34);
    node.element.style.setProperty("--manuscript-delay", `${90 + index * 42}ms`);
    node.element.style.setProperty("--flight-x", `${flightX}px`);
    node.element.style.setProperty("--flight-y", `${flightY}px`);
    node.element.style.setProperty("--flight-rotate", `${side * (6 + index % 5)}deg`);
  });

  latestGraphPaper = graphPapers.at(-1) || null;

  const edgeOrderByPaper = new Map();
  overviewIntroEdgeMeta = graphEdges.map((edge) => {
    const paper = graphPapers.find((candidate) => edge.paperIds.has(candidate.id)) || null;
    const paperIndex = paper ? graphPapers.indexOf(paper) : 0;
    const edgeOrder = edgeOrderByPaper.get(paper?.id) || 0;
    if (paper) edgeOrderByPaper.set(paper.id, edgeOrder + 1);
    return { paper, paperIndex, edgeOrder };
  });
}

function stopOverviewManuscript() {
  window.clearTimeout(overviewManuscriptTimer);
  overviewManuscriptTimer = 0;
  overviewManuscriptActive = false;
  atlasMap?.classList.remove("is-manuscript-entering");
  vigorEcho?.classList.remove("is-manuscript-trace");
  graphNodes.forEach((node) => node.element.classList.remove(
    "is-manuscript-latest",
    "is-intro-chi-motion",
    "is-intro-vigor-motion",
  ));
}

function startOverviewManuscript() {
  if (!atlasMap) return;
  stopOverviewManuscript();
  graphLockedKey = null;
  graphHoverKey = null;
  updateGraphState();

  if (atlasReduceMotion.matches) {
    drawAtlasLines();
    return;
  }

  latestGraphPaper?.nodeKeys.forEach((key) => {
    graphNodeByKey.get(key)?.element.classList.add("is-manuscript-latest");
  });
  graphPapers.forEach((paper) => {
    const motionClass = paper.animation === "chi-search"
      ? "is-intro-chi-motion"
      : paper.animation === "vigor-frames"
        ? "is-intro-vigor-motion"
        : null;
    if (!motionClass) return;
    paper.nodeKeys.forEach((key, index) => {
      const node = graphNodeByKey.get(key);
      node?.element.classList.add(motionClass);
      node?.element.style.setProperty("--publication-order", String(index));
    });
  });
  atlasMap.classList.remove("is-manuscript-entering");
  void atlasMap.offsetWidth;
  overviewManuscriptStartedAt = performance.now();
  overviewManuscriptActive = true;
  atlasMap.classList.add("is-manuscript-entering");

  if (graphPapers.some((paper) => paper.animation === "vigor-frames")) {
    vigorEcho?.classList.add("is-manuscript-trace");
  }

  overviewManuscriptTimer = window.setTimeout(() => {
    overviewManuscriptActive = false;
    atlasMap.classList.remove("is-manuscript-entering");
    vigorEcho?.classList.remove("is-manuscript-trace");
    graphNodes.forEach((node) => node.element.classList.remove(
      "is-manuscript-latest",
      "is-intro-chi-motion",
      "is-intro-vigor-motion",
    ));
    drawAtlasLines(performance.now());
  }, 2320);
}

configureOverviewManuscript();

const topicSlots = {
  hci: [[15, 45], [34, 34], [35, 65], [11, 63]],
  xr: [[56, 69], [47, 90], [68, 62], [87, 89]],
  ai: [[81, 45], [64, 11], [91, 60], [66, 34], [90, 86]],
  default: [[50, 18], [42, 72], [58, 84]],
};
const mobileTopicSlots = {
  hci: [[15, 36], [33, 30], [34, 61], [10, 57]],
  xr: [[56, 67], [48, 94], [67, 62], [87, 91]],
  ai: [[80, 36], [55, 8], [89, 54], [66, 31], [88, 91]],
  default: [[50, 12], [42, 69], [58, 91]],
};

function positionTopicNodes() {
  const slotsByArea = usesMobileEffects() ? mobileTopicSlots : topicSlots;
  const areaIndexes = {};
  graphNodes.filter((node) => node.type === "topic").forEach((node) => {
    const area = slotsByArea[node.area] ? node.area : "default";
    const slots = slotsByArea[area];
    const index = areaIndexes[area] || 0;
    areaIndexes[area] = index + 1;
    const [baseX, baseY] = slots[index % slots.length];
    const cycle = Math.floor(index / slots.length);
    const x = usesMobileEffects()
      ? Math.max(12, Math.min(88, baseX + cycle * 3))
      : Math.max(7, Math.min(93, baseX + cycle * 3));
    const y = usesMobileEffects()
      ? Math.max(8, Math.min(92, baseY - cycle * 4))
      : Math.max(7, Math.min(94, baseY - cycle * 4));
    node.element.style.left = `${x}%`;
    node.element.style.top = `${y}%`;
    node.element.style.setProperty("--topic-delay", `${index * -0.7}s`);
  });
}

positionTopicNodes();

function resizeCanvas(canvas, context, rect) {
  if (!canvas || !context) return;

  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.floor(rect.width * ratio));
  const height = Math.max(1, Math.floor(rect.height * ratio));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
}

function drawAtlasLines(time = 0) {
  if (!mapCanvas || !mapContext || !graphNodes.length) return;

  const mapRect = atlasMap?.getBoundingClientRect() || mapCanvas.getBoundingClientRect();
  if (mapRect.width < 2 || mapRect.height < 2) return;

  resizeCanvas(mapCanvas, mapContext, mapRect);
  mapContext.clearRect(0, 0, mapRect.width, mapRect.height);

  const points = new Map(graphNodes.map((node) => {
    const rect = node.element.getBoundingClientRect();
    const topicNode = node.type === "topic";
    return [node.key, {
      x: rect.left + (topicNode ? 4 : rect.width * 0.04) - mapRect.left,
      y: rect.top + (topicNode ? rect.height * 0.5 : 4) - mapRect.top,
    }];
  }));

  const introElapsed = overviewManuscriptActive
    ? Math.max(0, time - overviewManuscriptStartedAt)
    : Number.POSITIVE_INFINITY;
  graphEdges.forEach((edge, index) => {
    const a = points.get(edge.from);
    const b = points.get(edge.to);
    if (!a || !b) return;

    const hasActiveNode = Boolean(currentGraphKey);
    const highlighted = hasActiveNode && [...edge.paperIds].some((paperId) => currentGraphPaperIds.has(paperId));
    const highlightedPaper = highlighted
      ? [...edge.paperIds]
        .filter((paperId) => currentGraphPaperIds.has(paperId))
        .map((paperId) => graphPaperById.get(paperId))
        .find(Boolean)
      : null;
    const edgePaper = [...edge.paperIds].map((paperId) => graphPaperById.get(paperId)).find(Boolean);
    const lineAnimation = highlightedPaper?.animation || edgePaper?.animation || "generic";
    const introMeta = overviewIntroEdgeMeta[index];
    const introStart = 720
      + (introMeta?.paperIndex || 0) * 310
      + (introMeta?.edgeOrder || 0) * 42;
    const introEdgeProgress = overviewManuscriptActive
      ? Math.min(1, Math.max(0, (introElapsed - introStart) / 610))
      : -1;
    const introPulse = introEdgeProgress >= 0 && introEdgeProgress < 1
      ? Math.sin(Math.PI * introEdgeProgress)
      : 0;
    const toNode = graphNodeByKey.get(edge.to);
    const [red, green, blue] = highlighted || introPulse > 0
      ? (toNode?.color || graphColors.default)
      : graphColors.default;
    mapContext.strokeStyle = highlighted
      ? `rgba(${red}, ${green}, ${blue}, 0.66)`
      : introPulse > 0
        ? `rgba(${red}, ${green}, ${blue}, ${0.24 + introPulse * 0.62})`
      : hasActiveNode
        ? "rgba(66, 91, 112, 0.045)"
        : `rgba(${red}, ${green}, ${blue}, ${overviewManuscriptActive ? 0.18 : 0.13})`;
    mapContext.lineWidth = highlighted
      ? (lineAnimation === "chi-search" ? 1.45 : 1.8)
      : introPulse > 0
        ? 1.15 + introPulse * 0.85
        : 0.9;
    mapContext.setLineDash(highlighted || introPulse > 0 || overviewManuscriptActive
      ? lineAnimation === "chi-search" ? [2, 8] : lineAnimation === "vigor-frames" ? [7, 9] : [5, 9]
      : []);
    mapContext.lineDashOffset = highlighted || introPulse > 0 || overviewManuscriptActive
      ? -(time / (lineAnimation === "chi-search" ? 26 : 38) + index * 4)
      : 0;
    const cx = (a.x + b.x) * 0.5;
    const movement = highlighted ? Math.sin(time / 330 + index) * 12 : 0;
    const cy = (a.y + b.y) * 0.5 + (index % 2 === 0 ? -15 : 15) + movement;
    const edgeProgress = overviewManuscriptActive
      ? Math.min(1, Math.max(0, (introElapsed - (introStart - 210)) / 430))
      : 1;

    if (edgeProgress > 0) {
      const firstControl = {
        x: a.x + (cx - a.x) * edgeProgress,
        y: a.y + (cy - a.y) * edgeProgress,
      };
      const secondControl = {
        x: cx + (b.x - cx) * edgeProgress,
        y: cy + (b.y - cy) * edgeProgress,
      };
      const partialEnd = {
        x: firstControl.x + (secondControl.x - firstControl.x) * edgeProgress,
        y: firstControl.y + (secondControl.y - firstControl.y) * edgeProgress,
      };
      mapContext.beginPath();
      mapContext.moveTo(a.x, a.y);
      mapContext.quadraticCurveTo(firstControl.x, firstControl.y, partialEnd.x, partialEnd.y);
      mapContext.stroke();
    }

    if (introPulse > 0 && !atlasReduceMotion.matches) {
      const progress = introEdgeProgress;
      const inverse = 1 - progress;
      const x = inverse * inverse * a.x + 2 * inverse * progress * cx + progress * progress * b.x;
      const y = inverse * inverse * a.y + 2 * inverse * progress * cy + progress * progress * b.y;
      mapContext.fillStyle = `rgba(${red}, ${green}, ${blue}, 0.92)`;
      mapContext.beginPath();
      mapContext.arc(x, y, lineAnimation === "chi-search" ? 2.9 : 2.4, 0, Math.PI * 2);
      mapContext.fill();
      mapContext.strokeStyle = `rgba(${red}, ${green}, ${blue}, ${lineAnimation === "chi-search" ? 0.34 : 0.22})`;
      mapContext.lineWidth = 1;
      mapContext.beginPath();
      mapContext.arc(x, y, lineAnimation === "chi-search" ? 8.2 : 6.8, 0, Math.PI * 2);
      mapContext.stroke();
    }

    if (highlighted && !atlasReduceMotion.matches) {
      const pointOffsets = lineAnimation === "chi-search"
        ? [0]
        : lineAnimation === "vigor-frames"
          ? [0, 0.22, 0.44]
          : [0, 0.46];
      pointOffsets.forEach((offset) => {
        const progress = (time / 1900 + index * 0.11 + offset) % 1;
        const inverse = 1 - progress;
        const x = inverse * inverse * a.x + 2 * inverse * progress * cx + progress * progress * b.x;
        const y = inverse * inverse * a.y + 2 * inverse * progress * cy + progress * progress * b.y;
        mapContext.fillStyle = `rgba(${red}, ${green}, ${blue}, ${0.88 - offset * 0.35})`;
        mapContext.beginPath();
        mapContext.arc(x, y, offset === 0 ? 2.7 : 1.8, 0, Math.PI * 2);
        mapContext.fill();

        if (lineAnimation === "chi-search" && offset === 0) {
          mapContext.strokeStyle = `rgba(${red}, ${green}, ${blue}, 0.28)`;
          mapContext.lineWidth = 1;
          mapContext.beginPath();
          mapContext.arc(x, y, 7.5, 0, Math.PI * 2);
          mapContext.stroke();
        }
      });
    }
  });

  mapContext.setLineDash([]);
}

function animateAtlasLines(time) {
  drawAtlasLines(time);
  if (!atlasReduceMotion.matches) {
    mapFrame = requestAnimationFrame(animateAtlasLines);
  }
}

function updateGraphState() {
  currentGraphKey = graphHoverKey || graphLockedKey;
  const activeNode = graphNodeByKey.get(currentGraphKey);
  currentGraphPaperIds = new Set(activeNode?.paperIds || []);
  const activePapers = graphPapers.filter((paper) => currentGraphPaperIds.has(paper.id));
  const activeAnimations = new Set(activePapers.map((paper) => paper.animation));
  const relatedKeys = new Set();
  activePapers.forEach((paper) => {
    paper.nodeKeys.forEach((key) => relatedKeys.add(key));
  });

  atlasMap?.classList.toggle("has-graph-selection", Boolean(currentGraphKey));
  graphNodes.forEach((node, index) => {
    const active = node.key === currentGraphKey;
    const related = relatedKeys.has(node.key) && !active;
    node.element.classList.toggle("is-graph-active", active);
    node.element.classList.toggle("is-graph-related", related);
    node.element.classList.toggle("is-graph-muted", Boolean(currentGraphKey) && !active && !related);
    const nodePapers = activePapers.filter((paper) => paper.nodeKeys.includes(node.key));
    const nodeAnimations = new Set(nodePapers.map((paper) => paper.animation));
    const publicationOrder = nodePapers.length
      ? Math.min(...nodePapers.map((paper) => Math.max(0, paper.nodeKeys.indexOf(node.key))))
      : index;
    node.element.classList.toggle("is-chi-motion", (active || related) && nodeAnimations.has("chi-search"));
    node.element.classList.toggle("is-vigor-motion", (active || related) && nodeAnimations.has("vigor-frames"));
    node.element.style.setProperty("--activation-order", String(index));
    node.element.style.setProperty("--publication-order", String(publicationOrder));
    node.element.setAttribute("aria-pressed", String(node.key === graphLockedKey));
  });

  atlasMap?.classList.toggle("is-chi-publication-active", activeAnimations.has("chi-search"));
  atlasMap?.classList.toggle("is-vigor-publication-active", activeAnimations.has("vigor-frames"));
  const vigorActive = activeAnimations.has("vigor-frames");
  vigorEcho?.classList.toggle("is-active", vigorActive);

  if (mapPublicationLink && mapPaperCount) {
    const lockedNode = graphNodeByKey.get(graphLockedKey);
    const count = lockedNode?.paperIds.size || 0;
    mapPublicationLink.hidden = count === 0;
    mapPaperCount.textContent = `View ${count} ${count === 1 ? "publication" : "publications"}`;
    mapPublicationLink.style.setProperty("--map-action-color", graphColorCss(lockedNode?.color || graphColors.default));
  }

  if (atlasReduceMotion.matches) drawAtlasLines();
}

graphNodes.forEach((node) => {
  node.element.addEventListener("pointerenter", () => {
    graphHoverKey = node.key;
    updateGraphState();
  });
  node.element.addEventListener("pointerleave", () => {
    graphHoverKey = null;
    updateGraphState();
  });
  node.element.addEventListener("focus", () => {
    graphHoverKey = node.key;
    updateGraphState();
  });
  node.element.addEventListener("blur", () => {
    graphHoverKey = null;
    updateGraphState();
  });
  node.element.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    graphLockedKey = graphLockedKey === node.key ? null : node.key;
    graphHoverKey = null;
    updateGraphState();
  });
});

mapPublicationLink?.addEventListener("click", () => {
  const node = graphNodeByKey.get(graphLockedKey);
  if (!node) return;
  const topicArea = node.topic ? topicMetadata.get(node.topic)?.area : null;
  const area = node.area || topicArea || "all";
  setPaperFilters({ area, topic: node.topic || "all" });
  activateAtlasPanel("work");
});

atlasMap?.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  graphLockedKey = null;
  graphHoverKey = null;
  updateGraphState();
});

updateGraphState();

function atlasCursorMode() {
  const activePanel = document.querySelector("[data-atlas-panel]:not([hidden])")?.dataset.atlasPanel;
  return {
    index: "overview",
    human: "news",
    ai: "publication",
    space: "overview",
    news: "news",
    work: "publication",
    about: "postcard",
    contact: "contact",
  }[activePanel] || "overview";
}

function cursorAccent() {
  const modeColors = {
    overview: "#187c78",
    news: "#a65350",
    publication: "#2f6f9f",
    postcard: "#5269a9",
    contact: "#187c78",
  };

  if (!cursorTarget) return modeColors[atlasCursorMode()];

  const accentScopes = [
    [cursorTarget.closest("[data-paper]"), "--paper-accent"],
    [cursorTarget.closest("[data-news-item]"), "--news-accent"],
    [cursorTarget.closest("[data-postcard]"), "--postcard-accent"],
    [cursorTarget.closest("[data-letter-link]"), "--letter-link-color"],
    [cursorTarget.closest("[data-map-node]"), "--node-accent"],
  ];

  for (const [element, property] of accentScopes) {
    if (!element) continue;
    const value = getComputedStyle(element).getPropertyValue(property).trim();
    if (value && !value.includes("var(")) return value;
  }

  return modeColors[atlasCursorMode()];
}

function beginCursorStroke(context, accent, alpha, width = 1.25) {
  context.strokeStyle = accent;
  context.globalAlpha = alpha;
  context.lineWidth = width;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
}

function cursorDot(context, x, y, radius, accent, alpha = 0.72) {
  context.globalAlpha = alpha;
  context.fillStyle = accent;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
}

function drawOverviewCursor(context, time, accent, active) {
  const phase = atlasReduceMotion.matches ? 0.45 : time * 0.0011;
  const reach = active ? 1.14 : 1;
  context.rotate(-0.16);

  beginCursorStroke(context, accent, active ? 0.72 : 0.5, active ? 1.55 : 1.15);
  context.ellipse(0, 0, 34 * reach, 14 * reach, 0, 0.12, Math.PI * 1.34);
  context.stroke();

  beginCursorStroke(context, accent, active ? 0.5 : 0.32, 1);
  context.ellipse(0, 0, 19 * reach, 29 * reach, 0, Math.PI * 0.82, Math.PI * 2.18);
  context.stroke();

  const outerX = Math.cos(phase) * 34 * reach;
  const outerY = Math.sin(phase) * 14 * reach;
  const innerPhase = phase * -0.72 + 1.2;
  const innerX = Math.cos(innerPhase) * 19 * reach;
  const innerY = Math.sin(innerPhase) * 29 * reach;
  cursorDot(context, outerX, outerY, active ? 3.2 : 2.4, accent, 0.82);
  cursorDot(context, innerX, innerY, 1.8, accent, 0.55);
}

function drawNewsCursor(context, time, accent, active) {
  const width = active ? 25 : 20;
  const height = active ? 25 : 21;
  beginCursorStroke(context, accent, active ? 0.76 : 0.5, active ? 1.55 : 1.2);
  context.moveTo(-width * 0.62, -height);
  context.lineTo(-width * 0.62, height);
  context.moveTo(-width * 0.62, -height * 0.62);
  context.lineTo(width, -height * 0.62);
  context.moveTo(-width * 0.62, 0);
  context.lineTo(width * 0.52, 0);
  context.moveTo(-width * 0.62, height * 0.62);
  context.lineTo(width * 0.82, height * 0.62);
  context.stroke();

  const travel = atlasReduceMotion.matches ? 0.5 : (Math.sin(time * 0.0022) + 1) * 0.5;
  cursorDot(context, -width * 0.62, -height + travel * height * 2, active ? 3 : 2.2, accent, 0.84);
}

function drawPublicationCursor(context, time, accent, active) {
  const halfWidth = active ? 26 : 21;
  const halfHeight = active ? 19 : 16;
  const corner = active ? 9 : 7;
  beginCursorStroke(context, accent, active ? 0.82 : 0.56, active ? 1.65 : 1.25);
  context.moveTo(-halfWidth, -halfHeight + corner);
  context.lineTo(-halfWidth, -halfHeight);
  context.lineTo(-halfWidth + corner, -halfHeight);
  context.moveTo(halfWidth - corner, -halfHeight);
  context.lineTo(halfWidth, -halfHeight);
  context.lineTo(halfWidth, -halfHeight + corner);
  context.moveTo(halfWidth, halfHeight - corner);
  context.lineTo(halfWidth, halfHeight);
  context.lineTo(halfWidth - corner, halfHeight);
  context.moveTo(-halfWidth + corner, halfHeight);
  context.lineTo(-halfWidth, halfHeight);
  context.lineTo(-halfWidth, halfHeight - corner);
  context.stroke();

  const scan = atlasReduceMotion.matches ? 0 : Math.sin(time * 0.0025) * halfHeight * 0.72;
  beginCursorStroke(context, accent, active ? 0.44 : 0.25, 1);
  context.moveTo(-halfWidth * 0.62, scan);
  context.lineTo(halfWidth * 0.62, scan);
  context.stroke();
  cursorDot(context, 0, 0, active ? 2.7 : 2, accent, 0.7);
}

function drawPostcardCursor(context, time, accent, active) {
  const sway = atlasReduceMotion.matches ? -0.06 : -0.06 + Math.sin(time * 0.0017) * 0.025;
  const width = active ? 48 : 41;
  const height = active ? 31 : 27;
  context.rotate(sway);

  beginCursorStroke(context, accent, active ? 0.76 : 0.48, active ? 1.5 : 1.15);
  context.rect(-width * 0.5, -height * 0.5, width, height);
  context.moveTo(width * 0.18, -height * 0.5);
  context.lineTo(width * 0.5, -height * 0.16);
  context.moveTo(width * 0.18, -height * 0.5);
  context.lineTo(width * 0.18, -height * 0.16);
  context.lineTo(width * 0.5, -height * 0.16);
  context.stroke();

  beginCursorStroke(context, accent, active ? 0.48 : 0.3, 1);
  context.moveTo(-width * 0.32, height * 0.08);
  context.lineTo(width * 0.08, height * 0.08);
  context.moveTo(-width * 0.32, height * 0.3);
  context.lineTo(width * 0.24, height * 0.3);
  context.stroke();
}

function drawContactCursor(context, time, accent, active) {
  const blink = atlasReduceMotion.matches || Math.floor(time / 430) % 2 === 0;
  context.rotate(-0.09);
  beginCursorStroke(context, accent, blink ? (active ? 0.86 : 0.62) : 0.24, active ? 1.8 : 1.35);
  context.moveTo(5, -21);
  context.lineTo(5, 18);
  context.stroke();

  beginCursorStroke(context, accent, active ? 0.7 : 0.42, 1.2);
  context.moveTo(-25, 17);
  context.bezierCurveTo(-14, 7, -3, 27, 15, 13);
  context.bezierCurveTo(20, 9, 25, 11, 29, 8);
  context.stroke();

  context.globalAlpha = active ? 0.78 : 0.5;
  context.fillStyle = accent;
  context.beginPath();
  context.moveTo(5, 18);
  context.lineTo(1, 25);
  context.lineTo(9, 25);
  context.closePath();
  context.fill();
}

function drawCursorField(frameTime = performance.now()) {
  if (!atlasCursor || !cursorContext) return;

  if (usesTouchPointer()) {
    cursorContext.clearRect(0, 0, atlasCursor.width, atlasCursor.height);
    graphNodes.forEach((node) => node.element.classList.remove("is-near"));
    cursorFrame = 0;
    return;
  }

  resizeCanvas(atlasCursor, cursorContext, {
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const ease = atlasReduceMotion.matches ? 1 : 0.26;
  cursorVisual.x += (pointer.x - cursorVisual.x) * ease;
  cursorVisual.y += (pointer.y - cursorVisual.y) * ease;
  const targetScale = cursorPressed ? 0.82 : cursorTarget ? 1.08 : 1;
  cursorVisual.scale += (targetScale - cursorVisual.scale) * (atlasReduceMotion.matches ? 1 : 0.2);

  cursorContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
  cursorContext.save();
  cursorContext.translate(cursorVisual.x, cursorVisual.y);
  cursorContext.scale(cursorVisual.scale, cursorVisual.scale);
  const mode = atlasCursorMode();
  const accent = cursorAccent();
  const active = Boolean(cursorTarget);

  if (mode === "news") drawNewsCursor(cursorContext, frameTime, accent, active);
  else if (mode === "publication") drawPublicationCursor(cursorContext, frameTime, accent, active);
  else if (mode === "postcard") drawPostcardCursor(cursorContext, frameTime, accent, active);
  else if (mode === "contact") drawContactCursor(cursorContext, frameTime, accent, active);
  else drawOverviewCursor(cursorContext, frameTime, accent, active);

  cursorContext.restore();
  cursorContext.globalAlpha = 1;

  graphNodes.forEach((node) => {
    if (mode !== "overview") {
      node.element.classList.remove("is-near");
      return;
    }
    const rect = node.element.getBoundingClientRect();
    const x = rect.left + rect.width * 0.5;
    const y = rect.top + rect.height * 0.5;
    const distance = Math.hypot(pointer.x - x, pointer.y - y);
    const nearDistance = node.type === "topic" ? 105 : 150;
    node.element.classList.toggle("is-near", !currentGraphKey && distance < nearDistance);
  });

  if (!atlasReduceMotion.matches) {
    cursorFrame = requestAnimationFrame(drawCursorField);
  }
}

window.addEventListener("pointermove", (event) => {
  if (usesTouchPointer()) return;
  pointer = { x: event.clientX, y: event.clientY };
  const target = event.target instanceof Element ? event.target : null;
  cursorTarget = target?.closest([
    "a",
    "button",
    "select",
    "[tabindex]",
    "[data-paper]",
    "[data-news-item]",
    "[data-postcard]",
  ].join(", ")) || null;
  if (atlasReduceMotion.matches) drawCursorField();
});

window.addEventListener("pointerdown", () => {
  if (usesTouchPointer()) return;
  cursorPressed = true;
});

window.addEventListener("pointerup", () => {
  cursorPressed = false;
});

document.documentElement.addEventListener("mouseleave", () => {
  cursorTarget = null;
  cursorPressed = false;
});

interactiveName?.addEventListener("pointermove", (event) => {
  if (atlasReduceMotion.matches || usesTouchPointer()) return;
  const rect = interactiveName.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - 0.5;
  const y = (event.clientY - rect.top) / rect.height - 0.5;
  interactiveName.style.setProperty("--name-x", `${(x * 7).toFixed(2)}px`);
  interactiveName.style.setProperty("--name-y", `${(y * 5).toFixed(2)}px`);
  interactiveName.style.setProperty("--name-inverse-x", `${(x * -4).toFixed(2)}px`);
  interactiveName.style.setProperty("--name-inverse-y", `${(y * -3).toFixed(2)}px`);
  interactiveName.classList.add("is-name-active");
});

interactiveName?.addEventListener("pointerleave", () => {
  interactiveName.style.setProperty("--name-x", "0px");
  interactiveName.style.setProperty("--name-y", "0px");
  interactiveName.style.setProperty("--name-inverse-x", "0px");
  interactiveName.style.setProperty("--name-inverse-y", "0px");
  interactiveName.classList.remove("is-name-active");
});

window.addEventListener("resize", () => {
  configureOverviewManuscript();
  positionTopicNodes();
  drawAtlasLines();
  drawPublicationFlow(performance.now());
  if (contactLetterActive) drawContactLetter();
  if (atlasReduceMotion.matches) drawCursorField();
  syncMobileViewportFocus();
});

function refreshPointerMode() {
  cancelAnimationFrame(cursorFrame);
  cursorFrame = 0;
  configureOverviewManuscript();
  positionTopicNodes();
  drawAtlasLines(performance.now());
  drawPublicationFlow(performance.now());
  if (!usesMobileEffects() && !atlasReduceMotion.matches) {
    cursorFrame = requestAnimationFrame(drawCursorField);
  } else {
    drawCursorField();
  }
  if (!usesMobileEffects()) {
    setPublicationFocus(-1);
    newsItems.forEach((item) => item.classList.remove("is-mobile-current"));
  } else {
    syncMobileViewportFocus();
  }
}

atlasNarrowNavigation.addEventListener("change", refreshPointerMode);
atlasCoarsePointer.addEventListener("change", refreshPointerMode);

atlasReduceMotion.addEventListener("change", () => {
  cancelAnimationFrame(cursorFrame);
  cancelAnimationFrame(mapFrame);
  cancelAnimationFrame(publicationFlowFrame);
  drawAtlasLines();
  drawPublicationFlow(performance.now());
  refreshPointerMode();
  if (!atlasReduceMotion.matches) {
    mapFrame = requestAnimationFrame(animateAtlasLines);
    publicationFlowFrame = requestAnimationFrame(animatePublicationFlow);
  }
});

if (atlasReduceMotion.matches) {
  drawAtlasLines();
  drawPublicationFlow();
} else {
  mapFrame = requestAnimationFrame(animateAtlasLines);
  publicationFlowFrame = requestAnimationFrame(animatePublicationFlow);
}
refreshPointerMode();
})();
