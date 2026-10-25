import { ChamberDef, HuskType } from '../types/game';

/**
 * 8 Unnamed Levels (Displayed strictly as Level 1 .. Level 8 — zero spoiler titles).
 *
 * Psychological Design Principles:
 * 1. Unspoken False Hopes:
 *    - Flush TRAPDOOR slabs abutting SOLID stone/oak with zero visual giveaway right before exits
 *      or immediately past raised bridges.
 *    - Doorways that flinch away once (Level 2) or twice (Level 7) over hidden trapdoors.
 *    - Sunlit false exit slammed shut by iron (Level 3) & unmarked 100.0% fake victory (Level 5).
 *    - Wired Emerald Lanterns (Levels 4 & 7) weaponizing trust built by Golden Checkpoints.
 * 2. Escalating Difficulty (No Free Walks) + Earned Small Wins:
 *    - Starts crisp on Level 1 (collapsing timber, gate puzzle, Husk boost, flush exit trapdoor)
 *      and intensifies steadily through Level 8.
 *    - Mid-level Golden Checkpoints, permanent bridge/gate latches, and copper fuse cuts must be
 *      EARNED past real obstacles—keeping frustration and "one more try!" motivation locked together.
 */
export const CHAMBERS: ChamberDef[] = [
  // =========================================================================
  // LEVEL 1 — Crisp Awakening, Collapsing Plank, Loft Gate Latch & Flush Exit Trapdoor
  // =========================================================================
  {
    index: 0,
    levelNumber: 1,
    objectiveHint:
      'Leap briskly across the dry timber to reach the golden lantern, unbolt the gate from the upper loft, hop off the corpse, and watch your footing near the arch.',
    spawnX: -12.6,
    spawnY: 0.2,
    boundsMinX: -15.0,
    boundsMaxX: 15.6,
    exitX: 13.2,
    exitY: 2.05,
    safeCheckpoint: { x: 1.5, y: 0.65 },
    ambientTint: 0x251a2e,
    accentColor: 0xd97706,
    eyes: [
      { x: -8.0, y: 3.9, scale: 1.0 },
      { x: 1.5, y: 4.3, scale: 1.2 },
      { x: 10.6, y: 4.1, scale: 1.1 },
    ],
    platforms: [
      { id: 'l1_start', x: -11.4, y: 0, width: 3.8, height: 1.2, kind: 'SOLID' },
      { id: 'l1_step_1', x: -6.4, y: 0.35, width: 2.2, height: 0.5, kind: 'SOLID' },
      // Real collapsing plank early so careless strolling fails
      { id: 'l1_collapse_1', x: -2.2, y: 0.55, width: 2.0, height: 0.38, kind: 'COLLAPSING' },
      // Earned Small Win #1: Mid-Level Golden Anchor Checkpoint
      { id: 'l1_sanctuary', x: 1.6, y: 0.65, width: 3.0, height: 1.0, kind: 'SOLID' },
      // Rattling loft above sanctuary (Small Win #2: Copper-wired Gate Latch)
      { id: 'l1_latch_loft', x: 0.0, y: 2.05, width: 2.0, height: 0.35, kind: 'PARANOIA_SAFE' },
      { id: 'l1_gate_floor', x: 5.8, y: 0.65, width: 2.2, height: 1.0, kind: 'SOLID' },
      {
        id: 'l1_gate',
        x: 6.0,
        y: 3.75,
        width: 0.6,
        height: 3.1,
        kind: 'GATE',
        linkedSwitchId: 'l1_gate_latch',
      },
      { id: 'l1_husk_alcove', x: 8.8, y: -0.2, width: 2.2, height: 0.9, kind: 'SOLID' },
      // Unspoken False Hope: Front half of the exit ledge is a flush TRAPDOOR!
      { id: 'l1_exit_trap', x: 10.9, y: 2.05, width: 1.3, height: 1.4, kind: 'TRAPDOOR' },
      { id: 'l1_exit_real', x: 13.05, y: 2.05, width: 3.0, height: 1.4, kind: 'SOLID' },
    ],
    hazards: [
      { id: 'l1_spikes_mid', x: -4.2, y: -1.5, width: 8.8, height: 0.65, kind: 'SPIKES' },
      { id: 'l1_spikes_end', x: 10.8, y: -1.5, width: 2.4, height: 0.65, kind: 'SPIKES' },
      {
        id: 'l1_rage_crusher',
        x: 5.5,
        y: 3.9,
        width: 1.9,
        height: 0.85,
        kind: 'HABIT_CRUSHER',
        triggerHeight: 0.65,
        minRageToActivate: 42,
      },
      {
        id: 'l1_rage_spikes',
        x: -6.4,
        y: 0.35,
        width: 0.56,
        height: 0.45,
        kind: 'SPIKES',
        minRageToActivate: 56,
      },
    ],
    switches: [
      {
        id: 'l1_gate_latch',
        x: 0.0,
        y: 2.05,
        width: 1.0,
        requiresWeight: false,
        wireTo: { x: 6.0, y: 2.6 },
        winMessage: 'SMALL VICTORY · Iron Gate Unbolted',
        label: 'Unbolt Iron Gate',
      },
    ],
    ghost: {
      id: 'l1_ghost',
      x: -6.4,
      y: 1.55,
      isTruth: true,
      hintText:
        '"The upper plank rattles only to startle you—and leap clean past the front lip of the final stone."',
      recommendedAction: 'CLIMB',
    },
    signs: [
      {
        id: 'l1_sign',
        x: -11.6,
        y: 0,
        initialText: 'You woke with no memory of your former life. Follow the copper wires.',
        afterDeathText: 'Even stone and bone betray those who celebrate early.',
      },
    ],
    presetHusks: [
      {
        type: HuskType.BODY,
        x: 8.8,
        y: 0.25,
        width: 0.76,
        height: 1.44,
        facing: 1,
        causeOfDeath: 'Prior Rebirth',
        frames: [],
        maxLifetimeSec: 34,
        isSynthetic: true,
      },
    ],
    clearedMemory: {
      id: 'mem_1',
      index: 1,
      chamberIndex: 0,
      eraLabel: 'Past-Life Memory · Fragment I',
      fragmentSummary: 'Calloused Hands & Brass Dust',
      loreBody:
        'A flash from before your rebirth returns: you were not a wanderer in your previous life. You worked late by oil lamp, wiring copper conduits to brass gears and measuring how desperate people react to fear.',
      lingeringEcho:
        'Why did you die with brass dust under your fingernails—and why does this House feel built to your exact stride?',
    },
  },

  // =========================================================================
  // LEVEL 2 — Decoy High Crusher Route, Ember Drawbridge, Recoil Deck & Flinching Door Trapdoor
  // =========================================================================
  {
    index: 1,
    levelNumber: 2,
    objectiveHint:
      'Drop onto the glowing ember grate below to raise the bridge, steady your keystrokes before the recoil deck, and jump when the doorway flinches.',
    spawnX: -12.8,
    spawnY: 0.2,
    boundsMinX: -15.0,
    boundsMaxX: 16.0,
    exitX: 11.5,
    exitY: 1.05,
    exitMovesOnApproach: 1,
    safeCheckpoint: { x: 4.5, y: 0.65 },
    ambientTint: 0x1b2432,
    accentColor: 0x38bdf8,
    eyes: [
      { x: -8.4, y: 4.2, scale: 1.0 },
      { x: -2.0, y: 4.5, scale: 1.25 },
      { x: 5.0, y: 4.2, scale: 1.15 },
      { x: 12.2, y: 3.9, scale: 1.15 },
    ],
    platforms: [
      { id: 'l2_start', x: -11.4, y: 0, width: 3.6, height: 1.2, kind: 'SOLID' },
      { id: 'l2_step_1', x: -6.5, y: 0.35, width: 2.2, height: 0.5, kind: 'SOLID' },
      // Decoy upper plank (Ghost lies to send you here into a collapsing plank + Habit Crusher!)
      { id: 'l2_collapse_high', x: -2.8, y: 1.45, width: 2.1, height: 0.35, kind: 'COLLAPSING' },
      // Safe scary-looking lower grate (Small Win #1: Permanently raises the Brass Drawbridge)
      { id: 'l2_ember_grate', x: -2.8, y: -0.35, width: 2.4, height: 0.45, kind: 'SAFE_SMOKING' },
      {
        id: 'l2_bridge',
        x: 0.9,
        y: 0.5,
        width: 2.8,
        height: 0.42,
        kind: 'BRIDGE',
        linkedSwitchId: 'l2_bridge_switch',
      },
      // Earned Small Win #2: Golden Anchor Checkpoint
      { id: 'l2_mid_anchor', x: 4.6, y: 0.65, width: 2.8, height: 1.0, kind: 'SOLID' },
      // Cadence Recoil deck: slides away if key mashing OR sprinting non-stop when frustrated
      { id: 'l2_recoil', x: 8.2, y: 0.9, width: 2.2, height: 0.42, kind: 'CADENCE_RECOIL', recoilDir: 1 },
      // Unspoken False Hope: Door starts at 11.5 on l2_exit_front, then flinches right to 13.45 across l2_exit_trap!
      { id: 'l2_exit_front', x: 11.2, y: 1.05, width: 1.8, height: 1.3, kind: 'SOLID' },
      { id: 'l2_exit_trap', x: 12.65, y: 1.05, width: 1.1, height: 1.3, kind: 'TRAPDOOR' },
      { id: 'l2_exit_back', x: 14.3, y: 1.05, width: 2.2, height: 1.3, kind: 'SOLID' },
    ],
    hazards: [
      { id: 'l2_pit_spikes', x: 2.4, y: -1.7, width: 22.5, height: 0.65, kind: 'SPIKES' },
      {
        id: 'l2_high_crusher',
        x: -2.8,
        y: 4.1,
        width: 2.0,
        height: 0.85,
        kind: 'HABIT_CRUSHER',
        triggerHeight: 1.45,
      },
      {
        id: 'l2_rage_pendulum',
        x: 4.9,
        y: 4.0,
        width: 1.3,
        height: 0.85,
        kind: 'BAIT_PENDULUM',
        triggerHeight: 0.65,
        minRageToActivate: 38,
      },
      {
        id: 'l2_rage_spikes',
        x: -6.5,
        y: 0.35,
        width: 0.56,
        height: 0.45,
        kind: 'SPIKES',
        minRageToActivate: 54,
      },
    ],
    switches: [
      {
        id: 'l2_bridge_switch',
        x: -2.8,
        y: -0.35,
        width: 1.0,
        requiresWeight: false,
        wireTo: { x: 0.9, y: 0.5 },
        winMessage: 'SMALL VICTORY · Brass Drawbridge Raised',
        label: 'Raise Drawbridge',
      },
    ],
    ghost: {
      id: 'l2_ghost',
      x: -6.5,
      y: 1.55,
      isTruth: false,
      hintText:
        '"Keep high above that glowing iron grate below—one touch of those embers will burn through your boots!"',
      recommendedAction: 'CLIMB',
    },
    signs: [
      {
        id: 'l2_sign',
        x: -11.6,
        y: 0,
        initialText: 'Your hands repeat habits your mind forgot.',
        isHabitWall: true,
      },
    ],
    clearedMemory: {
      id: 'mem_2',
      index: 2,
      chamberIndex: 1,
      eraLabel: 'Past-Life Memory · Fragment II',
      fragmentSummary: 'The Empty Chair & The Vow',
      loreBody:
        'You remember winter rain against tall manor windows in your former life. Someone you loved vanished into death without warning—and in your grief, you swore to build an engine that could trap every habit, reflex, and echo of a departing soul.',
      lingeringEcho:
        'Those crumbling Husks on the floor were born from your obsession with refusing to let the dead disappear.',
    },
  },

  // =========================================================================
  // LEVEL 3 — Husk Weight Gate, Blade Gauntlet, Sunlit False Exit & Upper Trapdoor
  // =========================================================================
  {
    index: 2,
    levelNumber: 3,
    objectiveHint:
      'Push the corpse onto the weight plate, bait or cut the crescent blade, break your sprint on the sunlit walk, and leap past the seam on the upper arch.',
    spawnX: -13.0,
    spawnY: 0.2,
    boundsMinX: -15.0,
    boundsMaxX: 16.0,
    exitX: 13.6,
    exitY: 2.35,
    falseSunriseShutter: true,
    safeCheckpoint: { x: -1.3, y: 0.45 },
    ambientTint: 0x262118,
    accentColor: 0xf59e0b,
    eyes: [
      { x: -6.8, y: 4.1, scale: 1.1 },
      { x: 1.6, y: 4.5, scale: 1.25 },
      { x: 9.8, y: 4.4, scale: 1.35 },
    ],
    platforms: [
      { id: 'l3_start', x: -11.6, y: 0, width: 3.6, height: 1.2, kind: 'SOLID' },
      { id: 'l3_plate_island', x: -6.3, y: 0.3, width: 3.0, height: 0.9, kind: 'SOLID' },
      {
        id: 'l3_gate',
        x: -3.6,
        y: 3.4,
        width: 0.6,
        height: 3.1,
        kind: 'GATE',
        linkedSwitchId: 'l3_weight_plate',
      },
      // Earned Small Win #1: Golden Anchor Checkpoint past the Husk Gate
      { id: 'l3_anchor_isle', x: -1.3, y: 0.45, width: 2.6, height: 0.95, kind: 'SOLID' },
      // Optional Small Win #2: Lower ember nook disarms the first predictive blade
      { id: 'l3_disarm_nook', x: 1.6, y: -0.5, width: 1.9, height: 0.44, kind: 'SAFE_SMOKING' },
      { id: 'l3_bait_bridge', x: 4.3, y: 0.55, width: 3.0, height: 0.5, kind: 'SOLID' },
      // Sunlit false-hope promenade (holding continuous run here triggers l3_crusher_run!)
      { id: 'l3_promenade', x: 9.2, y: 0.5, width: 3.6, height: 0.9, kind: 'SOLID' },
      // Collapsing step up to the real upper exit + flush TRAPDOOR lip!
      { id: 'l3_upper_step', x: 9.8, y: 1.55, width: 1.9, height: 0.35, kind: 'COLLAPSING' },
      { id: 'l3_real_trap', x: 12.1, y: 2.35, width: 1.0, height: 0.85, kind: 'TRAPDOOR' },
      { id: 'l3_real_exit', x: 13.9, y: 2.35, width: 2.6, height: 0.85, kind: 'SOLID' },
    ],
    hazards: [
      { id: 'l3_spikes', x: 3.2, y: -1.65, width: 22.0, height: 0.65, kind: 'SPIKES' },
      {
        id: 'l3_pendulum_1',
        x: 4.3,
        y: 3.7,
        width: 1.35,
        height: 0.85,
        kind: 'BAIT_PENDULUM',
        triggerHeight: 0.55,
      },
      // Punishes players who hold continuous sprint straight toward the warm sunlit false exit!
      {
        id: 'l3_crusher_run',
        x: 8.8,
        y: 3.85,
        width: 1.9,
        height: 0.85,
        kind: 'HABIT_CRUSHER',
        triggerHeight: 0.5,
      },
      {
        id: 'l3_rage_pendulum',
        x: 7.4,
        y: 3.8,
        width: 1.3,
        height: 0.85,
        kind: 'BAIT_PENDULUM',
        triggerHeight: 0.5,
        minRageToActivate: 36,
      },
      {
        id: 'l3_rage_spikes',
        x: -10.3,
        y: 0.0,
        width: 0.6,
        height: 0.46,
        kind: 'SPIKES',
        minRageToActivate: 52,
      },
    ],
    switches: [
      {
        id: 'l3_weight_plate',
        x: -5.5,
        y: 0.3,
        width: 1.15,
        requiresWeight: true,
        wireTo: { x: -3.6, y: 2.2 },
        label: 'Weight Plate',
      },
      {
        id: 'l3_disarm_blade',
        x: 1.6,
        y: -0.5,
        width: 0.95,
        requiresWeight: false,
        disarmsHazardId: 'l3_pendulum_1',
        wireTo: { x: 4.3, y: 3.7 },
        winMessage: 'SMALL VICTORY · Crescent Blade Disarmed',
        label: 'Cut Blade Wire',
      },
    ],
    ghost: {
      id: 'l3_ghost',
      x: -7.2,
      y: 1.5,
      isTruth: false,
      hintText:
        '"Never break stride—sprint straight under the iron and run into the warm sunlight ahead!"',
      recommendedAction: 'RUSH',
    },
    signs: [
      {
        id: 'l3_sign',
        x: -11.8,
        y: 0,
        initialText: 'Nudge what remains onto brass—and beware what shines too warmly.',
        afterDeathText: 'Unbroken sprints wake the ceiling jaws.',
      },
    ],
    presetHusks: [
      {
        type: HuskType.BODY,
        x: -6.8,
        y: 0.75,
        width: 0.76,
        height: 1.44,
        facing: 1,
        causeOfDeath: 'Prior Vessel',
        frames: [],
        maxLifetimeSec: 40,
        isSynthetic: true,
      },
    ],
    clearedMemory: {
      id: 'mem_3',
      index: 3,
      chamberIndex: 2,
      eraLabel: 'Past-Life Memory · Fragment III',
      fragmentSummary: 'The Doctrine of False Dawn',
      loreBody:
        'Another piece of your past life clicks into place: in your notebooks, you wrote that a soul reveals nothing when defeat is certain—only when small mercies and false hope are dangled side by side.',
      lingeringEcho:
        'You were the one who designed false hope as an instrument. Who were you testing it on?',
    },
  },

  // =========================================================================
  // LEVEL 4 — Weaponized Trust (Booby-Trapped Emerald Lantern), Husk Race, Patient Oak & Gate Trapdoor
  // =========================================================================
  {
    index: 3,
    levelNumber: 4,
    objectiveHint:
      'Trace the copper wire behind where you woke before touching green light, leave a Husk on the plate, pause before oak, and hop past the gate seam.',
    spawnX: -11.0,
    spawnY: 0.2,
    boundsMinX: -15.5,
    boundsMaxX: 16.0,
    exitX: 13.6,
    exitY: 1.05,
    hasFakeCheckpoint: {
      x: 1.4,
      y: 0.9,
      realSwitchId: 'l4_fuse_switch',
      fuseX: -14.2,
      fuseY: 0.6,
    },
    ambientTint: 0x16241f,
    accentColor: 0x10b981,
    eyes: [
      { x: -10.2, y: 3.9, scale: 0.95 },
      { x: -2.8, y: 4.4, scale: 1.2 },
      { x: 5.0, y: 4.3, scale: 1.2 },
      { x: 11.4, y: 4.0, scale: 1.15 },
    ],
    platforms: [
      { id: 'l4_back_nook', x: -14.2, y: 0.45, width: 2.0, height: 0.6, kind: 'SOLID' },
      { id: 'l4_start', x: -10.3, y: 0, width: 3.6, height: 1.2, kind: 'SOLID' },
      { id: 'l4_recoil_1', x: -6.4, y: 0.3, width: 2.1, height: 0.44, kind: 'CADENCE_RECOIL', recoilDir: -1 },
      { id: 'l4_switch_island', x: -2.8, y: 0.45, width: 2.8, height: 1.0, kind: 'SOLID' },
      { id: 'l4_mid_sanctuary', x: 1.4, y: 0.9, width: 2.8, height: 1.0, kind: 'SOLID' },
      // Small Win #2: Lower ember step disarms the ceiling jaw above the weight plate
      { id: 'l4_disarm_step', x: 3.8, y: -0.25, width: 1.8, height: 0.42, kind: 'SAFE_SMOKING' },
      { id: 'l4_patient', x: 6.3, y: 0.95, width: 2.5, height: 0.42, kind: 'PATIENT_OAK' },
      { id: 'l4_gate_pad', x: 9.8, y: 1.05, width: 1.9, height: 1.3, kind: 'SOLID' },
      {
        id: 'l4_gate',
        x: 9.8,
        y: 3.95,
        width: 0.65,
        height: 3.1,
        kind: 'GATE',
        linkedSwitchId: 'l4_gate_switch',
      },
      // Unspoken False Hope right past the unbolted gate!
      { id: 'l4_exit_trap', x: 11.35, y: 1.05, width: 1.2, height: 1.3, kind: 'TRAPDOOR' },
      { id: 'l4_exit', x: 13.6, y: 1.05, width: 3.3, height: 1.3, kind: 'SOLID' },
    ],
    hazards: [
      { id: 'l4_spikes', x: 2.6, y: -1.55, width: 22.0, height: 0.65, kind: 'SPIKES' },
      {
        id: 'l4_crusher',
        x: -2.8,
        y: 4.2,
        width: 2.1,
        height: 0.85,
        kind: 'HABIT_CRUSHER',
        triggerHeight: 0.45,
      },
      {
        id: 'l4_rage_pendulum',
        x: 6.3,
        y: 4.0,
        width: 1.3,
        height: 0.85,
        kind: 'BAIT_PENDULUM',
        triggerHeight: 0.95,
        minRageToActivate: 34,
      },
      {
        id: 'l4_rage_crusher_2',
        x: 1.4,
        y: 4.1,
        width: 2.0,
        height: 0.85,
        kind: 'HABIT_CRUSHER',
        triggerHeight: 0.9,
        minRageToActivate: 48,
      },
    ],
    switches: [
      {
        id: 'l4_fuse_switch',
        x: -14.2,
        y: 0.45,
        width: 0.95,
        requiresWeight: false,
        isHiddenCheckpointFuse: true,
        winMessage: 'SMALL VICTORY · Trap Conduit Cut — Lantern Safe!',
        label: 'Cut Copper Conduit',
      },
      {
        id: 'l4_gate_switch',
        x: -2.8,
        y: 0.45,
        width: 1.25,
        requiresWeight: true,
        wireTo: { x: 9.8, y: 2.6 },
        label: 'Weight Plate',
      },
      {
        id: 'l4_disarm_crusher',
        x: 3.8,
        y: -0.25,
        width: 0.95,
        requiresWeight: false,
        disarmsHazardId: 'l4_crusher',
        wireTo: { x: -2.8, y: 4.2 },
        winMessage: 'SMALL VICTORY · Ceiling Jaw Disarmed',
        label: 'Disarm Ceiling Jaw',
      },
    ],
    ghost: {
      id: 'l4_ghost',
      x: -6.4,
      y: 1.5,
      isTruth: true,
      hintText:
        '"Follow the copper wire behind where you woke before trusting emerald light—and pause one breath before stepping onto oak."',
      recommendedAction: 'WAIT',
    },
    signs: [
      {
        id: 'l4_sign',
        x: -10.6,
        y: 0,
        initialText: 'Not every lantern was lit for your mercy. Check its wire.',
      },
    ],
    clearedMemory: {
      id: 'mem_4',
      index: 4,
      chamberIndex: 3,
      eraLabel: 'Past-Life Memory · Fragment IV',
      fragmentSummary: 'Splitting the Soul in Two',
      loreBody:
        'You remember standing before a surgical ether bell in your past life. Knowing your own conscience would try to abort the rebirth trial, you severed your remorse from your ambition—leaving that fractured conscience adrift in the halls as a pale Ghost.',
      lingeringEcho:
        'The Ghost is part of who you were before you died—torn between saving you and hiding your past.',
    },
  },

  // =========================================================================
  // LEVEL 5 — Phase Glass, Safety Drawbridge, Saboteur Husk, Trapdoor & Unmarked Fake Escape
  // =========================================================================
  {
    index: 4,
    levelNumber: 5,
    objectiveHint:
      'Hold Poker Face [Shift] right as you jump toward violet glass, raise the safety bridge below if needed, and leap clean onto the far arch.',
    spawnX: -12.8,
    spawnY: 0.2,
    boundsMinX: -15.0,
    boundsMaxX: 16.0,
    exitX: 13.6,
    exitY: 1.5,
    triggersFakeWin: true,
    safeCheckpoint: { x: 1.2, y: 1.2 },
    ambientTint: 0x291a2e,
    accentColor: 0xc084fc,
    eyes: [
      { x: -8.0, y: 4.3, scale: 1.1 },
      { x: -0.6, y: 4.6, scale: 1.35 },
      { x: 6.8, y: 4.3, scale: 1.2 },
      { x: 11.4, y: 4.1, scale: 1.15 },
    ],
    platforms: [
      { id: 'l5_start', x: -11.4, y: 0, width: 3.6, height: 1.2, kind: 'SOLID' },
      { id: 'l5_collapse_1', x: -7.0, y: 0.4, width: 2.1, height: 0.42, kind: 'COLLAPSING' },
      // Small Win #1: Lower grate raises a backup drawbridge under the first phase glass
      { id: 'l5_low_nook', x: -4.6, y: -0.35, width: 1.9, height: 0.42, kind: 'SAFE_SMOKING' },
      { id: 'l5_disp_1', x: -2.2, y: 1.1, width: 2.2, height: 0.35, kind: 'DISAPPEARING' },
      {
        id: 'l5_backup_bridge',
        x: -2.2,
        y: 0.5,
        width: 2.3,
        height: 0.38,
        kind: 'BRIDGE',
        linkedSwitchId: 'l5_bridge_latch',
      },
      // Earned Small Win #2: Golden Checkpoint guarded by Saboteur Husk + Pendulum
      { id: 'l5_mid', x: 1.8, y: 1.2, width: 3.0, height: 0.95, kind: 'SOLID' },
      { id: 'l5_disp_2', x: 5.8, y: 1.45, width: 2.1, height: 0.42, kind: 'DISAPPEARING' },
      { id: 'l5_recoil', x: 9.2, y: 1.5, width: 2.1, height: 0.42, kind: 'CADENCE_RECOIL', recoilDir: -1 },
      // Flush trapdoor right before the unmarked Fake Victory arch!
      { id: 'l5_exit_trap', x: 11.7, y: 1.5, width: 1.1, height: 1.3, kind: 'TRAPDOOR' },
      { id: 'l5_exit', x: 13.75, y: 1.5, width: 3.0, height: 1.3, kind: 'SOLID' },
    ],
    hazards: [
      { id: 'l5_spikes', x: 2.2, y: -1.55, width: 22.0, height: 0.65, kind: 'SPIKES' },
      {
        id: 'l5_pendulum',
        x: 2.1,
        y: 4.2,
        width: 1.35,
        height: 0.85,
        kind: 'BAIT_PENDULUM',
        triggerHeight: 1.2,
      },
      {
        id: 'l5_rage_crusher',
        x: -7.0,
        y: 3.9,
        width: 2.0,
        height: 0.85,
        kind: 'HABIT_CRUSHER',
        triggerHeight: 0.4,
        minRageToActivate: 32,
      },
      {
        id: 'l5_rage_pendulum',
        x: 9.2,
        y: 4.2,
        width: 1.35,
        height: 0.85,
        kind: 'BAIT_PENDULUM',
        triggerHeight: 1.5,
        minRageToActivate: 46,
      },
      {
        id: 'l5_rage_spikes',
        x: -10.1,
        y: 0.0,
        width: 0.58,
        height: 0.46,
        kind: 'SPIKES',
        minRageToActivate: 54,
      },
    ],
    switches: [
      {
        id: 'l5_bridge_latch',
        x: -4.6,
        y: -0.35,
        width: 0.95,
        requiresWeight: false,
        wireTo: { x: -2.2, y: 0.5 },
        winMessage: 'SMALL VICTORY · Safety Drawbridge Raised',
        label: 'Raise Safety Bridge',
      },
    ],
    ghost: {
      id: 'l5_ghost',
      x: -7.0,
      y: 1.6,
      isTruth: true,
      hintText:
        '"Mask your pulse only at the instant you leap—if you hold it early, your composure runs dry mid-air."',
      recommendedAction: 'WAIT',
    },
    signs: [
      {
        id: 'l5_sign',
        x: -11.6,
        y: 0,
        initialText: 'Hide what you feel, and even the glass misreads your next step.',
      },
    ],
    presetHusks: [
      {
        type: HuskType.SABOTEUR,
        x: 2.3,
        y: 1.92,
        width: 0.76,
        height: 1.44,
        facing: -1,
        causeOfDeath: 'Past Rebirth',
        frames: [],
        maxLifetimeSec: 46,
        isSynthetic: true,
      },
    ],
    clearedMemory: {
      id: 'mem_5',
      index: 5,
      chamberIndex: 4,
      eraLabel: 'Past-Life Memory · Fragment V',
      fragmentSummary: 'The Voice on the Wax Cylinder',
      loreBody:
        'Beneath the shattered stage, a memory surfaces of you speaking into a brass recording horn before your death—deliberately crafting a cruel, mocking persona called "The Devil" because you believed only relentless provocation could expose a reborn soul’s true nature.',
      lingeringEcho:
        'Every time you answer the Devil, you are arguing with the traps your past self swore were inescapable.',
    },
  },

  // =========================================================================
  // LEVEL 6 — Crimson Inversion Mist, Crumbling Loft Cutter, Post-Mist Anchor & Gate Trapdoor
  // =========================================================================
  {
    index: 5,
    levelNumber: 6,
    objectiveHint:
      'Cut the mist crusher wire from the crumbling upper-left loft, survive the crimson inversion mist to reach the golden lantern, then unbolt the exit gate below.',
    spawnX: -12.8,
    spawnY: 0.2,
    boundsMinX: -15.5,
    boundsMaxX: 16.5,
    exitX: 13.9,
    exitY: 1.65,
    reverseZone: { minX: -3.6, maxX: 4.6 },
    safeCheckpoint: { x: 5.8, y: 1.25 },
    ambientTint: 0x2b1219,
    accentColor: 0xf43f5e,
    eyes: [
      { x: -9.0, y: 4.1, scale: 1.15 },
      { x: -1.8, y: 4.5, scale: 1.35 },
      { x: 2.8, y: 4.5, scale: 1.35 },
      { x: 10.2, y: 4.2, scale: 1.2 },
    ],
    platforms: [
      { id: 'l6_start', x: -11.4, y: 0, width: 3.6, height: 1.2, kind: 'SOLID' },
      // Small Win #1: Crumbling loft switch cuts the Habit Crusher inside the crimson mist
      { id: 'l6_disarm_loft', x: -9.9, y: 1.6, width: 1.9, height: 0.35, kind: 'COLLAPSING' },
      { id: 'l6_step_1', x: -6.6, y: 0.4, width: 2.2, height: 0.5, kind: 'PARANOIA_SAFE' },
      // Crimson Inversion Mist Zone
      { id: 'l6_rev_1', x: -2.2, y: 0.8, width: 2.4, height: 0.5, kind: 'SOLID' },
      { id: 'l6_rev_2', x: 1.8, y: 1.1, width: 2.2, height: 0.44, kind: 'CADENCE_RECOIL', recoilDir: 1 },
      // Earned Small Win #2: Post-Mist Golden Anchor Checkpoint
      { id: 'l6_anchor', x: 6.0, y: 1.25, width: 2.8, height: 1.0, kind: 'SOLID' },
      // Small Win #3: Lower ember grate unbolts the final Exit Gate
      { id: 'l6_latch_pit', x: 8.6, y: -0.15, width: 2.0, height: 0.44, kind: 'SAFE_SMOKING' },
      { id: 'l6_collapse', x: 9.7, y: 1.45, width: 1.9, height: 0.35, kind: 'COLLAPSING' },
      {
        id: 'l6_gate',
        x: 11.6,
        y: 4.35,
        width: 0.6,
        height: 3.1,
        kind: 'GATE',
        linkedSwitchId: 'l6_gate_latch',
      },
      // Flush trapdoor right behind the unbolted gate!
      { id: 'l6_exit_trap', x: 12.1, y: 1.65, width: 1.0, height: 1.3, kind: 'TRAPDOOR' },
      { id: 'l6_exit', x: 14.0, y: 1.65, width: 2.8, height: 1.3, kind: 'SOLID' },
      {
        id: 'l6_pity',
        x: 2.4,
        y: -0.25,
        width: 17.5,
        height: 0.38,
        kind: 'PITY_BRIDGE',
        linkedSwitchId: 'l6_pity_switch',
      },
    ],
    hazards: [
      { id: 'l6_spikes', x: 2.4, y: -1.65, width: 22.0, height: 0.65, kind: 'SPIKES' },
      {
        id: 'l6_crusher',
        x: -2.2,
        y: 4.1,
        width: 2.1,
        height: 0.85,
        kind: 'HABIT_CRUSHER',
        triggerHeight: 0.8,
      },
      {
        id: 'l6_rage_pendulum',
        x: 1.8,
        y: 4.2,
        width: 1.35,
        height: 0.85,
        kind: 'BAIT_PENDULUM',
        triggerHeight: 1.1,
        minRageToActivate: 30,
      },
      {
        id: 'l6_rage_crusher_2',
        x: 6.2,
        y: 4.3,
        width: 1.9,
        height: 0.85,
        kind: 'HABIT_CRUSHER',
        triggerHeight: 1.25,
        minRageToActivate: 46,
      },
    ],
    switches: [
      {
        id: 'l6_disarm_crusher',
        x: -9.9,
        y: 1.6,
        width: 0.95,
        requiresWeight: false,
        disarmsHazardId: 'l6_crusher',
        wireTo: { x: -2.2, y: 4.1 },
        winMessage: 'SMALL VICTORY · Mist Crusher Disarmed',
        label: 'Cut Mist Crusher Wire',
      },
      {
        id: 'l6_gate_latch',
        x: 8.6,
        y: -0.15,
        width: 0.95,
        requiresWeight: false,
        wireTo: { x: 11.6, y: 2.8 },
        winMessage: 'SMALL VICTORY · Exit Gate Unbolted',
        label: 'Unbolt Exit Gate',
      },
      {
        id: 'l6_pity_switch',
        x: -12.8,
        y: 0,
        width: 0.9,
        requiresWeight: false,
        label: 'Lower Mercy Bridge',
      },
    ],
    ghost: {
      id: 'l6_ghost',
      x: -6.6,
      y: 1.55,
      isTruth: false,
      hintText:
        '"Save your composure inside the crimson mist—charging through unmasked lets you clear both ledges in one sprint."',
      recommendedAction: 'RUSH',
    },
    signs: [
      {
        id: 'l6_sign',
        x: -11.6,
        y: 0,
        initialText: 'How many times have you woken in this House without knowing?',
        isHabitWall: true,
      },
    ],
    clearedMemory: {
      id: 'mem_6',
      index: 6,
      chamberIndex: 5,
      eraLabel: 'Past-Life Memory · Fragment VI',
      fragmentSummary: 'A Hundred Forgotten Rebirths',
      loreBody:
        'You remember tally marks scratched behind a furnace wall. This is not your first rebirth since your mortal death—countless prior incarnations of you gave in to rage, missed the copper wires, and collapsed into the very Husks littering these floors.',
      lingeringEcho:
        'Every Husk that crumbled under your weight was a version of you that stopped short of the truth.',
    },
  },

  // =========================================================================
  // LEVEL 7 — Backwards Mirror Hall, Wired Emerald Lantern, Rival Shade & Double-Flinching Door
  // =========================================================================
  {
    index: 6,
    levelNumber: 7,
    objectiveHint:
      'Cut the copper wire right behind your spawn before touching green light, raise the mirror bridge below the Rival shade, and leap over the middle slab when the doorway flinches twice.',
    spawnX: 12.0,
    spawnY: 0.2,
    boundsMinX: -15.6,
    boundsMaxX: 15.8,
    exitX: -9.4,
    exitY: 1.5,
    exitMovesOnApproach: 2,
    hasFakeCheckpoint: {
      x: 1.2,
      y: 0.95,
      realSwitchId: 'l7_fuse_switch',
      fuseX: 14.4,
      fuseY: 0.75,
    },
    ambientTint: 0x241328,
    accentColor: 0xe11d48,
    eyes: [
      { x: 9.2, y: 4.1, scale: 1.15 },
      { x: 2.8, y: 4.5, scale: 1.3 },
      { x: -4.2, y: 4.5, scale: 1.3 },
      { x: -11.6, y: 4.1, scale: 1.25 },
    ],
    platforms: [
      // Small Win #1: Rear-right nook behind spawn cuts the Emerald Lantern trap into a real Checkpoint
      { id: 'l7_rear_fuse', x: 14.4, y: 0.6, width: 1.9, height: 0.6, kind: 'SOLID' },
      { id: 'l7_start', x: 10.9, y: 0, width: 3.6, height: 1.2, kind: 'SOLID' },
      { id: 'l7_collapse_1', x: 7.0, y: 0.35, width: 2.0, height: 0.42, kind: 'COLLAPSING' },
      { id: 'l7_recoil', x: 4.1, y: 0.7, width: 2.1, height: 0.42, kind: 'CADENCE_RECOIL', recoilDir: -1 },
      { id: 'l7_mid_sanctuary', x: 0.8, y: 0.95, width: 3.2, height: 1.0, kind: 'SOLID' },
      // Small Win #2: Lower ember switch raises the Mirror Bridge
      { id: 'l7_low_switch', x: -2.2, y: -0.15, width: 2.0, height: 0.44, kind: 'SAFE_SMOKING' },
      {
        id: 'l7_bridge',
        x: -4.7,
        y: 1.15,
        width: 2.2,
        height: 0.4,
        kind: 'BRIDGE',
        linkedSwitchId: 'l7_bridge_latch',
      },
      { id: 'l7_disp', x: -7.5, y: 1.35, width: 2.0, height: 0.4, kind: 'DISAPPEARING' },
      // Double-flinching doorway across a flush TRAPDOOR!
      { id: 'l7_exit_front', x: -9.9, y: 1.5, width: 1.8, height: 1.3, kind: 'SOLID' },
      { id: 'l7_exit_trap', x: -11.45, y: 1.5, width: 1.3, height: 1.3, kind: 'TRAPDOOR' },
      { id: 'l7_exit_back', x: -13.5, y: 1.5, width: 2.8, height: 1.3, kind: 'SOLID' },
    ],
    hazards: [
      { id: 'l7_spikes', x: -1.8, y: -1.6, width: 22.5, height: 0.65, kind: 'SPIKES' },
      {
        id: 'l7_pendulum',
        x: 0.8,
        y: 4.1,
        width: 1.35,
        height: 0.85,
        kind: 'BAIT_PENDULUM',
        triggerHeight: 0.95,
      },
      {
        id: 'l7_rage_crusher',
        x: 7.0,
        y: 3.9,
        width: 1.9,
        height: 0.85,
        kind: 'HABIT_CRUSHER',
        triggerHeight: 0.35,
        minRageToActivate: 30,
      },
      {
        id: 'l7_rage_pendulum',
        x: -13.1,
        y: 4.3,
        width: 1.35,
        height: 0.85,
        kind: 'BAIT_PENDULUM',
        triggerHeight: 1.5,
        minRageToActivate: 44,
      },
    ],
    switches: [
      {
        id: 'l7_fuse_switch',
        x: 14.4,
        y: 0.6,
        width: 0.95,
        requiresWeight: false,
        isHiddenCheckpointFuse: true,
        winMessage: 'SMALL VICTORY · Conduit Cut — Lantern Safe!',
        label: 'Cut Copper Conduit',
      },
      {
        id: 'l7_bridge_latch',
        x: -2.2,
        y: -0.15,
        width: 0.95,
        requiresWeight: false,
        wireTo: { x: -4.7, y: 1.15 },
        winMessage: 'SMALL VICTORY · Mirror Bridge Raised',
        label: 'Raise Mirror Bridge',
      },
    ],
    ghost: {
      id: 'l7_ghost',
      x: 7.0,
      y: 1.55,
      isTruth: true,
      hintText:
        '"Look behind where you woke before touching green light—and mask your jump past the violet glass and Rival shade."',
      recommendedAction: 'WAIT',
    },
    signs: [
      {
        id: 'l7_sign',
        x: 11.4,
        y: 0,
        initialText: 'Walking backward through a memory you almost recognize.',
      },
    ],
    presetHusks: [
      {
        type: HuskType.RIVAL,
        x: 0.2,
        y: 1.67,
        width: 0.76,
        height: 1.44,
        facing: 1,
        causeOfDeath: 'Mirror Rebirth',
        frames: [],
        maxLifetimeSec: 58,
        isSynthetic: true,
      },
    ],
    clearedMemory: {
      id: 'mem_7',
      index: 7,
      chamberIndex: 6,
      eraLabel: 'Past-Life Memory · Fragment VII',
      fragmentSummary: 'The Draught of Forgetting',
      loreBody:
        'Your final mortal hour returns in sharp focus: locking the manor from the inside, signing your own consent ledger, and drinking the cold tincture that stopped your heart and bound your reborn soul to Level 1 with zero memory.',
      lingeringEcho:
        'No enemy imprisoned you here. Your past self chose rebirth inside the machine to see if you could overcome your own nature.',
    },
  },

  // =========================================================================
  // LEVEL 8 — The Architect's Final Crucible & The Mirror of Rebirth
  // =========================================================================
  {
    index: 7,
    levelNumber: 8,
    objectiveHint:
      'Steady your hands across the recoil deck, raise the cathedral bridge below, anchor at the golden lantern, shed a Husk [R] onto the plate, pause before oak, mask onto violet glass, and leap past the final trapdoor.',
    spawnX: -12.8,
    spawnY: 0.2,
    boundsMinX: -15.0,
    boundsMaxX: 16.0,
    exitX: 13.4,
    exitY: 1.65,
    isFinalCore: true,
    safeCheckpoint: { x: 1.9, y: 1.15 },
    ambientTint: 0x1e1326,
    accentColor: 0xfbbf24,
    eyes: [
      { x: -9.5, y: 4.0, scale: 1.1 },
      { x: -6.0, y: 4.7, scale: 1.25 },
      { x: -2.5, y: 5.1, scale: 1.4 },
      { x: 1.0, y: 5.3, scale: 1.55 },
      { x: 4.5, y: 5.1, scale: 1.4 },
      { x: 8.0, y: 4.7, scale: 1.25 },
      { x: 11.8, y: 4.2, scale: 1.2 },
    ],
    platforms: [
      { id: 'l8_start', x: -11.4, y: 0, width: 3.8, height: 1.2, kind: 'SOLID' },
      { id: 'l8_recoil_1', x: -7.0, y: 0.4, width: 2.1, height: 0.44, kind: 'CADENCE_RECOIL', recoilDir: 1 },
      // Small Win #1: Lower grate raises the Cathedral Bridge
      { id: 'l8_low_ember', x: -3.9, y: -0.2, width: 2.0, height: 0.44, kind: 'SAFE_SMOKING' },
      {
        id: 'l8_bridge',
        x: -1.1,
        y: 0.9,
        width: 2.3,
        height: 0.4,
        kind: 'BRIDGE',
        linkedSwitchId: 'l8_bridge_latch',
      },
      // Earned Small Win #2: Final Golden Anchor Checkpoint + Weight Plate for Sanctum Gate
      { id: 'l8_sanctum_mid', x: 2.7, y: 1.15, width: 3.4, height: 1.0, kind: 'SOLID' },
      { id: 'l8_patient', x: 6.3, y: 1.35, width: 2.2, height: 0.42, kind: 'PATIENT_OAK' },
      { id: 'l8_disp', x: 9.0, y: 1.5, width: 2.0, height: 0.42, kind: 'DISAPPEARING' },
      {
        id: 'l8_gate',
        x: 10.6,
        y: 4.55,
        width: 0.6,
        height: 3.1,
        kind: 'GATE',
        linkedSwitchId: 'l8_gate_switch',
      },
      // Final Unspoken Betrayal right before the Mirror Dais!
      { id: 'l8_mirror_trap', x: 11.45, y: 1.65, width: 1.1, height: 1.4, kind: 'TRAPDOOR' },
      { id: 'l8_mirror_dais', x: 13.6, y: 1.65, width: 3.2, height: 1.4, kind: 'SOLID' },
    ],
    hazards: [
      { id: 'l8_spikes', x: 2.2, y: -1.6, width: 22.5, height: 0.65, kind: 'SPIKES' },
      {
        id: 'l8_pendulum',
        x: 6.3,
        y: 4.3,
        width: 1.35,
        height: 0.85,
        kind: 'BAIT_PENDULUM',
        triggerHeight: 1.35,
      },
      {
        id: 'l8_rage_crusher',
        x: 2.7,
        y: 4.3,
        width: 2.0,
        height: 0.85,
        kind: 'HABIT_CRUSHER',
        triggerHeight: 1.15,
        minRageToActivate: 28,
      },
      {
        id: 'l8_rage_pendulum_2',
        x: 9.0,
        y: 4.4,
        width: 1.3,
        height: 0.85,
        kind: 'BAIT_PENDULUM',
        triggerHeight: 1.5,
        minRageToActivate: 42,
      },
      {
        id: 'l8_rage_crusher_3',
        x: -7.0,
        y: 3.9,
        width: 1.9,
        height: 0.85,
        kind: 'HABIT_CRUSHER',
        triggerHeight: 0.4,
        minRageToActivate: 52,
      },
    ],
    switches: [
      {
        id: 'l8_bridge_latch',
        x: -3.9,
        y: -0.2,
        width: 0.95,
        requiresWeight: false,
        wireTo: { x: -1.1, y: 0.9 },
        winMessage: 'SMALL VICTORY · Cathedral Bridge Raised',
        label: 'Raise Cathedral Bridge',
      },
      {
        id: 'l8_gate_switch',
        x: 3.6,
        y: 1.15,
        width: 1.2,
        requiresWeight: true,
        wireTo: { x: 10.6, y: 3.0 },
        label: 'Weight Plate (Shed Husk [R])',
      },
    ],
    ghost: {
      id: 'l8_ghost',
      x: 12.1,
      y: 2.85,
      isTruth: true,
      hintText:
        '"Leap over the front stone before the mirror—then look into the glass and remember who we were."',
      recommendedAction: 'WAIT',
    },
    signs: [
      {
        id: 'l8_sign',
        x: -11.6,
        y: 0,
        initialText: 'Your first life never left this room.',
      },
      {
        id: 'l8_plate_sign',
        x: 2.7,
        y: 1.15,
        initialText: 'Anchor at the lantern, then shed one vessel [R] onto the plate.',
      },
    ],
    presetHusks: [
      {
        type: HuskType.ORIGINAL,
        x: -9.8,
        y: 0.72,
        width: 0.76,
        height: 1.44,
        facing: 1,
        causeOfDeath: 'First Life',
        maxLifetimeSec: 999,
        frames: Array.from({ length: 150 }, (_, i) => ({
          x: -9.8 + i * 0.13,
          y: i < 30 ? 0.72 : i < 70 ? 1.2 : i < 110 ? 1.85 : 2.35,
          vx: 2.2,
          vy: 0,
          facing: 1 as const,
        })),
        isSynthetic: true,
      },
    ],
    clearedMemory: {
      id: 'mem_8',
      index: 8,
      chamberIndex: 7,
      eraLabel: 'Past-Life Memory · Final Awakening',
      fragmentSummary: 'The Architect Reborn',
      loreBody:
        'Every fragment of your forgotten life converges: you were the Architect of Rebirths, the Devil’s voice, and the Ghost’s grief.',
      lingeringEcho:
        'Now decide whether this rebirth breaks the machine or rules it.',
    },
  },
];
