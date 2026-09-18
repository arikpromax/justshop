/* ============================================================
   Звʼязок із адмінкою (платформа arawebsite, Supabase).

   Сайт повністю працює й без бази — усе, що в data.js, це його
   вміст за замовчуванням. Якщо в CFG.siteId стоїть номер сайту,
   цей файл одним запитом тягне свіжий вміст і підмінює ним дані
   ДО того, як app.js почне малювати сторінку. Тому нічого не
   блимає й не перемальовується двічі.

   База недоступна, повільна чи порожня — сайт малюється тим,
   що вже лежить у data.js.
   ============================================================ */
(() => {
  'use strict';

  const DB = 'https://ortiatyxntdikaldepbp.supabase.co/rest/v1';
  const KEY = 'sb_publishable_UW1Z8ukEU1XWVCdQxIGkDw_firK4hpO'; /* публічний ключ лише на читання */
  const WAIT = 2500;  /* довше сторінку не тримаємо */

  const id = Number((typeof CFG !== 'undefined' && CFG.siteId) || 0);
  if (!id) { window.JS_DATA_READY = Promise.resolve(false); return; }

  const get = path => fetch(DB + path, { headers: { apikey: KEY } })
    .then(r => (r.ok ? r.json() : Promise.reject(new Error('http ' + r.status))));

  /* ---------- перетворення рядків бази у формат data.js ---------- */
  const byCol = rows => {
    const m = {};
    rows.forEach(r => (m[r.collection] = m[r.collection] || []).push(r));
    return m;
  };
  const lines = v => String(v || '').split('\n').map(s => s.trim()).filter(Boolean);
  const block = r => {
    const x = r.extra || {};
    return { t: r.title, d: r.text, list: lines(x.list), link: x.link || '', linkText: x.linkText || '' };
  };
  const swap = (arr, next) => { if (next && next.length) arr.splice(0, arr.length, ...next); };

  const apply = (items, texts) => {
    const by = byCol(items || []);

    /* категорії: технічний код тримається в extra.catkey */
    swap(CATS, (by.cats || []).map(r => ({
      id: (r.extra && r.extra.catkey) || ('c' + r.id),
      name: r.title,
      icon: (r.extra && r.extra.icon) || 'tee'
    })));

    /* товари */
    swap(PRODUCTS, (by.products || []).map(r => {
      const x = r.extra || {};
      const sizes = String(x.sizes || '').split(',').map(s => s.trim()).filter(Boolean);
      return {
        id: 'p' + r.id,
        brand: x.brand || '',
        name: r.title,
        cat: x.cat || '',
        price: Number(String(r.price).replace(/[^\d.]/g, '')) || 0,
        old: Number(String(x.old || '').replace(/[^\d.]/g, '')) || 0,
        sizes: sizes.length ? sizes : ['One size'],
        colors: [],
        tone: '#8e9196',
        tag: x.tag || '',
        img: r.image_url || '',
        stock: x.stock !== false && x.stock !== 'false',
        desc: r.text || ''
      };
    }));

    swap(WISHES, (by.wishes || []).map(r => r.title));
    swap(CLUBS, (by.clubs || []).map(r => ({ m: (r.extra && r.extra.mono) || '', n: r.title, d: r.text })));
    swap(FAQ, (by.faq || []).map(r => ({ q: r.title, a: r.text })));
    swap(DELIVERY, (by.delivery || []).map(block));
    swap(PAYMENT, (by.payment || []).map(block));
    swap(RETURNS, (by.returns || []).map(block));
    swap(CONTACTS, (by.contacts || []).map(block));

    /* фото банера: слоти hero1…hero4 */
    const pics = (by.site_photos || [])
      .filter(r => r.image_url)
      .sort((a, b) => String((a.extra || {}).slot).localeCompare(String((b.extra || {}).slot)))
      .map(r => r.image_url);
    if (pics.length) CFG.hero = pics;

    /* тексти */
    const T = {};
    (texts || []).forEach(r => { T[r.key] = r.value; });
    const put = (key, fn) => { if (T[key] != null && T[key] !== '') fn(T[key]); };

    ['phone', 'hours', 'pickup', 'ig', 'tg', 'tiktok', 'claim'].forEach(k => put(k, v => { CFG[k] = v; }));
    put('free_from', v => { CFG.freeFrom = Number(String(v).replace(/\D/g, '')) || 0; });
    Object.keys(HEAD).forEach(k => put(k, v => { HEAD[k] = v; }));
  };

  /* ---------- запит ---------- */
  const both = Promise.all([
    get('/items?site_id=eq.' + id + '&order=collection,sort_order' +
        '&select=id,collection,title,text,price,image_url,extra'),
    get('/texts?site_id=eq.' + id + '&select=key,value')
  ]);

  const timeout = new Promise(r => setTimeout(() => r('slow'), WAIT));

  window.JS_DATA_READY = Promise.race([both, timeout])
    .then(res => {
      if (res === 'slow') return false;
      apply(res[0], res[1]);
      return true;
    })
    .catch(() => false);
})();
