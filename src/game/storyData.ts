import {
  DevilBluffEffect,
  DevilBluffIntent,
  EndingType,
  PastLifeRole,
  PlayerTelemetry,
  RageState,
} from '../types/game';

export const INTRO_LINES = [
  'Rebirth always wipes the name first.',
  'You do not remember who you were before you died.',
  'Survive a level, and the House will return one piece of your past life.',
];

export function getDevilTauntForDeath(
  deathsInRoom: number,
  totalDeaths: number,
  cause: string,
  rageState: RageState,
  telemetry: PlayerTelemetry
): string {
  if (totalDeaths === 1) {
    return 'First death of this rebirth. Your corpse stays behind—do not stand on it too long, or even your own bones will give out.';
  }
  if (cause === 'Collapsed Husk') {
    return 'You stood on your old corpse until it turned to dust. In your past life, you leaned on others the exact same way.';
  }
  if (cause === 'Cadence Recoil') {
    return `${telemetry.avgKeyIntervalMs}ms between key presses. Your hands are panicking—so the brass deck stepped out of reach.`;
  }
  if (cause === 'Trapdoor Betrayal') {
    return 'You actually relaxed when your boots hit solid stone, didn’t you? Never celebrate two steps early.';
  }
  if (cause === 'Habit Snare') {
    return 'You jumped from that exact floorboard three times in a row. Did you think the House wouldn’t plant iron under your favorite spot?';
  }
  if (cause === 'Frustration Trap') {
    return 'Recognize those extra teeth? Your rising temper raised them straight out of the floorboards.';
  }
  if (cause === 'Habit Crusher') {
    return 'Holding run without breaking stride—or jumping right on cue. Even reborn without a memory, your habits give you away.';
  }
  if (cause === 'Baited Pendulum') {
    return 'Full sprint into a predictive blade. Keep charging blindly and it will catch you every single time.';
  }
  if (deathsInRoom >= 5) {
    return `${deathsInRoom} deaths on this level alone. Feel your shoulders tightening? The floor hears every hurried keystroke.`;
  }
  if (rageState === RageState.ENTERTAINED || rageState === RageState.LOSING_IT) {
    if (telemetry.franticKeyBursts >= 3) {
      return 'Listen to you hammering those keys. Keep losing your cool and I will fill every gap with iron.';
    }
    return 'Your frustration is peaking. Every aperture on the wall already knows where you’ll jump next.';
  }
  const pool = [
    'Another Husk on the floor. Clear the level alive if you want to know who you used to be.',
    'You hesitated at the edge, then jumped anyway. You had that exact flaw before you died.',
    'Got something to say for yourself? Press [C] if you dare speak to me.',
    'Is the Ghost helping you remember, or leading you into spikes? Even I enjoy watching you guess.',
  ];
  return pool[totalDeaths % pool.length];
}

export function getFrustrationTrapTaunt(tier: 1 | 2, cadenceMs: number): string {
  if (tier === 2) {
    return `Temper boiling over (${cadenceMs}ms key cadence). Waking every hidden snare along your path!`;
  }
  return 'I can feel your impatience rising. Let’s wake an extra trap right where frustrated souls rush.';
}

export function getHabitSnareTaunt(): string {
  return 'Same footsteps, same spot on the timber. Growing fresh iron spikes right where you love to step.';
}

/**
 * Evaluates what happens when the player speaks to the Devil ([C]).
 * Notice: No UI text tells the player what these comments mechanically do—
 * the Devil cross-checks their spoken words against their real keystrokes & composure!
 */
