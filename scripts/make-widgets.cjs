// Делает виджеты «Тест на сегодня» для Telegram: public/daily/<n>.html и public/daily/n.txt.
// Виджет — мини-HTML до 4 КБ после сжатия, без сети; бот отправляет его через sendWidget.
// Берём только вопросы без картинки: фото в виджет не помещается.
// Запуск: node scripts/make-widgets.cjs
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const root = path.join(__dirname, '..');
const db = JSON.parse(fs.readFileSync(path.join(root, 'public/tickets/ab.json'), 'utf8'));
const out = path.join(root, 'public/daily');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

// Лимит сервера: 4096 байт после zlib уровня 9; оставляем запас.
const LIMIT = 3700;

const clip = (s, n) => {
  if (s.length <= n) return s;
  const cut = s.slice(0, n);
  const dot = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '));
  return (dot > n * 0.5 ? cut.slice(0, dot + 1) : cut.replace(/\s+\S*$/, '')) + '…';
};

// В <script> нельзя оставлять «<»: он мог бы закрыть тег.
const js = (v) => JSON.stringify(v).replace(/</g, '\\u003c');

const page = (q) => `<style>
body{margin:0;padding:12px 12px max(12px,env(safe-area-inset-bottom))}
h1{font-size:13px;font-weight:600;margin:0 0 6px;color:var(--tg-theme-hint-color)}
p{margin:0 0 10px;font-weight:600}
.o{display:block;width:100%;box-sizing:border-box;text-align:left;margin:6px 0;padding:10px 12px;border:1px solid var(--tg-theme-hint-color);border-radius:10px;background:var(--tg-theme-secondary-bg-color);color:var(--tg-theme-text-color);font:inherit}
.ok{background:#2e9e4f;border-color:#2e9e4f;color:#fff}
.no{background:#d03d3d;border-color:#d03d3d;color:#fff}
#t{display:none;margin:10px 0;font-size:14px}
#g{display:none;width:100%;padding:11px;border:0;border-radius:10px;background:var(--tg-theme-button-color);color:var(--tg-theme-button-text-color);font:inherit;font-weight:600}
</style>
<h1>Тест на сегодня</h1>
<p id=q></p><div id=l></div><div id=t></div><button id=g>Открыть тренажёр</button>
<script>
var Q=${js(q.q)},A=${js(q.a)},C=${q.c},T=${js(q.tip)},R=${js(q.rule || '')},D=0,E=function(i){return document.getElementById(i)},L=E('l'),X=E('t'),G=E('g');
E('q').textContent=Q;
A.forEach(function(a,i){var b=document.createElement('button');b.className='o';b.textContent=a;b.onclick=function(){
if(D)return;D=1;L.children[C].className='o ok';if(i!=C)b.className='o no';
X.style.display=G.style.display='block';X.textContent=(i==C?'Верно. ':'Неверно. ')+T+(R?' ('+R+')':'')};L.appendChild(b)});
G.onclick=function(){TelegramWidget.openTelegramLink('https://t.me/%BOT%/tests')};
</script>`;

// Порядок фиксированный, но перемешанный: темы чередуются.
const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const pool = db.questions.filter((q) => !q.img && q.a.length >= 2).sort((a, b) => hash(a.id) - hash(b.id));

let n = 0;
let skipped = 0;
let biggest = 0;
for (const q of pool) {
  const html = page({ ...q, tip: clip(q.tip || '', 600) });
  const size = zlib.deflateSync(Buffer.from(html), { level: 9 }).length;
  if (size > LIMIT || Buffer.byteLength(html) > 32000) {
    skipped++;
    continue;
  }
  biggest = Math.max(biggest, size);
  fs.writeFileSync(path.join(out, `${n}.html`), html);
  n++;
}
fs.writeFileSync(path.join(out, 'n.txt'), String(n));
console.log(`виджетов: ${n}, пропущено: ${skipped}, самый большой: ${biggest} Б из 4096`);
