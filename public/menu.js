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
    if (item.image) {
      entry.classList.add("has-photo");
      const thumb = document.createElement("a");
      thumb.className = "thumb";
      thumb.href = "#gallery";
      thumb.setAttribute("aria-label", "See photo of " + item.name);
      const img = document.createElement("img");
      img.src = item.image;
      img.alt = item.name;
      img.loading = "lazy";
      thumb.appendChild(img);
      entry.appendChild(thumb);
    }
    if (item.detail) {
      const detail = document.createElement("p");
      detail.appendChild(text(item.detail));
      entry.appendChild(detail);
    }
    return entry;
  }

  function card(item) {
    const entry = document.createElement("li");
    entry.className = "fav-card";
    if (item.image) {
      const img = document.createElement("img");
      img.src = item.image;
      img.alt = item.name;
      img.loading = "lazy";
      entry.appendChild(img);
    }
    const copy = document.createElement("div");
    copy.className = "fav-copy";
    const name = document.createElement("h4");
    name.appendChild(text(item.name));
    const price = document.createElement("span");
    price.className = "price";
    price.appendChild(text(item.price));
    copy.append(name, price);
    if (item.detail) {
      const detail = document.createElement("p");
      detail.appendChild(text(item.detail));
      copy.appendChild(detail);
    }
    entry.appendChild(copy);
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
        if (category.id === "favorites") {
          list.classList.add("fav-grid");
          (category.items || []).forEach((item) => list.appendChild(card(item)));
        } else {
          (category.items || []).forEach((item) => list.appendChild(row(item)));
        }
        section.appendChild(list);
        board.appendChild(section);
      });

      if (menu.footer) {
        const footer = document.createElement("p");
        footer.className = "menu-foot";
        footer.appendChild(text(menu.footer));
        board.appendChild(footer);
      }

      const shots = document.getElementById("shots");
      if (shots) {
        const seen = new Set([...shots.querySelectorAll("img")].map((img) => img.getAttribute("src")));
        categories.forEach((category) => {
          (category.items || []).forEach((item) => {
            if (!item.image || seen.has(item.image)) return;
            seen.add(item.image);
            const fig = document.createElement("figure");
            fig.className = "shot";
            const img = document.createElement("img");
            img.src = item.image;
            img.alt = item.name;
            img.loading = "lazy";
            const cap = document.createElement("figcaption");
            const a = document.createElement("a");
            a.href = "#" + category.id;
            a.appendChild(text(item.name));
            a.addEventListener("click", (e) => {
              e.preventDefault();
              show(category.id, false);
              document.getElementById("menu").scrollIntoView({ behavior: "smooth" });
            });
            cap.appendChild(a);
            fig.append(img, cap);
            shots.appendChild(fig);
          });
        });
      }

      const links = [...side.querySelectorAll("a")];
      const sections = [...board.querySelectorAll(".cat")];
      function show(id, scroll) {
        sections.forEach((section) => { section.hidden = section.id !== id; });
        links.forEach((link) => {
          if (link.getAttribute("href") === "#" + id) link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
        });
        if (scroll) side.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
      links.forEach((link) => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          show(link.getAttribute("href").slice(1), true);
        });
      });
      if (sections.length) show(sections[0].id, false);
    })
    .catch(() => {
      board.textContent = "The menu didn’t load. Refresh the page.";
    });
})();
