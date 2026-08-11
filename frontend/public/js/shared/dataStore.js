/**
 * dataStore — cache em memória + API como fonte da verdade (sem localStorage).
 * Mantém API compatível com o Storage legado usado por site/admin.
 */
import { apiClient, setToken, clearToken } from './apiClient.js';
import { formatCurrency } from './formatters.js';

const emptyState = () => ({
  settings: {},
  categories: [],
  products: [],
  clients: [],
  orders: [],
  reviews: [],
  faq: [],
  gallery: [],
});

let state = emptyState();
let cloudEnabled = false;
let pollTimer = null;
let lastRemoteJson = '';

function notifyUpdated() {
  window.dispatchEvent(new CustomEvent('storage-updated'));
}

function snapshot() {
  return JSON.parse(JSON.stringify(state));
}

function applyRemote(remote) {
  state = {
    settings: remote.settings || state.settings || {},
    categories: remote.categories || [],
    products: remote.products || [],
    clients: remote.clients || [],
    orders: remote.orders || [],
    reviews: remote.reviews || [],
    faq: remote.faq || [],
    gallery: remote.gallery || [],
  };
  lastRemoteJson = JSON.stringify(state);
  notifyUpdated();
}

async function loadFallbackCatalog() {
  try {
    const res = await fetch(new URL('./fallback-catalog.json', import.meta.url), { cache: 'no-store' });
    if (!res.ok) return false;
    const remote = await res.json();
    applyRemote({
      settings: remote.settings || {},
      categories: remote.categories || [],
      products: remote.products || [],
      reviews: remote.reviews || [],
      faq: remote.faq || [],
      gallery: remote.gallery || [],
      clients: [],
      orders: [],
    });
    cloudEnabled = false;
    return true;
  } catch {
    return false;
  }
}

async function pullPublic() {
  try {
    const remote = await apiClient.getCatalog();
    applyRemote({ ...state, ...remote, clients: [], orders: [] });
    cloudEnabled = true;
    return true;
  } catch {
    return loadFallbackCatalog();
  }
}

async function pullFull() {
  try {
    const remote = await apiClient.pullAdminData();
    if (!remote || !remote.settings) return false;
    const json = JSON.stringify(remote);
    if (json === lastRemoteJson) return true;
    applyRemote(remote);
    cloudEnabled = true;
    return true;
  } catch {
    return loadFallbackCatalog();
  }
}

async function pushToCloud(data) {
  try {
    await apiClient.pushAdminData(data || snapshot());
    lastRemoteJson = JSON.stringify(data || state);
    cloudEnabled = true;
    return true;
  } catch {
    return false;
  }
}

async function initCloud({ full = false } = {}) {
  return full ? pullFull() : pullPublic();
}

function getAll() {
  return snapshot();
}

function save(data) {
  state = { ...emptyState(), ...data };
  pushToCloud(snapshot());
  notifyUpdated();
}

function getSettings() {
  return { ...state.settings };
}
function saveSettings(settings) {
  state.settings = { ...state.settings, ...settings };
  apiClient.saveSettings(state.settings).catch(() => {});
  notifyUpdated();
}

function getProducts() {
  return [...state.products];
}
async function saveProducts(products) {
  state.products = products;
  await pushToCloud(snapshot());
  notifyUpdated();
}

function getCategories() {
  return [...state.categories];
}
async function saveCategories(categories) {
  state.categories = categories;
  await pushToCloud(snapshot());
  notifyUpdated();
}

function getClients() {
  return [...state.clients];
}
async function saveClients(clients) {
  state.clients = clients;
  await pushToCloud(snapshot());
  notifyUpdated();
}

function getOrders() {
  return [...state.orders];
}
async function saveOrders(orders) {
  state.orders = orders;
  await pushToCloud(snapshot());
  notifyUpdated();
}

function getReviews() {
  return [...state.reviews];
}
function getFaq() {
  return [...state.faq];
}
function getGallery() {
  return [...state.gallery];
}

