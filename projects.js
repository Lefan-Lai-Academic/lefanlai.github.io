(() => {
  const stage = document.querySelector("[data-spatial-stage]");
  const structure = document.querySelector("[data-spatial-structure]");
  const rotate = document.querySelector("[data-spatial-rotate]");
  const announcement = document.querySelector("[data-spatial-announcement]");
  if (!stage || !structure || !rotate) return;
  let turns = 0;
  rotate.addEventListener("click", () => {
    turns += 1;
    structure.style.setProperty("--scene-turn", `${-32 + turns * 90}deg`);
    if (announcement) announcement.textContent = `View rotated to ${(turns % 4) * 90} degrees from its starting position.`;
  });
})();
