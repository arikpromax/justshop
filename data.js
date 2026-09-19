/* ============================================================
   JUST SHOP — дані сайту.
   Усе, що змінює власник, живе тут. Решта файлів чіпати не треба.
   ============================================================ */

const CFG = {
  brand: 'Just shop',
  // Логотип. Покладіть файл у img/logo.png (краще PNG або SVG з прозорим тлом).
  // Порожньо — у шапці показується текстовий знак JUST•SHOP.
  logo: 'img/logo.png',
  // Світла версія того самого знака — для чорного підвалу.
  logoLight: 'img/logo-light.png',
  claim: 'Оригінальні речі з Європи',
  tg: 'https://t.me/+Slwgs7ppLQI4N2Uy',
  tgUser: '',                       // @нік для замовлень у Telegram, напр. 'just_shop_manager'
  ig: 'https://www.instagram.com/just_shop____',
  tiktok: 'https://www.tiktok.com/@just_shop____',
  phone: '+380 00 000 00 00',       // ← вписати робочий номер
  pickup: 'Київ, самовивіз — адресу надсилаємо після підтвердження',
  hours: 'Щодня 10:00 — 21:00',

  // Нова Пошта. Пошук міст, відділень і відстеження працюють і з порожнім ключем —
  // це відкриті адресні методи. Ключ із кабінету НП (Налаштування → Безпека → API)
  // потрібен, лише якщо згодом захочете рахувати вартість чи створювати накладні.
  npApiKey: '',

  // Номер сайту в платформі адмінок. 0 — сайт живе лише на цьому файлі.
  // Після виконання migration-justshop.sql вписати сюди номер, який поверне SQL.
  siteId: 106,

  // Куди падають замовлення. Порожньо — сайт дає скопіювати замовлення
  // і відкриває Telegram. Якщо вписати URL (бот або свій сервер) — піде POST JSON.
  orderWebhook: '',

  // Банер головної. Поки тут вказаний файл логотипа — у банері стоїть він.
  // Щоб повернути смугу фото: очистіть heroLogo (heroLogo: '') — тоді
  // візьметься список hero нижче.
  heroLogo: 'img/logo-original.png',

  // Смуга фото за героєм. Кладіть у img/ і перелічіть тут.
  // Порожній масив — герой лишається просто темним, нічого не ламається.
  hero: ['img/image-1.webp', 'img/image-2.webp', 'img/image-3.webp', 'img/image-4.webp'],


  // Вага посилки за замовчуванням, кг — потрібна Новій Пошті для накладної.
  // У товару можна задати свою; тут — та, що береться, коли поле порожнє.
  weightDefault: 0.5,

  freeFrom: 3000                   // безкоштовна доставка від суми, грн (0 — вимкнути)
};

/* Категорії: id → назва, іконка (ключ зі sprite.js), відмінок для заголовків */
const CATS = [
  { id: 'vzuttia',    name: 'Взуття',      icon: 'sneaker' },
  { id: 'kurtky',     name: 'Куртки',      icon: 'jacket' },
  { id: 'kofty',      name: 'Кофти',       icon: 'hoodie' },
  { id: 'kostiumy',   name: 'Костюми',     icon: 'suit' },
  { id: 'zhyletky',   name: 'Жилетки',     icon: 'vest' },
  { id: 'shtany',     name: 'Штани',       icon: 'pants' },
  { id: 'futbolky',   name: 'Футболки',    icon: 'tee' },
  { id: 'shorty',     name: 'Шорти',       icon: 'shorts' },
  { id: 'shkarpetky', name: 'Шкарпетки',   icon: 'socks' },
  { id: 'aksesuary',  name: 'Аксесуари',   icon: 'cap' }
];

const SIZES_SHOE = ['39', '40', '41', '42', '43', '44', '45'];
const SIZES_WEAR = ['S', 'M', 'L', 'XL', 'XXL'];

/* --------------------------------------------------------------
   ТОВАРИ. Поля:
   id     — коротке латинське, лишається в посиланні
   img    — шлях до фото, напр. 'img/tn-air.jpg'. Порожньо — сайт малює
            фірмову плитку сам, сітка не ламається.
   tag    — 'new' | 'hit' | 'last' | ''
   tone   — колір плитки (беруть із кольору речі)
   stock  — true: є в наявності; false: під запит (кнопка змінюється сама)
   -------------------------------------------------------------- */
