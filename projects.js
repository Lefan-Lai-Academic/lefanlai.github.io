(() => {
  const project = document.querySelector("[data-project-expanded]");
  if (!project) return;
  const details = project.querySelector("[data-project-details]");
  const open = project.querySelector("[data-project-open]");
  const back = project.querySelector("[data-project-back]");
  const summaryOnly = project.querySelectorAll("[data-project-summary-only]");
  const detailOnly = project.querySelectorAll("[data-project-detail-only]");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

  function setExpanded(expanded, { moveFocus = true, scroll = true } = {}) {
    project.dataset.projectExpanded = String(expanded);
    if (details) details.hidden = !expanded;
    if (back) back.hidden = !expanded;
    summaryOnly.forEach((element) => { element.hidden = expanded; });
    detailOnly.forEach((element) => { element.hidden = !expanded; });
    open?.setAttribute("aria-expanded", String(expanded));
    if (moveFocus) (expanded ? back : open)?.focus({ preventScroll: true });
    if (scroll) project.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
  }

  open?.addEventListener("click", () => setExpanded(true));
  back?.addEventListener("click", () => setExpanded(false));
  window.atlasProjects = {
    showOverview: () => setExpanded(false, { moveFocus: false, scroll: false }),
  };

  const stage = document.querySelector("[data-spatial-stage]");
  const structure = document.querySelector("[data-spatial-structure]");
  const rotate = document.querySelector("[data-spatial-rotate]");
  const announcement = document.querySelector("[data-spatial-announcement]");
  if (!stage || !structure || !rotate) return;
  let yaw = -32;
  let pitch = -24;
  let drag = null;

  function renderRotation() {
    structure.style.setProperty("--scene-turn", `${yaw.toFixed(1)}deg`);
    structure.style.setProperty("--scene-tilt", `${pitch.toFixed(1)}deg`);
  }

  function announceRotation() {
    if (announcement) announcement.textContent = `View rotated. Horizontal angle ${Math.round(yaw)} degrees; vertical angle ${Math.round(pitch)} degrees.`;
  }

  stage.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.button !== 0 || event.target.closest("button, a")) return;
    drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, yaw, pitch };
    stage.setPointerCapture(event.pointerId);
    stage.classList.add("is-dragging");
    stage.focus({ preventScroll: true });
    event.preventDefault();
  });

  stage.addEventListener("pointermove", (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    yaw = drag.yaw + (event.clientX - drag.x) * 0.5;
    pitch = Math.max(-70, Math.min(70, drag.pitch - (event.clientY - drag.y) * 0.4));
    renderRotation();
  });

  function finishDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    drag = null;
    stage.classList.remove("is-dragging");
    if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    announceRotation();
  }
  stage.addEventListener("pointerup", finishDrag);
  stage.addEventListener("pointercancel", finishDrag);
  stage.addEventListener("lostpointercapture", finishDrag);

  stage.addEventListener("keydown", (event) => {
    if (event.target !== stage) return;
    if (event.key === "ArrowLeft") yaw -= 15;
    else if (event.key === "ArrowRight") yaw += 15;
    else if (event.key === "ArrowUp") pitch = Math.min(70, pitch + 10);
    else if (event.key === "ArrowDown") pitch = Math.max(-70, pitch - 10);
    else if (event.key === "Home") { yaw = -32; pitch = -24; }
    else return;
    event.preventDefault();
    renderRotation();
    announceRotation();
  });

  rotate.addEventListener("click", () => {
    yaw += 90;
    renderRotation();
    announceRotation();
  });
})();
