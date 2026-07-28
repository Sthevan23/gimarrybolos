/**
 * storage.js — Demo Flor de Açúcar + painel financeiro
 * LocalStorage + sincronização opcional (api/data.php)
 */
const Storage = (() => {
  const KEY = 'confeitaria_demo_financeiro';
  const DATA_VERSION = 2;
  const DEFAULT_ADMIN_EMAIL = 'admin@sthevandev.com.br';
  const DEFAULT_ADMIN_PASSWORD = 'admin123';
  const IMG_VER = 'v10';

  const API = (() => {
    const path = window.location.pathname || '';
    if (path.includes('/admin/')) {
      return path.replace(/\/admin\/.*$/, '/api/data.php');
    }
    if (path.endsWith('/')) {
      return path + 'api/data.php';
    }
    return path.replace(/\/[^/]*$/, '/api/data.php');
  })();

  let cloudEnabled = false;
  let lastRemoteJson = '';
  let pollTimer = null;

  const img = (file) => `imagens/${file}?${IMG_VER}`;

  const IMG = {
    hero: img('hero.jpg'),
    loja: img('loja.jpg'),
    bolo1: img('bolo1.jpg'),
    bolo2: img('bolo2.jpg'),
    bolo3: img('bolo3.jpg'),
    bolo4: img('bolo4.jpg'),
    bolo5: img('bolo5.jpg'),
    bolo6: img('bolo6.jpg'),
    bolo7: img('bolo7.jpg'),
    bolo8: img('bolo8.jpg'),
    pronto1: img('pronto1.jpg'),
    pronto2: img('pronto2.jpg'),
    pronto3: img('pronto3.jpg'),
    pronto4: img('pronto4.jpg'),
    bento1: img('bento1.jpg'),
    bento2: img('bento2.jpg'),
    bento3: img('bento3.jpg'),
    bento4: img('bento4.jpg'),
    doces1: img('doces1.jpg'),
    doces2: img('doces2.jpg'),
    destaque1: img('destaque1.jpg'),
    destaque2: img('destaque2.jpg'),
    destaque3: img('destaque3.jpg'),
    destaque4: img('destaque4.jpg'),
    galeria1: img('galeria1.jpg'),
    galeria2: img('galeria2.jpg'),
    galeria3: img('galeria3.jpg'),
    galeria4: img('galeria4.jpg'),
    galeria5: img('galeria5.jpg'),
    galeria6: img('galeria6.jpg'),
    galeria7: img('galeria7.jpg'),
    galeria8: img('galeria8.jpg'),
    galeria9: img('galeria9.jpg'),
    galeria10: img('galeria10.jpg'),
    galeria11: img('galeria11.jpg'),
    galeria12: img('galeria12.jpg')
  };

  const defaultData = {
    settings: {
      name: 'Flor de Açúcar',
      tagline: 'Encomenda ou pronta entrega — escolha o bolo e feche pelo WhatsApp em minutos.',
      logo: '',
      banner: IMG.hero,
      sobreImage: IMG.loja,
      whatsapp: '5531999999999',
      instagram: 'https://www.instagram.com/',
      instagramUser: '@flordeacucar',
      facebook: '',
      email: 'contato@flordeacucar.com.br',
      address: 'Rua das Flores, 120 — Centro',
      hours: 'Seg a Sáb · 9h às 19h · Dom · 9h às 13h',
      followers: '2,4 mil',
      posts: '186',
      mapEmbed: 'https://www.google.com/maps?q=Belo+Horizonte,+MG&output=embed',
      heroBadge: 'Pronta entrega hoje · Retire em 40 min',
      heroStory: [
        'Cada bolo é feito sob encomenda: massa leve, recheio generoso e acabamento à mão.',
        'Você escolhe o modelo, monta as opções e finaliza pelo WhatsApp — simples e rápido.',
        'Ideal para aniversários, presentes, cafés e celebrações do dia a dia.'
      ],
      sobreText1: 'A <strong>Flor de Açúcar</strong> faz bolos artesanais sob encomenda e com opções de pronta entrega. Do bento cake ao bolo de festa, tudo pensado para impressionar.',
      sobreText2: 'Atendimento pelo WhatsApp, retirada no balcão e combinações de massa, recheio e tamanho do seu jeito.'
    },
    auth: {
      email: DEFAULT_ADMIN_EMAIL,
      password: DEFAULT_ADMIN_PASSWORD
    },
    categories: [
      { id: 'cat1', name: 'Personalizados', slug: 'bolos' },
      { id: 'cat2', name: 'Clássicos', slug: 'classicos' },
      { id: 'cat3', name: 'Pronta Entrega', slug: 'pronta-entrega' },
      { id: 'cat4', name: 'Bento Cake', slug: 'bento-cake' },
      { id: 'cat5', name: 'Destaques', slug: 'bolos-destaques' },
      { id: 'cat6', name: 'Kits', slug: 'kits-bento' }
    ],
    products: [
      { id: 'p1', name: 'Bolo de Casamento', description: 'Elegante para casamentos, com acabamento limpo e flores.', price: 270, categoryId: 'cat1', image: IMG.bolo1, featured: true, fromPrice: true },
      { id: 'p2', name: 'Bolo de Chocolate', description: 'Camadas de chocolate com cobertura cremosa e visual marcante.', price: 95, categoryId: 'cat1', image: IMG.bolo2, featured: true, fromPrice: true },
      { id: 'p3', name: 'Bolo de Aniversário', description: 'Festivo e personalizado para comemorações especiais.', price: 95, categoryId: 'cat1', image: IMG.bolo3, featured: true, fromPrice: true },
      { id: 'p4', name: 'Bolo com Frutas', description: 'Decoração com frutas frescas e creme suave.', price: 140, categoryId: 'cat1', image: IMG.bolo4, featured: false, fromPrice: true },
      { id: 'p5', name: 'Bolo Floral', description: 'Acabamento delicado com flores e tons suaves.', price: 180, categoryId: 'cat1', image: IMG.bolo5, featured: false, fromPrice: true },
      { id: 'p6', name: 'Bolo Naked Cake', description: 'Estilo rústico com camadas aparentes e frutas.', price: 160, categoryId: 'cat1', image: IMG.bolo6, featured: true, fromPrice: true },
      { id: 'p19', name: 'Bolo Red Velvet', description: 'Clássico red velvet com cream cheese.', price: 150, categoryId: 'cat1', image: IMG.bolo7, featured: false, fromPrice: true },
      { id: 'p20', name: 'Bolo Decorado Premium', description: 'Modelo especial para festas e ensaios.', price: 220, categoryId: 'cat1', image: IMG.bolo8, featured: false, fromPrice: true },
      { id: 'p7', name: 'Bolo do Dia — Chocolate', description: 'Pronta entrega · retire hoje com 40 min de antecedência.', price: 65, categoryId: 'cat3', image: IMG.pronto1, featured: false },
      { id: 'p8', name: 'Bolo do Dia — Baunilha', description: 'Pronta entrega · cobertura clara e finalização suave.', price: 75, categoryId: 'cat3', image: IMG.pronto2, featured: false },
      { id: 'p9', name: 'Bolo do Dia — Frutas', description: 'Pronta entrega · frutas e chantilly.', price: 95, categoryId: 'cat3', image: IMG.pronto3, featured: false },
      { id: 'p21', name: 'Bolo do Dia — Brigadeiro', description: 'Pronta entrega · acabamento em chocolate.', price: 70, categoryId: 'cat3', image: IMG.pronto4, featured: false },
      { id: 'p10', name: 'Bento Cake Frase', description: 'Mini bolo com frase personalizada no topo — presente perfeito.', price: 40, categoryId: 'cat4', image: IMG.bento1, featured: false },
      { id: 'p11', name: 'Bento Cake Presente', description: 'Ideal para surpresas e datas especiais.', price: 40, categoryId: 'cat4', image: IMG.bento2, featured: false },
      { id: 'p22', name: 'Bento Cake Fofo', description: 'Mini bolo delicado para presentear.', price: 40, categoryId: 'cat4', image: IMG.bento3, featured: false },
      { id: 'p23', name: 'Bento Cake Especial', description: 'Versão especial com decoração artesanal.', price: 45, categoryId: 'cat4', image: IMG.bento4, featured: false },
      { id: 'p12', name: 'Bolo Colorido', description: 'Bolo festivo com camadas coloridas e cobertura cremosa.', price: 120, categoryId: 'cat2', image: IMG.doces1, featured: false, fromPrice: true },
      { id: 'p13', name: 'Bolo de Frutas Vermelhas', description: 'Elegante com morangos, framboesas e blueberries.', price: 160, categoryId: 'cat2', image: IMG.doces2, featured: false, fromPrice: true },
      { id: 'p14', name: 'Bolo Destaque Jardim', description: 'Modelo premium com visual sofisticado.', price: 200, categoryId: 'cat5', image: IMG.destaque1, featured: false, fromPrice: true },
      { id: 'p15', name: 'Bolo Destaque Celebração', description: 'Para mesas de festa e momentos especiais.', price: 190, categoryId: 'cat5', image: IMG.destaque2, featured: false, fromPrice: true },
      { id: 'p24', name: 'Bolo Destaque Luxo', description: 'Acabamento elegante e presença marcante.', price: 240, categoryId: 'cat5', image: IMG.destaque3, featured: false, fromPrice: true },
      { id: 'p25', name: 'Bolo Destaque Festa', description: 'Ideal para aniversários e comemorações.', price: 180, categoryId: 'cat5', image: IMG.destaque4, featured: false, fromPrice: true },
      { id: 'p16', name: 'Bento Cake na Marmita', description: 'Bento individual · aprox. 300g · 2 a 3 fatias.', price: 40, categoryId: 'cat6', image: IMG.bento1, featured: false },
      { id: 'p17', name: 'Kit 2 Bento Cakes', description: 'Dois mini bolos para presentear ou compartilhar.', price: 75, categoryId: 'cat6', image: IMG.bento2, featured: false },
      { id: 'p18', name: 'Kit Bento Especial', description: 'Bento cake especial com decoração artesanal.', price: 65, categoryId: 'cat6', image: IMG.bento3, featured: false }
    ],
    clients: [
      { id: 'c1', name: 'Ana Paula Silva', email: 'ana@email.com', phone: '31987654321', address: 'Centro' },
      { id: 'c2', name: 'Carlos Mendes', email: 'carlos@email.com', phone: '31976543210', address: 'Savassi' },
      { id: 'c3', name: 'Mariana Costa', email: 'mariana@email.com', phone: '31965432109', address: 'Funcionários' },
      { id: 'c4', name: 'Pedro Alves', email: 'pedro@email.com', phone: '31954321098', address: 'Lourdes' },
      { id: 'c5', name: 'Fernanda Rocha', email: 'fernanda@email.com', phone: '31943210987', address: 'Pampulha' }
    ],
    orders: [
      { id: 'o1', number: 'PED-2026-001', clientId: 'c1', clientName: 'Ana Paula Silva', clientWhatsapp: '31987654321', items: [{ productId: 'p2', name: 'Bolo de Chocolate', qty: 1, price: 95 }], total: 95, status: 'finalizado', date: '2026-02-12T14:30:00', notes: '', source: 'demo' },
      { id: 'o2', number: 'PED-2026-002', clientId: 'c2', clientName: 'Carlos Mendes', clientWhatsapp: '31976543210', items: [{ productId: 'p10', name: 'Bento Cake Frase', qty: 2, price: 40 }], total: 80, status: 'finalizado', date: '2026-02-20T11:00:00', notes: '', source: 'demo' },
      { id: 'o3', number: 'PED-2026-003', clientId: 'c3', clientName: 'Mariana Costa', clientWhatsapp: '31965432109', items: [{ productId: 'p7', name: 'Bolo do Dia — Chocolate', qty: 1, price: 65 }, { productId: 'p16', name: 'Bento Cake na Marmita', qty: 1, price: 40 }], total: 105, status: 'finalizado', date: '2026-03-05T16:00:00', notes: '', source: 'demo' },
      { id: 'o4', number: 'PED-2026-004', clientId: 'c4', clientName: 'Pedro Alves', clientWhatsapp: '31954321098', items: [{ productId: 'p1', name: 'Bolo de Casamento', qty: 1, price: 270 }], total: 270, status: 'finalizado', date: '2026-03-18T10:00:00', notes: '', source: 'demo' },
      { id: 'o5', number: 'PED-2026-005', clientId: 'c5', clientName: 'Fernanda Rocha', clientWhatsapp: '31943210987', items: [{ productId: 'p3', name: 'Bolo de Aniversário', qty: 1, price: 95 }], total: 95, status: 'finalizado', date: '2026-04-08T15:00:00', notes: '', source: 'demo' },
      { id: 'o6', number: 'PED-2026-006', clientId: 'c1', clientName: 'Ana Paula Silva', clientWhatsapp: '31987654321', items: [{ productId: 'p14', name: 'Bolo Destaque Jardim', qty: 1, price: 200 }], total: 200, status: 'finalizado', date: '2026-04-22T12:00:00', notes: '', source: 'demo' },
      { id: 'o7', number: 'PED-2026-007', clientId: 'c2', clientName: 'Carlos Mendes', clientWhatsapp: '31976543210', items: [{ productId: 'p11', name: 'Bento Cake Presente', qty: 3, price: 40 }], total: 120, status: 'finalizado', date: '2026-05-03T09:30:00', notes: '', source: 'demo' },
      { id: 'o8', number: 'PED-2026-008', clientId: 'c3', clientName: 'Mariana Costa', clientWhatsapp: '31965432109', items: [{ productId: 'p6', name: 'Bolo Naked Cake', qty: 1, price: 160 }], total: 160, status: 'finalizado', date: '2026-05-15T14:00:00', notes: '', source: 'demo' },
      { id: 'o9', number: 'PED-2026-009', clientId: 'c4', clientName: 'Pedro Alves', clientWhatsapp: '31954321098', items: [{ productId: 'p8', name: 'Bolo do Dia — Baunilha', qty: 2, price: 75 }], total: 150, status: 'finalizado', date: '2026-05-28T17:00:00', notes: '', source: 'demo' },
      { id: 'o10', number: 'PED-2026-010', clientId: 'c5', clientName: 'Fernanda Rocha', clientWhatsapp: '31943210987', items: [{ productId: 'p5', name: 'Bolo Floral', qty: 1, price: 180 }], total: 180, status: 'finalizado', date: '2026-06-06T11:00:00', notes: '', source: 'demo' },
      { id: 'o11', number: 'PED-2026-011', clientId: 'c1', clientName: 'Ana Paula Silva', clientWhatsapp: '31987654321', items: [{ productId: 'p17', name: 'Kit 2 Bento Cakes', qty: 1, price: 75 }, { productId: 'p10', name: 'Bento Cake Frase', qty: 1, price: 40 }], total: 115, status: 'finalizado', date: '2026-06-14T13:00:00', notes: '', source: 'demo' },
      { id: 'o12', number: 'PED-2026-012', clientId: 'c2', clientName: 'Carlos Mendes', clientWhatsapp: '31976543210', items: [{ productId: 'p20', name: 'Bolo Decorado Premium', qty: 1, price: 220 }], total: 220, status: 'finalizado', date: '2026-06-25T16:30:00', notes: '', source: 'demo' },
      { id: 'o13', number: 'PED-2026-013', clientId: 'c3', clientName: 'Mariana Costa', clientWhatsapp: '31965432109', items: [{ productId: 'p7', name: 'Bolo do Dia — Chocolate', qty: 1, price: 65 }], total: 65, status: 'finalizado', date: '2026-07-02T10:00:00', notes: '', source: 'demo' },
      { id: 'o14', number: 'PED-2026-014', clientId: 'c4', clientName: 'Pedro Alves', clientWhatsapp: '31954321098', items: [{ productId: 'p2', name: 'Bolo de Chocolate', qty: 1, price: 95 }, { productId: 'p22', name: 'Bento Cake Fofo', qty: 2, price: 40 }], total: 175, status: 'finalizado', date: '2026-07-10T15:00:00', notes: '', source: 'demo' },
      { id: 'o15', number: 'PED-2026-015', clientId: 'c5', clientName: 'Fernanda Rocha', clientWhatsapp: '31943210987', items: [{ productId: 'p15', name: 'Bolo Destaque Celebração', qty: 1, price: 190 }], total: 190, status: 'finalizado', date: '2026-07-15T12:00:00', notes: '', source: 'demo' },
      { id: 'o16', number: 'PED-2026-016', clientId: 'c1', clientName: 'Ana Paula Silva', clientWhatsapp: '31987654321', items: [{ productId: 'p9', name: 'Bolo do Dia — Frutas', qty: 1, price: 95 }], total: 95, status: 'finalizado', date: '2026-07-18T09:00:00', notes: '', source: 'demo' },
      { id: 'o17', number: 'PED-2026-017', clientId: 'c2', clientName: 'Carlos Mendes', clientWhatsapp: '31976543210', items: [{ productId: 'p10', name: 'Bento Cake Frase', qty: 2, price: 40 }], total: 80, status: 'preparo', date: '2026-07-16T10:15:00', notes: '', source: 'demo' },
      { id: 'o18', number: 'PED-2026-018', clientId: 'c3', clientName: 'Mariana Costa', clientWhatsapp: '31965432109', items: [{ productId: 'p7', name: 'Bolo do Dia — Chocolate', qty: 1, price: 65 }], total: 65, status: 'entrega', date: '2026-07-17T16:00:00', notes: '', source: 'demo' },
      { id: 'o19', number: 'PED-2026-019', clientId: 'c1', clientName: 'Ana Paula Silva', clientWhatsapp: '31987654321', items: [{ productId: 'p3', name: 'Bolo de Aniversário', qty: 1, price: 95 }], total: 95, status: 'novo', date: '2026-07-18T08:30:00', notes: '', source: 'demo' }
    ],
    reviews: [
      { id: 'r1', name: 'Juliana Ferreira', text: 'O bolo ficou lindo e o sabor impecável. Pedi pelo WhatsApp e resolvi em minutos!', rating: 5, avatar: 'JF' },
      { id: 'r2', name: 'Roberto Almeida', text: 'Encomendei um temático para minha filha. Entrega no horário e acabamento perfeito.', rating: 5, avatar: 'RA' },
      { id: 'r3', name: 'Camila Santos', text: 'O bento cake com frase foi o presente mais fofo. Já virei cliente fiel.', rating: 5, avatar: 'CS' },
      { id: 'r4', name: 'Fernando Lima', text: 'Precisei no mesmo dia: pronta entrega deliciosa e retirada rapidinha.', rating: 5, avatar: 'FL' }
    ],
    faq: [
      { id: 'f1', question: 'Como faço meu pedido?', answer: 'Escolha o bolo no cardápio, monte massa, recheio e tamanho e envie pelo WhatsApp. Confirmamos disponibilidade e prazo na hora.' },
      { id: 'f2', question: 'Vocês têm pronta entrega?', answer: 'Sim! Temos bolos do dia. Para montar e retirar no mesmo dia, peça com no mínimo 40 minutos de antecedência.' },
      { id: 'f3', question: 'Fazem bolos personalizados?', answer: 'Sim. Criamos bolos temáticos e sob encomenda. Para temas especiais, peça com antecedência.' },
      { id: 'f4', question: 'Quais formas de pagamento?', answer: 'PIX, cartão e dinheiro. Confirmamos a forma de pagamento no WhatsApp ao fechar o pedido.' },
      { id: 'f5', question: 'Qual o prazo e a retirada?', answer: 'Pronta entrega: a partir de 40 min. Encomendas: combinamos o prazo no atendimento. Retirada na Rua das Flores, 120 — Centro.' }
    ],
    gallery: [
      IMG.bolo1, IMG.bolo2, IMG.bolo3, IMG.bolo4, IMG.bolo5, IMG.bolo6, IMG.bolo7, IMG.bolo8,
      IMG.pronto1, IMG.pronto2, IMG.pronto3, IMG.pronto4,
      IMG.bento1, IMG.bento2, IMG.bento3, IMG.bento4,
      IMG.destaque1, IMG.destaque2, IMG.destaque3, IMG.destaque4,
      IMG.galeria1, IMG.galeria2, IMG.galeria3, IMG.galeria4,
      IMG.galeria5, IMG.galeria6, IMG.galeria7, IMG.galeria8,
      IMG.galeria9, IMG.galeria10, IMG.galeria11, IMG.galeria12
    ]
  };

  function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  function ensureDefaultAuth(data) {
    const email = normalizeEmail(data?.auth?.email);
    const legacyEmails = ['admin@gimarry.com.br', 'admin@flordeacucar.com.br', ''];
    if (!data.auth || legacyEmails.includes(email) || !data.auth.password) {
      data.auth = {
        email: DEFAULT_ADMIN_EMAIL,
        password: DEFAULT_ADMIN_PASSWORD
      };
    }
    return data;
  }

  function init() {
    if (!localStorage.getItem(KEY)) {
      localStorage.setItem(KEY, JSON.stringify({ ...defaultData, version: DATA_VERSION }));
      return;
    }
    const data = JSON.parse(localStorage.getItem(KEY));
    if ((data.version || 0) < DATA_VERSION) {
      data.settings = { ...defaultData.settings, ...(data.settings || {}) };
      data.products = defaultData.products;
      data.categories = defaultData.categories;
      data.gallery = defaultData.gallery;
      data.reviews = defaultData.reviews;
      data.faq = defaultData.faq;
      if (!data.orders || !data.orders.length) data.orders = defaultData.orders;
      if (!data.clients || !data.clients.length) data.clients = defaultData.clients;
      ensureDefaultAuth(data);
      data.version = DATA_VERSION;
      localStorage.setItem(KEY, JSON.stringify(data));
    } else {
      const before = JSON.stringify(data.auth || null);
      ensureDefaultAuth(data);
      if (JSON.stringify(data.auth || null) !== before) {
        localStorage.setItem(KEY, JSON.stringify(data));
      }
    }
  }
  function getAll() {
    init();
    return JSON.parse(localStorage.getItem(KEY));
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
    pushToCloud(data);
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

  async function fetchWithTimeout(url, options = {}, ms = 2500) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
      return await fetch(url, { ...options, signal: controller.signal, cache: 'no-store' });
    } finally {
      clearTimeout(timer);
    }
  }

  async function probeCloud() {
    if (location.protocol === 'file:') {
      cloudEnabled = false;
      return false;
    }
    try {
      const res = await fetchWithTimeout(API + '?ping=' + Date.now());
      const type = (res.headers.get('content-type') || '').toLowerCase();
      cloudEnabled = res.ok && type.includes('json');
      return cloudEnabled;
    } catch (e) {
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
      if (remote.empty) return false;

      const local = getAll();
      const merged = {
        ...local,
        version: remote.version || local.version,
        settings: remote.settings || local.settings,
        categories: remote.categories || local.categories,
        products: remote.products || local.products,
        reviews: remote.reviews || local.reviews,
        faq: remote.faq || local.faq,
        gallery: remote.gallery || local.gallery
      };
      localStorage.setItem(KEY, JSON.stringify(merged));
      lastRemoteJson = JSON.stringify(merged);
      return true;
    } catch (e) {
      return false;
    }
  }

  async function pullFull() {
    const password = getAdminPassword();
    if (!password || !(await probeCloud())) return false;
    try {
      const res = await fetchWithTimeout(API + '?full=1&t=' + Date.now(), {
        headers: { 'X-Admin-Password': password }
      });
      if (!res.ok) return false;
      const remote = await res.json();
      if (!remote || !remote.settings) return false;
      const json = JSON.stringify(remote);
      if (json === lastRemoteJson) return true;
      localStorage.setItem(KEY, json);
      lastRemoteJson = json;
      notifyUpdated();
      return true;
    } catch (e) {
      return false;
    }
  }

  async function pushToCloud(data) {
    if (location.protocol === 'file:') return false;
    const password = getAdminPassword() || (data.auth && data.auth.password) || '';
    if (!password) return false;
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': password
        },
        body: JSON.stringify({ data })
      });
      if (res.ok) {
        lastRemoteJson = JSON.stringify(data);
        cloudEnabled = true;
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  async function loginRemote(email, password) {
    if (!(await probeCloud())) {
      // Offline / local: usa senha local
      const ok = loginLocal(email, password);
      if (ok) setAdminPassword(password);
      return ok;
    }

    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password })
      });
      const result = await res.json();

      if (res.status === 404) {
        // Servidor ainda sem dados: tenta local e faz upload inicial
        if (loginLocal(email, password)) {
          setAdminPassword(password);
          await pushToCloud(getAll());
          return true;
        }
        return false;
      }

      if (!res.ok || !result.ok) return false;

      localStorage.setItem(KEY, JSON.stringify(result.data));
      lastRemoteJson = JSON.stringify(result.data);
      setAdminPassword(password);
      cloudEnabled = true;
      return true;
    } catch (e) {
      if (loginLocal(email, password)) {
        setAdminPassword(password);
        return true;
      }
      return false;
    }
  }

  function loginLocal(email, password) {
    const data = getAll();
    ensureDefaultAuth(data);
    const auth = data.auth || {};
    const inputEmail = normalizeEmail(email);
    const storedEmail = normalizeEmail(auth.email);
    const passOk = String(auth.password || '') === String(password || '');

    // Credenciais oficiais do handoff
    if (
      inputEmail === DEFAULT_ADMIN_EMAIL &&
      String(password || '') === DEFAULT_ADMIN_PASSWORD
    ) {
      data.auth = {
        email: DEFAULT_ADMIN_EMAIL,
        password: DEFAULT_ADMIN_PASSWORD
      };
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    }

    // Migra e-mail antigo (Gimarry / Flor) com a mesma senha
    if (
      inputEmail === 'admin@gimarry.com.br' &&
      passOk
    ) {
      data.auth = {
        email: DEFAULT_ADMIN_EMAIL,
        password: String(auth.password || DEFAULT_ADMIN_PASSWORD)
      };
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    }

    return storedEmail === inputEmail && passOk;
  }

  function startCloudPolling(intervalMs = 5000) {
    stopCloudPolling();
    if (!getAdminPassword()) return;
    pollTimer = setInterval(() => {
      pullFull();
    }, intervalMs);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') pullFull();
    });
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

  function getReviews() { return getAll().reviews; }
  function getFaq() { return getAll().faq; }
  function getGallery() { return getAll().gallery; }

  function login(email, password) {
    return loginLocal(email, password);
  }

  async function loginAsync(email, password) {
    return loginRemote(email, password);
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
    const orders = getOrders();
    const year = new Date().getFullYear();
    const num = String(orders.length + 1).padStart(3, '0');
    return `PED-${year}-${num}`;
  }

  function getCategoryName(categoryId) {
    const cat = getCategories().find(c => c.id === categoryId);
    return cat ? cat.name : 'Outros';
  }

  function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function getDashboardStats() {
    const orders = getOrders();
    const finished = orders.filter(o => o.status === 'finalizado');
    const totalSales = finished.reduce((sum, o) => sum + o.total, 0);

    const today = new Date().toISOString().split('T')[0];
    const todaySales = finished
      .filter(o => o.date.startsWith(today))
      .reduce((sum, o) => sum + o.total, 0);

    const month = new Date().toISOString().slice(0, 7);
    const monthSales = finished
      .filter(o => o.date.startsWith(month))
      .reduce((sum, o) => sum + o.total, 0);

    return {
      totalOrders: orders.length,
      totalSales,
      totalClients: getClients().length,
      totalProducts: getProducts().length,
      todaySales,
      monthSales
    };
  }

  function getMonthlyRevenue() {
    const orders = getOrders().filter(o => o.status === 'finalizado');
    const months = {};
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = { label: monthNames[d.getMonth()], value: 0 };
    }

    orders.forEach(o => {
      const key = o.date.slice(0, 7);
      if (months[key]) months[key].value += o.total;
    });

    return Object.values(months);
  }

  /** Pedidos finalizados filtrados por perÃ­odo: all | today | month */
  function getFinishedOrdersByPeriod(period = 'all') {
    const finished = getOrders().filter(o => o.status === 'finalizado');
    if (period === 'today') {
      const today = new Date().toISOString().split('T')[0];
      return finished.filter(o => o.date.startsWith(today));
    }
    if (period === 'month') {
      const month = new Date().toISOString().slice(0, 7);
      return finished.filter(o => o.date.startsWith(month));
    }
    return finished;
  }

  /**
   * Agrega bolos/produtos vendidos a partir de pedidos finalizados.
   * Retorna lista ordenada por faturamento (maior primeiro).
   */
  function getProductSalesBreakdown(period = 'all') {
    const orders = getFinishedOrdersByPeriod(period);
    const map = {};

    orders.forEach(order => {
      (order.items || []).forEach(item => {
        const key = item.productId || item.name;
        if (!map[key]) {
          map[key] = {
            productId: item.productId || null,
            name: item.name || 'Produto',
            qty: 0,
            revenue: 0
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
      .map(row => ({
        ...row,
        avgPrice: row.qty > 0 ? row.revenue / row.qty : 0
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
      products: breakdown
    };
  }

  /** Pedido vindo do site pÃºblico (cliente preenche nome + WhatsApp) */
  async function createPublicOrder({ fullName, whatsapp, items, total, notes }) {
    const phone = String(whatsapp || '').replace(/\D/g, '');
    const name = String(fullName || '').trim();
    if (!name || phone.length < 10 || !items || !items.length) {
      return { ok: false, error: 'Dados incompletos' };
    }

    const data = getAll();
    let client = (data.clients || []).find(c => String(c.phone || '').replace(/\D/g, '') === phone);
    if (!client) {
      client = {
        id: generateId('c'),
        name,
        email: '',
        phone,
        address: ''
      };
      data.clients = data.clients || [];
      data.clients.push(client);
    } else {
      client.name = name;
      client.phone = phone;
    }

    const year = new Date().getFullYear();
    const num = String((data.orders || []).length + 1).padStart(3, '0');
    const order = {
      id: generateId('o'),
      number: `PED-${year}-${num}`,
      clientId: client.id,
      clientName: name,
      clientWhatsapp: phone,
      items,
      total: Number(total) || items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 1), 0),
      status: 'novo',
      date: new Date().toISOString(),
      notes: notes || '',
      source: 'site'
    };

    data.orders = data.orders || [];
    data.orders.push(order);
    localStorage.setItem(KEY, JSON.stringify(data));

    // Tenta gravar na Hostinger (vÃ¡rios celulares)
    try {
      if (location.protocol !== 'file:') {
        await fetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create_order',
            order,
            client
          })
        });
      }
    } catch (e) {
      /* local jÃ¡ salvou */
    }

    return { ok: true, order };
  }

  return {
    init, getAll, save,
    getSettings, saveSettings,
    getProducts, saveProducts,
    getCategories, saveCategories,
    getClients, saveClients,
    getOrders, saveOrders,
    getReviews, getFaq, getGallery,
    login, loginAsync, updatePassword,
    generateId, generateOrderNumber,
    getCategoryName, formatCurrency,
    getDashboardStats, getMonthlyRevenue,
    getFinishedOrdersByPeriod, getProductSalesBreakdown, getSalesPeriodStats,
    initCloud, pullFull, pullPublic, pushToCloud,
    isCloudEnabled, setAdminPassword, getAdminPassword,
    startCloudPolling, stopCloudPolling, notifyUpdated,
    createPublicOrder
  };
})();

Storage.init();

