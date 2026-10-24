/** Fixed-step simulation clock with bounded catch-up. Rendering interpolates with `alpha`. */
export class FixedClock {
  readonly stepMs: number;
  private accumulator = 0;
  private last: number | null = null;

  constructor(readonly hz = 60, private readonly maxStepsPerFrame = 5) {
    if (!Number.isFinite(hz) || hz <= 0 || hz > 1000) throw new Error('Invalid tick rate');
    this.stepMs = 1000 / hz;
  }

  /** Returns how many simulation steps to run for a frame at `nowMs`. Long stalls (background tabs) are clamped. */
  advance(nowMs: number): number {
    if (this.last === null) { this.last = nowMs; return 0; }
    const elapsed = Math.max(0, nowMs - this.last);
    this.last = nowMs;
    this.accumulator = Math.min(this.accumulator + elapsed, this.stepMs * this.maxStepsPerFrame);
    let steps = 0;
    // Tolerance stops float drift (e.g. 1000/60 sums) from dropping a step.
    while (this.accumulator + 1e-6 >= this.stepMs && steps < this.maxStepsPerFrame) {
      this.accumulator = Math.max(0, this.accumulator - this.stepMs);
      steps++;
    }
    return steps;
  }

  get alpha(): number { return this.accumulator / this.stepMs; }

  reset(): void { this.accumulator = 0; this.last = null; }
}
