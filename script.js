(() => {
  const S = SITE_DATA.settings;

  const Cart = window.AuroraCart;
  const money = (n) =>
    Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const CAKE_FILLINGS = [
    "Brigadeiro",
    "Brigadeiro branco",
    "Brigadeiro & morango",
    "Doce de leite",
    "Paçoca",
    "Coco",
    "Doce de leite / abacaxi",
    "Ninho",
    "Caramelo salgado",
    "Creme de avelã",
    "Ouro Branco",
    "Pistache",
    "Ferrero",
  ];
  const CAKE_BATTERS = ["Branca", "Chocolate"];
  const CAKE_SIZES = [
    { label: "Bolo parabéns", detail: "serve 7 fatias", price: 65 },
    { label: "Bolo comemore", detail: "serve 9 fatias", price: 75 },
    { label: "Bolo celebrar", detail: "serve 13 fatias", price: 95 },
  ];
  const MAX_FILLINGS = 2;
  const TOPPER_PRICE = 25;
  const INITIAL_PRODUCTS_LIMIT = 4;
  const GALLERY_LIMIT = 8;
  let activeCategory = "todos";
  let visibleProductsCount = INITIAL_PRODUCTS_LIMIT;
  let galleryExpanded = false;
  let lightboxProduct = null;
  let lightboxQty = 1;
  let lightboxFlavors = [];
  let lightboxBatter = "";
  let lightboxSize = null;
  let lightboxTopper = false;
  let heroWordIndex = 0;

  function catalogCategories() {
    return SITE_DATA.categories || [];
  }

  function catalogProducts() {
    return SITE_DATA.products || [];
  }

  function catalogGallery() {
    return (SITE_DATA.gallery || []).slice(0, GALLERY_LIMIT);
  }

  /* ---------- helpers ---------- */
  function waLink(phone, text = "") {
    const digits = String(phone || "").replace(/\D/g, "");
    const base = `https://wa.me/${digits}`;
    return text ? `${base}?text=${encodeURIComponent(text)}` : base;
  }

  function mapsLink(address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }

  function maskPhone(value) {
    const d = value.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 10) {
      return d
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }
    return d
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }

  function imgSrc(path) {
    return encodeURI(String(path || ""));
  }

  /** Miniatura leve para cards/galeria (fotos_bolos/_thumbs/...). */
  function thumbSrc(path) {
    const raw = String(path || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) return imgSrc(raw);
    const cleaned = raw.replace(/^\/+/, "");
    if (!cleaned.startsWith("fotos_bolos/")) return imgSrc(raw);
    const rest = cleaned.slice("fotos_bolos/".length);
    if (rest.startsWith("_thumbs/")) return imgSrc(cleaned);
    const noExt = rest.replace(/\.(jpe?g|png|webp)$/i, "");
    return imgSrc(`fotos_bolos/_thumbs/${noExt}.jpg`);
  }

  function categoryName(id) {
    return catalogCategories().find((c) => c.id === id)?.name || id;
  }

  function isCustomCake(product) {
    return ["bolos", "destaques"].includes(product?.category);
  }

  function isBentoCake(product) {
    return product?.category === "bento";
  }

  const MAX_BENTO_FLAVORS = 2;

  function toast(msg, withCartLink = false) {
    const el = document.getElementById("cart-feedback");
    if (!el) return;
    el.innerHTML = withCartLink
      ? `<span class="cart-feedback__left"><span class="cart-feedback__check" aria-hidden="true">✓</span><span class="cart-feedback__text">${msg}</span></span><a class="cart-feedback__btn" href="cart.html">Ver carrinho</a>`
      : `<span class="cart-feedback__left"><span class="cart-feedback__check" aria-hidden="true">✓</span><span class="cart-feedback__text">${msg}</span></span>`;
    el.hidden = false;
    el.classList.add("is-visible");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => {
      el.classList.remove("is-visible");
      el.hidden = true;
    }, 2600);
  }

  /* ---------- brand / static content ---------- */
  function hydrateBrand() {
    document.getElementById("brand-name").textContent = S.brandName;
    document.getElementById("brand-sub").textContent = S.brandSub;
    document.getElementById("footer-brand-name").textContent = S.brandName;
    document.getElementById("footer-brand-sub").textContent = S.brandSub;
    document.getElementById("footer-copy-name").textContent = S.brandName;
    document.getElementById("footer-tagline").textContent =
      "Feito com amor · confeitaria artesanal";
    document.getElementById("hero-title-line-1").textContent = S.heroTitle1 || "Bolos artesanais feitos com carinho";
    document.getElementById("hero-title-line-2").textContent = S.heroTitle2 || "para deixar seu momento mais";
    document.getElementById("hero-lead").textContent = S.tagline;
    document.getElementById("hero-categories").textContent = S.categoriesLine;
    document.getElementById("hero-place").textContent = S.city;
    document.getElementById("footer-year").textContent = new Date().getFullYear();
    document.getElementById("footer-address").textContent = S.address.split("·")[0].trim();
    document.getElementById("contact-address-text").textContent = S.address;
    document.getElementById("order-pickup").textContent =
      `Retire em ${S.address}. Atendimento combinado pelo WhatsApp.`;

    document.getElementById("hero-bg").style.backgroundImage = `url('${encodeURI(thumbSrc(S.heroImage))}')`;
    const sobreImg = document.getElementById("sobre-image");
    if (sobreImg) {
      sobreImg.loading = "lazy";
      sobreImg.decoding = "async";
      sobreImg.src = encodeURI(thumbSrc(S.aboutImage));
    }
    const contactImg = document.getElementById("contact-image");
    if (contactImg) {
      contactImg.loading = "lazy";
      contactImg.decoding = "async";
      contactImg.src = encodeURI(thumbSrc(S.contactImage));
    }

    const sobre = document.getElementById("sobre-text");
    sobre.innerHTML = `<p>${S.sobreText1}</p><p>${S.sobreText2}</p>`;

    const words = document.getElementById("hero-words");
    words.innerHTML = S.heroWords
      .map((w, i) => `<span class="${i === 0 ? "is-active" : ""}">${w}</span>`)
      .join("");
    document.getElementById("hero-word-sr").textContent = S.heroWords[0];

    const probe = document.createElement("span");
    probe.style.cssText =
      "position:absolute;visibility:hidden;pointer-events:none;white-space:nowrap;font-family:var(--font-brand),Allura,cursive;font-size:1.22em";
    words.appendChild(probe);
    let maxW = 0;
    S.heroWords.forEach((w) => {
      probe.textContent = w;
      maxW = Math.max(maxW, probe.offsetWidth);
    });
    probe.remove();
    if (maxW > 0 && window.matchMedia("(min-width: 641px)").matches) {
      words.style.minWidth = `${Math.ceil(maxW)}px`;
    }

    document.getElementById("contact-address").href = mapsLink(S.address);
    document.getElementById("footer-place").href = mapsLink(S.address);
  }

  function buildMarquee() {
    const track = document.getElementById("marquee-track");
    const items = [...SITE_DATA.marquee, ...SITE_DATA.marquee];
    track.innerHTML = items
      .map(
        (t) =>
          `<span class="marquee__item">${t}<span class="marquee__dot" aria-hidden="true"></span></span>`
      )
      .join("");
  }

  function rotateHeroWords() {
    const spans = [...document.querySelectorAll("#hero-words span")];
    if (spans.length < 2) return;
    setInterval(() => {
      spans[heroWordIndex].classList.remove("is-active");
      heroWordIndex = (heroWordIndex + 1) % spans.length;
      spans[heroWordIndex].classList.add("is-active");
      document.getElementById("hero-word-sr").textContent =
        spans[heroWordIndex].textContent;
    }, 2800);
  }

  /* ---------- products ---------- */
  function cardHTML(p) {
    const badge = p.bestSeller
      ? `<span class="product-card__badge product-card__badge--best">Mais vendido</span>`
      : "";

    return `
      <article class="product-card" data-id="${p.id}">
        <button type="button" class="product-card__hit" data-open="${p.id}" aria-label="Ver ${p.name}"></button>
        <div class="product-card__img">
          ${badge}
          <img src="${thumbSrc(p.image)}" alt="${p.name}" loading="lazy" decoding="async" width="480" height="600">
          <span class="product-card__img-veil" aria-hidden="true"></span>
        </div>
        <div class="product-card__body">
          <span class="product-card__category">${categoryName(p.category)}</span>
          <h3 class="product-card__name">${p.name}</h3>
          <p class="product-card__desc">${p.description}</p>
          <div class="product-card__footer">
            <div class="product-card__meta">
              ${p.size ? `<span class="product-card__size">${p.size}</span>` : ""}
              ${p.flavors?.length ? `<span class="product-card__flavors">${p.flavors.length} sabores</span>` : `<span class="product-card__flavors">Sob consulta</span>`}
            </div>
            <button type="button" class="product-card__add" data-open="${p.id}">
              <span>Adicionar</span>
              <span class="ico ico--plus" aria-hidden="true"></span>
            </button>
          </div>
        </div>
      </article>`;
  }

  function renderFilters() {
    const el = document.getElementById("category-filter");
    el.innerHTML = catalogCategories()
      .map(
        (c) =>
          `<button type="button" class="filter-chip ${c.id === activeCategory ? "is-active" : ""}" data-cat="${c.id}">${c.name}</button>`
      )
      .join("");
  }

  function accordionSection({ id, title, summary, body, open = false, done = false }) {
    return `
      <div class="order-acc ${open ? "is-open" : ""} ${done ? "is-done" : ""}" id="${id}">
        <button type="button" class="order-acc__head" data-acc-toggle="${id}">
          <span class="order-acc__title">${title}</span>
          <span class="order-acc__summary" id="${id}-summary">${summary}</span>
          <span class="order-acc__chevron" aria-hidden="true">▾</span>
        </button>
        <div class="order-acc__body"><div class="order-acc__inner">${body}</div></div>
      </div>`;
  }

  function setAccordionSummary(id, text) {
    const el = document.getElementById(`${id}-summary`);
    if (el) el.textContent = text;
  }

  function setAccordionState(id, { open, done }) {
    const el = document.getElementById(id);
    if (!el) return;
    if (open != null) el.classList.toggle("is-open", Boolean(open));
    if (done != null) el.classList.toggle("is-done", Boolean(done));
  }

  function openAccordion(id) {
    setAccordionState(id, { open: true });
  }

  function bindLightboxAccordions(root) {
    root.querySelectorAll("[data-acc-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const acc = document.getElementById(btn.dataset.accToggle);
        acc?.classList.toggle("is-open");
      });
    });
  }

  function updateLightboxAccordions() {
    if (!lightboxProduct || !isCustomCake(lightboxProduct)) return;

    const fillingsDone = lightboxFlavors.length > 0;
    setAccordionSummary(
      "acc-fillings",
      fillingsDone ? lightboxFlavors.join(" / ") : "obrigatório"
    );
    setAccordionState("acc-fillings", { done: fillingsDone });

    setAccordionSummary("acc-batter", lightboxBatter || "obrigatório");
    setAccordionState("acc-batter", { done: Boolean(lightboxBatter) });

    const sizeSummary = lightboxSize
      ? `${lightboxSize.label} · ${money(lightboxSize.price)}`
      : "obrigatório";
    setAccordionSummary("acc-size", sizeSummary);
    setAccordionState("acc-size", { done: Boolean(lightboxSize) });

    setAccordionSummary(
      "acc-extra",
      lightboxTopper ? `+ ${money(TOPPER_PRICE)}` : "opcional"
    );
    setAccordionState("acc-extra", { done: lightboxTopper });
  }

  function renderProducts() {
    const all = catalogProducts();
    const list =
      activeCategory === "todos"
        ? all
        : all.filter((p) => p.category === activeCategory);
    const hasMoreThanLimit = list.length > INITIAL_PRODUCTS_LIMIT;
    const visibleList = list.slice(0, visibleProductsCount);

    document.getElementById("products-grid").innerHTML = visibleList.map(cardHTML).join("");

    const actions = document.getElementById("products-actions");
    const moreBtn = document.getElementById("products-more");
    const collapseBtn = document.getElementById("products-collapse");
    const remaining = Math.max(0, list.length - visibleList.length);
    actions.hidden = !hasMoreThanLimit;
    if (moreBtn) {
      moreBtn.hidden = remaining === 0;
      moreBtn.textContent = remaining > INITIAL_PRODUCTS_LIMIT
        ? `Ver mais ${INITIAL_PRODUCTS_LIMIT} bolos`
        : `Ver mais ${remaining} bolos`;
    }
    if (collapseBtn) {
      collapseBtn.hidden = visibleList.length <= INITIAL_PRODUCTS_LIMIT;
    }

    const best = catalogProducts().filter((p) => p.bestSeller).slice(0, 3);
    document.getElementById("bestsellers-grid").innerHTML = best.map(cardHTML).join("");
  }

  function renderGallery() {
    const gallery = catalogGallery();
    const hasMoreThanLimit = gallery.length > INITIAL_PRODUCTS_LIMIT;
    const visibleGallery = galleryExpanded || !hasMoreThanLimit
      ? gallery
      : gallery.slice(0, INITIAL_PRODUCTS_LIMIT);

    document.getElementById("gallery-grid").innerHTML = visibleGallery
      .map((src, i) => {
        const product = productForGallerySrc(src, i);
        const label = product.name || `Modelo ${i + 1}`;
        return `<figure class="gallery__item">
          <button type="button" class="gallery__hit" data-gallery-index="${i}" data-gallery-src="${String(src).replace(/"/g, "&quot;")}" aria-label="Encomendar ${label}">
            <img src="${thumbSrc(src)}" alt="${label}" loading="lazy" decoding="async" width="480" height="600">
            <span class="gallery__hit-label">Encomendar</span>
          </button>
        </figure>`;
      })
      .join("");

    const actions = document.getElementById("gallery-actions");
    const toggle = document.getElementById("gallery-toggle");
    actions.hidden = !hasMoreThanLimit;
    toggle.textContent = galleryExpanded ? "Ver menos fotos" : "Ver mais fotos";
    toggle.setAttribute("aria-expanded", galleryExpanded ? "true" : "false");
  }

  /* ---------- lightbox ---------- */
  function productForGallerySrc(src, index) {
    const products = catalogProducts();
    const exact = products.find((p) => String(p.image) === String(src));
    if (exact) return { ...exact, image: src };
    const base = String(src).split("/").pop();
    const byBase = products.find((p) => String(p.image).split("/").pop() === base);
    if (byBase) return { ...byBase, image: src };
    return {
      id: `gallery-${index + 1}`,
      name: "Modelo da galeria",
      description: "Inspiração da galeria — monte com massa, recheio e tamanho para encomendar.",
      category: "bolos",
      flavors: [],
      image: src,
      bestSeller: false,
    };
  }

  function openLightbox(idOrProduct) {
    const p =
      idOrProduct && typeof idOrProduct === "object"
        ? idOrProduct
        : catalogProducts().find((x) => x.id === idOrProduct);
    if (!p) return;
    lightboxProduct = p;
    lightboxQty = 1;
    lightboxFlavors = isCustomCake(p) || isBentoCake(p)
      ? []
      : (p.flavors?.[0] ? [p.flavors[0]] : []);
    lightboxBatter = isCustomCake(p) ? CAKE_BATTERS[0] : "";
    lightboxSize = isCustomCake(p) ? CAKE_SIZES[0] : null;
    lightboxTopper = false;

    document.getElementById("lightbox-img").src = thumbSrc(p.image);
    document.getElementById("lightbox-img").alt = p.name;
    document.getElementById("lightbox-category").textContent = categoryName(p.category);
    document.getElementById("lightbox-title").textContent = p.name;
    document.getElementById("lightbox-desc").textContent = p.description;
    document.getElementById("lightbox-notes").value = "";
    document.getElementById("order-error").hidden = true;
    updateLightboxQty();

    const flavorsEl = document.getElementById("lightbox-flavors");
    if (isCustomCake(p)) {
      flavorsEl.hidden = false;
      flavorsEl.innerHTML = [
        accordionSection({
          id: "acc-fillings",
          title: `Escolha até ${MAX_FILLINGS} recheios *`,
          summary: "obrigatório",
          open: true,
          body: `
            <div class="flavor-list__grid flavor-list__grid--wide flavor-list__grid--scroll">
              ${CAKE_FILLINGS.map(
                (f) => `
                <label class="flavor-option">
                  <input type="checkbox" name="flavor" value="${f}">
                  <span class="flavor-option__mark" aria-hidden="true"></span>
                  <span class="flavor-option__text">${f}</span>
                </label>`
              ).join("")}
            </div>`,
        }),
        accordionSection({
          id: "acc-batter",
          title: "Escolha a massa *",
          summary: lightboxBatter,
          open: false,
          done: true,
          body: `
            <div class="flavor-list__grid">
              ${CAKE_BATTERS.map(
                (b, i) => `
                <label class="flavor-option">
                  <input type="radio" name="batter" value="${b}" ${i === 0 ? "checked" : ""}>
                  <span class="flavor-option__mark" aria-hidden="true"></span>
                  <span class="flavor-option__text">${b}</span>
                </label>`
              ).join("")}
            </div>`,
        }),
        accordionSection({
          id: "acc-size",
          title: "Linha Celebre — tamanho *",
          summary: lightboxSize
            ? `${lightboxSize.label} · ${money(lightboxSize.price)}`
            : "obrigatório",
          open: false,
          done: true,
          body: `
            <div class="size-list">
              ${CAKE_SIZES.map(
                (size, i) => `
                <label class="size-option">
                  <input type="radio" name="cake-size" value="${size.label}" data-price="${size.price}" data-detail="${size.detail}" ${i === 0 ? "checked" : ""}>
                  <span class="size-option__content">
                    <strong>${size.label}</strong>
                    <small>${size.detail}</small>
                  </span>
                  <b>${money(size.price)}</b>
                </label>`
              ).join("")}
            </div>`,
        }),
        accordionSection({
          id: "acc-extra",
          title: "Topo personalizado",
          summary: "opcional",
          open: false,
          body: `
            <label class="extra-option">
              <input type="checkbox" id="lightbox-topper">
              <span class="extra-option__content">
                <strong>Topo personalizado</strong>
                <small>Adicionar topo decorativo ao bolo</small>
              </span>
              <b>+ ${money(TOPPER_PRICE)}</b>
            </label>`,
        }),
      ].join("");

      bindLightboxAccordions(flavorsEl);

      function syncFillingLimit() {
        const inputs = [...flavorsEl.querySelectorAll('input[name="flavor"]')];
        const checked = inputs.filter((item) => item.checked);
        const limitReached = checked.length >= MAX_FILLINGS;
        inputs.forEach((item) => {
          item.disabled = limitReached && !item.checked;
        });
        lightboxFlavors = checked.map((item) => item.value);
      }

      flavorsEl.querySelectorAll('input[name="flavor"]').forEach((input) => {
        input.addEventListener("change", () => {
          const checked = [...flavorsEl.querySelectorAll('input[name="flavor"]:checked')];
          if (checked.length > MAX_FILLINGS) {
            input.checked = false;
            const err = document.getElementById("order-error");
            err.textContent = `Escolha no máximo ${MAX_FILLINGS} recheios.`;
            err.hidden = false;
            syncFillingLimit();
            return;
          }
          document.getElementById("order-error").hidden = true;
          syncFillingLimit();
          updateLightboxAccordions();
          if (lightboxFlavors.length >= MAX_FILLINGS) {
            setAccordionState("acc-fillings", { open: false, done: true });
            openAccordion("acc-batter");
          }
        });
      });
      flavorsEl.querySelectorAll('input[name="batter"]').forEach((input) => {
        input.addEventListener("change", () => {
          lightboxBatter = input.value;
          updateLightboxAccordions();
          setAccordionState("acc-batter", { open: false, done: true });
          openAccordion("acc-size");
        });
      });
      flavorsEl.querySelectorAll('input[name="cake-size"]').forEach((input) => {
        input.addEventListener("change", () => {
          lightboxSize = {
            label: input.value,
            detail: input.dataset.detail || "",
            price: Number(input.dataset.price || 0),
          };
          updateLightboxAccordions();
          updateLightboxQty();
          setAccordionState("acc-size", { open: false, done: true });
        });
      });
      flavorsEl.querySelector("#lightbox-topper")?.addEventListener("change", (event) => {
        lightboxTopper = Boolean(event.target.checked);
        updateLightboxAccordions();
        updateLightboxQty();
      });
    } else if (isBentoCake(p) && p.flavors?.length) {
      flavorsEl.hidden = false;
      flavorsEl.innerHTML = accordionSection({
        id: "acc-flavor",
        title: `Escolha até ${MAX_BENTO_FLAVORS} sabores *`,
        summary: "obrigatório",
        open: true,
        done: false,
        body: `
          <div class="flavor-list__grid">
            ${p.flavors
              .map(
                (f) => `
              <label class="flavor-option">
                <input type="checkbox" name="flavor" value="${f}">
                <span class="flavor-option__mark" aria-hidden="true"></span>
                <span class="flavor-option__text">${f}</span>
              </label>`
              )
              .join("")}
          </div>`,
      });

      bindLightboxAccordions(flavorsEl);
      flavorsEl.querySelectorAll('input[name="flavor"]').forEach((input) => {
        input.addEventListener("change", () => {
          const checked = [...flavorsEl.querySelectorAll('input[name="flavor"]:checked')];
          if (checked.length > MAX_BENTO_FLAVORS) {
            input.checked = false;
            const err = document.getElementById("order-error");
            err.textContent = `No bento cake, escolha no máximo ${MAX_BENTO_FLAVORS} sabores.`;
            err.hidden = false;
            return;
          }
          lightboxFlavors = checked.map((item) => item.value);
          document.getElementById("order-error").hidden = true;
          setAccordionSummary(
            "acc-flavor",
            lightboxFlavors.length ? lightboxFlavors.join(" / ") : "obrigatório"
          );
          setAccordionState("acc-flavor", {
            open: lightboxFlavors.length === 0,
            done: lightboxFlavors.length > 0,
          });
        });
      });
    } else if (p.flavors?.length) {
      flavorsEl.hidden = false;
      flavorsEl.innerHTML = accordionSection({
        id: "acc-flavor",
        title: "Escolha o sabor *",
        summary: lightboxFlavors[0] || "obrigatório",
        open: true,
        done: Boolean(lightboxFlavors[0]),
        body: `
          <div class="flavor-list__grid">
            ${p.flavors
              .map(
                (f, i) => `
              <label class="flavor-option">
                <input type="radio" name="flavor" value="${f}" ${i === 0 ? "checked" : ""}>
                <span class="flavor-option__mark" aria-hidden="true"></span>
                <span class="flavor-option__text">${f}</span>
              </label>`
              )
              .join("")}
          </div>`,
      });

      bindLightboxAccordions(flavorsEl);
      flavorsEl.querySelectorAll('input[name="flavor"]').forEach((input) => {
        input.addEventListener("change", () => {
          lightboxFlavors = [input.value];
          setAccordionSummary("acc-flavor", input.value);
          setAccordionState("acc-flavor", { open: false, done: true });
        });
      });
    } else {
      flavorsEl.hidden = true;
      flavorsEl.innerHTML = "";
    }

    const lightbox = document.getElementById("order-lightbox");
    lightbox.hidden = false;
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function updateLightboxQty() {
    if (!lightboxProduct) return;
    const unitPrice = document.getElementById("lightbox-unit-price");
    const basePrice = lightboxSize?.price || 0;
    const topperValue = lightboxTopper ? TOPPER_PRICE : 0;
    const unit = isCustomCake(lightboxProduct) ? basePrice + topperValue : 0;
    if (unitPrice) {
      unitPrice.textContent = unit > 0
        ? `${money(unit)}${lightboxTopper ? " com topo personalizado" : ""}`
        : "Valor sob consulta";
    }
    document.getElementById("lightbox-qty-value").textContent = String(lightboxQty);
    const lineTotal = document.getElementById("lightbox-line-total");
    if (lineTotal) lineTotal.textContent = unit > 0 ? money(unit * lightboxQty) : "";
  }

  function closeLightbox() {
    const lightbox = document.getElementById("order-lightbox");
    lightbox.classList.remove("is-open");
    lightbox.hidden = true;
    lightboxProduct = null;
    if (document.getElementById("cart-drawer").hidden) {
      document.body.style.overflow = "";
    }
  }

  function addFromLightbox() {
    if (!lightboxProduct || !Cart) return;
    if (isCustomCake(lightboxProduct) && lightboxFlavors.length === 0) {
      const err = document.getElementById("order-error");
      err.textContent = "Escolha pelo menos 1 recheio.";
      err.hidden = false;
      openAccordion("acc-fillings");
      return;
    }
    if (isBentoCake(lightboxProduct) && lightboxProduct.flavors?.length) {
      if (!lightboxFlavors.length) {
        const err = document.getElementById("order-error");
        err.textContent = "Escolha pelo menos 1 sabor no bento cake.";
        err.hidden = false;
        openAccordion("acc-flavor");
        return;
      }
      if (lightboxFlavors.length > MAX_BENTO_FLAVORS) {
        const err = document.getElementById("order-error");
        err.textContent = `No bento cake, escolha no máximo ${MAX_BENTO_FLAVORS} sabores.`;
        err.hidden = false;
        openAccordion("acc-flavor");
        return;
      }
    } else if (!isCustomCake(lightboxProduct) && lightboxProduct.flavors?.length && !lightboxFlavors.length) {
      const err = document.getElementById("order-error");
      err.textContent = "Escolha um sabor.";
      err.hidden = false;
      openAccordion("acc-flavor");
      return;
    }
    const notes = document.getElementById("lightbox-notes").value.trim();
    const unit =
      isCustomCake(lightboxProduct) && lightboxSize
        ? lightboxSize.price + (lightboxTopper ? TOPPER_PRICE : 0)
        : 0;
    const flavorMeta = [
      lightboxFlavors.length ? lightboxFlavors.join(" / ") : "",
      lightboxBatter && `Massa ${lightboxBatter}`,
    ]
      .filter(Boolean)
      .join(" · ");
    const noteMeta = [notes, lightboxTopper ? "Topo personalizado" : ""]
      .filter(Boolean)
      .join(" · ");
    Cart.addItem({
      productId: lightboxProduct.id,
      name: lightboxProduct.name,
      price: unit,
      qty: lightboxQty,
      flavor: flavorMeta,
      size: lightboxSize
        ? `${lightboxSize.label} · ${lightboxSize.detail}`
        : (lightboxProduct.size || ""),
      image: lightboxProduct.image,
      notes: noteMeta,
    });
    closeLightbox();
    renderCart();
    pulseCart();
    toast("Adicionado ao carrinho", true);
  }

  /* ---------- cart (padrão Aurora) ---------- */
  function pulseCart() {
    const btn = document.getElementById("cart-open");
    if (!btn) return;
    btn.classList.add("is-pulse");
    setTimeout(() => btn.classList.remove("is-pulse"), 600);
  }

  function renderCartBadge() {
    if (!Cart) return;
    const count = Cart.count();
    const badge = document.getElementById("cart-count");
    const totalEl = document.getElementById("header-cart-total");
    if (badge) {
      badge.hidden = count <= 0;
      badge.textContent = String(count);
    }
    if (totalEl) totalEl.hidden = true;
  }

  function renderCart() {
    if (!Cart) return;
    renderCartBadge();
    const items = Cart.getItems();
    const count = Cart.count();

    const subtitle = document.getElementById("cart-subtitle");
    if (subtitle) {
      subtitle.textContent = count
        ? `${count} ${count === 1 ? "item" : "itens"}`
        : "Nenhum item ainda";
    }

    const body = document.getElementById("cart-items");
    const totalRow = document.getElementById("cart-total-row");
    const finalRow = document.getElementById("cart-final-row");
    const checkout = document.getElementById("cart-checkout");
    const goMenu = document.getElementById("cart-go-menu");

    if (!items.length) {
      body.innerHTML = `
        <div class="cart-drawer__empty-box">
          <p class="cart-drawer__empty">Seu carrinho está vazio</p>
          <p class="cart-drawer__empty-note">Escolha algo no cardápio.</p>
        </div>`;
      if (totalRow) totalRow.hidden = true;
      if (finalRow) finalRow.hidden = true;
      if (checkout) checkout.hidden = true;
      if (goMenu) goMenu.hidden = false;
      return;
    }

    if (goMenu) goMenu.hidden = true;
    body.innerHTML = items
      .map((i) => {
        const meta = [i.size, i.flavor].filter(Boolean).join(" · ");
        const line = (Number(i.price) || 0) * (Number(i.qty) || 0);
        return `
      <article class="cart-item">
        <img class="cart-item__img" src="${thumbSrc(i.image || "")}" alt="" loading="lazy" decoding="async">
        <div>
          <p class="cart-item__name">${i.name}</p>
          ${meta ? `<p class="cart-item__meta">${meta}</p>` : ""}
          ${i.notes ? `<p class="cart-item__meta">${i.notes}</p>` : ""}
          <div class="cart-item__row">
            <div class="cart-qty" data-qty-key="${i.key}">
              <button type="button" class="cart-qty__btn" data-qty-delta="-1" aria-label="Diminuir">−</button>
              <span class="cart-qty__value">${i.qty}</span>
              <button type="button" class="cart-qty__btn cart-qty__btn--plus" data-qty-delta="1" aria-label="Aumentar">+</button>
            </div>
            ${line > 0 ? `<strong class="cart-item__price">${money(line)}</strong>` : ""}
            <button type="button" class="cart-item__remove" data-remove="${i.key}" aria-label="Remover">
              <span class="ico ico--trash" aria-hidden="true"></span>
            </button>
          </div>
        </div>
      </article>`;
      })
      .join("");

    const subtotal = Cart.subtotal();
    const total = Cart.payable();

    const subtotalEl = document.getElementById("cart-subtotal");
    const totalEl = document.getElementById("cart-total");
    if (subtotalEl) subtotalEl.textContent = money(subtotal);
    if (totalEl) totalEl.textContent = money(total);
    if (totalRow) totalRow.hidden = false;
    if (finalRow) finalRow.hidden = false;
    if (checkout) checkout.hidden = false;

    const pickupNote = document.getElementById("cart-pickup-note");
    const pickupAddr = document.getElementById("cart-pickup-address");
    if (pickupNote) pickupNote.hidden = false;
    if (pickupAddr) pickupAddr.textContent = S.address;

    const customer = Cart.loadCustomer();
    const nome = document.getElementById("cart-nome");
    const sobrenome = document.getElementById("cart-sobrenome");
    const phone = document.getElementById("cart-phone");
    if (nome && !nome.value) nome.value = customer.nome;
    if (sobrenome && !sobrenome.value) sobrenome.value = customer.sobrenome;
    if (phone && !phone.value && customer.phone) {
      phone.value = Cart.formatPhoneBR(customer.phone);
    }
  }

  function openCart(e) {
    if (e) e.preventDefault();
    const drawer = document.getElementById("cart-drawer");
    drawer.hidden = false;
    requestAnimationFrame(() => drawer.classList.add("is-open"));
    document.body.style.overflow = "hidden";
    renderCart();
  }

  function closeCart() {
    const drawer = document.getElementById("cart-drawer");
    drawer.classList.remove("is-open");
    setTimeout(() => {
      drawer.hidden = true;
      if (document.getElementById("order-lightbox").hidden) {
        document.body.style.overflow = "";
      }
    }, 260);
  }

  function checkoutCart() {
    if (!Cart) return;
    const err = document.getElementById("cart-error");
    const nome = document.getElementById("cart-nome").value.trim();
    const sobrenome = document.getElementById("cart-sobrenome").value.trim();
    const phoneInput = document.getElementById("cart-phone");
    phoneInput.value = maskPhone(phoneInput.value);
    const phone = phoneInput.value.replace(/\D/g, "");
    const fulfillment = "retirada";

    if (!Cart.getItems().length) {
      err.textContent = "Adicione pelo menos um item.";
      err.hidden = false;
      return;
    }
    if (!nome || !sobrenome) {
      err.textContent = "Informe nome e sobrenome.";
      err.hidden = false;
      return;
    }
    if (phone.length < 10) {
      err.textContent = "Informe um WhatsApp válido.";
      err.hidden = false;
      return;
    }
    err.hidden = true;

    Cart.saveCustomer({ nome, sobrenome, phone });
    Cart.setFulfillment(fulfillment);
    const msg = Cart.buildWhatsAppMessage({
      fullName: `${nome} ${sobrenome}`,
      phone,
      fulfillment,
    });

    const shopPhone = String(S.whatsapp || "").replace(/\D/g, "");
    if (shopPhone) {
      window.open(waLink(shopPhone, msg), "_blank", "noopener");
      toast("Pedido enviado ao WhatsApp");
    } else {
      console.log(msg);
      toast("Pedido montado (WhatsApp da loja não configurado)");
    }
    Cart.clear();
    renderCart();
    closeCart();
  }

  /* ---------- contact form ---------- */
  function setupContact() {
    const form = document.getElementById("contact-form");
    const phone = document.getElementById("contact-phone");
    phone.addEventListener("input", () => {
      phone.value = maskPhone(phone.value);
    });
    document.getElementById("cart-phone").addEventListener("input", (e) => {
      e.target.value = maskPhone(e.target.value);
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = String(data.get("name") || "").trim();
      const tel = String(data.get("phone") || "").trim();
      const message = String(data.get("message") || "").trim();
      const text = [
        `Olá! Sou ${name}.`,
        `WhatsApp: ${tel}`,
        ``,
        message,
      ].join("\n");
      const ok = document.getElementById("contact-ok");
      ok.hidden = false;
      const shopPhone = String(S.whatsapp || "").replace(/\D/g, "");
      if (shopPhone) {
        setTimeout(() => {
          window.open(waLink(shopPhone, text), "_blank", "noopener");
        }, 400);
      }
      form.reset();
    });
  }

  /* ---------- nav / chrome ---------- */
  function setupChrome() {
    const header = document.getElementById("header");
    const toggle = document.getElementById("nav-toggle");
    const nav = document.getElementById("nav-menu");

    window.addEventListener(
      "scroll",
      () => {
        header.classList.toggle("header--scrolled", window.scrollY > 24);
      },
      { passive: true }
    );

    toggle.addEventListener("click", () => {
      const open = !nav.classList.contains("is-open");
      nav.classList.toggle("is-open", open);
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });

    nav.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        nav.classList.remove("is-open");
        toggle.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });

    // Header (#cart-open) vai para cart.html — não abre o drawer
    document.getElementById("cart-close")?.addEventListener("click", closeCart);
    document
      .getElementById("cart-close-backdrop")
      ?.addEventListener("click", closeCart);
    document.getElementById("cart-continue")?.addEventListener("click", () => {
      closeCart();
      document.getElementById("produtos")?.scrollIntoView({ behavior: "smooth" });
    });
    document
      .getElementById("cart-go-menu")
      ?.addEventListener("click", () => closeCart());
    document
      .getElementById("cart-checkout-btn")
      ?.addEventListener("click", checkoutCart);

    Cart?.setFulfillment("retirada");

    const phoneEl = document.getElementById("cart-phone");
    if (phoneEl) {
      phoneEl.addEventListener("input", () => {
        phoneEl.value = maskPhone(phoneEl.value);
      });
    }

    if (Cart) {
      Cart.onChange(() => renderCart());
      const c = Cart.loadCustomer();
      if (phoneEl && c.phone) phoneEl.value = Cart.formatPhoneBR(c.phone);
    }

    document.getElementById("lightbox-close").addEventListener("click", closeLightbox);
    document
      .getElementById("lightbox-backdrop")
      .addEventListener("click", closeLightbox);
    document
      .getElementById("lightbox-add-cart")
      .addEventListener("click", addFromLightbox);
    document.getElementById("lightbox-qty-minus").addEventListener("click", () => {
      lightboxQty = Math.max(1, lightboxQty - 1);
      updateLightboxQty();
    });
    document.getElementById("lightbox-qty-plus").addEventListener("click", () => {
      lightboxQty += 1;
      updateLightboxQty();
    });

    document.addEventListener("click", (e) => {
      const galleryHit = e.target.closest("[data-gallery-src]");
      if (galleryHit) {
        const src = galleryHit.getAttribute("data-gallery-src") || "";
        const index = Number(galleryHit.dataset.galleryIndex || 0);
        openLightbox(productForGallerySrc(src, index));
        return;
      }
      const openBtn = e.target.closest("[data-open]");
      if (openBtn) {
        openLightbox(openBtn.dataset.open);
        return;
      }
      const removeBtn = e.target.closest("[data-remove]");
      if (removeBtn && Cart) {
        Cart.removeItem(removeBtn.dataset.remove);
        toast("Item removido");
        return;
      }
      const qtyBtn = e.target.closest("[data-qty-delta]");
      if (qtyBtn && Cart) {
        const stepper = qtyBtn.closest("[data-qty-key]");
        const key = stepper?.dataset.qtyKey;
        const item = Cart.getItems().find((x) => x.key === key);
        if (!item) return;
        const delta = Number(qtyBtn.dataset.qtyDelta) || 0;
        Cart.updateQty(key, (Number(item.qty) || 0) + delta);
        return;
      }
      const chip = e.target.closest("[data-cat]");
      if (chip) {
        activeCategory = chip.dataset.cat;
        visibleProductsCount = INITIAL_PRODUCTS_LIMIT;
        renderFilters();
        renderProducts();
        return;
      }
      const moreProducts = e.target.closest("#products-more");
      if (moreProducts) {
        const all = catalogProducts();
        const list =
          activeCategory === "todos"
            ? all
            : all.filter((p) => p.category === activeCategory);
        visibleProductsCount = Math.min(list.length, visibleProductsCount + INITIAL_PRODUCTS_LIMIT);
        renderProducts();
        return;
      }
      const collapseProducts = e.target.closest("#products-collapse");
      if (collapseProducts) {
        visibleProductsCount = INITIAL_PRODUCTS_LIMIT;
        renderProducts();
        document.getElementById("produtos")?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      const toggleGallery = e.target.closest("#gallery-toggle");
      if (toggleGallery) {
        galleryExpanded = !galleryExpanded;
        renderGallery();
        if (!galleryExpanded) {
          document.getElementById("galeria")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeLightbox();
        closeCart();
      }
    });
  }

  /* ---------- init ---------- */
  function boot() {
    hydrateBrand();
    buildMarquee();
    rotateHeroWords();
    renderFilters();
    renderProducts();
    renderGallery();
    renderCart();
    setupContact();
    setupChrome();
  }

  boot();
})();
