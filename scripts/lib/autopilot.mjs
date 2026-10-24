/** Decision logic for the autopilot Stop hook: keep the agent working until the boot-to-credits map is finished,
 * with hard limits so it can never loop forever or override a pause. Pure function; I/O lives in the hook. */
export const DEFAULTS = { enabled: false, maxContinuations: 40, maxStalls: 3 };

export function decide({ state, summary, paused }) {
  const s = { ...DEFAULTS, ...state };
  const allow = (why, next = s) => ({ block: false, why, state: next });
  if (!s.enabled) return allow('autopilot disabled');
  if (paused) return allow('paused by project/private/AUTOPILOT_PAUSE');
  if (!summary.initialized) return allow('playthrough map not initialized');
  if (summary.complete) {
    return allow(`all ${summary.total} playthrough nodes are terminal (${summary.verified} verified, ${summary.blocked} blocked)`,
      { ...s, enabled: false, finishedAt: new Date().toISOString() });
  }
  const continuations = s.continuations ?? 0;
  if (continuations >= s.maxContinuations) {
    return allow(`continuation budget of ${s.maxContinuations} used; run /port-autopilot to start a new budget`, { ...s, enabled: false });
  }
  const stalls = s.lastSignature === summary.signature ? (s.stalls ?? 0) + 1 : 0;
  if (stalls >= s.maxStalls) {
    return allow(`no playthrough node changed status in ${stalls} consecutive continuations; stopping to avoid a loop`, { ...s, enabled: false, stalls });
  }
  const next = summary.next;
  const reason = [
    `Autopilot is ON: the boot-to-credits map is not finished (${summary.verified}/${summary.total} verified, ${summary.blocked} blocked, ${summary.remaining} remaining).`,
    next ? `Continue the /port-autopilot loop with node ${next.id}${next.name ? ` "${next.name}"` : ''} (status: ${next.status}, project/PLAYTHROUGH_MAP.md line ${next.line}).` : 'Continue the /port-autopilot loop.',
    'Do not ask the user for confirmation between nodes. If the node needs something only the user can provide, mark it blocked with the exact need and move to an independent node.',
    stalls > 0 ? `Warning: no node changed status last time (${stalls}/${s.maxStalls} before the autopilot stops itself). Make measurable progress or mark the node blocked.` : '',
  ].filter(Boolean).join(' ');
  return { block: true, why: 'map incomplete', reason, state: { ...s, continuations: continuations + 1, lastSignature: summary.signature, stalls } };
}
