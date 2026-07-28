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
    { label: "1 kg", detail: "12 fatias · 15 cm", price: 95 },
    { label: "1,5 kg", detail: "17 fatias · 15 cm", price: 140 },
    { label: "2 kg", detail: "22 fatias · 20 cm", price: 180 },
    { label: "2,5 kg", detail: "27 fatias · 20 cm", price: 225 },
    { label: "3 kg", detail: "32 fatias · 30 cm", price: 270 },
    { label: "3,5 kg", detail: "37 fatias · 30 cm", price: 315 },
    { label: "4 kg", detail: "42 fatias · 35 cm", price: 360 },
    { label: "4,5 kg", detail: "47 fatias · 35 cm", price: 405 },
  ];
  const TOPPER_PRICE = 25;
  let activeCategory = "todos";
  let lightboxProduct = null;
  let lightboxQty = 1;
  let lightboxFlavors = [];
  let lightboxBatter = "";
  let lightboxSize = null;
  let lightboxTopper = false;
  let heroWordIndex = 0;

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

  function categoryName(id) {
    return SITE_DATA.categories.find((c) => c.id === id)?.name || id;
  }

  function isCustomCake(product) {
    return ["bolos", "destaques"].includes(product?.category);
  }

  function toast(msg, withCartLink = false) {
    const el = document.getElementById("cart-feedback");
    if (!el) return;
    el.innerHTML = withCartLink
      ? `<span class="cart-feedback__left"><span class="cart-feedback__check"><i class="fa-solid fa-check"></i></span><span class="cart-feedback__text">${msg}</span></span><a class="cart-feedback__btn" href="cart.html">Ver carrinho</a>`
      : `<span class="cart-feedback__left"><span class="cart-feedback__check"><i class="fa-solid fa-check"></i></span><span class="cart-feedback__text">${msg}</span></span>`;
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
    document.getElementById("hero-tagline").textContent = S.tagline;
    document.getElementById("hero-categories").textContent = S.categoriesLine;
    document.getElementById("hero-place").textContent = S.city;
    document.getElementById("footer-year").textContent = new Date().getFullYear();
    document.getElementById("footer-address").textContent = S.address.split("·")[0].trim();
    document.getElementById("contact-address-text").textContent = S.address;
    document.getElementById("contact-delivery-fee").textContent =
      "Valores sob consulta — região central";
    document.getElementById("contact-delivery-note").textContent = S.deliveryNote;
    document.getElementById("delivery-fee-label").textContent =
      "Taxa sob consulta";
    document.getElementById("order-pickup").textContent =
      `Retire em ${S.address}. Entrega na região central · valores sob consulta.`;

    document.getElementById("hero-bg").style.backgroundImage = `url('${encodeURI(S.heroImage)}')`;
    document.getElementById("sobre-image").src = encodeURI(S.aboutImage);
    document.getElementById("contact-image").src = encodeURI(S.contactImage);

    const sobre = document.getElementById("sobre-text");
    sobre.innerHTML = `<p>${S.sobreText1}</p><p>${S.sobreText2}</p>`;

    const words = document.getElementById("hero-words");
    words.innerHTML = S.heroWords
      .map((w, i) => `<span class="${i === 0 ? "is-active" : ""}">${w}</span>`)
      .join("");
    document.getElementById("hero-word-sr").textContent = S.heroWords[0];

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
          <img src="${imgSrc(p.image)}" alt="${p.name}" loading="lazy">
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
              <i class="fa-solid fa-plus" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </article>`;
  }

  function renderFilters() {
    const el = document.getElementById("category-filter");
    el.innerHTML = SITE_DATA.categories
      .map(
        (c) =>
          `<button type="button" class="filter-chip ${c.id === activeCategory ? "is-active" : ""}" data-cat="${c.id}">${c.name}</button>`
      )
      .join("");
  }

  function renderProducts() {
    const list =
      activeCategory === "todos"
        ? SITE_DATA.products
        : SITE_DATA.products.filter((p) => p.category === activeCategory);
    document.getElementById("products-grid").innerHTML = list.map(cardHTML).join("");

    const best = SITE_DATA.products.filter((p) => p.bestSeller).slice(0, 4);
    document.getElementById("bestsellers-grid").innerHTML = best.map(cardHTML).join("");
  }

  function renderGallery() {
    document.getElementById("gallery-grid").innerHTML = SITE_DATA.gallery
      .map(
        (src, i) =>
          `<figure><img src="${imgSrc(src)}" alt="Foto ${i + 1} da galeria" loading="lazy"></figure>`
      )
      .join("");
  }

  /* ---------- lightbox ---------- */
  function openLightbox(id) {
    const p = SITE_DATA.products.find((x) => x.id === id);
    if (!p) return;
    lightboxProduct = p;
    lightboxQty = 1;
    lightboxFlavors = isCustomCake(p)
      ? []
      : (p.flavors?.[0] ? [p.flavors[0]] : []);
    lightboxBatter = isCustomCake(p) ? CAKE_BATTERS[0] : "";
    lightboxSize = isCustomCake(p) ? CAKE_SIZES[0] : null;
    lightboxTopper = false;

    document.getElementById("lightbox-img").src = imgSrc(p.image);
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
      flavorsEl.innerHTML = `
        <div class="flavor-list">
          <p class="flavor-list__label">Escolha até 2 recheios</p>
          <div class="flavor-list__grid flavor-list__grid--wide">
            ${CAKE_FILLINGS
              .map(
                (f, i) => `
              <label class="flavor-option">
                <input type="checkbox" name="flavor" value="${f}">
                <span class="flavor-option__mark" aria-hidden="true"></span>
                <span class="flavor-option__text">${f}</span>
              </label>`
              )
              .join("")}
          </div>
        </div>
        <div class="flavor-list">
          <p class="flavor-list__label">Escolha a massa</p>
          <div class="flavor-list__grid">
            ${CAKE_BATTERS
              .map(
                (b, i) => `
              <label class="flavor-option">
                <input type="radio" name="batter" value="${b}" ${i === 0 ? "checked" : ""}>
                <span class="flavor-option__mark" aria-hidden="true"></span>
                <span class="flavor-option__text">${b}</span>
              </label>`
              )
              .join("")}
          </div>
        </div>
        <div class="flavor-list">
          <p class="flavor-list__label">Escolha o tamanho</p>
          <div class="size-list">
            ${CAKE_SIZES
              .map(
                (size, i) => `
              <label class="size-option">
                <input type="radio" name="cake-size" value="${size.label}" data-price="${size.price}" data-detail="${size.detail}" ${i === 0 ? "checked" : ""}>
                <span class="size-option__content">
                  <strong>${size.label}</strong>
                  <small>${size.detail}</small>
                </span>
                <b>${money(size.price)}</b>
              </label>`
              )
              .join("")}
          </div>
        </div>
        <div class="flavor-list flavor-list--compact">
          <label class="extra-option">
            <input type="checkbox" id="lightbox-topper">
            <span class="extra-option__content">
              <strong>Topo personalizado</strong>
              <small>Adicionar topo decorativo ao bolo</small>
            </span>
            <b>+ ${money(TOPPER_PRICE)}</b>
          </label>
        </div>`;

      flavorsEl.querySelectorAll('input[name="flavor"]').forEach((input) => {
        input.addEventListener("change", () => {
          const checked = [...flavorsEl.querySelectorAll('input[name="flavor"]:checked')];
          if (checked.length > 2) {
            input.checked = false;
            const err = document.getElementById("order-error");
            err.textContent = "Escolha no máximo 2 recheios.";
            err.hidden = false;
            return;
          }
          lightboxFlavors = checked.map((item) => item.value);
          document.getElementById("order-error").hidden = true;
        });
      });
      flavorsEl.querySelectorAll('input[name="batter"]').forEach((input) => {
        input.addEventListener("change", () => {
          lightboxBatter = input.value;
        });
      });
      flavorsEl.querySelectorAll('input[name="cake-size"]').forEach((input) => {
        input.addEventListener("change", () => {
          lightboxSize = {
            label: input.value,
            detail: input.dataset.detail || "",
            price: Number(input.dataset.price || 0),
          };
          updateLightboxQty();
        });
      });
      flavorsEl.querySelector("#lightbox-topper")?.addEventListener("change", (event) => {
        lightboxTopper = Boolean(event.target.checked);
        updateLightboxQty();
      });
    } else if (p.flavors?.length) {
      flavorsEl.hidden = false;
      flavorsEl.innerHTML = `
        <div class="flavor-list">
          <p class="flavor-list__label">Escolha o sabor</p>
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
          </div>
        </div>`;
      flavorsEl.querySelectorAll('input[name="flavor"]').forEach((input) => {
        input.addEventListener("change", () => {
          lightboxFlavors = [input.value];
        });
      });
    } else {
      flavorsEl.hidden = true;
      flavorsEl.innerHTML = "";
    }

    document.getElementById("order-lightbox").hidden = false;
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
    document.getElementById("order-lightbox").hidden = true;
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
      return;
    }
    if (!isCustomCake(lightboxProduct) && lightboxProduct.flavors?.length && !lightboxFlavors.length) {
      const err = document.getElementById("order-error");
      err.textContent = "Escolha um sabor.";
      err.hidden = false;
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
        <img class="cart-item__img" src="${imgSrc(i.image || "")}" alt="">
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
              <i class="fa-solid fa-trash" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </article>`;
      })
      .join("");

    const mode = Cart.getFulfillment();
    const subtotal = Cart.subtotal();
    const total = Cart.payable();

    const subtotalEl = document.getElementById("cart-subtotal");
    const totalEl = document.getElementById("cart-total");
    if (subtotalEl) subtotalEl.textContent = money(subtotal);
    if (totalEl) totalEl.textContent = money(total);
    if (totalRow) totalRow.hidden = false;
    if (finalRow) finalRow.hidden = false;
    if (checkout) checkout.hidden = false;

    const deliveryNote = document.getElementById("cart-delivery-note");
    const pickupNote = document.getElementById("cart-pickup-note");
    if (deliveryNote) deliveryNote.hidden = mode !== "entrega";
    if (pickupNote) pickupNote.hidden = mode !== "retirada";

    const feeLabel = document.getElementById("delivery-fee-label");
    const feeText = document.getElementById("cart-delivery-fee-text");
    const pickupAddr = document.getElementById("cart-pickup-address");
    if (feeLabel) feeLabel.textContent = "Taxa sob consulta";
    if (feeText) feeText.textContent = "sob consulta";
    if (pickupAddr) pickupAddr.textContent = S.address;

    const ret = document.getElementById("cart-fulfillment-retirada");
    const ent = document.getElementById("cart-fulfillment-entrega");
    if (ret) ret.checked = mode === "retirada";
    if (ent) ent.checked = mode === "entrega";

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
    const fulfillment =
      document.querySelector('input[name="cart-fulfillment"]:checked')?.value ||
      "retirada";

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

    document.querySelectorAll('input[name="cart-fulfillment"]').forEach((el) => {
      el.addEventListener("change", () => {
        Cart?.setFulfillment(el.value);
        renderCart();
      });
    });

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
        renderFilters();
        renderProducts();
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
  hydrateBrand();
  buildMarquee();
  rotateHeroWords();
  renderFilters();
  renderProducts();
  renderGallery();
  renderCart();
  setupContact();
  setupChrome();
})();
