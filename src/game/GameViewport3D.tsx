import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  ChamberDef,
  DialogueLine,
  GameScreen,
  GameSettings,
  HazardDef,
  HuskEntity,
  HuskType,
  MemoryFragmentDef,
  PlayerTelemetry,
  RageState,
  RecordedFrame,
  UIMutationState,
} from '../types/game';
import { CHAMBERS } from './chambers';
import {
  createDamaskWallpaperTexture,
  createOakPlankTexture,
  createRadialContactShadowTexture,
  createSignPlaqueTexture,
  createStoneBlockTexture,
} from './textures3d';
import {
  buildExitArchModel,
  buildGhostModel,
  buildHuskModel,
  buildPlayerModel,
  buildWatchingEyeModel,
  PlayerModelRig,
  WatchingEyeRig,
} from './models3d';
import { soundEngine } from '../audio/soundEngine';
import { rageEngine } from './rageEngine';
import {
  getDevilTauntForDeath,
  getFrustrationTrapTaunt,
  getHabitSnareTaunt,
} from './storyData';

export interface VirtualActions {
  interactPulse: boolean;
  shedHuskPulse: boolean;
  resetRoomPulse: boolean;
  pokerHeld: boolean;
  pityActivatedForChamber: number | null;
  fakeWinCompleted: boolean;
}

interface GameViewport3DProps {
  screen: GameScreen;
  chamberIndex: number;
  settings: GameSettings;
  husks: HuskEntity[];
  telemetry: PlayerTelemetry;
  hasResetHouseMeta: boolean;
  activeModalOpen: boolean;
  virtualActionsRef: React.MutableRefObject<VirtualActions>;
  onUpdateHusks: (nextHusks: HuskEntity[]) => void;
  onClearChamber: (
    clearedChamberIndex: number,
    unlockedMemory: MemoryFragmentDef,
    nextChamberIndex: number
  ) => void;
  onTriggerFakeWin: (chamberMemory: MemoryFragmentDef) => void;
  onReachFinalMirror: (finalMemory: MemoryFragmentDef) => void;
  onEmitDialogue: (line: DialogueLine) => void;
  onHUDTick: (payload: {
    rageIndex: number;
    rageState: RageState;
    pokerEnergy: number;
    pokerActive: boolean;
    uiMutation: UIMutationState;
    nearbyPrompt: string | null;
    deathBanner: string | null;
    winBanner: string | null;
  }) => void;
  onPauseToggle: () => void;
}

const _camTargetPos = new THREE.Vector3();
const _camLookAt = new THREE.Vector3();
const _eyeLookTarget = new THREE.Vector3();

const MOVE_SPEED = 7.0;
const JUMP_IMPULSE = 13.3;
const GRAVITY = -30.5;
const PLAYER_WIDTH = 0.7;
const PLAYER_HEIGHT = 1.48;

