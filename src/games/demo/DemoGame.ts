/** Neutral, synthetic reference adapter. It demonstrates the boot-to-credits structure a real port must fill
 * with original screens, assets and logic. None of this content comes from, or imitates, a real game. */
import type { AutoplayScript } from '../../engine/Automation';
import type { GameState } from '../../engine/GameFlow';
import type { RuntimeContext } from '../../runtime/GameRuntime';
import { UiScreen, type UiNode } from '../../ui/UiScreen';
import type { GameAdapter } from '../GameAdapter';
import { DemoLevel, DemoLevelView } from './DemoLevel';

const W = 640;
const H = 360;
const UI = 'demo-ui';
const TITLE = 'demo-title';
const FG = '#ebf3fb';
const FOCUS = '#f0c97a';
const DIM = '#6f8597';

const CREDITS = [
  'GAME PORT LAB', '', 'Neutral demo adapter', '', 'Engine runtime', 'Fixed-tick flow · UI layer · autoplay',
  '', 'Original game content', 'None (synthetic)', '', 'Replace this adapter with', 'src/games/<game-id>/', '', 'Thank you for playing',
];

type MenuItem = { id: string; label: string; command: string; disabled?: boolean };

function menu(title: string, items: MenuItem[], backdrop?: string): UiScreen {
  const children: UiNode[] = [
    { type: 'text', id: 'title', rect: { x: 0, y: 60, w: W, h: 40 }, text: title, font: TITLE, color: FG, align: 'center' },
    ...items.map((item, i): UiNode => ({
      type: 'button', id: item.id, command: item.command, disabled: item.disabled,
      rect: { x: W / 2 - 120, y: 140 + i * 32, w: 240, h: 28 },
      label: { text: item.label, font: UI, color: FG, focusColor: FOCUS, disabledColor: DIM, align: 'center', valign: 'middle' },
    })),
  ];
  return new UiScreen({ type: 'panel', id: 'root', rect: { x: 0, y: 0, w: W, h: H }, fill: backdrop, children });
}

function caption(id: string, y: number, text: string, font = UI, color = FG): UiNode {
  return { type: 'text', id, rect: { x: 0, y, w: W, h: 40 }, text, font, color, align: 'center' };
}

