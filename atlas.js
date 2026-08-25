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
const paperFilters = document.querySelectorAll("[data-paper-filter]");
const paperItems = document.querySelectorAll("[data-paper]");
const paperCount = document.querySelector("[data-paper-count]");
const paperAreaButtons = document.querySelectorAll("[data-paper-area]");
const paperTopicButtons = document.querySelectorAll("[data-paper-topic]");
const topicToggleButtons = document.querySelectorAll("[data-topic-toggle]");
const paperTopicSelect = document.querySelector('[data-paper-filter="topic"]');
const newsCategoryButtons = document.querySelectorAll("button[data-news-category]");
const newsStatusButtons = document.querySelectorAll("button[data-news-status]");
const newsStatusGroup = document.querySelector("[data-news-status-group]");
const newsItems = document.querySelectorAll("[data-news-item]");
const newsCount = document.querySelector("[data-news-count]");
const interactiveName = document.querySelector("[data-interactive-name]");
let activeNewsCategory = "all";
let activeNewsStatus = "accepted";

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

function contactLetterDuration() {
  const characterTime = 36;
  const pauseTime = 300;
  return 1380 + contactLetterLines.reduce((total, line) => (
    total + (line.dataset.letterText || "").length * characterTime + pauseTime
  ), 0);
}

