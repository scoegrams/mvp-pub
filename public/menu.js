(function () {
  const board = document.getElementById("menu-board");
  const side = document.getElementById("menu-jump");
  if (!board || !side) return;

  function text(value) {
    return document.createTextNode(value || "");
  }

  function row(item) {
    const entry = document.createElement("li");
    entry.className = "menu-row";
    const name = document.createElement("h4");
    name.appendChild(text(item.name));
    const price = document.createElement("span");
    price.className = "price";
    price.appendChild(text(item.price));
    entry.append(name, price);
    if (item.detail) {
      const detail = document.createElement("p");
      detail.appendChild(text(item.detail));
      entry.appendChild(detail);
    }
    return entry;
  }

  fetch("/api/menu")
    .then((response) => {
      if (!response.ok) throw new Error("menu");
      return response.json();
    })
    .then((menu) => {
      const categories = menu.categories || [];
      side.replaceChildren();
      board.replaceChildren();

      categories.forEach((category) => {
        const link = document.createElement("a");
        link.href = "#" + category.id;
        link.appendChild(text(category.name));
        side.appendChild(link);

        const section = document.createElement("section");
        section.className = "cat";
        section.id = category.id;
        const heading = document.createElement("h3");
        heading.appendChild(text(category.name));
        section.appendChild(heading);
        if (category.note) {
          const note = document.createElement("p");
          note.className = "fine";
          note.appendChild(text(category.note));
          section.appendChild(note);
        }
        const list = document.createElement("ul");
        list.className = "menu-list";
        (category.items || []).forEach((item) => list.appendChild(row(item)));
        section.appendChild(list);
        board.appendChild(section);
      });

      if (menu.footer) {
        const footer = document.createElement("p");
        footer.className = "menu-foot";
        footer.appendChild(text(menu.footer));
        board.appendChild(footer);
      }

      const links = [...side.querySelectorAll("a")];
      const sections = [...board.querySelectorAll(".cat")];
      if ("IntersectionObserver" in window && sections.length) {
        const seen = new Map();
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => seen.set(entry.target.id, entry.isIntersecting));
            const current = sections.find((section) => seen.get(section.id));
            links.forEach((link) => {
              if (current && link.getAttribute("href") === "#" + current.id) {
                link.setAttribute("aria-current", "true");
              } else {
                link.removeAttribute("aria-current");
              }
            });
          },
          { rootMargin: "-30% 0px -55% 0px" }
        );
        sections.forEach((section) => observer.observe(section));
      }
    })
    .catch(() => {
      board.textContent = "The menu didn’t load. Refresh the page.";
    });
})();
