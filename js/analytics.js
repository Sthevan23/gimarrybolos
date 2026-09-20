/**
 * Gimarry — analytics próprio (visitas, produtos, funil)
 * Os eventos ficam neste aparelho e aparecem em Análises no painel.
 */
(function () {
  const SESSION_KEY = 'gimarry_analytics_sid_v1';
  const LANDING_KEY = 'gimarry_analytics_land_v1';
  const EVENTS_KEY = 'gimarry_analytics_events_v1';
  const GEO_KEY = 'gimarry_analytics_geo_v1';
  const MAX_EVENTS = 6000;

  function randomId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID().replace(/-/g, '');
    }
    return 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
  }

  function sessionId() {
    try {
      let sid = localStorage.getItem(SESSION_KEY);
      if (!sid || sid.length < 8) {
        sid = randomId();
        localStorage.setItem(SESSION_KEY, sid);
      }
      return sid;
    } catch {
      return randomId();
    }
  }

  function currentPage() {
    const path = (location.pathname || '').split('/').pop();
    return path || 'index.html';
  }

  function landingUrl() {
    try {
      let land = sessionStorage.getItem(LANDING_KEY);
      if (!land) {
        land = location.href;
        sessionStorage.setItem(LANDING_KEY, land);
      }
      return land;
    } catch {
      return location.href;
    }
  }

  function loadEvents() {
    try {
      const parsed = JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveEvents(list) {
    try {
      localStorage.setItem(EVENTS_KEY, JSON.stringify(list));
    } catch { /* quota */ }
  }

  function persist(event) {
    const list = loadEvents();
    list.push(event);
    const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 90;
    const pruned = list.filter((row) => Number(row.ts) >= cutoff);
    saveEvents(pruned.length > MAX_EVENTS ? pruned.slice(pruned.length - MAX_EVENTS) : pruned);
  }

  function geo() {
    try {
      const cached = sessionStorage.getItem(GEO_KEY);
      if (cached) return JSON.parse(cached);
    } catch { /* ignore */ }
    return {};
  }

  function fetchGeoOnce() {
    if (geo().city || geo().tried) return;
    try { sessionStorage.setItem(GEO_KEY, JSON.stringify({ tried: true })); } catch { /* ignore */ }
    fetch('https://ipapi.co/json/')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || data.error) return;
        const loc = {
          tried: true,
          city: data.city || '',
          region: data.region || '',
          country: data.country_name || '',
        };
        try { sessionStorage.setItem(GEO_KEY, JSON.stringify(loc)); } catch { /* ignore */ }
      })
      .catch(() => {});
  }

  function track(eventType, props) {
    props = props || {};
    const loc = geo();
    persist({
      ts: Date.now(),
      sessionId: sessionId(),
      eventType,
      page: props.page || currentPage(),
      productId: props.productId || null,
      productName: props.productName || null,
      categoryId: props.categoryId || null,
      meta: props.meta || null,
      referrer: document.referrer || '',
      landing: landingUrl(),
      city: loc.city || '',
      region: loc.region || '',
      country: loc.country || '',
    });
  }

  window.GimarryAnalytics = {
    track,
    pageView(page) {
      track('page_view', { page: page || currentPage() });
    },
    productView(product) {
      if (!product) return;
      track('product_view', {
        productId: product.id || product.productId,
        productName: product.name || product.productName,
        categoryId: product.category || product.categoryId || null,
      });
    },
    addToCart(item) {
      if (!item) return;
      track('add_to_cart', {
        productId: item.productId,
        productName: item.name,
        categoryId: item.categoryId || null,
        meta: { qty: item.qty || 1 },
      });
    },
    beginCheckout(meta) {
      track('begin_checkout', { meta: meta || {} });
    },
    orderCreated(meta) {
      track('order_created', { meta: meta || {} });
    },
  };

  window.AuroraAnalytics = window.GimarryAnalytics;

  fetchGeoOnce();
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    window.GimarryAnalytics.pageView();
  } else {
    document.addEventListener('DOMContentLoaded', () => window.GimarryAnalytics.pageView());
  }
})();