const PRODUCTS = [
  { id: 'tn-air', stock: true, brand: 'Nike', name: 'Air Max Plus TN', cat: 'vzuttia', price: 3490, old: 4200, sizes: SIZES_SHOE, colors: ['Чорний', 'Сірий'], tone: '#2b2f36', tag: 'hit', img: '',
    desc: 'Класика, яку впізнають з десяти метрів. Верх — щільний сітчастий текстиль із термошвами, підошва Tuned Air.' },
  { id: 'samba-og', stock: true, brand: 'adidas', name: 'Samba OG', cat: 'vzuttia', price: 2890, old: 0, sizes: SIZES_SHOE, colors: ['Білий', 'Чорний'], tone: '#e7e2d6', tag: 'hit', img: '',
    desc: 'Найпопулярніша пара останніх сезонів. Шкіряний верх, замшевий носок, гумова підошва-гам.' },
  { id: 'nb-2002r', stock: true, brand: 'New Balance', name: '2002R Protection Pack', cat: 'vzuttia', price: 3790, old: 0, sizes: SIZES_SHOE, colors: ['Сірий'], tone: '#9a9a95', tag: 'new', img: '',
    desc: 'Замша та сітка, амортизація N-ERGY і ABZORB. Пара, яка витримує місто щодня.' },
  { id: 'jordan-1-low', stock: true, brand: 'Jordan', name: 'Air Jordan 1 Low', cat: 'vzuttia', price: 3990, old: 0, sizes: SIZES_SHOE, colors: ['Білий', 'Червоний'], tone: '#c8402f', tag: '', img: '',
    desc: 'Низький силует легендарної моделі. Натуральна шкіра, перфорація на носку.' },
  { id: 'salomon-xt6', stock: true, brand: 'Salomon', name: 'XT-6', cat: 'vzuttia', price: 4290, old: 4900, sizes: SIZES_SHOE, colors: ['Чорний'], tone: '#1d2024', tag: 'last', img: '',
    desc: 'Трейлова база, яка стала міською. Quicklace, Contagrip, посадка як у кросівок для бігу.' },
  { id: 'asics-gel', stock: true, brand: 'Asics', name: 'Gel-Kayano 14', cat: 'vzuttia', price: 3590, old: 0, sizes: SIZES_SHOE, colors: ['Сріблястий'], tone: '#b9bfc6', tag: '', img: '',
    desc: 'Срібна класика 2000-х. Гелева амортизація, багатошаровий верх.' },
  { id: 'vans-knu', stock: true, brand: 'Vans', name: 'Knu Skool', cat: 'vzuttia', price: 2290, old: 0, sizes: SIZES_SHOE, colors: ['Чорний', 'Білий'], tone: '#33363b', tag: '', img: '',
    desc: 'Товстий замшевий верх і пухкий язик — форма 90-х без стилізації.' },

  { id: 'tnf-nuptse', stock: true, brand: 'The North Face', name: 'Nuptse 1996', cat: 'kurtky', price: 8900, old: 0, sizes: SIZES_WEAR, colors: ['Чорний'], tone: '#17191c', tag: 'hit', img: '',
    desc: 'Пух 700, водовідштовхувальне покриття, фіксація по низу. Зима в місті закрита.' },
  { id: 'cp-goggle', stock: false, brand: 'C.P. Company', name: 'Goggle Jacket Chrome-R', cat: 'kurtky', price: 12400, old: 0, sizes: SIZES_WEAR, colors: ['Синій'], tone: '#2f4a7a', tag: 'last', img: '',
    desc: 'Та сама куртка з лінзами на капюшоні. Матеріал Chrome-R, лінзи Mille Miglia.' },
  { id: 'carhartt-detroit', stock: true, brand: 'Carhartt WIP', name: 'Detroit Jacket', cat: 'kurtky', price: 6400, old: 7100, sizes: SIZES_WEAR, colors: ['Коричневий'], tone: '#6b4a2c', tag: '', img: '',
    desc: 'Щільний канвас, підкладка-ковдра, комір із вельвету. Зношується красиво.' },
  { id: 'napapijri-rain', stock: true, brand: 'Napapijri', name: 'Rainforest Winter', cat: 'kurtky', price: 7200, old: 0, sizes: SIZES_WEAR, colors: ['Хакі'], tone: '#4c5340', tag: 'new', img: '',
    desc: 'Анорак із прапорцем на грудях, хутро на капюшоні, кишеня-кенгуру.' },
  { id: 'arcteryx-beta', stock: false, brand: "Arc'teryx", name: 'Beta LT Gore-Tex', cat: 'kurtky', price: 14900, old: 0, sizes: SIZES_WEAR, colors: ['Чорний'], tone: '#22252a', tag: '', img: '',
    desc: 'Мембрана Gore-Tex 3L, проклеєні шви, вага близько 400 г. Дощ і вітер більше не питання.' },

  { id: 'nike-tech', stock: true, brand: 'Nike', name: 'Tech Fleece Hoodie', cat: 'kofty', price: 3290, old: 3900, sizes: SIZES_WEAR, colors: ['Сірий', 'Чорний'], tone: '#8d9096', tag: 'hit', img: '',
    desc: 'Тришаровий фліс: тепло без обʼєму. Найчастіший запит у директі — тримаємо в наявності.' },
  { id: 'stone-crew', stock: true, brand: 'Stone Island', name: 'Garment Dyed Crewneck', cat: 'kofty', price: 9800, old: 0, sizes: SIZES_WEAR, colors: ['Хакі'], tone: '#5d6247', tag: '', img: '',
    desc: 'Фарбування в готовому виробі, знімний компас на рукаві.' },
  { id: 'polo-hoodie', stock: true, brand: 'Ralph Lauren', name: 'Polo Bear Hoodie', cat: 'kofty', price: 5400, old: 0, sizes: SIZES_WEAR, colors: ['Темно-синій'], tone: '#22304f', tag: 'new', img: '',
    desc: 'Щільний футер із вишитим ведмедем. Розмір беріть свій — сидить рівно.' },
  { id: 'ua-zip', stock: true, brand: 'Under Armour', name: 'Storm Full-Zip', cat: 'kofty', price: 2790, old: 0, sizes: SIZES_WEAR, colors: ['Чорний'], tone: '#26292e', tag: '', img: '',
    desc: 'Тренувальна кофта з водовідштовхувальним покриттям і високим коміром.' },

  { id: 'nike-tech-set', stock: true, brand: 'Nike', name: 'Tech Fleece Set', cat: 'kostiumy', price: 5900, old: 6800, sizes: SIZES_WEAR, colors: ['Чорний'], tone: '#1b1d21', tag: 'hit', img: '',
    desc: 'Кофта + штани одним комплектом. Найчастіший подарунок із нашого каталогу.' },
  { id: 'adidas-track', stock: true, brand: 'adidas', name: 'Adicolor Firebird Set', cat: 'kostiumy', price: 4200, old: 0, sizes: SIZES_WEAR, colors: ['Чорний', 'Білий'], tone: '#2a2d33', tag: '', img: '',
    desc: 'Три смуги, глянцевий трикотаж, звужені штани. Форма, яка не старіє.' },
  { id: 'lacoste-set', stock: true, brand: 'Lacoste', name: 'Tracksuit Sport', cat: 'kostiumy', price: 6900, old: 0, sizes: SIZES_WEAR, colors: ['Зелений'], tone: '#2f5e42', tag: 'new', img: '',
    desc: 'Костюм із фактурного трикотажу, крокодил на грудях, манжети в рубчик.' },

  { id: 'tnf-vest', stock: true, brand: 'The North Face', name: 'Nuptse Vest', cat: 'zhyletky', price: 6200, old: 0, sizes: SIZES_WEAR, colors: ['Чорний'], tone: '#1a1c20', tag: '', img: '',
    desc: 'Пуховий жилет на міжсезоння: під куртку або поверх худі.' },
  { id: 'stone-vest', stock: false, brand: 'Stone Island', name: 'Shell-R Vest', cat: 'zhyletky', price: 11200, old: 0, sizes: SIZES_WEAR, colors: ['Сірий'], tone: '#6f7378', tag: 'last', img: '',
    desc: 'Технічна оболонка Shell-R, приховані кишені, компас на липучці.' },

  { id: 'carhartt-single', stock: true, brand: 'Carhartt WIP', name: 'Single Knee Pant', cat: 'shtany', price: 3600, old: 0, sizes: SIZES_WEAR, colors: ['Бежевий'], tone: '#a08a63', tag: '', img: '',
    desc: 'Робочий крій із посиленим коліном. Тканина розноситься під вас.' },
  { id: 'nike-tech-pant', stock: true, brand: 'Nike', name: 'Tech Fleece Joggers', cat: 'shtany', price: 3100, old: 0, sizes: SIZES_WEAR, colors: ['Сірий'], tone: '#8b8e94', tag: 'hit', img: '',
    desc: 'Ті самі джогери, що й у комплекті, окремо. Манжет по щиколотці.' },
  { id: 'columbia-pant', stock: true, brand: 'Columbia', name: 'Silver Ridge Convertible', cat: 'shtany', price: 2600, old: 3000, sizes: SIZES_WEAR, colors: ['Хакі'], tone: '#5a6249', tag: '', img: '',
    desc: 'Штани, що розстібаються в шорти. Omni-Shade, швидко сохнуть.' },

  { id: 'polo-tee', stock: true, brand: 'Ralph Lauren', name: 'Custom Slim Tee', cat: 'futbolky', price: 1290, old: 0, sizes: SIZES_WEAR, colors: ['Білий'], tone: '#e9e7e1', tag: '', img: '',
    desc: 'Бавовна з довгим волокном, вишитий поні, рівний низ.' },
  { id: 'tommy-tee', stock: true, brand: 'Tommy Hilfiger', name: 'Flag Logo Tee', cat: 'futbolky', price: 1190, old: 1490, sizes: SIZES_WEAR, colors: ['Темно-синій'], tone: '#1f2c4a', tag: 'new', img: '',
    desc: 'Щільний джерсі 180 г, класичний прапорець на грудях.' },
  { id: 'nike-tee', stock: true, brand: 'Nike', name: 'Sportswear Club Tee', cat: 'futbolky', price: 890, old: 0, sizes: SIZES_WEAR, colors: ['Чорний'], tone: '#26282c', tag: '', img: '',
    desc: 'База, якої завжди мало. Пряма посадка, гумований свош.' },

  { id: 'nike-shorts', stock: true, brand: 'Nike', name: 'Dri-FIT Shorts', cat: 'shorty', price: 1190, old: 0, sizes: SIZES_WEAR, colors: ['Чорний'], tone: '#2a2c31', tag: '', img: '',
    desc: 'Легкі шорти для залу й вулиці, вологовідвідна тканина.' },
  { id: 'polo-swim', stock: true, brand: 'Ralph Lauren', name: 'Traveler Swim Shorts', cat: 'shorty', price: 1890, old: 0, sizes: SIZES_WEAR, colors: ['Синій'], tone: '#2d5480', tag: '', img: '',
    desc: 'Плавальні шорти з сіткою всередині та бічними кишенями.' },

  { id: 'nike-socks', stock: true, brand: 'Nike', name: 'Everyday Cushioned, 3 пари', cat: 'shkarpetky', price: 390, old: 0, sizes: ['39-42', '42-46'], colors: ['Білий', 'Чорний'], tone: '#d8d6d0', tag: 'hit', img: '',
    desc: 'Три пари в упаковці, махрова стопа, високий манжет.' },
  { id: 'polo-socks', stock: true, brand: 'Ralph Lauren', name: 'Classic Socks, 3 пари', cat: 'shkarpetky', price: 490, old: 0, sizes: ['39-42', '42-46'], colors: ['Сірий'], tone: '#9b9ea3', tag: '', img: '',
    desc: 'Бавовняні шкарпетки з вишитим поні. Три кольори в наборі.' },

  { id: 'nike-cap', stock: true, brand: 'Nike', name: 'Club Cap', cat: 'aksesuary', price: 890, old: 0, sizes: ['One size'], colors: ['Чорний'], tone: '#232529', tag: '', img: '',
    desc: 'Кепка з вигнутим козирком і металевою застібкою.' },
  { id: 'carhartt-bag', stock: true, brand: 'Carhartt WIP', name: 'Essentials Bag', cat: 'aksesuary', price: 1690, old: 0, sizes: ['One size'], colors: ['Чорний'], tone: '#2c2e33', tag: 'new', img: '',
    desc: 'Поясна сумка з канвасу, тримає телефон, ключі й павербанк.' },
  { id: 'tnf-beanie', stock: true, brand: 'The North Face', name: 'Dock Worker Beanie', cat: 'aksesuary', price: 990, old: 1200, sizes: ['One size'], colors: ['Чорний'], tone: '#1e2024', tag: '', img: '',
    desc: 'Шапка в рубчик із товстим відворотом і нашивкою.' }
];

