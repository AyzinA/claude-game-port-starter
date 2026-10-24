import { describe, expect, it } from 'vitest';
import { runAutoplay, type AutoplayScript } from '../src/engine/Automation';
import { FixedClock } from '../src/engine/FixedClock';
import { GameFlow, type GameState } from '../src/engine/GameFlow';
import { ActionInput } from '../src/engine/Input';
import { Rng } from '../src/engine/Rng';

describe('fixed clock', () => {
  it('emits whole steps and clamps long stalls', () => {
    const clock = new FixedClock(60, 5);
    expect(clock.advance(0)).toBe(0);
    expect(clock.advance(1000 / 60)).toBe(1);
    expect(clock.advance(1000 / 60 + 5)).toBe(0);
    expect(clock.advance(60_000)).toBe(5);
  });
});

describe('rng', () => {
  it('is deterministic per seed', () => {
    const a = new Rng(42);
    const b = new Rng(42);
    expect([a.next(), a.next(), a.int(1, 6)]).toEqual([b.next(), b.next(), b.int(1, 6)]);
  });
});

describe('action input', () => {
  const bindings = { keys: { Enter: ['confirm'], ArrowUp: ['menu_up', 'move_up'] }, gamepadButtons: { 0: ['confirm'] } };

  it('maps keys to actions with press/hold/release edges', () => {
    const input = new ActionInput(bindings);
    expect(input.keyDown('Enter')).toBe(true);
    expect(input.keyDown('KeyQ')).toBe(false);
    input.beginTick();
    expect(input.wasPressed('confirm')).toBe(true);
    expect(input.isHeld('confirm')).toBe(true);
    input.beginTick();
    expect(input.wasPressed('confirm')).toBe(false);
    input.keyUp('Enter');
    input.beginTick();
    expect(input.wasReleased('confirm')).toBe(true);
    expect(input.isHeld('confirm')).toBe(false);
  });

  it('fans one key out to several actions and handles injected taps', () => {
    const input = new ActionInput(bindings);
    input.keyDown('ArrowUp');
    input.inject('confirm', 'tap');
    input.beginTick();
    expect(input.wasPressed('menu_up') && input.wasPressed('move_up')).toBe(true);
    expect(input.wasPressed('confirm')).toBe(true);
    expect(input.isHeld('confirm')).toBe(false);
  });

  it('edge-detects gamepad buttons', () => {
    const input = new ActionInput(bindings);
    input.gamepadButton(0, true);
    input.gamepadButton(0, true);
    input.beginTick();
    expect(input.wasPressed('confirm')).toBe(true);
    input.beginTick();
    expect(input.wasPressed('confirm')).toBe(false);
  });
});

describe('game flow', () => {
  function setup() {
    let tick = 0;
    const log: string[] = [];
    const flow = new GameFlow<null>(null, () => tick);
    const state = (id: string, extra: Partial<GameState<null>> = {}): GameState<null> => ({
      id, kind: 'menu', enter: () => log.push(`enter:${id}`), exit: () => log.push(`exit:${id}`), update: () => log.push(`update:${id}`), ...extra,
    });
    flow.register(state('menu'));
    flow.register(state('game', { kind: 'gameplay' }));
    flow.register(state('pause', { kind: 'overlay', overlay: true }));
    flow.register(state('dialogue', { kind: 'dialogue', overlay: true, updatesBelow: true }));
    return { flow, log, advance: () => { tick++; } };
  }

  it('applies queued transitions at the next tick and records history', () => {
    const { flow, log } = setup();
    flow.start('menu');
    flow.replace('game');
    expect(flow.top?.id).toBe('menu');
    flow.update();
    expect(flow.top?.id).toBe('game');
    expect(log).toEqual(['enter:menu', 'exit:menu', 'enter:game', 'update:game']);
    expect(flow.history.map(h => `${h.op}:${h.to}`)).toEqual(['start:menu', 'replace:game']);
  });

  it('pauses the state below a modal overlay but renders both', () => {
    const { flow, log } = setup();
    flow.start('game');
    flow.push('pause');
    log.length = 0;
    flow.update();
    expect(log).toEqual(['enter:pause', 'update:pause']);
    expect(flow.visibleStates().map(s => s.id)).toEqual(['game', 'pause']);
    flow.pop();
    flow.update();
    expect(flow.top?.id).toBe('game');
  });

  it('keeps simulating below a non-pausing overlay', () => {
    const { flow, log } = setup();
    flow.start('game');
    flow.push('dialogue');
    flow.update();
    expect(log.slice(-2)).toEqual(['update:dialogue', 'update:game']);
  });

  it('reset clears the whole stack', () => {
    const { flow } = setup();
    flow.start('game');
    flow.push('pause');
    flow.update();
    flow.reset('menu');
    flow.update();
    expect(flow.stackIds).toEqual(['menu']);
  });
});

describe('autoplay runner', () => {
  it('reports the failing step instead of hanging', async () => {
    let tick = 0;
    const script: AutoplayScript = { id: 's', description: '', kind: 'segment', steps: [{ checkpoint: 'A' }, { expect: 'never', within: 10 }] };
    const report = await runAutoplay({ tick: () => tick, topState: () => 'menu', inject: () => {}, advance: n => { tick += n; } }, script);
    expect(report.ok).toBe(false);
    expect(report.stepsCompleted).toBe(1);
    expect(report.checkpoints.map(c => c.id)).toEqual(['A']);
    expect(report.error).toContain('never');
  });
});
