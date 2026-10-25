import React, { useEffect, useState } from 'react';
import { AlertTriangle, Eye } from 'lucide-react';
import {
  EndingType,
  GameSettings,
  MemoryFragmentDef,
  PlayerTelemetry,
} from '../types/game';
import {
  buildMirrorTwistLines,
  ENDING_SCRIPTS,
  INTRO_LINES,
} from '../game/storyData';
import { soundEngine } from '../audio/soundEngine';

/* ============================================================================
   0. ONE-TIME OPENING TRIGGER WARNING & SURVEILLANCE CONSENT GATE
   ============================================================================ */
export const ConsentGateOverlay: React.FC<{
  onAcceptConsent: (timestampStr: string) => void;
}> = ({ onAcceptConsent }) => {
  const [checked, setChecked] = useState(false);
  const [declined, setDeclined] = useState(false);

  if (declined) {
    return (
      <div className="fixed inset-0 z-50 bg-[#08070b]/96 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#121018] border border-[#ebe6dc]/18 rounded-lg p-8 text-center space-y-5 shadow-2xl">
          <div className="text-xs font-mono text-[#ebe6dc]/60">OBSERVATION DECLINED</div>
          <h2 className="font-display text-2xl text-[#f7f3eb]">You Stepped Away From the Gate</h2>
          <p className="text-sm text-[#ebe6dc]/75 leading-relaxed">
            No behavioral inputs, keystroke intervals, or habits are being monitored. The House remains shuttered unless you choose to enter on its terms.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setDeclined(false)}
              className="px-5 py-2.5 text-xs font-semibold text-[#ebe6dc] bg-[#1c1826] border border-[#ebe6dc]/25 hover:border-[#ebe6dc]/50 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
            >
              Review Warning &amp; Consent Terms
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleConfirm = () => {
    if (!checked) return;
    soundEngine.unlock();
    const stamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    onAcceptConsent(stamp);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#08070b]/94 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="max-w-2xl w-full bg-[#120f18] border border-[#c89d54]/45 rounded-lg p-6 sm:p-8 space-y-6 shadow-2xl my-auto">
        <div className="flex items-center justify-between gap-3 border-b border-[#ebe6dc]/12 pb-4">
          <div className="flex items-center gap-2.5 text-[#f59e0b]">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="text-xs font-mono font-semibold tracking-wider">
              ONE-TIME CONTENT &amp; BEHAVIORAL SURVEILLANCE WARNING
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#ebe6dc]/55">
            <Eye className="w-4 h-4 text-[#d97706]" />
            <span>Local Session Only</span>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="font-display text-2xl sm:text-3xl text-[#f7f3eb] text-balance">
            Before You Wake: The House Watches How You Play
          </h1>
          <p className="text-sm text-[#ebe6dc]/80 leading-relaxed">
            <strong>Déjà Doom</strong> is a psychological horror platformer about rebirth, forgotten identity, and active behavioral profiling. Proceed only if you are comfortable with what is watched:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          <div className="bg-[#181421] border border-[#ebe6dc]/12 rounded-md p-4 space-y-1.5">
            <div className="font-mono font-semibold text-[#fbbf24]">1. Frustration &amp; Keystroke Cadence</div>
            <p className="text-[#ebe6dc]/75 leading-relaxed">
              Millisecond intervals between key presses, button-mashing bursts, and instant retries are tracked—and higher frustration dynamically spawns extra traps along your path.
            </p>
          </div>

          <div className="bg-[#181421] border border-[#ebe6dc]/12 rounded-md p-4 space-y-1.5">
            <div className="font-mono font-semibold text-[#fbbf24]">2. Habits, Hesitation &amp; Speech</div>
            <p className="text-[#ebe6dc]/75 leading-relaxed">
              Ledge pauses, jump patterns, route choices, and anything you say to the Devil are cross-checked against how your hands actually behave.
            </p>
          </div>

          <div className="bg-[#181421] border border-[#ebe6dc]/12 rounded-md p-4 space-y-1.5">
            <div className="font-mono font-semibold text-[#fbbf24]">3. Unmarked Psychological Deception</div>
            <p className="text-[#ebe6dc]/75 leading-relaxed">
              Levels have no titles or warnings—expect misleading progress bars, ambiguous spectral hints, false relief, and shifting UI menus.
            </p>
          </div>

          <div className="bg-[#181421] border border-[#ebe6dc]/12 rounded-md p-4 space-y-1.5">
            <div className="font-mono font-semibold text-[#cbd5e1]">4. Strictly In-Browser Privacy</div>
            <p className="text-[#ebe6dc]/75 leading-relaxed">
              Zero webcam, microphone, or external server tracking is used. Once you consent here, you will not be asked again.
            </p>
          </div>
        </div>

        <label className="flex items-start gap-3 p-3.5 bg-[#191522] border border-[#c89d54]/30 rounded-md cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-[#d97706] cursor-pointer shrink-0"
          />
          <span className="text-xs sm:text-sm text-[#ebe6dc]/90 leading-snug">
            I understand what behaviors are being watched against me and explicitly consent to enter.
          </span>
        </label>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={() => setDeclined(true)}
            className="px-4 py-2.5 text-xs font-medium text-[#ebe6dc]/70 bg-[#181420] border border-[#ebe6dc]/15 hover:border-[#ebe6dc]/35 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
          >
            Decline &amp; Step Away
          </button>

          <button
            type="button"
            disabled={!checked}
            onClick={handleConfirm}
            className={`px-6 py-2.5 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              checked
                ? 'bg-[#ebe6dc] text-[#0b0a0d] hover:bg-white cursor-pointer'
                : 'bg-[#262230] text-[#ebe6dc]/35 cursor-not-allowed'
            }`}
          >
            I Consent — Enter the House
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   1. SHORT SKIPPABLE REBIRTH INTRO
   ============================================================================ */
export const IntroOverlay: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (step < INTRO_LINES.length - 1) {
        setStep((s) => s + 1);
      } else {
        onFinish();
      }
    }, 1600);
    return () => clearTimeout(timer);
  }, [step, onFinish]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') {
        e.preventDefault();
        onFinish();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onFinish]);

  return (
    <div
      onClick={onFinish}
      className="fixed inset-0 z-30 bg-[#09080c]/95 flex flex-col items-center justify-center p-8 cursor-pointer"
    >
      <div className="max-w-lg text-center space-y-5">
        {INTRO_LINES.slice(0, step + 1).map((line, idx) => (
          <p
            key={line}
            className={`font-display text-xl md:text-2xl tracking-wide transition-opacity duration-300 ${
              idx === step ? 'text-[#ebe6dc]' : 'text-[#ebe6dc]/50'
            }`}
          >
            {line}
          </p>
        ))}
      </div>
      <span className="fixed bottom-8 text-xs font-mono text-[#ebe6dc]/45">
        Click or press Space to wake in Level 1
      </span>
    </div>
  );
};

