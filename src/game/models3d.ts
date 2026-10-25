import * as THREE from 'three';
import { HuskType } from '../types/game';

/**
 * Composite 3-12 part procedural 3D models with bottom-center pivots (y = 0 at feet/base)
 * and distinct roughness/metalness material contrast across primary, secondary, and accent parts.
 */

export interface PlayerModelRig {
  root: THREE.Group;
  bodyVisual: THREE.Group;
  lanternGroup: THREE.Group;
  lanternCoreMat: THREE.MeshStandardMaterial;
  pokerAuraMesh: THREE.Mesh;
}

export interface WatchingEyeRig {
  root: THREE.Group;
  eyeballPivot: THREE.Group;
  irisMat: THREE.MeshStandardMaterial;
  pupilMesh: THREE.Mesh;
}

export function buildPlayerModel(shadowTex: THREE.Texture, isSoftwareGl: boolean): PlayerModelRig {
  const root = new THREE.Group();
  const bodyVisual = new THREE.Group();
  root.add(bodyVisual);

  const shadowGeo = new THREE.PlaneGeometry(1.15, 0.85);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.55,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.position.y = 0.02;
  root.add(shadowMesh);

  // 1. Boots
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x181416, roughness: 0.85, metalness: 0.1 });
  const bootGeo = new THREE.BoxGeometry(0.24, 0.18, 0.32);
  const leftBoot = new THREE.Mesh(bootGeo, bootMat);
  leftBoot.position.set(-0.12, 0.09, 0.06);
  const rightBoot = new THREE.Mesh(bootGeo, bootMat);
  rightBoot.position.set(0.12, 0.09, -0.06);
  bodyVisual.add(leftBoot, rightBoot);

  // 2. Cloaked Mantle
  const cloakPoints = [
    new THREE.Vector2(0.34, 0.14),
    new THREE.Vector2(0.31, 0.55),
    new THREE.Vector2(0.25, 0.98),
    new THREE.Vector2(0.16, 1.18),
    new THREE.Vector2(0.0, 1.2),
  ];
  const cloakGeo = new THREE.LatheGeometry(cloakPoints, 18);
  const cloakMat = new THREE.MeshStandardMaterial({
    color: 0x23202b,
    roughness: 0.9,
    metalness: 0.08,
  });
  const cloak = new THREE.Mesh(cloakGeo, cloakMat);
  cloak.castShadow = !isSoftwareGl;
  cloak.receiveShadow = !isSoftwareGl;
  bodyVisual.add(cloak);

  // 3. Brass Shoulder Collar
  const collarGeo = new THREE.CylinderGeometry(0.2, 0.28, 0.16, 16);
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xb08a54,
    roughness: 0.32,
    metalness: 0.82,
  });
  const collar = new THREE.Mesh(collarGeo, brassMat);
  collar.position.y = 1.12;
  bodyVisual.add(collar);

  // 4. Hooded Head
  const headGeo = new THREE.SphereGeometry(0.21, 18, 16);
  const hoodMat = new THREE.MeshStandardMaterial({
    color: 0x1b1822,
    roughness: 0.82,
    metalness: 0.12,
  });
  const head = new THREE.Mesh(headGeo, hoodMat);
  head.position.y = 1.34;
  head.castShadow = !isSoftwareGl;
  bodyVisual.add(head);

  // 5 & 6. Glowing Faded-Ivory Eyes
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xf5efe2,
    emissive: 0xf2dfb3,
    emissiveIntensity: 1.4,
    roughness: 0.2,
  });
  const eyeGeo = new THREE.SphereGeometry(0.036, 10, 10);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(0.17, 1.36, 0.065);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeR.position.set(0.17, 1.36, -0.065);
  bodyVisual.add(eyeL, eyeR);

  // 7 & 8. Extended Brass Lantern Rig
  const lanternGroup = new THREE.Group();
  lanternGroup.position.set(0.38, 0.94, 0.14);
  bodyVisual.add(lanternGroup);

  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.26, 8), brassMat);
  rod.rotation.z = Math.PI / 2.4;
  rod.position.set(-0.1, 0.06, 0);
  lanternGroup.add(rod);

  const lanternCap = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.09, 10), brassMat);
  lanternCap.position.y = 0.08;
  lanternGroup.add(lanternCap);

  const lanternCoreMat = new THREE.MeshStandardMaterial({
    color: 0xffd28a,
    emissive: 0xf59e0b,
    emissiveIntensity: 2.1,
    roughness: 0.15,
  });
  const lanternCore = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.14, 10), lanternCoreMat);
  lanternCore.position.y = -0.02;
  lanternGroup.add(lanternCore);

  const lanternBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.04, 10), brassMat);
  lanternBase.position.y = -0.1;
  lanternGroup.add(lanternBase);

  // 9. Amethyst Poker Face Deflection Sphere
  const pokerGeo = new THREE.IcosahedronGeometry(0.88, 1);
  const pokerMat = new THREE.MeshStandardMaterial({
    color: 0x9333ea,
    emissive: 0x7e22ce,
    emissiveIntensity: 0.9,
    transparent: true,
    opacity: 0.0,
    wireframe: true,
    depthWrite: false,
  });
  const pokerAuraMesh = new THREE.Mesh(pokerGeo, pokerMat);
  pokerAuraMesh.position.y = 0.82;
  root.add(pokerAuraMesh);

  return { root, bodyVisual, lanternGroup, lanternCoreMat, pokerAuraMesh };
}