export function evaluateDevilCommunication(
  intent: DevilBluffIntent,
  realRage: number,
  cadenceMs: number,
  pokerActive: boolean,
  lastIntent: DevilBluffIntent | null,
  chamberObjectiveHint: string
): {
  fooled: boolean;
  playerLine: string;
  devilReply: string;
  rageDelta: number;
  effect: DevilBluffEffect;
} {
  if (lastIntent === intent && intent !== 'TAUNT') {
    return {
      fooled: false,
      playerLine:
        intent === 'CALM'
          ? 'My hands are steady. Nothing in this room bothers me.'
          : intent === 'AFRAID'
            ? 'Please... I can’t read the timing on these traps.'
            : 'Enough of your tricks—open the door right now!',
      devilReply:
        'You just said that a moment ago. Repeating lines like a cornered liar? Let’s wake more iron in the floorboards.',
      rageDelta: 16,
      effect: 'SPAWN_PUNISH_TRAP',
    };
  }

  switch (intent) {
    case 'CALM': {
      const playerLine = 'My hands are steady. Nothing in this room bothers me.';
      if (pokerActive || cadenceMs >= 240) {
        return {
          fooled: true,
          playerLine,
          devilReply:
            '...Curious. Your pulse actually reads flat on the brass. Fine—stand down, little gears. Let’s see how long that lasts.',
          rageDelta: -30,
          effect: 'RETRACT_RAGE_TRAPS',
        };
      }
      return {
        fooled: false,
        playerLine,
        devilReply: `Steady?! You’re hammering keys every ${cadenceMs}ms! Lying while your hands shake only wakes more iron.`,
        rageDelta: 18,
        effect: 'SPAWN_PUNISH_TRAP',
      };
    }

    case 'AFRAID': {
      const playerLine = 'Please... I can’t read the timing on these traps.';
      if (realRage < 78 || pokerActive) {
        return {
          fooled: true,
          playerLine,
          devilReply:
            'Ha! Finally losing your nerve? Good—take a long, slow look at the steel above you. I want you to dread every inch of it.',
          rageDelta: -10,
          effect: 'SLOW_TRAPS',
        };
      }
      return {
        fooled: false,
        playerLine,
        devilReply:
          'Save the trembling act. That isn’t fear in your keystrokes—that’s pure temper.',
        rageDelta: 12,
        effect: 'SPAWN_PUNISH_TRAP',
      };
    }

    case 'FURIOUS': {
      const playerLine = 'Enough of your tricks—open the door right now!';
      if (pokerActive || (realRage < 52 && cadenceMs >= 235)) {
        return {
          fooled: true,
          playerLine,
          devilReply:
            'Yes! Lose your head and charge right in—my traps are already snapping ahead of you! ...Wait. Why aren’t you running?',
          rageDelta: -14,
          effect: 'PREFIRE_TRAPS',
        };
      }
      return {
        fooled: false,
        playerLine,
        devilReply:
          'Oh, I don’t have to guess—I can feel every furious keystroke from here.',
        rageDelta: 14,
        effect: 'SPAWN_PUNISH_TRAP',
      };
    }

    case 'TAUNT':
    default: {
      const playerLine = 'Whoever built this place left obvious tells.';
      return {
        fooled: true,
        playerLine,
        devilReply: `Careful—arrogance was your sin before you were reborn, too. ${chamberObjectiveHint}`,
        rageDelta: 10,
        effect: 'HINT_NEXT',
      };
    }
  }
}

export function buildMirrorTwistLines(t: PlayerTelemetry) {
  return [
    {
      speaker: 'GHOST' as const,
      text: 'Step closer to the mirror. Look past the cloak—do you finally recognize the eyes staring back?',
    },
    {
      speaker: 'DEVIL' as const,
      text: `Eight levels. ${t.deaths} deaths, ${t.smallWinsClaimed || 0} small victories clung to along the way, and an average ${t.avgKeyIntervalMs}ms keystroke rhythm. Your soul hasn’t changed a bit since your last life.`,
    },
    {
      speaker: 'HOUSE' as const,
      text: `REBIRTH CYCLE COMPLETE. PAST-LIFE IDENTITY CONFIRMED: THE ORIGINAL ARCHITECT (CONSENT LOGGED AT ${t.consentTimestamp}).`,
    },
    {
      speaker: 'GHOST' as const,
      text: 'Before you died, you were obsessed with one ruthless question: if a person is reborn with zero memory of their sins, are they innocent—or will their habits rebuild the exact same cage?',
    },
    {
      speaker: 'DEVIL' as const,
      text: 'So you built this House, recorded YOUR OWN ruthless voice as "the Devil" to needle your flaws, and drank the draught of forgetting so you would wake reborn on Level 1.',
    },
    {
      speaker: 'GHOST' as const,
      text: 'And I was the piece of your past life you tried to cut out—your remorse. Sometimes I warned you, and sometimes I lied to keep you from reaching this mirror and remembering what we did.',
    },
    {
      speaker: 'DEVIL' as const,
      text: 'Every frustration trap that rose from the floor, every copper wire, every word you spoke back to me—you were arguing with who you used to be.',
    },
  ];
}

