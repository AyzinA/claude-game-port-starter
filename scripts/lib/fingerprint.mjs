/** Read-only installation fingerprinting: file statistics, magic-byte sniffing, archive listings (names only)
 * and engine identification hints. It never writes to, executes or extracts from the inspected tree. */
import { open, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const ascii = (buf, offset, text) => buf.length >= offset + text.length && buf.toString('latin1', offset, offset + text.length) === text;
const u32le = (buf, offset, value) => buf.length >= offset + 4 && buf.readUInt32LE(offset) === value;
const u32be = (buf, offset, value) => buf.length >= offset + 4 && buf.readUInt32BE(offset) === value;

/** Ordered: first match wins. Labels are hints; formats still need verification by parsing. */
export const SIGNATURES = [
  ['zip', 'ZIP container (also APK/IPA/JAR/PK3/LOVE/OBB)', b => ascii(b, 0, 'PK\x03\x04') || ascii(b, 0, 'PK\x05\x06')],
  ['pe', 'Windows PE executable/DLL', b => ascii(b, 0, 'MZ') && b.length >= 64 && ascii(b, b.readUInt32LE(60) < b.length - 4 ? b.readUInt32LE(60) : 0, 'PE\0\0')],
  ['mz', 'MZ executable (DOS or PE header beyond sniff window)', b => ascii(b, 0, 'MZ')],
  ['elf', 'ELF executable/shared object (Linux/Android native)', b => ascii(b, 0, '\x7fELF')],
  ['macho', 'Mach-O binary (macOS/iOS native)', b => [0xfeedface, 0xfeedfacf, 0xcefaedfe, 0xcffaedfe].some(v => u32be(b, 0, v))],
  ['fat-or-class', 'Mach-O universal binary or Java class', b => u32be(b, 0, 0xcafebabe)],
  ['dex', 'Android DEX bytecode', b => ascii(b, 0, 'dex\n')],
  ['unityfs', 'Unity AssetBundle (UnityFS)', b => ascii(b, 0, 'UnityFS') || ascii(b, 0, 'UnityWeb') || ascii(b, 0, 'UnityRaw')],
  ['uasset', 'Unreal package (.uasset/.umap/.upk)', b => u32le(b, 0, 0x9e2a83c1)],
  ['gdpc', 'Godot resource pack (.pck)', b => ascii(b, 0, 'GDPC')],
  ['vpk', 'Valve VPK', b => u32le(b, 0, 0x55aa1234)],
  ['vbsp', 'Source engine BSP map', b => ascii(b, 0, 'VBSP')],
  ['wad', 'id Tech WAD', b => ascii(b, 0, 'IWAD') || ascii(b, 0, 'PWAD')],
  ['wad3', 'GoldSrc WAD3 textures', b => ascii(b, 0, 'WAD3') || ascii(b, 0, 'WAD2')],
  ['quake-pak', 'Quake PACK archive', b => ascii(b, 0, 'PACK')],
  ['mpq', 'Blizzard MPQ archive', b => ascii(b, 0, 'MPQ\x1a')],
  ['xp3', 'Kirikiri XP3 archive', b => ascii(b, 0, 'XP3\r\n \n\x1a')],
  ['rgss', 'RPG Maker XP/VX/Ace encrypted archive', b => ascii(b, 0, 'RGSSAD\0')],
  ['rpa', "Ren'Py archive", b => ascii(b, 0, 'RPA-')],
  ['swf', 'Adobe Flash SWF', b => ascii(b, 0, 'FWS') || ascii(b, 0, 'CWS') || ascii(b, 0, 'ZWS')],
  ['xnb', 'XNA/MonoGame/FNA content', b => ascii(b, 0, 'XNB')],
  ['aiff', 'AIFF audio', b => ascii(b, 0, 'FORM') && (ascii(b, 8, 'AIFF') || ascii(b, 8, 'AIFC'))],
  ['iff-form', 'IFF FORM container (GameMaker data.win uses FORM)', b => ascii(b, 0, 'FORM')],
  ['vdf', 'ZenGin VDF archive (Gothic)', b => ascii(b, 256, 'PSVDSC_V2.00')],
  ['bsa', 'Bethesda BSA/BA2 archive', b => ascii(b, 0, 'BSA\0') || ascii(b, 0, 'BTDX')],
  ['cpk', 'CRI CPK archive', b => ascii(b, 0, 'CPK ')],
  ['usm', 'CRI USM video', b => ascii(b, 0, 'CRID')],
  ['bink', 'Bink video', b => ascii(b, 0, 'BIK') || ascii(b, 0, 'KB2')],
  ['smacker', 'Smacker video', b => ascii(b, 0, 'SMK2') || ascii(b, 0, 'SMK4')],
  ['bnk', 'Wwise sound bank', b => ascii(b, 0, 'BKHD')],
  ['akpk', 'Wwise file package', b => ascii(b, 0, 'AKPK')],
  ['fsb', 'FMOD sound bank', b => ascii(b, 0, 'FSB4') || ascii(b, 0, 'FSB5')],
  ['fmod-bank', 'FMOD Studio bank', b => ascii(b, 0, 'RIFF') && ascii(b, 8, 'FEV ')],
  ['wav', 'RIFF WAVE audio', b => ascii(b, 0, 'RIFF') && ascii(b, 8, 'WAVE')],
  ['avi', 'RIFF AVI video', b => ascii(b, 0, 'RIFF') && ascii(b, 8, 'AVI ')],
  ['webp', 'WebP image', b => ascii(b, 0, 'RIFF') && ascii(b, 8, 'WEBP')],
  ['riff', 'RIFF container', b => ascii(b, 0, 'RIFF')],
  ['ogg', 'Ogg (Vorbis/Opus/Theora)', b => ascii(b, 0, 'OggS')],
  ['flac', 'FLAC audio', b => ascii(b, 0, 'fLaC')],
  ['mp3', 'MP3 audio', b => ascii(b, 0, 'ID3') || (b.length > 1 && b[0] === 0xff && (b[1] & 0xe0) === 0xe0)],
  ['mp4', 'MP4/MOV video', b => ascii(b, 4, 'ftyp') || ascii(b, 4, 'moov')],
  ['mkv', 'Matroska/WebM', b => u32be(b, 0, 0x1a45dfa3)],
  ['png', 'PNG image', b => ascii(b, 0, '\x89PNG')],
  ['jpeg', 'JPEG image', b => b.length > 2 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff],
  ['gif', 'GIF image', b => ascii(b, 0, 'GIF8')],
  ['dds', 'DirectDraw Surface texture', b => ascii(b, 0, 'DDS ')],
  ['ktx', 'KTX texture', b => ascii(b, 1, 'KTX ')],
  ['pvr', 'PowerVR texture', b => ascii(b, 0, 'PVR\x03') || u32le(b, 44, 0x21525650)],
  ['astc', 'ASTC texture', b => u32le(b, 0, 0x5ca1ab13)],
  ['gltf', 'glTF binary', b => ascii(b, 0, 'glTF')],
  ['fbx', 'FBX model', b => ascii(b, 0, 'Kaydara FBX Binary')],
  ['ttf', 'TrueType/OpenType font', b => u32be(b, 0, 0x00010000) || ascii(b, 0, 'OTTO') || ascii(b, 0, 'true')],
  ['woff', 'WOFF font', b => ascii(b, 0, 'wOFF') || ascii(b, 0, 'wOF2')],
  ['lua', 'Lua bytecode', b => ascii(b, 0, '\x1bLua')],
  ['luajit', 'LuaJIT bytecode', b => ascii(b, 0, '\x1bLJ')],
  ['sqlite', 'SQLite database', b => ascii(b, 0, 'SQLite format 3\0')],
  ['gzip', 'gzip stream', b => b.length > 1 && b[0] === 0x1f && b[1] === 0x8b],
  ['zstd', 'Zstandard stream', b => u32le(b, 0, 0xfd2fb528)],
  ['lz4', 'LZ4 frame', b => u32le(b, 0, 0x184d2204)],
  ['xz', 'xz stream', b => ascii(b, 0, '\xfd7zXZ\0')],
  ['7z', '7-Zip archive', b => ascii(b, 0, '7z\xbc\xaf\x27\x1c')],
  ['rar', 'RAR archive', b => ascii(b, 0, 'Rar!')],
  ['bz2', 'bzip2 stream', b => ascii(b, 0, 'BZh')],
  ['xml', 'XML text', b => ascii(b, 0, '<?xml') || ascii(b, 3, '<?xml')],
  ['json', 'JSON text (heuristic)', b => b.length > 0 && (b[0] === 0x7b || b[0] === 0x5b)],
];

export function sniff(buf) {
  for (const [id, label, test] of SIGNATURES) {
    try { if (test(buf)) return { id, label }; } catch { /* malformed header */ }
  }
  return null;
}

/** Path rules on lowercased '/'-separated relative paths. Inner archive entries appear as `outer.apk!/inner`. */
export const ENGINE_RULES = [
  { engine: 'Unity', playbook: 'unity', rules: [
    [/(^|\/)unityplayer\.(dll|dylib|so)$/, 5, 'Unity player library'], [/(^|\/)libunity\.so$/, 5, 'Android Unity player'],
    [/_data\/(globalgamemanagers|data\.unity3d|mainData)$/, 4, 'Unity data folder'], [/(^|\/)resources\.assets$/, 3, 'resources.assets'],
    [/(^|\/)sharedassets\d+\.assets$/, 3, 'sharedassets*.assets'], [/(^|\/)assets\/bin\/data\//, 4, 'Android Unity data'],
    [/(^|\/)gameassembly\.(dll|so|dylib)$|(^|\/)libil2cpp\.so$/, 3, 'IL2CPP build (C# compiled to native)'],
    [/managed\/assembly-csharp\.dll$/, 3, 'Mono build (game C# in Assembly-CSharp.dll)'] ] },
  { engine: 'Unreal Engine 4/5', playbook: 'unreal', rules: [
    [/content\/paks\/[^/]+\.pak$/, 5, 'UE4/5 pak files'], [/\.ucas$|\.utoc$/, 4, 'IoStore containers (UE4.26+)'],
    [/(^|\/)engine\/binaries\//, 3, 'Engine binaries folder'], [/\.uasset$|\.umap$/, 3, 'loose uasset/umap'] ] },
  { engine: 'Unreal Engine 1-3', playbook: 'unreal', rules: [
    [/\.upk$|\.u$|\.utx$|\.unr$|\.uax$|\.umx$/, 3, 'UE1-3 packages'], [/(^|\/)cookedpc(console)?\//, 4, 'UE3 cooked content'] ] },
  { engine: 'Godot', playbook: 'godot', rules: [
    [/\.pck$/, 4, 'Godot pack'], [/(^|\/)project\.godot$|\.import$/, 5, 'Godot project files'], [/(^|\/)libgodot[^/]*\.so$/, 5, 'Android Godot'] ] },
  { engine: 'GameMaker', playbook: 'gamemaker', rules: [
    [/(^|\/)(data\.win|game\.unx|game\.ios|game\.droid)$/, 6, 'GameMaker data file'], [/(^|\/)libyoyo\.so$/, 5, 'Android GameMaker runner'] ] },
  { engine: 'RPG Maker MV/MZ (HTML5)', playbook: 'rpgmaker-mvmz', rules: [
    [/(^|\/)js\/(rpg_core|rmmz_core)\.js$/, 6, 'RPG Maker core script'], [/(^|\/)data\/system\.json$/, 3, 'RPG Maker data/System.json'],
    [/\.rpgmvp$|\.png_$|\.rpgmvo$|\.ogg_$/, 3, 'encrypted RPG Maker assets'] ] },
  { engine: 'RPG Maker XP/VX/VX Ace (RGSS)', playbook: 'rpgmaker-rgss', rules: [
    [/\.rgssad$|\.rgss2a$|\.rgss3a$/, 6, 'RGSS archive'], [/(^|\/)rgss\d+\w*\.dll$/, 5, 'RGSS runtime DLL'], [/(^|\/)data\/scripts\.(rxdata|rvdata2?)$/, 5, 'RGSS scripts'] ] },
  { engine: "Ren'Py", playbook: 'renpy', rules: [
    [/(^|\/)renpy\//, 5, "Ren'Py runtime folder"], [/\.rpa$/, 4, "Ren'Py archive"], [/\.rpyc$/, 4, "compiled Ren'Py script"] ] },
  { engine: 'Source engine', playbook: 'source', rules: [
    [/\.vpk$/, 4, 'VPK archives'], [/(^|\/)gameinfo\.txt$/, 4, 'gameinfo.txt'], [/\.bsp$/, 1, 'BSP maps'] ] },
  { engine: 'GoldSrc', playbook: 'source', rules: [[/(^|\/)hl\.exe$/, 4, 'hl.exe'], [/(^|\/)valve\/.*\.wad$/, 3, 'WAD3 textures']] },
  { engine: 'id Tech 1-3', playbook: 'idtech', rules: [
    [/\.pk3$/, 3, 'PK3 archives'], [/\.wad$/, 2, 'WAD files'], [/(^|\/)(baseq3|id1|baseq2)\//, 5, 'id Tech base folder'] ] },
  { engine: 'Adobe Flash / AIR', playbook: 'flash', rules: [[/\.swf$/, 5, 'SWF movie'], [/meta-inf\/air\/application\.xml$/, 5, 'AIR descriptor']] },
  { engine: 'XNA / FNA / MonoGame', playbook: 'xna', rules: [
    [/\.xnb$/, 4, 'XNB content'], [/(^|\/)(monogame\.framework|fna|microsoft\.xna\.framework[^/]*)\.dll$/, 5, 'XNA-family framework'] ] },
  { engine: 'LÖVE (Lua)', playbook: 'love2d', rules: [[/(^|\/)love\.(dll|so)$|\.love$/, 5, 'LÖVE runtime or .love archive']] },
  { engine: 'Electron / NW.js (HTML5)', playbook: 'html5', rules: [
    [/(^|\/)resources\/app\.asar$/, 5, 'Electron app.asar'], [/(^|\/)(nw\.dll|package\.nw)$/, 5, 'NW.js'] ] },
  { engine: 'Construct', playbook: 'html5', rules: [[/(^|\/)c[23]runtime\.js$/, 6, 'Construct runtime']] },
  { engine: 'Cocos2d-x / Cocos Creator', playbook: 'cocos', rules: [[/(^|\/)libcocos2d\w*\.(so|dll)$|(^|\/)cocos2d\w*\.dll$/, 5, 'Cocos runtime'], [/\.jsc$/, 3, 'compiled Cocos JS']] },
  { engine: 'Defold', playbook: 'defold', rules: [[/(^|\/)game\.(arcd|dmanifest|projectc)$/, 6, 'Defold archive']] },
  { engine: 'Clickteam Fusion', playbook: 'clickteam', rules: [[/\.ccn$|\.mfa$/, 4, 'Clickteam data'], [/(^|\/)mmfs2\.dll$|\.mfx$/, 4, 'Clickteam runtime/extension']] },
  { engine: 'Kirikiri (KAG)', playbook: 'kirikiri', rules: [[/\.xp3$/, 5, 'XP3 archive']] },
  { engine: 'ZenGin (Gothic)', playbook: 'zengin', rules: [[/\.vdf$|\.mod$/, 3, 'VDF archives'], [/(^|\/)_work\/data\//, 4, 'ZenGin _work folder']] },
  { engine: 'Gamebryo / Creation', playbook: 'gamebryo', rules: [[/\.bsa$|\.ba2$/, 4, 'Bethesda archives'], [/\.esm$|\.esp$/, 4, 'plugin data']] },
  { engine: 'Java / libGDX', playbook: 'java', rules: [[/\.jar$/, 2, 'JAR'], [/com\/badlogic\/gdx\//, 6, 'libGDX classes']] },
  { engine: 'DOS', playbook: 'dos', rules: [[/(^|\/)dos4gw\.exe$/, 6, 'DOS/4GW extender'], [/\.com$/, 1, 'COM executable'], [/dosbox[^/]*\.conf$/, 5, 'DOSBox config']] },
  { engine: 'Android package', playbook: 'mobile', rules: [[/\.(apk|xapk|aab)$/, 3, 'Android package'], [/!\/androidmanifest\.xml$/, 4, 'AndroidManifest.xml'], [/\.obb$/, 2, 'OBB expansion']] },
  { engine: 'iOS package', playbook: 'mobile', rules: [[/\.ipa$/, 3, 'iOS package'], [/!\/payload\/[^/]+\.app\//, 4, 'iOS app bundle']] },
];

export function fingerprintEngines(paths) {
  const found = [];
  for (const { engine, playbook, rules } of ENGINE_RULES) {
    let score = 0;
    const evidence = [];
    for (const [pattern, weight, note] of rules) {
      const hits = paths.filter(p => pattern.test(p));
      if (!hits.length) continue;
      score += weight;
      evidence.push(`${note}: ${hits.length} match(es), e.g. \`${hits[0]}\``);
    }
    if (score > 0) found.push({ engine, playbook, score, evidence });
  }
  return found.sort((a, b) => b.score - a.score);
}

/** Lists ZIP entry names from the central directory without decompressing anything. */
export async function listZipEntries(file, maxEntries = 100_000) {
  const handle = await open(file, 'r');
  try {
    const { size } = await handle.stat();
    const tailSize = Math.min(size, 65_557);
    const tail = Buffer.alloc(tailSize);
    await handle.read(tail, 0, tailSize, size - tailSize);
    let eocd = -1;
    for (let i = tailSize - 22; i >= 0; i--) if (tail.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) throw new Error('No ZIP end-of-central-directory record');
    let cdSize = tail.readUInt32LE(eocd + 12);
    let cdOffset = tail.readUInt32LE(eocd + 16);
    if ((cdSize === 0xffffffff || cdOffset === 0xffffffff) && eocd >= 20 && tail.readUInt32LE(eocd - 20) === 0x07064b50) {
      const z64 = Buffer.alloc(56);
      await handle.read(z64, 0, 56, Number(tail.readBigUInt64LE(eocd - 12)));
      if (z64.readUInt32LE(0) !== 0x06064b50) throw new Error('Bad ZIP64 record');
      cdSize = Number(z64.readBigUInt64LE(40));
      cdOffset = Number(z64.readBigUInt64LE(48));
    }
    if (cdSize > 64 * 1024 * 1024 || cdOffset + cdSize > size) throw new Error('Central directory out of bounds');
    const cd = Buffer.alloc(cdSize);
    await handle.read(cd, 0, cdSize, cdOffset);
    const names = [];
    let p = 0;
    while (p + 46 <= cd.length && cd.readUInt32LE(p) === 0x02014b50 && names.length < maxEntries) {
      const nameLength = cd.readUInt16LE(p + 28);
      const total = 46 + nameLength + cd.readUInt16LE(p + 30) + cd.readUInt16LE(p + 32);
      names.push(cd.toString('utf8', p + 46, p + 46 + nameLength));
      p += total;
    }
    return names;
  } finally { await handle.close(); }
}

async function readHead(file, bytes = 320) {
  const handle = await open(file, 'r');
  try {
    const buf = Buffer.alloc(bytes);
    const { bytesRead } = await handle.read(buf, 0, bytes, 0);
    return buf.subarray(0, bytesRead);
  } finally { await handle.close(); }
}

async function walk(root, maxFiles) {
  const files = [];
  const todo = [''];
  let truncated = false;
  while (todo.length) {
    const rel = todo.pop();
    let entries;
    try { entries = await readdir(path.join(root, rel), { withFileTypes: true }); } catch { continue; }
    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      const child = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) todo.push(child);
      else if (entry.isFile()) {
        if (files.length >= maxFiles) { truncated = true; break; }
        files.push({ path: child, size: (await stat(path.join(root, child))).size });
      }
    }
  }
  return { files: files.sort((a, b) => a.path.localeCompare(b.path)), truncated };
}

const ZIP_EXT = /\.(zip|apk|xapk|aab|ipa|obb|jar|pk3|pk4|love|nw)$/i;
const IGNORE = new Set(['game.json', 'README.md']);

export async function inventory(root, { maxFiles = 200_000, sniffPerExtension = 4 } = {}) {
  const { files, truncated } = await walk(root, maxFiles);
  const list = files.filter(f => !IGNORE.has(f.path));
  const byExt = new Map();
  for (const file of list) {
    const ext = path.extname(file.path).toLowerCase() || '(none)';
    const row = byExt.get(ext) ?? { ext, count: 0, bytes: 0, formats: new Map(), samples: [] };
    row.count++;
    row.bytes += file.size;
    if (row.samples.length < sniffPerExtension) row.samples.push(file.path);
    byExt.set(ext, row);
  }
  for (const row of byExt.values()) {
    for (const sample of row.samples) {
      try {
        const hit = sniff(await readHead(path.join(root, sample)));
        const label = hit?.label ?? 'unknown';
        row.formats.set(label, (row.formats.get(label) ?? 0) + 1);
      } catch { row.formats.set('unreadable', (row.formats.get('unreadable') ?? 0) + 1); }
    }
  }
  const archives = [];
  const innerPaths = [];
  for (const file of list.filter(f => ZIP_EXT.test(f.path)).slice(0, 50)) {
    try {
      const names = await listZipEntries(path.join(root, file.path));
      archives.push({ path: file.path, size: file.size, entries: names.length, sample: names.slice(0, 12) });
      for (const name of names) innerPaths.push(`${file.path}!/${name}`.toLowerCase());
    } catch (e) { archives.push({ path: file.path, size: file.size, error: e.message }); }
  }
  const topLevel = new Map();
  for (const file of list) {
    const top = file.path.includes('/') ? `${file.path.split('/')[0]}/` : '(root files)';
    const row = topLevel.get(top) ?? { dir: top, count: 0, bytes: 0 };
    row.count++;
    row.bytes += file.size;
    topLevel.set(top, row);
  }
  const allPaths = [...list.map(f => f.path.toLowerCase()), ...innerPaths];
  return {
    generatedAt: new Date().toISOString(),
    fileCount: list.length,
    totalBytes: list.reduce((sum, f) => sum + f.size, 0),
    truncated,
    extensions: [...byExt.values()].sort((a, b) => b.bytes - a.bytes)
      .map(r => ({ ext: r.ext, count: r.count, bytes: r.bytes, formats: Object.fromEntries(r.formats), sample: r.samples[0] })),
    topLevel: [...topLevel.values()].sort((a, b) => b.bytes - a.bytes),
    archives,
    engines: fingerprintEngines(allPaths),
  };
}

const mib = bytes => `${(bytes / 1048576).toFixed(1)} MiB`;
const cell = value => String(value).replace(/\|/g, '\\|');

export function renderInventoryMarkdown(report) {
  const lines = [
    '# Installation inventory (read-only, generated)', '',
    `Generated ${report.generatedAt} by \`npm run inventory\`. Relative paths only; the source root is not recorded.`,
    'This is evidence for docs/02-RESEARCH.md, not a feasibility verdict. Magic-byte labels are hints until a parser confirms them.', '',
    `**Files:** ${report.fileCount}${report.truncated ? ' (TRUNCATED: raise --max-files)' : ''} · **Total:** ${mib(report.totalBytes)}`, '',
    '## Engine candidates', '',
  ];
  if (!report.engines.length) lines.push('_No known engine signature. Inspect executables, top-level folders and the largest files manually._');
  else {
    lines.push('| Engine | Score | Playbook | Evidence |', '|---|---|---|---|');
    for (const e of report.engines) lines.push(`| ${e.engine} | ${e.score} | docs/19-ENGINE-PLAYBOOKS.md#${e.playbook} | ${cell(e.evidence.join('<br>'))} |`);
  }
  lines.push('', '## Extensions by size', '', '| Ext | Files | Size | Sniffed formats (sampled) | Example |', '|---|---|---|---|---|');
  for (const r of report.extensions.slice(0, 60)) {
    const formats = Object.entries(r.formats).map(([k, v]) => `${k} ×${v}`).join(', ');
    lines.push(`| ${cell(r.ext)} | ${r.count} | ${mib(r.bytes)} | ${cell(formats)} | \`${cell(r.sample)}\` |`);
  }
  lines.push('', '## Top-level folders', '', '| Folder | Files | Size |', '|---|---|---|');
  for (const t of report.topLevel.slice(0, 40)) lines.push(`| \`${cell(t.dir)}\` | ${t.count} | ${mib(t.bytes)} |`);
  if (report.archives.length) {
    lines.push('', '## ZIP-family packages (names only, nothing extracted)', '', '| Package | Size | Entries | Sample |', '|---|---|---|---|');
    for (const a of report.archives) {
      lines.push(`| \`${cell(a.path)}\` | ${mib(a.size)} | ${a.error ? `error: ${cell(a.error)}` : a.entries} | ${a.sample ? cell(a.sample.join(', ')) : ''} |`);
    }
  }
  lines.push('', '## Next probes', '',
    '1. Open the top engine candidate playbook and confirm the engine/version from a version file or executable resources.',
    '2. List one archive with a bounded parser; decode one texture and one UI font (docs/05, docs/17).',
    '3. Locate front-end data: menu/layout definitions, string tables, credits text, intro/ending videos (docs/16).',
    '4. Locate level/chapter lists to seed project/PLAYTHROUGH_MAP.md.');
  return `${lines.join('\n')}\n`;
}
