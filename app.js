/* ===========================================================
   JUST SHOP — логіка сайту.
   Один файл на всі сторінки, гілка вибирається за data-page у <body>.
   =========================================================== */
(() => {
  'use strict';

  /* Сторінка може малюватись двічі: спершу зі збереженого каталогу,
     потім зі свіжого. Розмітку при цьому замінює нова, а от таймери й
     слухачі на вікні та документі лишаються висіти від минулого разу.
     Через це друкарська машинка в пошуку починала бити двома руками:
     два таймери писали в одне поле навперебій.
     Тому все таке тримаємо в списку й прибираємо перед новим малюванням. */
  let held = [];
  const watch = (box, type, fn, opts) => {
    box.addEventListener(type, fn, opts);
    held.push(() => box.removeEventListener(type, fn, opts));
  };
  const watchTick = (fn, ms) => {
    const id = setInterval(fn, ms);
    held.push(() => clearInterval(id));
    return id;
  };
  const release = () => { held.forEach(f => f()); held = []; };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const NB = ' ';
  const money = n => Math.round(n).toLocaleString('uk-UA').replace(/\s/g, NB) + NB + 'грн';
  const page = document.body.dataset.page || '';
  const byId = id => PRODUCTS.find(p => p.id === id);
  const catName = id => (CATS.find(c => c.id === id) || {}).name || '';
  // якщо в товару є артикул постачальника — показуємо його: за ним шукають
  // і власник, і покупець. Немає — власний номер по порядку.
  const sku = p => (p.sku ? p.sku : 'JS-' + String(PRODUCTS.indexOf(p) + 101));
  /* «Arc'teryx», «arc teryx» і «ARCTERYX» мають знаходити те саме */
  const norm = s => String(s).toLowerCase().replace(/['’ʼ`]/g, '').replace(/[^0-9a-zа-яіїєґ]+/g, ' ').trim();
  const hay = p => norm(p.brand + ' ' + p.name + ' ' + catName(p.cat) + ' ' + (p.colors || []).join(' '));
  /* «arc teryx» теж має спрацювати, тому пробіли ігноруємо в другу чергу */
  const hit = (p, s) => hay(p).includes(s) || hay(p).replace(/ /g, '').includes(s.replace(/ /g, ''));

  /* ---------- розміри ----------
     У таблиці постачальника вони писані як кому заманеться: кирилична «М»
     поряд з латинською, службове MISK замість «без розміру», ті самі
     шкарпетки то «38/42», то «38-42», обʼєм рюкзака «25L» у графі розміру.
     Без зведення до одного вигляду у фільтрі стоять два однакових на око
     розміри, і кожен показує свою половину товарів. */
  const CYR = { 'М': 'M', 'С': 'S', 'Л': 'L', 'Х': 'X', 'Т': 'T' };
  const LET = 'XS|S|M|L|XL|XXL|XXXL';
  function tidySize(raw) {
    const s = String(raw == null ? '' : raw).trim().replace(/\s+/g, ' ').replace(',', '.');
    if (!s) return '';
    if (/^(misk|misc|mics|uni|onesize|one size|без розміру|універсальний)$/i.test(s)) return 'Універсальний';
    if (/^\d+ ?[lл]$/i.test(s)) return 'Універсальний';       // «25L» — це обʼєм рюкзака
    if (/^\d+(\.\d+)?$/.test(s)) {
      const n = parseFloat(s);
      return n < 20 ? 'Універсальний' : String(n);                  // «5» — розмір мʼяча, не взуття
    }
    const u = s.toUpperCase().replace(/[МСЛХТ]/g, c => CYR[c]);
    if (new RegExp('^(' + LET + ')$').test(u)) return u;
    if (new RegExp('^(' + LET + ')[/–-](' + LET + ')$').test(u)) return u.replace(/[/–]/g, '-');
    if (/^\d{2}(\.5)?[/–-]\d{2}(\.5)?$/.test(u)) return u.replace(/[/–]/g, '-');
    if (/^\d{2}X\d{2}$/.test(u)) return u.replace('X', 'x');
    return s;
  }
  const SZ_GROUPS = [
    ['Одяг', new RegExp('^(' + LET + ')(-(' + LET + '))?$')],
    ['Взуття', /^\d{2}(\.5)?$/],
    ['Джинси, талія × довжина', /^\d{2}x\d{2}$/i],
    ['Шкарпетки', /^\d{2}-\d{2}$/],
    ['Без розміру', /./]
  ];
  const SZ_ORDER = ['XS', 'S', 'S-M', 'M', 'L', 'L-XL', 'XL', 'XXL', 'XXXL'];
  const szGroup = s => { const i = SZ_GROUPS.findIndex(([, re]) => re.test(s)); return i < 0 ? SZ_GROUPS.length - 1 : i; };
  const szCmp = (a, b) => {
    const ga = szGroup(a), gb = szGroup(b);
    if (ga !== gb) return ga - gb;
    if (ga === 0) return SZ_ORDER.indexOf(a) - SZ_ORDER.indexOf(b);
    return (parseFloat(a) || 0) - (parseFloat(b) || 0) || a.localeCompare(b, 'uk');
  };
  const tidySizes = list => {
    const out = Array.from(new Set((list || []).map(tidySize).filter(Boolean))).sort(szCmp);
    return out.length ? out : ['Універсальний'];
  };

  /* Той самий бренд у таблиці записаний по-різному — у фільтрі це два рядки. */
  const BRAND_ALIAS = { 'air jordan': 'Jordan', 'jordan brand': 'Jordan', 'nike sportswear': 'Nike', 'adidas originals': 'adidas', 'new balanse': 'New Balance', 'nb': 'New Balance' };
  const tidyBrand = b => { const k = String(b == null ? '' : b).trim(); return BRAND_ALIAS[k.toLowerCase()] || k; };

  /* ---------- чоловіче чи жіноче ----------
     Магазин тримає і те, і те, тому при першому заході питаємо один раз
     і памʼятаємо вибір. Річ без поділу — унісекс, аксесуари, шкарпетки —
     показується в обох розділах, тому нічого не губиться. */
  const AUD_KEY = 'js_aud';
  const AUD = [['m', 'Чоловіче'], ['w', 'Жіноче']];
  let aud = '';
  try { aud = localStorage.getItem(AUD_KEY) || ''; } catch (e) {}
  if (aud !== 'm' && aud !== 'w') aud = '';
  const audOk = p => !p.gender || p.gender === aud;
  let SHOWN = PRODUCTS;            // товари обраного розділу

  function setAud(a, reload) {
    aud = a;
    try { localStorage.setItem(AUD_KEY, a); } catch (e) {}
    if (reload) { location.reload(); return; }
    $$('.aud [data-aud]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.aud === aud)));
  }

  /* Питаємо один раз, поверх ще не намальованої сторінки: так вона
     малюється одразу потрібним розділом, без перезавантаження. */
  function askAud(done) {
    const m = document.createElement('div');
    m.className = 'audk';
    m.innerHTML = `<div class="audk__b">
      ${CFG.logoLight ? `<img class="audk__logo" src="${esc(CFG.logoLight)}" alt="">` : ''}
      <p class="audk__t dsp">Що показувати?</p>
      <p class="audk__d">Оберіть розділ — перемкнути його можна будь-коли вгорі сторінки.</p>
      <div class="audk__row">
        ${AUD.map(([k, n]) => `<button type="button" class="audk__c" data-aud="${k}">
          <span>${n}</span>${icon('arrow')}</button>`).join('')}
      </div>
    </div>`;
    document.body.appendChild(m);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => m.classList.add('on'));
    m.addEventListener('click', e => {
      const b = e.target.closest('[data-aud]');
      if (!b) return;
      setAud(b.dataset.aud, false);
      m.remove();
      document.body.style.overflow = prev;
      done();
    });
  }

  /* ---------- склад ----------
     Залишки ведуться в адмінці окремо по кожному розміру. Товар, для
     якого складу немає, поводиться як раніше — сайти без обліку нічого
     не втрачають. */
  const tracked = p => !!(p && p.stk);
  const avail = (p, size) => (tracked(p) ? (p.stk[size] || 0) : Infinity);
  const leftAll = p => (tracked(p) ? p.sizes.reduce((n, s) => n + avail(p, s), 0) : Infinity);
  // «під запит» — це не «немає»: такий товар возять на замовлення
  const outOfStock = p => p.stock !== false && leftAll(p) === 0;
  const lowLeft = (p, size) => tracked(p) && avail(p, size) > 0
    && avail(p, size) <= ((p.stkLow && p.stkLow[size]) || 2);
  // як розмір зветься в базі: замовлення має влучити рівно в свій рядок складу
  const dbSize = (p, size) => ((p.stkKey && p.stkKey[size]) || size);
  const inCart = (id, size) => cart.filter(l => l.id === id && l.size === size)
    .reduce((n, l) => n + l.qty, 0);

  function stockLine(p) {
    if (p.stock === false) return 'Немає — привеземо під запит за 3—10 днів';
    if (outOfStock(p)) return 'Зараз немає — напишіть, і привеземо під запит';
    const n = leftAll(p);
    if (tracked(p) && n <= 3) return 'Залишилось ' + n + ' — відправка сьогодні';
    return 'Є в наявності, відправка сьогодні';
  }

  /* Розміри в базі можуть бути записані інакше, ніж показує сайт
     (кирилична «М», «38/42»), тому зводимо обидві сторони до одного
     вигляду, а оригінальний напис памʼятаємо для замовлення. */
  function stockIn(rows) {
    if (!rows || !rows.length) return;
    const by = {};
    rows.forEach(r => {
      const k = tidySize(r.size) || 'Універсальний';
      const m = by[r.item_id] || (by[r.item_id] = { free: {}, key: {}, low: {} });
      const free = Math.max(0, (Number(r.qty) || 0) - (Number(r.reserved) || 0));
      m.free[k] = (m.free[k] || 0) + free;
      if (free > 0 || !m.key[k]) m.key[k] = r.size;
      m.low[k] = Math.min(m.low[k] == null ? 99 : m.low[k], Number(r.low_at) || 0);
    });
    PRODUCTS.forEach(p => {
      const m = by[p.itemId];
      if (!m) return;
      p.stk = m.free;
      p.stkKey = m.key;
      p.stkLow = m.low;
    });
  }

  /* ---------- кошик ---------- */
  const CART_KEY = 'js_cart_v1';
  const readCart = () => { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; } };
  const writeCart = c => { try { localStorage.setItem(CART_KEY, JSON.stringify(c)); } catch (e) {} paintCount(); };
  // Відсіювати позиції, яких уже немає в каталозі, можна тільки після того,
  // як прийдуть дані з адмінки — інакше кошик чиститься об застарілий список.
  let cart = readCart();

  function addToCart(id, size, qty) {
    const line = cart.find(l => l.id === id && l.size === size);
    if (line) line.qty += qty || 1; else cart.push({ id, size, qty: qty || 1 });
    writeCart(cart);
  }
  const cartCount = () => cart.reduce((s, l) => s + l.qty, 0);
  const cartSum = () => cart.reduce((s, l) => s + (byId(l.id) || {}).price * l.qty, 0);
  function paintCount() { $$('.cartbtn b').forEach(b => { b.textContent = cartCount() || ''; }); }

  /* ---------- дрібне ---------- */
  function toast(text) {
    let t = $('#toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.style.cssText = 'position:fixed;left:50%;bottom:26px;transform:translate(-50%,14px);z-index:120;background:#0b0b0c;color:#fff;padding:13px 20px;font:500 11px/1 var(--mono);letter-spacing:.11em;text-transform:uppercase;opacity:0;transition:.25s;pointer-events:none';
      document.body.appendChild(t);
    }
    t.textContent = text;
    requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translate(-50%,0)'; });
    clearTimeout(toast.t);
    toast.t = setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translate(-50%,14px)'; }, 2200);
  }

  const TAGS = { new: ['Нове', ''], hit: ['Хіт', 'tagi--acc'], last: ['Останній розмір', ''] };

  /* знижка помітна одразу */
  const off = p => (p.old > 0
    ? `<span class="plate__off">−${Math.round((1 - p.price / p.old) * 100)}%</span>`
    : '');

  function plate(p, opts) {
    const o = opts || {};
    // без фото плитка лишається просто однотонною — жодних силуетів
    const alt = esc(p.brand + ' ' + p.name);
    // кілька кадрів — кладемо їх у стрічку, щоб гортати вбік, як звично
    const inner = o.pics && o.pics.length > 1
      ? `<div class="track" id="track">${o.pics.map(u => `<img src="${esc(u)}" alt="${alt}">`).join('')}</div>`
      : p.img ? `<img src="${esc(p.img)}" alt="${alt}" loading="lazy">` : '';
    const tag = o.tag === false ? ''
      : p.stock === false ? '<span class="tagi tagi--out">Під запит</span>'
        : outOfStock(p) ? '<span class="tagi tagi--out">Немає</span>'
          : TAGS[p.tag] ? `<span class="tagi ${TAGS[p.tag][1]}">${TAGS[p.tag][0]}</span>` : '';
    // на картці показуємо лише ті розміри, які справді є
    const szl = tracked(p) ? p.sizes.filter(s => avail(p, s) > 0) : p.sizes;
    const sz = o.sizes && szl.length
      ? `<div class="szrow">${szl.map(s => `<span>${esc(s)}</span>`).join('')}</div>` : '';
    // плитка з фото — біла й без фактури, порожня лишається сірою
    return `<div class="plate${p.img ? ' plate--ph' : ''}">
      ${inner}${o.meta === false ? '' : off(p)}${tag}${sz}
    </div>`;
  }

  function card(p) {
    return `<article class="card">
      <a href="tovar.html?id=${encodeURIComponent(p.id)}" aria-label="${esc(p.brand + ' ' + p.name)}">${plate(p, { sizes: true })}</a>
      <div class="card__b">
        ${p.brand ? `<span class="card__brand">${esc(p.brand)}</span>` : ''}
        <h3 class="card__n"><a href="tovar.html?id=${encodeURIComponent(p.id)}">${esc(p.name)}</a></h3>
        <p class="card__p">${p.old ? `<u>${money(p.price)}</u><s>${money(p.old)}</s>` : money(p.price)}</p>
      </div>
    </article>`;
  }

  /* ---------- шапка, біжучий рядок, підвал ---------- */
  const TICKER = ['Оригінал з Європи', 'Знайдемо будь-яку річ', 'Самовивіз у Києві', 'Нова Пошта по Україні', 'Фото бірок до оплати', 'Офіційний партнер ФК «Ростянець» і ФК Rebel'];
  const DIAG = '<svg class="tick__d" viewBox="0 0 22 8" aria-hidden="true"><path d="M2 8 6 0M8 8 12 0M14 8 18 0" stroke="#ff3b14" stroke-width="1.4"/></svg>';

  function chrome() {
    const t = $('#tick');
    if (t) {
      const seq = `<div class="tick__seq">${TICKER.map(s => `<span>${esc(s)}</span>${DIAG}`).join('')}</div>`;
      t.innerHTML = `<div class="tick__in">${seq}${seq}</div>`;
    }

    const h = $('#hdr');
    if (h) {
      const nav = [['katalog.html', 'Каталог'], ['dostavka.html', 'Доставка й оплата'], ['kontakty.html', 'Контакти']];
      h.className = 'hdr' + (document.body.dataset.hdr === 'dark' ? ' hdr--dark' : '');
      h.innerHTML = `<div class="hdr__in">
        <a class="logo" href="index.html">${CFG.logo
          ? `<img src="${esc(CFG.logo)}" alt="${esc(CFG.brand)}" onerror="this.parentNode.innerHTML='Just<i></i>Shop'">`
          : 'Just<i></i>Shop'}</a>
        <div class="aud" role="group" aria-label="Розділ каталогу">
          ${AUD.map(([k, n]) => `<button type="button" data-aud="${k}" aria-pressed="${aud === k}">${n}</button>`).join('')}
        </div>
        <nav class="nav" id="nav">
          ${nav.map(([u, n]) => `<a href="${u}"${page && u.indexOf(page) === 0 ? ' aria-current="page"' : ''}>${n}</a>`).join('')}
        </nav>
        <div class="hdr__act">
          <button class="iconbtn" data-search aria-label="Пошук по каталогу">${icon('search')}</button>
          <a class="iconbtn cartbtn" href="koshyk.html" aria-label="Кошик">${icon('cart')}<b></b></a>
          <button class="iconbtn burger" id="burger" aria-label="Меню" aria-expanded="false">${icon('menu')}</button>
        </div>
      </div>`;
      $('.aud').addEventListener('click', e => {
        const b = e.target.closest('[data-aud]');
        if (b && b.dataset.aud !== aud) {
          setAud(b.dataset.aud, false);
          /* З будь-якої сторінки перемикач веде в каталог свого розділу.
             Назад браузер поверне на ту саму річ, що була відкрита. */
          if (page === 'katalog') location.reload();
          else location.href = 'katalog.html';
        }
      });
      $('#burger').addEventListener('click', e => {
        const on = $('#nav').classList.toggle('on');
        e.currentTarget.setAttribute('aria-expanded', String(on));
        e.currentTarget.innerHTML = icon(on ? 'close' : 'menu');
        /* Меню висить нерухомо, а сторінка під ним доїжджає за інерцією —
           і на телефоні це видно як змазаний, ніби подвоєний екран.
           Поки меню відкрите, сторінку не рухаємо. */
        document.body.classList.toggle('menu-on', on);
      });
    }

    const f = $('#ft');
    if (f) {
      f.className = 'ft';
      f.innerHTML = `<div class="wrap">
        <div class="ft__brand">
          ${CFG.logoLight ? `<img class="ft__logo" src="${esc(CFG.logoLight)}" alt="${esc(CFG.brand)}" onerror="this.remove()">` : ''}
          <span class="ft__rule"></span>
          <span class="ft__name">
            <span class="ft__word">Just<i>.</i>shop</span>
            <span class="ft__claim">${esc(CFG.claim)}</span>
          </span>
        </div>
        <div class="ft__cols">
          <div>
            <h4>${esc(CFG.claim)}</h4>
            <p style="max-width:34ch;color:var(--mut-dk);font-size:14.5px;line-height:1.55">${esc(HEAD.footer_text)}</p>
            <div class="ft__soc">
              <a href="${esc(CFG.ig)}" target="_blank" rel="noopener" aria-label="Instagram">${icon('ig')}</a>
              <a href="${esc(CFG.tiktok)}" target="_blank" rel="noopener" aria-label="TikTok">${icon('tiktok')}</a>
              <a href="${esc(CFG.tg)}" target="_blank" rel="noopener" aria-label="Telegram">${icon('tg')}</a>
            </div>
          </div>
          <div><h4>Каталог</h4><ul>${CATS.slice(0, 6).map(c => `<li><a href="katalog.html?cat=${c.id}">${esc(c.name)}</a></li>`).join('')}</ul></div>
          <div><h4>Клієнту</h4><ul>
            <li><a href="dostavka.html">Доставка й оплата</a></li>
            <li><a href="dostavka.html#povernennia">Обмін і повернення</a></li>
            <li><a href="dostavka.html#rozmiry">Розмірна сітка</a></li>
            <li><a href="dostavka.html#trek">Відстежити посилку</a></li>
          </ul></div>
          <div><h4>Звʼязок</h4><ul>
            <li><a href="${esc(CFG.ig)}" target="_blank" rel="noopener">Instagram</a></li>
            <li><a href="${esc(CFG.tg)}" target="_blank" rel="noopener">Telegram-канал</a></li>
            <li><a href="kontakty.html">${esc(CFG.pickup.split(',')[0])} — самовивіз</a></li>
            <li>${esc(CFG.hours)}</li>
          </ul></div>
        </div>
        <div class="ft__bot">
          <span>© ${new Date().getFullYear()} ${esc(CFG.brand)}</span>
          <span>Доставка: Нова Пошта</span>
          <span>Оплата: картка ФОП · наложений платіж</span>
        </div>
      </div>`;
    }

    paintCount();
    watch(document, 'click', e => {
      const s = e.target.closest('[data-search]');
      if (s) { e.preventDefault(); openSearch(); return; }
      const z = e.target.closest('[data-sizes]');
      if (z) { e.preventDefault(); openSizes(z.dataset.sizes); }
    });
  }

  /* Блоки «заголовок + абзац + список», з яких складені сторінки доставки
     та контактів. Малюються з масиву, тож в адмінці їх можна додавати. */
  function blocks(sel, list) {
    const el = $(sel);
    if (!el) return;
    el.innerHTML = (list || []).map(b => `<div>
      <h3>${esc(b.t)}</h3>
      ${b.d ? `<p>${esc(b.d)}</p>` : ''}
      ${b.link ? `<p style="margin-top:14px"><a class="lnk" href="${esc(b.link)}" target="_blank" rel="noopener">${esc(b.linkText || b.link)}${icon('arrow')}</a></p>` : ''}
      ${(b.list || []).length ? `<ul>${b.list.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    </div>`).join('');
  }

  /* Заголовки й абзаци, підписані в розмітці через data-txt */
  function heads() {
    $$('[data-txt]').forEach(el => {
      const v = HEAD[el.dataset.txt];
      if (v != null && v !== '') el.innerHTML = v;
    });
  }

  /* ---------- спільна модалка ---------- */
  let mdEsc = null;
  function closeModal() {
    const m = $('#md');
    if (!m) return;
    m.remove();
    document.body.style.overflow = '';
    if (mdEsc) document.removeEventListener('keydown', mdEsc);
    mdEsc = null;
  }
  function modal(cls, html) {
    closeModal();
    const m = document.createElement('div');
    m.className = 'md' + (cls ? ' ' + cls : '');
    m.id = 'md';
    m.innerHTML = `<div class="md__bg" data-x></div>
      <div class="md__box" role="dialog" aria-modal="true">
        <button class="iconbtn md__x" type="button" data-x aria-label="Закрити">${icon('close')}</button>
        ${html}
      </div>`;
    document.body.appendChild(m);
    document.body.style.overflow = 'hidden';
    m.addEventListener('click', e => { if (e.target.closest('[data-x]')) closeModal(); });
    mdEsc = e => { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', mdEsc);
    return m;
  }

  /* ---------- пошук по каталогу ---------- */
  function openSearch() {
    const m = modal('md--top', `
      <div class="srch">
        <span class="srch__i">${icon('search')}</span>
        <label class="sr" for="sq">Пошук по каталогу</label>
        <input id="sq" type="text" autocomplete="off" spellcheck="false" placeholder="Модель, бренд або категорія">
      </div>
      <div class="srch__r" id="sres"></div>`);
    const inp = $('#sq', m), out = $('#sres', m);

    const draw = () => {
      const s = norm(inp.value);
      if (s.length < 2) {
        out.innerHTML = `<p class="srch__hint">Почніть вводити — покажемо, що є в наявності.</p>
          <div class="srch__tags">${CATS.slice(0, 6).map(c => `<a href="katalog.html?cat=${c.id}">${esc(c.name)}</a>`).join('')}</div>`;
        return;
      }
      const list = SHOWN.filter(p => hit(p, s));
      if (!list.length) {
        out.innerHTML = `<p class="srch__hint">Нічого не знайшли. Напишіть нам <a href="${esc(CFG.tg)}" target="_blank" rel="noopener">у Telegram</a> — привеземо з Європи під запит.</p>`;
        return;
      }
      out.innerHTML = list.slice(0, 6).map(p => `<a class="srow" href="tovar.html?id=${encodeURIComponent(p.id)}">
          ${plate(p, { meta: false, tag: false })}
          <span class="srow__b">${p.brand ? `<b>${esc(p.brand)}</b>` : ''}<span>${esc(p.name)}</span></span>
          <em>${money(p.price)}</em>
        </a>`).join('')
        + `<a class="srch__all" href="katalog.html?q=${encodeURIComponent(inp.value.trim())}">Усі знахідки (${list.length}) ${icon('arrow')}</a>`;
    };

    let t = 0;
    inp.addEventListener('input', () => { clearTimeout(t); t = setTimeout(draw, 150); });
    inp.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      const q = inp.value.trim();
      if (q) location.href = 'katalog.html?q=' + encodeURIComponent(q);
    });
    setTimeout(() => inp.focus(), 50);
    draw();
  }

  /* ---------- таблиця розмірів ---------- */
  const SIZE_BY_CAT = { vzuttia: 'shoe', shkarpetky: 'shoe', shtany: 'bottom', shorty: 'bottom' };
  const sizeKind = p => SIZE_BY_CAT[p.cat] || 'top';

  /* схема обмірів: силует зі sprite.js + власні стрілки */
  function arrowSvg(x1, y1, x2, y2) {
    const a = Math.atan2(y2 - y1, x2 - x1), h = 5, w = 3.2;
    const head = (x, y, dir) => {
      const b = a + (dir > 0 ? Math.PI : 0);
      const hx = x + Math.cos(b) * h, hy = y + Math.sin(b) * h;
      const px = -Math.sin(b) * w, py = Math.cos(b) * w;
      return `<path d="M${x} ${y}L${hx + px} ${hy + py}L${hx - px} ${hy - py}Z" fill="currentColor" stroke="none"/>`;
    };
    return `<path d="M${x1} ${y1}L${x2} ${y2}"/>${head(x1, y1, 1)}${head(x2, y2, -1)}`;
  }
  function tx(x, y, t, rot, anchor) {
    const r = rot ? ` transform="rotate(${rot} ${x} ${y})"` : '';
    return `<text x="${x}" y="${y}" text-anchor="${anchor || 'middle'}"${r}>${t}</text>`;
  }
  const DIAGRAMS = {
    top: {
      g: 'hoodie', box: [66, 34, 3.6],
      marks: () => arrowSvg(91, 58, 214, 58) + tx(152, 50, 'ГРУДИ')
        + arrowSvg(232, 74, 232, 171) + tx(246, 122, 'ДОВЖИНА', -90)
    },
    bottom: {
      g: 'pants', box: [88, 30, 3.7],
      marks: () => arrowSvg(149, 54, 212, 54) + tx(180, 46, 'ПОЯС')
        + arrowSvg(146, 88, 215, 88) + tx(138, 91, 'СТЕГНА', 0, 'end')
        + arrowSvg(232, 67, 232, 171) + tx(246, 119, 'ДОВЖИНА', -90)
    },
    shoe: {
      g: 'sneaker', box: [46, 46, 3.6],
      marks: () => arrowSvg(71, 196, 197, 196) + tx(134, 210, 'ДОВЖИНА УСТІЛКИ')
    }
  };
  function diagram(kind) {
    const d = DIAGRAMS[kind];
    const [x, y, s] = d.box;
    return `<svg class="dg" viewBox="0 0 300 215" aria-hidden="true">
      <g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="currentColor" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round" class="dg__g">${GARMENT[d.g]}</g>
      <g class="dg__m" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">${d.marks()}</g>
    </svg>`;
  }

  /* блок «таблиця розмірів»: працює і в модалці, і просто на сторінці */
  function sizeUI(root, kind) {
    const order = ['top', 'bottom', 'shoe'];
    let cur = order.indexOf(kind) > -1 ? kind : 'top';

    const calcHtml = k => k === 'shoe'
      ? `<div class="f"><label for="cF">Довжина устілки, см</label><input id="cF" inputmode="decimal" placeholder="27,5"></div>`
      : `<div class="f"><label for="cH">Зріст, см</label><input id="cH" inputmode="numeric" placeholder="180"></div>
         <div class="f"><label for="cW">Вага, кг</label><input id="cW" inputmode="numeric" placeholder="78"></div>`;

    const paint = () => {
      const t = SIZE_TABLES[cur];
      root.innerHTML = `
        <div class="szm">
          <aside class="szm__calc">
            <p class="mono">Не знаєте свій розмір</p>
            <h3 class="dsp h-sm">Порахуємо<br>за вас</h3>
            ${calcHtml(cur)}
            <button class="btn btn--wide btn--sm" type="button" id="cGo">Порахувати</button>
            <p class="szm__res" id="cRes"></p>
          </aside>
          <div class="szm__main">
            <div class="szm__tabs">${order.map(k => `<button type="button" data-k="${k}"${k === cur ? ' aria-pressed="true"' : ''}>${esc(SIZE_TABLES[k].name)}</button>`).join('')}</div>
            <p class="szm__note">${esc(t.note)}</p>
            ${diagram(cur)}
            <div class="tblwrap tblwrap--one">
              <table class="tbl">
                <thead><tr>${t.cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead>
                <tbody>${t.rows.map(r => `<tr>${r.map(v => `<td>${String(v).replace('.', ',')}</td>`).join('')}</tr>`).join('')}</tbody>
              </table>
            </div>
          </div>
        </div>`;

      $$('[data-k]', root).forEach(b => b.addEventListener('click', () => { cur = b.dataset.k; paint(); }));
      $('#cGo', root).addEventListener('click', () => {
        const res = $('#cRes', root);
        const num = id => parseFloat(($(id, root) || {}).value ? $(id, root).value.replace(',', '.') : '');
        if (cur === 'shoe') {
          const f = num('#cF');
          if (!(f > 18 && f < 36)) { res.textContent = 'Вкажіть довжину устілки, 20—35 см.'; res.className = 'szm__res szm__res--bad'; return; }
          const row = SIZE_TABLES.shoe.rows.find(r => r[1] >= f - 0.2) || SIZE_TABLES.shoe.rows[SIZE_TABLES.shoe.rows.length - 1];
          res.className = 'szm__res';
          res.innerHTML = `Ваш розмір — <b>EU ${row[0]}</b>. Устілка ${String(row[1]).replace('.', ',')} см.`;
          return;
        }
        const h = num('#cH'), w = num('#cW');
        if (!(h > 140 && h < 215) || !(w > 35 && w < 200)) {
          res.textContent = 'Впишіть зріст і вагу — і порахуємо.';
          res.className = 'szm__res szm__res--bad';
          return;
        }
        const idx = w - (h - 176) * 0.35;
        const pick = SIZE_CALC.find(x => idx <= x.upTo) || SIZE_CALC[SIZE_CALC.length - 1];
        const next = SIZE_CALC[SIZE_CALC.indexOf(pick) + 1];
        res.className = 'szm__res';
        res.innerHTML = `Ваш розмір — <b>${pick.size}</b>.` + (next ? ` Любите вільніше — беріть ${next.size}.` : '');
      });
    };
    paint();
  }

  function openSizes(kind) {
    const m = modal('md--wide', '<div id="szmRoot"></div>');
    sizeUI($('#szmRoot', m), kind);
  }

  function fieldBad(input, msg) {
    const f = input.closest('.f');
    f.classList.toggle('bad', !!msg);
    const p = $('.fmsg', f);
    if (p) p.textContent = msg || '';
    return !msg;
  }

  /* Відправлення замовлення.
     text — готовий людський текст (його ж кладемо в буфер обміну).
     data — те саме, але розібране на поля: саме з нього бот створює накладну,
     бо там лежать внутрішні коди міста й відділення з бази Нової Пошти. */
  function send(text, kind, data) {
    try {
      if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    } catch (e) {}
    if (CFG.orderWebhook) {
      fetch(CFG.orderWebhook, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, text, data: data || null, at: new Date().toISOString() })
      }).catch(() => {});
    }
  }

  /* ===========================================================
     ГОЛОВНА
     =========================================================== */
  /* Смуга фото за героєм. Кожна панель знімається сама, якщо файлу немає;
     коли не лишилось жодної — герой повертається до простого темного тла. */
  function heroPics() {
    const hero = $('.hero');
    if (!hero) return;
    if (CFG.heroLogo) { heroLogo(hero); return; }
    const list = (CFG.hero || []).filter(Boolean);
    if (!list.length) return;
    const wrap = document.createElement('div');
    wrap.className = 'hero__pics';
    hero.prepend(wrap);
    hero.classList.add('hero--pics');

    // на телефоні видно одну панель, на планшеті дві — решту й не вантажимо,
    // бо display:none картинку не зупиняє, вона все одно качається
    const need = () => (innerWidth <= 560 ? 1 : innerWidth <= 900 ? 2 : list.length);
    let made = 0;
    const build = () => {
      const n = Math.min(need(), list.length);
      for (; made < n; made++) {
        const im = new Image();
        im.alt = '';
        im.setAttribute('aria-hidden', 'true');
        // слухач вішаємо до src, інакше 404 із localhost встигає спрацювати раніше
        im.addEventListener('error', () => {
          im.remove();
          if (!wrap.children.length) { wrap.remove(); hero.classList.remove('hero--pics'); }
        });
        im.src = list[made];
        wrap.appendChild(im);
      }
    };
    build();
    let rt = 0;
    watch(window, 'resize', () => { clearTimeout(rt); rt = setTimeout(build, 250); });
  }

  /* Логотип у банері: файл лишається оригінальним, у темну смугу його
     вводить мʼяке згасання по краях — інакше сіре тло логотипа стоїть
     у смузі помітним квадратом. */
  function heroLogo(hero) {
    const wrap = document.createElement('div');
    wrap.className = 'hero__pics hero__pics--logo';
    const im = new Image();
    im.alt = '';
    im.setAttribute('aria-hidden', 'true');
    im.addEventListener('error', () => { wrap.remove(); hero.classList.remove('hero--pics', 'hero--logo'); });
    im.src = CFG.heroLogo;
    wrap.appendChild(im);
    hero.prepend(wrap);
    hero.classList.add('hero--pics', 'hero--logo');
  }

  function home() {
    heroPics();
    /* рядок із пропуском */
    const inp = $('#wish'), ghost = $('#wishGhost'), fill = $('#fill');
    const h1 = fill.parentElement;
    const word = h1.firstElementChild;
    const go = $('#wishGo'), cur = $('.fill__cur', fill);
    const wOf = el => (el ? el.getBoundingClientRect().width + (parseFloat(getComputedStyle(el).marginLeft) || 0) : 0);
    const widthOf = t => { ghost.textContent = t || ''; return ghost.offsetWidth; };

    // Скільки місця лишається самому полю в поточному кеглі.
    const room = () => {
      const cs = getComputedStyle(h1);
      const wrapped = cs.flexWrap !== 'nowrap';   // на телефоні поле займає окремий рядок
      const box = wrapped ? fill.clientWidth : h1.clientWidth - word.offsetWidth - (parseFloat(cs.columnGap) || 0);
      return Math.max(60, box - wOf(go) - wOf(cur) - 8);
    };

    // Ширина поля тягнеться за текстом. Кегль тут не чіпаємо — він спільний
    // для всього рядка, тому «Пошук» і набраний текст завжди однакові.
    const grow = () => {
      if (h1.clientWidth < 100) return true;
      const w = widthOf(inp.value || inp.placeholder || '');
      const r = room();
      inp.style.width = Math.min(w + 10, r) + 'px';
      fill.classList.toggle('is-typed', !!inp.value);
      return w + 10 <= r;                        // чи вмістилось
    };

    // Кегль підбирається на ВЕСЬ рядок одразу — щоб найдовша підказка
    // дописалась до кінця й нічого не обрізалось. Рахуємо раз: на старті,
    // при зміні розміру вікна та коли долетить Archivo.
    const relayout = () => {
      if (h1.clientWidth < 100) return;
      h1.style.fontSize = '';                    // спершу назад на базовий кегль
      const cs = getComputedStyle(h1);
      const base = parseFloat(cs.fontSize);
      const wrapped = cs.flexWrap !== 'nowrap';
      const gap = parseFloat(cs.columnGap) || 0;
      const lead = wrapped ? 0 : word.offsetWidth + gap;   // слово «Пошук» у тому ж рядку
      let longest = 0;
      WISHES.concat(inp.value ? [inp.value] : []).forEach(t => { longest = Math.max(longest, widthOf(t)); });
      const avail = (wrapped ? fill.clientWidth : h1.clientWidth) - wOf(go) - wOf(cur) - 14;
      const need = lead + longest;
      const size = need > avail ? Math.max(base * 0.3, base * avail / need) : base;
      h1.style.fontSize = size.toFixed(1) + 'px';
      grow();
    };

    watch(window, 'resize', relayout);
    // до завантаження Archivo заміри йдуть запасним шрифтом, а він вужчий
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
    const match = q => {
      const s = norm(q);
      if (s.length < 2) return [];
      return SHOWN.filter(p => hit(p, s));
    };
    inp.addEventListener('input', () => { if (!grow()) relayout(); });
    $('#wishGo').addEventListener('click', () => {
      const q = inp.value.trim();
      if (!q) { inp.focus(); return; }
      location.href = 'katalog.html?q=' + encodeURIComponent(q);
    });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('#wishGo').click(); } });
    $$('.chip').forEach(c => c.addEventListener('click', () => {
      inp.value = c.dataset.q; grow(); inp.focus();
    }));
    relayout();

    /* друкарська машинка в підказці поля, поки порожньо */
    let ti = 0, tc = 0, hold = 0, paused = false;
    inp.addEventListener('focus', () => { paused = true; inp.placeholder = ''; });
    inp.addEventListener('blur', () => { paused = false; });
    watchTick(() => {
      if (paused || inp.value) return;
      const w = WISHES[ti % WISHES.length];
      if (hold > 0) { hold--; if (!hold) { tc = 0; ti++; } grow(); return; }
      tc++;
      inp.placeholder = w.slice(0, tc);
      grow();
      if (tc >= w.length) hold = 18;
    }, 95);

    /* стрічка категорій */
    $('#rail').innerHTML = CATS.map(c => {
      const n = SHOWN.filter(p => p.cat === c.id).length;
      return `<a href="katalog.html?cat=${c.id}">${icon(c.icon)}<em>${esc(c.name)}</em><i>${n}</i></a>`;
    }).join('');

    /* розпродаж окремою каруселлю */
    const sale = SHOWN.filter(p => p.old > 0);
    const car = $('#sale');
    if (sale.length) {
      car.innerHTML = sale.map(card).join('');
      const ends = () => {
        $$('[data-car]').forEach(b => {
          const last = car.scrollWidth - car.clientWidth - 2;
          b.disabled = b.dataset.car === 'prev' ? car.scrollLeft <= 2 : car.scrollLeft >= last;
        });
      };
      $$('[data-car]').forEach(b => b.addEventListener('click', () => {
        car.scrollBy({ left: (b.dataset.car === 'next' ? 1 : -1) * car.clientWidth });
        setTimeout(ends, 450);
      }));
      watch(car, 'scroll', ends);
      watch(window, 'resize', ends);
      ends();
    } else {
      $('#saleSec').hidden = true;
    }

    /* увесь каталог просто на головній, з тими самими фільтрами */
    shop('#shop');

    /* клуби */
    $('#clubs').innerHTML = CLUBS.map(c => `<div class="club">
      <span class="crest">${esc(c.m)}</span>
      <span><b>${esc(c.n)}</b><span>${esc(c.d)}</span></span></div>`).join('');


    /* питання */
    $('#faq').innerHTML = FAQ.map(f => `<details><summary>${esc(f.q)}${icon('chev')}</summary><p>${esc(f.a)}</p></details>`).join('');

  }

  /* ===========================================================
     КАТАЛОГ
     =========================================================== */
  /* ===========================================================
     КАТАЛОГ. Панель керування + фільтри у висувній шухляді.
     Той самий блок монтується і на головній, і на katalog.html
     =========================================================== */
  function shop(sel) {
    const root = $(sel);
    if (!root) return;

    const url = new URL(location.href);
    const st = {
      q: url.searchParams.get('q') || '',
      cat: (url.searchParams.get('cat') || '').split(',').filter(Boolean),
      brand: [], size: [], min: '', max: '', sort: 'pop', view: 'grid'
    };
    const BRANDS = Array.from(new Set(SHOWN.map(p => p.brand).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'uk'));
    /* Взуттєві 44 упереміш з одяговими L читаються як каша, тому розміри
       стоять групами. Порожні групи не виводяться. */
    const SIZES = Array.from(new Set(SHOWN.flatMap(p => p.sizes))).sort(szCmp);
    const szBlocks = SZ_GROUPS.map(([label], gi) => {
      const list = SIZES.filter(s => szGroup(s) === gi);
      if (!list.length) return '';
      return `<div class="szgrp"><h4>${esc(label)}</h4><div class="szpick">`
        + list.map(s => `<button type="button" data-sz="${esc(s)}" aria-pressed="false">${esc(s)}</button>`).join('')
        + '</div></div>';
    }).join('');

    root.innerHTML = `
      <div class="catbar">
        <button class="btn btn--sm btn--gh" type="button" id="fltToggle" aria-expanded="false">${icon('filter')}Фільтри<b id="fltN"></b></button>
        <span class="mono" id="cnt"></span>
        <div class="catbar__r">
          <input class="catq" id="catQ" placeholder="Пошук за назвою" aria-label="Пошук за назвою">
          <span class="selwrap">
            <select class="sel" id="sort" aria-label="Сортування">
              <option value="pop">Спершу популярні</option>
              <option value="asc">Дешевші спершу</option>
              <option value="desc">Дорожчі спершу</option>
              <option value="sale">Найбільша знижка</option>
            </select>${icon('chev')}
          </span>
          <button class="iconbtn" type="button" id="viewToggle" aria-label="Показати списком">${icon('rows')}</button>
        </div>
      </div>
      <div class="act" id="act"></div>
      <div class="grid" id="grid"></div>
      <div class="more" id="more" hidden>
        <button class="btn btn--gh" type="button" id="moreBtn">Показати ще</button>
      </div>
      <div class="empty" id="none" hidden>
        <p class="dsp h-md" id="noneH">Під ці умови нічого немає</p>
        <p id="noneT">Приберіть частину фільтрів — або замовте пошук: дістанемо потрібну модель з європейських магазинів.</p>
        <button class="btn" type="button" id="nonewish">Скинути фільтри</button>
        <button class="btn" type="button" id="noneAgain" hidden>Оновити сторінку</button>
      </div>

      <div class="drw" id="drw">
        <div class="drw__bg" data-drwx></div>
        <aside class="drw__box" role="dialog" aria-modal="true" aria-label="Фільтри">
          <div class="drw__top">
            <p class="dsp h-sm">Фільтри</p>
            <button class="iconbtn" type="button" data-drwx aria-label="Закрити">${icon('close')}</button>
          </div>
          <div class="drw__body flt" id="flt">
            <div class="flt__g"><h3>Категорія</h3><div class="fltlist">
              ${CATS.map(c => `<label><input type="checkbox" data-k="cat" value="${c.id}"${st.cat.includes(c.id) ? ' checked' : ''}>${esc(c.name)}<i>${SHOWN.filter(p => p.cat === c.id).length}</i></label>`).join('')}</div>
            </div>
            <div class="flt__g"><h3>Бренд</h3><div class="fltlist">
              ${BRANDS.map(b => `<label><input type="checkbox" data-k="brand" value="${esc(b)}">${esc(b)}<i>${SHOWN.filter(p => p.brand === b).length}</i></label>`).join('')}</div>
            </div>
            <div class="flt__g"><h3>Розмір</h3>
              ${szBlocks}
            </div>
            <div class="flt__g"><h3>Ціна, грн</h3>
              <div class="prng"><input id="pMin" inputmode="numeric" placeholder="від"><span>—</span><input id="pMax" inputmode="numeric" placeholder="до"></div>
            </div>
          </div>
          <div class="drw__foot">
            <button class="btn btn--gh btn--sm" type="button" id="fltReset">Скинути</button>
            <button class="btn btn--sm" type="button" data-drwx id="fltShow">Показати</button>
          </div>
        </aside>
      </div>`;

    const q = $('#catQ');
    q.value = st.q;

    /* ---- шухляда ---- */
    const drw = $('#drw');
    const openDrw = () => {
      drw.classList.add('on');
      document.body.style.overflow = 'hidden';
      $('#fltToggle').setAttribute('aria-expanded', 'true');
    };
    const closeDrw = () => {
      drw.classList.remove('on');
      document.body.style.overflow = '';
      $('#fltToggle').setAttribute('aria-expanded', 'false');
    };
    $('#fltToggle').addEventListener('click', openDrw);
    drw.addEventListener('click', e => { if (e.target.closest('[data-drwx]')) closeDrw(); });
    watch(document, 'keydown', e => { if (e.key === 'Escape' && drw.classList.contains('on')) closeDrw(); });

    /* Каталог може бути на сотні позицій, тому малюємо порціями:
       перша порція одразу, решта — коли низ списку зʼявляється на екрані.
       Кнопка лишається як запасний шлях, якщо стеження не спрацює. */
    const STEP = 36;
    let found = [];
    let shown = 0;

    function draw(reset) {
      const g = $('#grid'), more = $('#more');
      if (reset) { g.innerHTML = ''; shown = 0; }
      const next = found.slice(shown, shown + STEP);
      if (next.length) g.insertAdjacentHTML('beforeend', next.map(card).join(''));
      shown += next.length;
      more.hidden = shown >= found.length;
    }

    function apply() {
      let list = SHOWN.slice();
      const s = norm(st.q);
      if (s) list = list.filter(p => hit(p, s));
      if (st.cat.length) list = list.filter(p => st.cat.includes(p.cat));
      if (st.brand.length) list = list.filter(p => st.brand.includes(p.brand));
      if (st.size.length) list = list.filter(p => p.sizes.some(x => st.size.includes(x)));
      if (st.min) list = list.filter(p => p.price >= +st.min);
      if (st.max) list = list.filter(p => p.price <= +st.max);

      const rank = { hit: 0, new: 1, last: 2, '': 3 };
      if (st.sort === 'asc') list.sort((a, b) => a.price - b.price);
      else if (st.sort === 'desc') list.sort((a, b) => b.price - a.price);
      else if (st.sort === 'sale') list.sort((a, b) => (b.old ? b.old - b.price : 0) - (a.old ? a.old - a.price : 0));
      else list.sort((a, b) => rank[a.tag] - rank[b.tag]);

      const g = $('#grid');
      g.className = 'grid' + (st.view === 'list' ? ' grid--list' : '');
      g.hidden = !list.length;
      $('#none').hidden = !!list.length;
      /* Порожньо буває з трьох причин: каталог ще їде, зовсім не доїхав
         або фільтри надто вузькі. Підписи в них різні: перше — почекати,
         друге — оновити сторінку, третє — послабити фільтри. */
      if (!list.length) {
        const bare = !PRODUCTS.length;
        const wait = bare && window.JS_SLOW;
        const fail = bare && window.JS_FAIL;
        $('#noneH').textContent = wait ? 'Завантажуємо каталог'
          : fail ? 'Каталог не завантажився' : 'Під ці умови нічого немає';
        $('#noneT').textContent = wait
          ? 'Хвилинку — тягнемо свіжі залишки й ціни.'
          : fail
            ? 'Схоже, урвався звʼязок. Товари на місці — оновіть сторінку, і вони зʼявляться.'
            : 'Приберіть частину фільтрів — або замовте пошук: дістанемо потрібну модель з європейських магазинів.';
        $('#nonewish').hidden = wait || fail;
        const again = $('#noneAgain');
        if (again) again.hidden = !fail;
      }
      found = list;
      draw(true);

      const word = list.length === 1 ? 'позиція'
        : list.length % 10 > 1 && list.length % 10 < 5 && (list.length < 10 || list.length > 20) ? 'позиції' : 'позицій';
      $('#cnt').textContent = list.length + ' ' + word;
      $('#fltShow').textContent = 'Показати ' + list.length;

      /* активні фільтри */
      const chipsArr = [];
      if (st.q) chipsArr.push(['q', '«' + st.q + '»']);
      st.cat.forEach(c => chipsArr.push(['cat:' + c, catName(c)]));
      st.brand.forEach(b => chipsArr.push(['brand:' + b, b]));
      st.size.forEach(x => chipsArr.push(['size:' + x, 'розмір ' + x]));
      if (st.min) chipsArr.push(['min', 'від ' + st.min]);
      if (st.max) chipsArr.push(['max', 'до ' + st.max]);
      $('#act').innerHTML = chipsArr.length
        ? chipsArr.map(([k, n]) => `<button type="button" data-drop="${esc(k)}">${esc(n)}${icon('close')}</button>`).join('') + '<button type="button" data-drop="all">Скинути все</button>'
        : '';
      $('#fltN').textContent = chipsArr.length || '';

      const u = new URL(location.href);
      u.search = '';
      if (st.q) u.searchParams.set('q', st.q);
      if (st.cat.length) u.searchParams.set('cat', st.cat.join(','));
      history.replaceState(null, '', u);
    }

    function resetAll() {
      st.q = ''; st.cat = []; st.brand = []; st.size = []; st.min = ''; st.max = '';
      $$('#flt input[type=checkbox]').forEach(i => { i.checked = false; });
      $$('#flt [data-sz]').forEach(i => i.setAttribute('aria-pressed', 'false'));
      $('#pMin').value = ''; $('#pMax').value = ''; q.value = '';
      apply();
    }

    $('#flt').addEventListener('change', e => {
      const k = e.target.dataset.k;
      if (!k) return;
      const v = e.target.value;
      st[k] = e.target.checked ? st[k].concat(v) : st[k].filter(x => x !== v);
      apply();
    });
    $('#flt').addEventListener('click', e => {
      const b = e.target.closest('[data-sz]');
      if (!b) return;
      const v = b.dataset.sz, on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', String(on));
      st.size = on ? st.size.concat(v) : st.size.filter(x => x !== v);
      apply();
    });
    let pt = 0;
    $('#flt').addEventListener('input', e => {
      if (e.target.id !== 'pMin' && e.target.id !== 'pMax') return;
      clearTimeout(pt);
      pt = setTimeout(() => { st.min = $('#pMin').value.replace(/\D/g, ''); st.max = $('#pMax').value.replace(/\D/g, ''); apply(); }, 320);
    });
    $('#act').addEventListener('click', e => {
      const b = e.target.closest('[data-drop]');
      if (!b) return;
      const k = b.dataset.drop;
      if (k === 'all') { resetAll(); return; }
      if (k === 'q') { st.q = ''; q.value = ''; }
      else if (k === 'min') { st.min = ''; $('#pMin').value = ''; }
      else if (k === 'max') { st.max = ''; $('#pMax').value = ''; }
      else {
        const g = k.slice(0, k.indexOf(':')), v = k.slice(k.indexOf(':') + 1);
        st[g] = st[g].filter(x => x !== v);
        if (g === 'size') $$('#flt [data-sz]').forEach(i => { if (i.dataset.sz === v) i.setAttribute('aria-pressed', 'false'); });
        else $$('#flt input[data-k=' + g + ']').forEach(i => { if (i.value === v) i.checked = false; });
      }
      apply();
    });
    let qt = 0;
    q.addEventListener('input', () => { clearTimeout(qt); qt = setTimeout(() => { st.q = q.value; apply(); }, 260); });
    $('#sort').addEventListener('change', e => { st.sort = e.target.value; apply(); });
    // один перемикач: натиснув — список, натиснув ще раз — назад у сітку
    $('#viewToggle').addEventListener('click', e => {
      st.view = st.view === 'grid' ? 'list' : 'grid';
      const inList = st.view === 'list';
      e.currentTarget.innerHTML = icon(inList ? 'grid' : 'rows');
      e.currentTarget.setAttribute('aria-label', inList ? 'Показати сіткою' : 'Показати списком');
      apply();
    });
    $('#moreBtn').addEventListener('click', () => draw(false));
    /* Довантаження на ходу. Основний шлях — спостерігач за низом списку;
       поруч простий перегляд при прокрутці, бо в деяких оболонках
       (вбудовані браузери застосунків) спостерігач мовчить. */
    const maybeMore = () => {
      const more = $('#more');
      if (!more || more.hidden) return;
      const top = more.getBoundingClientRect().top;
      if (top < innerHeight + 600) draw(false);
    };
    watch(window, 'scroll', maybeMore, { passive: true });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(e => {
        if (e[0].isIntersecting && !$('#more').hidden) draw(false);
      }, { rootMargin: '600px 0px' }).observe($('#more'));
    }
    $('#fltReset').addEventListener('click', resetAll);
    $('#nonewish').addEventListener('click', resetAll);
    $('#noneAgain').addEventListener('click', () => location.reload());

    apply();
  }

  /* ===========================================================
     ТОВАР
     =========================================================== */
  function product() {
    const id = new URL(location.href).searchParams.get('id');
    const p = byId(id);
    const root = $('#pdp');
    if (!p) {
      root.innerHTML = `<div class="empty"><p class="dsp h-md">Такої позиції немає</p><p>Можливо, вона вже поїхала до власника. Подивіться каталог або замовте пошук.</p><a class="btn" href="katalog.html">У каталог ${icon('arrow')}</a></div>`;
      return;
    }
    document.title = (p.brand ? p.brand + ' ' : '') + p.name + ' — Just shop';
    let size = '';
    const gone = outOfStock(p);                 // усе розпродано
    const sizeGone = s => avail(p, s) <= 0;
    // один розмір на позицію — обирати нема з чого, ставимо одразу
    const oneSize = p.sizes.length === 1;
    if (oneSize) size = p.sizes[0];
    // головне фото плюс «Ще фото» — під плиткою стають маленькі квадратики
    const shots = [p.img].concat(p.pics || []).filter(Boolean);
    const showTable = p.cat !== 'aksesuary' && !/^(one size|універсальний)$/i.test(p.sizes[0] || '');

    root.innerHTML = `
      <div class="pdp__media">
        <div class="shot" id="shot">
          ${plate(p, { sizes: false, pics: shots })}
          ${shots.length > 1 ? `
          <button class="shot__a shot__a--p" type="button" id="shotP" aria-label="Попереднє фото">${icon('chev')}</button>
          <button class="shot__a shot__a--n" type="button" id="shotN" aria-label="Наступне фото">${icon('chev')}</button>` : ''}
        </div>
        ${shots.length > 1 ? `<div class="shots" id="shots">${shots.map((u, i) => `<button type="button" class="shots__b${i ? '' : ' on'}" data-u="${esc(u)}" aria-label="Фото ${i + 1}"><img src="${esc(u)}" alt=""></button>`).join('')}</div>` : ''}
      </div>
      <div>
        <nav class="mono" style="color:var(--mut);margin-bottom:14px"><a href="katalog.html">Каталог</a> / <a href="katalog.html?cat=${p.cat}">${esc(catName(p.cat))}</a></nav>
        <span class="pdp__brand">${p.brand ? esc(p.brand) + ' · ' : ''}${sku(p)}</span>
        <h1>${esc(p.name)}</h1>
        <p class="price">${money(p.price)}${p.old ? `<s>${money(p.old)}</s><em>−${Math.round((1 - p.price / p.old) * 100)}%</em>` : ''}</p>
        <p class="stock${p.stock === false || gone ? ' stock--out' : ''}"><i></i>${stockLine(p)}</p>
        <p class="pdp__desc">${esc(p.desc)}</p>
        <div class="pick">
          <div class="pick__h"><span>Розмір</span></div>
          ${oneSize
            ? `<p class="onesize">${esc(p.sizes[0])}</p>`
            : `<div class="szpick" id="szPick">${p.sizes.map(s => `<button type="button" data-s="${esc(s)}" aria-pressed="false"${sizeGone(s) ? ' disabled title="Немає в наявності"' : ''}>${esc(s)}</button>`).join('')}</div>
          <p class="fmsg" id="szMsg"></p>`}
          ${showTable ? `<button class="szlink" type="button" data-sizes="${sizeKind(p)}">${icon('ruler')}Таблиця розмірів</button>` : ''}
        </div>
        <div class="pdp__cta">
          ${p.stock === false || gone
            ? `<a class="btn btn--wide" id="ask" href="${esc(CFG.tg)}" target="_blank" rel="noopener">Запитати в Telegram ${icon('tg')}</a>`
            : `<button class="btn btn--wide" id="add">Додати в кошик ${icon('cart')}</button>`}
        </div>
        <ul class="usp">
          <li>${icon('shield')}<span><b>Оригінал із перевіркою</b><span>Фото бірок, коробки й чека надсилаємо до відправлення.</span></span></li>
          <li>${icon('truck')}<span><b>Нова Пошта по Україні</b><span>${CFG.freeFrom ? 'Від ' + money(CFG.freeFrom) + ' — доставка за наш рахунок. ' : ''}Відправлення в день оплати.</span></span></li>
          <li>${icon('box')}<span><b>Самовивіз у Києві</b><span>${esc(CFG.pickup)}</span></span></li>
          <li>${icon('clock')}<span><b>Обмін 14 днів</b><span>Якщо річ не носили й бірки на місці.</span></span></li>
        </ul>
      </div>`;

    /* Гортання фото: стрілки на самому знімку, мініатюри під ним,
       палець убік на телефоні й стрілки клавіатури. Перший і останній
       кадри замикаються в коло, щоб гортання не впиралося. */
    let shot = 0;
    const track = $('#track');
    const thumbs = $$('#shots [data-u]');
    const box = $('#shot');
    /* Кадри стоять поруч однією стрічкою, і ми зсуваємо її вбік. Тож
       сусідній знімок виїжджає одразу за попереднім — без порожнечі
       між ними, як гортають фото в телефоні. */
    const slide = (px, smooth) => {
      if (!track) return;
      track.style.transition = smooth ? '' : 'none';
      track.style.transform = 'translateX(' + px + ')';
    };
    const show = i => {
      if (shots.length < 2) return;
      shot = (i + shots.length) % shots.length;
      thumbs.forEach((x, k) => x.classList.toggle('on', k === shot));
      slide(-shot * 100 + '%', true);
    };
    const shotsBox = $('#shots');
    if (shotsBox) shotsBox.addEventListener('click', e => {
      const b = e.target.closest('[data-u]');
      if (b) show(thumbs.indexOf(b));
    });
    const prev = $('#shotP'), next = $('#shotN');
    if (prev) prev.addEventListener('click', () => show(shot - 1));
    if (next) next.addEventListener('click', () => show(shot + 1));
    const shotBox = box;
    if (shotBox && shots.length > 1) {
      let x0 = 0, y0 = 0, dx = 0, lock = '', swiped = false;
      shotBox.addEventListener('touchstart', e => {
        x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
        dx = 0; lock = ''; swiped = false;
      }, { passive: true });
      shotBox.addEventListener('touchmove', e => {
        const mx = e.touches[0].clientX - x0, my = e.touches[0].clientY - y0;
        // перший помітний рух вирішує: гортаємо фото чи крутимо сторінку
        if (!lock && (Math.abs(mx) > 8 || Math.abs(my) > 8)) lock = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
        if (lock !== 'x') return;
        if (shotBox.classList.contains('is-zoom')) return;   // наближене фото тягають, не гортають
        dx = mx;
        slide('calc(' + (-shot * 100) + '% + ' + Math.round(dx) + 'px)', false);
      }, { passive: true });
      shotBox.addEventListener('touchend', () => {
        if (lock !== 'x') return;
        const w = shotBox.offsetWidth || 1;
        // чверті ширини досить, щоб зрозуміти намір
        if (Math.abs(dx) > Math.min(70, w * 0.25)) { swiped = true; show(shot + (dx < 0 ? 1 : -1)); }
        else slide(-shot * 100 + '%', true);
      }, { passive: true });
      /* Натиск по самому фото прибирає стрілки, щоб не затуляли річ.
         Ще один натиск — і вони повертаються. */
      shotBox.addEventListener('click', e => {
        if (e.target.closest('.shot__a')) return;
        if (swiped) { swiped = false; return; }
        shotBox.classList.toggle('is-bare');
      });
      watch(document, 'keydown', e => {
        if (e.target.matches('input, textarea, select')) return;
        if (e.key === 'ArrowLeft') show(shot - 1);
        if (e.key === 'ArrowRight') show(shot + 1);
      });
    }

    /* ---------- приближення ----------
       На комп'ютері: ведеш мишею по фото — воно наближається в тій
       точці, де курсор. Так дивляться фактуру тканини й шви.
       На телефоні: розводиш двома пальцями. Поки наближено, один
       палець тягає кадр, а не гортає — інакше не роздивитись. */
    if (shotBox) {
      const pic = () => track ? track.children[shot] : $('.pdp__media .plate img');
      let zoom = 1, px = 0, py = 0;
      const put = () => {
        const im = pic();
        if (!im) return;
        im.style.transition = zoom === 1 ? 'transform .25s' : 'none';
        im.style.transform = zoom === 1 ? '' : 'translate(' + px + 'px,' + py + 'px) scale(' + zoom + ')';
        shotBox.classList.toggle('is-zoom', zoom > 1);
      };
      const reset = () => { zoom = 1; px = 0; py = 0; put(); };

      /* мишею */
      if (matchMedia('(hover:hover)').matches) {
        shotBox.addEventListener('mousemove', e => {
          const im = pic();
          if (!im) return;
          const r = shotBox.getBoundingClientRect();
          const fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
          im.style.transition = 'none';
          im.style.transformOrigin = (fx * 100) + '% ' + (fy * 100) + '%';
          im.style.transform = 'scale(2.2)';
          shotBox.classList.add('is-zoom');
        });
        shotBox.addEventListener('mouseleave', () => {
          const im = pic();
          if (im) { im.style.transition = 'transform .25s'; im.style.transformOrigin = ''; im.style.transform = ''; }
          shotBox.classList.remove('is-zoom');
        });
      }

      /* пальцями */
      let d0 = 0, z0 = 1, mx = 0, my = 0, px0 = 0, py0 = 0;
      const gap = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
      shotBox.addEventListener('touchstart', e => {
        if (e.touches.length === 2) { d0 = gap(e.touches); z0 = zoom; }
        else if (zoom > 1) { mx = e.touches[0].clientX; my = e.touches[0].clientY; px0 = px; py0 = py; }
      }, { passive: true });
      shotBox.addEventListener('touchmove', e => {
        if (e.touches.length === 2 && d0) {
          zoom = Math.min(3.5, Math.max(1, z0 * gap(e.touches) / d0));
          if (zoom === 1) { px = 0; py = 0; }
          put();
        } else if (e.touches.length === 1 && zoom > 1) {
          const r = shotBox.getBoundingClientRect();
          const lim = (r.width * (zoom - 1)) / 2;
          px = Math.max(-lim, Math.min(lim, px0 + e.touches[0].clientX - mx));
          py = Math.max(-lim, Math.min(lim, py0 + e.touches[0].clientY - my));
          put();
        }
      }, { passive: true });
      shotBox.addEventListener('touchend', e => {
        if (!e.touches.length) { d0 = 0; if (zoom < 1.1) reset(); }
      }, { passive: true });
      /* гортання й ховання стрілок поки наближено не чіпаємо */
      shotBox.addEventListener('click', e => { if (zoom > 1) e.stopPropagation(); }, true);
    }

    const szPick = $('#szPick');
    if (szPick) szPick.addEventListener('click', e => {
      const b = e.target.closest('[data-s]');
      if (!b) return;
      size = b.dataset.s;
      szPick.classList.remove('szpick--ask');
      const ask = $('#szMsg');
      if (ask) ask.classList.remove('fmsg--ask');
      $$('#szPick [data-s]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      // останні одиниці варто показати ще до кошика
      $('#szMsg').textContent = lowLeft(p, size) ? 'Залишилось ' + avail(p, size) : '';
    });
    const cta = $('#add') || $('#ask');
    if (cta.id === 'add') {
      cta.addEventListener('click', () => {
        if (!size) {
          /* Тиха сіра підказка лишалась непоміченою — людина тиснула
             кнопку ще раз і думала, що кошик зламаний. */
          const m = $('#szMsg');
          if (m) { m.textContent = 'Спершу оберіть розмір'; m.classList.add('fmsg--ask'); }
          if (szPick) {
            szPick.classList.remove('szpick--ask');
            void szPick.offsetWidth;            // щоб тремтіння повторилось на другий натиск
            szPick.classList.add('szpick--ask');
            szPick.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
          toast('Ви не обрали розмір');
          return;
        }
        // у кошику може вже лежати остання одиниця цього ж розміру
        const n = avail(p, size);
        if (inCart(p.id, size) + 1 > n) {
          const msg = n === 0 ? 'Цього розміру вже немає' : 'Більше немає: на складі ' + n;
          if ($('#szMsg')) $('#szMsg').textContent = msg; else toast(msg);
          return;
        }
        addToCart(p.id, size, 1);
        toast('Додано в кошик · ' + size);
      });
    }

    const near = SHOWN.filter(x => x.id !== p.id && (x.cat === p.cat || x.brand === p.brand)).slice(0, 4);
    if (near.length) $('#near').innerHTML = near.map(card).join('');
    else $('#nearSec').hidden = true;

  }

  /* ===========================================================
     НОВА ПОШТА
     =========================================================== */
  const NP_URL = 'https://api.novaposhta.ua/v2.0/json/';
  const NP_TYPE = {
    np_branch: '841339c7-591a-42e2-8233-7a0a00f0ed6f',
    np_postomat: 'f9316480-5f2d-425d-bc2c-ac7cd29decf0'
  };
  let npDown = false;

  function npCall(modelName, calledMethod, methodProperties) {
    return fetch(NP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: CFG.npApiKey || '', modelName, calledMethod, methodProperties })
    }).then(r => r.json())
      .catch(err => { npDown = true; throw err; })
      .then(j => {
        npDown = false;
        if (!j.success) throw new Error((j.errors || []).join(', ') || 'np');
        return j.data || [];
      });
  }

  /* випадний список під полем */
  function autocomplete(input, opts) {
    const list = document.createElement('ul');
    list.className = 'ac';
    list.hidden = true;
    input.insertAdjacentElement('afterend', list);
    let timer = 0, reqId = 0, rows = [], active = -1;

    const close = () => { list.hidden = true; active = -1; };
    const show = (data, msg) => {
      rows = data || [];
      active = -1;
      list.innerHTML = msg
        ? `<li class="ac__msg">${esc(msg)}</li>`
        : rows.map((r, i) => `<li class="ac__item" data-i="${i}"><b>${esc(r.title)}</b>${r.sub ? `<small>${esc(r.sub)}</small>` : ''}</li>`).join('');
      list.hidden = false;
    };
    const run = () => {
      const q = (opts.query ? opts.query(input.value) : input.value.trim());
      if (q.length < (opts.min == null ? 2 : opts.min)) { close(); return; }
      const my = ++reqId;
      show([], 'Шукаємо…');
      opts.load(q).then(data => {
        if (my !== reqId) return;
        data.length ? show(data) : show([], 'Нічого не знайшли');
      }).catch(err => {
        if (my !== reqId) return;
        show([], err && err.msg ? err.msg : 'Нова Пошта не відповідає — впишіть вручну');
        if (opts.onError) opts.onError();
      });
    };
    input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(run, 260); });
    input.addEventListener('focus', () => { if (opts.min === 0 || input.value.trim().length >= 2) run(); });
    input.addEventListener('blur', () => setTimeout(close, 180));
    input.addEventListener('keydown', e => {
      if (list.hidden || !rows.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        active = (active + (e.key === 'ArrowDown' ? 1 : rows.length - 1)) % rows.length;
        $$('.ac__item', list).forEach((el, i) => el.classList.toggle('on', i === active));
      } else if (e.key === 'Enter' && active > -1) {
        e.preventDefault();
        opts.pick(rows[active]); close();
      } else if (e.key === 'Escape') close();
    });
    list.addEventListener('mousedown', e => {
      const it = e.target.closest('.ac__item');
      if (!it) return;
      e.preventDefault();
      opts.pick(rows[+it.dataset.i]);
      close();
    });
    return { close };
  }

  /* ===========================================================
     КОШИК І ОФОРМЛЕННЯ
     =========================================================== */
  const DLV = [
    { id: 'np_branch', n: 'Відділення Нової Пошти', d: 'Приїде за 1—2 дні по Україні', c: 'За тарифом НП' },
    { id: 'np_postomat', n: 'Поштомат Нової Пошти', d: 'Заберете, коли зручно, цілодобово', c: 'За тарифом НП' },
    { id: 'np_courier', n: 'Курʼєр Нової Пошти', d: 'Привезуть на вашу адресу', c: 'За тарифом НП' },
    { id: 'pickup', n: 'Самовивіз, Київ', d: 'Адресу надсилаємо після підтвердження', c: '0 грн' }
  ];
  const PAY = [
    { id: 'card', n: 'На картку ФОП', d: 'Реквізити надішлемо після підтвердження', for: 'all' },
    { id: 'cod', n: 'Наложений платіж', d: 'Оплата при отриманні, комісію бере НП', for: 'np' },
    { id: 'cash', n: 'Готівкою при самовивозі', d: 'Розрахунок на місці', for: 'pickup' }
  ];

  function checkout() {
    /* ---------- резерв на час оформлення ----------
       Поки покупець заповнює форму, його позиції відкладені в базі:
       інакше двоє можуть купити останню одиницю. Якщо оформлення так
       і не сталось, база сама поверне товар у продаж через 15 хвилин. */
    const TOKEN_KEY = 'js_cart_token';
    const token = () => {
      let t = '';
      try { t = localStorage.getItem(TOKEN_KEY) || ''; } catch (e) {}
      if (!/^[0-9a-f-]{36}$/i.test(t)) {
        t = (self.crypto && crypto.randomUUID) ? crypto.randomUUID()
          : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 3 | 8)).toString(16);
          });
        try { localStorage.setItem(TOKEN_KEY, t); } catch (e) {}
      }
      return t;
    };

    // позиції у вигляді, зрозумілому базі: номер товару й розмір так,
    // як він записаний на складі
    const orderLines = () => cart.map(l => {
      const p = byId(l.id);
      if (!p || !p.itemId) return null;
      return {
        item_id: p.itemId,
        size: dbSize(p, l.size),
        color: '',
        qty: l.qty,
        title: (p.brand ? p.brand + ' ' : '') + p.name,
        price: p.price
      };
    }).filter(Boolean);

    let holdTimer = 0;
    let holdTries = 0;
    let sending = false;
    function hold() {
      const db = window.JS_DB;
      if (!db || !orderLines().length) return;
      clearTimeout(holdTimer);
      holdTimer = setTimeout(() => {
        db.rpc('stock_hold', { p_site: db.id, p_token: token(), p_lines: orderLines() })
          .then(res => {
            if (!res || res.ok !== false) { holdTries = 0; return; }
            if (res.short && holdTries++ < 3) applyShort(res.short);
          })
          .catch(() => {});
      }, 350);
    }
    const unhold = keep => {
      const db = window.JS_DB;
      if (db) db.rpc('stock_unhold', { p_token: token() }, keep).catch(() => {});
    };

    /* База сказала, чого не вистачає — приводимо кошик до того,
       що справді лежить на складі, і кажемо про це покупцю. */
    function applyShort(short) {
      let msg = '';
      (short || []).forEach(s => {
        const p = PRODUCTS.find(x => x.itemId === Number(s.item_id));
        if (!p) return;
        const size = tidySize(s.size) || '';
        const left = Math.max(0, Number(s.left) || 0);
        if (p.stk) p.stk[size] = left;
        for (let i = cart.length - 1; i >= 0; i--) {
          const l = cart[i];
          if (l.id !== p.id || l.size !== size) continue;
          if (left === 0) { cart.splice(i, 1); msg = 'Розмір ' + size + ' щойно забрали'; }
          else if (l.qty > left) { l.qty = left; msg = 'Лишилось ' + left + ' — кількість зменшили'; }
        }
      });
      writeCart(cart);
      paint();
      if (msg) toast(msg);
      hold();
    }

    const form = {
      dlv: 'np_branch', pay: 'card',
      cityRef: '', cityName: '', brRef: '', brName: ''
    };
    const isNP = () => form.dlv.indexOf('np_') === 0;
    const isBranch = () => form.dlv === 'np_branch' || form.dlv === 'np_postomat';

    function lines() {
      return cart.map((l, i) => {
        const p = byId(l.id);
        return `<div class="line">
          ${plate(p, { meta: false, tag: false })}
          <div class="line__b">
            <div class="line__t">
              <div><h3><a href="tovar.html?id=${p.id}">${esc(p.brand)} ${esc(p.name)}</a></h3>
                <p class="line__m">Розмір ${esc(l.size)} · ${sku(p)}</p></div>
              <span class="line__p">${money(p.price * l.qty)}</span>
            </div>
            <div class="line__f">
              <div class="qty">
                <button type="button" data-q="-" data-i="${i}" aria-label="Менше">${icon('minus')}</button>
                <span>${l.qty}</span>
                <button type="button" data-q="+" data-i="${i}" aria-label="Більше">${icon('plus')}</button>
              </div>
              <button type="button" class="line__x" data-del="${i}">Прибрати</button>
            </div>
          </div>
        </div>`;
      }).join('');
    }

    function paint() {
      const wrap = $('#co');
      if (!cart.length) {
        wrap.innerHTML = `<div class="empty">
          <p class="dsp h-md">Кошик порожній</p>
          <p>Оберіть щось у каталозі — усе, що є в наявності, їде Новою Поштою наступного дня.</p>
          <div class="done__cta"><a class="btn" href="katalog.html">У каталог ${icon('arrow')}</a></div></div>`;
        return;
      }
      wrap.innerHTML = `
        <div id="lines">${lines()}</div>

        <form class="co2" id="ord" novalidate>
          <h2 class="co2__h">Оформлення замовлення</h2>
          <div class="co2__g">
            <section class="co2__c">
              <h3>Дані покупця</h3>
              <div class="f"><label for="fName">Імʼя та прізвище</label><input id="fName" autocomplete="name" placeholder="Введіть ПІБ"><p class="fmsg"></p></div>
              <div class="f"><label for="fTel">Телефон</label><input id="fTel" inputmode="tel" autocomplete="tel" value="+380 "><p class="fmsg"></p></div>
              <div class="f"><label for="fNote">Коментар до замовлення</label><input id="fNote" placeholder="Необовʼязково"></div>
            </section>

            <section class="co2__c">
              <h3>Доставка</h3>
              <div class="f">
                <label for="fDlv">Спосіб доставки</label>
                <span class="selwrap selwrap--line">
                  <select class="sel sel--line" id="fDlv">${DLV.map(d => `<option value="${d.id}"${d.id === form.dlv ? ' selected' : ''}>${esc(d.n)}</option>`).join('')}</select>
                  ${icon('chev')}
                </span>
              </div>
              <div id="npFields"></div>
            </section>

            <section class="co2__c">
              <h3>Оплата</h3>
              <div class="pays" id="pay"></div>
              <p class="co2__note" id="sNote"></p>
            </section>
          </div>
        </form>

        <div class="co2__foot">
          <div class="co2__tot">
            <span>Товари, ${cartCount()} шт.<b id="sSub"></b></span>
            <span>Доставка<b id="sDlv"></b></span>
            <span class="co2__big">До сплати<b id="sTot"></b></span>
          </div>
          <button class="btn" type="submit" form="ord">Оформити замовлення ${icon('arrow')}</button>
        </div>`;

      $('#lines').addEventListener('click', e => {
        const q = e.target.closest('[data-q]'), d = e.target.closest('[data-del]');
        if (q) {
          const i = +q.dataset.i;
          cart[i].qty += q.dataset.q === '+' ? 1 : -1;
          if (cart[i].qty < 1) cart.splice(i, 1);
          writeCart(cart); paint(); hold();
        } else if (d) {
          cart.splice(+d.dataset.del, 1);
          writeCart(cart); paint(); hold();
        }
      });
      addEventListener('pagehide', () => unhold(true), { once: true });
      $('#fDlv').addEventListener('change', e => {
        form.dlv = e.target.value;
        npFields(); payOpts(); totals();
      });
      $('#ord').addEventListener('submit', submit);
      npFields(); payOpts(); totals();
      hold();
    }

    function npFields() {
      const box = $('#npFields');
      if (form.dlv === 'pickup') {
        box.innerHTML = `<p class="co2__note">${esc(CFG.pickup)}. Напишемо, щойно замовлення буде готове.</p>`;
        return;
      }
      const label = form.dlv === 'np_postomat' ? 'Поштомат' : form.dlv === 'np_courier' ? 'Адреса доставки' : 'Відділення';
      box.innerHTML = `
        <div class="f"><label for="fCity">Місто</label><input id="fCity" autocomplete="off" placeholder="Почніть вводити назву"><p class="fmsg"></p></div>
        <div class="f"><label for="fBr">${label}</label><input id="fBr" autocomplete="off" placeholder="${form.dlv === 'np_courier' ? 'Вулиця, будинок, квартира' : 'Номер або адреса'}"><p class="fmsg"></p>
          <p class="fhint" id="brHint"></p></div>`;

      const city = $('#fCity'), br = $('#fBr');
      city.value = form.cityName;
      br.value = form.brName;

      city.addEventListener('input', () => {
        if (city.value.trim() !== form.cityName) { form.cityRef = ''; form.cityName = ''; form.brRef = ''; form.brName = ''; br.value = ''; }
      });
      br.addEventListener('input', () => { if (br.value.trim() !== form.brName) { form.brRef = ''; form.brName = br.value.trim(); } });

      const hint = $('#brHint');
      const setHint = () => {
        hint.textContent = npDown
          ? 'Нова Пошта не відповідає — впишіть дані вручну, ми перевіримо при підтвердженні.'
          : (form.dlv === 'np_courier' ? 'Підʼїзд і поверх вкажіть у коментарі.' : 'Оберіть зі списку — так дані збігатимуться з накладною.');
      };
      setHint();

      autocomplete(city, {
        min: 2,
        load: q => npCall('Address', 'searchSettlements', { CityName: q, Limit: '20', Page: '1' })
          .then(d => ((d[0] && d[0].Addresses) || [])
            .filter(a => Number(a.Warehouses) > 0)
            .map(a => ({ title: a.MainDescription, sub: a.Present, value: a.Present, ref: a.DeliveryCity }))),
        pick: r => { form.cityRef = r.ref; form.cityName = r.value; city.value = r.value; fieldBad(city, ''); br.focus(); },
        onError: setHint
      });

      if (isBranch()) {
        autocomplete(br, {
          min: 0,
          query: v => v.trim(),
          load: q => {
            if (!form.cityRef) return Promise.reject(Object.assign(new Error('nocity'), { msg: 'Спершу оберіть місто зі списку' }));
            if (form.dlv === 'np_postomat' && !q) return Promise.reject(Object.assign(new Error('hint'), { msg: 'Введіть номер поштомата або вулицю' }));
            const num = /^\s*№?\s*\d+\s*$/.test(q) ? q.replace(/\D/g, '') : '';
            const base = { CityRef: form.cityRef, Limit: '60', Page: '1', Language: 'UA', TypeOfWarehouseRef: NP_TYPE[form.dlv] };
            return Promise.all([
              npCall('AddressGeneral', 'getWarehouses', Object.assign({}, base, { FindByString: q })),
              num ? npCall('AddressGeneral', 'getWarehouses', Object.assign({}, base, { WarehouseId: num })).catch(() => []) : []
            ]).then(([found, exact]) => {
              const seen = new Set();
              const res = w => /тільки для мешканців/i.test(w.Description);
              return exact.filter(w => String(w.Number) === num).concat(found)
                .filter(w => !seen.has(w.Ref) && seen.add(w.Ref))
                .sort((a, b) => res(a) - res(b))
                .map(w => ({ title: w.Description, sub: res(w) ? 'лише для мешканців будинку' : '', value: w.Description, ref: w.Ref }));
            });
          },
          pick: r => { form.brRef = r.ref; form.brName = r.value; br.value = r.value; fieldBad(br, ''); },
          onError: setHint
        });
      }
    }

    function payOpts() {
      const av = PAY.filter(p => p.for === 'all' || (p.for === 'np' && isNP()) || (p.for === 'pickup' && form.dlv === 'pickup'));
      if (!av.some(p => p.id === form.pay)) form.pay = av[0].id;
      $('#pay').innerHTML = av.map(p => `<label class="pay">
        <input type="radio" name="pay" value="${p.id}"${p.id === form.pay ? ' checked' : ''}>
        <span><b>${esc(p.n)}</b><em>${esc(p.d)}</em></span>
      </label>`).join('');
      $('#pay').onchange = e => { form.pay = e.target.value; totals(); };
    }

    function totals() {
      const sub = cartSum();
      const free = CFG.freeFrom && sub >= CFG.freeFrom;
      $('#sSub').textContent = money(sub);
      $('#sDlv').textContent = form.dlv === 'pickup' ? 'Безкоштовно' : free ? 'За наш рахунок' : 'За тарифом НП';
      $('#sTot').textContent = money(sub);
      const notes = [];
      if (isNP() && !free) notes.push('Доставку рахує Нова Пошта за своїм тарифом — оплачується при отриманні.');
      if (isNP() && free) notes.push('Сума понад ' + money(CFG.freeFrom) + ' — доставку Новою Поштою оплачуємо ми.');
      if (form.pay === 'cod') notes.push('За наложений платіж Нова Пошта бере власну комісію.');
      if (form.pay === 'card') notes.push('Реквізити надішлемо після підтвердження наявності.');
      $('#sNote').textContent = notes.join(' ');
    }

    async function submit(e) {
      e.preventDefault();
      const name = $('#fName'), tel = $('#fTel');
      let ok = true;
      ok = fieldBad(name, name.value.trim().length > 1 ? '' : 'Вкажіть імʼя') && ok;
      ok = fieldBad(tel, tel.value.replace(/\D/g, '').length >= 11 ? '' : 'Перевірте номер телефону') && ok;
      if (form.dlv !== 'pickup') {
        const city = $('#fCity'), br = $('#fBr');
        ok = fieldBad(city, city.value.trim().length > 1 ? '' : 'Вкажіть місто') && ok;
        ok = fieldBad(br, br.value.trim().length > 0 ? '' : 'Вкажіть, куди доставити') && ok;
      }
      if (!ok) { const bad = $('.f.bad input'); if (bad) bad.focus(); return; }

      const d = DLV.find(x => x.id === form.dlv), p = PAY.find(x => x.id === form.pay);

      /* Спершу замовлення йде в базу: там воно ще раз перевіряє залишки,
         списує товар зі складу й отримує свій номер. Бази немає або вона
         мовчить — сайт працює як раніше, просто без обліку. */
      let no = 'JS' + String(Date.now()).slice(-6);
      const db = window.JS_DB;
      const dbLines = orderLines();
      if (db && dbLines.length) {
        if (sending) return;
        sending = true;
        const btn = $('button[form=ord]');
        const label = btn ? btn.innerHTML : '';
        if (btn) { btn.disabled = true; btn.textContent = 'Оформлюю…'; }
        let res = null;
        try {
          res = await db.rpc('place_order', {
            p_site: db.id,
            p_token: token(),
            p_lines: dbLines,
            p_customer: {
              name: $('#fName').value.trim(),
              phone: $('#fTel').value.trim(),
              city: form.dlv === 'pickup' ? '' : $('#fCity').value.trim(),
              branch: form.dlv === 'pickup' ? '' : $('#fBr').value.trim(),
              delivery: d.n,
              pay: p.n,
              comment: $('#fNote').value.trim()
            },
            p_total: Math.round(cartSum())
          });
        } catch (err) { res = null; }
        sending = false;
        if (btn) { btn.disabled = false; btn.innerHTML = label; }
        if (res && res.ok === false && res.short) {
          applyShort(res.short);
          toast('Щось уже забрали — перевірте кошик');
          return;
        }
        if (res && res.ref) no = res.ref;
      }
      const text = ['ЗАМОВЛЕННЯ ' + no, ''].concat(
        cart.map(l => { const it = byId(l.id); return '• ' + it.brand + ' ' + it.name + ' / ' + l.size + ' × ' + l.qty + ' — ' + Math.round(it.price * l.qty) + ' грн'; })
      ).concat([
        '', 'Сума: ' + Math.round(cartSum()) + ' грн',
        'Доставка: ' + d.n + (form.dlv === 'pickup' ? '' : ' — ' + $('#fCity').value.trim() + ', ' + $('#fBr').value.trim()),
        'Оплата: ' + p.n,
        'Отримувач: ' + $('#fName').value.trim() + ', ' + $('#fTel').value.trim(),
        $('#fNote').value.trim() ? 'Коментар: ' + $('#fNote').value.trim() : ''
      ]).filter(x => x !== '').join('\n');

      /* Розібране замовлення для бота: типи доставки НП підписані так,
         як їх називає сама НП, а коди міста й відділення вже перевірені. */
      const NP_SERVICE = { np_branch: 'WarehouseWarehouse', np_postomat: 'WarehouseWarehouse', np_courier: 'WarehouseDoors' };
      const goods = cart.map(l => {
        const it = byId(l.id);
        return {
          id: it.id, brand: it.brand, name: it.name, size: l.size, qty: l.qty,
          price: it.price, sum: Math.round(it.price * l.qty),
          weight: Number(it.weight) || Number(CFG.weightDefault) || 0.5
        };
      });
      send(text, 'order', {
        no: no,
        sum: Math.round(cartSum()),
        weight: Math.round(goods.reduce((s, g) => s + g.weight * g.qty, 0) * 100) / 100,
        seats: goods.reduce((s, g) => s + g.qty, 0),
        items: goods,
        delivery: {
          method: form.dlv,
          name: d.n,
          service: NP_SERVICE[form.dlv] || '',
          city: form.dlv === 'pickup' ? '' : $('#fCity').value.trim(),
          cityRef: form.cityRef || '',
          branch: form.dlv === 'pickup' ? '' : $('#fBr').value.trim(),
          branchRef: form.brRef || ''
        },
        payment: { id: form.pay, name: p.n, cod: form.pay === 'cod' },
        buyer: {
          name: $('#fName').value.trim(),
          phone: $('#fTel').value.trim(),
          note: $('#fNote').value.trim()
        }
      });
      cart = []; writeCart(cart);

      $('#co').outerHTML = `<div class="done" id="done">
        <div class="done__ok">${icon('check')}</div>
        <h1 class="dsp h-md">Замовлення прийнято</h1>
        <p class="lead" style="max-width:46ch;margin:0 auto">Текст замовлення вже у вашому буфері обміну. Надішліть його нам у Telegram або Instagram — підтвердимо наявність і надішлемо реквізити.</p>
        <p class="done__code">Номер ${no}</p>
        <div class="done__cta">
          <a class="btn" href="${esc(CFG.tg)}" target="_blank" rel="noopener">Написати в Telegram ${icon('arrow')}</a>
          <a class="btn btn--gh" href="${esc(CFG.ig)}" target="_blank" rel="noopener">Instagram</a>
        </div>
        <p class="fhint" style="margin-top:22px">Не скопіювалося? <button type="button" class="line__x" id="again">Скопіювати ще раз</button></p>
      </div>`;
      $('#again').addEventListener('click', () => { send(text, 'order'); toast('Скопійовано'); });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    paint();
  }

  /* ===========================================================
     ВІДСТЕЖЕННЯ ПОСИЛКИ (сторінка доставки)
     =========================================================== */
  function contacts() {
    blocks('#conBlocks', CONTACTS);
  }

  function tracking() {
    blocks('#dlvBlocks', DELIVERY);
    blocks('#payBlocks', PAYMENT);
    blocks('#retBlocks', RETURNS);
    /* таблиця розмірів прямо на сторінці */
    const rz = $('#szGuide');
    if (rz) sizeUI(rz, 'top');

    const btn = $('#trkGo'), inp = $('#trkNo'), out = $('#trkOut');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const n = inp.value.replace(/\D/g, '');
      if (n.length < 10) { out.innerHTML = 'Номер накладної — 14 цифр.'; return; }
      out.innerHTML = 'Питаємо Нову Пошту…';
      npCall('TrackingDocument', 'getStatusDocuments', { Documents: [{ DocumentNumber: n }] })
        .then(d => {
          const r = d[0];
          if (!r || !r.Status) { out.innerHTML = 'Такої накладної не знайшли. Перевірте номер.'; return; }
          out.innerHTML = `<b>${esc(r.Status)}</b>` +
            (r.WarehouseRecipient ? '<br>Відділення отримувача: ' + esc(r.WarehouseRecipient) : '') +
            (r.ActualDeliveryDate ? '<br>Доставлено: ' + esc(r.ActualDeliveryDate) : '') +
            (r.DocumentCost ? '<br>Вартість доставки: ' + esc(r.DocumentCost) + ' грн' : '');
        })
        .catch(() => {
          out.innerHTML = `Не вдалося звʼязатися з Новою Поштою. Перевірити можна <a class="lnk" href="https://novaposhta.ua/tracking/?cargo_number=${encodeURIComponent(n)}" target="_blank" rel="noopener">на сайті НП ${icon('arrow')}</a>`;
        });
    });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') btn.click(); });
  }

  /* ---------- запуск ---------- */
  /* Довести щойно отримані товари до вигляду, з яким працює сайт */
  function prep() {
    PRODUCTS.forEach(p => { p.sizes = tidySizes(p.sizes); p.brand = tidyBrand(p.brand); });
    stockIn(window.JS_STOCK_ROWS);
    /* Головне фото могли не заповнити, а «Ще фото» є — тоді перше з них
       стає головним, решта лишаються додатковими. */
    PRODUCTS.forEach(p => {
      p.pics = Array.isArray(p.pics) ? p.pics.filter(Boolean) : [];
      if (!p.img && p.pics.length) { p.img = p.pics[0]; p.pics = p.pics.slice(1); }
    });
    cart = cart.filter(l => byId(l.id));
  }

  function boot() {
    /* Спершу знімаємо таймери й слухачі від минулого малювання, і лише
       потім вішаємо нові. Навпаки не можна: chrome() чіпляє клік по
       документу, і прибирання всередині draw() зносило його одразу. */
    release();
    prep();
    paintCount();
    heads();
    chrome();
    const draw = () => {
      SHOWN = PRODUCTS.filter(audOk);
      try {
        if (page === 'index') home();
        else if (page === 'katalog') shop('#shop');
        else if (page === 'tovar') product();
        else if (page === 'koshyk') checkout();
        else if (page === 'dostavka') tracking();
        else if (page === 'kontakty') contacts();
      } catch (err) {
        console.error(err);
      }
    };
    /* Каталог міг не встигнути приїхати до першого малювання. Щойно
       приїде — малюємо ще раз, інакше сторінка так і лишиться порожньою. */
    window.JS_REDRAW = () => { release(); prep(); paintCount(); heads(); chrome(); draw(); };

    // сторінку товару відкривають і з чужого посилання — там питати недоречно
    if (!aud && page !== 'tovar') askAud(draw); else draw();
  }

  document.addEventListener('DOMContentLoaded', () => {
    // якщо сайт підключений до адмінки — спершу дочекатись свіжого вмісту,
    // щоб сторінка малювалась один раз, а не перемальовувалась на очах
    const ready = window.JS_DATA_READY;
    if (ready && ready.then) ready.then(boot, boot);
    else boot();
  });
})();
