import {
  DevilBluffEffect,
  DevilBluffIntent,
  PlayerTelemetry,
  RageState,
  UIMutationState,
} from '../types/game';
import { evaluateDevilCommunication } from './storyData';

const DEATH_EUPHEMISMS = [
  'Deaths',
  'Past Lives',
  'Failed Vessels',
  'Discarded Husks',
  'Attempts',
];

const POKER_EUPHEMISMS = [
  'Poker Face',
  'Steady Pulse',
  'Deadpan',
  'Mask Nerve',
  'Composure',
];

export class RageAndAdaptationEngine {
  private rageScore = 10; // Starts low and builds up with impatience & deaths!
  private pokerFaceActive = false;
  private pokerMeter = 100; // 0..100
  private pokerCooldown = 0;

  // Devil Communication State (Effects occur physically in the room without HUD spoilers!)
  private bluffCooldown = 0;
  private lastBluffIntent: DevilBluffIntent | null = null;
  private retractRageTrapsTimer = 0;
  private slowTrapsTimer = 0;
  private prefireTrapsTimer = 0;
  private punishTrapsTimer = 0;

  private lastDeathTimestamp = 0;
  private recentJumpTimestamps: number[] = [];
  private recentKeyTimestamps: number[] = [];
  private keyIntervalsMs: number[] = [380, 360, 390];
  private recentFlipTimestamps: number[] = [];
  private sessionStartMs = performance.now();
  private lastTimelineSampleSec = 0;

  private actionCounts = {
    JUMPING: 1,
    RUSHING: 1,
    HESITATING: 0,
    REVERSING: 0,
  };

  private uiState: UIMutationState = {
    displayedProgress: 6,
    progressInverted: false,
    displayedLevelNumber: 'Level 1',
    hudSwappedCorners: false,
    deathsLabel: 'Deaths',
    pokerLabel: 'Poker Face',
    liveObservation: 'Key cadence: 380ms · Observing stride',
    bluffCooldownSec: 0,
    buttonOrderSeed: 0,
    temptationToastVisible: false,
    temptationDodgedOnce: false,
  };

  public resetSession(): void {
    this.rageScore = 10;
    this.pokerFaceActive = false;
    this.pokerMeter = 100;
    this.pokerCooldown = 0;
    this.bluffCooldown = 0;
    this.lastBluffIntent = null;
    this.retractRageTrapsTimer = 0;
    this.slowTrapsTimer = 0;
    this.prefireTrapsTimer = 0;
    this.punishTrapsTimer = 0;
    this.lastDeathTimestamp = 0;
    this.recentJumpTimestamps = [];
    this.recentKeyTimestamps = [];
    this.keyIntervalsMs = [380, 360, 390];
    this.recentFlipTimestamps = [];
    this.sessionStartMs = performance.now();
    this.lastTimelineSampleSec = 0;
    this.actionCounts = { JUMPING: 1, RUSHING: 1, HESITATING: 0, REVERSING: 0 };
  }

  public onEnterNewLevel(): void {
    this.lastBluffIntent = null;
    this.uiState.temptationToastVisible = false;
    this.uiState.temptationDodgedOnce = false;
  }

  public getRealRage(): number {
    return this.rageScore;
  }

  public getPerceivedRage(): number {
    if (this.pokerFaceActive && this.pokerMeter > 2) {
      return Math.min(16, this.rageScore * 0.22);
    }
    if (this.retractRageTrapsTimer > 0) {
      return Math.min(20, this.rageScore * 0.35);
    }
    return this.rageScore;
  }

  public getTrapFrustrationLevel(): number {
    if (this.retractRageTrapsTimer > 0) return 0;
    if (this.punishTrapsTimer > 0) return Math.max(66, this.rageScore);
    return this.getPerceivedRage();
  }

  public areTrapsSlowedByBluff(): boolean {
    return this.slowTrapsTimer > 0;
  }

  public areTrapsPrefiredByBluff(): boolean {
    return this.prefireTrapsTimer > 0;
  }

