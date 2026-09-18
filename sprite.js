/* Власна графіка: жодних емодзі та жодних сторонніх бібліотек іконок.
   GARMENT — силуети речей 48×48, UI — інтерфейсні 24×24. */

const GARMENT = {
  sneaker: '<path d="M7 22c0-1.1.9-2 2-2h5.4l4.1 4.6 9.2 2.1 10 3.9c2.5 1 3.3 2.3 3.3 4.1V36c0 1.1-.9 2-2 2H9c-1.1 0-2-.9-2-2z"/><path d="M7 33.5h34"/><path d="M15.2 21.4l3.3 3.6M18.6 22.2l3.2 3.4"/><path d="M27.7 26.7l2.6-3.4"/>',
  hoodie: '<path d="M18 11.5l-6.4 2.6-4.6 4.4 4.3 4.9 3.1-2.4V38h19V21l3.1 2.4 4.3-4.9-4.6-4.4L30 11.5"/><path d="M18 11.5c1.9 3.4 10.1 3.4 12 0"/><path d="M18.5 29.5h11"/><path d="M22 16v4M26 16v4"/>',
  jacket: '<path d="M18.5 11l-7.5 3.3V38h26V14.3L29.5 11"/><path d="M18.5 11l5.5 4.6 5.5-4.6"/><path d="M24 15.6V38"/><path d="M11 21.5h26M11 27.5h26M11 33h26"/>',
  vest: '<path d="M18.5 11L13 13.5V38h22V13.5L29.5 11l-5.5 4.6z"/><path d="M24 15.6V38"/><path d="M13 21h4M35 21h-4"/>',
  tee: '<path d="M18 11.6l-8.4 4.1 3.1 6.3 3.3-1.7V38h16V20.3l3.3 1.7 3.1-6.3L30 11.6"/><path d="M18 11.6c1.8 3.3 10.2 3.3 12 0"/>',
  pants: '<path d="M16.6 10h14.8v6.5L33.6 38h-7.2L24 23.4 21.6 38h-7.2l2.2-21.5z"/><path d="M16.6 14.5h14.8"/>',
  shorts: '<path d="M16.6 13h14.8v5.5L33 32h-6.6L24 23.6 21.6 32H15l1.6-13.5z"/><path d="M16.6 17h14.8"/>',
  socks: '<path d="M18.5 10h9.8v13.8c0 3.4 2.4 4.9 4.8 6.8 3.2 2.6 1.8 7.4-2.6 7.4-3 0-5.1-2-7-5.2-1.9-3.2-5-5.6-5-9.9z"/><path d="M18.5 15.4h9.8"/>',
  cap: '<path d="M11.5 29.5c0-7.4 5.6-12.5 12.5-12.5s12.5 5.1 12.5 12.5"/><path d="M10 29.5h29c1.7 0 2.6 1.1 2.6 2.6v1H10z"/><path d="M24 17v12.5"/>',
  beanie: '<path d="M12.6 31c0-7 5.1-12 11.4-12s11.4 5 11.4 12"/><rect x="10.6" y="31" width="26.8" height="5.6" rx="1.4"/><path d="M24 19v-3"/>',
  bag: '<path d="M14.6 18h18.8l1.9 19.4a1.6 1.6 0 01-1.6 1.8H14.3a1.6 1.6 0 01-1.6-1.8z"/><path d="M19.4 18v-3.2a4.6 4.6 0 019.2 0V18"/>',
  suit: '<path d="M18 9.5l-5.6 2.4V23h23.2V11.9L30 9.5l-6 3.6z"/><path d="M15.4 26.5h17.2l1.4 12.2h-6.3L24 30.8l-3.7 7.9H14z"/>'
};

const UI = {
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M15.8 15.8L21 21"/>',
  cart: '<path d="M3 4h2.2l2.4 10.6a2 2 0 002 1.6h8.1a2 2 0 002-1.5L21.4 8H6.2"/><circle cx="10" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/>',
  arrow: '<path d="M4 12h15.5M13.5 6l6 6-6 6"/>',
  arrowUp: '<path d="M12 20V4.5M6 11l6-6.5 6 6.5"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  check: '<path d="M4.5 12.5l5 5L20 6.5"/>',
  chev: '<path d="M8 4.5l7.5 7.5L8 19.5"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  truck: '<path d="M1.5 5.5h12v11h-12z"/><path d="M13.5 9h4l3 3.2v4.3h-7z"/><circle cx="6" cy="18.5" r="1.8"/><circle cx="17" cy="18.5" r="1.8"/>',
  box: '<path d="M12 2.8l8.5 4.3v9.8L12 21.2 3.5 16.9V7.1z"/><path d="M3.5 7.1L12 11.4l8.5-4.3M12 11.4v9.8"/>',
  tag: '<path d="M11.4 2.8H21v9.6l-8.6 8.6-9.6-9.6z"/><circle cx="16.6" cy="7.4" r="1.6"/>',
  shield: '<path d="M12 2.6l7.5 3v6c0 5-3.2 8.3-7.5 9.8-4.3-1.5-7.5-4.8-7.5-9.8v-6z"/><path d="M8.6 11.8l2.6 2.6 4.4-4.6"/>',
  phone: '<path d="M6.2 3.5l3 .6 1.2 4-2 1.7c.9 2.3 2.7 4.1 5 5l1.7-2 4 1.2.6 3c0 1.2-1 2.2-2.2 2.1C10.5 18.5 5.5 13.5 4.1 5.7c-.1-1.2.9-2.2 2.1-2.2z"/>',
  pin: '<path d="M12 21.5s7-6.2 7-11.1A7 7 0 005 10.4c0 4.9 7 11.1 7 11.1z"/><circle cx="12" cy="10.2" r="2.6"/>',
  clock: '<circle cx="12" cy="12" r="8.8"/><path d="M12 6.6V12l3.6 2.2"/>',
  spark: '<path d="M12 2.5l2.4 6.6 6.6 2.4-6.6 2.4L12 20.5l-2.4-6.6L3 11.5l6.6-2.4z"/>',
  ruler: '<rect x="2.5" y="7.5" width="19" height="9" rx="1.4"/><path d="M7 7.5v3.4M12 7.5v4.6M17 7.5v3.4"/>',
  filter: '<path d="M3 6h18M6.5 12h11M10 18h4"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7"/><rect x="13.5" y="3.5" width="7" height="7"/><rect x="3.5" y="13.5" width="7" height="7"/><rect x="13.5" y="13.5" width="7" height="7"/>',
  rows: '<path d="M3.5 5.5h17M3.5 12h17M3.5 18.5h17"/>',
  tg: '<path d="M21 4.2L2.8 11.2l4.9 1.6 1.9 5.9 2.7-3.1 4.6 3.4z"/><path d="M7.7 12.8L18.2 6.8l-6.9 7.9"/>',
  ig: '<rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.1" cy="6.9" r="1.1" fill="currentColor" stroke="none"/>',
  tiktok: '<path d="M14.4 3.2v11.5a3.6 3.6 0 11-3.6-3.6c.4 0 .7 0 1 .1"/><path d="M14.4 3.2c.4 2.6 2.3 4.4 5 4.6"/>'
};

function icon(name, cls) {
  const g = GARMENT[name];
  const body = g || UI[name] || '';
  const box = g ? '0 0 48 48' : '0 0 24 24';
  const sw = g ? 1.5 : 1.7;
  return `<svg class="ic${cls ? ' ' + cls : ''}" viewBox="${box}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}
