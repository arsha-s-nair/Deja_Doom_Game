export enum GameScreen {
  CONSENT_GATE = 'CONSENT_GATE',
  TITLE = 'TITLE',
  INTRO = 'INTRO',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  CHAMBER_CLEARED_MEMORY = 'CHAMBER_CLEARED_MEMORY',
  FAKE_WIN = 'FAKE_WIN',
  ENDING_CHOICE = 'ENDING_CHOICE',
  ENDING_SCENE = 'ENDING_SCENE',
  DEBRIEF = 'DEBRIEF',
}

export enum RageState {
  AMUSED = 'AMUSED',
  ANNOYED = 'ANNOYED',
  FURIOUS = 'FURIOUS',
  LOSING_IT = 'LOSING_IT',
  ENTERTAINED = 'ENTERTAINED',
}

export enum HuskType {
  BODY = 'BODY',
  ECHO = 'ECHO',
  SABOTEUR = 'SABOTEUR',
  RIVAL = 'RIVAL',
  ORIGINAL = 'ORIGINAL',
}

export enum PastLifeRole {
  CREATOR = 'THE ARCHITECT OF REBIRTH',
  ESCAPE_ARTIST = 'THE DECEIVER OF HELL',
  KEEPER = 'THE SHEPHERD OF HUSKS',
  BETRAYER = 'THE UNREPENTANT',
  WITNESS = 'THE AWAKENED SOUL',
}

export enum EndingType {
  RESET = 'RESET',
  ESCAPE = 'ESCAPE',
  KEEPER = 'KEEPER',
}

export type SpeakerType = 'DEVIL' | 'GHOST' | 'HOUSE' | 'PLAYER';

export type DevilBluffIntent = 'CALM' | 'AFRAID' | 'FURIOUS' | 'TAUNT';

export type DevilBluffEffect =
  | 'RETRACT_RAGE_TRAPS'
  | 'SLOW_TRAPS'
  | 'PREFIRE_TRAPS'
  | 'SPAWN_PUNISH_TRAP'
  | 'HINT_NEXT';

export interface DialogueLine {
  id: string;
  speaker: SpeakerType;
  text: string;
  durationMs?: number;
}

export interface RecordedFrame {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
}

export interface HuskEntity {
  id: string;
  chamberIndex: number;
  type: HuskType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  facing: 1 | -1;
  causeOfDeath: string;
  frames: RecordedFrame[];
  frameCursor: number;
  stability: number; // 1.0 -> 0.0: weakens passively & crumbles under weight
  maxLifetimeSec: number;
  isSynthetic?: boolean;
  label?: string;
}

export type PlatformKind =
  | 'SOLID'
  | 'COLLAPSING'
  | 'TRAPDOOR'
  | 'CADENCE_RECOIL'
  | 'PARANOIA_SAFE'
  | 'PATIENT_OAK'
  | 'SAFE_SMOKING'
  | 'DISAPPEARING'
  | 'GATE'
  | 'BRIDGE'
  | 'PITY_BRIDGE';

export interface PlatformDef {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  kind: PlatformKind;
  linkedSwitchId?: string;
  recoilDir?: 1 | -1;
  label?: string;
}

export type HazardKind =
  | 'SPIKES'
  | 'HABIT_CRUSHER'
  | 'BAIT_PENDULUM';

export interface HazardDef {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  kind: HazardKind;
  triggerHeight?: number;
  /**
   * Optional frustration threshold (gradually lowers across later levels).
   * When > 0, this trap stays hidden until the player's frustration reaches this level.
   */
  minRageToActivate?: number;
}

export interface SwitchDef {
  id: string;
  x: number;
  y: number;
  width: number;
  requiresWeight: boolean;
  isHiddenCheckpointFuse?: boolean;
  disarmsHazardId?: string;
  wireTo?: { x: number; y: number };
  winMessage?: string;
  label?: string;
}

export interface GhostNodeDef {
  id: string;
  x: number;
  y: number;
  isTruth: boolean;
  hintText: string;
  recommendedAction: 'RUSH' | 'WAIT' | 'DROP' | 'CLIMB';
}