export function buildHuskModel(
  type: HuskType,
  shadowTex: THREE.Texture,
  isSoftwareGl: boolean
): THREE.Group {
  const group = new THREE.Group();

  const palette = {
    [HuskType.BODY]: { robe: 0x18151d, trim: 0x6e6252, glow: 0xd6cfc2, halo: false },
    [HuskType.ECHO]: { robe: 0x122630, trim: 0x38bdf8, glow: 0x7dd3fc, halo: true },
    [HuskType.SABOTEUR]: { robe: 0x291116, trim: 0xdc2626, glow: 0xf87171, halo: true },
    [HuskType.RIVAL]: { robe: 0x221330, trim: 0xa855f7, glow: 0xd8b4fe, halo: true },
    [HuskType.ORIGINAL]: { robe: 0x1b1710, trim: 0xeab308, glow: 0xfef08a, halo: true },
  }[type];

  const shadowGeo = new THREE.PlaneGeometry(1.1, 0.85);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMesh = new THREE.Mesh(
    shadowGeo,
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.5,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  );
  shadowMesh.position.y = 0.02;
  group.add(shadowMesh);

  // Transparent-enabled materials so weakening Husks visibly fade and fracture before vanishing!
  const plinthMat = new THREE.MeshStandardMaterial({
    color: palette.trim,
    roughness: 0.4,
    metalness: 0.65,
    transparent: true,
    opacity: 1.0,
  });
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.12, 0.66), plinthMat);
  plinth.position.y = 0.06;
  group.add(plinth);

  const robeMat = new THREE.MeshStandardMaterial({
    color: palette.robe,
    roughness: 0.88,
    metalness: 0.12,
    transparent: true,
    opacity: type === HuskType.ECHO ? 0.82 : 1.0,
  });
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 0.96, 14), robeMat);
  torso.position.y = 0.6;
  torso.castShadow = !isSoftwareGl;
  torso.receiveShadow = !isSoftwareGl;
  group.add(torso);

  const shoulderCap = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.1, 0.56), plinthMat);
  shoulderCap.position.y = 1.39;
  group.add(shoulderCap);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 14, 12), robeMat);
  head.position.y = 1.24;
  group.add(head);

  const eyeMat = new THREE.MeshStandardMaterial({
    color: palette.glow,
    emissive: palette.glow,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    transparent: true,
    opacity: 1.0,
  });
  const eyeGeo = new THREE.SphereGeometry(0.035, 8, 8);
  const eye1 = new THREE.Mesh(eyeGeo, eyeMat);
  eye1.position.set(0.15, 1.25, 0.06);
  const eye2 = new THREE.Mesh(eyeGeo, eyeMat);
  eye2.position.set(0.15, 1.25, -0.06);
  group.add(eye1, eye2);

  if (palette.halo) {
    const ringGeo = new THREE.TorusGeometry(0.32, 0.022, 8, 24);
    const ringMat = new THREE.MeshStandardMaterial({
      color: palette.trim,
      emissive: palette.trim,
      emissiveIntensity: 0.8,
      roughness: 0.25,
      metalness: 0.85,
      transparent: true,
      opacity: 1.0,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 1.52;
    ring.name = 'huskHalo';
    group.add(ring);

    if (type === HuskType.ORIGINAL) {
      const ring2 = new THREE.Mesh(ringGeo, ringMat);
      ring2.rotation.y = Math.PI / 3;
      ring2.position.y = 1.25;
      ring2.scale.setScalar(1.35);
      group.add(ring2);
    }
  }

  return group;
}

/**
 * Ambiguous Spectral Ghost Model — ZERO explicit truth/lie color giveaway!
 * Uses pale tarnished-silver / misty-bone luminescence so the player can NEVER tell
 * at a glance whether the Ghost is helping them or luring them into a trap.
 */
export function buildGhostModel(): THREE.Group {
  const group = new THREE.Group();
  const spectralCoreHex = 0xcbd5e1;
  const spectralRimHex = 0xe2e8f0;

  const coreMat = new THREE.MeshStandardMaterial({
    color: spectralRimHex,
    emissive: spectralCoreHex,
    emissiveIntensity: 1.35,
    roughness: 0.22,
  });
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.21, 18, 16), coreMat);
  group.add(core);

  const veilMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    transparent: true,
    opacity: 0.24,
    roughness: 0.55,
    depthWrite: false,
  });
  const veil = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.68, 14, 1, true), veilMat);
  veil.position.y = -0.25;
  veil.rotation.x = Math.PI;
  group.add(veil);

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0x9a8462,
    roughness: 0.35,
    metalness: 0.82,
  });
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.016, 8, 28), brassMat);
  ring1.name = 'ghostRing1';
  group.add(ring1);

  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.012, 8, 28), coreMat);
  ring2.rotation.x = Math.PI / 2.6;
  ring2.name = 'ghostRing2';
  group.add(ring2);

  // Fractured mask shard floating above
  const crest = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), brassMat);
  crest.position.y = 0.36;
  group.add(crest);

  return group;
}

