/** Parses project/PLAYTHROUGH_MAP.md: the boot-to-credits checklist that defines when a port is done. */
export const STATUSES = ['todo', 'researching', 'in-progress', 'implemented', 'verified', 'blocked', 'n/a'];
export const TERMINAL = new Set(['verified', 'blocked', 'n/a']);
/** Work order: finish what is started, then verify what is built, then start new nodes. */
const PRIORITY = ['in-progress', 'implemented', 'researching', 'todo'];
export const TEMPLATE_MARKER = '<!-- playthrough-map:template -->';

function splitRow(line) {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  const cells = [];
  let current = '';
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (ch === '\\' && trimmed[i + 1] === '|') { current += '|'; i++; }
    else if (ch === '|') { cells.push(current.trim()); current = ''; }
    else current += ch;
  }
  cells.push(current.trim());
  return cells;
}

/** Every markdown table whose header has `ID` and `Status` columns contributes rows. */
export function parsePlaythroughMap(markdown) {
  const lines = markdown.split(/\r?\n/);
  const nodes = [];
  const problems = [];
  let header = null;
  let section = '';
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    if (/^#{1,6}\s/.test(line)) { section = line.replace(/^#+\s*/, '').trim(); header = null; continue; }
    if (!line.trim().startsWith('|')) { header = null; continue; }
    const cells = splitRow(line);
    if (!header) {
      const lower = cells.map(c => c.toLowerCase());
      if (lower.includes('id') && lower.includes('status')) header = lower;
      continue;
    }
    if (cells.every(c => /^:?-{2,}:?$/.test(c))) continue;
    const row = Object.fromEntries(header.map((h, k) => [h, cells[k] ?? '']));
    const id = row.id?.replace(/`/g, '');
    if (!id || id === '—' || id === '-') continue;
    const status = (row.status ?? '').replace(/[`*]/g, '').trim().toLowerCase();
    if (!STATUSES.includes(status)) problems.push(`line ${i + 1}: ${id} has unknown status "${row.status}"`);
    nodes.push({ id, section, kind: row.kind ?? '', name: row.name ?? row.screen ?? '', status, depends: row['depends on'] ?? row.depends ?? '', line: i + 1, row });
  }
  const seen = new Set();
  for (const node of nodes) {
    if (seen.has(node.id)) problems.push(`duplicate id ${node.id}`);
    seen.add(node.id);
  }
  return { template: markdown.includes(TEMPLATE_MARKER), nodes, problems };
}

export function summarize(map) {
  const counts = Object.fromEntries(STATUSES.map(s => [s, 0]));
  for (const node of map.nodes) counts[node.status] = (counts[node.status] ?? 0) + 1;
  const remaining = map.nodes.filter(n => !TERMINAL.has(n.status));
  let next = null;
  for (const status of PRIORITY) {
    next = remaining.find(n => n.status === status) ?? null;
    if (next) break;
  }
  next ??= remaining[0] ?? null;
  const total = map.nodes.length;
  return {
    initialized: !map.template && total > 0,
    total,
    counts,
    remaining: remaining.length,
    verified: counts.verified ?? 0,
    blocked: counts.blocked ?? 0,
    complete: total > 0 && remaining.length === 0,
    next: next && { id: next.id, name: next.name, kind: next.kind, status: next.status, section: next.section, line: next.line },
    problems: map.problems,
    /** Changes whenever any node's status changes; the autopilot uses it to detect stalls. */
    signature: map.nodes.map(n => `${n.id}=${n.status}`).join(';'),
  };
}