/* ============================================================================
   2. POST-LEVEL PAST-LIFE MEMORY RECOVERY (No Total-Level Spoilers!)
   ============================================================================ */
export const ChamberClearedMemoryOverlay: React.FC<{
  levelNumber: number;
  memory: MemoryFragmentDef;
  onProceedNextChamber: () => void;
}> = ({ levelNumber, memory, onProceedNextChamber }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') {
        e.preventDefault();
        onProceedNextChamber();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onProceedNextChamber]);

  return (
    <div className="fixed inset-0 z-30 bg-[#09080c]/92 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-[#131019] border border-[#c89d54]/50 rounded-lg p-7 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between text-xs font-mono text-[#c89d54]">
          <span>LEVEL {levelNumber} COMPLETED</span>
          <span>{memory.eraLabel}</span>
        </div>

        <div className="space-y-1">
          <div className="text-xs font-mono text-[#ebe6dc]/55">Recovered From Before Your Rebirth</div>
          <h2 className="font-display text-xl md:text-2xl text-[#f7f3eb] leading-snug text-balance">
            {memory.fragmentSummary}
          </h2>
        </div>

        <p className="text-sm text-[#ebe6dc]/85 leading-relaxed">{memory.loreBody}</p>

        <div className="pt-3 border-t border-[#ebe6dc]/12 text-xs font-mono text-[#f59e0b]/90">
          {memory.lingeringEcho}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onProceedNextChamber}
            className="px-5 py-2.5 text-xs font-semibold text-[#0b0a0d] bg-[#ebe6dc] hover:bg-white rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Continue to Next Level [Space]
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   3. UNMARKED FAKE COMPLETION SCREEN (Zero "False" Labels Until Floor Drops!)
   ============================================================================ */