async function loginAsync(email, password) {
  try {
    const result = await apiClient.login(email, password);
    if (result.token) setToken(result.token);
    await pullFull();
    cloudEnabled = true;
    return true;
  } catch {
    return false;
  }
}

function login(email, password) {
  return loginAsync(email, password);
}

async function updatePassword(currentPassword, newPassword) {
  try {
    await apiClient.changePassword(currentPassword, newPassword);
    return true;
  } catch {
    return false;
  }
}

function generateId(prefix) {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function generateOrderNumber() {
  const year = new Date().getFullYear();
  const num = String(state.orders.length + 1).padStart(3, '0');
  return `PED-${year}-${num}`;
}

function getCategoryName(categoryId) {
  const cat = state.categories.find((c) => c.id === categoryId);
  return cat ? cat.name : 'Outros';
}

function getDashboardStats() {
  const orders = state.orders;
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
    totalClients: state.clients.length,
    totalProducts: state.products.length,
    todaySales,
    monthSales,
  };
}

function getMonthlyRevenue() {
  const orders = state.orders.filter((o) => o.status === 'finalizado');
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
  const finished = state.orders.filter((o) => o.status === 'finalizado');
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

async function createPublicOrder({ fullName, whatsapp, items, total, notes }) {
  const phone = String(whatsapp || '').replace(/\D/g, '');
  const name = String(fullName || '').trim();
  if (!name || phone.length < 10 || !items || !items.length) {
    return { ok: false, error: 'Dados incompletos' };
  }
  try {
    const result = await apiClient.createOrder({
      fullName: name,
      whatsapp: phone,
      items,
      total,
      notes,
      source: 'site',
    });
    cloudEnabled = true;
    if (result.order) {
      state.orders = [...state.orders, result.order];
    }
    return { ok: true, order: result.order };
  } catch (e) {
    // Preview local sem API: grava só em memória
    const order = {
      id: generateId('o'),
      number: generateOrderNumber(),
      clientId: generateId('c'),
      clientName: name,
      clientWhatsapp: phone,
      items,
      total: Number(total) || items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 1), 0),
      status: 'novo',
      date: new Date().toISOString(),
      notes: notes || '',
      source: 'site-local',
    };
    state.orders = [...state.orders, order];
    notifyUpdated();
    return { ok: true, order, offline: true };
  }
}

function startCloudPolling() {
  // OFF — Hostinger LVE: polling derruba Máximo de processos (120)
  stopCloudPolling();
}

function stopCloudPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function setAdminPassword() {
  /* token via apiClient */
}
function getAdminPassword() {
  return '';
}

function isCloudEnabled() {
  return cloudEnabled;
}

function init() {
  /* no-op: dados vêm da API */
}

async function logoutRemote() {
  try {
    await apiClient.logout();
  } catch {
    /* ignore */
  }
  clearToken();
  state = emptyState();
}

export const Storage = {
  init,
  getAll,
  save,
  getSettings,
  saveSettings,
  getProducts,
  saveProducts,
  getCategories,
  saveCategories,
  getClients,
  saveClients,
  getOrders,
  saveOrders,
  getReviews,
  getFaq,
  getGallery,
  login,
  loginAsync,
  updatePassword,
  generateId,
  generateOrderNumber,
  getCategoryName,
  formatCurrency,
  getDashboardStats,
  getMonthlyRevenue,
  getFinishedOrdersByPeriod,
  getProductSalesBreakdown,
  getSalesPeriodStats,
  initCloud,
  pullFull,
  pullPublic,
  pushToCloud,
  isCloudEnabled,
  setAdminPassword,
  getAdminPassword,
  startCloudPolling,
  stopCloudPolling,
  notifyUpdated,
  createPublicOrder,
  logoutRemote,
};

export default Storage;

if (typeof window !== 'undefined') {
  window.Storage = Storage;
}
