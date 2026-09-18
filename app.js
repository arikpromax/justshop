/* ===========================================================
   JUST SHOP — логіка сайту.
   Один файл на всі сторінки, гілка вибирається за data-page у <body>.
   =========================================================== */
(() => {
  'use strict';

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
    const inner = p.img
      ? `<img src="${esc(p.img)}" alt="${esc(p.brand + ' ' + p.name)}" loading="lazy">`
      : '';
    const tag = o.tag === false ? ''
      : p.stock === false ? '<span class="tagi tagi--out">Під запит</span>'
        : TAGS[p.tag] ? `<span class="tagi ${TAGS[p.tag][1]}">${TAGS[p.tag][0]}</span>` : '';
    const sz = o.sizes ? `<div class="szrow">${p.sizes.map(s => `<span>${esc(s)}</span>`).join('')}</div>` : '';
    return `<div class="plate">
      ${inner}${o.meta === false ? '' : `<span class="plate__sku">${sku(p)}</span>${off(p)}`}${tag}${sz}
    </div>`;
  }

  function card(p) {
    return `<article class="card">
      <a href="tovar.html?id=${encodeURIComponent(p.id)}" aria-label="${esc(p.brand + ' ' + p.name)}">${plate(p, { sizes: true })}</a>
      <div class="card__b">
        <span class="card__brand">${esc(p.brand)}</span>
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
        <nav class="nav" id="nav">
          ${nav.map(([u, n]) => `<a href="${u}"${page && u.indexOf(page) === 0 ? ' aria-current="page"' : ''}>${n}</a>`).join('')}
        </nav>
        <div class="hdr__act">
          <button class="iconbtn" data-search aria-label="Пошук по каталогу">${icon('search')}</button>
          <a class="iconbtn cartbtn" href="koshyk.html" aria-label="Кошик">${icon('cart')}<b></b></a>
          <button class="iconbtn burger" id="burger" aria-label="Меню" aria-expanded="false">${icon('menu')}</button>
        </div>
      </div>`;
      $('#burger').addEventListener('click', e => {
        const on = $('#nav').classList.toggle('on');
        e.currentTarget.setAttribute('aria-expanded', String(on));
        e.currentTarget.innerHTML = icon(on ? 'close' : 'menu');
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
    document.addEventListener('click', e => {
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
      const list = PRODUCTS.filter(p => hit(p, s));
      if (!list.length) {
        out.innerHTML = `<p class="srch__hint">Нічого не знайшли. Напишіть нам <a href="${esc(CFG.tg)}" target="_blank" rel="noopener">у Telegram</a> — привеземо з Європи під запит.</p>`;
        return;
      }
      out.innerHTML = list.slice(0, 6).map(p => `<a class="srow" href="tovar.html?id=${encodeURIComponent(p.id)}">
          ${plate(p, { meta: false, tag: false })}
          <span class="srow__b"><b>${esc(p.brand)}</b><span>${esc(p.name)}</span></span>
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
    const list = (CFG.hero || []).filter(Boolean);
    const hero = $('.hero');
    if (!list.length || !hero) return;
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
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 250); });
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

    addEventListener('resize', relayout);
    // до завантаження Archivo заміри йдуть запасним шрифтом, а він вужчий
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
    const match = q => {
      const s = norm(q);
      if (s.length < 2) return [];
      return PRODUCTS.filter(p => hit(p, s));
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
    setInterval(() => {
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
      const n = PRODUCTS.filter(p => p.cat === c.id).length;
      return `<a href="katalog.html?cat=${c.id}">${icon(c.icon)}<em>${esc(c.name)}</em><i>${n}</i></a>`;
    }).join('');

    /* розпродаж окремою каруселлю */
    const sale = PRODUCTS.filter(p => p.old > 0);
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
      car.addEventListener('scroll', ends);
      addEventListener('resize', ends);
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
    const BRANDS = Array.from(new Set(PRODUCTS.map(p => p.brand))).sort((a, b) => a.localeCompare(b, 'uk'));
    const SIZES = Array.from(new Set(PRODUCTS.flatMap(p => p.sizes)))
      .sort((a, b) => (parseInt(a, 10) || 99) - (parseInt(b, 10) || 99) || SIZES_WEAR.indexOf(a) - SIZES_WEAR.indexOf(b));

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
      <div class="empty" id="none" hidden>
        <p class="dsp h-md">Під ці умови нічого немає</p>
        <p>Приберіть частину фільтрів — або замовте пошук: дістанемо потрібну модель з європейських магазинів.</p>
        <button class="btn" type="button" id="nonewish">Скинути фільтри</button>
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
              ${CATS.map(c => `<label><input type="checkbox" data-k="cat" value="${c.id}"${st.cat.includes(c.id) ? ' checked' : ''}>${esc(c.name)}<i>${PRODUCTS.filter(p => p.cat === c.id).length}</i></label>`).join('')}</div>
            </div>
            <div class="flt__g"><h3>Бренд</h3><div class="fltlist">
              ${BRANDS.map(b => `<label><input type="checkbox" data-k="brand" value="${esc(b)}">${esc(b)}<i>${PRODUCTS.filter(p => p.brand === b).length}</i></label>`).join('')}</div>
            </div>
            <div class="flt__g"><h3>Розмір</h3>
              <div class="szpick">${SIZES.map(s => `<button type="button" data-sz="${esc(s)}" aria-pressed="false">${esc(s)}</button>`).join('')}</div>
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
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && drw.classList.contains('on')) closeDrw(); });

    function apply() {
      let list = PRODUCTS.slice();
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
      g.innerHTML = list.map(card).join('');
      g.hidden = !list.length;
      $('#none').hidden = !!list.length;

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
    $('#fltReset').addEventListener('click', resetAll);
    $('#nonewish').addEventListener('click', resetAll);

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
    document.title = p.brand + ' ' + p.name + ' — Just shop';
    let size = '';
    // один розмір на позицію — обирати нема з чого, ставимо одразу
    const oneSize = p.sizes.length === 1;
    if (oneSize) size = p.sizes[0];
    const showTable = p.cat !== 'aksesuary' && !/^one size$/i.test(p.sizes[0] || '');

    root.innerHTML = `
      <div class="pdp__media">${plate(p, { sizes: false })}</div>
      <div>
        <nav class="mono" style="color:var(--mut);margin-bottom:14px"><a href="katalog.html">Каталог</a> / <a href="katalog.html?cat=${p.cat}">${esc(catName(p.cat))}</a></nav>
        <span class="pdp__brand">${esc(p.brand)} · ${sku(p)}</span>
        <h1>${esc(p.name)}</h1>
        <p class="price">${money(p.price)}${p.old ? `<s>${money(p.old)}</s><em>−${Math.round((1 - p.price / p.old) * 100)}%</em>` : ''}</p>
        <p class="stock${p.stock === false ? ' stock--out' : ''}"><i></i>${p.stock === false ? 'Немає — привеземо під запит за 3—10 днів' : 'Є в наявності, відправка сьогодні'}</p>
        <p class="pdp__desc">${esc(p.desc)}</p>
        <div class="pick">
          <div class="pick__h"><span>Розмір</span></div>
          ${oneSize
            ? `<p class="onesize">${esc(p.sizes[0])}</p>`
            : `<div class="szpick" id="szPick">${p.sizes.map(s => `<button type="button" data-s="${esc(s)}" aria-pressed="false">${esc(s)}</button>`).join('')}</div>
          <p class="fmsg" id="szMsg"></p>`}
          ${showTable ? `<button class="szlink" type="button" data-sizes="${sizeKind(p)}">${icon('ruler')}Таблиця розмірів</button>` : ''}
        </div>
        <div class="pdp__cta">
          ${p.stock === false
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

    const szPick = $('#szPick');
    if (szPick) szPick.addEventListener('click', e => {
      const b = e.target.closest('[data-s]');
      if (!b) return;
      size = b.dataset.s;
      $$('#szPick [data-s]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      $('#szMsg').textContent = '';
    });
    const cta = $('#add') || $('#ask');
    if (cta.id === 'add') {
      cta.addEventListener('click', () => {
        if (!size) { $('#szMsg').textContent = 'Оберіть розмір'; szPick.scrollIntoView({ block: 'center' }); return; }
        addToCart(p.id, size, 1);
        toast('Додано в кошик · ' + size);
      });
    }

    const near = PRODUCTS.filter(x => x.id !== p.id && (x.cat === p.cat || x.brand === p.brand)).slice(0, 4);
    if (near.length) $('#near').innerHTML = near.map(card).join('');
    else $('#nearSec').hidden = true;

    /* нижня панель на мобільному */
    const bar = $('#bar');
    bar.innerHTML = `<span class="bar__p">${money(p.price)}</span><button class="btn btn--sm" id="barAdd">${p.stock === false ? 'Під запит' : 'Додати в кошик'}</button>`;
    $('#barAdd').addEventListener('click', () => cta.click());
    if (matchMedia('(max-width:640px)').matches) { bar.classList.add('on'); document.body.classList.add('has-bar'); }
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
          writeCart(cart); paint();
        } else if (d) {
          cart.splice(+d.dataset.del, 1);
          writeCart(cart); paint();
        }
      });
      $('#fDlv').addEventListener('change', e => {
        form.dlv = e.target.value;
        npFields(); payOpts(); totals();
      });
      $('#ord').addEventListener('submit', submit);
      npFields(); payOpts(); totals();
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

    function submit(e) {
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
      const no = 'JS' + String(Date.now()).slice(-6);
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
  function boot() {
    cart = cart.filter(l => byId(l.id));
    paintCount();
    heads();
    chrome();
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
  }

  document.addEventListener('DOMContentLoaded', () => {
    // якщо сайт підключений до адмінки — спершу дочекатись свіжого вмісту,
    // щоб сторінка малювалась один раз, а не перемальовувалась на очах
    const ready = window.JS_DATA_READY;
    if (ready && ready.then) ready.then(boot, boot);
    else boot();
  });
})();
