import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Eye, MessageSquare, Volume2, VolumeX } from 'lucide-react';
import {
  DevilBluffIntent,
  DialogueLine,
  RageState,
  UIMutationState,
} from '../types/game';

interface GameHUDProps {
  memoriesCount: number;
  deathsCount: number;
  rageIndex: number;
  rageState: RageState;
  pokerEnergy: number;
  pokerActive: boolean;
  uiMutation: UIMutationState;
  activeDialogue: DialogueLine | null;
  nearbyPrompt: string | null;
  deathBanner: string | null;
  winBanner: string | null;
  muted: boolean;
  onTriggerInteract: () => void;
  onTriggerShedHusk: () => void;
  onSetPokerHeld: (held: boolean) => void;
  onCommunicateWithDevil: (intent: DevilBluffIntent) => void;
  onClickTemptation: () => void;
  onDismissTemptation: () => void;
  onToggleMute: () => void;
  onOpenPause: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  memoriesCount,
  deathsCount,
  rageIndex,
  rageState,
  pokerEnergy,
  pokerActive,
  uiMutation,
  activeDialogue,
  nearbyPrompt,
  deathBanner,
  winBanner,
  muted,
  onTriggerInteract,
  onTriggerShedHusk,
  onSetPokerHeld,
  onCommunicateWithDevil,
  onClickTemptation,
  onDismissTemptation,
  onToggleMute,
  onOpenPause,
}) => {
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [bluffMenuOpen, setBluffMenuOpen] = useState(false);

  const canBluff = uiMutation.bluffCooldownSec <= 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyH') {
        setDockCollapsed((prev) => !prev);
      } else if (e.code === 'KeyM') {
        onToggleMute();
      } else if (e.code === 'KeyC') {
        setBluffMenuOpen((prev) => !prev);
      } else if (bluffMenuOpen && canBluff) {
        if (e.code === 'Digit1') {
          onCommunicateWithDevil('CALM');
          setBluffMenuOpen(false);
        } else if (e.code === 'Digit2') {
          onCommunicateWithDevil('AFRAID');
          setBluffMenuOpen(false);
        } else if (e.code === 'Digit3') {
          onCommunicateWithDevil('FURIOUS');
          setBluffMenuOpen(false);
        } else if (e.code === 'Digit4') {
          onCommunicateWithDevil('TAUNT');
          setBluffMenuOpen(false);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [bluffMenuOpen, canBluff, onCommunicateWithDevil, onToggleMute]);

  const clampedBarWidth = Math.max(2, Math.min(100, uiMutation.displayedProgress));
  const barUnits = clampedBarWidth * 10;
  const barX = uiMutation.progressInverted ? 1000 - barUnits : 0;
  const barFill = pokerActive
    ? '#a855f7'
    : uiMutation.progressInverted
      ? '#ef4444'
      : '#c89d54';

  const speakerStyles: Record<DialogueLine['speaker'], { name: string; color: string }> = {
    DEVIL: { name: 'The Devil', color: 'text-[#f87171]' },
    GHOST: { name: 'The Ghost', color: 'text-[#cbd5e1]' },
    HOUSE: { name: 'The House', color: 'text-[#fbbf24]' },
    PLAYER: { name: 'You', color: 'text-[#a7f3d0]' },
  };

  const handlePickBluff = (intent: DevilBluffIntent) => {
    if (!canBluff) return;
    onCommunicateWithDevil(intent);
    setBluffMenuOpen(false);
    window.focus();
  };

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between">
      <div
        className={`fixed inset-0 -z-10 transition-opacity duration-200 pointer-events-none ${
          pokerActive ? 'poker-vignette' : 'horror-vignette'
        }`}
      />

      {/* TOP PERIMETER: Unlabelled Misleading Progress Bar + Pure Level Number */}
      <div className="w-full px-4 pt-3 md:px-8 md:pt-4 space-y-2.5">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between text-[11px] text-[#ebe6dc]/75 mb-1 font-mono tabular-nums">
            <span>Progress</span>
            <span className={uiMutation.displayedProgress >= 99 ? 'text-[#fbbf24]' : 'text-[#ebe6dc]'}>
              {uiMutation.displayedProgress.toFixed(1)}%
            </span>
          </div>
          <svg
            viewBox="0 0 1000 8"
            preserveAspectRatio="none"
            className="w-full h-1.5 bg-[#1a1721] border border-[#ebe6dc]/12 rounded-sm overflow-hidden block"
            aria-hidden="true"
          >
            <rect x={barX} y={0} width={barUnits} height={8} fill={barFill} />
          </svg>
        </div>

        {/* Pure Level Number ONLY (Zero level titles, zero total-level spoilers!) */}
        <div
          className={`max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4 ${
            uiMutation.hudSwappedCorners ? 'sm:flex-row-reverse' : 'sm:flex-row'
          }`}
        >
          <div className="text-sm font-display font-bold tracking-wider text-[#f7f3eb] tabular-nums">
            {uiMutation.displayedLevelNumber}
          </div>

          <div className="flex flex-col sm:items-end gap-0.5 font-mono tabular-nums">
            <div className="flex items-center gap-2.5 text-xs text-[#ebe6dc]/80">
              <span>
                {uiMutation.deathsLabel}: {deathsCount}
              </span>
              <span aria-hidden="true">·</span>
              <span>Past-Life Memories: {memoriesCount}</span>
              <span aria-hidden="true">·</span>
              <span
                className={
                  pokerActive
                    ? 'text-[#c084fc]'
                    : rageIndex >= 60
                      ? 'text-[#f87171]'
                      : rageIndex >= 38
                        ? 'text-[#fbbf24]'
                        : 'text-[#ebe6dc]/80'
                }
              >
                Devil Read: {pokerActive ? 'MASKED' : `${rageState} (${rageIndex})`}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-[#d97706]/90">
              <Eye className="w-3.5 h-3.5 shrink-0" />
              <span>{uiMutation.liveObservation}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CENTER-UPPER SMALL VICTORY / DEATH / INTERACT BANNERS */}
      <div className="mx-auto my-auto flex flex-col items-center gap-3 px-4 text-center">
        {deathBanner ? (
          <div className="px-5 py-2.5 bg-[#120e16]/95 border border-[#dc2626]/40 rounded-md shadow-lg">
            <p className="font-display text-sm tracking-wider text-[#fca5a5]">{deathBanner}</p>
          </div>
        ) : winBanner ? (
          <div className="px-5 py-2.5 bg-[#101815]/95 border border-[#34d399]/45 rounded-md shadow-lg">
            <p className="font-display text-sm tracking-wider text-[#a7f3d0]">{winBanner}</p>
          </div>
        ) : null}

        {nearbyPrompt && (
          <button
            type="button"
            onClick={onTriggerInteract}
            className="pointer-events-auto px-4 py-1.5 bg-[#15121c]/95 border border-[#c89d54]/50 rounded-md text-xs font-mono text-[#fef3c7] hover:border-[#fef3c7] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {nearbyPrompt}
          </button>
        )}
      </div>

      {/* BOTTOM ZONE: Devil Communication, Dialogue, & Control Dock */}
      <div className="w-full px-4 pb-4 flex flex-col items-center gap-2.5">
        {uiMutation.temptationToastVisible && (
          <div
            className={`pointer-events-auto flex items-center gap-3 px-4 py-2 bg-[#1a1116]/95 border border-[#dc2626]/40 rounded-md transition-transform duration-150 ${
              uiMutation.temptationDodgedOnce ? 'translate-x-12 sm:translate-x-20' : 'translate-x-0'
            }`}
          >
            <span className="text-xs text-[#ebe6dc]/85">
              {uiMutation.temptationDodgedOnce
                ? 'Button slipped! Click again if you truly want a mercy bridge:'
                : 'Temper rising? The Devil offers a mercy bypass:'}
            </span>
            <button
              type="button"
              onClick={onClickTemptation}
              className="px-3 py-1 text-xs font-semibold text-[#0b0a0d] bg-[#f87171] hover:bg-[#fca5a5] rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {uiMutation.temptationDodgedOnce ? 'Confirm Mercy Bridge' : 'Skip Obstacle'}
            </button>
            <button
              type="button"
              onClick={onDismissTemptation}
              className="px-2 py-1 text-xs text-[#ebe6dc]/60 hover:text-[#ebe6dc] whitespace-nowrap shrink-0 cursor-pointer"
            >
              Refuse
            </button>
          </div>
        )}

        {/* Two-Way Devil Communication ([C]) — Pure Dialogue Lines ONLY, Zero Mechanical Spoilers! */}
        {bluffMenuOpen && (
          <div className="pointer-events-auto max-w-2xl w-full bg-[#130f1a]/96 border border-[#ebe6dc]/22 rounded-md p-3.5 space-y-2.5 shadow-2xl">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#f7f3eb] font-semibold">Speak to the Devil</span>
              <button
                type="button"
                onClick={() => {
                  setBluffMenuOpen(false);
                  window.focus();
                }}
                className="text-[#ebe6dc]/55 hover:text-[#ebe6dc] cursor-pointer"
              >
                Close [C]
              </button>
            </div>

            {!canBluff ? (
              <div className="text-xs font-mono text-[#ebe6dc]/65 py-1">
                The Devil is watching your hands right now... wait {uiMutation.bluffCooldownSec}s.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handlePickBluff('CALM')}
                  className="px-3.5 py-2.5 text-left text-xs font-mono text-[#ebe6dc] bg-[#1c1726] border border-[#ebe6dc]/15 hover:border-[#ebe6dc]/45 rounded transition-colors cursor-pointer"
                >
                  [1] &ldquo;My hands are steady. Nothing in this room bothers me.&rdquo;
                </button>

                <button
                  type="button"
                  onClick={() => handlePickBluff('AFRAID')}
                  className="px-3.5 py-2.5 text-left text-xs font-mono text-[#ebe6dc] bg-[#1c1726] border border-[#ebe6dc]/15 hover:border-[#ebe6dc]/45 rounded transition-colors cursor-pointer"
                >
                  [2] &ldquo;Please... I can’t read the timing on these traps.&rdquo;
                </button>

                <button
                  type="button"
                  onClick={() => handlePickBluff('FURIOUS')}
                  className="px-3.5 py-2.5 text-left text-xs font-mono text-[#ebe6dc] bg-[#1c1726] border border-[#ebe6dc]/15 hover:border-[#ebe6dc]/45 rounded transition-colors cursor-pointer"
                >
                  [3] &ldquo;Enough of your tricks—open the door right now!&rdquo;
                </button>

                <button
                  type="button"
                  onClick={() => handlePickBluff('TAUNT')}
                  className="px-3.5 py-2.5 text-left text-xs font-mono text-[#ebe6dc] bg-[#1c1726] border border-[#ebe6dc]/15 hover:border-[#ebe6dc]/45 rounded transition-colors cursor-pointer"
                >
                  [4] &ldquo;Whoever built this place left obvious tells.&rdquo;
                </button>
              </div>
            )}
          </div>
        )}

        {/* Dialogue Subtitle Box */}
        {activeDialogue && (
          <div className="pointer-events-auto max-w-2xl w-full px-5 py-3 bg-[#100e15]/94 border border-[#ebe6dc]/15 rounded-md">
            <div className="flex items-center justify-between gap-4 mb-1">
              <span
                className={`text-xs font-semibold tracking-wide ${
                  speakerStyles[activeDialogue.speaker].color
                }`}
              >
                {speakerStyles[activeDialogue.speaker].name}
              </span>
              {activeDialogue.speaker === 'DEVIL' && !bluffMenuOpen && (
                <button
                  type="button"
                  onClick={() => setBluffMenuOpen(true)}
                  className="text-[11px] font-mono text-[#fca5a5] hover:text-white underline underline-offset-2 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {canBluff ? 'Reply [C]' : `Wait (${uiMutation.bluffCooldownSec}s)`}
                </button>
              )}
            </div>
            <p className="text-sm text-[#ebe6dc] leading-snug">&ldquo;{activeDialogue.text}&rdquo;</p>
          </div>
        )}

        {/* Collapsible Unified Bottom Control Dock */}
        <div className="pointer-events-auto flex flex-col items-center max-w-[94vw]">
          <button
            type="button"
            onClick={() => setDockCollapsed((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono text-[#ebe6dc]/65 bg-[#121017]/95 border border-b-0 border-[#ebe6dc]/15 rounded-t-md hover:text-[#ebe6dc] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {dockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{dockCollapsed ? 'Show Controls [H]' : 'Hide Controls [H]'}</span>
          </button>

          {!dockCollapsed && (
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 px-4 py-2.5 bg-[#121017]/95 border border-[#ebe6dc]/15 rounded-md shadow-xl">
              <button
                type="button"
                onMouseDown={() => onSetPokerHeld(true)}
                onMouseUp={() => onSetPokerHeld(false)}
                onMouseLeave={() => onSetPokerHeld(false)}
                onTouchStart={() => onSetPokerHeld(true)}
                onTouchEnd={() => onSetPokerHeld(false)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  pokerActive
                    ? 'bg-[#6b21a8] border-[#c084fc] text-white'
                    : 'bg-[#1b1724] border-[#ebe6dc]/15 text-[#ebe6dc]/90 hover:border-[#a855f7]/60'
                }`}
              >
                <span>{uiMutation.pokerLabel} [Shift]</span>
                <span className="font-mono tabular-nums text-[11px] opacity-85">{pokerEnergy}%</span>
              </button>

              <button
                type="button"
                onClick={() => setBluffMenuOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  bluffMenuOpen
                    ? 'bg-[#7f1d1d] border-[#fca5a5] text-white'
                    : 'bg-[#1b1724] border-[#f87171]/35 text-[#fca5a5] hover:border-[#f87171]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>
                  {canBluff
                    ? 'Speak to Devil [C]'
                    : `Devil (${uiMutation.bluffCooldownSec}s)`}
                </span>
              </button>

              <button
                type="button"
                onClick={onTriggerShedHusk}
                className="px-3 py-1.5 text-xs font-medium text-[#ebe6dc]/85 bg-[#1b1724] border border-[#ebe6dc]/15 hover:border-[#ebe6dc]/40 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Shed Husk [R]
              </button>

              <button
                type="button"
                onClick={onToggleMute}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#ebe6dc]/85 bg-[#1b1724] border border-[#ebe6dc]/15 hover:border-[#ebe6dc]/40 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {muted ? (
                  <VolumeX className="w-3.5 h-3.5 text-[#ef4444]" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-[#d97706]" />
                )}
                <span>{muted ? 'Muted [M]' : 'Audio [M]'}</span>
              </button>

              <button
                type="button"
                onClick={onOpenPause}
                className="px-3 py-1.5 text-xs font-medium text-[#ebe6dc]/85 bg-[#1b1724] border border-[#ebe6dc]/15 hover:border-[#ebe6dc]/40 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Pause [Esc]
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
