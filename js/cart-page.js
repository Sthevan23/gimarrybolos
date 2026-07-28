/**
 * cart-page.js — página do carrinho (mesmo padrão Aurora)
 */
(function () {
  const Cart = window.AuroraCart;
  if (!Cart) {
    console.error('AuroraCart não carregou');
    return;
  }

  const S = (typeof SITE_DATA !== 'undefined' && SITE_DATA.settings) || {};

  const FALLBACK_IMG =
    "data:image/svg+xml," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800">' +
        '<rect width="600" height="800" fill="#fff1f4"/>' +
        '<text x="300" y="400" text-anchor="middle" fill="#c4a59a" font-family="Manrope,Arial,sans-serif" font-size="28" font-weight="600">Sem foto</text>' +
      "</svg>"
    );

  function imgSrc(path) {
    if (!path) return FALLBACK_IMG;
    const raw = String(path).trim();
    if (/^(data:|blob:|https?:)/i.test(raw)) return raw;
    return raw.replace(/^\//, '');
  }

  function onlyDigits(v) {
    return String(v || '').replace(/\D/g, '');
  }

  function formatPhoneBR(value) {
    return Cart.formatPhoneBR(value);
  }

  function bindPhoneMask(input) {
    if (!input || input.dataset.maskBound) return;
    input.dataset.maskBound = '1';
    input.addEventListener('input', () => {
      input.value = formatPhoneBR(input.value);
    });
  }

  function showFeedback(message) {
    const el = document.getElementById('cart-feedback');
    if (!el) return;
    el.innerHTML = `<span class="cart-feedback__left"><span class="cart-feedback__check"><i class="fa-solid fa-check"></i></span><span class="cart-feedback__text">${message}</span></span>`;
    el.hidden = false;
    el.classList.add('is-visible');
    clearTimeout(showFeedback._t);
    showFeedback._t = setTimeout(() => {
      el.classList.remove('is-visible');
      el.hidden = true;
    }, 2200);
  }

  function getStoreWhatsAppBase() {
    const raw = String(S.whatsapp || '').trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) {
      const match = raw.match(/wa\.me\/(\d+)/i);
      return match ? `https://wa.me/${match[1]}` : raw.split('?')[0];
    }
    let digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    if (!digits.startsWith('55')) digits = `55${digits}`;
    return `https://wa.me/${digits}`;
  }

  function openWhatsApp(text) {
    const base = getStoreWhatsAppBase();
    if (!base) {
      console.log(text);
      showFeedback('Pedido montado (WhatsApp da loja não configurado)');
      return;
    }
    const url = `${base}?text=${encodeURIComponent(text)}`;
    const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    if (mobile) {
      window.location.href = url;
      return;
    }
    const win = window.open(url, '_blank');
    if (!win) window.location.href = url;
  }

  function renderBadge() {
    const countEl = document.getElementById('cart-count');
    const totalEl = document.getElementById('header-cart-total');
    const count = Cart.count();
    const payable = Cart.payable();
    if (countEl) {
      countEl.textContent = String(count);
      countEl.hidden = count <= 0;
    }
    if (totalEl) {
      totalEl.hidden = count <= 0;
      totalEl.textContent = Cart.formatMoney(payable);
    }
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderItems() {
    const wrap = document.getElementById('cart-page-items');
    const empty = document.getElementById('cart-page-empty');
    const summary = document.getElementById('cart-page-summary');
    const subtitle = document.getElementById('cart-page-subtitle');
    const layout = document.querySelector('.cart-page__layout');
    const items = Cart.getItems();
    const count = Cart.count();

    if (subtitle) {
      subtitle.textContent = count
        ? `${count} ${count === 1 ? 'item' : 'itens'} no pedido`
        : 'Nenhum item ainda';
    }

    if (!items.length) {
      if (layout) layout.classList.add('is-empty');
      if (wrap) wrap.innerHTML = '';
      if (empty) empty.hidden = false;
      if (summary) summary.hidden = true;
      return;
    }

    if (layout) layout.classList.remove('is-empty');
    if (empty) empty.hidden = true;
    if (summary) summary.hidden = false;

    wrap.innerHTML = items.map((item) => {
      const line = (Number(item.price) || 0) * (Number(item.qty) || 0);
      const meta = [item.size, item.flavor].filter(Boolean).join(' · ');
      const notes = item.notes
        ? `<p class="cart-line__notes"><i class="fa-regular fa-comment"></i> ${escapeHtml(item.notes)}</p>`
        : '';
      return `
        <article class="cart-line" data-key="${escapeHtml(item.key)}">
          <div class="cart-line__media">
            <img class="cart-line__img" src="${imgSrc(item.image)}" alt="" loading="lazy"
              onerror="this.onerror=null;this.src='${FALLBACK_IMG}'">
          </div>
          <div class="cart-line__body">
            <div class="cart-line__top">
              <h3 class="cart-line__name">${escapeHtml(item.name)}</h3>
              <button type="button" class="cart-line__remove" data-remove="${escapeHtml(item.key)}" aria-label="Remover">
                <i class="fa-solid fa-trash" aria-hidden="true"></i>
              </button>
            </div>
            ${meta ? `<p class="cart-line__meta">${escapeHtml(meta)}</p>` : ''}
            ${notes}
            <div class="cart-line__foot">
              <div class="qty-stepper" data-qty-key="${escapeHtml(item.key)}">
                <button type="button" class="qty-stepper__btn" data-qty-delta="-1" aria-label="Diminuir">−</button>
                <span class="qty-stepper__value">${item.qty}</span>
                <button type="button" class="qty-stepper__btn qty-stepper__btn--plus" data-qty-delta="1" aria-label="Aumentar">+</button>
              </div>
              ${line > 0 ? `<strong class="cart-line__price">${Cart.formatMoney(line)}</strong>` : ''}
            </div>
          </div>
        </article>
      `;
    }).join('');

    wrap.querySelectorAll('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', () => {
        Cart.removeItem(btn.dataset.remove);
        showFeedback('Item removido');
      });
    });

    wrap.querySelectorAll('.qty-stepper').forEach((stepper) => {
      const key = stepper.dataset.qtyKey;
      stepper.querySelectorAll('[data-qty-delta]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const item = Cart.getItems().find((x) => x.key === key);
          if (!item) return;
          const delta = Number(btn.dataset.qtyDelta) || 0;
          Cart.updateQty(key, (Number(item.qty) || 0) + delta);
          showFeedback('Quantidade alterada');
        });
      });
    });
  }

  function renderSummary() {
    const subtotal = Cart.subtotal();
    const total = Cart.payable();

    const setText = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    setText('cart-page-subtotal', Cart.formatMoney(subtotal));
    setText('cart-page-total', Cart.formatMoney(total));
    setText('cart-page-fee', 'Sob consulta');

    const discountRow = document.getElementById('cart-page-discount-row');
    if (discountRow) discountRow.hidden = true;
    const feeRow = document.getElementById('cart-page-fee-row');
    const feeNote = document.getElementById('cart-page-fee-note');
    if (feeRow) feeRow.hidden = true;
    if (feeNote) feeNote.hidden = true;

    const couponBox = document.getElementById('cart-page-coupon');
    if (couponBox) couponBox.hidden = true;
  }

  function renderAll() {
    renderBadge();
    renderItems();
    renderSummary();
  }

  function fillCustomer() {
    const c = Cart.loadCustomer();
    const nome = document.getElementById('cart-page-nome');
    const sobrenome = document.getElementById('cart-page-sobrenome');
    const phone = document.getElementById('cart-page-phone');
    if (nome) nome.value = c.nome;
    if (sobrenome) sobrenome.value = c.sobrenome;
    if (phone) {
      phone.value = c.phone ? formatPhoneBR(c.phone) : '';
      bindPhoneMask(phone);
    }
    Cart.setFulfillment('retirada');
  }

  function checkout() {
    const error = document.getElementById('cart-page-error');
    const btn = document.getElementById('cart-page-checkout');
    const nome = document.getElementById('cart-page-nome')?.value.trim() || '';
    const sobrenome = document.getElementById('cart-page-sobrenome')?.value.trim() || '';
    const phoneInput = document.getElementById('cart-page-phone');
    if (phoneInput) phoneInput.value = formatPhoneBR(phoneInput.value);
    const phone = onlyDigits(phoneInput?.value || '');

    if (!Cart.getItems().length) {
      if (error) { error.textContent = 'Adicione pelo menos um item.'; error.hidden = false; }
      return;
    }
    if (!nome || !sobrenome) {
      if (error) { error.textContent = 'Preencha nome e sobrenome.'; error.hidden = false; }
      return;
    }
    if (phone.length < 10 || phone.length > 11) {
      if (error) { error.textContent = 'Informe um WhatsApp válido com DDD.'; error.hidden = false; }
      phoneInput?.focus();
      return;
    }

    if (error) error.hidden = true;
    Cart.saveCustomer({ nome, sobrenome, phone });
    const fulfillment = Cart.setFulfillment('retirada');
    const fullName = `${nome} ${sobrenome}`;
    const message = Cart.buildWhatsAppMessage({ fullName, phone, fulfillment });
    Cart.clear();
    renderAll();
    openWhatsApp(message);
  }

  function boot() {
    const brand = document.getElementById('cart-brand-name');
    if (brand) brand.textContent = S.brandName || 'Gimarry Bolos';

    fillCustomer();
    renderAll();
    Cart.onChange(() => renderAll());

    document.getElementById('cart-page-checkout')?.addEventListener('click', checkout);

    Cart.setFulfillment('retirada');

    ['cart-page-nome', 'cart-page-sobrenome', 'cart-page-phone'].forEach((id) => {
      document.getElementById(id)?.addEventListener('change', () => {
        Cart.saveCustomer({
          nome: document.getElementById('cart-page-nome')?.value || '',
          sobrenome: document.getElementById('cart-page-sobrenome')?.value || '',
          phone: document.getElementById('cart-page-phone')?.value || '',
        });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