/* Що шукають найчастіше — підказки під головним рядком */
const WISHES = ['Nike Tech Fleece', 'adidas Samba OG', 'Stone Island', 'The North Face Nuptse', 'Arc’teryx', 'New Balance 2002R', 'Salomon XT-6'];

const FAQ = [
  { q: 'Це справді оригінал?', a: 'Так. Речі викуповуються в європейських магазинах і на офіційних майданчиках. До відправлення надсилаємо фото бірок, коробки й чека — перевіряєте до того, як платите решту.' },
  { q: 'Скільки чекати?', a: 'Те, що є в наявності в Києві, їде Новою Поштою наступного дня. Замовлення під запит — 3—10 днів: 1—2 дні на викуп і 3—8 на дорогу з Європи.' },
  { q: 'Як оплачувати?', a: 'На картку ФОП або наложеним платежем Нової Пошти. Для речей під запит — передоплата 50%, решта перед відправленням.' },
  { q: 'А якщо не підійде розмір?', a: 'Обмін протягом 14 днів, якщо річ не носили й бірки на місці. Доставку на обмін ділимо навпіл. На речі під індивідуальний запит обмін узгоджуємо окремо до викупу.' },
  { q: 'Ви працюєте з клубами?', a: 'Так, ми офіційний партнер ФК «Ростянець» і ФК Rebel Київ: екіпірування, тренувальні комплекти й мерч для команд. Умови для команд — у директі.' }
];

