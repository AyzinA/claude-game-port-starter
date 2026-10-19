import './styles.css';
import { DemoWorld } from './runtime/DemoWorld';
import { OverlayVfs } from './vfs/OverlayVfs';
import { listUserSelectedGameDirectory } from './import/LocalGameImport';
import { loadLocalModZip } from './mods/ModSideload';
import { preloadLibrary, preloadModsForSelectedGame } from './import/PreloadedLibrary';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('#app not found');
const vfs = new OverlayVfs();

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

const shell = element('main', 'shell');
app.appendChild(shell);
const header = element('header', 'header');
header.append(element('div', 'eyebrow', 'CLEAN-ROOM GAME ENGINE TOOLKIT'));
header.append(element('h1', '', 'Game Port Lab'));
header.append(element('p', 'lede', 'Research first. Import original game data locally. Extend using safe mod overlays.'));
shell.append(header);

const panels = element('div', 'panels');
shell.append(panels);
const stage = element('section', 'stage');
panels.append(stage);
const statusTag = element('span', 'pill', 'NEUTRAL DEMO · NOT A PORT');
const stageHeader = element('div', 'stage-header');
stageHeader.append(element('h2', '', 'Three.js runtime shell'), statusTag);
stage.append(stageHeader);
const canvasMount = element('div', 'canvas-mount');
stage.append(canvasMount);
new DemoWorld(canvasMount);
stage.append(element('p', 'muted', 'Procedural scene only. Original game assets appear after implementing that game’s format adapter.'));

const sidebar = element('aside', 'sidebar');
panels.append(sidebar);
sidebar.append(element('h2', '', 'Local import & mod overlay'));
sidebar.append(element('p', 'muted', 'Local game and mods are auto-detected from public/game and public/mods. Manual import is available when no game is preloaded. Nothing is uploaded externally.')); 

const gameIdLabel = element('label', 'field-label', 'Selected game profile ID');
const gameId = element('input', 'text-input');
gameId.type = 'text';
gameId.value = 'demo';
gameId.autocomplete = 'off';
gameId.setAttribute('aria-label', 'Selected game profile ID');
sidebar.append(gameIdLabel, gameId);

const folderButton = element('button', 'button primary', 'Choose original game folder');
const folderInput = element('input');
folderInput.type = 'file';
folderInput.multiple = true;
folderInput.setAttribute('webkitdirectory', '');
folderInput.setAttribute('directory', '');
folderInput.hidden = true;
folderButton.addEventListener('click', () => folderInput.click());
sidebar.append(folderButton, folderInput);

const modButton = element('button', 'button', 'Sideload a data mod ZIP');
const modInput = element('input');
modInput.type = 'file';
modInput.accept = '.zip,application/zip';
modInput.hidden = true;
modButton.addEventListener('click', () => modInput.click());
sidebar.append(modButton, modInput);

const output = element('div', 'output');
const log = element('div', 'log', 'Checking public/game and public/mods for local resources…');
const listing = element('div', 'listing');
output.append(log, listing);
sidebar.append(output);

function showStatus(message: string): void { log.textContent = message; }
function renderVfs(): void {
  const stats = vfs.stats();
  listing.replaceChildren();
  listing.append(element('p', 'small', `${stats.resolved} virtual files · ${stats.overridden} overridden paths · ${stats.sources} mounts`));
  const selected = [...vfs.list()].slice(0, 20);
  for (const [path, resolution] of selected) {
    const row = element('div', 'resource-row');
    row.append(element('span', 'resource-path', path), element('span', 'resource-source', resolution.winner.source));
    if (resolution.shadowed.length) row.append(element('span', 'resource-conflict', `overrides ${resolution.shadowed.length}`));
    listing.append(row);
  }
  if (stats.resolved > 20) listing.append(element('p', 'small', `…and ${stats.resolved - 20} more files`));
}

folderInput.addEventListener('change', async () => {
  if (!folderInput.files?.length) return;
  try {
    const imported = listUserSelectedGameDirectory(folderInput.files);
    vfs.mount('original-install', 0, imported.files);
    showStatus(`Indexed ${imported.files.size} files from “${imported.detectedFolderName}”; rejected ${imported.rejected}. These are NOT decoded into a playable game yet.`);
    renderVfs();
    const selectedProfile = gameId.value.trim();
    if (/^[a-z0-9][a-z0-9_-]{1,63}$/i.test(selectedProfile)) {
      try {
        const mods = await preloadModsForSelectedGame(vfs, selectedProfile);
        if (mods.loadedMods.length || mods.warnings.length) {
          showStatus(`Indexed ${imported.files.size} game files; loaded ${mods.loadedMods.length} compatible mod(s) from public/mods.${mods.warnings.length ? ` Warnings: ${mods.warnings.join('; ')}` : ''} Game formats still require a researched adapter.`);
          renderVfs();
        }
      } catch (error) { showStatus(`Game folder indexed, but automatic mods could not load: ${String(error)}`); }
    }
  } catch (e) { showStatus(`Import failed: ${String(e)}`); }
});
modInput.addEventListener('change', async () => {
  const file = modInput.files?.[0];
  if (!file) return;
  modButton.disabled = true;
  showStatus(`Validating ${file.name} locally…`);
  try {
    const expected = gameId.value.trim();
    if (!/^[a-z0-9][a-z0-9_-]{1,63}$/i.test(expected)) throw new Error('Select a valid game profile ID');
    const mod = await loadLocalModZip(file, expected);
    const mountId = `mod:${mod.manifest.id}`;
    vfs.mount(mountId, mod.manifest.priority, mod.entries);
    showStatus(`Loaded ${mod.manifest.name} (${mod.manifest.id}): ${mod.entries.size} data files; ${mod.rejected.length} entries skipped. This is a VFS preview, not an installed game-specific mod.`);
    renderVfs();
  } catch (e) { showStatus(`Mod rejected: ${String(e)}`); }
  finally { modButton.disabled = false; modInput.value = ''; }
});

void preloadLibrary(vfs).then(result => {
  if (result.game) {
    gameId.value = result.game.id;
    gameId.readOnly = true;
    folderButton.hidden = true;
    folderInput.hidden = true;
    const warning = result.warnings.length ? ` Warnings: ${result.warnings.join('; ')}` : '';
    showStatus(`Auto-detected “${result.game.name}” (${result.game.files.length} game files) in public/game. Loaded ${result.loadedMods.length} compatible mod(s) from public/mods. No game upload or folder selection required. Game formats still require a researched adapter.${warning}`);
  } else {
    showStatus(`No original game data found in public/game. Select your game folder manually to index it.${result.warnings.length ? ` Warnings: ${result.warnings.join('; ')}` : ''}`);
  }
  renderVfs();
}).catch(error => {
  showStatus(`Local library unavailable: ${String(error)}. You can still choose a local game folder manually.`);
  renderVfs();
});
const footer = element('footer', 'footer');
footer.append('To start a real port: open Claude Code in this directory and run ');
footer.append(element('code', '', '/port-game'));
footer.append('. Read ');
footer.append(element('code', '', 'README.md'));
footer.append(' before use.');
shell.append(footer);