export const FakeWinOverlay: React.FC<{
  onFellForFakeButton: () => void;
  onRevealTruth: () => void;
}> = ({ onFellForFakeButton, onRevealTruth }) => {
  const [stage, setStage] = useState<'CELEBRATE' | 'DODGED' | 'SHATTERED'>('CELEBRATE');

  const handleTrophyAttempt = () => {
    soundEngine.playUIGlitchTick();
    onFellForFakeButton();
    if (stage === 'CELEBRATE') {
      setStage('DODGED');
    } else {
      setStage('SHATTERED');
    }
  };

  return (
    <div className="fixed inset-0 z-30 bg-[#09080c]/94 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#14121b] border border-[#d4af37]/50 rounded-lg p-7 text-center space-y-5 shadow-2xl">
        {stage !== 'SHATTERED' ? (
          <>
            <div className="text-xs font-mono text-[#fbbf24]">PROGRESS: 100.0%</div>
            <h2 className="font-display text-3xl text-[#f7f3eb]">You Escaped</h2>
            <p className="text-sm text-[#ebe6dc]/80 leading-relaxed">
              Your trial is complete. Step forward to leave the House and enter your new life.
            </p>

            <div
              className={`pt-3 flex justify-center transition-transform duration-150 ${
                stage === 'DODGED' ? 'translate-x-14' : 'translate-x-0'
              }`}
            >
              <button
                type="button"
                onClick={handleTrophyAttempt}
                className="px-6 py-2.5 text-xs font-semibold text-[#0b0a0d] bg-[#fbbf24] hover:bg-[#fde68a] rounded-md whitespace-nowrap shrink-0 cursor-pointer"
              >
                {stage === 'DODGED' ? 'Step Outside' : 'Leave the House'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-xs font-mono text-[#f87171]">THE FLOORBOARDS GIVE WAY</div>
            <h2 className="font-display text-2xl text-[#fca5a5] text-balance">
              &ldquo;You still don’t even know who you were before you died.&rdquo;
            </h2>
            <p className="text-sm text-[#ebe6dc]/80 leading-relaxed">
              The Devil’s laughter echoes through the shaft as the stage collapses beneath your boots—pulling you deeper toward the memory you buried.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onRevealTruth}
                className="px-6 py-2.5 text-xs font-semibold text-[#0b0a0d] bg-[#ebe6dc] hover:bg-white rounded-md whitespace-nowrap shrink-0 cursor-pointer"
              >
                Recover Memory &amp; Descend
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
   4. PAUSE MENU (Never Sends Player to Consent Screen!)
   ============================================================================ */
export const PauseOverlay: React.FC<{
  rageIndex: number;
  buttonOrderSeed: number;
  onResume: () => void;
  onRestartChamber: () => void;
  onOpenSettings: () => void;
  onReturnToTitle: () => void;
  onMisclickShuffled: () => void;
}> = ({
  rageIndex,
  buttonOrderSeed,
  onResume,
  onRestartChamber,
  onOpenSettings,
  onReturnToTitle,
  onMisclickShuffled,
}) => {
  const isShuffled = rageIndex >= 36 && buttonOrderSeed % 2 === 1;

  const actions = isShuffled
    ? [
        {
          label: 'Settings',
          onClick: () => {
            onMisclickShuffled();
            onOpenSettings();
          },
          primary: false,
        },
        { label: 'Restart Level', onClick: onRestartChamber, primary: false },
        { label: 'Resume Game', onClick: onResume, primary: true },
        { label: 'Return to Title', onClick: onReturnToTitle, primary: false },
      ]
    : [
        { label: 'Resume Game', onClick: onResume, primary: true },
        { label: 'Restart Level', onClick: onRestartChamber, primary: false },
        { label: 'Settings', onClick: onOpenSettings, primary: false },
        { label: 'Return to Title', onClick: onReturnToTitle, primary: false },
      ];

  return (
    <div className="fixed inset-0 z-30 bg-[#09080c]/88 flex items-center justify-center p-6">
      <div className="max-w-sm w-full bg-[#131019] border border-[#ebe6dc]/18 rounded-lg p-7 space-y-5 shadow-2xl">
        <div className="space-y-1">
          <h2 className="font-display text-2xl text-[#f7f3eb]">Paused</h2>
          <p className="text-xs text-[#ebe6dc]/60">
            {isShuffled
              ? 'Menu order shifted. Read carefully before clicking.'
              : 'Take a breath—every wire and aperture in the House is waiting.'}
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          {actions.map((act) => (
            <button
              key={act.label}
              type="button"
              onClick={act.onClick}
              className={`w-full px-4 py-2.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                act.primary
                  ? 'bg-[#ebe6dc] text-[#0b0a0d] font-semibold hover:bg-white'
                  : 'bg-[#1b1724] text-[#ebe6dc]/90 border border-[#ebe6dc]/15 hover:border-[#ebe6dc]/40'
              }`}
            >
              {act.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   5. SETTINGS MODAL
   ============================================================================ */
export const SettingsOverlay: React.FC<{
  settings: GameSettings;
  onChange: (next: GameSettings) => void;
  onClose: () => void;
}> = ({ settings, onChange, onClose }) => {
  return (
    <div className="fixed inset-0 z-40 bg-[#09080c]/90 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#131019] border border-[#ebe6dc]/20 rounded-lg p-7 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-[#f7f3eb]">Settings</h2>
          <span className="text-xs font-mono text-[#ebe6dc]/55">Audio &amp; Camera</span>
        </div>

        <div className="space-y-4">
          <label className="block space-y-1.5">
            <div className="flex justify-between text-xs text-[#ebe6dc]/85 font-mono tabular-nums">
              <span>Master Volume</span>
              <span>{Math.round(settings.masterVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.masterVolume}
              onChange={(e) =>
                onChange({ ...settings, masterVolume: parseFloat(e.target.value), muted: false })
              }
              className="w-full accent-[#c89d54] cursor-pointer"
            />
          </label>

          <label className="block space-y-1.5">
            <div className="flex justify-between text-xs text-[#ebe6dc]/85 font-mono tabular-nums">
              <span>Eerie MusicBox &amp; Drone Level</span>
              <span>{Math.round(settings.musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.musicVolume}
              onChange={(e) =>
                onChange({ ...settings, musicVolume: parseFloat(e.target.value), muted: false })
              }
              className="w-full accent-[#c89d54] cursor-pointer"
            />
          </label>

          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-[#ebe6dc]/85">Mute All Audio</span>
            <button
              type="button"
              onClick={() => onChange({ ...settings, muted: !settings.muted })}
              className={`px-3.5 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                settings.muted
                  ? 'bg-[#7f1d1d] border-[#f87171] text-white'
                  : 'bg-[#1b1724] border-[#ebe6dc]/20 text-[#ebe6dc]'
              }`}
            >
              {settings.muted ? 'Muted' : 'Active'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-[#ebe6dc]/85">Subtle 3D Mouse Parallax</span>
            <button
              type="button"
              onClick={() => onChange({ ...settings, cameraParallax: !settings.cameraParallax })}
              className={`px-3.5 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                settings.cameraParallax
                  ? 'bg-[#ebe6dc] border-[#ebe6dc] text-[#0b0a0d] font-semibold'
                  : 'bg-[#1b1724] border-[#ebe6dc]/20 text-[#ebe6dc]'
              }`}
            >
              {settings.cameraParallax ? 'Enabled' : 'Locked'}
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-[#ebe6dc]/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-[#0b0a0d] bg-[#ebe6dc] hover:bg-white rounded-md whitespace-nowrap shrink-0 cursor-pointer"
          >
            Save &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   6. FINAL PAST-LIFE REVELATION & 3 ENDINGS OVERLAY
   ============================================================================ */
export const MirrorEndingChoiceOverlay: React.FC<{
  telemetry: PlayerTelemetry;
  onSelectEnding: (ending: EndingType) => void;
}> = ({ telemetry, onSelectEnding }) => {
  const twistLines = buildMirrorTwistLines(telemetry);
  const [lineIdx, setLineIdx] = useState(0);
  const revealComplete = lineIdx >= twistLines.length - 1;

  return (
    <div className="fixed inset-0 z-30 bg-[#09080c]/95 flex items-center justify-center p-6 overflow-y-auto">
      <div className="max-w-2xl w-full bg-[#131019] border border-[#d4af37]/50 rounded-lg p-7 md:p-9 space-y-6 shadow-2xl my-auto">
        <div className="flex items-center justify-between text-xs font-mono text-[#d4af37]">
          <span>PAST LIFE FULLY RECOVERED</span>
          <span>The Mirror of Rebirth</span>
        </div>

        <h2 className="font-display text-2xl md:text-3xl text-[#f7f3eb] text-balance">
          You Remember Who You Were Before You Died.
        </h2>

        <div className="space-y-3 py-2">
          {twistLines.slice(0, lineIdx + 1).map((item, idx) => (
            <div key={idx} className="text-sm leading-relaxed">
              <span
                className={`font-mono text-xs font-semibold mr-2 ${
                  item.speaker === 'GHOST'
                    ? 'text-[#cbd5e1]'
                    : item.speaker === 'HOUSE'
                      ? 'text-[#fbbf24]'
                      : 'text-[#f87171]'
                }`}
              >
                {item.speaker}:
              </span>
              <span className="text-[#ebe6dc]/90">&ldquo;{item.text}&rdquo;</span>
            </div>
          ))}
        </div>

        {!revealComplete ? (
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setLineIdx(twistLines.length - 1)}
              className="text-xs text-[#ebe6dc]/55 hover:text-[#ebe6dc] cursor-pointer"
            >
              Reveal All
            </button>
            <button
              type="button"
              onClick={() => setLineIdx((i) => i + 1)}
              className="px-5 py-2.5 text-xs font-semibold text-[#0b0a0d] bg-[#ebe6dc] hover:bg-white rounded-md whitespace-nowrap shrink-0 cursor-pointer"
            >
              Remember More
            </button>
          </div>
        ) : (
          <div className="pt-4 border-t border-[#ebe6dc]/15 space-y-3">
            <p className="text-xs font-mono text-[#ebe6dc]/70">
              Now that you know who you were in your former life, choose what becomes of this rebirth:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => onSelectEnding(EndingType.RESET)}
                className="p-4 text-left bg-[#1b1724] border border-[#ebe6dc]/18 hover:border-[#f87171] rounded-md transition-colors space-y-1.5 cursor-pointer"
              >
                <div className="font-display text-sm font-bold text-[#f7f3eb]">
                  Break the Cycle
                </div>
                <p className="text-xs text-[#ebe6dc]/65 leading-snug">
                  Shatter the mirror so no soul—including yours—is ever reborn into this trap again.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onSelectEnding(EndingType.ESCAPE)}
                className="p-4 text-left bg-[#1b1724] border border-[#ebe6dc]/18 hover:border-[#cbd5e1] rounded-md transition-colors space-y-1.5 cursor-pointer"
              >
                <div className="font-display text-sm font-bold text-[#f7f3eb]">
                  Walk Out Whole
                </div>
                <p className="text-xs text-[#ebe6dc]/65 leading-snug">
                  Reclaim the Ghost—your severed conscience—and live this new life differently.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onSelectEnding(EndingType.KEEPER)}
                className="p-4 text-left bg-[#1b1724] border border-[#ebe6dc]/18 hover:border-[#fbbf24] rounded-md transition-colors space-y-1.5 cursor-pointer"
              >
                <div className="font-display text-sm font-bold text-[#f7f3eb]">
                  Become the Devil Again
                </div>
                <p className="text-xs text-[#ebe6dc]/65 leading-snug">
                  Embrace your past life’s work and take the microphone above Level 1.
                </p>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
   7. CINEMATIC ENDING SCENE BEFORE DEBRIEF
   ============================================================================ */
export const EndingSceneOverlay: React.FC<{
  ending: EndingType;
  onProceedToDebrief: () => void;
}> = ({ ending, onProceedToDebrief }) => {
  const script = ENDING_SCRIPTS[ending];

  return (
    <div className="fixed inset-0 z-30 bg-[#09080c]/96 flex items-center justify-center p-6">
      <div className="max-w-xl w-full space-y-6 text-center">
        <div className="text-xs font-mono text-[#c89d54]">{script.kicker}</div>
        <h2 className="font-display text-3xl md:text-4xl text-[#f7f3eb]">{script.title}</h2>

        <div className="space-y-4 text-sm md:text-base text-[#ebe6dc]/85 leading-relaxed text-left bg-[#131019] border border-[#ebe6dc]/12 rounded-lg p-6">
          {script.paragraphs.map((p, idx) => (
            <p key={idx}>{p}</p>
          ))}
        </div>

        <p className="font-display text-sm md:text-base tracking-wide text-[#fbbf24] pt-1">
          {script.finalWhisper}
        </p>

        <div className="pt-3">
          <button
            type="button"
            onClick={onProceedToDebrief}
            className="px-7 py-3 text-sm font-semibold text-[#0b0a0d] bg-[#ebe6dc] hover:bg-white rounded-md whitespace-nowrap shrink-0 cursor-pointer"
          >
            View Past-Life &amp; Behavioral Debrief
          </button>
        </div>
      </div>
    </div>
  );
};
