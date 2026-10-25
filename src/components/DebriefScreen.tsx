import React from 'react';
import { EndingType, PlayerTelemetry } from '../types/game';
import { diagnosePastLifeRole } from '../game/storyData';

interface DebriefScreenProps {
  telemetry: PlayerTelemetry;
  ending: EndingType;
  onPlayAgain: () => void;
  onReturnTitle: () => void;
}

export const DebriefScreen: React.FC<DebriefScreenProps> = ({
  telemetry,
  ending,
  onPlayAgain,
  onReturnTitle,
}) => {
  const diagnosis = diagnosePastLifeRole(telemetry);

  const sortedCauses = Object.entries(telemetry.deathCauses).sort((a, b) => b[1] - a[1]);
  const topFailure =
    sortedCauses.length > 0
      ? `${sortedCauses[0][0]} (${sortedCauses[0][1]}×)`
      : 'Zero Mortal Failures';

  const ghostTrustPct =
    telemetry.ghostEncounters > 0
      ? `${Math.round(
          (telemetry.ghostFollowed /
            Math.max(1, telemetry.ghostFollowed + telemetry.ghostDefied)) *
            100
        )}%`
      : 'Untested';

  const narrativeBullets: string[] = [
    `Across this rebirth, your hands averaged ${telemetry.avgKeyIntervalMs}ms between keystrokes (${telemetry.franticKeyBursts} frantic bursts), waking ${telemetry.rageTrapsSpawned} frustration & habit snare${telemetry.rageTrapsSpawned === 1 ? '' : 's'} (${telemetry.habitSnaresGrown || 0} grown directly under your repeated footsteps).`,
  ];

  if (telemetry.bluffsAttempted > 0) {
    narrativeBullets.push(
      `You spoke directly to the Devil ${telemetry.bluffsAttempted} time${
        telemetry.bluffsAttempted === 1 ? '' : 's'
      }—misleading his sensors ${telemetry.bluffsSucceeded} time${
        telemetry.bluffsSucceeded === 1 ? '' : 's'
      } and getting caught ${telemetry.bluffsCaught} time${
        telemetry.bluffsCaught === 1 ? '' : 's'
      }.`
    );
  } else {
    narrativeBullets.push(
      'You never spoke a word to the Devil [C], letting the House judge you strictly by your raw inputs.'
    );
  }

  if (telemetry.husksDecayed > 0 || telemetry.husksCollapsedUnderfoot > 0) {
    narrativeBullets.push(
      `Echoes of your failed attempts dissolved into dust ${telemetry.husksDecayed} time${
        telemetry.husksDecayed === 1 ? '' : 's'
      } (${telemetry.husksCollapsedUnderfoot} crumbled directly beneath your boots).`
    );
  }

  narrativeBullets.push(
    `You followed the Ghost’s ambiguous whispers ${ghostTrustPct} of the time and pieced together ${telemetry.memoriesCollected.length} of 8 forgotten past-life memories before choosing Ending: ${ending}.`
  );

  const pts =
    telemetry.timeline.length > 1
      ? telemetry.timeline
      : [
          { timeSec: 0, rage: 10, chamberIndex: 0 },
          { timeSec: 60, rage: telemetry.peakRageIndex, chamberIndex: 7 },
        ];
  const maxTime = Math.max(10, pts[pts.length - 1].timeSec);
  const chartW = 680;
  const chartH = 140;
  const polyPoints = pts
    .map((pt, idx) => {
      const x =
        pts.length === 1
          ? 0
          : (Math.max(idx * 2, pt.timeSec) / Math.max(maxTime, pts.length * 2)) * (chartW - 32) +
            16;
      const y = chartH - 18 - (Math.max(0, Math.min(100, pt.rage)) / 100) * (chartH - 34);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="fixed inset-0 z-40 bg-[#0b0a0d] text-[#ebe6dc] overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-10 md:py-14 space-y-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#ebe6dc]/12 pb-6">
          <div className="space-y-2">
            <div className="text-xs font-mono text-[#c89d54]">
              Rebirth &amp; Behavioral Dossier · Past Life Reconstructed
            </div>
            <h1 className="font-display text-3xl md:text-4xl text-[#f7f3eb]">
              Who You Were — And How the House Used You
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onPlayAgain}
              className="px-5 py-2.5 text-xs font-semibold text-[#0b0a0d] bg-[#ebe6dc] hover:bg-white rounded-md whitespace-nowrap shrink-0 cursor-pointer"
            >
              Begin Next Rebirth
            </button>
            <button
              type="button"
              onClick={onReturnTitle}
              className="px-4 py-2.5 text-xs font-medium text-[#ebe6dc]/85 bg-[#16131d] border border-[#ebe6dc]/18 hover:border-[#ebe6dc]/40 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
            >
              Return to Title
            </button>
          </div>
        </header>

        <section className="bg-[#131019] border border-[#c89d54]/35 rounded-lg p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-mono text-[#c89d54]">Recovered Past-Life Identity</div>
            <h2 className="font-display text-2xl md:text-3xl text-[#f7f3eb]">{diagnosis.role}</h2>
            <p className="text-sm text-[#ebe6dc]/80 leading-relaxed">{diagnosis.summary}</p>
          </div>

          <div className="shrink-0 text-left md:text-right font-mono tabular-nums space-y-1">
            <div className="text-xs text-[#ebe6dc]/55">Peak Frustration Index</div>
            <div className="text-3xl font-bold text-[#f87171]">{telemetry.peakRageIndex} / 100</div>
            <div className="text-[11px] text-[#ebe6dc]/50">
              Devil Fooled: {telemetry.bluffsSucceeded}×
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#f7f3eb]">
              01. Frustration, Bluffs &amp; Adaptation Timeline
            </h3>
            <span className="text-xs font-mono text-[#ebe6dc]/55 tabular-nums">
              {pts.length} behavioral checkpoints logged
            </span>
          </div>

          <div className="bg-[#131019] border border-[#ebe6dc]/12 rounded-lg p-5">
            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              className="w-full h-36 overflow-visible"
              role="img"
              aria-label="Rage Index timeline chart"
            >
              <line
                x1="16"
                y1="16"
                x2={chartW - 16}
                y2="16"
                stroke="rgba(235,230,220,0.08)"
                strokeDasharray="3 3"
              />
              <line
                x1="16"
                y1={chartH / 2}
                x2={chartW - 16}
                y2={chartH / 2}
                stroke="rgba(235,230,220,0.08)"
                strokeDasharray="3 3"
              />
              <line
                x1="16"
                y1={chartH - 18}
                x2={chartW - 16}
                y2={chartH - 18}
                stroke="rgba(235,230,220,0.16)"
              />

              <polyline fill="none" stroke="#d97706" strokeWidth="2.2" points={polyPoints} />

              {pts.map((pt, idx) => {
                if (!pt.event) return null;
                const cx =
                  pts.length === 1
                    ? 16
                    : (Math.max(idx * 2, pt.timeSec) / Math.max(maxTime, pts.length * 2)) *
                        (chartW - 32) +
                      16;
                const cy =
                  chartH - 18 - (Math.max(0, Math.min(100, pt.rage)) / 100) * (chartH - 34);
                return (
                  <circle
                    key={idx}
                    cx={cx}
                    cy={cy}
                    r="3.5"
                    fill={
                      pt.event.startsWith('Died')
                        ? '#ef4444'
                        : pt.event.startsWith('Fooled')
                          ? '#34d399'
                          : '#fde68a'
                    }
                  >
                    <title>{`${pt.timeSec}s · Rage ${pt.rage}: ${pt.event}`}</title>
                  </circle>
                );
              })}
            </svg>
            <div className="flex items-center justify-between text-[11px] font-mono text-[#ebe6dc]/50 pt-2">
              <span>Level 1 Awakening</span>
              <span>Crimson = Deaths · Emerald = Fooled Devil · Gold = Memories</span>
              <span>The Mirror</span>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-base font-semibold text-[#f7f3eb]">
            02. Recorded Behavioral &amp; Bluff Telemetry
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Deaths', value: String(telemetry.deaths) },
              { label: 'Avg Key Cadence', value: `${telemetry.avgKeyIntervalMs} ms` },
              { label: 'Frustration & Habit Snares', value: `${telemetry.rageTrapsSpawned} (${telemetry.habitSnaresGrown || 0} footprint)` },
              {
                label: 'Devil Bluffs (Fooled / Caught)',
                value: `${telemetry.bluffsSucceeded} / ${telemetry.bluffsCaught}`,
              },
              {
                label: 'Husks Dissolved',
                value: `${telemetry.husksDecayed} (${telemetry.husksCollapsedUnderfoot} underfoot)`,
              },
              { label: 'Predicted Moves Punished', value: String(telemetry.predictedMovesPunished) },
              {
                label: 'Small Victories Claimed',
                value: String(telemetry.smallWinsClaimed || 0),
              },
              { label: 'Poker Face Dodges', value: `${telemetry.predictionsDodged} dodged` },
              { label: 'Top Repeated Hazard', value: topFailure },
              { label: 'Pre-Death Habit', value: telemetry.mostCommonPreDeathAction },
              { label: 'Ghost Compliance', value: ghostTrustPct },
              { label: 'Past-Life Memories', value: `${telemetry.memoriesCollected.length} / 8` },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-[#131019] border border-[#ebe6dc]/10 rounded-md p-4 space-y-1"
              >
                <div className="text-xs text-[#ebe6dc]/55">{stat.label}</div>
                <div
                  className="text-base font-semibold font-mono tabular-nums text-[#f7f3eb] truncate"
                  title={stat.value}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-base font-semibold text-[#f7f3eb]">
            03. How the House Adapted to Your Rebirth
          </h3>
          <div className="bg-[#131019] border border-[#ebe6dc]/12 rounded-lg p-6 space-y-2.5">
            {narrativeBullets.map((line, i) => (
              <p key={i} className="text-sm text-[#ebe6dc]/85 leading-relaxed">
                {i + 1}. {line}
              </p>
            ))}
          </div>
        </section>

        <footer className="pt-4 pb-8 border-t border-[#ebe6dc]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="font-display text-sm tracking-wide text-[#c89d54]">
            YOUR FORGOTTEN LIFE IS RESTORED · THIS REBIRTH BELONGS TO YOU.
          </div>
          <div className="text-xs text-[#ebe6dc]/50">
            100% local in-browser telemetry · No external data transmitted
          </div>
        </footer>
      </div>
    </div>
  );
};