/**
 * 3D Panopticon Watching Brass Eye embedded in the haunted house walls.
 * `eyeballPivot` faces +Z in local space so `eyeballPivot.lookAt(playerPos)`
 * makes every eye physically track the player's movement in real time!
 */
export function buildWatchingEyeModel(scale = 1.0): WatchingEyeRig {
  const root = new THREE.Group();
  root.scale.setScalar(scale);

  const brassBezelMat = new THREE.MeshStandardMaterial({
    color: 0xa17c43,
    roughness: 0.3,
    metalness: 0.88,
  });
  const socketIronMat = new THREE.MeshStandardMaterial({
    color: 0x121016,
    roughness: 0.8,
    metalness: 0.4,
  });

  // 1. Recessed wall socket
  const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.16, 20), socketIronMat);
  socket.rotation.x = Math.PI / 2;
  socket.position.z = -0.04;
  root.add(socket);

  // 2. Ornate brass bezel ring + 4 cardinal rivets
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.055, 10, 28), brassBezelMat);
  bezel.position.z = 0.03;
  root.add(bezel);

  const rivetGeo = new THREE.SphereGeometry(0.035, 8, 8);
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    const rivet = new THREE.Mesh(rivetGeo, brassBezelMat);
    rivet.position.set(Math.cos(angle) * 0.42, Math.sin(angle) * 0.42, 0.075);
    root.add(rivet);
  }

  // 3. Rotating Eyeball Pivot (+Z forward)
  const eyeballPivot = new THREE.Group();
  eyeballPivot.position.z = 0.02;
  root.add(eyeballPivot);

  const scleraMat = new THREE.MeshStandardMaterial({
    color: 0xdad2c4,
    emissive: 0x2b1d19,
    emissiveIntensity: 0.25,
    roughness: 0.24,
    metalness: 0.05,
  });
  const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.33, 18, 16), scleraMat);
  eyeballPivot.add(sclera);

  // 4. Glowing Amber-Crimson Iris facing +Z
  const irisMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    emissive: 0xb91c1c,
    emissiveIntensity: 1.25,
    roughness: 0.18,
  });
  const iris = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.155, 0.04, 18), irisMat);
  iris.rotation.x = Math.PI / 2;
  iris.position.z = 0.305;
  eyeballPivot.add(iris);

  // 5. Dilating Slit/Disc Pupil + Specular Glint
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x050406 });
  const pupilMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.078, 0.045, 14), pupilMat);
  pupilMesh.rotation.x = Math.PI / 2;
  pupilMesh.position.z = 0.312;
  eyeballPivot.add(pupilMesh);

  const glint = new THREE.Mesh(
    new THREE.SphereGeometry(0.026, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xfffbeb })
  );
  glint.position.set(0.055, 0.055, 0.33);
  eyeballPivot.add(glint);

  return { root, eyeballPivot, irisMat, pupilMesh };
}

