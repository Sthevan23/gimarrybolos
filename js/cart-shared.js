/**
 * cart-shared.js — mesmo padrão Aurora (home + cart.html)
 * Persistência: localStorage
 */
window.AuroraCart = (() => {
  const CART_KEY = 'docemel_cart_v1';
  const CUSTOMER_KEY = 'docemel_customer_v1';
  const COUPON_KEY = 'docemel_coupon_v1';
  const FULFILLMENT_KEY = 'docemel_fulfillment_v1';

  let items = loadItems();
  let coupon = loadCoupon();
  const listeners = new Set();

  function settings() {
    return (typeof SITE_DATA !== 'undefined' && SITE_DATA.settings) || {};
  }

  function notify(reason) {
    listeners.forEach((fn) => {
      try { fn(reason); } catch { /* ignore */ }
    });
  }

  function onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function loadItems() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function persist() {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    notify('cart');
  }

  function getItems() {
    return items.slice();
  }

  function lineKey(productId, flavor, size, notes) {
    return [productId, flavor || '', size || '', String(notes || '').trim()].join('::');
  }

  function count() {
    return items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  }

  function subtotal() {
    return items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0), 0);
  }

  function loadCoupon() {
    try {
      const raw = localStorage.getItem(COUPON_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (!parsed || typeof parsed !== 'object' || !parsed.code) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function getCoupon() {
    return coupon;
  }

  function setCoupon(next) {
    coupon = next;
    if (!next) localStorage.removeItem(COUPON_KEY);
    else localStorage.setItem(COUPON_KEY, JSON.stringify(next));
    notify('coupon');
  }

  function discount() {
    if (!coupon) return 0;
    const sub = subtotal();
    const minOrder = Number(coupon.minOrder) || 0;
    if (sub < minOrder) return 0;
    if (coupon.type === 'percent') {
      return Math.min(sub, (sub * (Number(coupon.value) || 0)) / 100);
    }
    return Math.min(sub, Number(coupon.value) || 0);
  }

  function payable() {
    return Math.max(0, subtotal() - discount());
  }

  function addItem(item) {
    const notes = String(item.notes || '').trim();
    const key = lineKey(item.productId, item.flavor, item.size, notes);
    const existing = items.find((row) => row.key === key);
    const qty = Math.max(1, Number(item.qty) || 1);
    if (existing) {
      existing.qty = (Number(existing.qty) || 0) + qty;
    } else {
      items.push({
        key,
        productId: item.productId,
        name: item.name,
        price: Number(item.price) || 0,
        qty,
        flavor: item.flavor || '',
        size: item.size || '',
        detail: item.detail || [item.size, item.flavor].filter(Boolean).join(' · '),
        image: item.image || '',
        notes,
      });
    }
    persist();
  }

  function updateQty(key, qty) {
    const item = items.find((row) => row.key === key);
    if (!item) return;
    const next = Math.max(0, Number(qty) || 0);
    if (next <= 0) items = items.filter((row) => row.key !== key);
    else item.qty = next;
    persist();
  }

  function removeItem(key) {
    items = items.filter((row) => row.key !== key);
    persist();
  }

  function clear() {
    items = [];
    setCoupon(null);
    persist();
  }

  function loadCustomer() {
    try {
      const raw = localStorage.getItem(CUSTOMER_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (!parsed || typeof parsed !== 'object') {
        return { nome: '', sobrenome: '', phone: '' };
      }
      return {
        nome: String(parsed.nome || '').trim(),
        sobrenome: String(parsed.sobrenome || '').trim(),
        phone: String(parsed.phone || '').replace(/\D/g, ''),
      };
    } catch {
      return { nome: '', sobrenome: '', phone: '' };
    }
  }

  function saveCustomer({ nome, sobrenome, phone }) {
    const data = {
      nome: String(nome || '').trim(),
      sobrenome: String(sobrenome || '').trim(),
      phone: String(phone || '').replace(/\D/g, '').slice(0, 11),
    };
    if (!data.nome && !data.sobrenome && !data.phone) return;
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify(data));
  }

  function getFulfillment() {
    return localStorage.getItem(FULFILLMENT_KEY) === 'entrega' ? 'entrega' : 'retirada';
  }

  function setFulfillment(value) {
    const next = value === 'entrega' ? 'entrega' : 'retirada';
    localStorage.setItem(FULFILLMENT_KEY, next);
    notify('fulfillment');
    return next;
  }

  function getDeliveryFee() {
    const n = Number(settings().deliveryFee);
    return Number.isFinite(n) && n >= 0 ? n : 7;
  }

  function getDeliveryNote() {
    return settings().deliveryNote || 'Bairros mais afastados: consultar';
  }

  function formatMoney(value) {
    return Number(value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  function formatPhoneBR(digits) {
    const d = String(digits || '').replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }

  function fulfillmentBlock(mode) {
    const note = getDeliveryNote();
    const address = settings().address || 'Endereço da confeitaria';
    if (mode === 'entrega') {
      return (
        `FORMA: Entrega\n` +
        `Taxa: sob consulta\n` +
        `${note}\n` +
        `(Confirmar endereço e valores no WhatsApp)`
      );
    }
    return `FORMA: Retirada no local\nEndereço: ${address}`;
  }

  function buildWhatsAppMessage({ fullName, phone, fulfillment }) {
    const storeName = (settings().brandName || 'Gimarry Bolos').toUpperCase();
    const list = getItems();
    const mode = fulfillment === 'entrega' ? 'entrega' : 'retirada';
    const subtotalValue = subtotal();

    const lines = list.map((item) => {
      const qty = Number(item.qty) || 1;
      const flavor = item.flavor ? ` (${item.flavor})` : '';
      const notes = item.notes ? `\n   Obs: ${item.notes}` : '';
      const lineTotal = (Number(item.price) || 0) * qty;
      const priceBlock = lineTotal > 0 ? `\n   ${formatMoney(lineTotal)}` : '';
      return `${qty}x ${item.name}${flavor}${priceBlock}${notes}`;
    }).join('\n\n');

    return (
      `*Novo Pedido — ${storeName}*\n\n` +
      `*Cliente:*\n${fullName}\n${formatPhoneBR(phone)}\n\n` +
      `*Itens:*\n${lines}\n\n` +
      `*Subtotal:* ${formatMoney(subtotalValue)}\n` +
      `*Entrega:* taxa sob consulta\n\n` +
      `${fulfillmentBlock(mode)}\n\n` +
      `Aguardo confirmação`
    );
  }

  function syncFromStorage() {
    items = loadItems();
    coupon = loadCoupon();
    notify('sync');
  }

  window.addEventListener('storage', (e) => {
    if ([CART_KEY, COUPON_KEY, CUSTOMER_KEY, FULFILLMENT_KEY].includes(e.key)) {
      syncFromStorage();
    }
  });

  return {
    CART_KEY, CUSTOMER_KEY, COUPON_KEY, FULFILLMENT_KEY,
    onChange, getItems, count, subtotal, discount, payable,
    addItem, updateQty, removeItem, clear,
    getCoupon, setCoupon,
    loadCustomer, saveCustomer, getFulfillment, setFulfillment,
    getDeliveryFee, getDeliveryNote, formatMoney, formatPhoneBR,
    buildWhatsAppMessage, syncFromStorage,
  };
})();
