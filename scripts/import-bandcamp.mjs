// Importa lançamentos do Bandcamp da Biruta para src/content.
//
// Uso:
//   npm run import:bandcamp            -> lê do Bandcamp (precisa de internet) e cria só o que é novo
//   npm run import:bandcamp -- --json src/data/bandcamp-import.json   -> usa um dump local
//   acrescenta --force para reescrever ficheiros existentes (perde edições feitas no CMS!)
//
// Nunca apaga nada. Lançamentos/artistas que já existem em src/content não são tocados sem --force.

import fs from 'node:fs';
import path from 'node:path';

const BANDCAMP = 'https://birutarecords.bandcamp.com';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DIR = {
  releases: path.join(ROOT, 'src/content/releases'),
  artists: path.join(ROOT, 'src/content/artists'),
  covers: path.join(ROOT, 'src/assets/covers'),
};
const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const jsonArg = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;

// Nomes como aparecem no Bandcamp -> nome canónico no site
const NAME_FIX = {
  'MALABOOS': 'Malaboos',
  'MONA LINDA': 'Mona Linda',
  'David Bruno 𝓭𝓑': 'David Bruno',
};
// Formato definido à mão quando a regra automática (faixa = Single, ≤6 faixas = EP) falha
const FORMAT_FIX = {
  'pensava-que-eramos-amigos': 'Álbum',
  'no-ar-ao-vivo-na-antena-3': 'Ao vivo',
};

const slugify = (s) =>
  s.replace(/['’]/g, '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const y = (v) => JSON.stringify(v ?? ''); // string JSON = string YAML válida (aspas duplas)
const decode = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

function splitArtists(str) {
  return str.split(/\s+&\s+/).map((n) => NAME_FIX[n.trim()] ?? n.trim());
}

function toRelease(r) {
  const title = r.title.trim();
  const slug = slugify(title);
  const isTrack = r.type === 'track';
  const nTracks = r.tracks.length;
  const format = FORMAT_FIX[slug] ?? (isTrack ? 'Single' : nTracks <= 6 ? 'EP' : 'Álbum');
  const date = new Date(r.release_date).toISOString().slice(0, 10);
  const catalog = (r.credits || '').match(/\bBR\d{3}\b/)?.[0] ?? '';
  const artists = splitArtists(r.artist);
  const prefix = new RegExp('^' + r.artist.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s+-\\s+');
  const tracks = r.tracks.map((t) => ({
    title: t.title.replace(prefix, '').trim(),
    duration: t.dur ? `${Math.floor(t.dur / 60)}:${String(t.dur % 60).padStart(2, '0')}` : '',
  }));
  return { slug, title, artists, artistLine: artists.join(' & '), date, format, catalog, tracks, r, bcSlug: r.path.split('/').pop() };
}

function releaseMd(x) {
  const fm = [
    '---',
    `title: ${y(x.title)}`,
    `artists: [${x.artists.map((a) => y(slugify(a))).join(', ')}]`,
    `artist_line: ${y(x.artistLine)}`,
    `date: ${x.date}`,
    `format: ${y(x.format)}`,
    `catalog: ${y(x.catalog)}`,
    `cover: ../../assets/covers/${x.slug}.jpg`,
    `bandcamp_url: ${y(BANDCAMP + x.r.path)}`,
    `bandcamp_id: ${x.r.id}`,
    `bandcamp_type: ${x.r.type}`,
    'tracks:',
    ...x.tracks.map((t) => `  - { title: ${y(t.title)}, duration: ${y(t.duration)} }`),
    `credits: ${y((x.r.credits || '').replace(/\r\n/g, '\n').trim())}`,
    '---',
    '',
    (x.r.about || '').replace(/\r\n/g, '\n').trim(),
    '',
  ];
  return fm.join('\n');
}

function artistMd(name, roster) {
  return [
    '---',
    `name: ${y(name)}`,
    `roster: ${roster}`,
    `photo: ""`,
    'links:',
    '  instagram: ""',
    '  spotify: ""',
    '  website: ""',
    '---',
    '',
    '',
  ].join('\n');
}

async function fetchLive() {
  const html = await fetch(BANDCAMP + '/music').then((r) => r.text());
  const hrefs = [...new Set([...html.matchAll(/href="(\/(?:album|track)\/[^"?#]+)"/g)].map((m) => m[1]))];
  const out = [];
  for (const h of hrefs) {
    const page = await fetch(BANDCAMP + h).then((r) => r.text());
    const raw = page.match(/data-tralbum="([^"]+)"/)?.[1];
    if (!raw) { console.warn('sem data-tralbum:', h); continue; }
    const t = JSON.parse(decode(raw));
    out.push({
      path: h, type: t.item_type, id: t.id, title: t.current.title, artist: t.artist,
      release_date: t.current.release_date || t.album_release_date,
      about: t.current.about, credits: t.current.credits,
      art: t.art_id ? `https://f4.bcbits.com/img/a${String(t.art_id).padStart(10, '0')}_16.jpg` : null,
      tracks: (t.trackinfo || []).map((x) => ({ n: x.track_num, title: x.title, dur: Math.round(x.duration || 0) })),
    });
  }
  return out;
}

const releases = jsonArg
  ? JSON.parse(fs.readFileSync(path.resolve(ROOT, jsonArg), 'utf8')).releases
  : await fetchLive();

for (const d of Object.values(DIR)) fs.mkdirSync(d, { recursive: true });

const items = releases.map(toRelease);
const lastByArtist = new Map();
let created = 0, skipped = 0;

for (const x of items) {
  // capa: renomeia a do dump (slug do Bandcamp) ou descarrega
  const cover = path.join(DIR.covers, `${x.slug}.jpg`);
  const bcCover = path.join(DIR.covers, `${x.bcSlug}.jpg`);
  if (!fs.existsSync(cover)) {
    if (fs.existsSync(bcCover)) fs.renameSync(bcCover, cover);
    else if (!jsonArg && x.r.art) {
      const buf = Buffer.from(await fetch(x.r.art.replace(/_\d+\.jpg$/, '_16.jpg')).then((r) => r.arrayBuffer()));
      fs.writeFileSync(cover, buf);
    } else console.warn('⚠ falta capa:', x.slug);
  }
  const file = path.join(DIR.releases, `${x.slug}.md`);
  if (fs.existsSync(file) && !FORCE) { skipped++; } else { fs.writeFileSync(file, releaseMd(x)); created++; }
  x.artists.forEach((a, i) => {
    const prev = lastByArtist.get(a) ?? { date: '0000', primary: false };
    lastByArtist.set(a, { date: x.date > prev.date ? x.date : prev.date, primary: prev.primary || i === 0 });
  });
}

let newArtists = 0;
for (const [name, info] of lastByArtist) {
  const file = path.join(DIR.artists, `${slugify(name)}.md`);
  if (fs.existsSync(file) && !FORCE) continue;
  // roster por defeito: artista principal com lançamento desde 2022 (confirmar no CMS)
  fs.writeFileSync(file, artistMd(name, info.primary && info.date >= '2022'));
  newArtists++;
}

console.log(`Lançamentos: ${created} criados, ${skipped} já existiam. Artistas novos: ${newArtists}.`);
