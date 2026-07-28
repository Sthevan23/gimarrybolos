/**
 * storage.js — Gimarry Bolos
 * Fonte única: API Hostinger (api/data.php) — site e painel leem/gravam o mesmo catálogo.
 * Sem cupons e sem taxa de entrega.
 */
const Storage = (() => {
  const KEY = 'gimarry_bolos_data';
  const DATA_VERSION = 3;
  const DEFAULT_ADMIN_EMAIL = 'admin@sthevandev.com.br';
  const DEFAULT_ADMIN_PASSWORD = 'admin123';
  const PRODUCTION_API = 'https://gimarrybolos.com.br/api/data.php';
  const isLocalHost = /^(localhost|127\.0\.0\.1)$/i.test(location.hostname || '');

  const API = (() => {
    if (isLocalHost || location.protocol === 'file:') return PRODUCTION_API;
    const path = window.location.pathname || '';
    if (path.includes('/admin/')) return path.replace(/\/admin\/.*$/, '/api/data.php');
    if (path.endsWith('/')) return path + 'api/data.php';
    return path.replace(/\/[^/]*$/, '/api/data.php');
  })();

  let cloudEnabled = false;
  let lastRemoteJson = '';
  let pollTimer = null;
  let memoryData = null;
  let pushInFlight = false;
  let pendingPushData = null;

  function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  function buildSeedFromSiteData() {
    const S = typeof SITE_DATA !== 'undefined' ? SITE_DATA : null;
    if (!S || !S.settings) return null;

    const categories = (S.categories || [])
      .filter((c) => c.id !== 'todos')
      .map((c) => ({ id: 'cat-' + c.id, name: c.name, slug: c.id }));

    const products = (S.products || []).map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description || '',
      price: Number(p.price) || 0,
      fromPrice: true,
      categoryId: 'cat-' + p.category,
      category: p.category,
      image: p.image || '',
      featured: !!p.bestSeller,
      bestSeller: !!p.bestSeller,
      flavors: Array.isArray(p.flavors) ? p.flavors : [],
      active: true,
    }));

    return {
      version: DATA_VERSION,
      settings: {
        name: S.settings.brandName || 'Gimarry Bolos',
        brandSub: S.settings.brandSub || 'Bolos e Doces',
        tagline: S.settings.tagline || '',
        logo: '',
        banner: S.settings.heroImage || '',
        sobreImage: S.settings.aboutImage || '',
        whatsapp: S.settings.whatsapp || '',
        instagram: S.settings.instagram || '',
        instagramUser: S.settings.instagramUser || '',
        facebook: '',
        email: DEFAULT_ADMIN_EMAIL,
        address: S.settings.address || '',
        city: S.settings.city || '',
        hours: 'Seg a Sáb · consulte horário no Instagram',
        followers: '',
        posts: '',
        mapEmbed: '',
        heroBadge: '',
        heroStory: [],
        sobreText1: S.settings.sobreText1 || '',
        sobreText2: S.settings.sobreText2 || '',
        heroTitle1: S.settings.heroTitle1 || '',
        heroTitle2: S.settings.heroTitle2 || '',
        heroWords: S.settings.heroWords || [],
        categoriesLine: S.settings.categoriesLine || '',
        heroImage: S.settings.heroImage || '',
        contactImage: S.settings.contactImage || '',
        marquee: S.marquee || [],
      },
      auth: {
        email: DEFAULT_ADMIN_EMAIL,
        password: DEFAULT_ADMIN_PASSWORD,
      },
      categories,
      products,
      clients: [],
      orders: [],
      finance: [],
      reviews: [
        { id: 'r1', name: 'Juliana Ferreira', text: 'O bolo ficou lindo e o sabor impecável!', rating: 5, avatar: 'JF' },
        { id: 'r2', name: 'Roberto Almeida', text: 'Encomendei e ficou perfeito.', rating: 5, avatar: 'RA' },
        { id: 'r3', name: 'Camila Santos', text: 'Doces deliciosos e atendimento ótimo.', rating: 5, avatar: 'CS' },
      ],
      faq: [
        { id: 'f1', question: 'Como faço meu pedido?', answer: 'Escolha no cardápio, monte o pedido e finalize no site. O pedido segue para o WhatsApp.' },
        { id: 'f2', question: 'Tem retirada?', answer: 'Sim. Retirada no local em ' + (S.settings.address || 'Divinópolis, MG') + '.' },
        { id: 'f3', question: 'Quais formas de pagamento?', answer: 'PIX, cartão e dinheiro — confirmamos no atendimento.' },
      ],
      gallery: Array.isArray(S.gallery) ? S.gallery : [],
    };
  }

  function emptyStore() {
    return {
      version: DATA_VERSION,
      settings: {
        name: 'Gimarry Bolos',
        brandSub: 'Bolos e Doces',
        tagline: '',
        logo: '',
        banner: '',
        sobreImage: '',
        whatsapp: '',
        instagram: '',
        instagramUser: '',
        facebook: '',
        email: DEFAULT_ADMIN_EMAIL,
        address: '',
        city: '',
        hours: '',
        followers: '',
        posts: '',
        mapEmbed: '',
        heroBadge: '',
        heroStory: [],
        sobreText1: '',
        sobreText2: '',
      },
      auth: { email: DEFAULT_ADMIN_EMAIL, password: DEFAULT_ADMIN_PASSWORD },
      categories: [],
      products: [],
      clients: [],
      orders: [],
      finance: [],
      reviews: [],
      faq: [],
      gallery: [],
    };
  }

  function defaultData() {
    return buildSeedFromSiteData() || emptyStore();
  }

  function ensureDefaultAuth(data) {
    const email = normalizeEmail(data?.auth?.email);
    const legacyEmails = ['admin@gimarry.com.br', 'admin@flordeacucar.com.br', ''];
    if (!data.auth || legacyEmails.includes(email) || !data.auth.password) {
      data.auth = {
        email: DEFAULT_ADMIN_EMAIL,
        password: DEFAULT_ADMIN_PASSWORD,
      };
    }
    return data;
  }

  function setMemory(data) {
    memoryData = data && typeof data === 'object' ? data : emptyStore();
    if (!Array.isArray(memoryData.finance)) memoryData.finance = [];
    if (!Array.isArray(memoryData.products)) memoryData.products = [];
    if (!Array.isArray(memoryData.categories)) memoryData.categories = [];
    if (!Array.isArray(memoryData.orders)) memoryData.orders = [];
    if (!Array.isArray(memoryData.clients)) memoryData.clients = [];
    if (!Array.isArray(memoryData.gallery)) memoryData.gallery = [];
    ensureDefaultAuth(memoryData);
    return memoryData;
  }

  function persistLocal(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch { /* quota */ }
  }

  function init() {
    try { localStorage.removeItem('confeitaria_demo_financeiro'); } catch { /* ignore */ }

    if (!memoryData) {
      let stored = null;
      try {
        stored = JSON.parse(localStorage.getItem(KEY) || 'null');
      } catch {
        stored = null;
      }

      const seed = defaultData();
      if (!stored || (stored.version || 0) < DATA_VERSION) {
        const merged = {
          ...seed,
          version: DATA_VERSION,
          clients: stored?.clients?.length ? stored.clients : [],
          orders: stored?.orders?.length ? stored.orders : [],
          finance: stored?.finance?.length ? stored.finance : [],
          auth: ensureDefaultAuth(stored || seed).auth,
        };
        // Se o seed do site existir, produtos/categorias vêm dele
        if (seed.products?.length) {
          merged.products = seed.products;
          merged.categories = seed.categories;
          merged.settings = seed.settings;
          merged.gallery = seed.gallery;
          merged.reviews = seed.reviews;
          merged.faq = seed.faq;
        }
        setMemory(merged);
        persistLocal(merged);
      } else {
        setMemory(stored);
      }
    }
    return memoryData;
  }

  function getAll() {
    if (!memoryData) return init();
    return memoryData;
  }

  function save(data) {
    data.version = data.version || DATA_VERSION;
    setMemory(data);
    persistLocal(data);
    notifyUpdated();
    pushToCloud(data).catch(() => {});
  }

  async function saveAsync(data) {
    data.version = data.version || DATA_VERSION;
    setMemory(data);
    persistLocal(data);
    notifyUpdated();
    return pushToCloud(data);
  }

  function getAdminPassword() {
    return sessionStorage.getItem('admin_password') || '';
  }

  function setAdminPassword(password) {
    if (password) sessionStorage.setItem('admin_password', password);
    else sessionStorage.removeItem('admin_password');
  }

  function isCloudEnabled() {
    return cloudEnabled;
  }

  function notifyUpdated() {
    window.dispatchEvent(new CustomEvent('storage-updated'));
  }

  async function fetchWithTimeout(url, options = {}, ms = 15000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
      return await fetch(url, { ...options, signal: controller.signal, cache: 'no-store' });
    } finally {
      clearTimeout(timer);
    }
  }

  async function probeCloud() {
    try {
      const res = await fetchWithTimeout(API + '?ping=' + Date.now());
      const type = (res.headers.get('content-type') || '').toLowerCase();
      const body = await res.clone().json().catch(() => ({}));
      cloudEnabled = res.ok && type.includes('json') && body.ok !== false;
      return cloudEnabled;
    } catch {
      cloudEnabled = false;
      return false;
    }
  }

  async function pullPublic() {
    if (!(await probeCloud())) return false;
    try {
      const res = await fetchWithTimeout(API + '?t=' + Date.now());
      if (!res.ok) return false;
      const remote = await res.json();
      if (remote.empty || remote.error) return false;
      if (!remote.settings || !Array.isArray(remote.products)) return false;

      const current = getAll();
      const merged = {
        ...emptyStore(),
        version: remote.version || DATA_VERSION,
        settings: remote.settings,
        categories: remote.categories || [],
        products: remote.products || [],
        reviews: remote.reviews || [],
        faq: remote.faq || [],
        gallery: remote.gallery || [],
        clients: current.clients || [],
        orders: current.orders || [],
        finance: current.finance || [],
        auth: current.auth || emptyStore().auth,
      };
      setMemory(merged);
      persistLocal(merged);
      lastRemoteJson = JSON.stringify(merged);
      notifyUpdated();
      return true;
    } catch {
      return false;
    }
  }

  async function pullFull() {
    const password = getAdminPassword();
    if (!password || !(await probeCloud())) return false;
    try {
      const res = await fetchWithTimeout(API + '?full=1&t=' + Date.now(), {
        headers: { 'X-Admin-Password': password },
      });
      if (!res.ok) return false;
      const remote = await res.json();
      if (!remote || !remote.settings) return false;
      const json = JSON.stringify(remote);
      if (json === lastRemoteJson) return true;
      setMemory(remote);
      persistLocal(remote);
      lastRemoteJson = json;
      notifyUpdated();
      return true;
    } catch {
      return false;
    }
  }

  async function pushToCloud(data) {
    const password = getAdminPassword() || (data.auth && data.auth.password) || '';
    if (!password) return false;

    if (pushInFlight) {
      pendingPushData = data;
      return false;
    }

    pushInFlight = true;
    try {
      const payload = JSON.stringify({ data });
      const timeoutMs = payload.length > 400000 ? 90000 : 25000;
      const res = await fetchWithTimeout(API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': password,
        },
        body: payload,
      }, timeoutMs);

      let result = {};
      try { result = await res.json(); } catch { result = {}; }

      if (res.ok && result.ok !== false) {
        setMemory(data);
        persistLocal(data);
        lastRemoteJson = JSON.stringify(data);
        cloudEnabled = true;
        return true;
      }
      console.warn('[Gimarry] Falha ao salvar na nuvem', res.status, result);
      return false;
    } catch (err) {
      console.warn('[Gimarry] Erro de rede ao salvar', err);
      return false;
    } finally {
      pushInFlight = false;
      if (pendingPushData) {
        const next = pendingPushData;
        pendingPushData = null;
        await pushToCloud(next);
      }
    }
  }

  function loginLocal(email, password) {
    const data = getAll();
    ensureDefaultAuth(data);
    const auth = data.auth || {};
    const inputEmail = normalizeEmail(email);
    const storedEmail = normalizeEmail(auth.email);
    const passOk = String(auth.password || '') === String(password || '');

    if (inputEmail === DEFAULT_ADMIN_EMAIL && String(password || '') === DEFAULT_ADMIN_PASSWORD) {
      data.auth = { email: DEFAULT_ADMIN_EMAIL, password: DEFAULT_ADMIN_PASSWORD };
      persistLocal(data);
      setMemory(data);
      return true;
    }

    if (inputEmail === 'admin@gimarry.com.br' && passOk) {
      data.auth = {
        email: DEFAULT_ADMIN_EMAIL,
        password: String(auth.password || DEFAULT_ADMIN_PASSWORD),
      };
      persistLocal(data);
      setMemory(data);
      return true;
    }

    return storedEmail === inputEmail && passOk;
  }

  async function loginRemote(email, password) {
    if (!(await probeCloud())) {
      const ok = loginLocal(email, password);
      if (ok) setAdminPassword(password);
      return ok;
    }

    try {
      const res = await fetchWithTimeout(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      });
      const result = await res.json().catch(() => ({}));

      if (res.status === 404 || result.empty) {
        if (loginLocal(email, password)) {
          setAdminPassword(password);
          await pushToCloud(getAll());
          return true;
        }
        return false;
      }

      if (!res.ok || !result.ok) return false;

      setMemory(result.data);
      persistLocal(result.data);
      lastRemoteJson = JSON.stringify(result.data);
      setAdminPassword(password);
      cloudEnabled = true;
      return true;
    } catch {
      if (loginLocal(email, password)) {
        setAdminPassword(password);
        return true;
      }
      return false;
    }
  }

  function startCloudPolling(intervalMs = 5000) {
    stopCloudPolling();
    if (!getAdminPassword()) return;
    pollTimer = setInterval(() => {
      if (pushInFlight) return;
      pullFull();
    }, intervalMs);
  }

  function stopCloudPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  async function initCloud({ full = false } = {}) {
    init();
    const ok = full ? await pullFull() : await pullPublic();
    if (!ok && full && getAdminPassword()) {
      await pushToCloud(getAll());
    }
    return cloudEnabled;
  }

  function getSettings() { return getAll().settings; }
  function saveSettings(settings) {
    const data = getAll();
    data.settings = { ...data.settings, ...settings };
    save(data);
  }

  function getProducts() { return getAll().products; }
  function saveProducts(products) {
    const data = getAll();
    data.products = products;
    save(data);
  }
  async function saveProductsAsync(products) {
    const data = getAll();
    data.products = products;
    return saveAsync(data);
  }

  function getCategories() { return getAll().categories; }
  function saveCategories(categories) {
    const data = getAll();
    data.categories = categories;
    save(data);
  }

  function getClients() { return getAll().clients; }
  function saveClients(clients) {
    const data = getAll();
    data.clients = clients;
    save(data);
  }

  function getOrders() { return getAll().orders; }
  function saveOrders(orders) {
    const data = getAll();
    data.orders = orders;
    save(data);
  }

  function getFinance() { return getAll().finance || []; }
  function saveFinance(entries) {
    const data = getAll();
    data.finance = entries;
    save(data);
  }

  function getReviews() { return getAll().reviews || []; }
  function getFaq() { return getAll().faq || []; }
  function getGallery() { return getAll().gallery || []; }

  function login(email, password) { return loginLocal(email, password); }
  async function loginAsync(email, password) { return loginRemote(email, password); }

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
    const orders = getOrders();
    const year = new Date().getFullYear();
    let max = 0;
    orders.forEach((order) => {
      const match = String(order.number || '').match(/PED-(\d{4})-(\d+)/i);
      if (match && Number(match[1]) === year) max = Math.max(max, Number(match[2]) || 0);
    });
    return `PED-${year}-${String(max + 1).padStart(3, '0')}`;
  }

  function getCategoryName(categoryId) {
    const cat = getCategories().find((c) => c.id === categoryId);
    return cat ? cat.name : 'Outros';
  }

  function getCategorySlug(categoryId) {
    const cat = getCategories().find((c) => c.id === categoryId);
    if (!cat) return '';
    return cat.slug || String(cat.id || '').replace(/^cat-/, '');
  }

  function formatCurrency(value) {
    return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function getDashboardStats() {
    const orders = getOrders();
    const finished = orders.filter((o) => o.status === 'finalizado');
    const totalSales = finished.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const today = new Date().toISOString().split('T')[0];
    const todaySales = finished
      .filter((o) => String(o.date || '').startsWith(today))
      .reduce((sum, o) => sum + Number(o.total || 0), 0);
    const month = new Date().toISOString().slice(0, 7);
    const monthSales = finished
      .filter((o) => String(o.date || '').startsWith(month))
      .reduce((sum, o) => sum + Number(o.total || 0), 0);

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
      if (months[key]) months[key].value += Number(o.total || 0);
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
          map[key] = {
            productId: item.productId || null,
            name: item.name || 'Produto',
            qty: 0,
            revenue: 0,
          };
        }
        const qty = Number(item.qty) || 0;
        const price = Number(item.price) || 0;
        map[key].qty += qty;
        map[key].revenue += qty * price;
        map[key].name = item.name || map[key].name;
      });
    });

    return Object.values(map)
      .map((row) => ({
        ...row,
        avgPrice: row.qty > 0 ? row.revenue / row.qty : 0,
      }))
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

  async function createPublicOrder({ fullName, whatsapp, items, total, notes }) {
    const phone = String(whatsapp || '').replace(/\D/g, '');
    const name = String(fullName || '').trim();
    if (!name || phone.length < 10 || !items || !items.length) {
      return { ok: false, error: 'Dados incompletos' };
    }

    const data = getAll();
    let client = (data.clients || []).find((c) => String(c.phone || '').replace(/\D/g, '') === phone);
    if (!client) {
      client = { id: generateId('c'), name, email: '', phone, address: '' };
      data.clients = data.clients || [];
      data.clients.push(client);
    } else {
      client.name = name;
      client.phone = phone;
    }

    const order = {
      id: generateId('o'),
      number: generateOrderNumber(),
      clientId: client.id,
      clientName: name,
      clientWhatsapp: phone,
      items,
      total: Number(total) || items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 1), 0),
      status: 'novo',
      date: new Date().toISOString(),
      notes: notes || '',
      source: 'site',
    };

    data.orders = data.orders || [];
    data.orders.push(order);
    setMemory(data);
    persistLocal(data);

    try {
      await fetchWithTimeout(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_order', order, client }),
      });
    } catch { /* local já salvou */ }

    return { ok: true, order };
  }

  return {
    init, getAll, save, saveAsync,
    getSettings, saveSettings,
    getProducts, saveProducts, saveProductsAsync,
    getCategories, saveCategories,
    getClients, saveClients,
    getOrders, saveOrders,
    getFinance, saveFinance,
    getReviews, getFaq, getGallery,
    login, loginAsync, updatePassword,
    generateId, generateOrderNumber,
    getCategoryName, getCategorySlug, formatCurrency,
    getDashboardStats, getMonthlyRevenue,
    getFinishedOrdersByPeriod, getProductSalesBreakdown, getSalesPeriodStats,
    initCloud, pullFull, pullPublic, pushToCloud,
    isCloudEnabled, setAdminPassword, getAdminPassword,
    startCloudPolling, stopCloudPolling, notifyUpdated,
    createPublicOrder,
    getApiUrl: () => API,
  };
})();

Storage.init();