  public getBluffCooldownSec(): number {
    return Math.ceil(this.bluffCooldown);
  }

  public sendBluffToDevil(
    intent: DevilBluffIntent,
    chamberObjectiveHint: string,
    telemetry: PlayerTelemetry,
    chamberIndex: number
  ): {
    fooled: boolean;
    playerLine: string;
    devilReply: string;
    effect: DevilBluffEffect;
  } | null {
    if (this.bluffCooldown > 0) return null;

    const cadence = this.getRecentKeyCadenceMs();
    const res = evaluateDevilCommunication(
      intent,
      this.rageScore,
      cadence,
      this.isPokerActive(),
      this.lastBluffIntent,
      chamberObjectiveHint
    );

    this.lastBluffIntent = intent;
    this.bluffCooldown = 7.5;
    telemetry.bluffsAttempted += 1;

    if (res.fooled) {
      telemetry.bluffsSucceeded += 1;
      if (res.effect === 'RETRACT_RAGE_TRAPS') {
        this.retractRageTrapsTimer = 16.0;
        this.punishTrapsTimer = 0;
      } else if (res.effect === 'SLOW_TRAPS') {
        this.slowTrapsTimer = 13.0;
      } else if (res.effect === 'PREFIRE_TRAPS') {
        this.prefireTrapsTimer = 13.0;
      }
      this.addRage(res.rageDelta, telemetry, chamberIndex, `Fooled Devil (${intent})`);
    } else {
      telemetry.bluffsCaught += 1;
      this.retractRageTrapsTimer = 0;
      this.punishTrapsTimer = 12.0;
      this.addRage(res.rageDelta, telemetry, chamberIndex, `Lie Caught (${intent})`);
    }

    return res;
  }

  public getPerceivedState(): RageState {
    const r = this.getPerceivedRage();
    if (r >= 80) return RageState.ENTERTAINED;
    if (r >= 60) return RageState.LOSING_IT;
    if (r >= 40) return RageState.FURIOUS;
    if (r >= 22) return RageState.ANNOYED;
    return RageState.AMUSED;
  }

  public getPokerMeter(): number {
    return this.pokerMeter;
  }

  public isPokerActive(): boolean {
    return this.pokerFaceActive && this.pokerMeter > 2 && this.pokerCooldown <= 0;
  }

  public getRecentKeyCadenceMs(): number {
    if (this.keyIntervalsMs.length === 0) return 380;
    const sum = this.keyIntervalsMs.reduce((acc, v) => acc + v, 0);
    return Math.round(sum / this.keyIntervalsMs.length);
  }

  public isFranticCadence(): boolean {
    if (this.isPokerActive() || this.prefireTrapsTimer > 0) return false;
    return this.getRecentKeyCadenceMs() < 235;
  }

  public recordKeyPress(telemetry: PlayerTelemetry): void {
    const now = performance.now();
    const prev = this.recentKeyTimestamps[this.recentKeyTimestamps.length - 1];
    if (prev !== undefined) {
      const interval = Math.max(45, Math.min(950, now - prev));
      this.keyIntervalsMs.push(interval);
      if (this.keyIntervalsMs.length > 9) {
        this.keyIntervalsMs.shift();
      }
      telemetry.avgKeyIntervalMs = this.getRecentKeyCadenceMs();
    }

    this.recentKeyTimestamps.push(now);
    this.recentKeyTimestamps = this.recentKeyTimestamps.filter((t) => now - t < 750);

    if (this.recentKeyTimestamps.length >= 5) {
      telemetry.franticKeyBursts += 1;
      this.addRage(6.0, telemetry, undefined, 'Frantic Key Cadence');
      this.recentKeyTimestamps = [now];
    }
  }

