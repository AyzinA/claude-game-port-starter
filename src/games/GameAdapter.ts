/** Contract every game module in src/games/<game-id>/ implements. The generic engine, UI and host never import
 * a specific game; they only talk to this interface. */
import type { AutoplayScript } from '../engine/Automation';
import type { GameState } from '../engine/GameFlow';
import type { InputBindings } from '../engine/Input';
import type { UiAssets } from '../render/CanvasUiRenderer';
import type { RuntimeContext } from '../runtime/GameRuntime';
import type { UiNavBindings } from '../ui/UiScreen';
import type { FitMode, Size } from '../ui/Viewport';
import type { OverlayVfs } from '../vfs/OverlayVfs';

export interface GameAdapter {
  readonly id: string;
  readonly name: string;
  /** True for neutral/synthetic content that must never be presented as a port. */
  readonly synthetic?: boolean;
  /** Original UI resolution and how the original scaled it. */
  readonly virtualResolution: Size;
  readonly fit: FitMode;
  /** Original simulation rate when known; document the evidence in project/DECISIONS.md. */
  readonly tickHz: number;
  /** Default bindings taken from the original game's config/control defaults. */
  readonly bindings: InputBindings;
  readonly uiNav: UiNavBindings;
  /** Boot state id: the first thing the original executable shows. */
  readonly initialState: string;
  /** 0 = not this game. Higher = stronger evidence (file signatures, version files) in the mounted VFS. */
  detect(vfs: OverlayVfs, gameId: string): number;
  /** Decode original fonts/textures needed by UI trees. Called once in the browser before boot. */
  loadUiAssets(vfs: OverlayVfs): Promise<UiAssets>;
  /** Every screen from boot to end credits, registered with the flow. */
  createStates(): GameState<RuntimeContext>[];
  /** Autoplay scripts; at least one `full` boot-to-credits script is the definition of done. */
  readonly autoplay: AutoplayScript[];
}
