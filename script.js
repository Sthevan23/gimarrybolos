(() => {
  function liveSettings() {
    const base = (typeof SITE_DATA !== "undefined" && SITE_DATA.settings) || {};
    const extra = (typeof Storage === "object" && Storage.getSettings && Storage.getSettings()) || {};
    return {
      ...base,
      ...extra,
      brandName: extra.name || extra.brandName || base.brandName,
      brandSub: extra.heroBadge || extra.brandSub || base.brandSub,
      whatsapp: extra.whatsapp || base.whatsapp,
      address: extra.address || base.address,
      instagram: extra.instagram || base.instagram,
      instagramUser: extra.instagramUser || base.instagramUser,
      heroImage: extra.heroImage || extra.banner || base.heroImage,
      aboutImage: extra.sobreImage || extra.aboutImage || base.aboutImage,
      contactImage: extra.contactImage || extra.sobreImage || extra.aboutImage || base.contactImage,
      heroWords: Array.isArray(extra.heroWords) && extra.heroWords.length ? extra.heroWords : base.heroWords,
    };
  }
  let S = liveSettings();

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
    { label: "1 kg", people: "±12 pessoas", detail: "12 fatias · 15 cm", price: 95 },
    { label: "1,5 kg", people: "±17 pessoas", detail: "17 fatias · 15 cm", price: 140 },
    { label: "2 kg", people: "±22 pessoas", detail: "22 fatias · 20 cm", price: 180 },
    { label: "2,5 kg", people: "±27 pessoas", detail: "27 fatias · 20 cm", price: 225 },
    { label: "3 kg", people: "±32 pessoas", detail: "32 fatias · 30 cm", price: 270 },
    { label: "3,5 kg", people: "±37 pessoas", detail: "37 fatias · 30 cm", price: 315 },
    { label: "4 kg", people: "±42 pessoas", detail: "42 fatias · 35 cm", price: 360 },
    { label: "4,5 kg", people: "±47 pessoas", detail: "47 fatias · 35 cm", price: 405 },
  ];
  const INFANTIL_KEYS = [
    "mickey", "minnie", "hello kitty", "smile kitty", "stitch", "lilo",
    "rei leao", "lego", "homem-aranha", "aranha", "bob esponja", "sonic",
    "catnap", "patrulha", "pokemon", "ursinho", "unicornio", "coelhinha",
    "mario", "pooh", "nemo", "dinossauro", "tigre", "carrinho", "tubarao",
    "mesversario", "baby", "bebe", "casinha", "wandinha", "dr. stone",
    "dr stone", "playstation", "velozes", "k-pop", "kpop", "flork",
    "guerreiras", "desenho", "personagem"
  ];
  const CAKE_THEMES = [
    { id: "todos", label: "Todos" },
    { id: "infantil", label: "Infantil", keys: INFANTIL_KEYS },
    { id: "adulto", label: "Adulto", invert: "infantil" },
    { id: "mesversario", label: "Mesversário", keys: ["mesversario", "bebe", "baby"] },
    { id: "times", label: "Times", keys: ["selecao", "atletico", "futebol", "cruzeiro", "al-nassr"] },
  ];
  const CELEBRE_SIZES = [
    { label: "Bolo parabéns", detail: "serve 7 fatias", price: 65 },
    { label: "Bolo comemore", detail: "serve 9 fatias", price: 75 },
    { label: "Bolo celebrar", detail: "serve 13 fatias", price: 95 },
  ];
  const MAX_FILLINGS = 2;
  const TOPPER_PRICE = 25;
  const INITIAL_PRODUCTS_LIMIT = 8;
  const PRODUCTS_PAGE = 8;
  const GALLERY_LIMIT = 8;
  let activeCategory = "bolos";
  let activeTheme = "todos";
  let searchQuery = "";
  let visibleProductsCount = INITIAL_PRODUCTS_LIMIT;
  let galleryExpanded = false;
  let productGroupObserver = null;
  let categorySpyLock = false;
  const groupShown = {};
  let lightboxProduct = null;
  let lightboxQty = 1;
  let lightboxFlavors = [];
  let lightboxBatter = "";
  let lightboxSize = null;
  let lightboxTopper = false;
  let lightboxTopperName = "";
  let lightboxTopperNumber = "";
  let lightboxTopperPhrase = "";
  let heroWordIndex = 0;

  function catalogCategories() {
    if (typeof Storage === "object" && Storage.getCategories) {
      const cats = Storage.getCategories()
        .filter((c) => c.id !== "todos")
        .map((c) => ({ id: c.id, name: c.name }));
      return [{ id: "todos", name: "Todos" }, ...cats];
    }
    return SITE_DATA.categories || [];
  }

  function catalogProducts() {
    if (typeof Storage === "object" && Storage.getProducts) {
      return Storage.getProducts()
        .filter((p) => p.active !== false)
        .map((p) => ({
          ...p,
          category: p.category || p.categoryId,
        }));
    }
    return SITE_DATA.products || [];
  }

  function catalogGallery() {
    if (typeof Storage === "object" && Storage.getGallery) {
      return (Storage.getGallery() || []).slice(0, GALLERY_LIMIT);
    }
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

  function thumbSrc(path) {
    return imgSrc(path);
  }

  function categoryName(id) {
    return catalogCategories().find((c) => c.id === id)?.name || id;
  }

  function isCustomCake(product) {
    return ["bolos", "destaques"].includes(product?.category);
  }

  function isReadyCake(product) {
    return product?.category === "pronta";
  }

  function isBentoCake(product) {
    return product?.category === "bento";
  }

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function productSearchBlob(product) {
    return normalizeText(
      [product?.name, product?.description, categoryName(product?.category)].join(" ")
    );
  }

  function productMatchesKeys(product, keys) {
    if (!keys?.length) return false;
    const blob = productSearchBlob(product);
    return keys.some((key) => blob.includes(normalizeText(key)));
  }

  function productMatchesTheme(product, themeId) {
    if (!themeId || themeId === "todos") return true;
    const theme = CAKE_THEMES.find((item) => item.id === themeId);
    if (!theme) return true;
    if ((theme.id === "infantil" || theme.id === "adulto") && !isCustomCake(product)) {
      return false;
    }
    if (theme.invert) {
      const source = CAKE_THEMES.find((item) => item.id === theme.invert);
      return !productMatchesKeys(product, source?.keys);
    }
    return productMatchesKeys(product, theme.keys);
  }

  function productMatchesQuery(product, query) {
    const q = normalizeText(query).trim();
    if (!q) return true;
    return productSearchBlob(product).includes(q);
  }

  function catalogIsFiltered() {
    return activeTheme !== "todos" || Boolean(searchQuery.trim());
  }

  function sizeSummary(size) {
    if (!size) return "";
    return size.people
      ? `${size.people} · ${money(size.price)}`
      : `${size.label} · ${money(size.price)}`;
  }

  function sizeCartLabel(size) {
    if (!size) return "";
    return [size.people, size.label, size.detail].filter(Boolean).join(" · ");
  }

  function readTopperFields() {
    lightboxTopperName = document.getElementById("topper-name")?.value.trim() || "";
    lightboxTopperNumber = document.getElementById("topper-number")?.value.trim() || "";
    lightboxTopperPhrase = document.getElementById("topper-phrase")?.value.trim() || "";
  }

  function topperSummary() {
    if (!lightboxTopper) return "opcional · + " + money(TOPPER_PRICE);
    const bits = [lightboxTopperName, lightboxTopperNumber, lightboxTopperPhrase].filter(Boolean);
    return bits.length ? `${bits.join(", ")} · + ${money(TOPPER_PRICE)}` : `sim · + ${money(TOPPER_PRICE)}`;
  }

  function topperNote() {
    if (!lightboxTopper) return "";
    const bits = ["Topo personalizado"];
    if (lightboxTopperName) bits.push(`Nome: ${lightboxTopperName}`);
    if (lightboxTopperNumber) bits.push(`Número: ${lightboxTopperNumber}`);
    if (lightboxTopperPhrase) bits.push(`Frase: ${lightboxTopperPhrase}`);
    return bits.join(" · ");
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
      "Bolo personalizado com o tema da sua festa";
    document.getElementById("hero-title-line-1").textContent = S.heroTitle1 || "Bolos artesanais feitos com carinho";
    document.getElementById("hero-title-line-2").textContent = S.heroTitle2 || "para deixar seu momento mais";
    document.getElementById("hero-lead").textContent = S.tagline;
    document.getElementById("hero-categories").textContent = S.categoriesLine;
    document.getElementById("hero-place").textContent = S.city;
    document.getElementById("footer-year").textContent = new Date().getFullYear();
    document.getElementById("footer-address").textContent = S.address.split("·")[0].trim();
    document.getElementById("contact-address-text").textContent = S.address;
    document.getElementById("order-pickup").textContent =
      `A mensagem já vai montada. Confirmamos a data e a retirada em ${S.address}.`;

    document.getElementById("hero-bg").style.backgroundImage = `url('${thumbSrc(S.heroImage)}')`;
    const sobreImg = document.getElementById("sobre-image");
    if (sobreImg) {
      sobreImg.loading = "lazy";
      sobreImg.decoding = "async";
      sobreImg.src = thumbSrc(S.aboutImage);
      sobreImg.onerror = () => { sobreImg.onerror = null; sobreImg.src = imgSrc(S.aboutImage); };
    }
    const contactImg = document.getElementById("contact-image");
    if (contactImg) {
      contactImg.loading = "lazy";
      contactImg.decoding = "async";
      contactImg.src = thumbSrc(S.contactImage);
      contactImg.onerror = () => { contactImg.onerror = null; contactImg.src = imgSrc(S.contactImage); };
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
          <img src="${thumbSrc(p.image)}" alt="${p.name}" loading="lazy" decoding="async" width="480" height="600" data-full="${imgSrc(p.image)}" onerror="this.onerror=null;this.src=this.dataset.full||this.src">
          <span class="product-card__img-veil" aria-hidden="true"></span>
        </div>
        <div class="product-card__body">
          <span class="product-card__category">${categoryName(p.category)}</span>
          <h3 class="product-card__name">${p.name}</h3>
          <p class="product-card__desc">${p.description}</p>
            <div class="product-card__footer">
            <div class="product-card__meta">
              ${isCustomCake(p) || isReadyCake(p)
                ? `<span class="product-card__size">A partir de ${money(isReadyCake(p) ? CELEBRE_SIZES[0].price : CAKE_SIZES[0].price)}</span>`
                : (p.size ? `<span class="product-card__size">${p.size}</span>` : "")}
            </div>
            <button type="button" class="product-card__add" data-open="${p.id}">
              <span>${isCustomCake(p) ? "Quero esse modelo" : "Adicionar"}</span>
              <span class="ico ico--plus" aria-hidden="true"></span>
            </button>
          </div>
        </div>
      </article>`;
  }

  function renderFilters() {
    const themesEl = document.getElementById("theme-filter");
    if (themesEl) {
      themesEl.innerHTML = CAKE_THEMES.map(
        (theme) =>
          `<button type="button" class="filter-chip ${theme.id === activeTheme ? "is-active" : ""}" data-theme="${theme.id}">${theme.label}</button>`
      ).join("");
    }
    const el = document.getElementById("category-filter");
    el.innerHTML = catalogCategories()
      .filter((c) => c.id !== "todos")
      .map(
        (c) =>
          `<button type="button" class="filter-chip ${c.id === activeCategory ? "is-active" : ""}" data-cat="${c.id}">${c.name}</button>`
      )
      .join("");
  }

  function setActiveCategory(id, { alignChip = true } = {}) {
    if (!id || id === activeCategory) {
      if (alignChip) alignFilterChip(id);
      return;
    }
    activeCategory = id;
    document.querySelectorAll("#category-filter .filter-chip").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.cat === id);
    });
    if (alignChip) alignFilterChip(id);
  }

  function alignFilterChip(id) {
    const bar = document.getElementById("category-filter");
    const chip = document.querySelector(`#category-filter [data-cat="${id}"]`);
    if (!bar || !chip) return;
    const left = chip.offsetLeft - (bar.clientWidth - chip.offsetWidth) / 2;
    bar.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }

  function observeProductGroups() {
    const groups = document.querySelectorAll("[data-cat-group]");
    if (productGroupObserver) productGroupObserver.disconnect();
    if (!groups.length || !("IntersectionObserver" in window)) return;

    productGroupObserver = new IntersectionObserver(
      (entries) => {
        if (categorySpyLock) return;
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const id = visible[0]?.target?.dataset.catGroup;
        if (id) setActiveCategory(id);
      },
      { rootMargin: "-28% 0px -58% 0px", threshold: 0.01 }
    );
    groups.forEach((group) => productGroupObserver.observe(group));
  }

  function scrollToCategory(id) {
    const target =
      document.getElementById(`grupo-${id}`) || document.getElementById("produtos");
    if (!target) return;
    categorySpyLock = true;
    setActiveCategory(id, { alignChip: true });
    const top =
      target.getBoundingClientRect().top +
      window.scrollY -
      (document.getElementById("header")?.offsetHeight || 72) -
      56;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    window.setTimeout(() => {
      categorySpyLock = false;
    }, 900);
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
    document.querySelectorAll("#lightbox-flavors .order-acc.is-open").forEach((el) => {
      if (el.id !== id) el.classList.remove("is-open");
    });
    setAccordionState(id, { open: true });
    document.getElementById(id)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function sizeOptionsHTML(sizes) {
    return sizes
      .map(
        (size, i) => `
        <label class="size-option">
          <input type="radio" name="cake-size" value="${size.label}" data-price="${size.price}" data-detail="${size.detail || ""}" data-people="${size.people || ""}" ${i === 0 ? "checked" : ""}>
          <span class="size-option__content">
            <strong>${size.people || size.label}</strong>
            <small>${size.people ? `${size.label} · ${size.detail}` : size.detail}</small>
          </span>
          <b>${money(size.price)}</b>
        </label>`
      )
      .join("");
  }

  function bindSizeInputs(flavorsEl) {
    flavorsEl.querySelectorAll('input[name="cake-size"]').forEach((input) => {
      input.addEventListener("change", () => {
        lightboxSize = {
          label: input.value,
          detail: input.dataset.detail || "",
          people: input.dataset.people || "",
          price: Number(input.dataset.price || 0),
        };
        updateLightboxAccordions();
        updateLightboxQty();
        setAccordionState("acc-size", { open: false, done: true });
        if (isCustomCake(lightboxProduct)) openAccordion("acc-fillings");
      });
    });
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
    if (!lightboxProduct) return;

    if (isCustomCake(lightboxProduct)) {
      const fillingsDone = lightboxFlavors.length > 0;
      setAccordionSummary(
        "acc-fillings",
        fillingsDone ? lightboxFlavors.join(" / ") : "obrigatório"
      );
      setAccordionState("acc-fillings", { done: fillingsDone });

      setAccordionSummary("acc-batter", lightboxBatter || "obrigatório");
      setAccordionState("acc-batter", { done: Boolean(lightboxBatter) });

      const sizeSummaryText = lightboxSize ? sizeSummary(lightboxSize) : "obrigatório";
      setAccordionSummary("acc-size", sizeSummaryText);
      setAccordionState("acc-size", { done: Boolean(lightboxSize) });

      setAccordionSummary("acc-extra", topperSummary());
      setAccordionState("acc-extra", { done: lightboxTopper });
    }

    if (isReadyCake(lightboxProduct)) {
      const sizeSummaryText = lightboxSize ? sizeSummary(lightboxSize) : "obrigatório";
      setAccordionSummary("acc-size", sizeSummaryText);
      setAccordionState("acc-size", { done: Boolean(lightboxSize) });
    }
  }

  function renderProducts() {
    const all = catalogProducts().filter(
      (p) => productMatchesTheme(p, activeTheme) && productMatchesQuery(p, searchQuery)
    );
    const filtered = catalogIsFiltered();
    const groups = catalogCategories()
      .filter((c) => c.id !== "todos")
      .map((c) => ({
        ...c,
        products: all.filter((p) => p.category === c.id),
      }))
      .filter((g) => g.products.length);

    const countEl = document.getElementById("products-count");
    if (countEl) {
      if (filtered) {
        countEl.hidden = false;
        countEl.textContent = all.length
          ? `${all.length} ${all.length === 1 ? "modelo encontrado" : "modelos encontrados"}`
          : "Nenhum modelo com essa busca. Tente o personagem, a cor ou o tema da festa.";
      } else {
        countEl.hidden = true;
        countEl.textContent = "";
      }
    }

    const grid = document.getElementById("products-grid");
    if (!groups.length) {
      grid.innerHTML = `
        <div class="products__empty">
          <p>Não achamos esse modelo.</p>
          <p>Busque pelo tema da festa — Mickey, floral, dinossauro — ou volte para todos os temas.</p>
          <button type="button" class="btn btn--ghost" id="products-clear-filters">Ver todos os modelos</button>
        </div>`;
      observeProductGroups();
      return;
    }

    grid.innerHTML = groups
      .map((g) => {
        const shown = filtered ? g.products.length : (groupShown[g.id] || PRODUCTS_PAGE);
        const visible = g.products.slice(0, shown);
        const remaining = Math.max(0, g.products.length - visible.length);
        return `
        <section class="products-group" id="grupo-${g.id}" data-cat-group="${g.id}">
          <h3 class="products-group__title">${g.name}</h3>
          <div class="products__grid">
            ${visible.map(cardHTML).join("")}
          </div>
          ${remaining > 0 ? `
          <div class="products-group__actions">
            <button type="button" class="btn btn--ghost products__more" data-group-more="${g.id}">
              Ver mais ${Math.min(PRODUCTS_PAGE, remaining)} fotos
            </button>
          </div>` : ""}
        </section>`;
      })
      .join("");

    const actions = document.getElementById("products-actions");
    if (actions) actions.hidden = true;

    const bestGrid = document.getElementById("bestsellers-grid");
    if (bestGrid && !bestGrid.dataset.ready) {
      const best = catalogProducts().filter((p) => p.bestSeller).slice(0, 3);
      bestGrid.innerHTML = best.map(cardHTML).join("");
      bestGrid.dataset.ready = "1";
    }
    observeProductGroups();
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
            <img src="${thumbSrc(src)}" alt="${label}" loading="lazy" decoding="async" width="480" height="600" data-full="${imgSrc(src)}" onerror="this.onerror=null;this.src=this.dataset.full||this.src">
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
    if (window.GimarryAnalytics) GimarryAnalytics.productView(p);
    lightboxProduct = p;
    lightboxQty = 1;
    lightboxFlavors = isCustomCake(p) || isBentoCake(p)
      ? []
      : (p.flavors?.[0] ? [p.flavors[0]] : []);
    lightboxBatter = isCustomCake(p) ? CAKE_BATTERS[0] : "";
    lightboxSize = isCustomCake(p) ? CAKE_SIZES[0] : (isReadyCake(p) ? CELEBRE_SIZES[0] : null);
    lightboxTopper = false;
    lightboxTopperName = "";
    lightboxTopperNumber = "";
    lightboxTopperPhrase = "";

    document.getElementById("lightbox-img").src = thumbSrc(p.image);
    document.getElementById("lightbox-img").alt = p.name;
    const lbImg = document.getElementById("lightbox-img");
    lbImg.onerror = () => { lbImg.onerror = null; lbImg.src = imgSrc(p.image); };
    document.getElementById("lightbox-category").textContent = isCustomCake(p)
      ? "Modelo escolhido"
      : categoryName(p.category);
    document.getElementById("lightbox-title").textContent = p.name;
    document.getElementById("lightbox-desc").textContent = p.description;
    document.getElementById("lightbox-notes").value = "";
    document.getElementById("order-error").hidden = true;
    const qtyRow = document.querySelector("#order-lightbox .order-qty-row");
    if (qtyRow) qtyRow.hidden = isCustomCake(p);
    updateLightboxQty();

    const flavorsEl = document.getElementById("lightbox-flavors");
    if (isCustomCake(p)) {
      flavorsEl.hidden = false;
      flavorsEl.innerHTML = [
        `<p class="order-guide">Esse é o modelo. Agora diga para quantas pessoas, o sabor e o que vai no topo.</p>`,
        accordionSection({
          id: "acc-size",
          title: "Para quantas pessoas? *",
          summary: lightboxSize ? sizeSummary(lightboxSize) : "obrigatório",
          open: true,
          done: Boolean(lightboxSize),
          body: `<div class="size-list">${sizeOptionsHTML(CAKE_SIZES)}</div>`,
        }),
        accordionSection({
          id: "acc-fillings",
          title: `Escolha até ${MAX_FILLINGS} recheios *`,
          summary: "obrigatório",
          open: false,
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
          id: "acc-extra",
          title: "Topo personalizado",
          summary: topperSummary(),
          open: false,
          body: `
            <label class="extra-option">
              <input type="checkbox" id="lightbox-topper">
              <span class="extra-option__content">
                <strong>Topo com nome e idade</strong>
                <small>É o diferencial da casa — a maioria dos bolos sai com topo</small>
              </span>
              <b>+ ${money(TOPPER_PRICE)}</b>
            </label>
            <div class="topper-fields" id="topper-fields" hidden>
              <label class="order-field">Nome no topo
                <input type="text" id="topper-name" maxlength="40" placeholder="Ex: Ana" autocomplete="off">
              </label>
              <label class="order-field">Idade ou número
                <input type="text" id="topper-number" maxlength="12" placeholder="Ex: 15" inputmode="numeric" autocomplete="off">
              </label>
              <label class="order-field">Frase (opcional)
                <input type="text" id="topper-phrase" maxlength="60" placeholder="Ex: Tardezinha da Ana" autocomplete="off">
              </label>
            </div>`,
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
            openAccordion(lightboxBatter ? "acc-extra" : "acc-batter");
          }
        });
      });
      flavorsEl.querySelectorAll('input[name="batter"]').forEach((input) => {
        input.addEventListener("change", () => {
          lightboxBatter = input.value;
          updateLightboxAccordions();
          setAccordionState("acc-batter", { open: false, done: true });
          openAccordion("acc-extra");
        });
      });
      bindSizeInputs(flavorsEl);
      function syncTopperFields() {
        const fields = document.getElementById("topper-fields");
        if (fields) fields.hidden = !lightboxTopper;
        readTopperFields();
        updateLightboxAccordions();
        updateLightboxQty();
      }
      flavorsEl.querySelector("#lightbox-topper")?.addEventListener("change", (event) => {
        lightboxTopper = Boolean(event.target.checked);
        if (lightboxTopper) setAccordionState("acc-extra", { open: true });
        syncTopperFields();
      });
      ["topper-name", "topper-number", "topper-phrase"].forEach((id) => {
        flavorsEl.querySelector(`#${id}`)?.addEventListener("input", () => {
          readTopperFields();
          updateLightboxAccordions();
        });
      });
    } else if (isReadyCake(p)) {
      flavorsEl.hidden = false;
      flavorsEl.innerHTML = accordionSection({
        id: "acc-size",
        title: "Para quantas pessoas? *",
        summary: lightboxSize ? sizeSummary(lightboxSize) : "obrigatório",
        open: true,
        done: Boolean(lightboxSize),
        body: `<div class="size-list">${sizeOptionsHTML(CELEBRE_SIZES)}</div>`,
      });

      bindLightboxAccordions(flavorsEl);
      bindSizeInputs(flavorsEl);
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
    const unit = isCustomCake(lightboxProduct)
      ? (lightboxSize?.price || 0) + (lightboxTopper ? TOPPER_PRICE : 0)
      : isReadyCake(lightboxProduct)
        ? (lightboxSize?.price || 0)
        : 0;
    if (unitPrice) {
      unitPrice.textContent = unit > 0
        ? `${money(unit)}${lightboxTopper && isCustomCake(lightboxProduct) ? " com topo personalizado" : ""}`
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
    const qtyRow = document.querySelector("#order-lightbox .order-qty-row");
    if (qtyRow) qtyRow.hidden = false;
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
    if ((isCustomCake(lightboxProduct) || isReadyCake(lightboxProduct)) && !lightboxSize) {
      const err = document.getElementById("order-error");
      err.textContent = "Escolha para quantas pessoas é o bolo.";
      err.hidden = false;
      openAccordion("acc-size");
      return;
    }
    if (isCustomCake(lightboxProduct) && lightboxTopper) {
      readTopperFields();
      if (!lightboxTopperName && !lightboxTopperNumber && !lightboxTopperPhrase) {
        const err = document.getElementById("order-error");
        err.textContent = "Escreva o nome, a idade ou a frase do topo.";
        err.hidden = false;
        openAccordion("acc-extra");
        document.getElementById("topper-name")?.focus();
        return;
      }
    }
    const notes = document.getElementById("lightbox-notes").value.trim();
    const unit = isCustomCake(lightboxProduct)
      ? (lightboxSize?.price || 0) + (lightboxTopper ? TOPPER_PRICE : 0)
      : isReadyCake(lightboxProduct)
        ? (lightboxSize?.price || 0)
        : 0;
    const flavorMeta = [
      lightboxFlavors.length ? lightboxFlavors.join(" / ") : "",
      lightboxBatter && `Massa ${lightboxBatter}`,
    ]
      .filter(Boolean)
      .join(" · ");
    const noteMeta = [topperNote(), notes].filter(Boolean).join(" · ");
    Cart.addItem({
      productId: lightboxProduct.id,
      name: lightboxProduct.name,
      price: unit,
      qty: isCustomCake(lightboxProduct) ? 1 : lightboxQty,
      flavor: flavorMeta,
      size: lightboxSize
        ? sizeCartLabel(lightboxSize)
        : (lightboxProduct.size || ""),
      image: lightboxProduct.image,
      notes: noteMeta,
    });
    if (window.GimarryAnalytics) {
      GimarryAnalytics.addToCart({
        productId: lightboxProduct.id,
        name: lightboxProduct.name,
        qty: isCustomCake(lightboxProduct) ? 1 : lightboxQty,
        categoryId: lightboxProduct.category,
      });
    }
    closeLightbox();
    renderCart();
    pulseCart();
    toast(isCustomCake(lightboxProduct) ? "Bolo adicionado ao carrinho" : "Adicionado ao carrinho", true);
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
          <p class="cart-drawer__empty-note">Escolha um modelo e personalize o seu bolo.</p>
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
    if (window.GimarryAnalytics) GimarryAnalytics.beginCheckout({ items: Cart.count() });

    Cart.saveCustomer({ nome, sobrenome, phone });
    Cart.setFulfillment(fulfillment);
    if (Cart.saveAsStoreOrder) {
      Cart.saveAsStoreOrder({
        fullName: `${nome} ${sobrenome}`,
        phone,
        notes: "Retirada no local",
      });
    }
    if (window.GimarryAnalytics) GimarryAnalytics.orderCreated({ items: Cart.count() });
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
    document.getElementById("lightbox-add-cart")
      .addEventListener("click", addFromLightbox);
    document.getElementById("lightbox-qty-minus").addEventListener("click", () => {
      lightboxQty = Math.max(1, lightboxQty - 1);
      updateLightboxQty();
    });
    document.getElementById("lightbox-qty-plus").addEventListener("click", () => {
      lightboxQty += 1;
      updateLightboxQty();
    });

    const searchInputs = [...document.querySelectorAll("[data-product-search]")];
    let searchJumpT = 0;

    function syncSearchInputs(value, fromEl) {
      searchInputs.forEach((el) => {
        if (el !== fromEl) el.value = value;
      });
    }

    function jumpToCatalog() {
      const target = document.getElementById("produtos");
      if (!target) return;
      const top = target.getBoundingClientRect().top;
      if (top > 90 && top < window.innerHeight * 0.4) return;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function applyProductSearch(value, fromEl, jump) {
      searchQuery = value;
      syncSearchInputs(value, fromEl);
      renderProducts();
      if (!jump) return;
      clearTimeout(searchJumpT);
      searchJumpT = window.setTimeout(jumpToCatalog, 80);
    }

    searchInputs.forEach((input) => {
      input.addEventListener("input", () => {
        applyProductSearch(input.value, input, input.value.trim().length >= 2);
      });
      input.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        applyProductSearch(input.value, input, true);
      });
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
      const moreGroup = e.target.closest("[data-group-more]");
      if (moreGroup) {
        const id = moreGroup.dataset.groupMore;
        groupShown[id] = (groupShown[id] || PRODUCTS_PAGE) + PRODUCTS_PAGE;
        const y = window.scrollY;
        renderProducts();
        window.scrollTo(0, y);
        return;
      }
      const clearFilters = e.target.closest("#products-clear-filters");
      if (clearFilters) {
        activeTheme = "todos";
        searchQuery = "";
        document.querySelectorAll("[data-product-search]").forEach((el) => {
          el.value = "";
        });
        renderFilters();
        renderProducts();
        return;
      }
      const themeChip = e.target.closest("[data-theme]");
      if (themeChip) {
        activeTheme = themeChip.dataset.theme;
        renderFilters();
        renderProducts();
        document.getElementById("produtos")?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      const chip = e.target.closest("[data-cat]");
      if (chip) {
        scrollToCategory(chip.dataset.cat);
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
    S = liveSettings();
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

  window.addEventListener("storage-updated", () => {
    S = liveSettings();
    hydrateBrand();
    renderFilters();
    renderProducts();
    renderGallery();
  });

  boot();
})();
