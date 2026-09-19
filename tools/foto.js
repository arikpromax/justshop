/* ============================================================
   ФОТО ТОВАРІВ — обробка того, що ви поклали в теку «fotoi».

   Як користуватись:
     1. Зберігаєте картинку під іменем артикула: IB3082-001.jpg
        (будь-який формат, будь-який розмір, фон неважливий).
     2. Кладете її в теку fotoi.
     3. Запускаєте ФОТО.bat.

   Далі все робиться само: картинка обрізається по товару, стає
   квадратом на білому, кросівки розвертаються носком уліво, файл
   стискається у webp і лягає в img/p під правильним іменем.
   Оригінал переїжджає в fotoi/готово, щоб не оброблявся двічі.
   Наприкінці зміни йдуть на сайт.

   Артикул звіряється з базою: якщо такого товару немає, файл не
   обробляється, а ім'я виводиться в списку помилок — значить,
   в імені одрук.
   ============================================================ */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const IN = path.join(ROOT, "fotoi");
const OUT = path.join(ROOT, "img", "p");
const DONE = path.join(IN, "готово");
const SIDE = 1200;

const DB = "https://ortiatyxntdikaldepbp.supabase.co/rest/v1";
const KEY = "sb_publishable_UW1Z8ukEU1XWVCdQxIGkDw_firK4hpO";
const SITE = 106;

/* sharp лежить у сусідньому проєкті — на цій машині він один на всіх */
let sharp;
try {
  sharp = require("D:/claude/platform/node_modules/sharp");
} catch (e) {
  try {
    sharp = require("sharp");
  } catch (e2) {
    console.log("\n  Не знайшов бібліотеку обробки картинок (sharp).");
    console.log("  Скажіть про це Клоду — він поставить.\n");
    process.exit(1);
  }
}

const KINDS = /\.(jpe?g|png|webp|gif|bmp|avif|heic)$/i;

/* Куди дивиться кросівок: найвища точка профілю — це халява біля пʼяти,
   тож коли вона ліворуч, взуття дивиться вправо і його треба дзеркалити. */
async function facesRight(buf) {
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = info.channels;
  const ink = (x, y) => {
    const i = (y * W + x) * C;
    return data[i] < 238 || data[i + 1] < 238 || data[i + 2] < 238;
  };
  let x0 = W, x1 = -1, y0 = H, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (ink(x, y)) {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  if (x1 < 0) return false;
  const w = x1 - x0, h = y1 - y0, top = [];
  for (let x = x0; x <= x1; x++) {
    let t = y1;
    for (let y = y0; y <= y1; y++) if (ink(x, y)) { t = y; break; }
    top.push(t);
  }
  const avg = (a, b) => {
    const s = top.slice(Math.round(w * a), Math.round(w * b));
    return s.reduce((p, c) => p + c, 0) / (s.length || 1);
  };
  return avg(0, 0.3) < avg(0.7, 1) - h * 0.04;
}

async function main() {
  fs.mkdirSync(IN, { recursive: true });
  fs.mkdirSync(OUT, { recursive: true });

  const files = fs.readdirSync(IN).filter((f) => KINDS.test(f));
  if (!files.length) {
    console.log("\n  У теці fotoi немає картинок.");
    console.log("  Покладіть їх туди з іменем артикула — напр. IB3082-001.jpg\n");
    return;
  }
  console.log("\n  Знайшов картинок: " + files.length + "\n");

  /* список товарів із бази: щоб звірити артикул і знати, чи це взуття */
  let items = [];
  try {
    const r = await fetch(
      DB + "/items?site_id=eq." + SITE + "&collection=eq.products&select=title,extra&limit=1000",
      { headers: { apikey: KEY } },
    );
    items = await r.json();
  } catch (e) {
    console.log("  Не дістався до бази — артикули не звірятиму, оброблю як є.\n");
  }
  const bySku = new Map();
  items.forEach((x) => {
    const s = String((x.extra || {}).sku || "").trim();
    if (s) bySku.set(s.toUpperCase(), { sku: s, cat: (x.extra || {}).cat || "", title: x.title });
  });

  const ok = [], bad = [];
  for (const f of files) {
    const name = path.basename(f, path.extname(f)).trim();
    const found = bySku.size ? bySku.get(name.toUpperCase()) : { sku: name, cat: "", title: "" };
    if (!found) { bad.push(f); continue; }

    try {
      const src = fs.readFileSync(path.join(IN, f));
      const cut = await sharp(src)
        .flatten({ background: "#ffffff" })
        .trim({ threshold: 12 })
        .toBuffer()
        .catch(() => src);
      const cm = await sharp(cut).metadata();
      const side = Math.min(Math.max(cm.width, cm.height), SIDE);
      let body = await sharp(cut)
        .resize(Math.round(side * 0.94), Math.round(side * 0.94), { fit: "inside" })
        .toBuffer();
      if (found.cat === "vzuttia" && (await facesRight(body))) {
        body = await sharp(body).flop().toBuffer();
      }
      const bm = await sharp(body).metadata();
      let img = sharp({ create: { width: side, height: side, channels: 3, background: "#ffffff" } })
        .composite([{
          input: body,
          top: Math.round((side - bm.height) / 2),
          left: Math.round((side - bm.width) / 2),
        }]);
      if (side < 1100) img = img.sharpen({ sigma: 0.8, m1: 0.5, m2: 2 });
      const out = await img.webp({ quality: 88 }).toBuffer();

      fs.writeFileSync(path.join(OUT, found.sku + ".webp"), out);
      fs.mkdirSync(DONE, { recursive: true });
      fs.renameSync(path.join(IN, f), path.join(DONE, f));
      ok.push({ sku: found.sku, px: side, kb: Math.round(out.length / 1024), title: found.title });
      console.log("   ✔ " + found.sku.padEnd(16) + side + "px  " + Math.round(out.length / 1024) + " КБ  " +
        String(found.title).slice(0, 34));
    } catch (e) {
      bad.push(f + "  (" + String(e.message).slice(0, 40) + ")");
    }
  }

  if (!ok.length) {
    console.log("\n  Нічого не обробилось.");
    if (bad.length) console.log("  Не впізнав: " + bad.join(", "));
    return;
  }

  /* перелік фото — за ним сайт підставляє картинки товарам */
  const list = fs.readdirSync(OUT).filter((f) => f.endsWith(".webp")).map((f) => f.replace(/\.webp$/, ""));
  fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(list));

  console.log("\n  Оброблено: " + ok.length + " | усього фото на сайті: " + list.length);
  if (bad.length) {
    console.log("\n  Не впізнав артикул у файлах:");
    bad.forEach((b) => console.log("   ✗ " + b));
    console.log("  Перевірте ім'я файлу — воно має точно збігатися з артикулом у картці товару.");
  }

  /* викладаємо на сайт */
  try {
    console.log("\n  Викладаю на сайт…");
    execSync("git add img/p", { cwd: ROOT, stdio: "pipe" });
    execSync('git commit -m "Фото товарів: +' + ok.length + ' (' + ok.map((o) => o.sku).slice(0, 6).join(", ") + ')"',
      { cwd: ROOT, stdio: "pipe" });
    execSync("git push origin main", { cwd: ROOT, stdio: "pipe" });
    console.log("  Готово. За хвилину-дві фото зʼявляться на сайті.\n");
  } catch (e) {
    console.log("  Файли оброблені, але викласти не вийшло — скажіть Клоду, він допоможе.\n");
  }
}

main();
