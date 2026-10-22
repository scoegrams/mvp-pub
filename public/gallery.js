(function () {
  const shots = document.getElementById("shots");
  const view = document.getElementById("view");
  if (!shots || !view || typeof view.showModal !== "function") return;

  const frame = view.querySelector(".view-pic");
  const cap = frame.querySelector("figcaption");
  const closeBtn = view.querySelector(".view-close");
  const photo = document.createElement("img");
  photo.alt = "";
  frame.prepend(photo);
  let last = null;

  function labelFor(figure, img) {
    const caption = figure && figure.querySelector("figcaption");
    const words = (caption && caption.textContent.trim()) || img.alt || "photo";
    return "View " + words;
  }

  function arm(figure) {
    if (!figure || !figure.classList.contains("shot")) return;
    const img = figure.querySelector("img");
    if (!img || img.closest(".shot-open")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "shot-open";
    btn.setAttribute("aria-label", labelFor(figure, img));
    img.replaceWith(btn);
    btn.appendChild(img);
  }

  function openFrom(trigger) {
    const img = trigger.querySelector("img") || trigger;
    const figure = img.closest(".shot");
    last = trigger;
    photo.src = img.currentSrc || img.src;
    photo.alt = img.alt || "";
    cap.textContent = (figure && figure.querySelector("figcaption") && figure.querySelector("figcaption").textContent.trim()) || "";
    if (!view.open) view.showModal();
  }

  shots.querySelectorAll(".shot").forEach(arm);
  new MutationObserver((records) => {
    records.forEach((record) => {
      record.addedNodes.forEach((node) => {
        if (node.nodeType === 1) arm(node);
      });
    });
  }).observe(shots, { childList: true });

  shots.addEventListener("click", (event) => {
    const trigger = event.target.closest(".shot-open");
    if (!trigger || !shots.contains(trigger)) return;
    event.preventDefault();
    openFrom(trigger);
  });

  closeBtn.addEventListener("click", () => view.close());
  view.addEventListener("click", (event) => {
    if (event.target === view) view.close();
  });
  view.addEventListener("close", () => {
    photo.removeAttribute("src");
    photo.alt = "";
    cap.textContent = "";
    if (last && typeof last.focus === "function") last.focus();
    last = null;
  });
})();