const CLUBS = [
  { m: 'FCR', n: 'ФК «Ростянець»', d: 'Екіпірування основного складу' },
  { m: 'RBL', n: 'ФК Rebel Київ', d: 'Тренувальна форма та мерч' }
];

/* --------------------------------------------------------------
   ТАБЛИЦІ РОЗМІРІВ. Усі числа — виміри самої речі в сантиметрах,
   як її кладуть на рівну поверхню. Категорія товару сама вибирає
   потрібну таблицю: верх / низ / взуття.
   -------------------------------------------------------------- */
const SIZE_TABLES = {
  top: {
    name: 'Верх',
    note: 'Покладіть свою кофту чи куртку на рівну поверхню й виміряйте так, як на схемі. Груди — ширина під пахвами, не обхват.',
    cols: ['Розмір', 'Груди', 'Довжина', 'Рукав від шиї'],
    rows: [
      ['S', 54, 66, 79],
      ['M', 56, 68, 81],
      ['L', 59, 70, 83],
      ['XL', 62, 72, 85],
      ['XXL', 65, 74, 86]
    ]
  },
  bottom: {
    name: 'Низ',
    note: 'Штани розкладіть рівно, пояс не розтягуйте. Довжина міряється по боковому шву від пояса до низу.',
    cols: ['Розмір', 'Пояс', 'Стегна', 'Довжина'],
    rows: [
      ['S', 36, 50, 100],
      ['M', 38, 52, 102],
      ['L', 40, 54, 104],
      ['XL', 42, 56, 106],
      ['XXL', 44, 58, 108]
    ]
  },
  shoe: {
    name: 'Взуття',
    note: 'Дістаньте устілку зі взуття, яке зараз носите, і виміряйте її довжину. Це надійніше за розмір на бірці — він у кожного бренду свій.',
    cols: ['EU', 'Довжина устілки, см'],
    rows: [[39, 24.5], [40, 25.0], [41, 26.0], [42, 26.5], [43, 27.5], [44, 28.0], [45, 29.0]]
  }
};

