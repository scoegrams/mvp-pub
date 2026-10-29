/* First small scroll from the top carries the visitor to the specials, once. */
(function () {
  const menu = document.getElementById("specials") || document.getElementById("menu");
  if (!menu || window.scrollY > 4 || location.hash) return;

  let done = false;

  function go() {
    if (done) return;
    done = true;
    cleanup();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    menu.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  function onWheel(event) {
    if (event.deltaY > 0 && window.scrollY <= 4) {
      event.preventDefault();
      go();
    }
  }

  let startY = null;
  function onTouchStart(event) { startY = event.touches[0].clientY; }
  function onTouchMove(event) {
    if (startY !== null && startY - event.touches[0].clientY > 12 && window.scrollY <= 4) {
      event.preventDefault();
      go();
    }
  }

  function onKey(event) {
    if (["ArrowDown", "PageDown", " "].includes(event.key) &&
        !/^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(document.activeElement.tagName) &&
        window.scrollY <= 4) {
      event.preventDefault();
      go();
    }
  }

  function onScroll() {
    if (window.scrollY > 4) { done = true; cleanup(); }
  }

  function cleanup() {
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("touchstart", onTouchStart);
    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("scroll", onScroll);
  }

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("keydown", onKey);
  window.addEventListener("scroll", onScroll, { passive: true });
})();