function updateContactTyping(elapsed) {
  const characterTime = 36;
  const pauseTime = 300;
  let remaining = Math.max(0, elapsed - 1380);
  let unfinished = false;

  contactLetterLines.forEach((line) => line.classList.remove("is-current"));
  if (elapsed < 1380) {
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
  const signatureProgress = Math.min(1, elapsed / 1180);
  const signatureEase = 1 - (1 - signatureProgress) ** 3;
  const signatureX = fieldRect.left - layoutRect.left + 4;
  const signatureY = fieldRect.top - layoutRect.top + 82;
  const signatureSize = Math.max(42, Math.min(58, fieldRect.width * 0.15));
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

  if (elapsed > 780) contactLetterLayout.classList.add("is-letter-writing");
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
  if (lineProgress > 0) {
    const start = { x: signatureX + 12, y: signatureY + 24 };
    const end = contactLetterPoint;
    const horizontal = Math.abs(start.x - end.x) > Math.abs(start.y - end.y);
    const controlA = horizontal
      ? { x: start.x - Math.max(62, (start.x - end.x) * 0.34), y: start.y + 18 }
      : { x: start.x - 42, y: start.y + (end.y - start.y) * 0.38 };
    const controlB = horizontal
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
  contactLetterLayout.classList.remove("is-letter-writing", "is-letter-complete", "is-link-active");
  contactLetterField?.classList.remove("is-sending");
  contactLetterLinks.forEach((link) => link.classList.remove("is-letter-target"));
  contactLetterLines.forEach((line) => {
    line.textContent = "";
    line.classList.remove("is-current");
  });
  requestAnimationFrame(drawContactLetter);
}

function stopContactLetter() {
  contactLetterActive = false;
  cancelAnimationFrame(contactLetterFrame);
}

function setContactLetterTarget(link) {
  contactLetterTarget = link;
  contactLetterLayout?.classList.toggle("is-link-active", Boolean(link));
  contactLetterLinks.forEach((candidate) => candidate.classList.toggle("is-letter-target", candidate === link));
  if (atlasReduceMotion.matches && contactLetterActive) drawContactLetter();
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

  atlasButtons.forEach((button) => {
    const active = !button.dataset.paperAreaShortcut && button.dataset.atlasTarget === activeId;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });

  if (options.updateHash !== false) {
    history.pushState(null, "", `#${activeId}`);
  }

  if (activeId === "contact") {
    requestAnimationFrame(startContactLetter);
  } else {
    stopContactLetter();
  }

  requestAnimationFrame(drawAtlasLines);
}

atlasButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    if (button.matches("[data-map-node]")) return;
    event.preventDefault();
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
let mapFrame = 0;
let graphHoverKey = null;
let graphLockedKey = null;
let currentGraphKey = null;
let currentGraphPaperIds = new Set();

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
  const slotsByArea = window.innerWidth <= 640 ? mobileTopicSlots : topicSlots;
  const areaIndexes = {};
  graphNodes.filter((node) => node.type === "topic").forEach((node) => {
    const area = slotsByArea[node.area] ? node.area : "default";
    const slots = slotsByArea[area];
    const index = areaIndexes[area] || 0;
    areaIndexes[area] = index + 1;
    const [baseX, baseY] = slots[index % slots.length];
    const cycle = Math.floor(index / slots.length);
    const x = Math.max(7, Math.min(93, baseX + cycle * 3));
    const y = Math.max(7, Math.min(94, baseY - cycle * 4));
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

  const mapRect = mapCanvas.getBoundingClientRect();
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
    const lineAnimation = highlightedPaper?.animation || "generic";
    const toNode = graphNodeByKey.get(edge.to);
    const [red, green, blue] = highlighted ? (toNode?.color || graphColors.default) : graphColors.default;
    mapContext.strokeStyle = highlighted
      ? `rgba(${red}, ${green}, ${blue}, 0.66)`
      : hasActiveNode
        ? "rgba(66, 91, 112, 0.045)"
        : `rgba(${red}, ${green}, ${blue}, 0.13)`;
    mapContext.lineWidth = highlighted ? (lineAnimation === "chi-search" ? 1.45 : 1.8) : 0.9;
    mapContext.setLineDash(highlighted
      ? lineAnimation === "chi-search" ? [2, 8] : lineAnimation === "vigor-frames" ? [7, 9] : [5, 9]
      : []);
    mapContext.lineDashOffset = highlighted
      ? -(time / (lineAnimation === "chi-search" ? 26 : 38) + index * 4)
      : 0;
    mapContext.beginPath();
    mapContext.moveTo(a.x, a.y);
    const cx = (a.x + b.x) * 0.5;
    const movement = highlighted ? Math.sin(time / 330 + index) * 12 : 0;
    const cy = (a.y + b.y) * 0.5 + (index % 2 === 0 ? -15 : 15) + movement;
    mapContext.quadraticCurveTo(cx, cy, b.x, b.y);
    mapContext.stroke();

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

function drawCursorField() {
  if (!atlasCursor || !cursorContext) return;

  resizeCanvas(atlasCursor, cursorContext, {
    width: window.innerWidth,
    height: window.innerHeight,
  });

  cursorContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
  cursorContext.strokeStyle = "rgba(0, 106, 220, 0.14)";
  cursorContext.lineWidth = 1;
  cursorContext.beginPath();
  cursorContext.arc(pointer.x, pointer.y, 34, 0, Math.PI * 2);
  cursorContext.stroke();

  cursorContext.fillStyle = "rgba(0, 159, 179, 0.22)";
  cursorContext.beginPath();
  cursorContext.arc(pointer.x, pointer.y, 2.6, 0, Math.PI * 2);
  cursorContext.fill();

  graphNodes.forEach((node) => {
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
  pointer = { x: event.clientX, y: event.clientY };
});

interactiveName?.addEventListener("pointermove", (event) => {
  if (atlasReduceMotion.matches) return;
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
  positionTopicNodes();
  drawAtlasLines();
  if (contactLetterActive) drawContactLetter();
  if (atlasReduceMotion.matches) drawCursorField();
});

atlasReduceMotion.addEventListener("change", () => {
  cancelAnimationFrame(cursorFrame);
  cancelAnimationFrame(mapFrame);
  drawAtlasLines();
  drawCursorField();
  if (!atlasReduceMotion.matches) {
    mapFrame = requestAnimationFrame(animateAtlasLines);
  }
});

if (atlasReduceMotion.matches) {
  drawAtlasLines();
} else {
  mapFrame = requestAnimationFrame(animateAtlasLines);
}
drawCursorField();
})();
