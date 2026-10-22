(function () {
  const bar = document.querySelector(".top");
  if (!bar) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let target = 0.42;
  let current = 0.42;
  let ticking = false;

  function paint() {
    current += (target - current) * 0.16;
    bar.style.setProperty("--metal-x", (current * 100).toFixed(2) + "%");
    if (Math.abs(target - current) > 0.001) {
      requestAnimationFrame(paint);
    } else {
      ticking = false;
    }
  }

  function aim(clientX) {
    const box = bar.getBoundingClientRect();
    if (!box.width) return;
    target = Math.min(1, Math.max(0, (clientX - box.left) / box.width));
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(paint);
    }
  }

  window.addEventListener("pointermove", (event) => aim(event.clientX), { passive: true });
})();
