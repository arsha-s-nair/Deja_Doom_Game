import React, { useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface TitleScreenProps {
  hasSavedGame: boolean;
  savedLevelNumber?: number;
  hasResetHouseBefore: boolean;
  totalLoops: number;
  muted: boolean;
  onStartNew: () => void;
  onContinue: () => void;
  onOpenSettings: () => void;
  onToggleMute: () => void;
  onWipeMemory: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  hasSavedGame,
  savedLevelNumber,
  hasResetHouseBefore,
  totalLoops,
  muted,
  onStartNew,
  onContinue,
  onOpenSettings,
  onToggleMute,
  onWipeMemory,
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        if (hasSavedGame) {
          onContinue();
        } else {
          onStartNew();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hasSavedGame, onContinue, onStartNew]);

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-between p-6 md:p-12 pointer-events-none">
      <div className="fixed inset-0 -z-10 pointer-events-none title-scrim" />

      <div className="flex items-center justify-between w-full max-w-6xl mx-auto pointer-events-auto">
        <div className="flex items-center gap-2 text-xs tracking-wide text-[#ebe6dc]/65">
          <span>Psychological Horror Platformer</span>
          <span aria-hidden="true">·</span>
          <span>Rebirth &amp; Behavioral Memory</span>
          {totalLoops > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums text-[#d97706]">Past Rebirths: {totalLoops}</span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleMute}
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#ebe6dc]/85 bg-[#141219]/90 border border-[#ebe6dc]/15 rounded-md hover:border-[#ebe6dc]/35 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {muted ? (
            <VolumeX className="w-4 h-4 text-[#ef4444]" />
          ) : (
            <Volume2 className="w-4 h-4 text-[#d97706]" />
          )}
          <span>{muted ? 'Unmute Audio' : 'Eerie Audio On'}</span>
        </button>
      </div>

      <div className="w-full max-w-6xl mx-auto my-auto pointer-events-auto">
        <div className="max-w-xl space-y-6">
          <div className="space-y-3">
            <svg
              viewBox="0 0 560 118"
              className="w-full max-w-[500px] h-auto overflow-visible"
              role="img"
              aria-label="Deja Doom: The Last Life"
            >
              <defs>
                <linearGradient id="ivoryGoldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f7f3eb" />
                  <stop offset="68%" stopColor="#d8cebe" />
                  <stop offset="100%" stopColor="#9c8970" />
                </linearGradient>
              </defs>
              <line x1="2" y1="14" x2="168" y2="14" stroke="#b08a54" strokeWidth="1" strokeOpacity="0.55" />
              <polygon points="178,14 184,10 190,14 184,18" fill="#b08a54" fillOpacity="0.75" />
              <line x1="200" y1="14" x2="366" y2="14" stroke="#b08a54" strokeWidth="1" strokeOpacity="0.55" />

              <text
                x="0"
                y="74"
                fill="url(#ivoryGoldGrad)"
                fontFamily="Cinzel, Georgia, serif"
                fontWeight="700"
                fontSize="62"
                letterSpacing="5"
              >
                DÉJÀ DOOM
              </text>
              <text
                x="4"
                y="106"
                fill="#c29d61"
                fontFamily="Cinzel, Georgia, serif"
                fontWeight="500"
                fontSize="18"
                letterSpacing="7.5"
              >
                THE LAST LIFE
              </text>
            </svg>

            <p className="text-base md:text-lg text-[#ebe6dc]/80 leading-relaxed max-w-md text-balance">
              You woke reborn inside this House with no memory of who you used to be. Survive each level to uncover your forgotten life—before your own habits turn every room against you.
            </p>

            {hasResetHouseBefore && (
              <p className="text-xs font-mono text-[#d97706]/90">
                &ldquo;Even after shattering the mirror, another rebirth begins.&rdquo;
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {hasSavedGame ? (
              <>
                <button
                  type="button"
                  onClick={onContinue}
                  className="px-6 py-3 text-sm font-semibold text-[#0b0a0d] bg-[#ebe6dc] hover:bg-white rounded-md transition-transform active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Continue (Level {savedLevelNumber || 1})
                </button>
                <button
                  type="button"
                  onClick={onStartNew}
                  className="px-5 py-3 text-sm font-medium text-[#ebe6dc] bg-[#17141d]/95 border border-[#ebe6dc]/20 hover:border-[#ebe6dc]/45 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  New Rebirth
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onStartNew}
                className="px-7 py-3.5 text-sm font-semibold text-[#0b0a0d] bg-[#ebe6dc] hover:bg-white rounded-md transition-transform active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer"
              >
                Wake Up in Level 1
              </button>
            )}

            <button
              type="button"
              onClick={onOpenSettings}
              className="px-5 py-3 text-sm font-medium text-[#ebe6dc]/85 bg-[#17141d]/90 border border-[#ebe6dc]/15 hover:border-[#ebe6dc]/35 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Settings
            </button>

            {(hasSavedGame || hasResetHouseBefore || totalLoops > 0) && (
              <button
                type="button"
                onClick={onWipeMemory}
                className="px-4 py-3 text-xs font-medium text-[#ebe6dc]/60 hover:text-[#f87171] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Wipe Past Lives
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full max-w-6xl mx-auto text-xs text-[#ebe6dc]/60 pointer-events-auto border-t border-[#ebe6dc]/10 pt-4">
        <div className="font-mono tracking-tight">
          A / D Move · Space Jump · E Interact · C Speak · Shift Poker Face · R Shed Husk · Esc Pause
        </div>
        <div>
          Press Enter or Space to begin
        </div>
      </div>
    </div>
  );
};