  public updateFrame(
    dt: number,
    wantsPoker: boolean,
    chamberIndex: number,
    playerNormX: number,
    deathsInChamber: number,
    telemetry: PlayerTelemetry
  ): UIMutationState {
    if (this.pokerCooldown > 0) this.pokerCooldown = Math.max(0, this.pokerCooldown - dt);
    if (this.bluffCooldown > 0) this.bluffCooldown = Math.max(0, this.bluffCooldown - dt);
    if (this.retractRageTrapsTimer > 0) {
      this.retractRageTrapsTimer = Math.max(0, this.retractRageTrapsTimer - dt);
    }
    if (this.slowTrapsTimer > 0) {
      this.slowTrapsTimer = Math.max(0, this.slowTrapsTimer - dt);
    }
    if (this.prefireTrapsTimer > 0) {
      this.prefireTrapsTimer = Math.max(0, this.prefireTrapsTimer - dt);
    }
    if (this.punishTrapsTimer > 0) {
      this.punishTrapsTimer = Math.max(0, this.punishTrapsTimer - dt);
    }

    if (wantsPoker && this.pokerCooldown <= 0 && this.pokerMeter > 2) {
      if (!this.pokerFaceActive) {
        telemetry.pokerFaceActivations += 1;
      }
      this.pokerFaceActive = true;
      this.pokerMeter = Math.max(0, this.pokerMeter - dt * 50);
      if (this.pokerMeter <= 0.5) {
        this.pokerFaceActive = false;
        this.pokerCooldown = 2.2;
      }
    } else {
      this.pokerFaceActive = false;
      const cadenceFactor = this.getRecentKeyCadenceMs() < 240 ? 9.5 : 17.5;
      this.pokerMeter = Math.min(100, this.pokerMeter + dt * cadenceFactor);
    }

    const calmBonus = this.getRecentKeyCadenceMs() > 300 ? 1.6 : 0.4;
    this.rageScore = Math.max(8, this.rageScore - dt * calmBonus);

    const elapsedSec = Math.floor((performance.now() - this.sessionStartMs) / 1000);
    if (elapsedSec - this.lastTimelineSampleSec >= 4) {
      this.lastTimelineSampleSec = elapsedSec;
      telemetry.timeline.push({
        timeSec: elapsedSec,
        rage: Math.round(this.rageScore),
        chamberIndex,
      });
      if (telemetry.timeline.length > 160) {
        telemetry.timeline.splice(1, 1);
      }
    }

    this.computeUIMutation(chamberIndex, playerNormX, deathsInChamber, telemetry);
    return this.uiState;
  }

  public recordJump(isMovingFast: boolean, telemetry: PlayerTelemetry): void {
    const now = performance.now();
    telemetry.jumpsTotal += 1;
    this.actionCounts.JUMPING += 1;
    if (isMovingFast) {
      this.actionCounts.RUSHING += 1;
    }
    this.recentJumpTimestamps.push(now);
    this.recentJumpTimestamps = this.recentJumpTimestamps.filter((t) => now - t < 2100);

    if (this.recentJumpTimestamps.length >= 4) {
      telemetry.rapidJumpBursts += 1;
      this.addRage(6.5, telemetry, undefined, 'Panic Jump Burst');
      this.recentJumpTimestamps = [];
    }
    this.syncMostCommonAction(telemetry);
  }

  public recordDirectionFlipNearHazard(telemetry: PlayerTelemetry): void {
    const now = performance.now();
    this.recentFlipTimestamps.push(now);
    this.recentFlipTimestamps = this.recentFlipTimestamps.filter((t) => now - t < 1600);
    this.actionCounts.REVERSING += 1;
    if (this.recentFlipTimestamps.length >= 3) {
      telemetry.directionFlipsNearHazard += 1;
      this.addRage(5.0, telemetry);
      this.recentFlipTimestamps = [];
    }
    this.syncMostCommonAction(telemetry);
  }

  public recordHesitation(telemetry: PlayerTelemetry): void {
    telemetry.hesitationCount += 1;
    this.actionCounts.HESITATING += 2;
    this.addRage(2.5, telemetry);
    this.syncMostCommonAction(telemetry);
  }

