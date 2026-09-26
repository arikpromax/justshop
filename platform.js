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
  const WAIT = 1500;  /* далі не тримаємо: малюємо підпис «завантажуємо» і чекаємо */

  const id = Number((typeof CFG !== 'undefined' && CFG.siteId) || 0);
  if (!id) { window.JS_DATA_READY = Promise.resolve(false); return; }

  /* Мережа на телефоні зривається, а часте оновлення сторінки впирається
     в обмеження бази. Одна невдала спроба — і вітрина лишалась порожня,
     тож пробуємо ще двічі з паузою. */
  const once = (path, range) => fetch(DB + path, {
    headers: range ? { apikey: KEY, Range: range } : { apikey: KEY }
  }).then(r => (r.ok ? r.json() : Promise.reject(new Error('http ' + r.status))));
  const get = async (path, range) => {
    let last;
    for (let i = 0; i < 3; i++) {
      try { return await once(path, range); }
      catch (e) { last = e; await new Promise(r => setTimeout(r, 400 * (i + 1))); }
    }
    throw last;
  };

  /* Виклик функції бази: резерв кошика, оформлення замовлення.
     keep — щоб запит устиг піти, навіть коли вкладку вже закривають. */
  const rpc = (name, args, keep) => fetch(DB + '/rpc/' + name, {
    method: 'POST',
    headers: { apikey: KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(args || {}),
    keepalive: !!keep
  }).then(r => (r.ok ? r.json() : Promise.reject(new Error('http ' + r.status))));

  /* Залишки складу. Беремо сторінками: база віддає максимум 1000 рядків,
     а позицій (товар × розмір) у магазині одягу буває кілька тисяч. */
  const stock = async () => {
    const out = [];
    for (let from = 0; from < 8000; from += 1000) {
      const part = await get('/stock?site_id=eq.' + id + '&select=item_id,size,qty,reserved,low_at',
        from + '-' + (from + 999));
      out.push.apply(out, part);
      if (part.length < 1000) break;
    }
    return out;
  };

  /* Залишки одного товару — для відкритої сторінки товару. Каталог у
     браузері буває до 10 хвилин старий, а власник міг щойно скасувати
     замовлення чи довезти розмір. */
  const stockOf = itemId => get('/stock?site_id=eq.' + id + '&item_id=eq.' + Number(itemId) +
    '&select=item_id,size,qty,reserved,low_at');

  window.JS_DB = { id: id, rpc: rpc, stockOf: stockOf };
  // Функція бота: вона ж готує оплату карткою й приймає відповідь банку
  window.JS_FN = DB.replace('/rest/v1', '/functions/v1/tg-bot');

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

  const apply = (items, texts, stockRows) => {
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
        itemId: r.id,           // номер товару в базі — за ним ведеться склад
        brand: x.brand || '',
        name: r.title,
        cat: x.cat || '',
        price: Number(String(r.price).replace(/[^\d.]/g, '')) || 0,
        old: Number(String(x.old || '').replace(/[^\d.]/g, '')) || 0,
        sizes: sizes.length ? sizes : ['One size'],
        colors: [],
        tone: '#8e9196',
        gender: String(x.gender || '').trim(),   // m — чоловіче, w — жіноче, порожньо — обом
        tag: x.tag || '',
        img: r.image_url || '',
        // «Ще фото» з картки товару: другий ракурс, деталь, бірка
        pics: Array.isArray(x.photos) ? x.photos.filter(Boolean) : [],
        stock: x.stock !== false && x.stock !== 'false',
        weight: Number(String(x.weight || '').replace(',', '.')) || 0,
        sku: String(x.sku || '').trim(),
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

    /* залишки: сирі рядки віддаємо app.js — він зведе розміри
       до того ж вигляду, у якому показує їх покупцю */
    window.JS_STOCK_ROWS = stockRows || null;

    /* тексти */
    const T = {};
    (texts || []).forEach(r => { T[r.key] = r.value; });
    const put = (key, fn) => { if (T[key] != null && T[key] !== '') fn(T[key]); };

    ['phone', 'hours', 'pickup', 'ig', 'tg', 'tiktok', 'claim', 'email'].forEach(k => put(k, v => { CFG[k] = v; }));
    put('seller_name', v => { CFG.sellerName = v; });
    put('seller_code', v => { CFG.sellerCode = v; });
    put('seller_address', v => { CFG.sellerAddress = v; });
    put('free_from', v => { CFG.freeFrom = Number(String(v).replace(/\D/g, '')) || 0; });
    Object.keys(HEAD).forEach(k => put(k, v => { HEAD[k] = v; }));
  };

  /* ---------- збережений каталог ----------

     Сторінка приходить порожньою й тягне товари сама, тож кожен збій
     мережі лишав вітрину голою. У звичайних магазинів такого немає:
     там сторінку збирає сервер, і товари вже в ній.

     Робимо своє: після вдалого запиту кладемо каталог у памʼять
     браузера. Наступного разу малюємо з нього одразу, не чекаючи
     мережі, а свіжі дані підміняються, щойно приїдуть. Тоді навіть
     без звʼязку покупець бачить магазин, а не порожнечу. */
  const BOX = 'js_shop_' + id;
  const OLD = 7 * 24 * 3600 * 1000;   // старіше тижня не беремо
  const NEW = 15 * 1000;              // лише щоб не питати двічі, коли швидко клацають сторінки
  const FAST = 500;                   // скільки чекаємо свіже, перш ніж показати збережене

  const remember = (items, texts, stockRows) => {
    try {
      localStorage.setItem(BOX, JSON.stringify({
        at: Date.now(), items: items, texts: texts, stock: stockRows,
      }));
    } catch (e) { /* памʼять могла скінчитись — переживемо */ }
  };
  const recall = () => {
    try {
      const raw = localStorage.getItem(BOX);
      if (!raw) return null;
      const box = JSON.parse(raw);
      if (!box || !box.at || Date.now() - box.at > OLD) return null;
      if (!Array.isArray(box.items) || !box.items.length) return null;
      return box;
    } catch (e) { return null; }
  };

  /* ---------- запит ---------- */
  const ask = () => Promise.all([
    get('/items?site_id=eq.' + id + '&order=collection,sort_order' +
        '&select=id,collection,title,text,price,image_url,extra'),
    get('/texts?site_id=eq.' + id + '&select=key,value'),
    stock().catch(() => null)   // складу може не бути — сайт це переживе
  ]);

  const box = recall();
  /* Збережений каталог показуємо одразу, а свіжий тягнемо на кожній
     сторінці: власник додав чи зняв товар в адмінці — покупець бачить це
     вже за секунду, а не через десять хвилин. Стиснутий каталог важить
     близько 60 КБ, тож трафіку бази це майже не додає. */
  const soon = box && Date.now() - box.at < NEW;
  const both = soon ? Promise.resolve(null) : ask();

  /* true — якщо прийшло щось нове. Нічого не змінилось — сторінку не
     перемальовуємо, щоб не збити покупцеві обраний розмір чи прокрутку. */
  // Що зараз показано — щоб знати, чи прийшло щось нове
  let shown = box ? JSON.stringify([box.items, box.texts, box.stock]) : '';
  const take = r => {
    const now = JSON.stringify([r[0], r[1], r[2]]);
    const changed = now !== shown;
    shown = now;
    apply(r[0], r[1], r[2]);
    remember(r[0], r[1], r[2]);
    window.JS_SLOW = false;
    return changed;
  };
  const fresh = soon ? Promise.resolve(true) : both.then(take);

  if (box && soon) {
    apply(box.items, box.texts, box.stock);
    window.JS_DATA_READY = Promise.resolve(true);
  } else if (box) {
    /* Є збережений каталог. Свіжому даємо пів секунди: зазвичай він встигає,
       і сторінка одразу показує те, що власник щойно змінив в адмінці.
       Не встиг (повільний інтернет) — малюємо збережене, а свіже
       підставимо, щойно приїде. */
    const late = new Promise(r => setTimeout(() => r('late'), FAST));
    window.JS_DATA_READY = Promise.race([fresh.then(() => 'fresh'), late])
      .then(res => {
        if (res === 'fresh') return true;
        apply(box.items, box.texts, box.stock);
        fresh
          .then(changed => { if (changed && typeof window.JS_REDRAW === 'function') window.JS_REDRAW(); })
          .catch(() => {});
        return true;
      })
      .catch(() => { apply(box.items, box.texts, box.stock); return true; });
  } else {
    /* Перший захід: чекаємо мережу, але недовго. */
    const timeout = new Promise(r => setTimeout(() => r('slow'), WAIT));
    window.JS_DATA_READY = Promise.race([fresh, timeout])
      .then(res => {
        if (res !== 'slow') return true;
        window.JS_SLOW = true;
        fresh
          .then(() => { if (typeof window.JS_REDRAW === 'function') window.JS_REDRAW(); })
          .catch(() => {
            /* Зовсім не дісталися бази. Мовчки лишати порожню вітрину не
               можна: покупець має знати, що це збій, а не порожній магазин. */
            window.JS_SLOW = false;
            window.JS_FAIL = true;
            if (typeof window.JS_REDRAW === 'function') window.JS_REDRAW();
          });
        /* А поки їх немає — краще порожньо, ніж показувати демо як товар.
           swap тут не годиться: він мовчки пропускає порожній список. */
        PRODUCTS.splice(0, PRODUCTS.length);
        return false;
      })
      .catch(() => false);
  }

  /* Вкладка сайту вже відкрита, а в сусідній власник щось змінив в адмінці.
     Щойно повертаються на сайт — тихо беремо свіже й, якщо щось змінилось,
     перемальовуємо. Кошик лише оновлюємо без перемальовки: там уже введені
     імʼя, телефон і відділення, їх не можна збити. */
  let lastAsk = Date.now();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' || Date.now() - lastAsk < NEW) return;
    lastAsk = Date.now();
    ask().then(take).then(changed => {
      if (!changed || typeof window.JS_REDRAW !== 'function') return;
      if (document.body.dataset.page === 'koshyk') return;
      window.JS_REDRAW();
    }).catch(() => {});
  });
})();
