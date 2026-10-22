(function () {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  if (!toggle || !nav) return;

  function isOpen() {
    return toggle.getAttribute("aria-expanded") === "true";
  }

  function setOpen(open, restore) {
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
    if (open) {
      const first = nav.querySelector("a");
      if (first) first.focus();
    } else if (restore) {
      toggle.focus();
    }
  }

  toggle.addEventListener("click", () => setOpen(!isOpen(), false));

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false, false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen()) setOpen(false, true);
  });

  window.addEventListener("resize", () => {
    if (window.matchMedia("(min-width: 801px)").matches && isOpen()) {
      setOpen(false, false);
    }
  });
})();