  public recordRush(telemetry: PlayerTelemetry): void {
    this.actionCounts.RUSHING += 1;
    this.syncMostCommonAction(telemetry);
  }

  private syncMostCommonAction(telemetry: PlayerTelemetry): void {
    const entries = Object.entries(this.actionCounts) as [
      'JUMPING' | 'RUSHING' | 'HESITATING' | 'REVERSING',
      number,
    ][];
    entries.sort((a, b) => b[1] - a[1]);
    telemetry.mostCommonPreDeathAction = entries[0][0];
  }

  public recordDeath(
    chamberIndex: number,
    cause: string,
    telemetry: PlayerTelemetry
  ): void {
    this.lastDeathTimestamp = performance.now();

    telemetry.deaths += 1;
    telemetry.deathsPerChamber[chamberIndex] =
      (telemetry.deathsPerChamber[chamberIndex] || 0) + 1;
    telemetry.deathCauses[cause] = (telemetry.deathCauses[cause] || 0) + 1;

    const inRoom = telemetry.deathsPerChamber[chamberIndex];
    // Intensity builds up gradually from earlier levels to later levels
    const levelIntensityScale = 0.8 + chamberIndex * 0.08;
    const gain = (12 + Math.min(20, inRoom * 3.8)) * levelIntensityScale;
    this.addRage(gain, telemetry, chamberIndex, `Died: ${cause}`);

    this.uiState.deathsLabel =
      DEATH_EUPHEMISMS[telemetry.deaths % DEATH_EUPHEMISMS.length];
    this.uiState.pokerLabel =
      POKER_EUPHEMISMS[telemetry.deaths % POKER_EUPHEMISMS.length];
    this.uiState.buttonOrderSeed = telemetry.deaths;

    if (this.getPerceivedRage() >= 48 && telemetry.deaths % 2 === 1) {
      this.uiState.hudSwappedCorners = !this.uiState.hudSwappedCorners;
    }

    if (inRoom >= 4) {
      this.uiState.temptationToastVisible = true;
    }
  }

  public recordRespawnInput(telemetry: PlayerTelemetry): void {
    if (this.lastDeathTimestamp <= 0) return;
    const delta = Math.round(performance.now() - this.lastDeathTimestamp);
    if (delta > 60 && delta < 8000) {
      if (telemetry.fastestRetryMs === null || delta < telemetry.fastestRetryMs) {
        telemetry.fastestRetryMs = delta;
      }
      if (delta < 650) {
        this.addRage(8, telemetry, undefined, 'Instant Rage-Retry');
      }
    }
    this.lastDeathTimestamp = 0;
  }

  public addRage(
    amount: number,
    telemetry: PlayerTelemetry,
    chamberIndex?: number,
    eventLabel?: string
  ): void {
    this.rageScore = Math.max(0, Math.min(100, this.rageScore + amount));
    if (this.rageScore > telemetry.peakRageIndex) {
      telemetry.peakRageIndex = Math.round(this.rageScore);
    }
    if (eventLabel && chamberIndex !== undefined) {
      const elapsedSec = Math.floor((performance.now() - this.sessionStartMs) / 1000);
      telemetry.timeline.push({
        timeSec: elapsedSec,
        rage: Math.round(this.rageScore),
        chamberIndex,
        event: eventLabel,
      });
    }
  }

  public dismissTemptationToast(): void {
    this.uiState.temptationToastVisible = false;
  }

  public markTemptationDodged(telemetry: PlayerTelemetry): void {
    if (!this.uiState.temptationDodgedOnce) {
      this.uiState.temptationDodgedOnce = true;
      telemetry.uiManipulationsClicked += 1;
    }
  }