function createStates(): GameState<RuntimeContext>[] {
  const settings = { difficulty: 'Normal' };
  let level = new DemoLevel();
  let view: DemoLevelView | null = null;
  let timer = 0;
  let creditsY = H;

  return [
    {
      id: 'boot', kind: 'boot',
      // A real port mounts archives, detects the edition and reads startup config here.
      update: ctx => ctx.flow.replace('splash'),
    },
    {
      id: 'splash', kind: 'splash',
      enter: ctx => {
        timer = 0;
        ctx.screens.set('splash', new UiScreen({ type: 'panel', id: 'root', rect: { x: 0, y: 0, w: W, h: H }, fill: '#000', children: [
          caption('logo', 140, 'GAME PORT LAB', TITLE), caption('note', 190, 'neutral demo · not a port', UI, DIM),
        ] }));
      },
      update: ctx => {
        if (++timer >= 150 || ctx.input.wasPressed('confirm')) ctx.flow.replace('title');
      },
    },
    {
      id: 'title', kind: 'title',
      enter: ctx => {
        timer = 0;
        ctx.screens.set('title', new UiScreen({ type: 'panel', id: 'root', rect: { x: 0, y: 0, w: W, h: H }, fill: '#0a111b', children: [
          caption('name', 110, 'DEMO QUEST', TITLE), caption('prompt', 230, 'Press Enter'),
        ] }));
      },
      update: ctx => {
        ctx.screens.get('title')?.setVisible('prompt', Math.floor(++timer / 30) % 2 === 0);
        if (ctx.input.wasPressed('confirm')) ctx.flow.replace('main-menu');
      },
    },
    {
      id: 'main-menu', kind: 'menu',
      enter: ctx => ctx.screens.set('main-menu', menu('MAIN MENU', [
        { id: 'new', label: 'New Game', command: 'new' },
        { id: 'options', label: 'Options', command: 'options' },
        { id: 'credits', label: 'Credits', command: 'credits' },
        { id: 'quit', label: 'Quit', command: 'quit', disabled: true },
      ], '#0a111b')),
      update: ctx => {
        const command = ctx.screens.get('main-menu')?.navigate(ctx.input, ctx.nav);
        if (command === 'new') ctx.flow.replace('gameplay');
        else if (command === 'options') ctx.flow.push('options');
        else if (command === 'credits') ctx.flow.replace('credits');
      },
    },
    {
      id: 'options', kind: 'menu', overlay: true,
      enter: ctx => ctx.screens.set('options', menu('OPTIONS', [
        { id: 'difficulty', label: `Difficulty: ${settings.difficulty}`, command: 'difficulty' },
        { id: 'back', label: 'Back', command: 'back' },
      ], 'rgba(0,0,0,0.85)')),
      update: ctx => {
        const screen = ctx.screens.get('options');
        const command = screen?.navigate(ctx.input, ctx.nav);
        if (command === 'difficulty') {
          settings.difficulty = settings.difficulty === 'Normal' ? 'Hard' : 'Normal';
          screen?.setText('difficulty', `Difficulty: ${settings.difficulty}`);
        } else if (command === 'back' || ctx.input.wasPressed(ctx.nav.back)) ctx.flow.pop();
      },
    },
    {
      id: 'gameplay', kind: 'gameplay',
      enter: ctx => {
        level = new DemoLevel();
        ctx.screens.set('gameplay', new UiScreen({ type: 'panel', id: 'hud', rect: { x: 0, y: 0, w: W, h: H }, children: [
          { type: 'text', id: 'steps', rect: { x: 12, y: 10, w: 200, h: 20 }, text: 'Steps: 0', font: UI, color: FG },
          { type: 'text', id: 'hint', rect: { x: 0, y: H - 30, w: W, h: 20 }, text: 'Reach the ring · Esc pauses', font: UI, color: DIM, align: 'center' },
        ] }));
        if (ctx.stage) {
          view = new DemoLevelView(level);
          ctx.stage.show(view.scene, view.camera);
        }
      },
      update: ctx => {
        const { input } = ctx;
        if (input.wasPressed('pause')) { ctx.flow.push('pause'); return; }
        if (input.wasPressed('move_up')) level.move(0, -1);
        if (input.wasPressed('move_down')) level.move(0, 1);
        if (input.wasPressed('move_left')) level.move(-1, 0);
        if (input.wasPressed('move_right')) level.move(1, 0);
        ctx.screens.get('gameplay')?.setText('steps', `Steps: ${level.steps}`);
        if (level.complete) ctx.flow.replace('ending');
      },
      render: ctx => view?.sync(level, ctx.tick),
      exit: ctx => {
        view?.dispose();
        view = null;
        ctx.stage?.clear();
      },
    },
    {
      id: 'pause', kind: 'overlay', overlay: true,
      enter: ctx => ctx.screens.set('pause', menu('PAUSED', [
        { id: 'resume', label: 'Resume', command: 'resume' },
        { id: 'quit', label: 'Quit to Main Menu', command: 'quit' },
      ], 'rgba(0,0,0,0.6)')),
      update: ctx => {
        const command = ctx.screens.get('pause')?.navigate(ctx.input, ctx.nav);
        if (command === 'resume' || ctx.input.wasPressed('back')) ctx.flow.pop();
        else if (command === 'quit') ctx.flow.reset('main-menu');
      },
    },
    {
      id: 'ending', kind: 'cutscene',
      enter: ctx => {
        timer = 0;
        ctx.screens.set('ending', new UiScreen({ type: 'panel', id: 'root', rect: { x: 0, y: 0, w: W, h: H }, fill: '#000', children: [
          caption('line1', 140, `Goal reached in ${level.steps} steps.`), caption('line2', 175, 'The demo is complete.', UI, DIM),
        ] }));
      },
      update: ctx => {
        if (++timer >= 240 || ctx.input.wasPressed('confirm')) ctx.flow.replace('credits');
      },
    },
    {
      id: 'credits', kind: 'credits',
      enter: ctx => {
        creditsY = H;
        ctx.screens.set('credits', new UiScreen({ type: 'panel', id: 'root', rect: { x: 0, y: 0, w: W, h: H }, fill: '#000', children: [
          { type: 'panel', id: 'roll', rect: { x: 0, y: creditsY, w: W, h: CREDITS.length * 24 },
            children: CREDITS.map((line, i) => caption(`c${i}`, i * 24, line, i === 0 ? TITLE : UI)) },
        ] }));
      },
      update: ctx => {
        if (ctx.input.wasPressed('back')) { ctx.flow.replace('main-menu'); return; }
        creditsY -= ctx.input.isHeld('confirm') ? 3 : 0.75;
        const roll = ctx.screens.get('credits')?.find('roll');
        if (roll) roll.rect.y = creditsY;
        if (creditsY < -CREDITS.length * 24) ctx.flow.replace('main-menu');
      },
    },
  ];
}