export function buildExitArchModel(isFinalMirror: boolean, isSoftwareGl: boolean): THREE.Group {
  const group = new THREE.Group();

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x26222c,
    roughness: 0.82,
    metalness: 0.12,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: isFinalMirror ? 0xd4af37 : 0xa8824a,
    roughness: 0.28,
    metalness: 0.86,
  });

  const colGeo = new THREE.CylinderGeometry(0.18, 0.22, 2.5, 12);
  const colL = new THREE.Mesh(colGeo, stoneMat);
  colL.position.set(-0.78, 1.25, 0);
  colL.castShadow = !isSoftwareGl;
  const colR = new THREE.Mesh(colGeo, stoneMat);
  colR.position.set(0.78, 1.25, 0);
  colR.castShadow = !isSoftwareGl;
  group.add(colL, colR);

  const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.34, 0.56), brassMat);
  lintel.position.set(0, 2.58, 0);
  group.add(lintel);

  const crown = new THREE.Mesh(new THREE.ConeGeometry(1.15, 0.48, 4), stoneMat);
  crown.rotation.y = Math.PI / 4;
  crown.position.set(0, 2.98, 0);
  group.add(crown);

  if (isFinalMirror) {
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xcbd5e1,
      metalness: 0.92,
      roughness: 0.08,
      clearcoat: 1.0,
      emissive: 0x3b2f63,
      emissiveIntensity: 0.35,
    });
    const mirrorPane = new THREE.Mesh(new THREE.BoxGeometry(1.36, 2.38, 0.12), glassMat);
    mirrorPane.position.set(0, 1.22, -0.05);
    group.add(mirrorPane);

    const reflMat = new THREE.MeshStandardMaterial({
      color: 0x0b0910,
      emissive: 0xfef08a,
      emissiveIntensity: 0.28,
      roughness: 0.5,
    });
    const reflBody = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 1.1, 12), reflMat);
    reflBody.position.set(0, 0.72, 0.03);
    reflBody.name = 'mirrorReflection';
    group.add(reflBody);
  } else {
    const oakMat = new THREE.MeshStandardMaterial({
      color: 0x362218,
      roughness: 0.72,
      metalness: 0.15,
    });
    const doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(1.34, 2.38, 0.16), oakMat);
    doorLeaf.position.set(0, 1.2, -0.04);
    group.add(doorLeaf);

    const glowFrameMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 1.3,
      roughness: 0.2,
    });
    const lanternOrb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), glowFrameMat);
    lanternOrb.position.set(0, 2.28, 0.22);
    group.add(lanternOrb);

    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.022, 8, 16), brassMat);
    handle.position.set(0.38, 1.1, 0.09);
    group.add(handle);
  }

  return group;
}