export interface SignDef {
  id: string;
  x: number;
  y: number;
  initialText: string;
  afterDeathText?: string;
  isHabitWall?: boolean;
}

export interface WatchingEyeDef {
  x: number;
  y: number;
  scale?: number;
}

export interface MemoryFragmentDef {
  id: string;
  index: number;
  chamberIndex: number;
  eraLabel: string;
  fragmentSummary: string;
  loreBody: string;
  lingeringEcho: string;
}

export interface ChamberDef {
  index: number; // 0..7
  levelNumber: number; // 1..8 (Displayed ONLY as a number—never a spoiler title!)
  objectiveHint: string;
  spawnX: number;
  spawnY: number;
  boundsMinX: number;
  boundsMaxX: number;
  exitX: number;
  exitY: number;
  exitMovesOnApproach?: boolean | number;
  falseSunriseShutter?: boolean;
  safeCheckpoint?: { x: number; y: number };
  hasFakeCheckpoint?: {
    x: number;
    y: number;
    realSwitchId: string;
    fuseX?: number;
    fuseY?: number;
  };
  reverseZone?: { minX: number; maxX: number };
  triggersFakeWin?: boolean;
  isFinalCore?: boolean;
  ambientTint: number;
  accentColor: number;
  eyes: WatchingEyeDef[];
  platforms: PlatformDef[];
  hazards: HazardDef[];
  switches: SwitchDef[];
  ghost?: GhostNodeDef;
  signs: SignDef[];
  clearedMemory: MemoryFragmentDef;
  presetHusks?: Omit<
    HuskEntity,
    'id' | 'chamberIndex' | 'vx' | 'vy' | 'frameCursor' | 'stability'
  >[];
}

export interface RageTimelinePoint {
  timeSec: number;
  rage: number;
  chamberIndex: number;
  event?: string;
}

export interface PlayerTelemetry {
  consentTimestamp: string;
  deaths: number;
  deathsPerChamber: number[];
  deathCauses: Record<string, number>;
  husksCreated: number;
  husksSteppedOn: number;
  husksDecayed: number;
  husksCollapsedUnderfoot: number;
  jumpsTotal: number;
  rapidJumpBursts: number;
  franticKeyBursts: number;
  avgKeyIntervalMs: number;
  fastestRetryMs: number | null;
  leftRouteChoices: number;
  rightRouteChoices: number;
  hesitationCount: number;
  directionFlipsNearHazard: number;
  predictedMovesPunished: number;
  trapsBaitedSuccessfully: number;
  smallWinsClaimed: number;
  rageTrapsSpawned: number;
  habitSnaresGrown: number;
  bluffsAttempted: number;
  bluffsSucceeded: number;
  bluffsCaught: number;
  ghostEncounters: number;
  ghostFollowed: number;
  ghostDefied: number;
  trapsTriggered: string[];
  memoriesCollected: string[];
  strategyShifts: number;
  peakRageIndex: number;
  pokerFaceActivations: number;
  predictionsDodged: number;
  uiManipulationsClicked: number;
  fakeProgressRegressions: number;
  chamberNumberMutations: number;
  pityPathsTaken: number;
  mostCommonPreDeathAction: 'JUMPING' | 'RUSHING' | 'HESITATING' | 'REVERSING';
  timeline: RageTimelinePoint[];
}

export interface UIMutationState {
  displayedProgress: number;
  progressInverted: boolean;
  displayedLevelNumber: string; // ONLY level number (e.g., "Level 1", "Level 3", etc.)
  hudSwappedCorners: boolean;
  deathsLabel: string;
  pokerLabel: string;
  liveObservation: string;
  bluffCooldownSec: number;
  buttonOrderSeed: number;
  temptationToastVisible: boolean;
  temptationDodgedOnce: boolean;
}

export interface GameSettings {
  masterVolume: number;
  musicVolume: number;
  muted: boolean;
  cameraParallax: boolean;
  reducedMotion: boolean;
}

export interface SavedProgress {
  currentChamber: number;
  memoriesCollected: string[];
  telemetry: PlayerTelemetry;
  husks: HuskEntity[];
  completedEndings: EndingType[];
  loopCount: number;
  timestamp: number;
}