  private computeUIMutation(
    chamberIndex: number,
    playerNormX: number,
    deathsInChamber: number,
    telemetry: PlayerTelemetry
  ): void {
    const clampedRoom = Math.max(0, Math.min(1, playerNormX));
    const cadence = this.getRecentKeyCadenceMs();

    this.uiState.bluffCooldownSec = Math.ceil(this.bluffCooldown);

    if (this.isPokerActive()) {
      this.uiState.liveObservation = 'Pulse masked · Sensors blinded';
    } else if (cadence < 225) {
      this.uiState.liveObservation = `Key cadence: ${cadence}ms · Floor gears stirring`;
    } else if (this.getTrapFrustrationLevel() >= 42) {
      this.uiState.liveObservation = `Key cadence: ${cadence}ms · Temper elevated`;
    } else if (deathsInChamber >= 3) {
      this.uiState.liveObservation = `Key cadence: ${cadence}ms · Habit: ${telemetry.mostCommonPreDeathAction.toLowerCase()}`;
    } else {
      this.uiState.liveObservation = `Key cadence: ${cadence}ms · Watching stride`;
    }

    let levelLabel = `Level ${chamberIndex + 1}`;
    let fakePct = 10;
    let inverted = false;

    switch (chamberIndex) {
      case 0:
        // Surges optimistically to 92% right before the exit trapdoor!
        fakePct = clampedRoom > 0.78 ? Math.min(94.8, 45 + clampedRoom * 52) : 8 + clampedRoom * 36;
        break;
      case 1:
        // Climbs to 97.4% right before the door flinches away, then drops!
        fakePct = clampedRoom > 0.88 ? 51.2 : Math.min(97.4, 34 + clampedRoom * 68);
        break;
      case 2:
        // Surges to 99.6% in front of the sunlit false exit, then plummets when shuttered!
        fakePct = clampedRoom > 0.84 ? 46.5 : Math.min(99.6, 62 + clampedRoom * 42);
        break;
      case 3:
        fakePct = 38 + clampedRoom * 36;
        break;
      case 4:
        // Climbs all the way to 99.9% right before the unmarked fake completion screen!
        fakePct = Math.min(99.9, 68 + clampedRoom * 32.5);
        break;
      case 5:
        // Quietly drains backward as you move forward
        inverted = true;
        fakePct = Math.max(6.4, 89 - clampedRoom * 78);
        break;
      case 6:
        levelLabel = clampedRoom < 0.35 ? 'Level 1' : 'Level 7';
        fakePct = clampedRoom > 0.82 ? 39.0 : Math.min(98.2, 18 + clampedRoom * 88);
        break;
      case 7:
      default:
        levelLabel = 'Level 8';
        fakePct = Math.min(99.9, 74 + clampedRoom * 26);
        break;
    }

    // Subtle false-hope boost after repeated deaths so the bar looks deceptively closer
    if (deathsInChamber >= 3 && !inverted && clampedRoom < 0.5) {
      fakePct = Math.min(96.0, fakePct + Math.min(12, deathsInChamber * 2.2));
    }

    if (deathsInChamber >= 4 && chamberIndex >= 2 && chamberIndex < 7 && clampedRoom < 0.4) {
      levelLabel = `Level ${chamberIndex + 2}`;
    }

    this.uiState.displayedLevelNumber = levelLabel;
    this.uiState.displayedProgress = Number(fakePct.toFixed(1));
    this.uiState.progressInverted = inverted;
  }

  public getDominantHabitSummary(telemetry: PlayerTelemetry): string {
    const cadence = this.getRecentKeyCadenceMs();
    if (cadence < 225) {
      return `OBSERVATION: ${cadence}ms key cadence — temper rising.`;
    }
    if (telemetry.mostCommonPreDeathAction === 'RUSHING') {
      return `OBSERVATION: Subject rushes ledges (${telemetry.deaths} deaths).`;
    }
    if (telemetry.mostCommonPreDeathAction === 'HESITATING') {
      return `OBSERVATION: Subject hesitates before leaping.`;
    }
    return `OBSERVATION: ${cadence}ms key rhythm · Habit: ${telemetry.mostCommonPreDeathAction}.`;
  }
}

export const rageEngine = new RageAndAdaptationEngine();