/* Підбір розміру за зростом і вагою. Індекс = вага, підправлена на зріст:
   вищим за 176 см потрібен більший розмір за тієї самої ваги. */
const SIZE_CALC = [
  { size: 'S', upTo: 64 },
  { size: 'M', upTo: 73 },
  { size: 'L', upTo: 83 },
  { size: 'XL', upTo: 94 },
  { size: 'XXL', upTo: 999 }
];

/* --------------------------------------------------------------
   БЛОКИ СТОРІНОК. Показуються в цьому ж порядку.
   list — пункти під абзацом; порожній масив означає, що списку немає.
   Ці ж блоки редагуються в адмінці, якщо сайт підключений до платформи.
   -------------------------------------------------------------- */
const DELIVERY = [
  { t: 'Відділення', d: 'Найдешевший і найшвидший спосіб. Місто й номер відділення підставляються в кошику з бази Нової Пошти — помилитися в адресі неможливо.',
    list: ['1—2 дні по Україні', 'Тариф НП, оплачується при отриманні', 'Від 3 000 грн доставку оплачуємо ми'] },
  { t: 'Поштомат', d: 'Зручно, якщо не встигаєте на відділення: посилка чекає у скриньці, код приходить у СМС.',
    list: ['Забрати можна цілодобово', 'Обмеження за розміром — великі куртки й коробки не поміщаються', 'Зберігання до 3 днів'] },
  { t: 'Курʼєр Нової Пошти', d: 'Привезуть на вашу адресу. Вкажіть у коментарі підʼїзд, поверх і зручний час — передамо перевізнику.',
    list: ['Тариф НП + послуга адресної доставки', 'Дзвінок за 30—60 хвилин до приїзду'] },
  { t: 'Самовивіз, Київ', d: 'Безкоштовно. Точну адресу й час надсилаємо після підтвердження замовлення — можна приміряти на місці.',
    list: ['0 грн', 'Щодня 10:00 — 21:00', 'Приміряти можна перед оплатою'] }
];