export const ENDING_SCRIPTS: Record<
  EndingType,
  {
    title: string;
    kicker: string;
    paragraphs: string[];
    finalWhisper: string;
  }
> = {
  [EndingType.RESET]: {
    title: 'Break the Cycle of Rebirth',
    kicker: 'Ending I · Shatter the Loom',
    paragraphs: [
      'You drive your brass lantern straight through your own reflection. Across every level, the watching apertures crack and the hidden frustration snares collapse into scrap.',
      'Every Husk from your forgotten lives dissolves into quiet silver dust. Neither the Devil’s voice nor the Ghost’s grief remains tethered to the walls.',
      'For the first time since your death, nothing is recording who you will become next.',
    ],
    finalWhisper: '"The past life ends here. Do not build another test."',
  },
  [EndingType.ESCAPE]: {
    title: 'Step Into Your New Life Whole',
    kicker: 'Ending II · Reclaimed Soul',
    paragraphs: [
      'You reach toward the mirror and let the Ghost—every ounce of guilt and memory from your former life—step back inside your chest.',
      'Even the Devil falls silent, recognizing the voice of its maker. Heavy iron bolts draw back, revealing cold October starlight beyond the manor.',
      'You remember who you were before you died, and you walk out determined not to repeat them.',
    ],
    finalWhisper: 'YOU REMEMBER YOUR PAST LIFE. THIS ONE IS YOURS TO CHANGE.',
  },
  [EndingType.KEEPER]: {
    title: 'Reclaim the Devil’s Microphone',
    kicker: 'Ending III · Eternal Architect',
    paragraphs: [
      'Now that you remember why you built the House in your past life, you realize the experiment worked too well to abandon.',
      'You take your old chair behind the brass apertures, watching Level 1 below—ready to needle, test, and study the next reborn soul who wakes without a name.',
      'On the cold floorboards of Level 1, a lantern flickers awake.',
    ],
    finalWhisper: '"Let’s see what their hands remember when they start getting frustrated."',
  },
};

export function diagnosePastLifeRole(t: PlayerTelemetry): {
  role: PastLifeRole;
  summary: string;
} {
  if (t.bluffsSucceeded >= 2 && (t.trapsBaitedSuccessfully >= 1 || t.predictionsDodged >= 1)) {
    return {
      role: PastLifeRole.ESCAPE_ARTIST,
      summary:
        'Even stripped of your past-life memories, you misled the Devil in conversation, masked your pulse at critical moments, and turned your own trap mechanisms against the House.',
    };
  }
  if ((t.smallWinsClaimed || 0) >= 8 || t.trapsBaitedSuccessfully >= 2 || t.predictionsDodged >= 3) {
    return {
      role: PastLifeRole.CREATOR,
      summary:
        'Your instincts traced every copper wire, latch, and hidden mechanism—recovering your past life’s engineering before your conscious mind remembered your name.',
    };
  }
  if (t.husksSteppedOn >= 4 || t.husksCollapsedUnderfoot >= 2) {
    return {
      role: PastLifeRole.KEEPER,
      summary:
        'You climbed across the crumbling echoes of your own failed lives, racing against decay to uncover the truth of your rebirth.',
    };
  }
  if (t.rageTrapsSpawned >= 3 || t.franticKeyBursts >= 5 || t.bluffsCaught >= 2) {
    return {
      role: PastLifeRole.BETRAYER,
      summary:
        'Driven by raw urgency and frustration, you triggered the House’s hidden temper snares—proving your past life’s thesis that habits outlive memory.',
    };
  }
  return {
    role: PastLifeRole.WITNESS,
    summary:
      'Patient and observant across every unnamed level, you pieced together all fragments of your forgotten past life without letting the Devil break your composure.',
  };
}
