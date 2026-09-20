/**
 * storage.js — Gimarry Bolos
 * Painel e site usam o mesmo armazenamento local (sem nuvem e sem impressora).
 */
const Storage = (() => {
  const REMEMBER_KEY = 'gimarry_admin_remember';
  const KEY = 'gimarry_admin_data_v1';
  const DEFAULT_AUTH = {
    email: 'gimarrybolos@gmail.com',
    password: 'gimarry123',
  };
  const PUBLIC_CACHE_KEY = 'gimarry_public_catalog_v1';
  const DATA_VERSION = 1;
  let memoryData = null;
  let adminPassword = '';

  function notifyUpdated() {
    window.dispatchEvent(new Event('storage-updated'));
  }

  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('storage', (e) => {
      if (e.key !== KEY && e.key !== PUBLIC_CACHE_KEY) return;
      memoryData = null;
      getAll();
      notifyUpdated();
    });
  }

  function defaultPrice(product) {
    const cat = product?.category || product?.categoryId;
    if (cat === 'pronta') return 65;
    if (cat === 'bolos' || cat === 'destaques') return 95;
    return Number(product?.price) || 0;
  }

  function seedFromSite() {
    const site = typeof SITE_DATA !== 'undefined' ? SITE_DATA : {};
    const s = site.settings || {};
    const categories = (site.categories || [])
      .filter((c) => c.id !== 'todos')
      .map((c, i) => ({
        id: c.id,
        name: c.name,
        slug: c.id,
        sortOrder: i,
      }));
    const products = (site.products || []).map((p, i) => ({
      ...p,
      categoryId: p.categoryId || p.category,
      category: p.category || p.categoryId,
      price: Number(p.price) > 0 ? Number(p.price) : defaultPrice(p),
      active: p.active !== false,
      available: p.available !== false,
      featured: Boolean(p.bestSeller || p.featured),
      sortOrder: i,
      flavors: Array.isArray(p.flavors) ? p.flavors : [],
      promoActive: Boolean(p.promoActive),
      promoPrice: p.promoPrice ?? null,
      promoLabel: p.promoLabel || '',
      stock: p.stock ?? null,
    }));
    return {
      version: DATA_VERSION,
      settings: {
        name: s.brandName || 'Gimarry Bolos',
        tagline: s.tagline || '',
        logo: '',
        banner: s.heroImage || '',
        sobreImage: s.aboutImage || '',
        whatsapp: s.whatsapp || '',
        instagram: s.instagram || '',
        instagramUser: s.instagramUser || '',
        facebook: '',
        email: 'gimarrybolos@gmail.com',
        address: s.address || '',
        hours: 'Pedidos pelo site e WhatsApp',
        deliveryFee: Number(s.deliveryFee) || 0,
        deliveryNote: s.deliveryNote || '',
        followers: '',
        posts: '',
        mapEmbed: '',
        heroBadge: s.brandSub || '',
        heroStory: [],
        sobreText1: s.sobreText1 || '',
        sobreText2: s.sobreText2 || '',
        brandName: s.brandName || 'Gimarry Bolos',
        brandSub: s.brandSub || '',
        heroTitle1: s.heroTitle1 || '',
        heroTitle2: s.heroTitle2 || '',
        heroWords: s.heroWords || [],
        categoriesLine: s.categoriesLine || '',
        city: s.city || '',
        heroImage: s.heroImage || '',
        contactImage: s.contactImage || s.aboutImage || '',
      },
      auth: { ...DEFAULT_AUTH },
      categories,
      products,
      clients: [],
      orders: [],
      finance: [],
      coupons: [],
      reviews: [],
      faq: [],
      gallery: site.gallery || [],
    };
  }

  function emptyStore() {
    return seedFromSite();
  }

  function slimPublicCatalog(data) {
    return {
      version: data.version || DATA_VERSION,
      savedAt: Date.now(),
      settings: data.settings || {},
      categories: data.categories || [],
      products: (data.products || []).filter((p) => p.active !== false),
      gallery: data.gallery || [],
      coupons: data.coupons || [],
    };
  }

  function savePublicCache(data) {
    try {
      localStorage.setItem(PUBLIC_CACHE_KEY, JSON.stringify(slimPublicCatalog(data)));
    } catch { /* quota */ }
  }

  function setMemory(data) {
    memoryData = data;
  }

  function persist(data) {
    setMemory(data);
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch { /* quota */ }
    savePublicCache(data);
    notifyUpdated();
  }

  function loadPersisted() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      if (!Array.isArray(parsed.products) || !parsed.products.length) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function ensureAuth(data) {
    if (!data || typeof data !== 'object') return data;
    const email = String(data.auth?.email || '').trim();
    const password = String(data.auth?.password || '');
    if (!email || !password) {
      data.auth = { ...DEFAULT_AUTH };
    }
    return data;
  }

  function getAll() {
    if (memoryData) return ensureAuth(memoryData);
    const saved = loadPersisted();
    memoryData = ensureAuth(saved || seedFromSite());
    return memoryData;
  }

  function save(data) {
    persist(data || getAll());
  }

  async function saveAsync(data) {
    persist(data || getAll());
    return true;
  }

  function init() {
    getAll();
  }

  async function initCloud() {
    getAll();
    return false;
  }

  async function pullFull() {
    getAll();
    return true;
  }

  async function pullPublic() {
    return true;
  }

  async function pushToCloud() {
    return true;
  }

  async function probeCloud() {
    return false;
  }

  async function reconnectCloud() {
    return false;
  }

  function isCloudEnabled() {
    return false;
  }

  function wasLoadedFromCache() {
    return true;
  }

  function apiCoolingDown() {
    return false;
  }

  function clearApiBreaker() {}

  function startCloudPolling() {}

  function stopCloudPolling() {}

  function getApiUrl() {
    return '';
  }

  function setAdminPassword(value) {
    adminPassword = String(value || '');
    try {
      if (adminPassword) sessionStorage.setItem('admin_password', adminPassword);
      else sessionStorage.removeItem('admin_password');
    } catch { /* ignore */ }
  }

  function getAdminPassword() {
    if (adminPassword) return adminPassword;
    try {
      adminPassword = sessionStorage.getItem('admin_password') || '';
    } catch { /* ignore */ }
    return adminPassword;
  }

  function getSettings() {
    return getAll().settings;
  }

  function saveSettings(settings) {
    const data = getAll();
    data.settings = { ...data.settings, ...settings };
    save(data);
  }

  function sortOrderValue(item, fallback = 9999) {
    const n = Number(item?.sortOrder);
    return Number.isFinite(n) ? n : fallback;
  }

  function sortProductsList(products) {
    return (products || []).slice().sort((a, b) => {
      const diff = sortOrderValue(a) - sortOrderValue(b);
      if (diff !== 0) return diff;
      return String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR');
    });
  }

  function sortCategoriesList(categories) {
    return (categories || []).slice().sort((a, b) => {
      const diff = sortOrderValue(a) - sortOrderValue(b);
      if (diff !== 0) return diff;
      return String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR');
    });
  }

  function applyProductSortOrders(products, orderedIds) {
    const map = new Map((orderedIds || []).map((id, idx) => [id, idx]));
    return (products || []).map((p) => ({
      ...p,
      sortOrder: map.has(p.id) ? map.get(p.id) : sortOrderValue(p),
    }));
  }

  function applyCategorySortOrders(categories, orderedIds) {
    const map = new Map((orderedIds || []).map((id, idx) => [id, idx]));
    return (categories || []).map((c) => ({
      ...c,
      sortOrder: map.has(c.id) ? map.get(c.id) : sortOrderValue(c),
    }));
  }

  function nextProductSortOrder(products) {
    const max = (products || []).reduce((m, p) => Math.max(m, sortOrderValue(p, -1)), -1);
    return max + 1;
  }

  function getProducts() {
    return sortProductsList(getAll().products);
  }

  function saveProducts(products) {
    const data = getAll();
    data.products = products;
    save(data);
  }

  async function saveProductsAsync(products) {
    saveProducts(products);
    return true;
  }

  function replaceProductInMemory(product, { remove = false } = {}) {
    const data = getAll();
    const id = String(product?.id || '');
    const list = Array.isArray(data.products) ? data.products : [];
    if (remove || !id) {
      data.products = list.filter((p) => String(p.id) !== id);
    } else {
      const idx = list.findIndex((p) => String(p.id) === id);
      const next = {
        ...product,
        category: product.category || product.categoryId,
        categoryId: product.categoryId || product.category,
      };
      if (idx >= 0) list[idx] = { ...list[idx], ...next };
      else list.push(next);
      data.products = list;
    }
    persist(data);
  }

  async function saveProductAsync(product) {
    if (!product || !product.id) return { ok: false, error: 'Produto inválido.' };
    replaceProductInMemory(product);
    return { ok: true, product, catalog: true };
  }

  async function deleteProductAsync(productId) {
    const id = String(productId || '').trim();
    if (!id) return { ok: false, error: 'Produto inválido.' };
    replaceProductInMemory({ id }, { remove: true });
    return { ok: true, catalog: true };
  }

  async function setProductActiveAsync(productId, active) {
    if (!productId) return false;
    const data = getAll();
    data.products = (data.products || []).map((p) => (
      p.id === productId ? { ...p, active: !!active } : p
    ));
    persist(data);
    return true;
  }

  async function publishCatalogAsync() {
    savePublicCache(getAll());
    return true;
  }

  async function saveCatalogOrderAsync(categoryIds, productIds) {
    const data = getAll();
    data.categories = applyCategorySortOrders(data.categories || [], categoryIds);
    data.products = applyProductSortOrders(data.products || [], productIds);
    persist(data);
    return { ok: true, catalog: true };
  }

  function getCategories() {
    return sortCategoriesList(getAll().categories);
  }

  function saveCategories(categories) {
    const data = getAll();
    data.categories = categories;
    save(data);
  }

  function getClients() {
    return getAll().clients || [];
  }

  function saveClients(clients) {
    const data = getAll();
    data.clients = clients;
    save(data);
  }

  function getOrders() {
    return getAll().orders || [];
  }

  function saveOrders(orders) {
    const data = getAll();
    data.orders = orders;
    save(data);
  }

  async function saveOrdersAsync(orders) {
    saveOrders(orders);
    return true;
  }

  function getFinance() {
    return getAll().finance || [];
  }

  function saveFinance(entries) {
    const data = getAll();
    data.finance = entries;
    save(data);
  }

  function getCoupons() {
    return getAll().coupons || [];
  }

  function saveCoupons(coupons) {
    const data = getAll();
    data.coupons = coupons;
    save(data);
  }

  async function saveCouponsAsync(coupons) {
    saveCoupons(coupons);
    return true;
  }

  function findCouponByCode(code) {
    const needle = String(code || '').trim().toUpperCase();
    if (!needle) return null;
    return getCoupons().find((c) => {
      const active = c.active !== false;
      return active && String(c.code || '').trim().toUpperCase() === needle;
    }) || null;
  }

  function calcCouponDiscount(coupon, subtotal) {
    const total = Math.max(0, Number(subtotal) || 0);
    if (!coupon || total <= 0) return 0;
    const minOrder = Number(coupon.minOrder) || 0;
    if (total < minOrder) return 0;
    const value = Number(coupon.value) || 0;
    if (value <= 0) return 0;
    if (coupon.type === 'fixed') return Math.min(total, value);
    const pct = Math.min(100, Math.max(0, value));
    return Math.round((total * (pct / 100)) * 100) / 100;
  }

  function addFinanceEntry({ type, amount, description, category }) {
    const entries = getFinance();
    const entry = {
      id: generateId('f'),
      type: type === 'expense' ? 'expense' : 'income',
      amount: Number(amount) || 0,
      description: String(description || '').trim(),
      category: category || (type === 'expense' ? 'Despesa' : 'Manual'),
      date: new Date().toISOString(),
    };
    entries.unshift(entry);
    saveFinance(entries);
    return entry;
  }

  function deleteFinanceEntry(id) {
    saveFinance(getFinance().filter((e) => e.id !== id));
  }

  function getFinanceSummary() {
    const entries = getFinance();
    const incomeManual = entries.filter((e) => e.type === 'income').reduce((s, e) => s + Number(e.amount || 0), 0);
    const expense = entries.filter((e) => e.type === 'expense').reduce((s, e) => s + Number(e.amount || 0), 0);
    const fromOrders = getDashboardStats().totalSales;
    return {
      orderSales: fromOrders,
      incomeManual,
      expense,
      balance: fromOrders + incomeManual - expense,
      entries,
    };
  }

  function getReviews() {
    return getAll().reviews || [];
  }

  function getFaq() {
    return getAll().faq || [];
  }

  function getGallery() {
    return getAll().gallery || [];
  }

  function loginLocal(email, password) {
    const data = getAll();
    const auth = data.auth || DEFAULT_AUTH;
    const inputEmail = String(email || '').trim().toLowerCase();
    const inputPass = String(password || '');
    const storedEmail = String(auth.email || '').trim().toLowerCase();
    const storedPass = String(auth.password || '');
    const ok = (
      (inputEmail === storedEmail && inputPass === storedPass)
      || (inputEmail === DEFAULT_AUTH.email && inputPass === DEFAULT_AUTH.password)
    );
    if (!ok) return false;
    if (!data.auth?.email || !data.auth?.password) {
      data.auth = { ...DEFAULT_AUTH };
      persist(data);
    }
    setAdminPassword(inputPass);
    return true;
  }

  function isAdminLogged() {
    try {
      return sessionStorage.getItem('admin_logged') === 'true'
        || localStorage.getItem(REMEMBER_KEY) === 'true';
    } catch {
      return false;
    }
  }

  function markAdminLogged(email, remember) {
    try {
      sessionStorage.setItem('admin_logged', 'true');
      sessionStorage.setItem('admin_email', String(email || '').trim());
      if (remember) localStorage.setItem(REMEMBER_KEY, 'true');
      else localStorage.removeItem(REMEMBER_KEY);
    } catch { /* ignore */ }
  }

  function clearAdminLogged() {
    try {
      sessionStorage.removeItem('admin_logged');
      sessionStorage.removeItem('admin_email');
      sessionStorage.removeItem('admin_offline');
      localStorage.removeItem(REMEMBER_KEY);
    } catch { /* ignore */ }
    setAdminPassword('');
  }

  function login(email, password) {
    return loginLocal(email, password);
  }

  async function loginAsync(email, password) {
    const ok = loginLocal(email, password);
    return { ok };
  }

  function updatePassword(currentPassword, newPassword) {
    const data = getAll();
    if (data.auth.password !== currentPassword) return false;
    data.auth.password = newPassword;
    save(data);
    setAdminPassword(newPassword);
    return true;
  }

  function generateId(prefix) {
    return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  function generateOrderNumber() {
    return nextOrderNumber(getOrders());
  }

  function nextOrderNumber(orders) {
    const year = new Date().getFullYear();
    let max = 0;
    (orders || []).forEach((order) => {
      const match = String(order.number || '').match(/PED-(\d{4})-(\d+)/i);
      if (match && Number(match[1]) === year) max = Math.max(max, Number(match[2]) || 0);
    });
    return `PED-${year}-${String(max + 1).padStart(3, '0')}`;
  }

  function getCategoryName(categoryId) {
    const cat = getCategories().find((c) => c.id === categoryId);
    return cat ? cat.name : 'Outros';
  }

  function formatCurrency(value) {
    return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function productDisplayPrice(product) {
    const list = Number(product.price || 0);
    if (product.promoActive && product.promoPrice != null && product.promoPrice >= 0) {
      const promo = Number(product.promoPrice);
      if (promo < list) return promo;
    }
    return list;
  }

  function normalizeStock(stock) {
    if (stock === null || stock === undefined || stock === '') return null;
    const n = Number(stock);
    if (!Number.isFinite(n)) return null;
    return Math.max(0, Math.floor(n));
  }

  function productTracksStock(product) {
    return normalizeStock(product?.stock) !== null;
  }

  function productStockQty(product) {
    return normalizeStock(product?.stock);
  }

  function getProductById(productId) {
    const id = String(productId || '').trim();
    if (!id) return null;
    return (getAll().products || []).find((p) => String(p.id) === id) || null;
  }

  function isProductOrderable(product) {
    if (!product || product.active === false) return false;
    if (product.available === false) return false;
    const stock = productStockQty(product);
    if (stock === null) return true;
    return stock > 0;
  }

  function productStockLabel(product) {
    const stock = productStockQty(product);
    if (stock === null) return '';
    if (stock <= 0) return 'Esgotado';
    if (stock <= 5) return `${stock} restante${stock === 1 ? '' : 's'}`;
    return '';
  }

  function applyLocalStockDecrement(items) {
    const data = getAll();
    const need = {};
    (items || []).forEach((item) => {
      const pid = String(item?.productId || item?.id || '').trim();
      if (!pid) return;
      need[pid] = (need[pid] || 0) + Math.max(1, Number(item?.qty) || 1);
    });
    let changed = false;
    data.products = (data.products || []).map((p) => {
      const qty = need[p.id];
      if (!qty || !productTracksStock(p)) return p;
      const stock = productStockQty(p);
      if (stock === null) return p;
      const next = Math.max(0, stock - qty);
      changed = true;
      return { ...p, stock: next, available: next > 0 ? (p.available !== false) : false };
    });
    if (changed) persist(data);
  }

  function getDashboardStats() {
    const orders = getOrders();
    const finished = orders.filter((o) => o.status === 'finalizado');
    const totalSales = finished.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const today = new Date().toISOString().split('T')[0];
    const todaySales = finished.filter((o) => String(o.date || '').startsWith(today)).reduce((s, o) => s + (Number(o.total) || 0), 0);
    const month = new Date().toISOString().slice(0, 7);
    const monthSales = finished.filter((o) => String(o.date || '').startsWith(month)).reduce((s, o) => s + (Number(o.total) || 0), 0);
    return {
      totalOrders: orders.length,
      totalSales,
      totalClients: getClients().length,
      totalProducts: getProducts().length,
      todaySales,
      monthSales,
    };
  }

  function getMonthlyRevenue() {
    const orders = getOrders().filter((o) => o.status === 'finalizado');
    const months = {};
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = { label: monthNames[d.getMonth()], value: 0 };
    }
    orders.forEach((o) => {
      const key = String(o.date || '').slice(0, 7);
      if (months[key]) months[key].value += Number(o.total) || 0;
    });
    return Object.values(months);
  }

  function getFinishedOrdersByPeriod(period = 'all') {
    const finished = getOrders().filter((o) => o.status === 'finalizado');
    if (period === 'today') {
      const today = new Date().toISOString().split('T')[0];
      return finished.filter((o) => String(o.date || '').startsWith(today));
    }
    if (period === 'month') {
      const month = new Date().toISOString().slice(0, 7);
      return finished.filter((o) => String(o.date || '').startsWith(month));
    }
    return finished;
  }

  function getProductSalesBreakdown(period = 'all') {
    const orders = getFinishedOrdersByPeriod(period);
    const map = {};
    orders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const key = item.productId || item.name;
        if (!map[key]) {
          map[key] = { productId: item.productId || null, name: item.name || 'Produto', qty: 0, revenue: 0 };
        }
        const qty = Number(item.qty) || 0;
        const price = Number(item.price) || 0;
        map[key].qty += qty;
        map[key].revenue += qty * price;
        map[key].name = item.name || map[key].name;
      });
    });
    return Object.values(map)
      .map((row) => ({ ...row, avgPrice: row.qty > 0 ? row.revenue / row.qty : 0 }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  function getSalesPeriodStats(period = 'all') {
    const orders = getFinishedOrdersByPeriod(period);
    const breakdown = getProductSalesBreakdown(period);
    return {
      orderCount: orders.length,
      totalRevenue: orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0),
      cakesSold: breakdown.reduce((sum, row) => sum + row.qty, 0),
      products: breakdown,
    };
  }

  function phonesEquivalent(a, b) {
    const pa = String(a || '').replace(/\D/g, '');
    const pb = String(b || '').replace(/\D/g, '');
    if (!pa || !pb) return false;
    return pa === pb || pa.slice(-11) === pb.slice(-11) || pa.slice(-10) === pb.slice(-10);
  }

  function computeLoyaltyFromOrders(orders, whatsapp, bonusOverride) {
    const goal = 15;
    const gift = '1 brinde da Gimarry';
    const phone = String(whatsapp || '').replace(/\D/g, '');
    if (!phone || phone.length < 10) {
      return {
        phone: '', total: 0, siteTotal: 0, bonus: 0, progress: 0, goal, remaining: goal,
        rewards: 0, eligible: false, gift,
      };
    }
    const siteTotal = (orders || []).filter((o) => {
      if (String(o.status || '').toLowerCase() !== 'finalizado') return false;
      return phonesEquivalent(phone, o.clientWhatsapp || '');
    }).length;
    let bonus = 0;
    if (typeof bonusOverride === 'number' && Number.isFinite(bonusOverride)) {
      bonus = Math.max(0, Math.floor(bonusOverride));
    } else {
      const client = (getClients() || []).find((c) => phonesEquivalent(phone, c.phone || ''));
      bonus = Math.max(0, Math.floor(Number(client?.loyaltyBonus) || 0));
    }
    const total = siteTotal + bonus;
    const rewards = Math.floor(total / goal);
    const mod = total % goal;
    const eligible = total > 0 && mod === 0;
    const progress = eligible ? goal : mod;
    const remaining = eligible ? 0 : (goal - progress);
    return { phone, total, siteTotal, bonus, progress, goal, remaining, rewards, eligible, gift };
  }

  async function getLoyaltyStatus(whatsapp) {
    return computeLoyaltyFromOrders(getOrders(), whatsapp);
  }

  function orderFingerprint(phone, items, notes) {
    const itemKey = (items || [])
      .map((item) => `${item.productId || ''}|${item.name || ''}|${item.qty || 1}|${item.price || 0}|${item.detail || ''}`)
      .join(';');
    return `${phone}::${itemKey}::${notes || ''}`;
  }

  function findRecentDuplicate(orders, phone, items, notes, windowMs = 90000) {
    const fingerprint = orderFingerprint(phone, items, notes);
    const now = Date.now();
    return (orders || []).find((order) => {
      const orderPhone = String(order.clientWhatsapp || '').replace(/\D/g, '');
      if (orderPhone !== phone) return false;
      const age = now - new Date(order.date || 0).getTime();
      if (Number.isNaN(age) || age < 0 || age > windowMs) return false;
      return orderFingerprint(orderPhone, order.items, order.notes) === fingerprint;
    });
  }

  function toBase64Url(text) {
    const str = String(text || '');
    if (typeof btoa === 'function') {
      return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function fromBase64Url(value) {
    const raw = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
    const pad = raw + '==='.slice((raw.length + 3) % 4);
    if (typeof atob === 'function') {
      return decodeURIComponent(escape(atob(pad)));
    }
    const binary = atob(pad);
    const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function encodeInboxPayload({ fullName, phone, items, total, notes }) {
    const slim = {
      n: String(fullName || '').trim(),
      w: String(phone || '').replace(/\D/g, ''),
      t: Number(total) || 0,
      d: new Date().toISOString(),
      s: String(notes || 'Retirada no local').slice(0, 280),
      i: (items || []).map((item) => ({
        id: String(item.productId || item.id || ''),
        n: String(item.name || '').slice(0, 80),
        q: Number(item.qty) || 1,
        p: Number(item.price) || 0,
        d: String(item.detail || [item.size, item.flavor, item.notes].filter(Boolean).join(' · ')).slice(0, 160),
        img: String(item.image || '').startsWith('data:') ? '' : String(item.image || ''),
      })),
    };
    if (!slim.n || slim.w.length < 10 || !slim.i.length) return '';
    return toBase64Url(JSON.stringify(slim));
  }

  function decodeInboxPayload(hash) {
    try {
      const parsed = JSON.parse(fromBase64Url(String(hash || '').replace(/^#/, '')));
      if (!parsed || typeof parsed !== 'object') return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function insertSiteOrder({ name, phone, items, total, notes, address, date, source }) {
    const clientName = String(name || '').trim();
    const clientPhone = String(phone || '').replace(/\D/g, '');
    const clientAddress = String(address || '').trim().slice(0, 280);
    if (!clientName || clientPhone.length < 10 || !items || !items.length) {
      return { ok: false, error: 'Dados incompletos' };
    }

    const data = getAll();
    data.orders = data.orders || [];
    data.clients = data.clients || [];

    const duplicate = findRecentDuplicate(data.orders, clientPhone, items, notes, 1000 * 60 * 60 * 24);
    if (duplicate) {
      return { ok: true, order: duplicate, duplicated: true, loyalty: computeLoyaltyFromOrders(data.orders, clientPhone) };
    }

    let client = data.clients.find((c) => String(c.phone || '').replace(/\D/g, '') === clientPhone);
    if (!client) {
      client = { id: generateId('c'), name: clientName, email: '', phone: clientPhone, address: clientAddress };
      data.clients.push(client);
    } else {
      client.name = clientName;
      client.phone = clientPhone;
      if (clientAddress) client.address = clientAddress;
    }

    const catalog = data.products || [];
    const itemsWithImage = (items || []).map((item) => {
      const id = String(item.productId || item.id || '').trim();
      const product = catalog.find((p) => String(p.id) === id)
        || catalog.find((p) => String(p.name || '').trim().toLowerCase() === String(item.name || '').trim().toLowerCase());
      const image = String(item.image || product?.image || '');
      return {
        ...item,
        image: image.startsWith('data:') ? '' : image,
      };
    });

    const order = {
      id: generateId('o'),
      number: nextOrderNumber(data.orders),
      clientId: client.id,
      clientName,
      clientWhatsapp: clientPhone,
      items: itemsWithImage,
      total: Number(total) || itemsWithImage.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 1), 0),
      status: 'novo',
      date: date || new Date().toISOString(),
      notes: notes || '',
      source: source || 'site',
    };
    data.orders.push(order);
    applyLocalStockDecrement(itemsWithImage);
    persist(data);
    return { ok: true, order, loyalty: computeLoyaltyFromOrders(data.orders, clientPhone) };
  }

  function importSiteOrder(payload) {
    if (!payload || typeof payload !== 'object') {
      return { ok: false, error: 'Pedido vazio' };
    }
    const items = (payload.i || payload.items || []).map((item) => ({
      productId: item.id || item.productId || '',
      name: item.n || item.name,
      qty: item.q || item.qty || 1,
      price: item.p || item.price || 0,
      detail: item.d || item.detail || '',
      image: item.img || item.image || '',
    }));
    return insertSiteOrder({
      name: payload.n || payload.clientName || payload.fullName,
      phone: payload.w || payload.clientWhatsapp || payload.whatsapp,
      items,
      total: payload.t || payload.total,
      notes: payload.s || payload.notes || 'Retirada no local',
      address: payload.a || payload.address || '',
      date: payload.d || payload.date,
      source: 'whatsapp',
    });
  }

  async function createPublicOrder({ fullName, whatsapp, items, total, notes, address }) {
    return insertSiteOrder({
      name: fullName,
      phone: whatsapp,
      items,
      total,
      notes,
      address,
      source: 'site',
    });
  }

  function loadAnalyticsEvents() {
    try {
      const parsed = JSON.parse(localStorage.getItem('gimarry_analytics_events_v1') || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function brazilParts(ts) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hourCycle: 'h23',
      weekday: 'short',
    }).formatToParts(new Date(ts));
    const get = (type) => parts.find((p) => p.type === type)?.value;
    const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return {
      date: `${get('year')}-${get('month')}-${get('day')}`,
      hour: Number(get('hour')),
      weekday: weekdayMap[get('weekday')] ?? 0,
    };
  }

  function periodRange(period) {
    const now = Date.now();
    const startToday = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    startToday.setHours(0, 0, 0, 0);
    const todayStart = startToday.getTime();
    if (period === 'today') {
      return { from: todayStart, to: now, label: 'Hoje', prevFrom: todayStart - 86400000, prevTo: todayStart };
    }
    const days = period === '30d' ? 30 : 7;
    const from = now - days * 86400000;
    return {
      from,
      to: now,
      label: days === 30 ? 'Últimos 30 dias' : 'Últimos 7 dias',
      prevFrom: from - days * 86400000,
      prevTo: from,
    };
  }

  function inRange(ts, from, to) {
    const n = Number(ts) || 0;
    return n >= from && n < to;
  }

  function uniqueSessions(list) {
    return new Set(list.map((e) => e.sessionId).filter(Boolean)).size;
  }

  function countType(list, type) {
    return list.filter((e) => e.eventType === type).length;
  }

  function rate(part, total) {
    if (!total) return 0;
    return Math.round((part / total) * 100);
  }

  function deltaPct(now, prev) {
    if (prev === 0) return now === 0 ? 0 : 100;
    return Math.round(((now - prev) / prev) * 100);
  }

  function referrerLabel(ref) {
    const value = String(ref || '').trim();
    if (!value) return 'Direto';
    try {
      const host = new URL(value).hostname.replace(/^www\./, '');
      if (/instagram|l\.instagram/.test(host)) return 'Instagram';
      if (/facebook|fb\./.test(host)) return 'Facebook';
      if (/whatsapp|wa\.me/.test(host)) return 'WhatsApp';
      if (/google|gstatic/.test(host)) return 'Google';
      return host || 'Outros';
    } catch {
      return 'Outros';
    }
  }

  function getAnalytics(period) {
    const range = periodRange(period);
    const all = loadAnalyticsEvents();
    const current = all.filter((e) => inRange(e.ts, range.from, range.to));
    const previous = all.filter((e) => inRange(e.ts, range.prevFrom, range.prevTo));

    const visitors = uniqueSessions(current);
    const prevVisitors = uniqueSessions(previous);
    const pageViews = countType(current, 'page_view');
    const productViews = countType(current, 'product_view');
    const addToCart = countType(current, 'add_to_cart');
    const beginCheckout = countType(current, 'begin_checkout');
    const ordersCreated = countType(current, 'order_created');
    const prevOrders = countType(previous, 'order_created');
    const prevCart = countType(previous, 'add_to_cart');

    const visitorsWithPage = uniqueSessions(current.filter((e) => e.eventType === 'page_view'));
    const sessionsProduct = uniqueSessions(current.filter((e) => e.eventType === 'product_view'));
    const sessionsCart = uniqueSessions(current.filter((e) => e.eventType === 'add_to_cart'));
    const sessionsCheckout = uniqueSessions(current.filter((e) => e.eventType === 'begin_checkout'));
    const sessionsOrder = uniqueSessions(current.filter((e) => e.eventType === 'order_created'));

    const summary = {
      uniqueVisitors: visitors,
      pageViews,
      avgPagesPerVisitor: visitors ? Math.round((pageViews / visitors) * 10) / 10 : 0,
      ordersCreated,
      conversionRate: rate(ordersCreated, visitors || 1),
      addToCart,
      beginCheckout,
      abandonCheckout: rate(Math.max(0, beginCheckout - ordersCreated), beginCheckout || 1),
      cartRate: rate(sessionsCart, sessionsProduct || visitors || 1),
      checkoutRate: rate(sessionsCheckout, sessionsCart || 1),
      orderRate: rate(sessionsOrder, sessionsCheckout || 1),
      delta: {
        uniqueVisitors: deltaPct(visitors, prevVisitors),
        ordersCreated: deltaPct(ordersCreated, prevOrders),
        addToCart: deltaPct(addToCart, prevCart),
      },
    };

    const funnelBase = Math.max(visitors, 1);
    const funnel = [
      { label: 'Visitas', value: visitors, rate: 100 },
      { label: 'Produto', value: sessionsProduct, rate: rate(sessionsProduct, funnelBase) },
      { label: 'Carrinho', value: sessionsCart, rate: rate(sessionsCart, funnelBase) },
      { label: 'Checkout', value: sessionsCheckout, rate: rate(sessionsCheckout, funnelBase) },
      { label: 'Pedido', value: sessionsOrder, rate: rate(sessionsOrder, funnelBase) },
    ];

    const byHour = Array.from({ length: 24 }, () => 0);
    const byWeekdayTotals = Array.from({ length: 7 }, () => 0);
    const dailyMap = {};
    current.forEach((event) => {
      const parts = brazilParts(event.ts);
      if (event.eventType === 'page_view') byHour[parts.hour] += 1;
      byWeekdayTotals[parts.weekday] += event.eventType === 'page_view' ? 1 : 0;
      if (event.eventType === 'page_view') {
        dailyMap[parts.date] = (dailyMap[parts.date] || 0) + 1;
      }
    });
    const weekdayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const byWeekday = weekdayLabels.map((label, i) => ({ label, total: byWeekdayTotals[i] }));
    const dailyVisits = Object.keys(dailyMap).sort().map((date) => ({ date, total: dailyMap[date] }));

    let peakHour = 0;
    let peakCount = 0;
    byHour.forEach((count, hour) => {
      if (count > peakCount) {
        peakCount = count;
        peakHour = hour;
      }
    });

    const productMap = {};
    current.forEach((event) => {
      if (!event.productName && !event.productId) return;
      const key = String(event.productId || event.productName);
      if (!productMap[key]) productMap[key] = { productId: event.productId, productName: event.productName || event.productId, views: 0, adds: 0 };
      if (event.eventType === 'product_view') productMap[key].views += 1;
      if (event.eventType === 'add_to_cart') productMap[key].adds += 1;
    });
    const topProducts = Object.values(productMap)
      .map((row) => ({ ...row, conversionRate: rate(row.adds, row.views || 1) }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 12);

    const pageMap = {};
    current.filter((e) => e.eventType === 'page_view').forEach((event) => {
      const page = event.page || 'index.html';
      pageMap[page] = (pageMap[page] || 0) + 1;
    });
    const topPages = Object.entries(pageMap)
      .map(([page, total]) => ({ page, total }))
      .sort((a, b) => b.total - a.total);

    const refMap = {};
    current.forEach((event) => {
      const source = referrerLabel(event.referrer);
      if (!refMap[source]) refMap[source] = new Set();
      if (event.sessionId) refMap[source].add(event.sessionId);
    });
    const referrers = Object.entries(refMap)
      .map(([source, set]) => ({ source, sessions: set.size }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 8);

    const locMap = {};
    current.forEach((event) => {
      if (!event.city && !event.region && !event.country) return;
      const key = [event.city, event.region, event.country].filter(Boolean).join('|');
      if (!locMap[key]) locMap[key] = { city: event.city, region: event.region, country: event.country, sessions: new Set() };
      if (event.sessionId) locMap[key].sessions.add(event.sessionId);
    });
    const locations = Object.values(locMap)
      .map((row) => ({ city: row.city, region: row.region, country: row.country, sessions: row.sessions.size }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 8);

    const insights = [];
    if (!current.length) {
      insights.push('Ainda não há visitas registradas neste período. Abra o site neste aparelho para começar a medir.');
    } else {
      if (summary.conversionRate < 10 && visitors > 3) insights.push('Poucos visitantes fecham pedido. Vale deixar o checkout mais curto e o WhatsApp mais visível.');
      if (summary.abandonCheckout >= 40 && beginCheckout > 2) insights.push('Muita gente inicia o checkout e não conclui. Confira se nome, WhatsApp e botão de finalizar estão claros.');
      if (topProducts[0]) insights.push(`O modelo mais visto foi ${topProducts[0].productName}.`);
      if (peakCount > 0) insights.push(`O horário com mais movimento foi ${String(peakHour).padStart(2, '0')}h.`);
      if (referrers[0] && referrers[0].source !== 'Direto') insights.push(`A principal origem de tráfego foi ${referrers[0].source}.`);
      if (!insights.length) insights.push('O funil está estável neste período. Continue acompanhando os picos de visita.');
    }

    return {
      periodLabel: range.label,
      compareLabel: 'Comparativo com o período anterior',
      generatedAt: new Date().toISOString(),
      summary,
      funnel,
      insights,
      byHour,
      dailyVisits,
      byWeekday,
      peakHourLabel: `${String(peakHour).padStart(2, '0')}h`,
      peakCount,
      topProducts,
      topPages,
      referrers,
      locations,
    };
  }

  return {
    init, getAll, save,
    getSettings, saveSettings,
    getProducts, saveProducts, saveProductsAsync, saveProductAsync, deleteProductAsync, setProductActiveAsync, publishCatalogAsync,
    getCategories, saveCategories,
    getClients, saveClients,
    getOrders, saveOrders, saveOrdersAsync,
    getFinance, saveFinance, addFinanceEntry, deleteFinanceEntry, getFinanceSummary,
    getCoupons, saveCoupons, saveCouponsAsync, findCouponByCode, calcCouponDiscount,
    getReviews, getFaq, getGallery,
    login, loginAsync, updatePassword, isAdminLogged, markAdminLogged, clearAdminLogged,
    generateId, generateOrderNumber,
    getCategoryName, formatCurrency, productDisplayPrice,
    normalizeStock, productTracksStock, productStockQty, getProductById,
    isProductOrderable, productStockLabel, applyLocalStockDecrement,
    getDashboardStats, getMonthlyRevenue,
    getFinishedOrdersByPeriod, getProductSalesBreakdown, getSalesPeriodStats,
    initCloud, pullFull, pullPublic, pushToCloud, saveAsync,
    isCloudEnabled, wasLoadedFromCache, setAdminPassword, getAdminPassword,
    startCloudPolling, stopCloudPolling, notifyUpdated,
    createPublicOrder, importSiteOrder, encodeInboxPayload, decodeInboxPayload, getAnalytics,
    getLoyaltyStatus, computeLoyaltyFromOrders, getApiUrl,
    sortProductsList, sortCategoriesList, applyProductSortOrders, applyCategorySortOrders,
    saveCatalogOrderAsync, nextProductSortOrder,
    probeCloud, reconnectCloud, apiCoolingDown, clearApiBreaker,
  };
})();

Storage.init();