const PAYMENT = [
  { t: 'На картку ФОП', d: 'Реквізити надсилаємо після того, як підтвердимо наявність і розмір. За потреби даємо чек.',
    list: ['Речі в наявності — 100% перед відправленням', 'Речі під запит — 50% передоплати, решта перед відправкою з Європи'] },
  { t: 'Наложений платіж', d: 'Оплата при отриманні на відділенні. Нова Пошта бере власну комісію за переказ грошей — це не наша націнка.',
    list: ['Доступно для замовлень із наявності', 'Для речей під запит — після передоплати 50%'] }
];

const RETURNS = [
  { t: '14 днів на обмін', d: 'Якщо річ не носили, вигляд і бірки збережені, а пакування ціле — міняємо на інший розмір або колір.',
    list: ['Напишіть у Telegram або Instagram із номером замовлення', 'Доставку на обмін ділимо навпіл', 'Речі під індивідуальний запит — умови узгоджуємо до викупу'] },
  { t: 'Якщо щось не так', d: 'Розпакуйте посилку на відділенні й перевірте вміст. Помилилися ми — відправлення й повернення за наш рахунок.',
    list: ['Прийшов не той розмір або модель — міняємо без питань', 'Заводський брак — повертаємо повну суму', 'Шкарпетки й білизна обміну не підлягають'] }
];

const CONTACTS = [
  { t: 'Instagram', d: 'Основний канал: наявність, нові надходження, відповіді на запити щодня.', list: [], link: CFG.ig, linkText: '@just_shop____' },
  { t: 'Telegram', d: 'Канал із дропами й цінами. Туди ж надсилайте текст замовлення з кошика.', list: [], link: CFG.tg, linkText: 'Перейти в канал' },
  { t: 'TikTok', d: 'Відео з наявності й розпакування — видно, як річ виглядає в русі, а не на фото.', list: [], link: CFG.tiktok, linkText: '@just_shop____' },
  { t: 'Самовивіз у Києві', d: 'Адресу й час надсилаємо після підтвердження замовлення. Приміряти можна на місці, до оплати.',
    list: ['Щодня 10:00 — 21:00', 'Доставка по Україні — Нова Пошта'] }
];

/* Заголовки блоків — щоб і вони редагувалися з адмінки */
const HEAD = {
  hero_kick1: 'Just shop · Київ',
  hero_kick2: 'Офіційний партнер <b>ФК «Ростянець»</b> · <b>ФК Rebel Київ</b>',
  sale_title: 'Розпродаж',
  catalog_title: 'Каталог',
  clubs_kicker: 'Команди',
  clubs_title: 'Екіпіруємо футбольні клуби',
  faq_title: 'Часті питання',
  dlv_lead: 'Відправляємо в день оплати, якщо річ у наявності. Замовлення під запит їде після викупу в Європі — це 3—10 днів разом із дорогою.',
  trk_lead: 'Введіть номер накладної — покажемо статус прямо тут, без переходу на сайт перевізника.',
  size_lead: 'Виміри самої речі в сантиметрах. Якщо ви між двома розмірами — беріть більший: майже весь streetwear шиють вільно.',
  footer_text: 'Привозимо з Європи те, чого немає в наявності: від пари кросівок до повного комплекту для команди.'
};
