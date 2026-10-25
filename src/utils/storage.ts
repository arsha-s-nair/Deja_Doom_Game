import { EndingType, GameSettings, PlayerTelemetry, SavedProgress } from '../types/game';

const SAVE_KEY = 'deja_doom_last_life_save_v3';
const SETTINGS_KEY = 'deja_doom_last_life_settings_v3';
const META_KEY = 'deja_doom_last_life_meta_v3';
const CONSENT_KEY = 'deja_doom_last_life_consent_v3';

export function loadSignedConsent(): string | null {
  try {
    return localStorage.getItem(CONSENT_KEY);
  } catch {
    return null;
  }
}

export function saveSignedConsent(timestampStr: string): void {
  try {
    localStorage.setItem(CONSENT_KEY, timestampStr);
  } catch {
    // Ignore storage quota errors
  }
}

export function createInitialTelemetry(consentTimeIso?: string): PlayerTelemetry {
  const existingConsent = loadSignedConsent();
  return {
    consentTimestamp:
      consentTimeIso ||
      existingConsent ||
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    deaths: 0,
    deathsPerChamber: [0, 0, 0, 0, 0, 0, 0, 0],
    deathCauses: {},
    husksCreated: 0,
    husksSteppedOn: 0,
    husksDecayed: 0,
    husksCollapsedUnderfoot: 0,
    jumpsTotal: 0,
    rapidJumpBursts: 0,
    franticKeyBursts: 0,
    avgKeyIntervalMs: 380,
    fastestRetryMs: null,
    leftRouteChoices: 0,
    rightRouteChoices: 0,
    hesitationCount: 0,
    directionFlipsNearHazard: 0,
    predictedMovesPunished: 0,
    trapsBaitedSuccessfully: 0,
    smallWinsClaimed: 0,
    rageTrapsSpawned: 0,
    habitSnaresGrown: 0,
    bluffsAttempted: 0,
    bluffsSucceeded: 0,
    bluffsCaught: 0,
    ghostEncounters: 0,
    ghostFollowed: 0,
    ghostDefied: 0,
    trapsTriggered: [],
    memoriesCollected: [],
    strategyShifts: 0,
    peakRageIndex: 10,
    pokerFaceActivations: 0,
    predictionsDodged: 0,
    uiManipulationsClicked: 0,
    fakeProgressRegressions: 0,
    chamberNumberMutations: 0,
    pityPathsTaken: 0,
    mostCommonPreDeathAction: 'JUMPING',
    timeline: [{ timeSec: 0, rage: 10, chamberIndex: 0, event: 'Reborn in Level 1' }],
  };
}

export const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 0.55,
  musicVolume: 0.45,
  muted: false,
  cameraParallax: true,
  reducedMotion: false,
};

export interface MetaMemory {
  hasResetHouseBefore: boolean;
  completedEndings: EndingType[];
  totalLoops: number;
}

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      masterVolume:
        typeof parsed.masterVolume === 'number'
          ? Math.max(0, Math.min(1, parsed.masterVolume))
          : DEFAULT_SETTINGS.masterVolume,
      musicVolume:
        typeof parsed.musicVolume === 'number'
          ? Math.max(0, Math.min(1, parsed.musicVolume))
          : DEFAULT_SETTINGS.musicVolume,
      muted: Boolean(parsed.muted),
      cameraParallax: parsed.cameraParallax !== false,
      reducedMotion: Boolean(parsed.reducedMotion),
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore
  }
}

export function loadSavedProgress(): SavedProgress | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedProgress;
    if (
      typeof parsed.currentChamber !== 'number' ||
      !Array.isArray(parsed.memoriesCollected) ||
      !parsed.telemetry
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveProgress(progress: SavedProgress): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore
  }
}

export function clearSavedProgress(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Ignore
  }
}

export function loadMetaMemory(): MetaMemory {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) {
      return { hasResetHouseBefore: false, completedEndings: [], totalLoops: 0 };
    }
    const parsed = JSON.parse(raw);
    return {
      hasResetHouseBefore: Boolean(parsed.hasResetHouseBefore),
      completedEndings: Array.isArray(parsed.completedEndings) ? parsed.completedEndings : [],
      totalLoops: typeof parsed.totalLoops === 'number' ? parsed.totalLoops : 0,
    };
  } catch {
    return { hasResetHouseBefore: false, completedEndings: [], totalLoops: 0 };
  }
}

export function saveMetaMemory(meta: MetaMemory): void {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    // Ignore
  }
}

/**
 * Resets run & loop memory while preserving signed surveillance consent
 * so the player NEVER has to re-sign the consent screen again.
 */
export function wipeAllHouseMemory(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(META_KEY);
  } catch {
    // Ignore
  }
}