const bootToCredits: AutoplayScript = {
  id: 'boot-to-credits',
  description: 'Boot, logos, title, every main-menu branch, the level, pause, ending, end credits, back to the menu.',
  kind: 'full',
  steps: [
    { checkpoint: 'FE-BOOT' },
    { expect: 'splash' }, { checkpoint: 'FE-SPLASH' },
    { expect: 'title', within: 300 }, { checkpoint: 'FE-TITLE' },
    { press: 'confirm' }, { expect: 'main-menu' }, { checkpoint: 'FE-MAIN-MENU' },
    { press: 'menu_down' }, { press: 'confirm' }, { expect: 'options' }, { checkpoint: 'FE-OPTIONS' },
    { press: 'confirm' }, { press: 'menu_down' }, { press: 'confirm' }, { expect: 'main-menu' },
    { press: 'menu_up' }, { press: 'confirm' }, { expect: 'gameplay' }, { checkpoint: 'GP-LEVEL-1' },
    { press: 'pause' }, { expect: 'pause' }, { checkpoint: 'GP-PAUSE' }, { press: 'confirm' }, { expect: 'gameplay' },
    { press: 'move_up' }, { press: 'move_up' }, { press: 'move_up' }, { press: 'move_up' },
    { press: 'move_right' }, { press: 'move_right' }, { press: 'move_right' }, { press: 'move_right' },
    { expect: 'ending' }, { checkpoint: 'END-CUTSCENE' },
    { expect: 'credits', within: 400 }, { wait: 300 }, { checkpoint: 'END-CREDITS' },
    { expect: 'main-menu', within: 2000 }, { checkpoint: 'END-RETURN-TO-MENU' },
  ],
};

export const demoAdapter: GameAdapter = {
  id: 'demo',
  name: 'Neutral demo',
  synthetic: true,
  virtualResolution: { width: W, height: H },
  fit: 'letterbox',
  tickHz: 60,
  bindings: {
    keys: {
      ArrowUp: ['menu_up', 'move_up'], KeyW: ['menu_up', 'move_up'],
      ArrowDown: ['menu_down', 'move_down'], KeyS: ['menu_down', 'move_down'],
      ArrowLeft: ['menu_left', 'move_left'], KeyA: ['menu_left', 'move_left'],
      ArrowRight: ['menu_right', 'move_right'], KeyD: ['menu_right', 'move_right'],
      Enter: ['confirm'], Space: ['confirm'], Escape: ['back', 'pause'], Backspace: ['back'],
    },
    gamepadButtons: {
      12: ['menu_up', 'move_up'], 13: ['menu_down', 'move_down'], 14: ['menu_left', 'move_left'], 15: ['menu_right', 'move_right'],
      0: ['confirm'], 1: ['back'], 9: ['pause'],
    },
  },
  uiNav: { up: 'menu_up', down: 'menu_down', left: 'menu_left', right: 'menu_right', confirm: 'confirm', back: 'back' },
  initialState: 'boot',
  detect: () => 0,
  loadUiAssets: async () => ({
    images: new Map(),
    fonts: new Map([
      [UI, { kind: 'css', css: '16px ui-monospace, Consolas, monospace', lineHeight: 20, approxAdvance: 9.6 }],
      [TITLE, { kind: 'css', css: 'bold 30px ui-monospace, Consolas, monospace', lineHeight: 36, approxAdvance: 18 }],
    ]),
  }),
  createStates,
  autoplay: [bootToCredits],
};