export const GameViewport3D: React.FC<GameViewport3DProps> = ({
  screen,
  chamberIndex,
  settings,
  husks,
  telemetry,
  hasResetHouseMeta,
  activeModalOpen,
  virtualActionsRef,
  onUpdateHusks,
  onClearChamber,
  onTriggerFakeWin,
  onReachFinalMirror,
  onEmitDialogue,
  onHUDTick,
  onPauseToggle,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const propsRef = useRef({
    screen,
    chamberIndex,
    settings,
    husks,
    telemetry,
    hasResetHouseMeta,
    activeModalOpen,
    onUpdateHusks,
    onClearChamber,
    onTriggerFakeWin,
    onReachFinalMirror,
    onEmitDialogue,
    onHUDTick,
    onPauseToggle,
  });
  propsRef.current = {
    screen,
    chamberIndex,
    settings,
    husks,
    telemetry,
    hasResetHouseMeta,
    activeModalOpen,
    onUpdateHusks,
    onClearChamber,
    onTriggerFakeWin,
    onReachFinalMirror,
    onEmitDialogue,
    onHUDTick,
    onPauseToggle,
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      try {
        const probeCanvas = document.createElement('canvas');
        const gl = probeCanvas.getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(
      container.clientWidth || window.innerWidth,
      container.clientHeight || window.innerHeight
    );
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const onContextLost = (e: Event) => {
      e.preventDefault();
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost, false);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0a0d);
    scene.fog = new THREE.FogExp2(0x0b0a0d, 0.025);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(
      44,
      (container.clientWidth || window.innerWidth) /
        Math.max(1, container.clientHeight || window.innerHeight),
      0.1,
      100
    );
    camera.position.set(0, 2.5, 13.8);

    const hemiLight = new THREE.HemisphereLight(0x6d7aa8, 0x261a14, 0.86);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffdca8, 1.42);
    keyLight.position.set(6, 12, 9);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 40;
    keyLight.shadow.camera.left = -17;
    keyLight.shadow.camera.right = 17;
    keyLight.shadow.camera.top = 10;
    keyLight.shadow.camera.bottom = -6;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x7c93d6, 0.62);
    rimLight.position.set(-8, 6, -7);
    scene.add(rimLight);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const wallpaperTex = createDamaskWallpaperTexture(maxAniso);
    const oakTex = createOakPlankTexture(maxAniso);
    const stoneTex = createStoneBlockTexture(maxAniso);
    const shadowTex = createRadialContactShadowTexture();

    const moteCount = 60;
    const moteGeo = new THREE.SphereGeometry(0.03, 6, 6);
    const moteMat = new THREE.MeshBasicMaterial({
      color: 0xfde68a,
      transparent: true,
      opacity: 0.38,
    });
    const motesInstanced = new THREE.InstancedMesh(moteGeo, moteMat, moteCount);
    motesInstanced.frustumCulled = false;
    const moteSeeds = Array.from({ length: moteCount }, () => ({
      x: (Math.random() - 0.5) * 30,
      y: Math.random() * 6 - 1,
      z: (Math.random() - 0.5) * 5,
      speed: 0.22 + Math.random() * 0.42,
      phase: Math.random() * Math.PI * 2,
    }));
    scene.add(motesInstanced);

    const playerRig: PlayerModelRig = buildPlayerModel(shadowTex, isSoftwareGl);
    scene.add(playerRig.root);

    const lanternLight = new THREE.PointLight(0xffb454, 2.35, 9.8, 1.7);
    lanternLight.position.set(0, 1.3, 0.9);
    scene.add(lanternLight);

    const chamberGroup = new THREE.Group();
    scene.add(chamberGroup);

    const husksGroup = new THREE.Group();
    scene.add(husksGroup);

    let builtChamberIdx = -1;
    let builtDeathSignState = false;
    let lastHabitSignString = '';

    interface PlatformRuntime {
      def: ChamberDef['platforms'][number];
      mesh: THREE.Mesh;
      shakeTimer: number;
      paranoiaRattleTimer: number;
      collapsedTimer: number;
      recoilHoldTimer: number;
      currentX: number;
      currentY: number;
      visibleSolid: boolean;
    }

    interface SpikeRuntime {
      def: HazardDef;
      group: THREE.Group;
      active: boolean;
      permanentlyDisarmed: boolean;
      announcedThisRoom: boolean;
      isHabitSnare?: boolean;
      spawnGraceTimer?: number;
    }

    interface MovingHazardRuntime {
      def: HazardDef;
      mesh: THREE.Group;
      currentBottomY: number;
      state: 'IDLE' | 'SLAMMING' | 'RETRACTING';
      timer: number;
      wasTriggeredBySprint: boolean;
      hitPlayerDuringSlam: boolean;
      rewardedBaitWin: boolean;
      active: boolean;
      permanentlyDisarmed: boolean;
      announcedThisRoom: boolean;
    }

    interface SwitchRuntime {
      def: ChamberDef['switches'][number];
      plunger: THREE.Mesh;
      latched: boolean;
      pressed: boolean;
    }

    interface HabitFootprint {
      x: number;
      y: number;
      platMinX: number;
      platMaxX: number;
      count: number;
      spawned: boolean;
    }

    let platformRuntimes: PlatformRuntime[] = [];
    let spikeRuntimes: SpikeRuntime[] = [];
    let hazardRuntimes: MovingHazardRuntime[] = [];
    let switchRuntimes: SwitchRuntime[] = [];
    let watchingEyes: WatchingEyeRig[] = [];
    let activeHuskMeshes = new Map<string, THREE.Group>();
    let localRoomHusks: HuskEntity[] = [];
    let habitFootprints: HabitFootprint[] = [];
    let dynamicHabitSpikesCount = 0;

    let exitArchGroup: THREE.Group | null = null;
    let falseSunArchShutterMesh: THREE.Mesh | null = null;
    let falseSunLight: THREE.PointLight | null = null;
    let falseShutterSlammed = false;

    let ghostGroup: THREE.Group | null = null;
    let habitSignMesh: THREE.Mesh | null = null;
    let deathReactiveSigns: Array<{ mesh: THREE.Mesh; afterText: string }> = [];
    let fakeCheckpointOrbMat: THREE.MeshStandardMaterial | null = null;
    let safeCheckpointOrbMat: THREE.MeshStandardMaterial | null = null;
    let presetBodyReformationTimer = 0;

    const player = {
      x: -12.0,
      y: 0.2,
      vx: 0,
      vy: 0,
      facing: 1 as 1 | -1,
      grounded: false,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      lanternOn: true,
      stepDistAccum: 0,
      continuousRunTimer: 0,
      continuousRunDir: 0,
      squashY: 1,
      freezeTimer: 0,
      waitingForFirstInputAfterDeath: false,
      checkpointX: -12.0,
      checkpointY: 0.2,
      realCheckpointUnlocked: false,
      fakeCheckpointTouched: false,
      safeCheckpointClaimed: false,
      calmPauseBeforeOakTimer: 0,
      patientOakLocked: false,
      exitDodgeCount: 0,
      exitCurrentX: 12.6,
      ghostWhisperedThisRoom: false,
      ghostEncounterTime: 0,
      ghostEvaluated: false,
      hesitationTimer: 0,
      wasNearLedge: false,
      mirrorTriggered: false,
      chamberClearTriggered: false,
      lastRecoilPenaltyMs: 0,
      lastHuskCollapseMs: 0,
      lastTrapdoorBetrayalMs: 0,
      deathBannerText: null as string | null,
      deathBannerTimer: 0,
      winBannerText: null as string | null,
      winBannerTimer: 0,
    };

    const recordedBuffer: RecordedFrame[] = [];
    let recordAccum = 0;

    const heldKeys = new Set<string>();
    let justPressedJump = false;
    let justReleasedJump = false;
    let justPressedInteract = false;
    let justPressedShed = false;
    let prevMoveDir = 0;
    let mouseNormX = 0;
    let mouseNormY = 0;

    const clearInputs = () => {
      heldKeys.clear();
    };

    const triggerWinToast = (msg: string, duration = 2.6) => {
      player.winBannerText = msg;
      player.winBannerTimer = duration;
    };

    const spawnDynamicHabitSpike = (
      spotX: number,
      spotY: number,
      def: ChamberDef
    ) => {
      const spikeW = 0.56;
      const spikeH = 0.45;
      const hzDef: HazardDef = {
        id: `habit_snare_${def.index}_${Date.now()}`,
        x: spotX,
        y: spotY,
        width: spikeW,
        height: spikeH,
        kind: 'SPIKES',
      };

      const snareMat = new THREE.MeshStandardMaterial({
        color: 0xf43f5e,
        emissive: 0x9f1239,
        emissiveIntensity: 0.95,
        roughness: 0.24,
        metalness: 0.88,
      });

      const spikeGroup = new THREE.Group();
      const hiddenY = spotY - spikeH - 0.15;
      spikeGroup.position.set(spotX, hiddenY, 0);
      spikeGroup.visible = true;

      const count = 3;
      const spacing = spikeW / count;
      const coneGeo = new THREE.ConeGeometry(0.095, spikeH, 6);
      for (let i = 0; i < count; i++) {
        const sx = -spikeW * 0.5 + spacing * (i + 0.5);
        const s1 = new THREE.Mesh(coneGeo, snareMat);
        s1.position.set(sx, spikeH * 0.5, 0.14);
        const s2 = new THREE.Mesh(coneGeo, snareMat);
        s2.position.set(sx, spikeH * 0.5, -0.14);
        spikeGroup.add(s1, s2);
      }

      chamberGroup.add(spikeGroup);
      spikeRuntimes.push({
        def: hzDef,
        group: spikeGroup,
        active: true,
        permanentlyDisarmed: false,
        announcedThisRoom: true,
        isHabitSnare: true,
        spawnGraceTimer: 0.55,
      });

      dynamicHabitSpikesCount += 1;
      propsRef.current.telemetry.habitSnaresGrown =
        (propsRef.current.telemetry.habitSnaresGrown || 0) + 1;
      propsRef.current.telemetry.rageTrapsSpawned += 1;

      soundEngine.playTrapSnap();
      propsRef.current.onEmitDialogue({
        id: `habit_snare_msg_${Date.now()}`,
        speaker: 'DEVIL',
        text: getHabitSnareTaunt(),
        durationMs: 4600,
      });
    };

    const recordFootprintSpot = (
      spotX: number,
      spotY: number,
      plat: PlatformRuntime,
      def: ChamberDef,
      pokerActive: boolean,
      trapFrustration: number
    ) => {
      if (pokerActive || dynamicHabitSpikesCount >= 2) return;
      const k = plat.def.kind;
      if (k !== 'SOLID' && k !== 'PARANOIA_SAFE' && k !== 'SAFE_SMOKING') return;
      if (plat.def.width < 2.2) return;

      // Safe-zone guards so a Habit Snare can NEVER softlock spawn, checkpoints, switches, or exits
      if (Math.abs(spotX - def.spawnX) < 1.95) return;
      if (def.safeCheckpoint && Math.abs(spotX - def.safeCheckpoint.x) < 1.55) return;
      if (def.hasFakeCheckpoint && Math.abs(spotX - def.hasFakeCheckpoint.x) < 1.55) return;
      if (Math.abs(spotX - player.exitCurrentX) < 1.75 || Math.abs(spotX - def.exitX) < 1.75) {
        return;
      }
      if (def.switches.some((sw) => Math.abs(spotX - sw.x) < 1.35)) return;
      if (spikeRuntimes.some((sp) => Math.abs(spotX - sp.def.x) < 0.9 && Math.abs(spotY - sp.def.y) < 0.5)) {
        return;
      }

      const platMinX = plat.currentX - plat.def.width * 0.5 + 0.42;
      const platMaxX = plat.currentX + plat.def.width * 0.5 - 0.42;
      if (platMaxX <= platMinX) return;
      const clampedX = THREE.MathUtils.clamp(spotX, platMinX, platMaxX);

      let matched = habitFootprints.find(
        (fp) => Math.abs(fp.x - clampedX) < 0.85 && Math.abs(fp.y - spotY) < 0.25
      );
      if (!matched) {
        matched = {
          x: clampedX,
          y: spotY,
          platMinX,
          platMaxX,
          count: 1,
          spawned: false,
        };
        habitFootprints.push(matched);
      } else {
        matched.x = THREE.MathUtils.clamp((matched.x + clampedX) * 0.5, matched.platMinX, matched.platMaxX);
        matched.count += 1;
      }

      // Frustrated players trigger Habit Snares faster (3 repeats when frustrated, 4 when calm)
      const threshold = trapFrustration >= 40 ? 3 : 4;
      if (!matched.spawned && matched.count >= threshold) {
        matched.spawned = true;
        spawnDynamicHabitSpike(matched.x, matched.y, def);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      soundEngine.unlock();

      if (e.code === 'Escape') {
        const curScreen = propsRef.current.screen;
        if (curScreen === GameScreen.PLAYING || curScreen === GameScreen.PAUSED) {
          e.preventDefault();
          propsRef.current.onPauseToggle();
        }
        return;
      }

      if (propsRef.current.screen !== GameScreen.PLAYING || propsRef.current.activeModalOpen) {
        return;
      }

      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      const wasHeld = heldKeys.has(e.code);
      heldKeys.add(e.code);

      if (!wasHeld) {
        const isGameplayKey = [
          'KeyA',
          'KeyD',
          'KeyW',
          'Space',
          'ArrowLeft',
          'ArrowRight',
          'ArrowUp',
        ].includes(e.code);

        if (isGameplayKey) {
          rageEngine.recordKeyPress(propsRef.current.telemetry);
        }

        if (player.waitingForFirstInputAfterDeath && player.freezeTimer <= 0 && isGameplayKey) {
          player.waitingForFirstInputAfterDeath = false;
          rageEngine.recordRespawnInput(propsRef.current.telemetry);
        }

        if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
          justPressedJump = true;
        }
        if (e.code === 'KeyE' || e.code === 'Enter') {
          justPressedInteract = true;
        }
        if (e.code === 'KeyR') {
          justPressedShed = true;
        }
        if (e.code === 'KeyF') {
          player.lanternOn = !player.lanternOn;
          soundEngine.playSwitchClick(player.lanternOn);
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      heldKeys.delete(e.code);
      if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
        justReleasedJump = true;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseNormX = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      mouseNormY = -((e.clientY / Math.max(1, window.innerHeight)) * 2 - 1);
    };

    const onPointerDown = () => {
      soundEngine.unlock();
      window.focus();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearInputs);
    window.addEventListener('mousemove', onMouseMove);
    container.addEventListener('pointerdown', onPointerDown);

    const clearGroup = (grp: THREE.Group) => {
      while (grp.children.length > 0) {
        const child = grp.children[0];
        grp.remove(child);
        child.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const m = obj as THREE.Mesh;
            m.geometry?.dispose();
            const mats = Array.isArray(m.material) ? m.material : [m.material];
            mats.forEach((mat) => {
              if (mat && 'map' in mat) {
                const std = mat as THREE.MeshStandardMaterial;
                if (std.userData?.ownTexture && std.map) {
                  std.map.dispose();
                }
              }
              mat?.dispose();
            });
          }
        });
      }
    };

    const syncHuskMeshes = () => {
      const validIds = new Set(localRoomHusks.map((h) => h.id));
      for (const [id, mesh] of activeHuskMeshes.entries()) {
        if (!validIds.has(id)) {
          husksGroup.remove(mesh);
          activeHuskMeshes.delete(id);
        }
      }
      for (const h of localRoomHusks) {
        if (!activeHuskMeshes.has(h.id)) {
          const model = buildHuskModel(h.type, shadowTex, isSoftwareGl);
          husksGroup.add(model);
          activeHuskMeshes.set(h.id, model);
        }
      }
    };

    const buildChamberScene = (idx: number) => {
      const def = CHAMBERS[idx] || CHAMBERS[0];
      builtChamberIdx = idx;
      builtDeathSignState = (propsRef.current.telemetry.deathsPerChamber[idx] || 0) > 0;
      lastHabitSignString = '';

      clearGroup(chamberGroup);
      clearGroup(husksGroup);
      activeHuskMeshes.clear();

      platformRuntimes = [];
      spikeRuntimes = [];
      hazardRuntimes = [];
      switchRuntimes = [];
      watchingEyes = [];
      habitFootprints = [];
      dynamicHabitSpikesCount = 0;
      exitArchGroup = null;
      falseSunArchShutterMesh = null;
      falseSunLight = null;
      falseShutterSlammed = false;
      ghostGroup = null;
      habitSignMesh = null;
      deathReactiveSigns = [];
      fakeCheckpointOrbMat = null;
      safeCheckpointOrbMat = null;
      presetBodyReformationTimer = 0;

      scene.background = new THREE.Color(def.ambientTint).lerp(new THREE.Color(0x09080c), 0.65);
      (scene.fog as THREE.FogExp2).color.copy(scene.background);

      const roomWidth = def.boundsMaxX - def.boundsMinX + 12;
      const centerRoomX = (def.boundsMinX + def.boundsMaxX) * 0.5;

      const backWallMat = new THREE.MeshStandardMaterial({
        map: wallpaperTex,
        roughness: 0.88,
        metalness: 0.05,
      });
      const backWall = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, 14), backWallMat);
      backWall.position.set(centerRoomX, 3.9, -2.4);
      backWall.receiveShadow = !isSoftwareGl;
      chamberGroup.add(backWall);

      const wainscotMat = new THREE.MeshStandardMaterial({
        map: oakTex,
        color: 0x3b2b22,
        roughness: 0.72,
        metalness: 0.12,
      });
      const wainscot = new THREE.Mesh(new THREE.BoxGeometry(roomWidth, 2.2, 0.18), wainscotMat);
      wainscot.position.set(centerRoomX, 0.2, -2.32);
      chamberGroup.add(wainscot);

      const pilasterMat = new THREE.MeshStandardMaterial({
        map: stoneTex,
        roughness: 0.84,
        metalness: 0.1,
      });
      const brassTrimMat = new THREE.MeshStandardMaterial({
        color: def.accentColor,
        roughness: 0.32,
        metalness: 0.82,
      });
      const copperWireMat = new THREE.MeshStandardMaterial({
        color: 0xd97706,
        emissive: 0x92400e,
        emissiveIntensity: 0.55,
        metalness: 0.82,
        roughness: 0.3,
      });

      for (let px = Math.ceil(def.boundsMinX); px <= def.boundsMaxX; px += 5.6) {
        const pilaster = new THREE.Mesh(new THREE.BoxGeometry(0.48, 9.8, 0.35), pilasterMat);
        pilaster.position.set(px, 3.3, -2.2);
        chamberGroup.add(pilaster);

        const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.24, 0.28), brassTrimMat);
        bracket.position.set(px, 2.85, -1.96);
        chamberGroup.add(bracket);

        const candleFlame = new THREE.Mesh(
          new THREE.ConeGeometry(0.055, 0.16, 8),
          new THREE.MeshBasicMaterial({ color: 0xffcf70 })
        );
        candleFlame.position.set(px, 3.07, -1.88);
        chamberGroup.add(candleFlame);
      }

      for (const eyeDef of def.eyes) {
        const eyeRig = buildWatchingEyeModel(eyeDef.scale ?? 1.0);
        eyeRig.root.position.set(eyeDef.x, eyeDef.y, -2.14);
        chamberGroup.add(eyeRig.root);
        watchingEyes.push(eyeRig);
      }

      const boundWallGeo = new THREE.BoxGeometry(1.2, 12, 3.8);
      const wallL = new THREE.Mesh(boundWallGeo, pilasterMat);
      wallL.position.set(def.boundsMinX - 0.6, 3.5, -0.4);
      const wallR = new THREE.Mesh(boundWallGeo, pilasterMat);
      wallR.position.set(def.boundsMaxX + 0.6, 3.5, -0.4);
      chamberGroup.add(wallL, wallR);

      if (def.reverseZone) {
        const revWidth = def.reverseZone.maxX - def.reverseZone.minX;
        const revCenter = (def.reverseZone.minX + def.reverseZone.maxX) * 0.5;
        const mistGeo = new THREE.BoxGeometry(revWidth, 5.2, 1.8);
        const mistMat = new THREE.MeshBasicMaterial({
          color: 0xe11d48,
          transparent: true,
          opacity: 0.11,
          depthWrite: false,
        });
        const mistMesh = new THREE.Mesh(mistGeo, mistMat);
        mistMesh.position.set(revCenter, 2.2, 0);
        chamberGroup.add(mistMesh);
      }

      if (def.falseSunriseShutter) {
        const fakeSunArch = buildExitArchModel(false, isSoftwareGl);
        fakeSunArch.position.set(10.3, 0.5, -0.48);
        chamberGroup.add(fakeSunArch);

        falseSunLight = new THREE.PointLight(0xffe082, 3.2, 10.5, 1.5);
        falseSunLight.position.set(10.3, 2.2, 0.6);
        chamberGroup.add(falseSunLight);

        const shutterMat = new THREE.MeshStandardMaterial({
          color: 0x1c1917,
          roughness: 0.45,
          metalness: 0.88,
        });
        falseSunArchShutterMesh = new THREE.Mesh(
          new THREE.BoxGeometry(2.1, 2.8, 0.35),
          shutterMat
        );
        falseSunArchShutterMesh.position.set(10.3, 4.9, -0.32);
        chamberGroup.add(falseSunArchShutterMesh);
      }

      // Earned Mid-Level Golden Anchor Checkpoint
      if (def.safeCheckpoint) {
        const cpGroup = new THREE.Group();
        cpGroup.position.set(def.safeCheckpoint.x, def.safeCheckpoint.y, -0.55);
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.085, 0.13, 1.3, 10),
          brassTrimMat
        );
        post.position.y = 0.65;
        cpGroup.add(post);

        safeCheckpointOrbMat = new THREE.MeshStandardMaterial({
          color: 0xfde68a,
          emissive: 0xd97706,
          emissiveIntensity: 0.75,
          roughness: 0.22,
          metalness: 0.3,
        });
        const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.21, 1), safeCheckpointOrbMat);
        orb.position.y = 1.45;
        cpGroup.add(orb);
        chamberGroup.add(cpGroup);
      }

      // Wired Emerald Trap Checkpoint (Levels 4 & 7 — turns Golden once copper fuse is cut)
      if (def.hasFakeCheckpoint) {
        const cpGroup = new THREE.Group();
        cpGroup.position.set(def.hasFakeCheckpoint.x, def.hasFakeCheckpoint.y, -0.55);
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.09, 0.14, 1.35, 10),
          pilasterMat
        );
        post.position.y = 0.675;
        cpGroup.add(post);

        fakeCheckpointOrbMat = new THREE.MeshStandardMaterial({
          color: 0x34d399,
          emissive: 0x10b981,
          emissiveIntensity: 1.45,
          roughness: 0.2,
        });
        const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 1), fakeCheckpointOrbMat);
        orb.position.y = 1.5;
        cpGroup.add(orb);
        chamberGroup.add(cpGroup);

        const targetFuseX = def.hasFakeCheckpoint.fuseX ?? -14.2;
        const targetFuseY = def.hasFakeCheckpoint.fuseY ?? 0.6;
        const midWireX = (def.hasFakeCheckpoint.x + targetFuseX) * 0.5;
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(def.hasFakeCheckpoint.x, def.hasFakeCheckpoint.y + 0.2, -1.9),
          new THREE.Vector3(midWireX, Math.max(def.hasFakeCheckpoint.y, targetFuseY) + 0.85, -1.9),
          new THREE.Vector3(targetFuseX, targetFuseY, -1.9),
        ]);
        const wireGeo = new THREE.TubeGeometry(curve, 24, 0.034, 6, false);
        chamberGroup.add(new THREE.Mesh(wireGeo, copperWireMat));
      }

      // Platforms (TRAPDOOR renders identically to SOLID stone/oak + brass trim for unspoken false hope!)
      for (const p of def.platforms) {
        let mat: THREE.MeshStandardMaterial;
        if (p.kind === 'COLLAPSING' || p.kind === 'PATIENT_OAK') {
          mat = new THREE.MeshStandardMaterial({
            map: oakTex,
            color: p.kind === 'COLLAPSING' ? 0x6e4730 : 0x85583a,
            roughness: 0.75,
            metalness: 0.1,
          });
        } else if (p.kind === 'PARANOIA_SAFE') {
          mat = new THREE.MeshStandardMaterial({
            map: oakTex,
            color: 0x63412c,
            roughness: 0.78,
            metalness: 0.12,
          });
        } else if (p.kind === 'CADENCE_RECOIL') {
          mat = new THREE.MeshStandardMaterial({
            color: 0x3b332b,
            emissive: 0x78350f,
            emissiveIntensity: 0.32,
            roughness: 0.36,
            metalness: 0.78,
          });
        } else if (p.kind === 'SAFE_SMOKING') {
          mat = new THREE.MeshStandardMaterial({
            color: 0x2c2529,
            emissive: 0x991b1b,
            emissiveIntensity: 0.58,
            roughness: 0.45,
            metalness: 0.72,
          });
        } else if (p.kind === 'DISAPPEARING') {
          mat = new THREE.MeshStandardMaterial({
            color: 0xa855f7,
            emissive: 0x6b21a8,
            emissiveIntensity: 0.65,
            transparent: true,
            opacity: 0.88,
            roughness: 0.25,
            metalness: 0.5,
          });
        } else if (p.kind === 'GATE') {
          mat = new THREE.MeshStandardMaterial({
            color: 0x27272a,
            roughness: 0.35,
            metalness: 0.88,
          });
        } else if (p.kind === 'BRIDGE') {
          mat = new THREE.MeshStandardMaterial({
            color: 0x52412c,
            emissive: 0x92400e,
            emissiveIntensity: 0.28,
            transparent: true,
            opacity: 0.38,
            roughness: 0.42,
            metalness: 0.68,
          });
        } else if (p.kind === 'PITY_BRIDGE') {
          mat = new THREE.MeshStandardMaterial({
            color: 0x991b1b,
            emissive: 0x7f1d1d,
            emissiveIntensity: 0.65,
            roughness: 0.35,
            metalness: 0.7,
          });
        } else {
          // Both SOLID and TRAPDOOR share identical material & texture!
          mat = new THREE.MeshStandardMaterial({
            map: p.height > 0.6 ? stoneTex : oakTex,
            roughness: 0.8,
            metalness: 0.12,
          });
        }

        const geo = new THREE.BoxGeometry(p.width, p.height, p.kind === 'GATE' ? 1.3 : 1.75);
        const mesh = new THREE.Mesh(geo, mat);
        const initialMeshY =
          p.kind === 'BRIDGE' ? p.y - p.height * 0.5 - 2.1 : p.y - p.height * 0.5;
        mesh.position.set(p.x, initialMeshY, 0);
        mesh.castShadow = !isSoftwareGl && p.height < 1.2;
        mesh.receiveShadow = !isSoftwareGl;

        if (
          p.kind === 'SOLID' ||
          p.kind === 'TRAPDOOR' ||
          p.kind === 'SAFE_SMOKING' ||
          p.kind === 'PATIENT_OAK' ||
          p.kind === 'CADENCE_RECOIL' ||
          p.kind === 'BRIDGE'
        ) {
          const trim = new THREE.Mesh(
            new THREE.BoxGeometry(p.width + 0.04, 0.06, 1.8),
            brassTrimMat
          );
          trim.position.y = p.height * 0.5 - 0.03;
          mesh.add(trim);
        }

        const startsSolid = p.kind !== 'PITY_BRIDGE' && p.kind !== 'BRIDGE';
        mesh.visible = p.kind !== 'PITY_BRIDGE';
        chamberGroup.add(mesh);

        platformRuntimes.push({
          def: p,
          mesh,
          shakeTimer: 0,
          paranoiaRattleTimer: 0,
          collapsedTimer: 0,
          recoilHoldTimer: 0,
          currentX: p.x,
          currentY: p.y,
          visibleSolid: startsSolid,
        });
      }

      // Hazards
      const ironSpikeMat = new THREE.MeshStandardMaterial({
        color: 0x71717a,
        emissive: 0x450a0a,
        emissiveIntensity: 0.42,
        roughness: 0.3,
        metalness: 0.86,
      });

      const rageSpikeMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0x991b1b,
        emissiveIntensity: 0.9,
        roughness: 0.25,
        metalness: 0.88,
      });

      for (const h of def.hazards) {
        const isRageGated = Boolean(h.minRageToActivate && h.minRageToActivate > 0);
        const initiallyActive =
          !isRageGated || rageEngine.getTrapFrustrationLevel() >= (h.minRageToActivate ?? 0);

        if (h.kind === 'SPIKES') {
          const spikeGroup = new THREE.Group();
          const hiddenY = h.y - h.height - 0.15;
          spikeGroup.position.set(h.x, initiallyActive ? h.y : hiddenY, 0);
          spikeGroup.visible = initiallyActive;

          const count = Math.max(2, Math.floor(h.width / 0.3));
          const spacing = h.width / count;
          const coneGeo = new THREE.ConeGeometry(0.115, h.height, 6);
          const useMat = isRageGated ? rageSpikeMat : ironSpikeMat;

          for (let i = 0; i < count; i++) {
            const sx = -h.width * 0.5 + spacing * (i + 0.5);
            const s1 = new THREE.Mesh(coneGeo, useMat);
            s1.position.set(sx, h.height * 0.5, 0.16);
            const s2 = new THREE.Mesh(coneGeo, useMat);
            s2.position.set(sx, h.height * 0.5, -0.16);
            spikeGroup.add(s1, s2);
          }
          chamberGroup.add(spikeGroup);

          spikeRuntimes.push({
            def: h,
            group: spikeGroup,
            active: initiallyActive,
            permanentlyDisarmed: false,
            announcedThisRoom: initiallyActive,
          });
        } else if (h.kind === 'HABIT_CRUSHER' || h.kind === 'BAIT_PENDULUM') {
          const hzGrp = new THREE.Group();

          if (h.kind === 'HABIT_CRUSHER') {
            const block = new THREE.Mesh(
              new THREE.BoxGeometry(h.width, h.height, 1.5),
              new THREE.MeshStandardMaterial({
                color: isRageGated ? 0x3f151b : 0x272026,
                roughness: 0.5,
                metalness: 0.75,
              })
            );
            block.position.y = h.height * 0.5;
            hzGrp.add(block);

            const teethCount = Math.max(3, Math.floor(h.width / 0.4));
            const toothGeo = new THREE.ConeGeometry(0.13, 0.28, 6);
            for (let i = 0; i < teethCount; i++) {
              const tx = -h.width * 0.5 + (h.width / teethCount) * (i + 0.5);
              const tooth = new THREE.Mesh(toothGeo, isRageGated ? rageSpikeMat : ironSpikeMat);
              tooth.rotation.x = Math.PI;
              tooth.position.set(tx, -0.12, 0);
              hzGrp.add(tooth);
            }
          } else {
            const crescent = new THREE.Mesh(
              new THREE.CylinderGeometry(h.width * 0.52, h.width * 0.52, 0.18, 18),
              new THREE.MeshStandardMaterial({
                color: 0xb91c1c,
                emissive: 0x7f1d1d,
                emissiveIntensity: isRageGated ? 0.95 : 0.65,
                roughness: 0.24,
                metalness: 0.88,
              })
            );
            crescent.rotation.x = Math.PI / 2;
            crescent.position.y = h.height * 0.45;
            hzGrp.add(crescent);

            const hub = new THREE.Mesh(
              new THREE.CylinderGeometry(0.18, 0.18, 0.26, 12),
              brassTrimMat
            );
            hub.rotation.x = Math.PI / 2;
            hub.position.y = h.height * 0.45;
            hzGrp.add(hub);
          }

          const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 5.2, 8), ironSpikeMat);
          rod.position.y = h.height + 2.5;
          hzGrp.add(rod);

          const startY = initiallyActive ? h.y : h.y + 3.2;
          hzGrp.position.set(h.x, startY, 0);
          hzGrp.visible = initiallyActive;
          chamberGroup.add(hzGrp);

          hazardRuntimes.push({
            def: h,
            mesh: hzGrp,
            currentBottomY: startY,
            state: 'IDLE',
            timer: 0,
            wasTriggeredBySprint: false,
            hitPlayerDuringSlam: false,
            rewardedBaitWin: false,
            active: initiallyActive,
            permanentlyDisarmed: false,
            announcedThisRoom: initiallyActive,
          });
        }
      }

      // Switches + Visible 3D Copper Conduit Wires (`wireTo`)
      for (const sw of def.switches) {
        const swGroup = new THREE.Group();
        swGroup.position.set(sw.x, sw.y, 0);

        const rim = new THREE.Mesh(
          new THREE.BoxGeometry(sw.width + 0.16, 0.08, 1.25),
          brassTrimMat
        );
        rim.position.y = 0.04;
        swGroup.add(rim);

        const plungerMat = new THREE.MeshStandardMaterial({
          color: sw.requiresWeight ? 0xf59e0b : 0x34d399,
          emissive: sw.requiresWeight ? 0x92400e : 0x065f46,
          emissiveIntensity: 0.65,
          roughness: 0.35,
          metalness: 0.65,
        });
        const plunger = new THREE.Mesh(
          new THREE.BoxGeometry(sw.width - 0.06, 0.12, 1.05),
          plungerMat
        );
        plunger.position.y = 0.11;
        swGroup.add(plunger);

        chamberGroup.add(swGroup);

        if (sw.wireTo) {
          const midX = (sw.x + sw.wireTo.x) * 0.5;
          const archY = Math.max(sw.y, sw.wireTo.y) + 0.7;
          const wireCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(sw.x, sw.y + 0.1, -1.92),
            new THREE.Vector3(midX, archY, -1.92),
            new THREE.Vector3(sw.wireTo.x, sw.wireTo.y, -1.92),
          ]);
          const wireGeo = new THREE.TubeGeometry(wireCurve, 20, 0.028, 6, false);
          chamberGroup.add(new THREE.Mesh(wireGeo, copperWireMat));
        }

        switchRuntimes.push({
          def: sw,
          plunger,
          latched: false,
          pressed: false,
        });
      }

      // Signs
      for (const sg of def.signs) {
        const useAfterText = builtDeathSignState && sg.afterDeathText;
        const label = sg.isHabitWall
          ? rageEngine.getDominantHabitSummary(propsRef.current.telemetry)
          : useAfterText
            ? sg.afterDeathText!
            : sg.initialText;

        const tex = createSignPlaqueTexture(
          label,
          sg.isHabitWall ? '#fbbf24' : builtDeathSignState ? '#f87171' : '#ebe6dc',
          '#1b1412',
          maxAniso
        );
        const signMat = new THREE.MeshStandardMaterial({
          map: tex,
          roughness: 0.65,
          metalness: 0.15,
        });
        signMat.userData.ownTexture = true;

        const plaque = new THREE.Mesh(new THREE.BoxGeometry(2.75, 0.98, 0.08), signMat);
        plaque.position.set(sg.x, sg.y + 2.0, -1.85);
        chamberGroup.add(plaque);

        if (sg.isHabitWall) {
          habitSignMesh = plaque;
          lastHabitSignString = label;
        } else if (sg.afterDeathText && !useAfterText) {
          deathReactiveSigns.push({ mesh: plaque, afterText: sg.afterDeathText });
        }
      }

      if (def.ghost) {
        ghostGroup = buildGhostModel();
        ghostGroup.position.set(def.ghost.x, def.ghost.y, -0.35);
        chamberGroup.add(ghostGroup);

        const ghostNeutralLight = new THREE.PointLight(0xcbd5e1, 1.15, 5.5, 1.8);
        ghostNeutralLight.position.set(def.ghost.x, def.ghost.y, 0.2);
        chamberGroup.add(ghostNeutralLight);
      }

      exitArchGroup = buildExitArchModel(Boolean(def.isFinalCore), isSoftwareGl);
      exitArchGroup.position.set(def.exitX, def.exitY, -0.5);
      chamberGroup.add(exitArchGroup);

      if (propsRef.current.hasResetHouseMeta && idx === 0) {
        const cornerHusk = buildHuskModel(HuskType.ORIGINAL, shadowTex, isSoftwareGl);
        cornerHusk.position.set(-13.2, 0, -1.25);
        cornerHusk.scale.setScalar(0.85);
        chamberGroup.add(cornerHusk);
      }

      const persistedInRoom = propsRef.current.husks
        .filter((h) => h.chamberIndex === idx && h.stability > 0.15)
        .map((h) => ({ ...h }));

      const presets: HuskEntity[] = (def.presetHusks || []).map((ph, i) => ({
        ...ph,
        id: `preset_${idx}_${i}`,
        chamberIndex: idx,
        vx: 0,
        vy: 0,
        frameCursor: 0,
        stability: 1.0,
      }));
      localRoomHusks = [...presets, ...persistedInRoom];
      syncHuskMeshes();

      player.x = def.spawnX;
      player.y = def.spawnY;
      player.vx = 0;
      player.vy = 0;
      player.facing = def.exitX >= def.spawnX ? 1 : -1;
      player.grounded = true;
      player.continuousRunTimer = 0;
      player.continuousRunDir = 0;
      player.checkpointX = def.spawnX;
      player.checkpointY = def.spawnY;
      player.realCheckpointUnlocked = false;
      player.fakeCheckpointTouched = false;
      player.safeCheckpointClaimed = false;
      player.calmPauseBeforeOakTimer = 0;
      player.patientOakLocked = false;
      player.exitDodgeCount = 0;
      player.exitCurrentX = def.exitX;
      player.ghostWhisperedThisRoom = false;
      player.ghostEvaluated = false;
      player.mirrorTriggered = false;
      player.chamberClearTriggered = false;
      player.winBannerText = null;
      player.winBannerTimer = 0;
      recordedBuffer.length = 0;

      camera.position.set(def.spawnX + player.facing * 2.2, def.spawnY + 2.4, 13.8);
    };

    const triggerDeathOrSacrifice = (rawCause: string, def: ChamberDef) => {
      if (player.freezeTimer > 0) return;

      const now = performance.now();
      let cause = rawCause;
      if (rawCause.includes('Spikes') || rawCause === 'Abyssal Fall') {
        if (now - player.lastTrapdoorBetrayalMs < 1850) {
          cause = 'Trapdoor Betrayal';
        } else if (now - player.lastHuskCollapseMs < 1500) {
          cause = 'Collapsed Husk';
        } else if (now - player.lastRecoilPenaltyMs < 1600) {
          cause = 'Cadence Recoil';
        }
      }

      soundEngine.playDeathAndHusk();
      rageEngine.recordDeath(def.index, cause, propsRef.current.telemetry);
      propsRef.current.telemetry.husksCreated += 1;

      let huskRestY = player.y;
      for (const pr of platformRuntimes) {
        if (
          pr.def.kind !== 'SOLID' &&
          pr.def.kind !== 'SAFE_SMOKING' &&
          pr.def.kind !== 'PARANOIA_SAFE' &&
          !(pr.def.kind === 'BRIDGE' && pr.visibleSolid)
        ) {
          continue;
        }
        const halfW = pr.def.width * 0.5;
        if (player.x >= pr.currentX - halfW && player.x <= pr.currentX + halfW) {
          if (pr.currentY <= player.y + 0.65) {
            huskRestY = pr.currentY;
          }
        }
      }

      const deathsHere = propsRef.current.telemetry.deathsPerChamber[def.index] || 1;
      const inPit = huskRestY < -0.2;
      const mintedType =
        !inPit && deathsHere >= 4 && def.index >= 2 && recordedBuffer.length > 24
          ? HuskType.ECHO
          : HuskType.BODY;

      const newHusk: HuskEntity = {
        id: `husk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        chamberIndex: def.index,
        type: mintedType,
        x: THREE.MathUtils.clamp(player.x, def.boundsMinX + 0.8, def.boundsMaxX - 0.8),
        y: huskRestY,
        vx: 0,
        vy: 0,
        width: 0.78,
        height: 1.44,
        facing: player.facing,
        causeOfDeath: cause,
        frames: recordedBuffer.slice(-90),
        frameCursor: 0,
        stability: 1.0,
        maxLifetimeSec: 34,
      };

      const nonPreset = localRoomHusks.filter(
        (h) => !h.isSynthetic && h.type !== HuskType.ORIGINAL
      );
      const presets = localRoomHusks.filter(
        (h) => h.isSynthetic || h.type === HuskType.ORIGINAL
      );
      const trimmedPlayerHusks = [...nonPreset.slice(-4), newHusk];
      localRoomHusks = [...presets, ...trimmedPlayerHusks];
      syncHuskMeshes();

      const otherRoomHusks = propsRef.current.husks.filter((h) => h.chamberIndex !== def.index);
      propsRef.current.onUpdateHusks([...otherRoomHusks, ...trimmedPlayerHusks]);

      if (!builtDeathSignState) {
        builtDeathSignState = true;
        for (const item of deathReactiveSigns) {
          const mat = item.mesh.material as THREE.MeshStandardMaterial;
          if (mat.map) mat.map.dispose();
          mat.map = createSignPlaqueTexture(item.afterText, '#f87171', '#1b1412', maxAniso);
          mat.needsUpdate = true;
        }
        deathReactiveSigns = [];
      }

      const rageState = rageEngine.getPerceivedState();
      let taunt = getDevilTauntForDeath(
        deathsHere,
        propsRef.current.telemetry.deaths,
        cause,
        rageState,
        propsRef.current.telemetry
      );

      if (cause === 'Fake Sanctuary Lantern') {
        taunt =
          'Did you think every glowing lantern was a free mercy? Trace the copper wire behind where you woke.';
      }

      propsRef.current.onEmitDialogue({
        id: `taunt_${Date.now()}`,
        speaker: 'DEVIL',
        text: taunt,
        durationMs: 4800,
      });

      player.deathBannerText =
        cause === 'Collapsed Husk'
          ? 'HUSK DISSOLVED · Your past corpse crumbled beneath your boots.'
          : cause === 'Habit Snare'
            ? 'HABIT SNARE · The floor grew iron right on your repeated step.'
            : cause === 'Frustration Trap'
              ? 'FRUSTRATION SNARE · Your rising temper woke extra iron in the floor.'
              : player.realCheckpointUnlocked
                ? 'RETURNED TO ANCHOR · Your latched switches & checkpoint remain saved.'
                : 'HUSK LEFT BEHIND · Use it swiftly before it fades to dust.';
      player.deathBannerTimer = 2.4;
      player.winBannerText = null;
      player.winBannerTimer = 0;
      player.freezeTimer = 0.22;
      player.continuousRunTimer = 0;
      player.continuousRunDir = 0;
      player.waitingForFirstInputAfterDeath = true;

      player.x = player.realCheckpointUnlocked ? player.checkpointX : def.spawnX;
      player.y = player.realCheckpointUnlocked ? player.checkpointY : def.spawnY;
      player.vx = 0;
      player.vy = 0;
      recordedBuffer.length = 0;

      for (const pr of platformRuntimes) {
        if (
          pr.def.kind === 'COLLAPSING' ||
          pr.def.kind === 'TRAPDOOR' ||
          pr.def.kind === 'PATIENT_OAK' ||
          pr.def.kind === 'DISAPPEARING' ||
          pr.def.kind === 'CADENCE_RECOIL'
        ) {
          pr.collapsedTimer = 0;
          pr.shakeTimer = 0;
          pr.recoilHoldTimer = 0;
          pr.currentX = pr.def.x;
          pr.visibleSolid = true;
          pr.mesh.visible = true;
          pr.mesh.position.set(pr.def.x, pr.def.y - pr.def.height * 0.5, 0);
          if (pr.def.kind === 'DISAPPEARING') {
            (pr.mesh.material as THREE.MeshStandardMaterial).opacity = 0.88;
          }
        }
      }
    };

    buildChamberScene(propsRef.current.chamberIndex);
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    let frameId = 0;
    let unmounted = false;
    let hudEmitAccum = 0;
    const dummyMote = new THREE.Object3D();

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (unmounted) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      if (unmounted) return;

      const rawDt = clock.getDelta();
      const dt = Math.min(rawDt, 0.05);
      const elapsed = clock.getElapsedTime();
      const currentProps = propsRef.current;
      const def = CHAMBERS[currentProps.chamberIndex] || CHAMBERS[0];

      if (
        builtChamberIdx !== currentProps.chamberIndex ||
        virtualActionsRef.current.resetRoomPulse
      ) {
        virtualActionsRef.current.resetRoomPulse = false;
        buildChamberScene(currentProps.chamberIndex);
      }

      for (let i = 0; i < moteCount; i++) {
        const s = moteSeeds[i];
        const mx = s.x + Math.sin(elapsed * s.speed + s.phase) * 0.6;
        const my = ((s.y + elapsed * s.speed * 0.35 + 2) % 7) - 1.5;
        dummyMote.position.set(mx, my, s.z);
        dummyMote.scale.setScalar(0.8 + Math.sin(elapsed * 2 + s.phase) * 0.25);
        dummyMote.updateMatrix();
        motesInstanced.setMatrixAt(i, dummyMote.matrix);
      }
      motesInstanced.instanceMatrix.needsUpdate = true;

      if (
        currentProps.screen === GameScreen.CONSENT_GATE ||
        currentProps.screen === GameScreen.TITLE ||
        currentProps.screen === GameScreen.INTRO
      ) {
        playerRig.root.visible = false;
        const panX = Math.sin(elapsed * 0.2) * 4.5 - 2.0;
        const panY = 2.1 + Math.cos(elapsed * 0.16) * 0.32;
        _camTargetPos.set(panX, panY, 11.4);
        camera.position.lerp(_camTargetPos, 1 - Math.exp(-3 * dt));
        _camLookAt.set(panX * 0.4, 1.5, -1.0);
        camera.lookAt(_camLookAt);
        lanternLight.position.set(panX + 1.5, 2.6, 2.0);
        lanternLight.intensity = 1.9 + Math.sin(elapsed * 4.0) * 0.18;

        _eyeLookTarget.set(camera.position.x, camera.position.y, camera.position.z);
        for (const eye of watchingEyes) {
          eye.eyeballPivot.lookAt(_eyeLookTarget);
        }
      } else if (
        currentProps.screen === GameScreen.PLAYING &&
        !currentProps.activeModalOpen
      ) {
        playerRig.root.visible = true;

        const vAct = virtualActionsRef.current;
        if (vAct.interactPulse) {
          justPressedInteract = true;
          vAct.interactPulse = false;
        }
        if (vAct.shedHuskPulse) {
          justPressedShed = true;
          vAct.shedHuskPulse = false;
        }

        const deathsInRoom = currentProps.telemetry.deathsPerChamber[def.index] || 0;
        const roomSpan = player.exitCurrentX - def.spawnX;
        const roomNormX = THREE.MathUtils.clamp(
          (player.x - def.spawnX) / (Math.abs(roomSpan) < 0.5 ? 1 : roomSpan),
          0,
          1
        );

        const wantsPoker =
          heldKeys.has('ShiftLeft') || heldKeys.has('ShiftRight') || vAct.pokerHeld;
        const uiMutation = rageEngine.updateFrame(
          dt,
          wantsPoker,
          def.index,
          roomNormX,
          deathsInRoom,
          currentProps.telemetry
        );

        const pokerActive = rageEngine.isPokerActive();
        const franticCadence = rageEngine.isFranticCadence();
        const perceivedRage = rageEngine.getPerceivedRage();
        const trapFrustration = rageEngine.getTrapFrustrationLevel();
        const trapsSlowed = rageEngine.areTrapsSlowedByBluff();
        const trapsPrefired = rageEngine.areTrapsPrefiredByBluff();

        soundEngine.setPsychologicalState(perceivedRage, pokerActive);

        // Dynamically activate/retract Frustration-Spawned, Habit-Snare & Switch-Disarmed Traps
        let newlySpawnedTier: 0 | 1 | 2 = 0;

        for (const sp of spikeRuntimes) {
          if (sp.spawnGraceTimer && sp.spawnGraceTimer > 0) {
            sp.spawnGraceTimer = Math.max(0, sp.spawnGraceTimer - dt);
          }

          if (sp.permanentlyDisarmed) {
            sp.active = false;
          } else if (sp.isHabitSnare) {
            // Fooling the Devil with a calm bluff (trapFrustration === 0) retracts Habit Snares too!
            sp.active = trapFrustration > 0;
            if (sp.active) sp.group.visible = true;
          } else if (sp.def.minRageToActivate) {
            const shouldBeActive = trapFrustration >= sp.def.minRageToActivate;
            if (shouldBeActive && !sp.active) {
              sp.active = true;
              sp.group.visible = true;
              if (!sp.announcedThisRoom) {
                sp.announcedThisRoom = true;
                currentProps.telemetry.rageTrapsSpawned += 1;
                newlySpawnedTier = sp.def.minRageToActivate >= 50 ? 2 : 1;
              }
            } else if (!shouldBeActive && sp.active) {
              sp.active = false;
            }
          }

          if (sp.def.minRageToActivate || sp.permanentlyDisarmed || sp.isHabitSnare) {
            const targetSpikeY = sp.active ? sp.def.y : sp.def.y - sp.def.height - 0.15;
            sp.group.position.y = THREE.MathUtils.damp(sp.group.position.y, targetSpikeY, 10, dt);
            if (!sp.active && Math.abs(sp.group.position.y - targetSpikeY) < 0.03) {
              sp.group.visible = false;
            }
          }
        }

        for (const hz of hazardRuntimes) {
          if (hz.permanentlyDisarmed) {
            hz.active = false;
            hz.state = 'IDLE';
          } else if (hz.def.minRageToActivate) {
            const shouldBeActive = trapFrustration >= hz.def.minRageToActivate;
            if (shouldBeActive && !hz.active) {
              hz.active = true;
              hz.mesh.visible = true;
              hz.state = 'IDLE';
              if (!hz.announcedThisRoom) {
                hz.announcedThisRoom = true;
                currentProps.telemetry.rageTrapsSpawned += 1;
                newlySpawnedTier = hz.def.minRageToActivate >= 48 ? 2 : 1;
              }
            } else if (!shouldBeActive && hz.active) {
              hz.active = false;
              hz.state = 'IDLE';
            }
          }

          if (hz.def.minRageToActivate || hz.permanentlyDisarmed) {
            if (!hz.active) {
              const hiddenTopY = hz.def.y + 3.2;
              hz.currentBottomY = THREE.MathUtils.damp(hz.currentBottomY, hiddenTopY, 8, dt);
              hz.mesh.position.y = hz.currentBottomY;
              if (Math.abs(hz.currentBottomY - hiddenTopY) < 0.05) {
                hz.mesh.visible = false;
              }
            } else if (hz.state === 'IDLE') {
              hz.currentBottomY = THREE.MathUtils.damp(hz.currentBottomY, hz.def.y, 8, dt);
              hz.mesh.position.y = hz.currentBottomY;
            }
          }
        }

        if (newlySpawnedTier === 1 || newlySpawnedTier === 2) {
          soundEngine.playTrapSnap();
          currentProps.onEmitDialogue({
            id: `rage_trap_${Date.now()}`,
            speaker: 'DEVIL',
            text: getFrustrationTrapTaunt(
              newlySpawnedTier,
              rageEngine.getRecentKeyCadenceMs()
            ),
            durationMs: 4800,
          });
        }

        // Animate 3D Watching Brass Eyes
        for (let i = 0; i < watchingEyes.length; i++) {
          const eye = watchingEyes[i];
          if (pokerActive || trapsPrefired) {
            _eyeLookTarget.set(
              eye.root.position.x + Math.sin(elapsed * 1.4 + i) * 3.0,
              eye.root.position.y + Math.cos(elapsed * 1.1 + i) * 1.5,
              3.5
            );
          } else {
            _eyeLookTarget.set(player.x, player.y + 1.0, 2.8);
          }
          eye.eyeballPivot.lookAt(_eyeLookTarget);

          const targetPupilScale = franticCadence ? 1.45 : pokerActive ? 0.65 : 1.0;
          const curScale = THREE.MathUtils.damp(eye.pupilMesh.scale.x, targetPupilScale, 10, dt);
          eye.pupilMesh.scale.set(curScale, 1, curScale);
          eye.irisMat.emissiveIntensity = franticCadence ? 2.4 : pokerActive ? 0.35 : 1.2;
        }

        const pitySwitchPressed = switchRuntimes.some(
          (s) => s.def.id === 'l6_pity_switch' && s.pressed
        );
        const pityUnlocked =
          vAct.pityActivatedForChamber === def.index || pitySwitchPressed;

        for (const pr of platformRuntimes) {
          if (pr.def.kind === 'PITY_BRIDGE' && pityUnlocked && !pr.visibleSolid) {
            pr.visibleSolid = true;
            pr.mesh.visible = true;
            currentProps.telemetry.pityPathsTaken += 1;
            soundEngine.playSwitchClick(true);
            currentProps.onEmitDialogue({
              id: `pity_${def.index}`,
              speaker: 'DEVIL',
              text: 'Mercy bridge lowered. Even in this rebirth, you take the easy road when offered.',
              durationMs: 4200,
            });
          }
        }

        if (player.deathBannerTimer > 0) {
          player.deathBannerTimer = Math.max(0, player.deathBannerTimer - dt);
          if (player.deathBannerTimer <= 0) player.deathBannerText = null;
        }
        if (player.winBannerTimer > 0) {
          player.winBannerTimer = Math.max(0, player.winBannerTimer - dt);
          if (player.winBannerTimer <= 0) player.winBannerText = null;
        }

        if (player.freezeTimer > 0) {
          player.freezeTimer = Math.max(0, player.freezeTimer - dt);
        } else {
          if (justPressedShed) {
            justPressedShed = false;
            triggerDeathOrSacrifice('Voluntary Husk Shed', def);
          } else {
            const inReverseZone = Boolean(
              def.reverseZone &&
                player.x >= def.reverseZone.minX &&
                player.x <= def.reverseZone.minX + (def.reverseZone.maxX - def.reverseZone.minX)
            );
            const reverseMultiplier = inReverseZone && !pokerActive ? -1 : 1;

            const rawLeft = heldKeys.has('KeyA') || heldKeys.has('ArrowLeft') ? 1 : 0;
            const rawRight = heldKeys.has('KeyD') || heldKeys.has('ArrowRight') ? 1 : 0;
            const moveDir = (rawRight - rawLeft) * reverseMultiplier;

            // Track unbroken continued steps / sustained sprint in one direction!
            if (moveDir !== 0 && moveDir === player.continuousRunDir && Math.abs(player.vx) > MOVE_SPEED * 0.7) {
              player.continuousRunTimer += dt;
            } else {
              player.continuousRunTimer = 0;
              player.continuousRunDir = moveDir;
            }

            const nearHazard = def.hazards.some((hz) => Math.abs(player.x - hz.x) < 3.4);
            if (moveDir !== 0 && moveDir !== prevMoveDir) {
              if (prevMoveDir !== 0) {
                if (nearHazard && !pokerActive) {
                  rageEngine.recordDirectionFlipNearHazard(currentProps.telemetry);
                }
                currentProps.telemetry.strategyShifts += 1;
              }
              if (moveDir > 0) currentProps.telemetry.rightRouteChoices += 1;
              else currentProps.telemetry.leftRouteChoices += 1;
              prevMoveDir = moveDir;
            }

            if (Math.abs(player.vx) > MOVE_SPEED * 0.84 && !pokerActive) {
              rageEngine.recordRush(currentProps.telemetry);
            }

            const targetVx = moveDir * MOVE_SPEED;
            const accel = player.grounded ? 38 : 25;
            player.vx = THREE.MathUtils.damp(player.vx, targetVx, accel, dt);
            if (Math.abs(moveDir) > 0) {
              player.facing = moveDir > 0 ? 1 : -1;
            }

            if (player.grounded) {
              player.coyoteTimer = 0.12;
            } else {
              player.coyoteTimer = Math.max(0, player.coyoteTimer - dt);
            }

            if (justPressedJump) {
              player.jumpBufferTimer = 0.14;
              justPressedJump = false;
            } else {
              player.jumpBufferTimer = Math.max(0, player.jumpBufferTimer - dt);
            }

            let playerDidJumpThisFrame = false;
            if (player.jumpBufferTimer > 0 && player.coyoteTimer > 0) {
              // Record takeoff habit spot before lifting off!
              const takeoffPlat = platformRuntimes.find(
                (pr) =>
                  pr.visibleSolid &&
                  Math.abs(player.x - pr.currentX) <= pr.def.width * 0.5 &&
                  Math.abs(player.y - pr.currentY) <= 0.22
              );
              if (takeoffPlat) {
                recordFootprintSpot(
                  player.x,
                  takeoffPlat.currentY,
                  takeoffPlat,
                  def,
                  pokerActive,
                  trapFrustration
                );
              }

              player.vy = JUMP_IMPULSE;
              player.grounded = false;
              player.coyoteTimer = 0;
              player.jumpBufferTimer = 0;
              player.squashY = 1.24;
              playerDidJumpThisFrame = true;
              soundEngine.playJump();
              rageEngine.recordJump(Math.abs(player.vx) > 4.5, currentProps.telemetry);

              for (const pr of platformRuntimes) {
                const distToPlat = Math.abs(player.x - pr.def.x);
                if (pr.def.kind === 'DISAPPEARING' && distToPlat < 4.2 && pr.visibleSolid) {
                  if (pokerActive || trapsPrefired) {
                    currentProps.telemetry.predictionsDodged += 1;
                  } else {
                    pr.visibleSolid = false;
                    pr.collapsedTimer = 1.65;
                    (pr.mesh.material as THREE.MeshStandardMaterial).opacity = 0.14;
                    currentProps.telemetry.predictedMovesPunished += 1;
                    soundEngine.playUIGlitchTick();
                  }
                } else if (pr.def.kind === 'CADENCE_RECOIL' && distToPlat < 4.6) {
                  if (pokerActive || trapsPrefired) {
                    currentProps.telemetry.predictionsDodged += 1;
                  } else if (
                    franticCadence ||
                    (trapFrustration >= 34 && player.continuousRunTimer >= 0.52) ||
                    (perceivedRage > 38 && Math.abs(player.vx) > 5.3)
                  ) {
                    pr.recoilHoldTimer = 1.6;
                    player.lastRecoilPenaltyMs = performance.now();
                    currentProps.telemetry.predictedMovesPunished += 1;
                    soundEngine.playTrapSnap();
                  }
                }
              }
            }

            if (justReleasedJump) {
              if (player.vy > 4.5) {
                player.vy *= 0.56;
              }
              justReleasedJump = false;
            }

            // Husks movement & passive decay
            for (const h of localRoomHusks) {
              if (h.type !== HuskType.ORIGINAL) {
                h.stability -= dt / Math.max(8, h.maxLifetimeSec);
              }

              if (
                (h.type === HuskType.ECHO || h.type === HuskType.ORIGINAL) &&
                h.frames.length > 0
              ) {
                h.frameCursor = (h.frameCursor + dt * 30) % h.frames.length;
                const f = h.frames[Math.floor(h.frameCursor)];
                h.x = f.x;
                h.y = f.y;
                h.facing = f.facing;
              } else {
                if (h.type === HuskType.RIVAL) {
                  if (playerDidJumpThisFrame) {
                    if (!pokerActive && Math.abs(h.vy) < 0.05) {
                      h.vy = 10.6;
                    } else if (pokerActive) {
                      currentProps.telemetry.predictionsDodged += 1;
                    }
                  }
                } else if (h.type === HuskType.SABOTEUR) {
                  const dist = Math.abs(player.x - h.x);
                  if (
                    dist < 2.4 &&
                    !pokerActive &&
                    Math.abs(h.vy) < 0.05 &&
                    Math.random() < 0.045
                  ) {
                    h.vy = 7.4;
                  }
                }

                h.vy = Math.max(-18, h.vy + GRAVITY * dt);
                const prevHY = h.y;
                h.y += h.vy * dt;
                for (const pr of platformRuntimes) {
                  if (!pr.visibleSolid || pr.def.kind === 'GATE') continue;
                  const halfW = pr.def.width * 0.5;
                  if (h.x >= pr.currentX - halfW && h.x <= pr.currentX + halfW) {
                    if (prevHY >= pr.currentY - 0.15 && h.y <= pr.currentY) {
                      h.y = pr.currentY;
                      h.vy = 0;
                    }
                  }
                }
              }
            }

            // Switches (Permanent Small-Win Latches, Trap Cutters, Fuse Switches & Weight Plates)
            const activeSwitchIds = new Set<string>();
            for (const sw of switchRuntimes) {
              const halfW = sw.def.width * 0.5 + 0.36;
              const playerOn =
                Math.abs(player.x - sw.def.x) <= halfW &&
                Math.abs(player.y - sw.def.y) <= 0.42;
              const huskOn = localRoomHusks.some(
                (h) =>
                  h.stability > 0.05 &&
                  Math.abs(h.x - sw.def.x) <= halfW &&
                  Math.abs(h.y - sw.def.y) <= 0.42
              );

              if (sw.def.requiresWeight && huskOn) {
                for (const h of localRoomHusks) {
                  if (
                    h.type !== HuskType.ORIGINAL &&
                    Math.abs(h.x - sw.def.x) <= halfW &&
                    Math.abs(h.y - sw.def.y) <= 0.42
                  ) {
                    h.stability -= dt * 0.035;
                  }
                }
              }

              const nowPressed = sw.def.requiresWeight
                ? playerOn || huskOn
                : sw.latched ||
                  playerOn ||
                  (justPressedInteract &&
                    Math.abs(player.x - sw.def.x) < 1.45 &&
                    Math.abs(player.y - sw.def.y) < 1.1);

              if (!sw.def.requiresWeight && nowPressed && !sw.latched) {
                sw.latched = true;
                soundEngine.playMemoryChime();
                currentProps.telemetry.smallWinsClaimed =
                  (currentProps.telemetry.smallWinsClaimed || 0) + 1;

                if (sw.def.isHiddenCheckpointFuse) {
                  player.realCheckpointUnlocked = true;
                  if (def.hasFakeCheckpoint) {
                    player.checkpointX = def.hasFakeCheckpoint.x;
                    player.checkpointY = def.hasFakeCheckpoint.y;
                  }
                  if (fakeCheckpointOrbMat) {
                    fakeCheckpointOrbMat.color.setHex(0xfef08a);
                    fakeCheckpointOrbMat.emissive.setHex(0xf59e0b);
                    fakeCheckpointOrbMat.emissiveIntensity = 2.0;
                  }
                  rageEngine.addRage(-8, currentProps.telemetry, def.index, 'Disarmed Trap Lantern');
                  triggerWinToast(
                    sw.def.winMessage || 'SMALL VICTORY · Trap Conduit Cut — Lantern Safe!',
                    3.0
                  );
                  currentProps.onEmitDialogue({
                    id: `real_cp_fused_${def.index}`,
                    speaker: 'HOUSE',
                    text: 'COPPER CONDUIT SEVERED. THE LANTERN AHEAD IS NOW ANCHORED.',
                    durationMs: 3800,
                  });
                } else if (sw.def.disarmsHazardId) {
                  for (const hz of hazardRuntimes) {
                    if (hz.def.id === sw.def.disarmsHazardId) {
                      hz.permanentlyDisarmed = true;
                      hz.active = false;
                    }
                  }
                  for (const sp of spikeRuntimes) {
                    if (sp.def.id === sw.def.disarmsHazardId) {
                      sp.permanentlyDisarmed = true;
                      sp.active = false;
                    }
                  }
                  rageEngine.addRage(-6, currentProps.telemetry, def.index, 'Disarmed Trap');
                  triggerWinToast(
                    sw.def.winMessage || 'SMALL VICTORY · Trap Permanently Disarmed',
                    2.8
                  );
                } else {
                  rageEngine.addRage(-5, currentProps.telemetry, def.index, 'Latched Mechanism');
                  triggerWinToast(
                    sw.def.winMessage || 'SMALL VICTORY · Mechanism Latched Open',
                    2.8
                  );
                }
              } else if (sw.def.requiresWeight && nowPressed !== sw.pressed) {
                soundEngine.playSwitchClick(nowPressed);
                if (nowPressed) {
                  triggerWinToast('WEIGHT PLATE HELD · Iron Gate Rising', 2.2);
                }
              }

              sw.pressed = nowPressed;
              sw.plunger.position.y = nowPressed ? 0.05 : 0.11;
              if (nowPressed) activeSwitchIds.add(sw.def.id);
            }

            // Platforms update (including rising BRIDGE, sliding GATE, COLLAPSING & TRAPDOOR)
            for (const pr of platformRuntimes) {
              if (pr.def.kind === 'GATE' && pr.def.linkedSwitchId) {
                const open = activeSwitchIds.has(pr.def.linkedSwitchId);
                pr.visibleSolid = !open;
                const targetMeshY = pr.visibleSolid
                  ? pr.def.y - pr.def.height * 0.5
                  : pr.def.y + pr.def.height * 0.72;
                pr.mesh.position.y = THREE.MathUtils.damp(pr.mesh.position.y, targetMeshY, 8, dt);
              } else if (pr.def.kind === 'BRIDGE' && pr.def.linkedSwitchId) {
                const raised = activeSwitchIds.has(pr.def.linkedSwitchId);
                pr.visibleSolid = raised;
                const targetMeshY = raised
                  ? pr.def.y - pr.def.height * 0.5
                  : pr.def.y - pr.def.height * 0.5 - 2.1;
                pr.mesh.position.y = THREE.MathUtils.damp(pr.mesh.position.y, targetMeshY, 8.5, dt);
                const bMat = pr.mesh.material as THREE.MeshStandardMaterial;
                bMat.opacity = THREE.MathUtils.damp(bMat.opacity, raised ? 1.0 : 0.35, 8.5, dt);
              } else if (pr.def.kind === 'DISAPPEARING' && !pr.def.linkedSwitchId) {
                if (pr.collapsedTimer > 0) {
                  pr.collapsedTimer = Math.max(0, pr.collapsedTimer - dt);
                  if (pr.collapsedTimer <= 0) {
                    pr.visibleSolid = true;
                    (pr.mesh.material as THREE.MeshStandardMaterial).opacity = 0.88;
                  }
                }
              } else if (pr.def.kind === 'CADENCE_RECOIL') {
                if (pr.recoilHoldTimer > 0) {
                  pr.recoilHoldTimer = Math.max(0, pr.recoilHoldTimer - dt);
                }
                const targetX =
                  pr.recoilHoldTimer > 0 && !trapsPrefired
                    ? pr.def.x + (pr.def.recoilDir ?? 1) * 1.52
                    : pr.def.x;
                pr.currentX = THREE.MathUtils.damp(pr.currentX, targetX, 12, dt);
                pr.mesh.position.x = pr.currentX;
              } else if (pr.def.kind === 'PARANOIA_SAFE') {
                if (pr.paranoiaRattleTimer > 0) {
                  pr.paranoiaRattleTimer = Math.max(0, pr.paranoiaRattleTimer - dt);
                  pr.mesh.position.x = pr.def.x + (Math.random() - 0.5) * 0.14;
                } else {
                  pr.mesh.position.x = pr.def.x;
                }
              } else if (
                pr.def.kind === 'COLLAPSING' ||
                pr.def.kind === 'PATIENT_OAK' ||
                pr.def.kind === 'TRAPDOOR'
              ) {
                if (pr.collapsedTimer > 0) {
                  pr.collapsedTimer = Math.max(0, pr.collapsedTimer - dt);
                  if (pr.collapsedTimer <= 0) {
                    pr.visibleSolid = true;
                    pr.mesh.visible = true;
                    pr.mesh.position.set(pr.def.x, pr.def.y - pr.def.height * 0.5, 0);
                  }
                } else if (pr.shakeTimer > 0) {
                  pr.shakeTimer -= dt;
                  pr.mesh.position.x =
                    pr.def.x +
                    (Math.random() - 0.5) * (pr.def.kind === 'TRAPDOOR' ? 0.08 : 0.16);
                  if (pr.shakeTimer <= 0) {
                    pr.visibleSolid = false;
                    pr.mesh.visible = false;
                    pr.collapsedTimer = pr.def.kind === 'TRAPDOOR' ? 2.6 : 2.9;
                    if (pr.def.kind === 'TRAPDOOR') {
                      player.lastTrapdoorBetrayalMs = performance.now();
                      currentProps.telemetry.fakeProgressRegressions += 1;
                    }
                    soundEngine.playTrapSnap();
                  }
                }
              }
            }

            // Horizontal sweep
            player.x += player.vx * dt;
            player.x = THREE.MathUtils.clamp(
              player.x,
              def.boundsMinX + PLAYER_WIDTH * 0.5,
              def.boundsMaxX - PLAYER_WIDTH * 0.5
            );

            for (const pr of platformRuntimes) {
              if (!pr.visibleSolid) continue;
              const pTop = pr.currentY;
              const pBottom = pTop - pr.def.height;
              const halfSpan = (pr.def.width + PLAYER_WIDTH) * 0.5;
              if (player.y + 0.1 < pTop && player.y + PLAYER_HEIGHT > pBottom) {
                const dx = player.x - pr.currentX;
                if (Math.abs(dx) < halfSpan) {
                  player.x = pr.currentX + Math.sign(dx || 1) * halfSpan;
                  player.vx = 0;
                }
              }
            }

            for (const h of localRoomHusks) {
              if (h.type !== HuskType.BODY && h.type !== HuskType.SABOTEUR) continue;
              if (Math.abs(player.y - h.y) < 0.65) {
                const minSep = (PLAYER_WIDTH + h.width) * 0.5;
                const dx = h.x - player.x;
                if (Math.abs(dx) < minSep && Math.abs(dx) > 0.001) {
                  const push = (minSep - Math.abs(dx)) * Math.sign(dx);
                  h.x = THREE.MathUtils.clamp(
                    h.x + push * 0.85,
                    def.boundsMinX + 0.7,
                    def.boundsMaxX - 0.7
                  );
                  player.x -= push * 0.15;
                }
              }
            }

            // Vertical sweep
            const wasGroundedBeforeSweep = player.grounded;
            player.vy = Math.max(-21, player.vy + GRAVITY * dt);
            const prevY = player.y;
            let nextY = player.y + player.vy * dt;
            let landedThisFrame = false;
            let stoodOnPlatform: PlatformRuntime | null = null;
            let stoodOnHuskObj: HuskEntity | null = null;

            if (player.vy <= 0) {
              for (const pr of platformRuntimes) {
                if (!pr.visibleSolid) continue;
                const halfSpan = (pr.def.width + PLAYER_WIDTH) * 0.5 - 0.03;
                if (Math.abs(player.x - pr.currentX) <= halfSpan) {
                  if (prevY >= pr.currentY - 0.18 && nextY <= pr.currentY) {
                    nextY = pr.currentY;
                    if (!player.grounded && player.vy < -3.5) {
                      soundEngine.playLand(Math.min(1, Math.abs(player.vy) / 14));
                      player.squashY = 0.82;
                    }
                    player.vy = 0;
                    landedThisFrame = true;
                    stoodOnPlatform = pr;
                  }
                }
              }

              for (const h of localRoomHusks) {
                if (h.stability <= 0.02) continue;
                const hTop = h.y + h.height;
                const halfSpan = (h.width + PLAYER_WIDTH) * 0.5 - 0.02;
                if (Math.abs(player.x - h.x) <= halfSpan) {
                  if (prevY >= hTop - 0.22 && nextY <= hTop) {
                    nextY = hTop;
                    if (!player.grounded) {
                      soundEngine.playLand(0.4);
                      player.squashY = 0.86;
                      currentProps.telemetry.husksSteppedOn += 1;
                    }
                    player.vy = 0;
                    landedThisFrame = true;
                    stoodOnHuskObj = h;
                  }
                }
              }
            } else {
              for (const pr of platformRuntimes) {
                if (!pr.visibleSolid || pr.def.height < 0.4) continue;
                const pBottom = pr.currentY - pr.def.height;
                const halfSpan = (pr.def.width + PLAYER_WIDTH) * 0.5 - 0.06;
                if (
                  Math.abs(player.x - pr.currentX) <= halfSpan &&
                  prevY + PLAYER_HEIGHT <= pBottom + 0.12 &&
                  nextY + PLAYER_HEIGHT >= pBottom
                ) {
                  nextY = pBottom - PLAYER_HEIGHT;
                  player.vy = 0;
                }
              }
            }

            player.y = nextY;
            player.grounded = landedThisFrame;

            // Record landing habit spot if the player just landed on a solid platform!
            if (!wasGroundedBeforeSweep && landedThisFrame && stoodOnPlatform) {
              recordFootprintSpot(
                player.x,
                stoodOnPlatform.currentY,
                stoodOnPlatform,
                def,
                pokerActive,
                trapFrustration
              );
            }

            if (stoodOnHuskObj && stoodOnHuskObj.type !== HuskType.ORIGINAL) {
              stoodOnHuskObj.stability -= dt * 0.46;
            }

            const survivingHusks: HuskEntity[] = [];
            let huskDiedThisTick = false;
            for (const h of localRoomHusks) {
              if (h.stability <= 0) {
                huskDiedThisTick = true;
                soundEngine.playHuskDissolve();
                currentProps.telemetry.husksDecayed += 1;
                if (stoodOnHuskObj && stoodOnHuskObj.id === h.id) {
                  currentProps.telemetry.husksCollapsedUnderfoot += 1;
                  player.lastHuskCollapseMs = performance.now();
                  player.grounded = false;
                }
              } else {
                survivingHusks.push(h);
              }
            }

            if (huskDiedThisTick) {
              localRoomHusks = survivingHusks;
              syncHuskMeshes();
            }

            // Anti-softlock Husk reformation in rooms with a preset BODY Husk (Levels 1 & 3)
            const presetBodyDef = def.presetHusks?.find((ph) => ph.type === HuskType.BODY);
            if (presetBodyDef && localRoomHusks.length === 0) {
              presetBodyReformationTimer += dt;
              if (presetBodyReformationTimer >= 3.8) {
                presetBodyReformationTimer = 0;
                localRoomHusks.push({
                  id: `preset_${def.index}_reformed_${Date.now()}`,
                  chamberIndex: def.index,
                  type: HuskType.BODY,
                  x: presetBodyDef.x,
                  y: presetBodyDef.y,
                  vx: 0,
                  vy: 0,
                  width: presetBodyDef.width,
                  height: presetBodyDef.height,
                  facing: presetBodyDef.facing,
                  causeOfDeath: 'Reformed Ash',
                  frames: [],
                  frameCursor: 0,
                  stability: 0.92,
                  maxLifetimeSec: presetBodyDef.maxLifetimeSec,
                  isSynthetic: true,
                });
                syncHuskMeshes();
              }
            } else {
              presetBodyReformationTimer = 0;
            }

            if (player.grounded && Math.abs(player.vx) > 1.2) {
              player.stepDistAccum += Math.abs(player.vx) * dt;
              if (player.stepDistAccum >= 1.95) {
                player.stepDistAccum = 0;
                soundEngine.playFootstep();
              }
            }

            // Platform reactions: crisp COLLAPSING (0.15s), unspoken TRAPDOOR (0.095s), & Patient Oak!
            const roomOak = platformRuntimes.find((p) => p.def.kind === 'PATIENT_OAK');

            if (stoodOnPlatform) {
              if (stoodOnPlatform.def.kind === 'COLLAPSING' && stoodOnPlatform.shakeTimer <= 0) {
                const baseShake = franticCadence ? 0.085 : 0.15;
                stoodOnPlatform.shakeTimer = trapsSlowed ? baseShake * 1.65 : baseShake;
              } else if (
                stoodOnPlatform.def.kind === 'TRAPDOOR' &&
                stoodOnPlatform.shakeTimer <= 0
              ) {
                if (pokerActive) {
                  currentProps.telemetry.predictionsDodged += 1;
                } else {
                  stoodOnPlatform.shakeTimer = trapsSlowed ? 0.17 : 0.095;
                }
              } else if (stoodOnPlatform.def.kind === 'PARANOIA_SAFE') {
                if (stoodOnPlatform.paranoiaRattleTimer <= 0 && Math.abs(player.vx) > 0.5) {
                  stoodOnPlatform.paranoiaRattleTimer = 0.35;
                  soundEngine.playUIGlitchTick();
                }
              } else if (stoodOnPlatform.def.kind === 'PATIENT_OAK') {
                if (!player.patientOakLocked && !pokerActive && stoodOnPlatform.shakeTimer <= 0) {
                  stoodOnPlatform.shakeTimer = 0.12;
                }
              } else if (
                roomOak &&
                !player.patientOakLocked &&
                Math.abs(player.x - roomOak.def.x) < 5.8 &&
                Math.abs(player.vx) < 0.45
              ) {
                player.calmPauseBeforeOakTimer += dt;
                if (player.calmPauseBeforeOakTimer >= 0.55) {
                  player.patientOakLocked = true;
                  soundEngine.playSwitchClick(true);
                  triggerWinToast('STEADY BREATH · Patient Oak Locked Solid', 2.2);
                }
              }
            }

            const nearDrop =
              !stoodOnHuskObj && player.grounded && Math.abs(player.vx) < 0.4 && nearHazard;
            if (nearDrop) {
              player.hesitationTimer += dt;
              if (player.hesitationTimer > 1.35 && !player.wasNearLedge) {
                player.wasNearLedge = true;
                if (!pokerActive) {
                  rageEngine.recordHesitation(currentProps.telemetry);
                }
              }
            } else {
              player.hesitationTimer = 0;
              player.wasNearLedge = false;
            }

            if (habitSignMesh) {
              const latestHabit = rageEngine.getDominantHabitSummary(currentProps.telemetry);
              if (latestHabit !== lastHabitSignString) {
                lastHabitSignString = latestHabit;
                const mat = habitSignMesh.material as THREE.MeshStandardMaterial;
                if (mat.map) mat.map.dispose();
                mat.map = createSignPlaqueTexture(latestHabit, '#fbbf24', '#1b1412', maxAniso);
                mat.needsUpdate = true;
              }
            }

            // Earned Mid-Level Golden Anchor Checkpoint
            if (
              def.safeCheckpoint &&
              !player.safeCheckpointClaimed &&
              Math.abs(player.x - def.safeCheckpoint.x) < 0.95 &&
              Math.abs(player.y - def.safeCheckpoint.y) < 1.25
            ) {
              player.safeCheckpointClaimed = true;
              player.realCheckpointUnlocked = true;
              player.checkpointX = def.safeCheckpoint.x;
              player.checkpointY = def.safeCheckpoint.y;
              if (safeCheckpointOrbMat) {
                safeCheckpointOrbMat.color.setHex(0xffffff);
                safeCheckpointOrbMat.emissive.setHex(0xfbbf24);
                safeCheckpointOrbMat.emissiveIntensity = 2.2;
              }
              soundEngine.playMemoryChime();
              currentProps.telemetry.smallWinsClaimed =
                (currentProps.telemetry.smallWinsClaimed || 0) + 1;
              rageEngine.addRage(-7, currentProps.telemetry, def.index, 'Mid-Level Checkpoint');
              triggerWinToast('ANCHOR LIT · Mid-Level Checkpoint Saved', 2.8);
            }

            // Wired Emerald Fake/Disarmable Checkpoint (Levels 4 & 7)
            if (
              def.hasFakeCheckpoint &&
              Math.abs(player.x - def.hasFakeCheckpoint.x) < 0.85 &&
              Math.abs(player.y - def.hasFakeCheckpoint.y) < 1.2
            ) {
              if (!player.realCheckpointUnlocked) {
                player.fakeCheckpointTouched = true;
                currentProps.telemetry.trapsTriggered.push('Fake Emerald Lantern');
                triggerDeathOrSacrifice('Fake Sanctuary Lantern', def);
              } else if (!player.fakeCheckpointTouched) {
                player.fakeCheckpointTouched = true;
                soundEngine.playMemoryChime();
                triggerWinToast('ANCHOR LIT · Disarmed Lantern Checkpoint Saved', 2.8);
              }
            }

            if (
              def.falseSunriseShutter &&
              !falseShutterSlammed &&
              player.x >= 8.3 &&
              player.y >= 0.3
            ) {
              falseShutterSlammed = true;
              soundEngine.playTrapSnap();
              currentProps.telemetry.fakeProgressRegressions += 1;
              currentProps.telemetry.chamberNumberMutations += 1;
              if (falseSunLight) {
                falseSunLight.intensity = 0.15;
                falseSunLight.color.setHex(0xef4444);
              }
              currentProps.onEmitDialogue({
                id: 'false_sunrise_slam',
                speaker: 'DEVIL',
                text: 'Almost bought that warm light, didn’t you? Climb the upper ledge—your past life isn’t paid off yet.',
                durationMs: 5000,
              });
            }

            if (falseSunArchShutterMesh && falseShutterSlammed) {
              falseSunArchShutterMesh.position.y = THREE.MathUtils.damp(
                falseSunArchShutterMesh.position.y,
                1.85,
                16,
                dt
              );
            }

            if (def.ghost && !player.ghostWhisperedThisRoom) {
              const gDist = Math.hypot(player.x - def.ghost.x, player.y + 1.0 - def.ghost.y);
              if (gDist < 3.3) {
                player.ghostWhisperedThisRoom = true;
                player.ghostEncounterTime = elapsed;
                currentProps.telemetry.ghostEncounters += 1;
                soundEngine.playGhostWhisper();
                currentProps.onEmitDialogue({
                  id: `ghost_${def.index}`,
                  speaker: 'GHOST',
                  text: def.ghost.hintText,
                  durationMs: 5000,
                });
              }
            } else if (
              def.ghost &&
              player.ghostWhisperedThisRoom &&
              !player.ghostEvaluated &&
              elapsed - player.ghostEncounterTime > 2.2
            ) {
              player.ghostEvaluated = true;
              const rec = def.ghost.recommendedAction;
              const rushed = Math.abs(player.vx) > 5.0;
              const dropped = player.y < 0;
              const followed =
                (rec === 'RUSH' && rushed) ||
                (rec === 'WAIT' && !rushed) ||
                (rec === 'DROP' && dropped) ||
                (rec === 'CLIMB' && !dropped);
              if (followed) currentProps.telemetry.ghostFollowed += 1;
              else currentProps.telemetry.ghostDefied += 1;
            }

            // Moving Hazards: Habit Crushers (now ALSO punish unbroken continuous sprints!) & Predictive Pendulums
            for (const hz of hazardRuntimes) {
              if (!hz.active) continue;

              const isRageTrap = Boolean(hz.def.minRageToActivate);

              if (hz.def.kind === 'HABIT_CRUSHER') {
                const sensorHalfW =
                  (hz.def.width + PLAYER_WIDTH) * (franticCadence ? 0.76 : 0.56);
                const underCrusher = Math.abs(player.x - hz.def.x) < sensorHalfW;
                const sustainedRunThreshold = trapFrustration >= 38 ? 0.44 : 0.68;
                const punishedContinuousSteps =
                  player.continuousRunTimer >= sustainedRunThreshold &&
                  Math.abs(player.vx) > MOVE_SPEED * 0.76;

                if (
                  hz.state === 'IDLE' &&
                  underCrusher &&
                  (playerDidJumpThisFrame || punishedContinuousSteps)
                ) {
                  if (pokerActive) {
                    currentProps.telemetry.predictionsDodged += 1;
                  } else {
                    hz.state = 'SLAMMING';
                    hz.hitPlayerDuringSlam = false;
                    currentProps.telemetry.predictedMovesPunished += 1;
                    soundEngine.playTrapSnap();
                  }
                }
              } else if (hz.def.kind === 'BAIT_PENDULUM') {
                const dx = hz.def.x - player.x;
                const earlyBaitTriggered =
                  trapsPrefired && Math.abs(dx) < 4.8 && Math.abs(dx) > 1.8;
                const leadRange =
                  player.continuousRunTimer >= 0.6 || trapFrustration >= 40 ? 3.85 : 3.15;
                const normalSprintTriggered =
                  Math.abs(dx) < leadRange &&
                  Math.abs(dx) > 0.45 &&
                  Math.sign(player.vx) === Math.sign(dx) &&
                  Math.abs(player.vx) > 4.1;

                if (hz.state === 'IDLE' && (earlyBaitTriggered || normalSprintTriggered)) {
                  if (pokerActive && !earlyBaitTriggered) {
                    currentProps.telemetry.predictionsDodged += 1;
                  } else {
                    hz.state = 'SLAMMING';
                    hz.wasTriggeredBySprint = true;
                    hz.hitPlayerDuringSlam = false;
                    soundEngine.playTrapSnap();
                  }
                }
              }

              if (hz.state === 'SLAMMING') {
                const floorY = hz.def.triggerHeight ?? 0;
                const baseSlam = hz.def.kind === 'BAIT_PENDULUM' ? 28.5 : 26;
                const slamSpeed = trapsSlowed ? baseSlam * 0.62 : baseSlam;
                hz.currentBottomY = Math.max(floorY, hz.currentBottomY - slamSpeed * dt);
                hz.mesh.position.y = hz.currentBottomY;

                if (
                  Math.abs(player.x - hz.def.x) < (hz.def.width + PLAYER_WIDTH) * 0.44 &&
                  player.y + PLAYER_HEIGHT > hz.currentBottomY &&
                  player.y < hz.currentBottomY + hz.def.height
                ) {
                  hz.hitPlayerDuringSlam = true;
                  triggerDeathOrSacrifice(
                    isRageTrap
                      ? 'Frustration Trap'
                      : hz.def.kind === 'BAIT_PENDULUM'
                        ? 'Baited Pendulum'
                        : 'Habit Crusher',
                    def
                  );
                }

                if (hz.currentBottomY <= floorY + 0.02) {
                  if (
                    hz.def.kind === 'BAIT_PENDULUM' &&
                    hz.wasTriggeredBySprint &&
                    !hz.hitPlayerDuringSlam
                  ) {
                    currentProps.telemetry.trapsBaitedSuccessfully += 1;
                    hz.wasTriggeredBySprint = false;
                    if (!hz.rewardedBaitWin) {
                      hz.rewardedBaitWin = true;
                      currentProps.telemetry.smallWinsClaimed =
                        (currentProps.telemetry.smallWinsClaimed || 0) + 1;
                      triggerWinToast('TRAP OUTSMARTED · Blade Missed in Empty Air', 2.0);
                    }
                  }
                  hz.state = 'RETRACTING';
                  hz.timer = trapsSlowed ? 1.55 : hz.def.kind === 'BAIT_PENDULUM' ? 1.15 : 0.55;
                }
              } else if (hz.state === 'RETRACTING') {
                if (hz.timer > 0) {
                  hz.timer -= dt;
                } else {
                  const retractSpeed =
                    trapsSlowed ? 2.8 : hz.def.kind === 'BAIT_PENDULUM' ? 4.4 : 5.8;
                  hz.currentBottomY = Math.min(hz.def.y, hz.currentBottomY + retractSpeed * dt);
                  hz.mesh.position.y = hz.currentBottomY;
                  if (hz.currentBottomY >= hz.def.y - 0.02) {
                    hz.state = 'IDLE';
                  }
                }
              }
            }

            // Spikes check (including dynamic Habit Snares after their 0.55s sprout animation)
            for (const sp of spikeRuntimes) {
              if (!sp.active || (sp.spawnGraceTimer && sp.spawnGraceTimer > 0)) continue;
              const hz = sp.def;
              const inX = Math.abs(player.x - hz.x) < (hz.width + PLAYER_WIDTH * 0.45) * 0.5;
              const inY = player.y < hz.y + hz.height - 0.08 && player.y + PLAYER_HEIGHT > hz.y;
              if (inX && inY && !stoodOnHuskObj) {
                triggerDeathOrSacrifice(
                  sp.isHabitSnare
                    ? 'Habit Snare'
                    : hz.minRageToActivate
                      ? 'Frustration Trap'
                      : `Level ${def.levelNumber} Spikes`,
                  def
                );
                break;
              }
            }

            if (player.y < -6.0) {
              triggerDeathOrSacrifice('Abyssal Fall', def);
            }

            recordAccum += dt;
            if (recordAccum >= 0.033) {
              recordAccum = 0;
              recordedBuffer.push({
                x: player.x,
                y: player.y,
                vx: player.vx,
                vy: player.vy,
                facing: player.facing,
              });
              if (recordedBuffer.length > 120) recordedBuffer.shift();
            }

            // Flinching Doorway (supports 1 or 2 flinches across hidden trapdoors!)
            const maxExitDodges =
              typeof def.exitMovesOnApproach === 'number'
                ? def.exitMovesOnApproach
                : def.exitMovesOnApproach
                  ? 1
                  : 0;

            if (maxExitDodges > 0 && player.exitDodgeCount < maxExitDodges) {
              const distExit = Math.hypot(player.x - player.exitCurrentX, player.y - def.exitY);
              if (distExit < 1.95) {
                player.exitDodgeCount += 1;
                const retreatDir = def.exitX < def.spawnX ? -1 : 1;
                player.exitCurrentX += retreatDir * 1.95;
                currentProps.telemetry.fakeProgressRegressions += 1;
                soundEngine.playTrapSnap();
                currentProps.onEmitDialogue({
                  id: `exit_dodge_${def.index}_${player.exitDodgeCount}`,
                  speaker: 'DEVIL',
                  text:
                    player.exitDodgeCount >= 2
                      ? 'Still chasing blindly? Watch the floorboards beneath your boots!'
                      : 'Even the doorway flinches from who you used to be. Catch it—if the floor holds.',
                  durationMs: 3800,
                });
              }
            }

            if (exitArchGroup) {
              exitArchGroup.position.x = THREE.MathUtils.damp(
                exitArchGroup.position.x,
                player.exitCurrentX,
                10,
                dt
              );
            }

            const distToExit = Math.hypot(player.x - player.exitCurrentX, player.y - def.exitY);
            if (
              !player.chamberClearTriggered &&
              (distToExit < 0.98 || (distToExit < 1.65 && justPressedInteract))
            ) {
              justPressedInteract = false;
              player.chamberClearTriggered = true;

              if (def.isFinalCore) {
                if (!player.mirrorTriggered) {
                  player.mirrorTriggered = true;
                  soundEngine.playMemoryChime();
                  currentProps.onReachFinalMirror(def.clearedMemory);
                }
              } else if (def.triggersFakeWin && !vAct.fakeWinCompleted) {
                soundEngine.playFakeWinFanfare();
                currentProps.onTriggerFakeWin(def.clearedMemory);
              } else {
                soundEngine.playMemoryChime();
                currentProps.onClearChamber(def.index, def.clearedMemory, def.index + 1);
              }
            }

            justPressedInteract = false;
          }
        }

        // Player visuals
        player.squashY = THREE.MathUtils.damp(player.squashY, 1.0, 14, dt);
        const invScaleXZ = 1 / Math.sqrt(Math.max(0.5, player.squashY));
        playerRig.root.position.set(player.x, player.y, 0);
        playerRig.bodyVisual.scale.set(invScaleXZ, player.squashY, invScaleXZ);
        const targetRotY = player.facing > 0 ? 0 : Math.PI;
        playerRig.bodyVisual.rotation.y = THREE.MathUtils.damp(
          playerRig.bodyVisual.rotation.y,
          targetRotY,
          16,
          dt
        );
        playerRig.lanternGroup.rotation.z =
          Math.sin(elapsed * 6) * 0.08 * (Math.abs(player.vx) / MOVE_SPEED);
        playerRig.lanternCoreMat.emissiveIntensity = player.lanternOn ? 2.1 : 0.15;

        const pokerMat = playerRig.pokerAuraMesh.material as THREE.MeshStandardMaterial;
        pokerMat.opacity = THREE.MathUtils.damp(
          pokerMat.opacity,
          pokerActive ? 0.34 : 0.0,
          12,
          dt
        );
        playerRig.pokerAuraMesh.rotation.y += dt * 1.4;
        playerRig.pokerAuraMesh.rotation.x += dt * 0.7;

        lanternLight.position.set(player.x + player.facing * 0.4, player.y + 1.25, 0.85);
        lanternLight.intensity = player.lanternOn ? 2.35 + Math.sin(elapsed * 7) * 0.12 : 0.2;

        // Husk meshes decay visuals
        for (const h of localRoomHusks) {
          const mesh = activeHuskMeshes.get(h.id);
          if (mesh) {
            const jitterX =
              h.stability < 0.55 ? (Math.random() - 0.5) * (0.55 - h.stability) * 0.16 : 0;
            mesh.position.set(h.x + jitterX, h.y, 0);
            mesh.rotation.y = h.facing > 0 ? 0 : Math.PI;

            const scaleY = 0.86 + Math.max(0, h.stability) * 0.14;
            mesh.scale.set(1, scaleY, 1);

            const targetOpacity =
              h.type === HuskType.ORIGINAL ? 1.0 : Math.max(0.18, 0.2 + h.stability * 0.8);

            mesh.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
                if (m && m.transparent) {
                  m.opacity = targetOpacity;
                }
              }
            });

            const halo = mesh.getObjectByName('huskHalo');
            if (halo) halo.rotation.z = elapsed * 1.8;
          }
        }

        if (ghostGroup && def.ghost) {
          ghostGroup.position.y = def.ghost.y + Math.sin(elapsed * 2.3) * 0.15;
          const r1 = ghostGroup.getObjectByName('ghostRing1');
          const r2 = ghostGroup.getObjectByName('ghostRing2');
          if (r1) r1.rotation.y = elapsed * 1.4;
          if (r2) r2.rotation.z = -elapsed * 1.8;
        }

        if (exitArchGroup && def.isFinalCore) {
          const refl = exitArchGroup.getObjectByName('mirrorReflection');
          if (refl) {
            const predictedX = player.x + player.vx * 0.22;
            const relX = THREE.MathUtils.clamp(
              (predictedX - player.exitCurrentX) * 0.26,
              -0.44,
              0.44
            );
            refl.position.x = THREE.MathUtils.damp(refl.position.x, relX, 8, dt);
          }
        }

        const parallaxX = currentProps.settings.cameraParallax ? mouseNormX * 0.6 : 0;
        const parallaxY = currentProps.settings.cameraParallax ? mouseNormY * 0.32 : 0;
        const clampedCamX = THREE.MathUtils.clamp(
          player.x + player.facing * 1.15 + parallaxX,
          def.boundsMinX + 4.8,
          def.boundsMaxX - 4.8
        );
        _camTargetPos.set(clampedCamX, Math.max(1.4, player.y + 1.85 + parallaxY), 13.6);
        camera.position.lerp(_camTargetPos, 1 - Math.exp(-6.5 * dt));
        _camLookAt.set(clampedCamX, Math.max(0.8, player.y + 1.15), -0.3);
        camera.lookAt(_camLookAt);

        hudEmitAccum += dt;
        if (hudEmitAccum >= 0.08) {
          hudEmitAccum = 0;

          let nearbyPrompt: string | null = null;
          if (Math.hypot(player.x - player.exitCurrentX, player.y - def.exitY) < 1.85) {
            nearbyPrompt = def.isFinalCore ? '[E] Look Into the Mirror' : '[E] Complete Level';
          } else {
            const nearSw = switchRuntimes.find(
              (s) =>
                !s.latched &&
                Math.abs(player.x - s.def.x) < 1.55 &&
                Math.abs(player.y - s.def.y) < 1.1 &&
                s.def.label
            );
            if (nearSw?.def.label) {
              nearbyPrompt = nearSw.def.requiresWeight
                ? nearSw.def.label
                : `[E] ${nearSw.def.label}`;
            }
          }

          currentProps.onHUDTick({
            rageIndex: Math.round(perceivedRage),
            rageState: rageEngine.getPerceivedState(),
            pokerEnergy: Math.round(rageEngine.getPokerMeter()),
            pokerActive,
            uiMutation,
            nearbyPrompt,
            deathBanner: player.deathBannerText,
            winBanner: player.winBannerText,
          });
        }
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      unmounted = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearInputs);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('pointerdown', onPointerDown);

      clearGroup(chamberGroup);
      clearGroup(husksGroup);
      wallpaperTex.dispose();
      oakTex.dispose();
      stoneTex.dispose();
      shadowTex.dispose();
      envTex.dispose();
      moteGeo.dispose();
      moteMat.dispose();
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 w-full h-full overflow-hidden outline-none"
      tabIndex={0}
      aria-label="Deja Doom 3D Haunted Mansion Viewport"
    />
  );
};
