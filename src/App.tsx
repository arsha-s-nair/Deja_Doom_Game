import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DevilBluffIntent,
  DialogueLine,
  EndingType,
  GameScreen,
  GameSettings,
  HuskEntity,
  MemoryFragmentDef,
  PlayerTelemetry,
  RageState,
  UIMutationState,
} from './types/game';
import { CHAMBERS } from './game/chambers';
import { GameViewport3D, VirtualActions } from './game/GameViewport3D';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import {
  ChamberClearedMemoryOverlay,
  ConsentGateOverlay,
  EndingSceneOverlay,
  FakeWinOverlay,
  IntroOverlay,
  MirrorEndingChoiceOverlay,
  PauseOverlay,
  SettingsOverlay,
} from './components/Overlays';
import { DebriefScreen } from './components/DebriefScreen';
import {
  clearSavedProgress,
  createInitialTelemetry,
  loadMetaMemory,
  loadSavedProgress,
  loadSettings,
  loadSignedConsent,
  saveMetaMemory,
  saveProgress,
  saveSettings,
  saveSignedConsent,
  wipeAllHouseMemory,
} from './utils/storage';
import { soundEngine } from './audio/soundEngine';
import { rageEngine } from './game/rageEngine';

// Subtle, title-free greetings that keep the user guessing what level comes next!
const LEVEL_GREETINGS: Record<number, DialogueLine> = {
  0: {
    id: 'greet_0',
    speaker: 'DEVIL',
    text: 'Awake again? You don’t even remember your own name from your last life. Reach the door—if you want a piece of it back.',
    durationMs: 5200,
  },
  1: {
    id: 'greet_1',
    speaker: 'DEVIL',
    text: 'I can hear how fast you press those keys. Lose your cool, and the House will wake extra iron along your path.',
    durationMs: 5200,
  },
  2: {
    id: 'greet_2',
    speaker: 'DEVIL',
    text: 'Keep moving. Warm light ahead... maybe your penance ends sooner than you think.',
    durationMs: 4800,
  },
  3: {
    id: 'greet_3',
    speaker: 'GHOST',
    text: 'Every room you survive returns something we buried before we died. Do not trust every gift the Devil paints green.',
    durationMs: 5200,
  },
  4: {
    id: 'greet_4',
    speaker: 'DEVIL',
    text: 'You’re getting close to remembering who you were. Let’s see if your hands give you away on the glass.',
    durationMs: 5000,
  },
  5: {
    id: 'greet_5',
    speaker: 'DEVIL',
    text: 'Still wondering how many levels are left? Stop staring at the bar and watch the crimson mist.',
    durationMs: 5000,
  },
  6: {
    id: 'greet_6',
    speaker: 'GHOST',
    text: 'Have we not stood on these exact floorboards before, facing the other way?',
    durationMs: 5200,
  },
  7: {
    id: 'greet_7',
    speaker: 'DEVIL',
    text: 'Look ahead. Your very first life is still walking toward that mirror.',
    durationMs: 5200,
  },
};

const INITIAL_UI_MUTATION: UIMutationState = {
  displayedProgress: 8.0,
  progressInverted: false,
  displayedLevelNumber: 'Level 1',
  hudSwappedCorners: false,
  deathsLabel: 'Deaths',
  pokerLabel: 'Poker Face',
  liveObservation: 'Key cadence: 380ms · Watching stride',
  bluffCooldownSec: 0,
  buttonOrderSeed: 0,
  temptationToastVisible: false,
  temptationDodgedOnce: false,
};

export default function App() {
  // Consent Gate appears ONLY ONCE at the very beginning before signed consent is saved!
  const [consentTimestamp, setConsentTimestamp] = useState<string>(
    () => loadSignedConsent() || ''
  );
  const [screen, setScreen] = useState<GameScreen>(() =>
    loadSignedConsent() ? GameScreen.TITLE : GameScreen.CONSENT_GATE
  );
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [savedSnapshot, setSavedSnapshot] = useState(() => loadSavedProgress());
  const [metaMemory, setMetaMemory] = useState(() => loadMetaMemory());

  const [chamberIndex, setChamberIndex] = useState<number>(0);
  const [husks, setHusks] = useState<HuskEntity[]>([]);
  const [telemetry, setTelemetry] = useState<PlayerTelemetry>(() => createInitialTelemetry());

  const [clearedStageData, setClearedStageData] = useState<{
    levelNumber: number;
    memory: MemoryFragmentDef;
    nextChamberIndex: number;
  } | null>(null);

  const [chosenEnding, setChosenEnding] = useState<EndingType>(EndingType.ESCAPE);

  const [rageIndex, setRageIndex] = useState(12);
  const [rageState, setRageState] = useState<RageState>(RageState.AMUSED);
  const [pokerEnergy, setPokerEnergy] = useState(100);
  const [pokerActive, setPokerActive] = useState(false);
  const [uiMutation, setUiMutation] = useState<UIMutationState>(INITIAL_UI_MUTATION);
  const [nearbyPrompt, setNearbyPrompt] = useState<string | null>(null);
  const [deathBanner, setDeathBanner] = useState<string | null>(null);
  const [winBanner, setWinBanner] = useState<string | null>(null);

  const [activeDialogue, setActiveDialogue] = useState<DialogueLine | null>(null);
  const dialogueTimerRef = useRef<number | null>(null);
  const devilReplyTimerRef = useRef<number | null>(null);

  const virtualActionsRef = useRef<VirtualActions>({
    interactPulse: false,
    shedHuskPulse: false,
    resetRoomPulse: false,
    pokerHeld: false,
    pityActivatedForChamber: null,
    fakeWinCompleted: false,
  });

  useEffect(() => {
    soundEngine.applySettings(settings);
    saveSettings(settings);
  }, [settings]);

  const emitDialogue = useCallback((line: DialogueLine) => {
    if (dialogueTimerRef.current) {
      window.clearTimeout(dialogueTimerRef.current);
    }
    setActiveDialogue(line);
    dialogueTimerRef.current = window.setTimeout(() => {
      setActiveDialogue(null);
    }, line.durationMs ?? 4600);
  }, []);

  const persistCurrentRun = useCallback(
    (nextChamber: number, nextHusks: HuskEntity[], nextTelemetry: PlayerTelemetry) => {
      const snap = {
        currentChamber: nextChamber,
        memoriesCollected: [...nextTelemetry.memoriesCollected],
        telemetry: nextTelemetry,
        husks: nextHusks,
        completedEndings: metaMemory.completedEndings,
        loopCount: metaMemory.totalLoops,
        timestamp: Date.now(),
      };
      saveProgress(snap);
      setSavedSnapshot(snap);
    },
    [metaMemory]
  );

  const handleAcceptConsent = useCallback((stamp: string) => {
    saveSignedConsent(stamp);
    setConsentTimestamp(stamp);
    setTelemetry((prev) => ({ ...prev, consentTimestamp: stamp }));
    setScreen(GameScreen.TITLE);
  }, []);

  const handleStartNew = useCallback(() => {
    soundEngine.unlock();
    rageEngine.resetSession();
    const freshTel = createInitialTelemetry(consentTimestamp || undefined);
    setChamberIndex(0);
    setHusks([]);
    setTelemetry(freshTel);
    setClearedStageData(null);
    virtualActionsRef.current = {
      interactPulse: false,
      shedHuskPulse: false,
      resetRoomPulse: true,
      pokerHeld: false,
      pityActivatedForChamber: null,
      fakeWinCompleted: false,
    };
    clearSavedProgress();
    setSavedSnapshot(null);
    setScreen(GameScreen.INTRO);
  }, [consentTimestamp]);

  const handleContinue = useCallback(() => {
    soundEngine.unlock();
    const snap = loadSavedProgress();
    if (!snap) {
      handleStartNew();
      return;
    }
    rageEngine.resetSession();
    const clampedChamber = Math.min(CHAMBERS.length - 1, Math.max(0, snap.currentChamber));
    const mergedTel: PlayerTelemetry = {
      ...createInitialTelemetry(consentTimestamp || snap.telemetry.consentTimestamp),
      ...snap.telemetry,
      consentTimestamp: consentTimestamp || snap.telemetry.consentTimestamp,
    };
    setChamberIndex(clampedChamber);
    setHusks(snap.husks || []);
    setTelemetry(mergedTel);
    virtualActionsRef.current = {
      interactPulse: false,
      shedHuskPulse: false,
      resetRoomPulse: true,
      pokerHeld: false,
      pityActivatedForChamber: null,
      fakeWinCompleted: clampedChamber > 4,
    };
    setScreen(GameScreen.PLAYING);
    window.focus();
    const greet = LEVEL_GREETINGS[clampedChamber];
    if (greet) emitDialogue(greet);
  }, [consentTimestamp, emitDialogue, handleStartNew]);

  const handleFinishIntro = useCallback(() => {
    soundEngine.unlock();
    setScreen(GameScreen.PLAYING);
    window.focus();
    emitDialogue(LEVEL_GREETINGS[0]);
  }, [emitDialogue]);

  // Interactive Devil Bluff Communication
  const handleCommunicateWithDevil = useCallback(
    (intent: DevilBluffIntent) => {
      const def = CHAMBERS[chamberIndex] || CHAMBERS[0];
      const result = rageEngine.sendBluffToDevil(
        intent,
        def.objectiveHint,
        telemetry,
        chamberIndex
      );
      if (!result) return;

      soundEngine.playUIGlitchTick();
      if (devilReplyTimerRef.current) {
        window.clearTimeout(devilReplyTimerRef.current);
      }

      // Show what the player says to the Devil first, then the Devil's cross-checked response!
      emitDialogue({
        id: `player_bluff_${Date.now()}`,
        speaker: 'PLAYER',
        text: result.playerLine,
        durationMs: 1350,
      });

      devilReplyTimerRef.current = window.setTimeout(() => {
        if (result.fooled) {
          soundEngine.playSwitchClick(true);
        } else {
          soundEngine.playTrapSnap();
        }
        emitDialogue({
          id: `devil_reply_${Date.now()}`,
          speaker: 'DEVIL',
          text: result.devilReply,
          durationMs: 5200,
        });
      }, 1250);
    },
    [chamberIndex, emitDialogue, telemetry]
  );

  // Past-life memory unlocked strictly upon completing each level!
  const handleClearChamber = useCallback(
    (clearedIdx: number, unlockedMemory: MemoryFragmentDef, nextIdx: number) => {
      if (!telemetry.memoriesCollected.includes(unlockedMemory.id)) {
        telemetry.memoriesCollected.push(unlockedMemory.id);
      }
      rageEngine.addRage(0, telemetry, clearedIdx, `Completed Level ${clearedIdx + 1}`);
      const clampedNext = Math.min(CHAMBERS.length - 1, nextIdx);
      persistCurrentRun(clampedNext, husks, telemetry);
      setClearedStageData({
        levelNumber: CHAMBERS[clearedIdx]?.levelNumber || clearedIdx + 1,
        memory: unlockedMemory,
        nextChamberIndex: clampedNext,
      });
      setScreen(GameScreen.CHAMBER_CLEARED_MEMORY);
    },
    [husks, persistCurrentRun, telemetry]
  );

  const handleProceedFromMemoryToNextChamber = useCallback(() => {
    if (!clearedStageData) return;
    const nextIdx = clearedStageData.nextChamberIndex;
    setClearedStageData(null);
    rageEngine.onEnterNewLevel();
    setChamberIndex(nextIdx);
    virtualActionsRef.current.resetRoomPulse = true;
    setScreen(GameScreen.PLAYING);
    window.focus();
    const greet = LEVEL_GREETINGS[nextIdx];
    if (greet) emitDialogue(greet);
  }, [clearedStageData, emitDialogue]);

  const handleTriggerFakeWin = useCallback(
    (chamberMemory: MemoryFragmentDef) => {
      if (!telemetry.memoriesCollected.includes(chamberMemory.id)) {
        telemetry.memoriesCollected.push(chamberMemory.id);
      }
      telemetry.fakeProgressRegressions += 1;
      telemetry.chamberNumberMutations += 1;
      rageEngine.addRage(14, telemetry, 4, 'Fake Escape Trap');
      setClearedStageData({
        levelNumber: 5,
        memory: chamberMemory,
        nextChamberIndex: 5,
      });
      setScreen(GameScreen.FAKE_WIN);
    },
    [telemetry]
  );

  const handleRevealAfterFakeWin = useCallback(() => {
    virtualActionsRef.current.fakeWinCompleted = true;
    persistCurrentRun(5, husks, telemetry);
    setScreen(GameScreen.CHAMBER_CLEARED_MEMORY);
  }, [husks, persistCurrentRun, telemetry]);

  const handleReachFinalMirror = useCallback(
    (finalMemory: MemoryFragmentDef) => {
      if (!telemetry.memoriesCollected.includes(finalMemory.id)) {
        telemetry.memoriesCollected.push(finalMemory.id);
      }
      rageEngine.addRage(0, telemetry, 7, 'Reached Mirror');
      setScreen(GameScreen.ENDING_CHOICE);
    },
    [telemetry]
  );

  const handleSelectEnding = useCallback(
    (ending: EndingType) => {
      soundEngine.playMemoryChime();
      setChosenEnding(ending);
      const nextMeta = {
        hasResetHouseBefore: metaMemory.hasResetHouseBefore || ending === EndingType.RESET,
        completedEndings: Array.from(new Set([...metaMemory.completedEndings, ending])),
        totalLoops: metaMemory.totalLoops + 1,
      };
      saveMetaMemory(nextMeta);
      setMetaMemory(nextMeta);
      clearSavedProgress();
      setSavedSnapshot(null);
      setScreen(GameScreen.ENDING_SCENE);
    },
    [metaMemory]
  );

  const handleUpdateHusks = useCallback(
    (nextHusks: HuskEntity[]) => {
      setHusks(nextHusks);
      persistCurrentRun(chamberIndex, nextHusks, telemetry);
    },
    [chamberIndex, persistCurrentRun, telemetry]
  );

  const handleHUDTick = useCallback(
    (payload: {
      rageIndex: number;
      rageState: RageState;
      pokerEnergy: number;
      pokerActive: boolean;
      uiMutation: UIMutationState;
      nearbyPrompt: string | null;
      deathBanner: string | null;
      winBanner: string | null;
    }) => {
      setRageIndex(payload.rageIndex);
      setRageState(payload.rageState);
      setPokerEnergy(payload.pokerEnergy);
      setPokerActive(payload.pokerActive);
      setUiMutation({ ...payload.uiMutation });
      setNearbyPrompt(payload.nearbyPrompt);
      setDeathBanner(payload.deathBanner);
      setWinBanner(payload.winBanner);
    },
    []
  );

  const handleClickTemptation = useCallback(() => {
    soundEngine.playUIGlitchTick();
    if (!uiMutation.temptationDodgedOnce) {
      rageEngine.markTemptationDodged(telemetry);
      emitDialogue({
        id: `dodge_ui_${Date.now()}`,
        speaker: 'DEVIL',
        text: 'Look how fast your cursor lunged for the free bridge. Click it one more time if you mean it.',
        durationMs: 3800,
      });
    } else {
      virtualActionsRef.current.pityActivatedForChamber = chamberIndex;
      rageEngine.dismissTemptationToast();
    }
  }, [chamberIndex, emitDialogue, telemetry, uiMutation.temptationDodgedOnce]);

  const handleWipeMemory = useCallback(() => {
    wipeAllHouseMemory();
    rageEngine.resetSession();
    setSavedSnapshot(null);
    setMetaMemory({ hasResetHouseBefore: false, completedEndings: [], totalLoops: 0 });
    setHusks([]);
    setTelemetry(createInitialTelemetry(consentTimestamp || undefined));
  }, [consentTimestamp]);

  const anyModalBlocking = settingsOpen || screen !== GameScreen.PLAYING;

  return (
    <main className="relative w-full h-full overflow-hidden bg-[#0b0a0d]">
      <GameViewport3D
        screen={screen}
        chamberIndex={chamberIndex}
        settings={settings}
        husks={husks}
        telemetry={telemetry}
        hasResetHouseMeta={metaMemory.hasResetHouseBefore}
        activeModalOpen={anyModalBlocking}
        virtualActionsRef={virtualActionsRef}
        onUpdateHusks={handleUpdateHusks}
        onClearChamber={handleClearChamber}
        onTriggerFakeWin={handleTriggerFakeWin}
        onReachFinalMirror={handleReachFinalMirror}
        onEmitDialogue={emitDialogue}
        onHUDTick={handleHUDTick}
        onPauseToggle={() =>
          setScreen((prev) =>
            prev === GameScreen.PLAYING
              ? GameScreen.PAUSED
              : prev === GameScreen.PAUSED
                ? GameScreen.PLAYING
                : prev
          )
        }
      />

      {/* ONE-TIME OPENING CONSENT GATE (Never re-triggered on frustration or loops!) */}
      {screen === GameScreen.CONSENT_GATE && (
        <ConsentGateOverlay onAcceptConsent={handleAcceptConsent} />
      )}

      {screen === GameScreen.TITLE && (
        <TitleScreen
          hasSavedGame={Boolean(savedSnapshot)}
          savedLevelNumber={
            savedSnapshot ? CHAMBERS[savedSnapshot.currentChamber]?.levelNumber : undefined
          }
          hasResetHouseBefore={metaMemory.hasResetHouseBefore}
          totalLoops={metaMemory.totalLoops}
          muted={settings.muted}
          onStartNew={handleStartNew}
          onContinue={handleContinue}
          onOpenSettings={() => {
            soundEngine.unlock();
            setSettingsOpen(true);
          }}
          onToggleMute={() => {
            soundEngine.unlock();
            setSettings((s) => ({ ...s, muted: !s.muted }));
          }}
          onWipeMemory={handleWipeMemory}
        />
      )}

      {screen === GameScreen.INTRO && <IntroOverlay onFinish={handleFinishIntro} />}

      {screen === GameScreen.PLAYING && (
        <GameHUD
          memoriesCount={telemetry.memoriesCollected.length}
          deathsCount={telemetry.deaths}
          rageIndex={rageIndex}
          rageState={rageState}
          pokerEnergy={pokerEnergy}
          pokerActive={pokerActive}
          uiMutation={uiMutation}
          activeDialogue={activeDialogue}
          nearbyPrompt={nearbyPrompt}
          deathBanner={deathBanner}
          winBanner={winBanner}
          muted={settings.muted}
          onTriggerInteract={() => {
            virtualActionsRef.current.interactPulse = true;
            window.focus();
          }}
          onTriggerShedHusk={() => {
            virtualActionsRef.current.shedHuskPulse = true;
            window.focus();
          }}
          onSetPokerHeld={(held) => {
            virtualActionsRef.current.pokerHeld = held;
          }}
          onCommunicateWithDevil={handleCommunicateWithDevil}
          onClickTemptation={handleClickTemptation}
          onDismissTemptation={() => rageEngine.dismissTemptationToast()}
          onToggleMute={() => setSettings((s) => ({ ...s, muted: !s.muted }))}
          onOpenPause={() => setScreen(GameScreen.PAUSED)}
        />
      )}

      {screen === GameScreen.CHAMBER_CLEARED_MEMORY && clearedStageData && (
        <ChamberClearedMemoryOverlay
          levelNumber={clearedStageData.levelNumber}
          memory={clearedStageData.memory}
          onProceedNextChamber={handleProceedFromMemoryToNextChamber}
        />
      )}

      {screen === GameScreen.FAKE_WIN && (
        <FakeWinOverlay
          onFellForFakeButton={() => {
            telemetry.uiManipulationsClicked += 1;
          }}
          onRevealTruth={handleRevealAfterFakeWin}
        />
      )}

      {screen === GameScreen.PAUSED && !settingsOpen && (
        <PauseOverlay
          rageIndex={rageIndex}
          buttonOrderSeed={uiMutation.buttonOrderSeed}
          onResume={() => {
            setScreen(GameScreen.PLAYING);
            window.focus();
          }}
          onRestartChamber={() => {
            virtualActionsRef.current.resetRoomPulse = true;
            setScreen(GameScreen.PLAYING);
            window.focus();
          }}
          onOpenSettings={() => setSettingsOpen(true)}
          onReturnToTitle={() => {
            persistCurrentRun(chamberIndex, husks, telemetry);
            setScreen(GameScreen.TITLE);
          }}
          onMisclickShuffled={() => {
            telemetry.uiManipulationsClicked += 1;
          }}
        />
      )}

      {settingsOpen && (
        <SettingsOverlay
          settings={settings}
          onChange={setSettings}
          onClose={() => {
            setSettingsOpen(false);
            if (screen === GameScreen.PLAYING) {
              window.focus();
            }
          }}
        />
      )}

      {screen === GameScreen.ENDING_CHOICE && (
        <MirrorEndingChoiceOverlay
          telemetry={telemetry}
          onSelectEnding={handleSelectEnding}
        />
      )}

      {screen === GameScreen.ENDING_SCENE && (
        <EndingSceneOverlay
          ending={chosenEnding}
          onProceedToDebrief={() => setScreen(GameScreen.DEBRIEF)}
        />
      )}

      {screen === GameScreen.DEBRIEF && (
        <DebriefScreen
          telemetry={telemetry}
          ending={chosenEnding}
          onPlayAgain={handleStartNew}
          onReturnTitle={() => setScreen(GameScreen.TITLE)}
        />
      )}
    </main>
  );
}
