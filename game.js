import * as THREE from "three";

const canvas = document.querySelector("#gameCanvas");
const startScreen = document.querySelector("#startScreen");
const pauseScreen = document.querySelector("#pauseScreen");
const startButton = document.querySelector("#startButton");
const usaScoreEl = document.querySelector("#usaScore");
const germanyScoreEl = document.querySelector("#germanyScore");
const roundTimerEl = document.querySelector("#roundTimer");
const targetScoreLabelEl = document.querySelector("#targetScoreLabel");
const hitMarkerEl = document.querySelector("#hitMarker");
const damageVignetteEl = document.querySelector("#damageVignette");
const scopeOverlayEl = document.querySelector("#scopeOverlay");
const flashOverlayEl = document.querySelector("#flashOverlay");
const knifeSlashEl = document.querySelector("#knifeSlash");
const healthFillEl = document.querySelector("#healthFill");
const healthTextEl = document.querySelector("#healthText");
const armorFillEl = document.querySelector("#armorFill");
const armorTextEl = document.querySelector("#armorText");
const stanceFillEl = document.querySelector("#stanceFill");
const stanceTextEl = document.querySelector("#stanceText");
const grenadeFillEl = document.querySelector("#grenadeFill");
const grenadeTextEl = document.querySelector("#grenadeText");
const utilityFillEl = document.querySelector("#utilityFill");
const utilityTextEl = document.querySelector("#utilityText");
const vehicleFillEl = document.querySelector("#vehicleFill");
const vehicleTextEl = document.querySelector("#vehicleText");
const weaponClassEl = document.querySelector("#weaponClass");
const weaponNameEl = document.querySelector("#weaponName");
const classTextEl = document.querySelector("#classText");
const ammoTextEl = document.querySelector("#ammoText");
const reserveTextEl = document.querySelector("#reserveText");
const reloadBarEl = document.querySelector("#reloadBar span");
const feedEl = document.querySelector("#feed");
const messageEl = document.querySelector("#message");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x7f929a);
scene.fog = new THREE.FogExp2(0x7f929a, 0.0076);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  canvas,
  powerPreference: "high-performance",
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
renderer.useLegacyLights = false;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const BASE_FOV = 74;
const AIM_FOV = 39;
const camera = new THREE.PerspectiveCamera(BASE_FOV, 1, 0.03, 260);
const playerRig = new THREE.Object3D();
const pitchRig = new THREE.Object3D();
const weaponRoot = new THREE.Group();

playerRig.add(pitchRig);
pitchRig.add(camera);
camera.add(weaponRoot);
scene.add(playerRig);

const clock = new THREE.Clock();
const keys = new Set();
const pointer = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const obstacleMeshes = [];
const obstacles = [];
const botHitMeshes = [];
const bots = [];
const tracers = [];
const particles = [];
const decals = [];
const smokePuffs = [];
const dustMotes = [];
const heatShimmers = [];
const grenades = [];
const projectiles = [];
const vehicles = [];

const UP = new THREE.Vector3(0, 1, 0);
const MAP_SIZE = 168;
const MAP_HALF = MAP_SIZE / 2;
const TARGET_SCORE = 56;
const ROUND_SECONDS = 420;
const PLAYER_RADIUS = 0.46;
const BOT_RADIUS = 0.42;

const teams = {
  usa: {
    label: "Asterian Union",
    shortLabel: "Asteria",
    flagPattern: "asteria",
    color: 0x2563eb,
    light: 0xdbeafe,
    uniform: 0x2c4a66,
    accent: 0xf8fafc,
    spawn: new THREE.Vector3(0, 0, 66),
  },
  germany: {
    label: "Eisenmark Republic",
    shortLabel: "Eisenmark",
    flagPattern: "eisenmark",
    color: 0xd7b11f,
    light: 0xfef3c7,
    uniform: 0x4c5548,
    accent: 0x111827,
    spawn: new THREE.Vector3(0, 0, -66),
  },
};

const weaponSpecs = [
  {
    id: "m4",
    name: "M4A1 Liberty",
    className: "Assault Rifle",
    roleName: "Rifleman",
    magSize: 30,
    reserveAmmo: 120,
    damage: 22,
    headshot: 2.1,
    rpm: 720,
    reloadTime: 1.7,
    range: 82,
    spread: 0.011,
    movingSpread: 0.014,
    recoil: 0.018,
    automatic: true,
    pellets: 1,
    color: 0x1f2937,
    accent: 0x3b82f6,
  },
  {
    id: "shotgun",
    name: "M97 Trench Sweeper",
    className: "Combat Shotgun",
    roleName: "Breacher",
    magSize: 6,
    reserveAmmo: 42,
    damage: 13,
    headshot: 1.45,
    rpm: 82,
    reloadTime: 2.15,
    range: 38,
    spread: 0.077,
    movingSpread: 0.024,
    recoil: 0.064,
    automatic: false,
    pellets: 9,
    color: 0x322116,
    accent: 0xf59e0b,
  },
  {
    id: "springfield",
    name: "Springfield Sentinel",
    className: "Marksman Rifle",
    roleName: "Marksman",
    magSize: 5,
    reserveAmmo: 35,
    damage: 92,
    headshot: 2.5,
    rpm: 56,
    reloadTime: 2.45,
    range: 160,
    spread: 0.0036,
    movingSpread: 0.010,
    recoil: 0.112,
    automatic: false,
    pellets: 1,
    color: 0x3b2618,
    accent: 0x93c5fd,
  },
  {
    id: "viper",
    name: "Viper-9 Storm",
    className: "Close Quarters SMG",
    roleName: "Scout",
    magSize: 40,
    reserveAmmo: 160,
    damage: 15,
    headshot: 1.85,
    rpm: 940,
    reloadTime: 1.35,
    range: 52,
    spread: 0.016,
    movingSpread: 0.018,
    recoil: 0.012,
    automatic: true,
    pellets: 1,
    color: 0x151a22,
    accent: 0x22d3ee,
  },
  {
    id: "raven",
    name: "Raven M72 Bulwark",
    className: "Support LMG",
    roleName: "Support",
    magSize: 75,
    reserveAmmo: 225,
    damage: 18,
    headshot: 1.75,
    rpm: 620,
    reloadTime: 3.1,
    range: 76,
    spread: 0.019,
    movingSpread: 0.026,
    recoil: 0.028,
    automatic: true,
    pellets: 1,
    color: 0x20251f,
    accent: 0xa3e635,
  },
  {
    id: "sidearm",
    name: "Arclight P11",
    className: "Tactical Sidearm",
    roleName: "Officer",
    magSize: 15,
    reserveAmmo: 75,
    damage: 30,
    headshot: 2.0,
    rpm: 360,
    reloadTime: 1.15,
    range: 48,
    spread: 0.012,
    movingSpread: 0.016,
    recoil: 0.024,
    automatic: false,
    pellets: 1,
    color: 0x111827,
    accent: 0xf8fafc,
  },
  {
    id: "rpg",
    name: "Hammerhead RPG",
    className: "Anti-Armor Launcher",
    roleName: "Engineer",
    magSize: 1,
    reserveAmmo: 4,
    damage: 160,
    headshot: 1,
    rpm: 32,
    reloadTime: 3.35,
    range: 132,
    spread: 0.008,
    movingSpread: 0.018,
    recoil: 0.12,
    automatic: false,
    pellets: 1,
    explosive: true,
    explosionRadius: 9.5,
    projectileSpeed: 38,
    color: 0x263329,
    accent: 0xef4444,
  },
];

const botWeapons = {
  usa: {
    name: "Asterian Patrol Rifle",
    damage: 9.5,
    rpm: 440,
    range: 72,
    spread: 0.045,
  },
  germany: {
    name: "Eisenmark Field Carbine",
    damage: 8.8,
    rpm: 465,
    range: 74,
    spread: 0.047,
  },
};

const usaNames = ["Vale", "Rook", "Marin", "Hale", "Soren", "Ames", "Juno", "Pike", "Orin", "Talon", "Reed", "Knox", "Voss", "Lark", "Mira", "Cade"];
const germanNames = ["Kade", "Strahl", "Venn", "Keller", "Falk", "Orren", "Brigg", "Merek", "Voln", "Ryker", "Toren", "Axel", "Dorn", "Hess", "Korr", "Ivar"];

const playerWeapons = weaponSpecs.map((weapon) => ({
  ...weapon,
  ammo: weapon.magSize,
  reserve: weapon.reserveAmmo,
  nextShot: 0,
  reloadElapsed: 0,
  reloading: false,
}));

const player = {
  team: "usa",
  position: new THREE.Vector3(0, 0, 38),
  velocity: new THREE.Vector3(),
  verticalVelocity: 0,
  verticalOffset: 0,
  eyeHeight: 1.68,
  stance: "stand",
  grounded: true,
  health: 100,
  armor: 45,
  alive: true,
  respawnTimer: 0,
  sprinting: false,
  moving: false,
  grenades: 3,
  maxGrenades: 3,
  smokes: 2,
  maxSmokes: 2,
  flashes: 2,
  maxFlashes: 2,
  medkits: 2,
  maxMedkits: 2,
};

let gameStarted = false;
let mouseDown = false;
let isAiming = false;
let aimBlend = 0;
let pointerLockWasActive = false;
let activeVehicle = null;
let selectedWeapon = 0;
let usaScore = 0;
let germanyScore = 0;
let roundTime = ROUND_SECONDS;
let gameOver = false;
let weaponKick = 0;
let weaponSwayX = 0;
let weaponSwayY = 0;
let hitMarkerTimer = 0;
let damageTimer = 0;
let grenadeCooldown = 0;
let utilityCooldown = 0;
let medkitCooldown = 0;
let knifeCooldown = 0;
let knifeSlashTimer = 0;
let flashTimer = 0;
let messageTimer = 0;
let roundResetTimer = 0;
let currentWeaponModel = null;
let currentMuzzleLocal = new THREE.Vector3(0.18, -0.15, -1.22);
let currentWeaponBasePosition = new THREE.Vector3(0.36, -0.39, -0.58);
let currentWeaponAimPosition = new THREE.Vector3(0, -0.3, -0.74);

const tempA = new THREE.Vector3();
const tempB = new THREE.Vector3();
const tempC = new THREE.Vector3();
const tempDir = new THREE.Vector3();
const tempRight = new THREE.Vector3();
const tempUp = new THREE.Vector3();
const tempQuat = new THREE.Quaternion();

function mat(color, roughness = 0.8, metalness = 0.05) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
  });
}

const materials = {
  ground: mat(0x465642, 0.95, 0.02),
  road: mat(0x2f3439, 0.92, 0.02),
  concrete: mat(0x73736c, 0.86, 0.02),
  concreteDark: mat(0x4f5557, 0.9, 0.02),
  concreteLight: mat(0x9ca3af, 0.82, 0.02),
  crate: mat(0x7a5234, 0.82, 0.03),
  crateDark: mat(0x4b3428, 0.86, 0.02),
  metal: mat(0x2b3138, 0.52, 0.7),
  darkMetal: mat(0x111827, 0.45, 0.82),
  sandbag: mat(0x9b8b6a, 0.95, 0.01),
  rubber: mat(0x0f1115, 0.9, 0.18),
  mud: mat(0x3b3127, 0.98, 0.01),
  wetMud: mat(0x201a15, 0.58, 0.04),
  charred: mat(0x11100e, 0.86, 0.12),
  grassBlade: mat(0x5e7f46, 0.96, 0.01),
  hazard: mat(0xfacc15, 0.62, 0.1),
  brick: mat(0x8a4b32, 0.9, 0.02),
  canvas: mat(0x6d7657, 0.92, 0.01),
  puddle: new THREE.MeshStandardMaterial({
    color: 0x4b6470,
    roughness: 0.12,
    metalness: 0,
    transparent: true,
    opacity: 0.54,
  }),
  glass: new THREE.MeshStandardMaterial({
    color: 0x9ecae6,
    roughness: 0.08,
    metalness: 0,
    transparent: true,
    opacity: 0.45,
  }),
  lens: new THREE.MeshStandardMaterial({
    color: 0xc7e6ff,
    roughness: 0.04,
    metalness: 0,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
  }),
};

function makeDetailTexture({ base = "#64748b", speck = "#0f172a", line = "#94a3b8", size = 256, grid = false, noise = 900 }) {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = size;
  textureCanvas.height = size;
  const ctx = textureCanvas.getContext("2d");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  ctx.globalAlpha = 0.18;
  for (let i = 0; i < noise; i += 1) {
    const value = Math.floor(Math.random() * 80);
    ctx.fillStyle = i % 2 ? speck : `rgb(${value}, ${value}, ${value})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, Math.random() * 2.6 + 0.4, Math.random() * 2.6 + 0.4);
  }
  if (grid) {
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = line;
    ctx.lineWidth = 2;
    for (let i = 0; i <= size; i += size / 8) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, size);
      ctx.moveTo(0, i);
      ctx.lineTo(size, i);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeBumpTexture({ base = 90, contrast = 120, size = 256, scratches = 30 }) {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = size;
  textureCanvas.height = size;
  const ctx = textureCanvas.getContext("2d");
  ctx.fillStyle = `rgb(${base}, ${base}, ${base})`;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 1800; i += 1) {
    const value = THREE.MathUtils.clamp(base + THREE.MathUtils.randInt(-contrast, contrast), 0, 255);
    ctx.fillStyle = `rgb(${value}, ${value}, ${value})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, Math.random() * 3 + 0.4, Math.random() * 3 + 0.4);
  }
  ctx.globalAlpha = 0.34;
  ctx.strokeStyle = "#f8fafc";
  for (let i = 0; i < scratches; i += 1) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * size, Math.random() * size);
    ctx.lineTo(Math.random() * size, Math.random() * size);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 10);
  return texture;
}

function applyExtraDetailMaterials() {
  materials.ground.map = makeDetailTexture({ base: "#435542", speck: "#25331f", line: "#6b7f52", noise: 1300 });
  materials.road.map = makeDetailTexture({ base: "#30363d", speck: "#111827", line: "#475569", grid: true, noise: 850 });
  materials.concrete.map = makeDetailTexture({ base: "#777a73", speck: "#404040", line: "#a3a3a3", grid: true, noise: 950 });
  materials.concreteDark.map = makeDetailTexture({ base: "#4f5557", speck: "#1f2937", line: "#737373", grid: true, noise: 700 });
  materials.crate.map = makeDetailTexture({ base: "#7a5234", speck: "#3f2b1f", line: "#a3744d", grid: true, noise: 650 });
  materials.crateDark.map = makeDetailTexture({ base: "#4b3428", speck: "#1c1512", line: "#7a5234", grid: true, noise: 650 });
  materials.sandbag.map = makeDetailTexture({ base: "#9b8b6a", speck: "#594d38", line: "#c2b280", noise: 1200 });
  materials.ground.bumpMap = makeBumpTexture({ base: 110, contrast: 72, scratches: 18 });
  materials.ground.bumpScale = 0.08;
  materials.road.bumpMap = makeBumpTexture({ base: 95, contrast: 95, scratches: 55 });
  materials.road.bumpScale = 0.045;
  materials.concrete.bumpMap = makeBumpTexture({ base: 122, contrast: 70, scratches: 45 });
  materials.concrete.bumpScale = 0.035;
  materials.concreteDark.bumpMap = makeBumpTexture({ base: 92, contrast: 80, scratches: 35 });
  materials.concreteDark.bumpScale = 0.035;
  materials.crate.bumpMap = makeBumpTexture({ base: 116, contrast: 64, scratches: 65 });
  materials.crate.bumpScale = 0.055;
  materials.sandbag.bumpMap = makeBumpTexture({ base: 126, contrast: 58, scratches: 12 });
  materials.sandbag.bumpScale = 0.075;
  [
    materials.ground,
    materials.road,
    materials.concrete,
    materials.concreteDark,
    materials.crate,
    materials.crateDark,
    materials.sandbag,
  ].forEach((material) => {
    material.needsUpdate = true;
  });
}

function configureMesh(mesh, cast = true, receive = true) {
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  return mesh;
}

function addBlock({
  x,
  y = 0,
  z,
  width,
  height,
  depth,
  material,
  blocks = true,
  rotationY = 0,
}) {
  const mesh = configureMesh(
    new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material),
  );
  mesh.position.set(x, y + height / 2, z);
  mesh.rotation.y = rotationY;
  scene.add(mesh);

  if (blocks && Math.abs(rotationY) < 0.001) {
    obstacles.push({
      minX: x - width / 2,
      maxX: x + width / 2,
      minZ: z - depth / 2,
      maxZ: z + depth / 2,
      height,
    });
  }
  if (blocks) obstacleMeshes.push(mesh);
  return mesh;
}

function addCylinder({
  x,
  y,
  z,
  radius,
  height,
  material,
  radial = 16,
  rotationX = 0,
  rotationZ = 0,
  cast = true,
  receive = true,
}) {
  const mesh = configureMesh(
    new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, radial), material),
    cast,
    receive,
  );
  mesh.position.set(x, y, z);
  mesh.rotation.x = rotationX;
  mesh.rotation.z = rotationZ;
  scene.add(mesh);
  return mesh;
}

function buildSkyDome() {
  const canvasTexture = document.createElement("canvas");
  canvasTexture.width = 32;
  canvasTexture.height = 256;
  const ctx = canvasTexture.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, canvasTexture.height);
  gradient.addColorStop(0, "#9fb7c5");
  gradient.addColorStop(0.52, "#7f98a7");
  gradient.addColorStop(1, "#4d5e62");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasTexture.width, canvasTexture.height);
  const skyTexture = new THREE.CanvasTexture(canvasTexture);
  skyTexture.colorSpace = THREE.SRGBColorSpace;

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(150, 32, 16),
    new THREE.MeshBasicMaterial({ map: skyTexture, side: THREE.BackSide }),
  );
  sky.position.y = 18;
  scene.add(sky);

  const cloudMat = new THREE.MeshBasicMaterial({
    color: 0xdbeafe,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
  });
  for (let i = 0; i < 12; i += 1) {
    const cloud = new THREE.Mesh(new THREE.PlaneGeometry(12 + i * 0.35, 2.4), cloudMat.clone());
    cloud.position.set(THREE.MathUtils.randFloatSpread(95), 32 + Math.random() * 12, THREE.MathUtils.randFloatSpread(95));
    cloud.rotation.set(-0.25, Math.random() * Math.PI, 0);
    scene.add(cloud);
  }
}

function addRoadMarkings() {
  for (let z = -48; z <= 48; z += 9) {
    addBlock({ x: 0, y: 0.04, z, width: 0.28, height: 0.02, depth: 4.8, material: materials.hazard, blocks: false });
  }
  for (let x = -48; x <= 48; x += 9) {
    addBlock({ x, y: 0.04, z: 0, width: 4.8, height: 0.02, depth: 0.28, material: materials.hazard, blocks: false });
  }
  const crackMat = mat(0x181c1f, 0.98, 0.01);
  for (let i = 0; i < 28; i += 1) {
    const crack = new THREE.Mesh(new THREE.PlaneGeometry(THREE.MathUtils.randFloat(1.2, 3.6), 0.035), crackMat);
    crack.position.set(THREE.MathUtils.randFloatSpread(95), 0.064, THREE.MathUtils.randFloatSpread(95));
    crack.rotation.set(-Math.PI / 2, 0, Math.random() * Math.PI);
    scene.add(crack);
  }
}

function addGroundDetails() {
  const grassGeo = new THREE.ConeGeometry(0.035, 0.42, 4);
  const grass = new THREE.InstancedMesh(grassGeo, materials.grassBlade, 260);
  const matrix = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const pos = new THREE.Vector3();
  for (let i = 0; i < 260; i += 1) {
    let x = THREE.MathUtils.randFloatSpread(100);
    let z = THREE.MathUtils.randFloatSpread(100);
    if (Math.abs(x) < 5 || Math.abs(z) < 5) {
      x += Math.sign(x || 1) * 8;
      z += Math.sign(z || 1) * 8;
    }
    pos.set(x, 0.2, z);
    quat.setFromEuler(new THREE.Euler(THREE.MathUtils.randFloatSpread(0.28), Math.random() * Math.PI, THREE.MathUtils.randFloatSpread(0.28)));
    scale.setScalar(THREE.MathUtils.randFloat(0.7, 1.45));
    matrix.compose(pos, quat, scale);
    grass.setMatrixAt(i, matrix);
  }
  grass.castShadow = true;
  grass.receiveShadow = true;
  scene.add(grass);

  for (let i = 0; i < 16; i += 1) {
    const patch = new THREE.Mesh(
      new THREE.CircleGeometry(THREE.MathUtils.randFloat(0.8, 2.2), 18),
      materials.mud,
    );
    patch.position.set(THREE.MathUtils.randFloatSpread(92), 0.058, THREE.MathUtils.randFloatSpread(92));
    patch.rotation.x = -Math.PI / 2;
    patch.rotation.z = Math.random() * Math.PI;
    patch.receiveShadow = true;
    scene.add(patch);
  }
}

function addTireStack(x, z, count = 3) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  for (let i = 0; i < count; i += 1) {
    const tire = configureMesh(new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.13, 10, 18), materials.rubber));
    tire.position.y = 0.18 + i * 0.23;
    tire.rotation.x = Math.PI / 2;
    tire.rotation.z = Math.random() * Math.PI;
    group.add(tire);
  }
  scene.add(group);
  obstacles.push({ minX: x - 0.58, maxX: x + 0.58, minZ: z - 0.58, maxZ: z + 0.58, height: 0.9 });
  group.traverse((child) => {
    if (child.isMesh) obstacleMeshes.push(child);
  });
}

function addBarrelCluster(x, z, color = 0x475569) {
  const barrelMat = mat(color, 0.55, 0.45);
  for (let i = 0; i < 3; i += 1) {
    const bx = x + (i - 1) * 0.58;
    const bz = z + (i % 2) * 0.5;
    const barrel = addCylinder({ x: bx, y: 0.55, z: bz, radius: 0.28, height: 1.1, material: barrelMat, radial: 18 });
    const stripe = addCylinder({ x: bx, y: 0.9, z: bz, radius: 0.285, height: 0.04, material: materials.hazard, radial: 18 });
    stripe.scale.y = 1;
    barrel.userData.detail = true;
  }
}

function addRubblePile(x, z) {
  for (let i = 0; i < 10; i += 1) {
    const rock = configureMesh(
      new THREE.Mesh(new THREE.DodecahedronGeometry(THREE.MathUtils.randFloat(0.12, 0.34), 0), i % 2 ? materials.concrete : materials.brick),
    );
    rock.position.set(x + THREE.MathUtils.randFloatSpread(2.2), THREE.MathUtils.randFloat(0.09, 0.38), z + THREE.MathUtils.randFloatSpread(1.8));
    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    scene.add(rock);
  }
}

function addSmokeColumn(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const smokeMat = new THREE.MeshBasicMaterial({
    color: 0x64748b,
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
  });
  for (let i = 0; i < 7; i += 1) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.42 + i * 0.08, 12, 8), smokeMat.clone());
    puff.position.set(THREE.MathUtils.randFloatSpread(0.5), 0.7 + i * 0.42, THREE.MathUtils.randFloatSpread(0.5));
    puff.scale.set(1.4, 0.7, 1.1);
    group.add(puff);
    smokePuffs.push({ mesh: puff, seed: Math.random() * Math.PI * 2, baseY: puff.position.y });
  }
  scene.add(group);
}

function addCrater(x, z, radius = 2.2, depth = 0.18) {
  const group = new THREE.Group();
  group.position.set(x, 0.07, z);
  const craterMat = materials.charred;
  const bowl = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.32, radius, 28),
    craterMat,
  );
  bowl.rotation.x = -Math.PI / 2;
  bowl.scale.y = 0.68;
  bowl.receiveShadow = true;
  group.add(bowl);

  const wetCenter = new THREE.Mesh(
    new THREE.CircleGeometry(radius * 0.36, 18),
    materials.wetMud,
  );
  wetCenter.position.y = 0.012;
  wetCenter.rotation.x = -Math.PI / 2;
  wetCenter.scale.y = 0.72;
  group.add(wetCenter);

  for (let i = 0; i < 14; i += 1) {
    const angle = (i / 14) * Math.PI * 2 + Math.random() * 0.2;
    const rock = configureMesh(
      new THREE.Mesh(new THREE.DodecahedronGeometry(THREE.MathUtils.randFloat(0.08, 0.22), 0), i % 3 ? materials.mud : materials.brick),
    );
    rock.position.set(Math.cos(angle) * THREE.MathUtils.randFloat(radius * 0.55, radius * 1.08), depth + Math.random() * 0.14, Math.sin(angle) * THREE.MathUtils.randFloat(radius * 0.5, radius));
    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    group.add(rock);
  }
  scene.add(group);
}

function addPuddle(x, z, width = 2.6, depth = 1.2, rotationY = 0) {
  const puddle = new THREE.Mesh(new THREE.CircleGeometry(1, 32), materials.puddle.clone());
  puddle.position.set(x, 0.071, z);
  puddle.rotation.x = -Math.PI / 2;
  puddle.rotation.z = rotationY;
  puddle.scale.set(width, depth, 1);
  puddle.receiveShadow = true;
  scene.add(puddle);
}

function addTrenchSegment(x, z, length = 10, rotationY = 0) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotationY;
  const ditch = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(length, 0.18, 1.55), materials.wetMud));
  ditch.position.y = 0.075;
  group.add(ditch);
  for (let i = 0; i < length; i += 1.2) {
    const left = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.22, 0.2), materials.sandbag));
    left.position.set(i - length / 2, 0.22, -0.9);
    left.rotation.z = THREE.MathUtils.randFloatSpread(0.1);
    group.add(left);
    const right = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.22, 0.2), materials.sandbag));
    right.position.set(i - length / 2, 0.22, 0.9);
    right.rotation.z = THREE.MathUtils.randFloatSpread(0.1);
    group.add(right);
  }
  scene.add(group);
}

function addRazorWire(x, z, length = 5, rotationY = 0) {
  const group = new THREE.Group();
  group.position.set(x, 0.55, z);
  group.rotation.y = rotationY;
  const wireMat = mat(0xb6c2cc, 0.38, 0.75);
  for (let i = 0; i < length; i += 1) {
    const coil = configureMesh(new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.014, 8, 28), wireMat));
    coil.position.x = i - length / 2;
    coil.rotation.y = Math.PI / 2;
    group.add(coil);
    for (let j = 0; j < 4; j += 1) {
      const barb = configureMesh(new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.12, 5), wireMat), true, false);
      barb.position.set(i - length / 2 + THREE.MathUtils.randFloatSpread(0.24), THREE.MathUtils.randFloatSpread(0.36), THREE.MathUtils.randFloatSpread(0.42));
      barb.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      group.add(barb);
    }
  }
  scene.add(group);
}

function addWreckedVehicle(x, z, rotationY = 0) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotationY;
  const armor = mat(0x2f3a32, 0.74, 0.28);
  const soot = materials.charred;
  const body = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.1, 2.2), armor));
  body.position.y = 0.82;
  body.rotation.z = -0.08;
  group.add(body);
  const turret = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.48, 1.12), armor));
  turret.position.set(0.35, 1.52, -0.08);
  turret.rotation.y = 0.45;
  group.add(turret);
  const barrel = configureMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.5, 12), materials.darkMetal));
  barrel.position.set(1.4, 1.58, -0.58);
  barrel.rotation.z = Math.PI / 2;
  barrel.rotation.y = 0.45;
  group.add(barrel);
  for (const sx of [-1, 1]) {
    for (let i = -1; i <= 1; i += 1) {
      const wheel = configureMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.32, 18), materials.rubber));
      wheel.position.set(i * 1.28, 0.34, sx * 1.22);
      wheel.rotation.x = Math.PI / 2;
      group.add(wheel);
    }
  }
  const burn = new THREE.Mesh(new THREE.CircleGeometry(1.8, 18), soot);
  burn.position.set(0.4, 0.075, -0.2);
  burn.rotation.x = -Math.PI / 2;
  group.add(burn);
  scene.add(group);
  obstacles.push({ minX: x - 2.6, maxX: x + 2.6, minZ: z - 1.7, maxZ: z + 1.7, height: 1.7 });
  group.traverse((child) => {
    if (child.isMesh) obstacleMeshes.push(child);
  });
}

function addDrivableVehicle(x, z, label, color = 0x334155, rotationY = 0, type = "rover") {
  const group = new THREE.Group();
  const airVehicle = type === "helicopter" || type === "jet";
  const startY = type === "jet" ? 1.1 : type === "helicopter" ? 0.55 : 0;
  group.position.set(x, startY, z);
  group.rotation.y = rotationY;
  const bodyMat = mat(color, 0.62, 0.32);
  const trimMat = mat(0x111827, 0.52, 0.55);
  const glassMat = materials.lens.clone();
  glassMat.opacity = 0.34;

  const baseLength = type === "tank" ? 5.7 : type === "halftrack" ? 5.2 : type === "jet" ? 5.9 : type === "helicopter" ? 4.6 : 3.9;
  const baseWidth = type === "tank" ? 2.65 : type === "halftrack" ? 2.35 : type === "jet" ? 1.35 : type === "helicopter" ? 1.55 : 2.0;
  const body = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(baseLength, 0.78, baseWidth), bodyMat));
  body.position.y = 0.8;
  if (airVehicle) body.scale.y = 0.78;
  group.add(body);
  const cabin = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(type === "tank" ? 1.25 : type === "halftrack" ? 1.7 : 1.35, 0.9, baseWidth * 0.78), bodyMat));
  cabin.position.set(-0.45, 1.45, 0);
  group.add(cabin);
  const windshield = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.44, baseWidth * 0.62), glassMat), false, false);
  windshield.position.set(-1.3, 1.56, 0);
  group.add(windshield);
  const hood = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.38, baseWidth * 0.86), bodyMat));
  hood.position.set(-1.35, 1.07, 0);
  hood.rotation.z = -0.08;
  group.add(hood);
  const turret = configureMesh(new THREE.Mesh(new THREE.CylinderGeometry(type === "tank" ? 0.78 : 0.45, type === "tank" ? 0.88 : 0.52, type === "tank" ? 0.42 : 0.28, 18), trimMat));
  turret.position.set(type === "tank" ? 0.45 : 0.95, type === "tank" ? 1.45 : 1.34, 0);
  group.add(turret);
  const pintleGun = configureMesh(new THREE.Mesh(new THREE.CylinderGeometry(type === "tank" ? 0.09 : 0.035, type === "tank" ? 0.09 : 0.035, type === "tank" ? 2.35 : 1.4, 10), trimMat));
  pintleGun.position.set(type === "tank" ? 1.85 : 1.55, type === "tank" ? 1.52 : 1.45, 0);
  pintleGun.rotation.z = Math.PI / 2;
  group.add(pintleGun);

  const wheelMeshes = [];
  if (!airVehicle) {
    for (const side of [-1, 1]) {
      for (let i = 0; i < (type === "tank" ? 5 : type === "halftrack" ? 4 : 3); i += 1) {
        const wheelRadius = type === "tank" ? 0.34 : 0.38;
        const wheel = configureMesh(new THREE.Mesh(new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.28, 18), materials.rubber));
        wheel.position.set(-1.85 + i * (type === "tank" ? 0.86 : 1.05), 0.42, side * (baseWidth / 2 + 0.08));
        wheel.rotation.x = Math.PI / 2;
        group.add(wheel);
        wheelMeshes.push(wheel);
      }
    }
  }
  if (type === "halftrack" || type === "tank") {
    for (const side of [-1, 1]) {
      const trackLength = type === "tank" ? 4.7 : 2.8;
      const track = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(trackLength, 0.22, 0.28), trimMat));
      track.position.set(type === "tank" ? 0.0 : 0.35, 0.43, side * (baseWidth / 2 + 0.1));
      group.add(track);
    }
  }

  const rotorMeshes = [];
  if (type === "helicopter") {
    const mast = configureMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 10), trimMat));
    mast.position.set(-0.2, 2.05, 0);
    group.add(mast);
    for (let i = 0; i < 2; i += 1) {
      const rotor = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(5.9, 0.04, 0.16), trimMat), true, false);
      rotor.position.set(-0.2, 2.42, 0);
      rotor.rotation.y = i * Math.PI / 2;
      group.add(rotor);
      rotorMeshes.push(rotor);
    }
    const tail = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.18, 0.18), bodyMat));
    tail.position.set(2.9, 1.08, 0);
    group.add(tail);
    const tailRotor = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.08), trimMat), true, false);
    tailRotor.position.set(4.02, 1.15, 0);
    group.add(tailRotor);
    rotorMeshes.push(tailRotor);
    for (const side of [-1, 1]) {
      const skid = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.08, 0.08), trimMat));
      skid.position.set(-0.25, 0.22, side * 0.86);
      group.add(skid);
      const brace = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.72, 0.08), trimMat));
      brace.position.set(-0.85, 0.55, side * 0.86);
      group.add(brace);
    }
  }

  if (type === "jet") {
    const nose = configureMesh(new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.0, 18), bodyMat));
    nose.position.set(-3.4, 0.82, 0);
    nose.rotation.z = Math.PI / 2;
    group.add(nose);
    const leftWing = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 5.8), bodyMat));
    leftWing.position.set(-0.2, 0.78, 0);
    group.add(leftWing);
    const tailWing = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 2.2), trimMat));
    tailWing.position.set(2.35, 1.15, 0);
    group.add(tailWing);
    const fin = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.92, 0.12), trimMat));
    fin.position.set(2.5, 1.62, 0);
    group.add(fin);
    for (const side of [-1, 1]) {
      const pod = configureMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.8, 10), trimMat));
      pod.position.set(-0.2, 0.54, side * 1.8);
      pod.rotation.z = Math.PI / 2;
      group.add(pod);
    }
  }

  if (airVehicle) {
    for (const side of [-1, 1]) {
      const hardpoint = configureMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.95, 10), trimMat));
      hardpoint.position.set(0.28, 0.52, side * (type === "jet" ? 1.55 : 0.72));
      hardpoint.rotation.z = Math.PI / 2;
      group.add(hardpoint);
    }
  }

  for (const side of [-1, 1]) {
    const light = new THREE.PointLight(0xfef3c7, 0.85, 8);
    light.position.set(-2.05, 0.95, side * 0.62);
    group.add(light);
    const lamp = configureMesh(new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), materials.lens), false, false);
    lamp.position.copy(light.position);
    group.add(lamp);
  }

  const plateCanvas = document.createElement("canvas");
  plateCanvas.width = 256;
  plateCanvas.height = 80;
  const ctx = plateCanvas.getContext("2d");
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, 256, 80);
  ctx.fillStyle = "#f8fafc";
  ctx.font = "800 25px sans-serif";
  ctx.fillText(label.toUpperCase().slice(0, 16), 16, 50);
  const plateTexture = new THREE.CanvasTexture(plateCanvas);
  plateTexture.colorSpace = THREE.SRGBColorSpace;
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.4), new THREE.MeshBasicMaterial({ map: plateTexture, side: THREE.DoubleSide }));
  plate.position.set(1.98, 0.92, 0);
  plate.rotation.y = Math.PI / 2;
  group.add(plate);

  scene.add(group);
  const vehicleStats = {
    rover: { maxHealth: 145, armorBlock: 0.68, missiles: 0, speed: 13.4, reverse: 5.4, seat: 1.82, radius: 1.35, cooldown: 1.1 },
    halftrack: { maxHealth: 235, armorBlock: 0.82, missiles: 4, speed: 10.2, reverse: 4.2, seat: 2.05, radius: 1.75, cooldown: 1.45 },
    tank: { maxHealth: 380, armorBlock: 0.93, missiles: 8, speed: 7.4, reverse: 3.2, seat: 2.15, radius: 2.05, cooldown: 1.8 },
    helicopter: { maxHealth: 210, armorBlock: 0.74, missiles: 10, speed: 20, reverse: 7, seat: 2.35, radius: 2.25, cooldown: 0.78 },
    jet: { maxHealth: 185, armorBlock: 0.64, missiles: 12, speed: 32, reverse: 10, seat: 2.15, radius: 2.45, cooldown: 0.52 },
  }[type] || { maxHealth: 145, armorBlock: 0.68, missiles: 0, speed: 13.4, reverse: 5.4, seat: 1.82, radius: 1.35, cooldown: 1.1 };
  const vehicle = {
    group,
    label,
    type,
    position: new THREE.Vector3(x, startY, z),
    yaw: rotationY,
    speed: 0,
    health: vehicleStats.maxHealth,
    maxHealth: vehicleStats.maxHealth,
    armorBlock: vehicleStats.armorBlock,
    maxSpeed: vehicleStats.speed,
    reverseSpeed: vehicleStats.reverse,
    missileAmmo: vehicleStats.missiles,
    maxMissileAmmo: vehicleStats.missiles,
    missileCooldown: 0,
    missileCooldownTime: vehicleStats.cooldown,
    radius: vehicleStats.radius,
    seatHeight: vehicleStats.seat,
    airVehicle,
    wheels: wheelMeshes,
    rotors: rotorMeshes,
  };
  vehicles.push(vehicle);
  return vehicle;
}

function addTankTrap(x, z, rotationY = 0) {
  const group = new THREE.Group();
  group.position.set(x, 0.55, z);
  group.rotation.y = rotationY;
  for (let i = 0; i < 3; i += 1) {
    const beam = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.18, 0.18), materials.metal));
    beam.rotation.set(i === 0 ? 0 : Math.PI / 2, 0, (i / 3) * Math.PI);
    group.add(beam);
  }
  scene.add(group);
}

function addMudRuts(x, z, length = 8, rotationY = 0) {
  const group = new THREE.Group();
  group.position.set(x, 0.078, z);
  group.rotation.y = rotationY;
  for (const offset of [-0.62, 0.62]) {
    const rut = new THREE.Mesh(new THREE.BoxGeometry(length, 0.025, 0.18), materials.wetMud);
    rut.position.z = offset;
    rut.receiveShadow = true;
    group.add(rut);
  }
  for (let i = 0; i < length; i += 0.55) {
    const tread = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 1.45), materials.mud);
    tread.position.x = i - length / 2;
    tread.rotation.y = THREE.MathUtils.randFloatSpread(0.08);
    tread.receiveShadow = true;
    group.add(tread);
  }
  scene.add(group);
}

function addSpentShells(x, z, count = 18, spread = 2.6) {
  const brass = mat(0xd9a441, 0.46, 0.62);
  for (let i = 0; i < count; i += 1) {
    const shell = configureMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.16, 9), brass), true, false);
    shell.position.set(x + THREE.MathUtils.randFloatSpread(spread), 0.1, z + THREE.MathUtils.randFloatSpread(spread));
    shell.rotation.set(Math.PI / 2 + THREE.MathUtils.randFloatSpread(0.35), Math.random() * Math.PI, Math.random() * Math.PI);
    scene.add(shell);
  }
}

function addMortarPit(x, z, teamKey, rotationY = 0) {
  const team = teams[teamKey];
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotationY;
  for (let i = 0; i < 10; i += 1) {
    const angle = (i / 10) * Math.PI * 2;
    const bag = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.26, 0.36), materials.sandbag));
    bag.position.set(Math.cos(angle) * 1.25, 0.24, Math.sin(angle) * 1.25);
    bag.rotation.y = -angle;
    group.add(bag);
  }
  const base = configureMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.45, 0.12, 18), materials.darkMetal));
  base.position.y = 0.18;
  group.add(base);
  const tube = configureMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 1.25, 16), materials.metal));
  tube.position.set(0.22, 0.78, -0.18);
  tube.rotation.z = -0.55;
  group.add(tube);
  const sight = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.08), mat(team.color, 0.55, 0.24)));
  sight.position.set(-0.18, 0.72, -0.1);
  group.add(sight);
  scene.add(group);
}

function addDustMotes() {
  const dustMat = new THREE.MeshBasicMaterial({
    color: 0xd6c5a1,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
  });
  for (let i = 0; i < 90; i += 1) {
    const mote = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.08), dustMat.clone());
    mote.position.set(THREE.MathUtils.randFloatSpread(92), THREE.MathUtils.randFloat(0.8, 8), THREE.MathUtils.randFloatSpread(92));
    mote.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    scene.add(mote);
    dustMotes.push({ mesh: mote, seed: Math.random() * Math.PI * 2, drift: THREE.MathUtils.randFloat(0.15, 0.6) });
  }
}

function addFloodLight(x, z, rotationY = 0) {
  addCylinder({ x, y: 1.8, z, radius: 0.055, height: 3.6, material: materials.metal, radial: 10 });
  const head = addBlock({ x, y: 3.25, z, width: 0.92, height: 0.42, depth: 0.24, material: materials.darkMetal, blocks: false, rotationY });
  const glow = new THREE.PointLight(0xfef3c7, 1.2, 16);
  glow.position.copy(head.position);
  scene.add(glow);
}

function addDirectionalSign(x, z, label, color, rotationY = 0) {
  addCylinder({ x, y: 1.1, z, radius: 0.045, height: 2.2, material: materials.metal, radial: 8 });
  const signCanvas = document.createElement("canvas");
  signCanvas.width = 256;
  signCanvas.height = 96;
  const ctx = signCanvas.getContext("2d");
  ctx.fillStyle = "#111827";
  ctx.fillRect(0, 0, signCanvas.width, signCanvas.height);
  ctx.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
  ctx.fillRect(0, 0, 14, signCanvas.height);
  ctx.fillStyle = "#f8fafc";
  ctx.font = "800 32px sans-serif";
  ctx.fillText(label, 32, 60);
  const texture = new THREE.CanvasTexture(signCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.5, 0.92),
    new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }),
  );
  sign.position.set(x, 2.05, z);
  sign.rotation.y = rotationY;
  scene.add(sign);
}

function addFenceSection(x, z, width, rotationY = 0) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotationY;
  for (let i = 0; i <= width; i += 1.2) {
    const post = configureMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.45, 8), materials.metal));
    post.position.set(i - width / 2, 0.72, 0);
    group.add(post);
  }
  for (const y of [0.55, 1.0, 1.35]) {
    const rail = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(width, 0.045, 0.045), materials.metal));
    rail.position.y = y;
    group.add(rail);
  }
  scene.add(group);
}

function addConcreteBarrier(x, z, rotationY = 0, factionColor = 0x94a3b8) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotationY;
  const base = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.9, 0.55), materials.concreteLight));
  base.position.y = 0.45;
  group.add(base);
  for (let i = -1; i <= 1; i += 1) {
    const stripe = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.6), mat(factionColor, 0.55, 0.12)));
    stripe.position.set(i * 0.95, 0.78, -0.01);
    stripe.rotation.z = -0.5;
    group.add(stripe);
  }
  scene.add(group);
  const width = 3.6;
  const depth = 0.7;
  const cos = Math.cos(rotationY);
  const sin = Math.sin(rotationY);
  obstacles.push({
    minX: x - (Math.abs(width * cos) + Math.abs(depth * sin)) / 2,
    maxX: x + (Math.abs(width * cos) + Math.abs(depth * sin)) / 2,
    minZ: z - (Math.abs(width * sin) + Math.abs(depth * cos)) / 2,
    maxZ: z + (Math.abs(width * sin) + Math.abs(depth * cos)) / 2,
    height: 1,
  });
  group.traverse((child) => {
    if (child.isMesh) obstacleMeshes.push(child);
  });
}

function addCableSpool(x, z, rotationY = 0) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotationY;
  const wood = mat(0x6b4428, 0.78, 0.04);
  const cable = mat(0x111827, 0.78, 0.14);
  for (const side of [-1, 1]) {
    const wheel = configureMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.12, 22), wood));
    wheel.position.x = side * 0.42;
    wheel.rotation.z = Math.PI / 2;
    group.add(wheel);
  }
  const core = configureMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.9, 22), cable));
  core.rotation.z = Math.PI / 2;
  group.add(core);
  for (let i = 0; i < 5; i += 1) {
    const loop = configureMesh(new THREE.Mesh(new THREE.TorusGeometry(0.42 + i * 0.018, 0.018, 8, 24), cable));
    loop.rotation.y = Math.PI / 2;
    loop.position.x = -0.2 + i * 0.1;
    group.add(loop);
  }
  group.position.y = 0.62;
  scene.add(group);
}

function addFieldTent(x, z, teamKey, rotationY = 0) {
  const team = teams[teamKey];
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotationY;
  const tentMat = mat(team.teamTent || team.uniform, 0.95, 0.01);
  const canvasBody = configureMesh(new THREE.Mesh(new THREE.ConeGeometry(2.2, 2.2, 4), tentMat));
  canvasBody.position.y = 1.1;
  canvasBody.rotation.y = Math.PI / 4;
  canvasBody.scale.z = 1.35;
  group.add(canvasBody);
  const flap = configureMesh(new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.0), materials.canvas), true, false);
  flap.position.set(0, 0.8, -1.55);
  flap.rotation.x = -0.18;
  group.add(flap);
  const patch = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 0.04), mat(team.light, 0.68, 0.05)), false, false);
  patch.position.set(0, 1.35, -1.5);
  group.add(patch);
  scene.add(group);
}

function addRadioAntenna(x, z, teamKey) {
  const team = teams[teamKey];
  addCylinder({ x, y: 2.2, z, radius: 0.045, height: 4.4, material: materials.metal, radial: 8 });
  for (let i = 0; i < 3; i += 1) {
    const dish = new THREE.Mesh(
      new THREE.TorusGeometry(0.42 + i * 0.16, 0.018, 8, 32),
      mat(team.light, 0.45, 0.35),
    );
    dish.position.set(x, 3.6 + i * 0.1, z);
    dish.rotation.x = Math.PI / 2;
    scene.add(configureMesh(dish));
  }
  const beacon = new THREE.PointLight(team.light, 0.65, 12);
  beacon.position.set(x, 4.45, z);
  scene.add(beacon);
}

function addExtraShellCrates(x, z, teamKey) {
  const team = teams[teamKey];
  const shellMat = mat(team.color, 0.48, 0.32);
  addBlock({ x, z, width: 1.8, height: 0.55, depth: 1.1, material: materials.crateDark });
  for (let i = 0; i < 8; i += 1) {
    addCylinder({
      x: x - 0.65 + i * 0.18,
      y: 0.84,
      z: z + THREE.MathUtils.randFloatSpread(0.28),
      radius: 0.04,
      height: 0.34,
      material: shellMat,
      radial: 10,
      rotationZ: Math.PI / 2,
      cast: true,
      receive: true,
    });
  }
}

function addBulletScars(x, z, rotationY = 0, count = 12) {
  const scarMat = new THREE.MeshBasicMaterial({ color: 0x0f172a, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
  for (let i = 0; i < count; i += 1) {
    const scar = new THREE.Mesh(new THREE.CircleGeometry(THREE.MathUtils.randFloat(0.035, 0.09), 10), scarMat.clone());
    scar.position.set(x + THREE.MathUtils.randFloatSpread(2.8), THREE.MathUtils.randFloat(0.8, 3.2), z);
    scar.rotation.y = rotationY;
    scene.add(scar);
  }
}

function buildLights() {
  buildSkyDome();
  addDustMotes();

  const hemi = new THREE.HemisphereLight(0xdbeafe, 0x2f3a2d, 1.08);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff4dc, 3.55);
  sun.position.set(-54, 70, 42);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 220;
  sun.shadow.camera.left = -96;
  sun.shadow.camera.right = 96;
  sun.shadow.camera.top = 96;
  sun.shadow.camera.bottom = -96;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0x93c5fd, 0.72);
  fill.position.set(35, 18, -42);
  scene.add(fill);

  const lowBounce = new THREE.DirectionalLight(0xf59e0b, 0.34);
  lowBounce.position.set(-8, 6, 18);
  scene.add(lowBounce);
}

function buildMap() {
  const groundGeo = new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE, 64, 64);
  const positions = groundGeo.attributes.position;
  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const ripple = Math.sin(x * 0.28) * Math.cos(y * 0.22) * 0.08;
    positions.setZ(i, ripple);
  }
  groundGeo.computeVertexNormals();

  const ground = new THREE.Mesh(groundGeo, materials.ground);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  addBlock({ x: 0, z: 0, width: 7.2, height: 0.05, depth: MAP_SIZE, material: materials.road, blocks: false });
  addBlock({ x: 0, z: 0, width: MAP_SIZE, height: 0.05, depth: 6.6, material: materials.road, blocks: false });
  addBlock({ x: -50, z: 0, width: 5.2, height: 0.045, depth: MAP_SIZE * 0.72, material: materials.road, blocks: false });
  addBlock({ x: 50, z: 0, width: 5.2, height: 0.045, depth: MAP_SIZE * 0.72, material: materials.road, blocks: false });
  addBlock({ x: 0, z: 50, width: MAP_SIZE * 0.72, height: 0.045, depth: 4.8, material: materials.road, blocks: false });
  addBlock({ x: 0, z: -50, width: MAP_SIZE * 0.72, height: 0.045, depth: 4.8, material: materials.road, blocks: false });
  addRoadMarkings();
  addGroundDetails();

  const wallMat = materials.concreteDark;
  addBlock({ x: 0, z: -MAP_HALF - 0.7, width: MAP_SIZE + 2, height: 3.3, depth: 1.4, material: wallMat });
  addBlock({ x: 0, z: MAP_HALF + 0.7, width: MAP_SIZE + 2, height: 3.3, depth: 1.4, material: wallMat });
  addBlock({ x: -MAP_HALF - 0.7, z: 0, width: 1.4, height: 3.3, depth: MAP_SIZE + 2, material: wallMat });
  addBlock({ x: MAP_HALF + 0.7, z: 0, width: 1.4, height: 3.3, depth: MAP_SIZE + 2, material: wallMat });

  addBuilding(-23, -9, 12, 14, 4.5);
  addBuilding(24, 10, 12, 16, 4.5);
  addBuilding(-31, 25, 10, 9, 3.7);
  addBuilding(31, -25, 10, 9, 3.7);
  addBuilding(-55, 52, 13, 12, 4.2);
  addBuilding(55, 52, 13, 12, 4.2);
  addBuilding(-55, -52, 13, 12, 4.2);
  addBuilding(55, -52, 13, 12, 4.2);
  addBuilding(-66, 5, 10, 18, 4.0);
  addBuilding(66, -5, 10, 18, 4.0);

  addContainer(-9, 18, 12, 4, 3, 0.2, 0x214c79);
  addContainer(13, -18, 12, 4, 3, -0.25, 0x756226);
  addContainer(35, 2, 13, 4, 3, Math.PI / 2, 0x5b6774);
  addContainer(-35, -2, 13, 4, 3, Math.PI / 2, 0x4f5f37);
  addContainer(-62, 31, 13, 4, 3, Math.PI / 2 + 0.18, 0x1f4f63);
  addContainer(62, -31, 13, 4, 3, Math.PI / 2 - 0.18, 0x6b5f38);
  addContainer(-19, 59, 12, 4, 3, -0.18, 0x374151);
  addContainer(19, -59, 12, 4, 3, Math.PI + 0.18, 0x4f4632);

  const crateSpots = [
    [-12, -2],
    [-15, 2],
    [15, -2],
    [11, 3],
    [4, 18],
    [-4, -18],
    [-36, 13],
    [36, -13],
    [22, 31],
    [-22, -31],
    [-58, 15],
    [58, -15],
    [-47, 61],
    [47, -61],
    [69, 26],
    [-69, -26],
  ];
  crateSpots.forEach(([x, z], index) => addCrateStack(x, z, index % 3));

  addSandbagLine(-16, 30, 6, 0);
  addSandbagLine(16, -30, 6, Math.PI);
  addSandbagLine(-29, -18, 5, Math.PI / 2);
  addSandbagLine(29, 18, 5, -Math.PI / 2);
  addSandbagLine(0, 13, 6, Math.PI / 2);
  addSandbagLine(0, -13, 6, Math.PI / 2);
  addSandbagLine(-18, 62, 8, 0.08);
  addSandbagLine(18, -62, 8, Math.PI + 0.08);
  addSandbagLine(-58, 42, 6, Math.PI / 2);
  addSandbagLine(58, -42, 6, Math.PI / 2);
  addSandbagLine(-50, -48, 6, 0);
  addSandbagLine(50, 48, 6, Math.PI);

  addTower(-44, 42, "usa");
  addTower(44, -42, "germany");
  addTower(-74, 70, "usa");
  addTower(74, -70, "germany");
  addFlag(teams.usa, -8, 44);
  addFlag(teams.germany, 8, -44);
  addFlag(teams.usa, -9, 75);
  addFlag(teams.germany, 9, -75);
  addAmmoTable(-7, 35, "usa");
  addAmmoTable(7, -35, "germany");
  addAmmoTable(-17, 69, "usa");
  addAmmoTable(17, -69, "germany");

  addFloodLight(-18, 36, -0.4);
  addFloodLight(18, -36, 2.7);
  addFloodLight(-42, -10, 1.25);
  addFloodLight(42, 10, -1.9);
  addFloodLight(-66, 52, -0.7);
  addFloodLight(66, -52, 2.45);
  addFloodLight(-58, -48, 1.8);
  addFloodLight(58, 48, -1.35);
  addDirectionalSign(-6, 8, "A-SECTOR", teams.usa.color, 0.2);
  addDirectionalSign(8, -8, "B-SECTOR", teams.germany.color, Math.PI + 0.2);
  addDirectionalSign(-42, 50, "C-SECTOR", teams.usa.color, -0.1);
  addDirectionalSign(42, -50, "D-SECTOR", teams.germany.color, Math.PI - 0.1);
  addFenceSection(-42, 24, 12, Math.PI / 2);
  addFenceSection(42, -24, 12, Math.PI / 2);
  addFenceSection(-73, 39, 16, Math.PI / 2);
  addFenceSection(73, -39, 16, Math.PI / 2);
  addFenceSection(-21, 73, 18, 0);
  addFenceSection(21, -73, 18, 0);

  [
    [-19, 13, 4],
    [18, -12, 3],
    [-41, 29, 4],
    [41, -29, 4],
    [6, 27, 3],
    [-6, -27, 3],
    [-62, 58, 4],
    [62, -58, 4],
    [-72, -18, 3],
    [72, 18, 3],
  ].forEach(([x, z, count]) => addTireStack(x, z, count));

  addBarrelCluster(-27, 5, 0x475569);
  addBarrelCluster(27, -5, 0x5b4531);
  addBarrelCluster(-13, -31, 0x334155);
  addBarrelCluster(13, 31, 0x6b5f38);
  addRubblePile(-26, -18);
  addRubblePile(27, 19);
  addRubblePile(-3, 25);
  addRubblePile(3, -25);
  addRubblePile(-58, 50);
  addRubblePile(58, -50);
  addRubblePile(-64, -36);
  addRubblePile(64, 36);
  addSmokeColumn(-26, -18);
  addSmokeColumn(27, 19);
  addSmokeColumn(0, -33);
  addSmokeColumn(-58, 50);
  addSmokeColumn(58, -50);

  addConcreteBarrier(-8, 9, 0.08, teams.usa.color);
  addConcreteBarrier(8, -9, 0.08, teams.germany.color);
  addConcreteBarrier(-34, -8, Math.PI / 2, teams.usa.color);
  addConcreteBarrier(34, 8, Math.PI / 2, teams.germany.color);
  addConcreteBarrier(-48, 38, Math.PI / 2, teams.usa.color);
  addConcreteBarrier(48, -38, Math.PI / 2, teams.germany.color);
  addConcreteBarrier(-63, -12, 0.08, teams.usa.color);
  addConcreteBarrier(63, 12, 0.08, teams.germany.color);
  addCableSpool(-17, 24, 0.35);
  addCableSpool(17, -24, -0.35);
  addCableSpool(-63, 58, 0.2);
  addCableSpool(63, -58, -0.2);
  addFieldTent(-17, 41, "usa", 0.3);
  addFieldTent(17, -41, "germany", Math.PI + 0.3);
  addFieldTent(-24, 72, "usa", 0.1);
  addFieldTent(24, -72, "germany", Math.PI + 0.1);
  addRadioAntenna(-12, 43, "usa");
  addRadioAntenna(12, -43, "germany");
  addRadioAntenna(-31, 73, "usa");
  addRadioAntenna(31, -73, "germany");
  addExtraShellCrates(-12, 34, "usa");
  addExtraShellCrates(12, -34, "germany");
  addExtraShellCrates(-34, 66, "usa");
  addExtraShellCrates(34, -66, "germany");
  addBulletScars(-23, -16.04, 0, 14);
  addBulletScars(24, 18.04, Math.PI, 14);
  addBulletScars(-37.04, -2, Math.PI / 2, 10);
  addBulletScars(37.04, 2, -Math.PI / 2, 10);

  addCrater(-18, -5, 2.7);
  addCrater(21, 3, 2.4);
  addCrater(-9, -29, 2.1);
  addCrater(9, 29, 2.2);
  addCrater(-52, -7, 2.3);
  addCrater(52, 7, 2.3);
  addCrater(-64, 47, 2.7);
  addCrater(64, -47, 2.7);
  addPuddle(-5, 18, 1.7, 0.8, 0.4);
  addPuddle(6, -18, 1.6, 0.72, -0.5);
  addPuddle(-31, 7, 1.25, 0.58, 1.2);
  addPuddle(-59, -27, 1.45, 0.65, -0.6);
  addPuddle(59, 27, 1.45, 0.65, 0.6);
  addTrenchSegment(-30, 36, 10, -0.18);
  addTrenchSegment(30, -36, 10, Math.PI - 0.18);
  addTrenchSegment(-47, 68, 12, 0.05);
  addTrenchSegment(47, -68, 12, Math.PI + 0.05);
  addTrenchSegment(-70, -28, 10, Math.PI / 2);
  addTrenchSegment(70, 28, 10, Math.PI / 2);
  addRazorWire(-5, 27, 6, 0.1);
  addRazorWire(5, -27, 6, 0.1);
  addRazorWire(-38, 5, 5, Math.PI / 2);
  addRazorWire(38, -5, 5, Math.PI / 2);
  addRazorWire(-34, 70, 7, 0.1);
  addRazorWire(34, -70, 7, 0.1);
  addRazorWire(-74, 1, 6, Math.PI / 2);
  addRazorWire(74, -1, 6, Math.PI / 2);
  addWreckedVehicle(-33, -33, 0.55);
  addWreckedVehicle(33, 33, Math.PI + 0.35);
  addWreckedVehicle(-70, 22, -0.8);
  addWreckedVehicle(70, -22, Math.PI - 0.8);
  addSmokeColumn(-33, -33);
  addSmokeColumn(33, 33);
  addMudRuts(-3, 41, 8, 0.18);
  addMudRuts(8, -42, 8, Math.PI + 0.12);
  addMudRuts(-44, 0, 10, Math.PI / 2);
  addMudRuts(44, 0, 10, Math.PI / 2);
  addMudRuts(-52, 66, 9, -0.08);
  addMudRuts(52, -66, 9, Math.PI - 0.08);
  addSpentShells(-8, 33, 22, 4.2);
  addSpentShells(8, -33, 22, 4.2);
  addSpentShells(0, 8, 14, 3.5);
  addSpentShells(-41, 64, 18, 4.0);
  addSpentShells(41, -64, 18, 4.0);
  addMortarPit(-21, 37, "usa", -0.22);
  addMortarPit(21, -37, "germany", Math.PI - 0.22);
  addMortarPit(-38, 70, "usa", 0.1);
  addMortarPit(38, -70, "germany", Math.PI + 0.1);
  addDrivableVehicle(-2.6, 40.4, "Aster Outrider", teams.usa.color, 0.08, "rover");
  addDrivableVehicle(1.8, 40.0, "Aster Hammer Tank", 0x334155, -0.12, "tank");
  addDrivableVehicle(-15, 45, "Aster Wasp Helo", 0x1f3b57, 0.25, "helicopter");
  addDrivableVehicle(-28, 45, "Aster Kite Jet", 0x475569, 0.05, "jet");
  addDrivableVehicle(-11, 47, "Aster Scout", teams.usa.color, 0.08, "rover");
  addDrivableVehicle(-6, 70, "Aster Ridge Tank", 0x2f3f4f, -0.1, "tank");
  addDrivableVehicle(-44, 69, "Aster Longhorn IFV", 0x334155, 0.18, "halftrack");
  addDrivableVehicle(47, 64, "Aster Falcon Jet", 0x64748b, -0.25, "jet");
  addDrivableVehicle(11, -47, "Eisen Runner", teams.germany.color, Math.PI + 0.08, "rover");
  addDrivableVehicle(-9, -47, "Eisen Siege Tank", 0x51462d, Math.PI + 0.18, "tank");
  addDrivableVehicle(22, -44, "Eisen Vulture", 0x4c5548, Math.PI - 0.3, "helicopter");
  addDrivableVehicle(6, -70, "Eisen Iron Tank", 0x4b412c, Math.PI + 0.12, "tank");
  addDrivableVehicle(44, -69, "Eisen Moth Helo", 0x42503d, Math.PI - 0.18, "helicopter");
  addDrivableVehicle(-47, -64, "Eisen Pike Jet", 0x3f454b, Math.PI + 0.25, "jet");
  addDrivableVehicle(-46, 0, "Mudback IFV", 0x4b5563, Math.PI / 2, "halftrack");
  addDrivableVehicle(46, 0, "Crossroad IFV", 0x52525b, -Math.PI / 2, "halftrack");
  addTankTrap(-2, 34, 0.2);
  addTankTrap(2, -34, -0.2);
  addTankTrap(-45, 12, Math.PI / 2);
  addTankTrap(45, -12, Math.PI / 2);
  addTankTrap(-12, 69, 0.2);
  addTankTrap(12, -69, -0.2);
  addTankTrap(-73, 18, Math.PI / 2);
  addTankTrap(73, -18, Math.PI / 2);
}

function addBuilding(x, z, width, depth, height) {
  const matWall = materials.concrete;
  const matRoof = materials.concreteDark;
  addBlock({ x, z: z - depth / 2, width, height, depth: 0.9, material: matWall });
  addBlock({ x, z: z + depth / 2, width, height, depth: 0.9, material: matWall });
  addBlock({ x: x - width / 2, z, width: 0.9, height, depth, material: matWall });
  addBlock({ x: x + width / 2, z, width: 0.9, height, depth, material: matWall });
  addBlock({ x, y: height, z, width: width + 0.7, height: 0.45, depth: depth + 0.7, material: matRoof, blocks: false });
  addBlock({ x, y: height + 0.45, z: z - depth / 2 - 0.06, width: width + 0.9, height: 0.34, depth: 0.22, material: materials.concreteLight, blocks: false });
  addBlock({ x, y: height + 0.45, z: z + depth / 2 + 0.06, width: width + 0.9, height: 0.34, depth: 0.22, material: materials.concreteLight, blocks: false });
  addBlock({ x: x - width / 2 - 0.06, y: height + 0.45, z, width: 0.22, height: 0.34, depth: depth + 0.9, material: materials.concreteLight, blocks: false });
  addBlock({ x: x + width / 2 + 0.06, y: height + 0.45, z, width: 0.22, height: 0.34, depth: depth + 0.9, material: materials.concreteLight, blocks: false });
  addBlock({ x, y: 0.08, z: z - depth / 2 - 0.55, width: 2.2, height: 2.2, depth: 0.18, material: materials.darkMetal, blocks: false });
  addBlock({ x: x + width / 2 + 0.52, y: 1.6, z: z + depth * 0.18, width: 0.12, height: 2.4, depth: 0.12, material: materials.metal, blocks: false });
  addBlock({ x: x + width / 2 + 0.52, y: 3.0, z: z + depth * 0.18, width: 0.16, height: 0.22, depth: 1.35, material: materials.metal, blocks: false });

  for (let i = -1; i <= 1; i += 2) {
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.2), materials.glass);
    pane.position.set(x + i * (width / 2 + 0.01), 2.4, z - depth * 0.18);
    pane.rotation.y = i > 0 ? -Math.PI / 2 : Math.PI / 2;
    scene.add(pane);

    const frame = addBlock({
      x: x + i * (width / 2 + 0.03),
      y: 2.4,
      z: z - depth * 0.18,
      width: 0.12,
      height: 1.36,
      depth: 2.36,
      material: materials.darkMetal,
      blocks: false,
    });
    frame.rotation.y = i > 0 ? 0 : 0;
  }

  for (let i = -1; i <= 1; i += 1) {
    addBlock({ x: x + i * 2.6, y: height + 0.48, z: z + depth / 2 + 0.2, width: 1.2, height: 0.12, depth: 0.65, material: materials.metal, blocks: false });
  }
}

function addContainer(x, z, width, depth, height, rot, color) {
  const cmat = mat(color, 0.74, 0.25);
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rot;

  const body = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), cmat));
  body.position.y = height / 2;
  group.add(body);

  const ribMat = mat(0x111827, 0.55, 0.5);
  for (let i = -Math.floor(width / 2); i <= Math.floor(width / 2); i += 2) {
    const rib = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(0.16, height + 0.05, depth + 0.08), ribMat));
    rib.position.set(i, height / 2, 0);
    group.add(rib);
  }
  for (const side of [-1, 1]) {
    const doorLine = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(0.08, height - 0.45, 0.08), ribMat));
    doorLine.position.set(side * (width / 2 - 0.18), height / 2, -depth / 2 - 0.04);
    group.add(doorLine);
    for (const y of [0.78, 1.55, 2.32]) {
      const hinge = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.16), ribMat));
      hinge.position.set(side * (width / 2 - 0.38), y, -depth / 2 - 0.1);
      group.add(hinge);
    }
  }
  const serialPlate = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.34, 0.08), mat(0xf8fafc, 0.55, 0.05)), false, true);
  serialPlate.position.set(-width / 2 + 1.0, height * 0.72, depth / 2 + 0.06);
  group.add(serialPlate);
  scene.add(group);

  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  const blockWidth = Math.abs(width * cos) + Math.abs(depth * sin);
  const blockDepth = Math.abs(width * sin) + Math.abs(depth * cos);
  obstacles.push({
    minX: x - blockWidth / 2,
    maxX: x + blockWidth / 2,
    minZ: z - blockDepth / 2,
    maxZ: z + blockDepth / 2,
    height,
  });
  group.traverse((child) => {
    if (child.isMesh) obstacleMeshes.push(child);
  });
}

function addCrateStack(x, z, variant = 0) {
  const sizes = [
    [2.2, 1.4, 2.2],
    [1.8, 1.7, 1.8],
    [2.8, 1.1, 2],
  ];
  const count = variant + 2;
  for (let i = 0; i < count; i += 1) {
    const [w, h, d] = sizes[(i + variant) % sizes.length];
    addBlock({
      x: x + (i % 2) * 1.7,
      z: z + Math.floor(i / 2) * 1.6,
      width: w,
      height: h,
      depth: d,
      material: i % 2 ? materials.crateDark : materials.crate,
    });
  }
}

function addSandbagLine(x, z, count, rot) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rot;
  for (let i = 0; i < count; i += 1) {
    const bag = configureMesh(
      new THREE.Mesh(new THREE.CapsuleGeometry(0.31, 0.72, 4, 10), materials.sandbag),
    );
    bag.position.set((i - (count - 1) / 2) * 0.82, 0.38, 0);
    bag.rotation.z = Math.PI / 2;
    group.add(bag);

    const bagTop = configureMesh(
      new THREE.Mesh(new THREE.CapsuleGeometry(0.29, 0.68, 4, 10), materials.sandbag),
    );
    bagTop.position.set((i - (count - 1) / 2) * 0.82, 0.86, 0.12);
    bagTop.rotation.z = Math.PI / 2;
    group.add(bagTop);
  }
  scene.add(group);

  const width = count * 0.86;
  const depth = 1.15;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  obstacles.push({
    minX: x - (Math.abs(width * cos) + Math.abs(depth * sin)) / 2,
    maxX: x + (Math.abs(width * cos) + Math.abs(depth * sin)) / 2,
    minZ: z - (Math.abs(width * sin) + Math.abs(depth * cos)) / 2,
    maxZ: z + (Math.abs(width * sin) + Math.abs(depth * cos)) / 2,
    height: 1.15,
  });
  group.traverse((child) => {
    if (child.isMesh) obstacleMeshes.push(child);
  });
}

function addTower(x, z, teamKey) {
  const team = teams[teamKey];
  const wood = mat(0x533924, 0.8, 0.02);
  addBlock({ x, z, width: 4.8, height: 0.45, depth: 4.8, material: materials.crateDark });
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addCylinder({ x: x + sx * 1.8, y: 2.1, z: z + sz * 1.8, radius: 0.14, height: 4.2, material: wood, radial: 8 });
    }
  }
  addBlock({ x, y: 4.15, z, width: 5.3, height: 0.35, depth: 5.3, material: wood, blocks: false });
  addBlock({ x, y: 4.65, z, width: 5.8, height: 0.26, depth: 5.8, material: mat(team.color, 0.65, 0.05), blocks: false });
}

function addFlag(team, x, z) {
  addCylinder({ x, y: 2.2, z, radius: 0.08, height: 4.4, material: materials.metal, radial: 12 });
  const group = new THREE.Group();
  group.position.set(x + 0.85, 3.25, z);
  const flagBack = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 1.35),
    new THREE.MeshBasicMaterial({ color: team.color, side: THREE.DoubleSide }),
  );
  group.add(flagBack);

  if (team.flagPattern === "eisenmark") {
    const colors = [0x1f2937, 0xd7b11f, 0x991b1b];
    colors.forEach((color, index) => {
      const stripe = new THREE.Mesh(
        new THREE.PlaneGeometry(2.42, 0.46),
        new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }),
      );
      stripe.position.z = 0.01;
      stripe.position.y = 0.45 - index * 0.45;
      group.add(stripe);
    });
  } else {
    const field = new THREE.Mesh(
      new THREE.PlaneGeometry(0.88, 0.78),
      new THREE.MeshBasicMaterial({ color: 0x1e40af, side: THREE.DoubleSide }),
    );
    field.position.set(-0.73, 0.31, 0.02);
    group.add(field);
    for (let i = 0; i < 5; i += 1) {
      const stripe = new THREE.Mesh(
        new THREE.PlaneGeometry(2.42, 0.12),
        new THREE.MeshBasicMaterial({ color: i % 2 ? 0xdbeafe : 0x2563eb, side: THREE.DoubleSide }),
      );
      stripe.position.set(0, 0.5 - i * 0.25, 0.015);
      group.add(stripe);
    }
    const star = new THREE.Mesh(
      new THREE.CircleGeometry(0.11, 6),
      new THREE.MeshBasicMaterial({ color: 0xf8fafc, side: THREE.DoubleSide }),
    );
    star.position.set(-0.73, 0.31, 0.04);
    star.rotation.z = Math.PI / 2;
    group.add(star);
  }
  scene.add(group);
}

function addAmmoTable(x, z, teamKey) {
  const team = teams[teamKey];
  addBlock({ x, z, width: 4, height: 0.65, depth: 1.6, material: materials.crateDark });
  addBlock({ x: x - 1.15, y: 0.65, z, width: 0.8, height: 0.42, depth: 1.1, material: mat(team.color, 0.55, 0.15), blocks: false });
  addBlock({ x: x + 0.1, y: 0.65, z, width: 0.8, height: 0.42, depth: 1.1, material: materials.metal, blocks: false });
  addBlock({ x: x + 1.2, y: 0.65, z, width: 0.8, height: 0.42, depth: 1.1, material: materials.crate, blocks: false });
}

function createSoldier(teamKey, name, index) {
  const team = teams[teamKey];
  const bot = {
    id: `${teamKey}-${index}`,
    name,
    team: teamKey,
    group: new THREE.Group(),
    position: getSpawnPoint(teamKey, index),
    health: 100,
    armor: 25,
    alive: true,
    respawnTimer: 0,
    shootCooldown: Math.random() * 0.8,
    destination: getPatrolPoint(teamKey),
    strafeSeed: Math.random() * Math.PI * 2,
    hitMeshes: [],
    weapon: botWeapons[teamKey],
    lastAttacker: null,
    anim: 0,
  };

  bot.group.position.copy(bot.position);
  bot.group.name = `${team.label} ${name}`;

  const uniform = mat(team.uniform, 0.78, 0.05);
  const accent = mat(team.color, 0.6, 0.12);
  const dark = mat(0x111827, 0.58, 0.45);
  const skin = mat(0xb98b68, 0.88, 0.02);
  const boot = mat(0x171717, 0.72, 0.18);
  const webbing = mat(0x242923, 0.82, 0.04);
  const pouchMat = mat(0x6f6246, 0.9, 0.03);
  const patchMat = mat(team.light, 0.68, 0.08);

  const torso = configureMesh(new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 0.62, 6, 14), uniform));
  torso.position.y = 1.12;
  torso.scale.set(0.9, 1.03, 0.64);
  markHitMesh(torso, bot, "body");
  bot.group.add(torso);

  const vest = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.62, 0.28), accent));
  vest.position.set(0, 1.14, -0.25);
  markHitMesh(vest, bot, "body");
  bot.group.add(vest);

  for (const side of [-1, 1]) {
    const strap = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.82, 0.08), webbing));
    strap.position.set(side * 0.22, 1.18, -0.42);
    strap.rotation.z = side * 0.18;
    bot.group.add(strap);
  }
  for (let i = -1; i <= 1; i += 1) {
    const pouch = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.24, 0.12), pouchMat));
    pouch.position.set(i * 0.19, 0.98, -0.45);
    bot.group.add(pouch);
  }
  const nameTape = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.035), dark));
  nameTape.position.set(0, 1.43, -0.42);
  bot.group.add(nameTape);
  const chestPatch = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.04), patchMat));
  chestPatch.position.set(-0.24, 1.34, -0.43);
  bot.group.add(chestPatch);

  const head = configureMesh(new THREE.Mesh(new THREE.SphereGeometry(0.24, 18, 14), skin));
  head.position.y = 1.79;
  markHitMesh(head, bot, "head");
  bot.group.add(head);

  const helmet = configureMesh(new THREE.Mesh(new THREE.SphereGeometry(0.275, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), dark));
  helmet.position.y = 1.87;
  markHitMesh(helmet, bot, "head");
  bot.group.add(helmet);

  const helmetBrim = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.045, 0.18), dark));
  helmetBrim.position.set(0, 1.79, -0.18);
  bot.group.add(helmetBrim);
  const goggles = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.055), materials.glass));
  goggles.position.set(0, 1.78, -0.215);
  bot.group.add(goggles);
  for (const side of [-1, 1]) {
    const eyeMark = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.026, 0.025), dark), false, false);
    eyeMark.position.set(side * 0.075, 1.775, -0.25);
    bot.group.add(eyeMark);
  }
  const chinStrap = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.34, 0.045), webbing));
  chinStrap.position.set(0.19, 1.67, -0.05);
  chinStrap.rotation.z = -0.15;
  bot.group.add(chinStrap);
  const headset = configureMesh(new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.018, 6, 18, Math.PI), dark));
  headset.position.set(0, 1.88, -0.02);
  headset.rotation.x = Math.PI / 2;
  bot.group.add(headset);
  const mic = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 0.26), dark), false, false);
  mic.position.set(0.24, 1.68, -0.18);
  mic.rotation.y = -0.45;
  bot.group.add(mic);

  const belt = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.1, 0.42), dark));
  belt.position.y = 0.82;
  bot.group.add(belt);

  for (const side of [-1, 1]) {
    const leg = configureMesh(new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.58, 5, 10), uniform));
    leg.position.set(side * 0.17, 0.43, 0);
    markHitMesh(leg, bot, "body");
    bot.group.add(leg);

    const bootMesh = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.38), boot));
    bootMesh.position.set(side * 0.17, 0.1, -0.05);
    bot.group.add(bootMesh);
    const sole = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.045, 0.42), materials.rubber));
    sole.position.set(side * 0.17, 0.02, -0.07);
    bot.group.add(sole);

    const kneePad = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.08), dark));
    kneePad.position.set(side * 0.17, 0.5, -0.16);
    bot.group.add(kneePad);

    const shoulder = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.24), accent));
    shoulder.position.set(side * 0.44, 1.53, -0.03);
    shoulder.rotation.z = side * 0.18;
    bot.group.add(shoulder);

    const arm = configureMesh(new THREE.Mesh(new THREE.CapsuleGeometry(0.105, 0.62, 5, 10), uniform));
    arm.position.set(side * 0.47, 1.2, -0.06);
    arm.rotation.z = side * 0.18;
    arm.rotation.x = -0.65;
    markHitMesh(arm, bot, "body");
    bot.group.add(arm);

    const armBand = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.18, 0.22), patchMat));
    armBand.position.set(side * 0.56, 1.32, -0.1);
    bot.group.add(armBand);
  }

  const pack = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.62, 0.24), materials.crateDark));
  pack.position.set(0, 1.15, 0.31);
  bot.group.add(pack);

  const bedroll = configureMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.58, 14), materials.canvas));
  bedroll.position.set(0, 1.52, 0.44);
  bedroll.rotation.z = Math.PI / 2;
  bot.group.add(bedroll);

  const radio = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.28, 0.08), dark));
  radio.position.set(-0.24, 1.22, 0.46);
  bot.group.add(radio);
  const antenna = configureMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.72, 6), dark), true, false);
  antenna.position.set(-0.3, 1.72, 0.49);
  antenna.rotation.z = -0.24;
  bot.group.add(antenna);

  const rifle = buildBotRifle(teamKey);
  rifle.position.set(0.3, 1.18, -0.42);
  rifle.rotation.y = -0.12;
  bot.group.add(rifle);
  bot.rifle = rifle;

  const healthBack = new THREE.Mesh(
    new THREE.PlaneGeometry(0.88, 0.09),
    new THREE.MeshBasicMaterial({ color: 0x111827, transparent: true, opacity: 0.78, side: THREE.DoubleSide }),
  );
  healthBack.position.y = 2.28;
  const healthFill = new THREE.Mesh(
    new THREE.PlaneGeometry(0.82, 0.045),
    new THREE.MeshBasicMaterial({ color: team.light, side: THREE.DoubleSide }),
  );
  healthFill.position.set(0, 2.28, 0.01);
  bot.group.add(healthBack, healthFill);
  bot.healthFill = healthFill;
  bot.healthBack = healthBack;

  bot.group.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  scene.add(bot.group);
  bots.push(bot);
  return bot;
}

function markHitMesh(mesh, bot, zone) {
  mesh.userData.bot = bot;
  mesh.userData.zone = zone;
  bot.hitMeshes.push(mesh);
  botHitMeshes.push(mesh);
}

function buildBotRifle(teamKey) {
  const group = new THREE.Group();
  const team = teams[teamKey];
  const metal = mat(0x1f2937, 0.45, 0.7);
  const accent = mat(team.color, 0.58, 0.2);
  const body = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.74), metal));
  body.position.z = -0.18;
  const barrel = configureMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.72, 10), metal));
  barrel.rotation.x = Math.PI / 2;
  barrel.position.z = -0.78;
  const stock = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.38), metal));
  stock.position.z = 0.34;
  const mag = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.32, 0.18), accent));
  mag.position.set(0, -0.22, -0.12);
  const optic = configureMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.28, 12), metal));
  optic.rotation.x = Math.PI / 2;
  optic.position.set(0, 0.16, -0.24);
  const foregrip = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.1), metal));
  foregrip.position.set(0, -0.28, -0.5);
  const muzzle = configureMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.16, 10), metal));
  muzzle.rotation.x = Math.PI / 2;
  muzzle.position.z = -1.15;
  const sling = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.045, 0.82), mat(0x0f172a, 0.82, 0.06)));
  sling.position.set(-0.12, 0.07, -0.2);
  sling.rotation.y = -0.18;
  group.add(body, barrel, stock, mag, optic, foregrip, muzzle, sling);
  return group;
}

function getSpawnPoint(teamKey, index = 0) {
  const base = teams[teamKey].spawn;
  const side = teamKey === "usa" ? 1 : -1;
  const spread = [
    [-8, 0],
    [8, 0],
    [-15, -6 * side],
    [15, -6 * side],
    [0, -11 * side],
    [-24, -2 * side],
    [24, -2 * side],
    [-33, -9 * side],
    [33, -9 * side],
    [-42, -3 * side],
    [42, -3 * side],
    [-17, 8 * side],
    [17, 8 * side],
    [0, 11 * side],
    [-51, -11 * side],
    [51, -11 * side],
  ];
  for (let attempt = 0; attempt < spread.length * 2; attempt += 1) {
    const [x, z] = spread[(index + attempt) % spread.length];
    const candidate = new THREE.Vector3(
      base.x + x + THREE.MathUtils.randFloatSpread(2.3),
      0,
      base.z + z + THREE.MathUtils.randFloatSpread(2.3),
    );
    if (!collides(candidate, BOT_RADIUS + 0.22)) return candidate;
  }
  return new THREE.Vector3(base.x + THREE.MathUtils.randFloatSpread(4), 0, base.z - 9 * side + THREE.MathUtils.randFloatSpread(4));
}

function getPatrolPoint(teamKey) {
  const homeZone = teamKey === "usa"
    ? [MAP_HALF * 0.24, MAP_HALF * 0.78]
    : [-MAP_HALF * 0.78, -MAP_HALF * 0.24];
  const forwardZone = teamKey === "usa"
    ? [-MAP_HALF * 0.62, MAP_HALF * 0.23]
    : [-MAP_HALF * 0.23, MAP_HALF * 0.62];
  const zRange = Math.random() < 0.72 ? forwardZone : homeZone;
  return new THREE.Vector3(
    THREE.MathUtils.randFloatSpread(MAP_SIZE * 0.86),
    0,
    THREE.MathUtils.randFloat(zRange[0], zRange[1]),
  );
}

function spawnTeams() {
  usaNames.forEach((name, index) => createSoldier("usa", name, index));
  germanNames.forEach((name, index) => createSoldier("germany", name, index));
}

function selectWeapon(index) {
  selectedWeapon = THREE.MathUtils.clamp(index, 0, playerWeapons.length - 1);
  buildWeaponView(playerWeapons[selectedWeapon]);
  updateHud();
  showMessage(`${playerWeapons[selectedWeapon].roleName} class: ${playerWeapons[selectedWeapon].name}`);
}

function buildWeaponView(weapon) {
  weaponRoot.clear();
  currentWeaponModel = new THREE.Group();
  weaponRoot.add(currentWeaponModel);

  const black = mat(0x0f172a, 0.46, 0.82);
  const gunMetal = mat(weapon.color, 0.5, 0.66);
  const accent = mat(weapon.accent, 0.42, 0.4);
  const grip = mat(0x171717, 0.74, 0.24);
  const wood = mat(0x5c3820, 0.74, 0.07);
  const tan = mat(0xb79564, 0.72, 0.05);
  const glove = mat(0x0b1118, 0.86, 0.18);
  const sleeve = mat(teams.usa.uniform, 0.82, 0.04);

  function box(w, h, d, x, y, z, material, name) {
    const meshMaterial = material.clone ? material.clone() : material;
    const mesh = configureMesh(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), meshMaterial), false, false);
    mesh.position.set(x, y, z);
    mesh.name = name || "";
    mesh.userData.baseOpacity = mesh.material.opacity ?? 1;
    mesh.userData.baseTransparent = Boolean(mesh.material.transparent);
    currentWeaponModel.add(mesh);
    return mesh;
  }

  function cyl(r, h, x, y, z, material, radiusSegments = 16, axis = "z", name) {
    const meshMaterial = material.clone ? material.clone() : material;
    const mesh = configureMesh(new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, radiusSegments), meshMaterial), false, false);
    mesh.position.set(x, y, z);
    if (axis === "z") mesh.rotation.x = Math.PI / 2;
    if (axis === "x") mesh.rotation.z = Math.PI / 2;
    mesh.name = name || "";
    mesh.userData.baseOpacity = mesh.material.opacity ?? 1;
    mesh.userData.baseTransparent = Boolean(mesh.material.transparent);
    currentWeaponModel.add(mesh);
    return mesh;
  }

  if (weapon.id === "m4") {
    box(0.58, 0.3, 0.95, 0.15, -0.21, -0.62, gunMetal, "upper receiver");
    box(0.5, 0.22, 0.72, 0.15, -0.45, -0.55, black, "lower receiver");
    box(0.78, 0.12, 0.88, 0.15, -0.02, -0.66, black, "top rail");
    for (let i = 0; i < 8; i += 1) {
      box(0.08, 0.05, 0.1, -0.2 + i * 0.1, 0.07, -0.72, accent, "rail tooth");
    }
    cyl(0.055, 0.96, 0.15, -0.19, -1.35, black, 18, "z", "barrel");
    cyl(0.078, 0.24, 0.15, -0.19, -1.92, gunMetal, 18, "z", "muzzle brake");
    box(0.44, 0.56, 0.26, 0.15, -0.84, -0.52, black, "magazine");
    box(0.18, 0.5, 0.24, 0.08, -0.78, -0.18, grip, "pistol grip").rotation.x = -0.28;
    box(0.42, 0.18, 0.7, 0.15, -0.22, 0.18, black, "stock tube");
    box(0.55, 0.34, 0.2, 0.15, -0.23, 0.55, black, "stock pad");
    cyl(0.16, 0.54, 0.15, 0.19, -0.55, black, 22, "z", "optic");
    cyl(0.12, 0.62, 0.15, 0.19, -0.55, materials.lens, 22, "z", "optic glass");
    box(0.18, 0.22, 0.12, 0.15, 0.05, -1.65, accent, "front sight");
    box(0.28, 0.08, 0.48, -0.22, -0.19, -1.1, black, "left accessory rail");
    box(0.14, 0.12, 0.34, -0.34, -0.21, -1.08, accent, "laser module");
    cyl(0.06, 0.28, 0.42, -0.19, -1.18, black, 16, "z", "flashlight");
    box(0.16, 0.42, 0.14, 0.15, -0.56, -1.05, grip, "vertical foregrip");
    box(0.22, 0.08, 0.18, 0.49, -0.2, -0.42, black, "ejection port");
    box(0.28, 0.06, 0.12, -0.23, -0.08, -0.23, black, "charging handle");
    for (let i = 0; i < 4; i += 1) {
      cyl(0.024, 0.024, 0.48, -0.29 + i * 0.08, -0.64, accent, 10, "x", "receiver screw");
    }
    currentWeaponAimPosition = new THREE.Vector3(-0.15, -0.28, -0.9);
    currentMuzzleLocal = new THREE.Vector3(0.15, -0.19, -2.08);
  } else if (weapon.id === "shotgun") {
    box(0.58, 0.31, 0.74, 0.17, -0.24, -0.55, gunMetal, "receiver");
    cyl(0.06, 1.36, 0.09, -0.18, -1.33, black, 18, "z", "top barrel");
    cyl(0.052, 1.18, 0.27, -0.24, -1.24, black, 18, "z", "mag tube");
    box(0.54, 0.24, 0.56, 0.17, -0.38, -1.0, wood, "pump");
    box(0.18, 0.45, 0.25, 0.08, -0.76, -0.28, grip, "grip").rotation.x = -0.24;
    box(0.42, 0.28, 0.72, 0.17, -0.24, 0.13, wood, "wood stock");
    box(0.54, 0.34, 0.16, 0.17, -0.23, 0.58, tan, "stock butt");
    for (let i = 0; i < 5; i += 1) {
      cyl(0.045, 0.16, -0.19, -0.18, -0.55 + i * 0.12, accent, 12, "x", "shell loop");
    }
    for (let i = 0; i < 5; i += 1) {
      box(0.08, 0.035, 0.18, -0.07 + i * 0.09, -0.22, -1.04, tan, "pump groove");
    }
    for (let i = 0; i < 4; i += 1) {
      cyl(0.038, 0.18, -0.34, -0.18, -0.42 + i * 0.16, accent, 12, "x", "brass shell");
    }
    box(0.3, 0.06, 0.18, 0.47, -0.22, -0.45, black, "loading gate");
    cyl(0.028, 0.08, 0.09, -0.06, -1.96, accent, 10, "z", "bead sight");
    currentWeaponAimPosition = new THREE.Vector3(-0.1, -0.31, -0.88);
    currentMuzzleLocal = new THREE.Vector3(0.09, -0.18, -2.02);
  } else if (weapon.id === "springfield") {
    box(0.46, 0.27, 1.08, 0.16, -0.25, -0.65, wood, "wood chassis");
    box(0.42, 0.22, 0.62, 0.16, -0.21, -0.62, gunMetal, "bolt receiver");
    cyl(0.045, 1.58, 0.16, -0.18, -1.58, black, 20, "z", "precision barrel");
    cyl(0.065, 0.22, 0.16, -0.18, -2.42, gunMetal, 20, "z", "crowned muzzle");
    box(0.18, 0.18, 0.28, 0.17, -0.56, -0.42, black, "internal magazine");
    box(0.35, 0.22, 0.8, 0.16, -0.25, 0.15, wood, "stock");
    box(0.5, 0.3, 0.16, 0.16, -0.24, 0.62, tan, "stock pad");
    cyl(0.13, 0.78, 0.16, 0.15, -0.62, black, 24, "z", "scope tube");
    cyl(0.17, 0.1, 0.16, 0.15, -1.04, black, 24, "z", "scope lens");
    cyl(0.1, 0.08, 0.16, 0.15, -0.22, materials.lens, 24, "z", "rear lens");
    box(0.08, 0.16, 0.18, 0.44, -0.24, -0.2, black, "bolt handle");
    cyl(0.08, 0.24, 0.16, 0.32, -0.62, black, 18, "y", "scope elevation");
    cyl(0.06, 0.18, 0.36, 0.15, -0.62, black, 18, "x", "scope windage");
    box(0.12, 0.08, 0.58, -0.12, -0.08, -1.18, black, "folded bipod left").rotation.z = 0.18;
    box(0.12, 0.08, 0.58, 0.44, -0.08, -1.18, black, "folded bipod right").rotation.z = -0.18;
    for (let i = 0; i < 5; i += 1) {
      box(0.04, 0.045, 0.36, -0.06 + i * 0.09, -0.04, -0.24, tan, "leather wrap");
    }
    cyl(0.035, 0.14, 0.49, -0.25, -0.19, black, 12, "x", "bolt knob");
    currentWeaponAimPosition = new THREE.Vector3(-0.16, -0.26, -1.02);
    currentMuzzleLocal = new THREE.Vector3(0.16, -0.18, -2.55);
  } else if (weapon.id === "viper") {
    box(0.46, 0.24, 0.72, 0.16, -0.25, -0.58, gunMetal, "compact receiver");
    box(0.38, 0.18, 0.48, 0.16, -0.45, -0.54, black, "lower frame");
    box(0.58, 0.08, 0.74, 0.16, -0.06, -0.58, accent, "micro rail");
    cyl(0.044, 0.72, 0.16, -0.21, -1.16, black, 16, "z", "short barrel");
    cyl(0.076, 0.44, 0.16, -0.21, -1.72, black, 18, "z", "suppressor");
    box(0.28, 0.64, 0.2, 0.16, -0.88, -0.46, black, "straight magazine");
    box(0.16, 0.46, 0.2, 0.08, -0.72, -0.16, grip, "compact grip").rotation.x = -0.24;
    box(0.32, 0.12, 0.52, 0.16, -0.24, 0.1, black, "folding stock");
    box(0.42, 0.18, 0.12, 0.16, -0.24, 0.42, black, "stock pad");
    cyl(0.11, 0.32, 0.16, 0.1, -0.56, black, 18, "z", "holo sight");
    cyl(0.08, 0.36, 0.16, 0.1, -0.56, materials.lens, 18, "z", "holo lens");
    box(0.12, 0.32, 0.1, 0.16, -0.58, -1.02, grip, "angled foregrip").rotation.x = -0.42;
    for (let i = 0; i < 5; i += 1) {
      box(0.07, 0.035, 0.11, -0.02 + i * 0.09, 0.01, -0.88, accent, "vent slot");
    }
    currentWeaponAimPosition = new THREE.Vector3(-0.16, -0.29, -0.84);
    currentMuzzleLocal = new THREE.Vector3(0.16, -0.21, -1.98);
  } else if (weapon.id === "raven") {
    box(0.72, 0.34, 1.18, 0.16, -0.23, -0.68, gunMetal, "heavy receiver");
    box(0.88, 0.14, 1.08, 0.16, 0.01, -0.72, black, "heavy top rail");
    cyl(0.064, 1.54, 0.16, -0.2, -1.65, black, 20, "z", "heavy barrel");
    cyl(0.09, 0.32, 0.16, -0.2, -2.52, gunMetal, 20, "z", "ported muzzle");
    box(0.74, 0.58, 0.32, 0.16, -0.78, -0.58, mat(0x2f3a32, 0.72, 0.28), "box magazine");
    box(0.18, 0.48, 0.22, 0.02, -0.77, -0.18, grip, "rear grip").rotation.x = -0.22;
    box(0.52, 0.2, 0.86, 0.16, -0.22, 0.24, black, "support stock");
    cyl(0.14, 0.62, 0.16, 0.18, -0.66, black, 22, "z", "combat optic");
    cyl(0.105, 0.66, 0.16, 0.18, -0.66, materials.lens, 22, "z", "combat optic lens");
    box(0.12, 0.1, 0.9, -0.12, -0.06, -1.32, black, "bipod leg left").rotation.z = 0.28;
    box(0.12, 0.1, 0.9, 0.44, -0.06, -1.32, black, "bipod leg right").rotation.z = -0.28;
    for (let i = 0; i < 8; i += 1) {
      cyl(0.026, 0.22, -0.24 + i * 0.07, -0.13, -0.98, accent, 8, "x", "feed belt round");
    }
    currentWeaponAimPosition = new THREE.Vector3(-0.16, -0.27, -0.98);
    currentMuzzleLocal = new THREE.Vector3(0.16, -0.2, -2.76);
  } else if (weapon.id === "rpg") {
    cyl(0.18, 1.62, 0.16, -0.24, -1.05, gunMetal, 24, "z", "launcher tube");
    cyl(0.22, 0.18, 0.16, -0.24, -1.94, black, 24, "z", "blast cone");
    cyl(0.14, 0.42, 0.16, -0.24, -2.18, accent, 18, "z", "rocket warhead");
    cyl(0.1, 0.36, 0.16, -0.24, -2.48, mat(0xf97316, 0.5, 0.22), 18, "z", "rocket nose");
    box(0.56, 0.16, 0.36, 0.16, -0.02, -0.82, black, "launcher top rail");
    cyl(0.12, 0.36, 0.16, 0.12, -0.64, black, 18, "z", "launcher optic");
    cyl(0.09, 0.4, 0.16, 0.12, -0.64, materials.lens, 18, "z", "launcher optic lens");
    box(0.16, 0.52, 0.18, 0.06, -0.76, -0.46, grip, "launcher rear grip").rotation.x = -0.2;
    box(0.14, 0.42, 0.16, 0.18, -0.62, -1.22, grip, "launcher foregrip").rotation.x = -0.12;
    box(0.42, 0.28, 0.16, 0.16, -0.28, 0.04, tan, "shoulder pad");
    for (let i = 0; i < 5; i += 1) {
      box(0.06, 0.04, 0.28, -0.08 + i * 0.12, -0.05, -1.2, accent, "tube warning stripe");
    }
    currentWeaponAimPosition = new THREE.Vector3(-0.16, -0.3, -0.92);
    currentMuzzleLocal = new THREE.Vector3(0.16, -0.24, -2.72);
  } else {
    box(0.34, 0.24, 0.58, 0.18, -0.24, -0.48, gunMetal, "pistol slide");
    box(0.3, 0.18, 0.46, 0.18, -0.42, -0.42, black, "pistol frame");
    cyl(0.038, 0.48, 0.18, -0.22, -0.84, black, 14, "z", "pistol barrel");
    box(0.18, 0.46, 0.2, 0.12, -0.72, -0.2, grip, "pistol grip").rotation.x = -0.28;
    box(0.16, 0.08, 0.08, 0.18, -0.04, -0.18, accent, "rear sight");
    box(0.1, 0.08, 0.08, 0.18, -0.04, -0.72, accent, "front sight");
    box(0.18, 0.18, 0.08, 0.36, -0.34, -0.4, black, "slide release");
    currentWeaponAimPosition = new THREE.Vector3(-0.18, -0.25, -0.74);
    currentMuzzleLocal = new THREE.Vector3(0.18, -0.22, -1.12);
  }

  function addHand(side, x, y, z, gripAngle = 0) {
    const arm = cyl(0.085, 0.55, x + side * 0.05, y - 0.06, z + 0.18, sleeve, 12, "z", "player sleeve");
    arm.rotation.y = side * 0.25 + gripAngle;
    const palm = box(0.2, 0.14, 0.24, x, y, z, glove, "player glove");
    palm.rotation.y = side * 0.18 + gripAngle;
    palm.rotation.z = side * 0.06;
    for (let i = 0; i < 4; i += 1) {
      const finger = box(0.035, 0.045, 0.18, x + side * (-0.06 + i * 0.04), y + 0.06, z - 0.08, glove, "player glove finger");
      finger.rotation.x = -0.36;
      finger.rotation.y = side * 0.12 + gripAngle;
    }
    const knuckle = box(0.18, 0.035, 0.05, x, y + 0.09, z - 0.02, mat(0x1f2937, 0.72, 0.25), "knuckle guard");
    knuckle.rotation.y = side * 0.18 + gripAngle;
  }
  addHand(1, 0.33, -0.68, -0.36, -0.05);
  addHand(-1, -0.14, -0.51, -1.04, 0.14);

  currentWeaponBasePosition = new THREE.Vector3(0.36, -0.39, -0.58);
  currentWeaponModel.position.copy(currentWeaponBasePosition);
  currentWeaponModel.rotation.set(-0.02, -0.18, 0.02);
  currentWeaponModel.traverse((child) => {
    if (!child.isMesh) return;
    child.userData.fadeOnAim = /optic|scope|lens/i.test(child.name);
  });
  weaponRoot.position.set(0, 0, 0);
}

function onResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function startGame() {
  if (!gameStarted) {
    gameStarted = true;
    showMessage("Squad deployed. Push the Eisenmark line.");
  }
  startScreen.classList.add("hidden");
  pauseScreen.classList.add("hidden");
  canvas.focus();
}

function requestLock() {
  startGame();
  if (!canvas.requestPointerLock) {
    showMessage("Mouse look active. Pointer lock is unavailable here.");
    return;
  }
  const lockRequest = canvas.requestPointerLock();
  if (lockRequest?.catch) {
    lockRequest.catch(() => {
      showMessage("Mouse look active. Click and drag if the cursor is not locked.");
    });
  }
}

function updatePointerLockState() {
  const locked = document.pointerLockElement === canvas;
  if (locked) {
    pointerLockWasActive = true;
    startScreen.classList.add("hidden");
    pauseScreen.classList.add("hidden");
    startGame();
  } else if (gameStarted && !gameOver && pointerLockWasActive) {
    pauseScreen.classList.remove("hidden");
  }
}

function onMouseMove(event) {
  if (!gameStarted) return;
  const sensitivity = 0.0021;
  playerRig.rotation.y -= event.movementX * sensitivity;
  pitchRig.rotation.x -= event.movementY * sensitivity;
  pitchRig.rotation.x = THREE.MathUtils.clamp(pitchRig.rotation.x, -1.36, 1.28);
  weaponSwayX += THREE.MathUtils.clamp(event.movementX * 0.0009, -0.08, 0.08);
  weaponSwayY += THREE.MathUtils.clamp(event.movementY * 0.0009, -0.08, 0.08);
}

function onKeyDown(event) {
  keys.add(event.code);
  if (event.code.startsWith("Digit")) {
    const index = Number(event.code.slice(5)) - 1;
    if (index >= 0 && index < playerWeapons.length) selectWeapon(index);
  }
  if (event.code === "KeyR") startReload();
  if (event.code === "KeyG") throwGrenade();
  if (event.code === "KeyT") throwSmokeGrenade();
  if (event.code === "KeyQ") throwFlashbang();
  if (event.code === "KeyF") knifeAttack();
  if (event.code === "KeyH") useMedkit();
  if (event.code === "KeyE") toggleVehicle();
  if ((event.code === "ControlLeft" || event.code === "ControlRight") && player.alive && !activeVehicle && player.stance !== "prone") {
    player.stance = "crouch";
    showMessage("Crouched", 0.8);
  }
  if (event.code === "KeyZ" && player.alive) {
    player.stance = player.stance === "prone" ? "stand" : "prone";
    showMessage(player.stance === "prone" ? "Prone" : "Standing", 0.9);
  }
  if (event.code === "Space" && player.alive && player.grounded && player.stance !== "prone") {
    player.verticalVelocity = 6.2;
    player.grounded = false;
  }
}

function onKeyUp(event) {
  keys.delete(event.code);
  if ((event.code === "ControlLeft" || event.code === "ControlRight") && player.stance === "crouch") {
    player.stance = "stand";
    showMessage("Standing", 0.8);
  }
}

function onMouseDown(event) {
  if (event.button === 2 || event.buttons === 2) {
    event.preventDefault();
    if (!gameStarted) requestLock();
    isAiming = true;
    return;
  }
  if (event.button !== 0) return;
  if (!gameStarted) {
    requestLock();
    return;
  }
  if (document.pointerLockElement !== canvas) requestLock();
  mouseDown = true;
  if (activeVehicle) {
    fireVehicleWeapon();
    return;
  }
  if (!playerWeapons[selectedWeapon].automatic) tryShoot();
}

function onMouseUp(event) {
  if (event.button === 0) mouseDown = false;
  if (event.button === 2) isAiming = false;
}

function onPointerDown(event) {
  if (event.button !== 2) return;
  event.preventDefault();
  if (!gameStarted) requestLock();
  isAiming = true;
}

function onPointerUp(event) {
  if (event.button === 2) isAiming = false;
}

function onContextMenu(event) {
  event.preventDefault();
}

function onWheel(event) {
  if (!gameStarted) return;
  const next = selectedWeapon + (event.deltaY > 0 ? 1 : -1);
  selectWeapon((next + playerWeapons.length) % playerWeapons.length);
}

function findNearestVehicle(maxDistance = 5.8) {
  let nearest = null;
  let best = maxDistance;
  for (const vehicle of vehicles) {
    const dist = vehicle.position.distanceTo(player.position);
    if (dist < best) {
      best = dist;
      nearest = vehicle;
    }
  }
  return nearest;
}

function toggleVehicle() {
  if (!gameStarted || gameOver || !player.alive) return;
  if (activeVehicle) {
    exitVehicle();
    return;
  }
  const vehicle = findNearestVehicle();
  if (!vehicle) {
    showMessage("No vehicle nearby");
    return;
  }
  if (vehicle.health <= 0) {
    showMessage(`${vehicle.label} is destroyed`);
    return;
  }
  activeVehicle = vehicle;
  activeVehicle.speed = 0;
  player.stance = "stand";
  weaponRoot.visible = false;
  showMessage(`${vehicle.airVehicle ? "Flying" : "Driving"} ${vehicle.label}. ${vehicle.maxMissileAmmo ? "Click fires missiles. " : ""}Press E to exit.`);
}

function exitVehicle({ silent = false } = {}) {
  if (!activeVehicle) return;
  const right = new THREE.Vector3(Math.cos(activeVehicle.yaw), 0, -Math.sin(activeVehicle.yaw));
  player.position.copy(activeVehicle.position).addScaledVector(right, activeVehicle.radius + 1.1);
  player.velocity.set(0, 0, 0);
  player.eyeHeight = 1.68;
  weaponRoot.visible = true;
  if (!silent) showMessage(`Exited ${activeVehicle.label}`);
  activeVehicle = null;
  updatePlayerRig();
}

function updateVehicleDriving(delta) {
  if (!activeVehicle) return;
  const vehicle = activeVehicle;
  vehicle.missileCooldown = Math.max(0, vehicle.missileCooldown - delta);
  const throttle = (keys.has("KeyW") ? 1 : 0) - (keys.has("KeyS") ? 1 : 0);
  const steer = (keys.has("KeyA") ? 1 : 0) - (keys.has("KeyD") ? 1 : 0);
  const maxSpeed = vehicle.maxSpeed;
  const reverseSpeed = vehicle.reverseSpeed;
  const targetSpeed = throttle >= 0 ? throttle * maxSpeed : throttle * reverseSpeed;
  vehicle.speed = THREE.MathUtils.damp(vehicle.speed, targetSpeed, throttle ? (vehicle.airVehicle ? 2.6 : 4.5) : 2.8, delta);
  const steerPower = vehicle.type === "tank" ? 1.05 : vehicle.type === "halftrack" ? 1.45 : vehicle.airVehicle ? 1.25 : 1.95;
  vehicle.yaw += steer * steerPower * delta * THREE.MathUtils.clamp(Math.abs(vehicle.speed) / 5, vehicle.airVehicle ? 0.42 : 0.18, 1.15) * (vehicle.speed >= 0 ? 1 : -1);
  const dx = -Math.sin(vehicle.yaw) * vehicle.speed * delta;
  const dz = -Math.cos(vehicle.yaw) * vehicle.speed * delta;

  if (vehicle.airVehicle) {
    const climb = (keys.has("Space") ? 1 : 0) - (keys.has("ControlLeft") || keys.has("ControlRight") ? 1 : 0);
    vehicle.position.x += dx;
    vehicle.position.z += dz;
    vehicle.position.y = THREE.MathUtils.clamp(vehicle.position.y + climb * (vehicle.type === "jet" ? 12 : 8) * delta, 0.6, vehicle.type === "jet" ? 28 : 18);
    vehicle.position.x = THREE.MathUtils.clamp(vehicle.position.x, -MAP_HALF + 2.5, MAP_HALF - 2.5);
    vehicle.position.z = THREE.MathUtils.clamp(vehicle.position.z, -MAP_HALF + 2.5, MAP_HALF - 2.5);
  } else {
    moveWithCollision(vehicle.position, dx, dz, vehicle.radius);
    vehicle.position.y = 0;
  }

  vehicle.group.position.copy(vehicle.position);
  vehicle.group.rotation.y = vehicle.yaw;
  vehicle.wheels.forEach((wheel) => {
    wheel.rotation.y += vehicle.speed * delta * 2.2;
  });
  vehicle.rotors.forEach((rotor, index) => {
    rotor.rotation.y += delta * (index === 2 ? 24 : 42);
    rotor.rotation.z += index === 2 ? delta * 30 : 0;
  });
  player.position.copy(vehicle.position);
  player.eyeHeight = THREE.MathUtils.damp(player.eyeHeight, vehicle.seatHeight, 10, delta);
  player.verticalOffset = 0;
  player.velocity.set(0, 0, 0);
  updatePlayerRig();
}

function updatePlayer(delta) {
  if (activeVehicle) {
    updateVehicleDriving(delta);
    return;
  }

  if (!player.alive) {
    player.respawnTimer -= delta;
    if (player.respawnTimer <= 0) respawnPlayer();
    return;
  }

  const moveX = (keys.has("KeyD") ? 1 : 0) - (keys.has("KeyA") ? 1 : 0);
  const moveZ = (keys.has("KeyS") ? 1 : 0) - (keys.has("KeyW") ? 1 : 0);
  tempA.set(0, 0, 0);
  const yaw = playerRig.rotation.y;
  const forward = tempB.set(-Math.sin(yaw), 0, -Math.cos(yaw));
  const right = tempC.set(Math.cos(yaw), 0, -Math.sin(yaw));
  tempA.addScaledVector(right, moveX);
  tempA.addScaledVector(forward, -moveZ);

  player.moving = tempA.lengthSq() > 0.001;
  if (player.moving) tempA.normalize();

  const targetEyeHeight = player.stance === "prone" ? 0.46 : player.stance === "crouch" ? 1.05 : 1.68;
  player.eyeHeight = THREE.MathUtils.damp(player.eyeHeight, targetEyeHeight, 12, delta);

  player.sprinting = (keys.has("ShiftLeft") || keys.has("ShiftRight")) && player.stance === "stand";
  const stanceSpeed = player.stance === "prone" ? 0.34 : player.stance === "crouch" ? 0.58 : 1;
  const targetSpeed = (player.sprinting ? 9.2 : 6.4) * stanceSpeed;
  const accel = player.grounded ? 16 : 6;
  player.velocity.x = THREE.MathUtils.damp(player.velocity.x, tempA.x * targetSpeed, accel, delta);
  player.velocity.z = THREE.MathUtils.damp(player.velocity.z, tempA.z * targetSpeed, accel, delta);

  player.verticalVelocity -= 18 * delta;
  player.verticalOffset += player.verticalVelocity * delta;
  if (player.verticalOffset <= 0) {
    player.verticalOffset = 0;
    player.verticalVelocity = 0;
    player.grounded = true;
  }

  moveWithCollision(player.position, player.velocity.x * delta, player.velocity.z * delta, PLAYER_RADIUS);
  updatePlayerRig();
}

function updatePlayerRig() {
  playerRig.position.set(player.position.x, player.position.y + player.eyeHeight + player.verticalOffset, player.position.z);
}

function moveWithCollision(position, dx, dz, radius) {
  if (Math.abs(dx) > 0) {
    position.x += dx;
    if (collides(position, radius)) position.x -= dx;
  }
  if (Math.abs(dz) > 0) {
    position.z += dz;
    if (collides(position, radius)) position.z -= dz;
  }
  position.x = THREE.MathUtils.clamp(position.x, -MAP_HALF + 1.8, MAP_HALF - 1.8);
  position.z = THREE.MathUtils.clamp(position.z, -MAP_HALF + 1.8, MAP_HALF - 1.8);
}

function collides(position, radius) {
  return collidesAtHeight(position, radius, 1.2);
}

function collidesAtHeight(position, radius, height) {
  return obstacles.some(
    (obstacle) =>
      height <= obstacle.height + radius &&
      position.x > obstacle.minX - radius &&
      position.x < obstacle.maxX + radius &&
      position.z > obstacle.minZ - radius &&
      position.z < obstacle.maxZ + radius,
  );
}

function throwGrenade() {
  throwThrowable("frag");
}

function throwSmokeGrenade() {
  throwThrowable("smoke");
}

function throwFlashbang() {
  throwThrowable("flash");
}

function throwThrowable(kind) {
  if (!gameStarted || gameOver || !player.alive) return;
  if (activeVehicle) {
    showMessage("Exit the vehicle to throw tactical gear");
    return;
  }
  if (kind === "frag" && grenadeCooldown > 0) return;
  if (kind !== "frag" && utilityCooldown > 0) return;
  const field = kind === "smoke" ? "smokes" : kind === "flash" ? "flashes" : "grenades";
  if (player[field] <= 0) {
    showMessage(`No ${kind === "frag" ? "grenades" : kind === "smoke" ? "smokes" : "flashbangs"} left`);
    return;
  }

  player[field] -= 1;
  if (kind === "frag") grenadeCooldown = 1.2;
  else utilityCooldown = 1.0;
  const origin = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.getWorldQuaternion(tempQuat));
  camera.getWorldPosition(origin);
  camera.getWorldDirection(direction);
  origin.addScaledVector(direction, 0.65).addScaledVector(right, 0.18).y -= 0.16;

  const body = new THREE.Group();
  const shellColor = kind === "smoke" ? 0x94a3b8 : kind === "flash" ? 0xe5e7eb : 0x314027;
  const bandColor = kind === "smoke" ? 0x38bdf8 : kind === "flash" ? 0xf8fafc : 0xfacc15;
  const shell = configureMesh(new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), mat(shellColor, 0.72, 0.18)));
  const band = configureMesh(new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.012, 6, 16), mat(bandColor, 0.55, 0.1)));
  band.rotation.x = Math.PI / 2;
  const pin = configureMesh(new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.008, 6, 14), materials.metal));
  pin.position.set(0.12, 0.08, 0);
  pin.rotation.y = Math.PI / 2;
  body.add(shell, band, pin);
  body.position.copy(origin);
  scene.add(body);

  grenades.push({
    mesh: body,
    kind,
    velocity: direction.multiplyScalar(kind === "flash" ? 20 : 18).add(new THREE.Vector3(0, kind === "smoke" ? 4.8 : 5.2, 0)),
    fuse: kind === "smoke" ? 1.15 : kind === "flash" ? 1.0 : 2.45,
    bounces: 0,
  });
  showMessage(`${kind === "frag" ? "Grenade" : kind === "smoke" ? "Smoke" : "Flashbang"} thrown`);
  updateHud();
}

function updateGrenades(delta) {
  grenadeCooldown = Math.max(0, grenadeCooldown - delta);
  utilityCooldown = Math.max(0, utilityCooldown - delta);
  knifeCooldown = Math.max(0, knifeCooldown - delta);
  medkitCooldown = Math.max(0, medkitCooldown - delta);

  for (let i = grenades.length - 1; i >= 0; i -= 1) {
    const grenade = grenades[i];
    grenade.fuse -= delta;
    grenade.velocity.y -= 13.5 * delta;
    const previous = grenade.mesh.position.clone();
    grenade.mesh.position.addScaledVector(grenade.velocity, delta);
    grenade.mesh.rotation.x += delta * 8;
    grenade.mesh.rotation.z += delta * 5;

    if (grenade.mesh.position.y <= 0.22) {
      grenade.mesh.position.y = 0.22;
      grenade.velocity.y = Math.abs(grenade.velocity.y) * 0.38;
      grenade.velocity.x *= 0.72;
      grenade.velocity.z *= 0.72;
      grenade.bounces += 1;
    }
    if (collidesAtHeight(grenade.mesh.position, 0.18, grenade.mesh.position.y)) {
      grenade.mesh.position.copy(previous);
      grenade.velocity.x *= -0.42;
      grenade.velocity.z *= -0.42;
      grenade.bounces += 1;
    }

    if (grenade.fuse <= 0) {
      detonateThrowable(grenade);
      grenades.splice(i, 1);
    }
  }
}

function detonateThrowable(grenade) {
  if (grenade.kind === "smoke") {
    detonateSmoke(grenade);
    return;
  }
  if (grenade.kind === "flash") {
    detonateFlashbang(grenade);
    return;
  }
  explodeGrenade(grenade);
}

function explodeGrenade(grenade) {
  const point = grenade.mesh.position.clone();
  scene.remove(grenade.mesh);
  makeExplosion(point, 8.2);
  for (const bot of bots) {
    if (!bot.alive || bot.team === player.team) continue;
    const distance = bot.position.distanceTo(point);
    if (distance > 8.2) continue;
    const damage = THREE.MathUtils.clamp(116 * (1 - distance / 8.2), 18, 116);
    damageBot(bot, damage, "player", "body", bot.position.clone().add(new THREE.Vector3(0, 1, 0)));
  }
  if (player.alive) {
    const playerDist = player.position.distanceTo(point);
    if (playerDist < 6.2) takePlayerDamage(THREE.MathUtils.clamp(70 * (1 - playerDist / 6.2), 8, 70), { name: "grenade", team: "germany" });
  }
}

function detonateSmoke(grenade) {
  const point = grenade.mesh.position.clone();
  scene.remove(grenade.mesh);
  for (let i = 0; i < 18; i += 1) {
    const smoke = new THREE.Mesh(
      new THREE.SphereGeometry(THREE.MathUtils.randFloat(0.55, 0.95), 12, 8),
      new THREE.MeshBasicMaterial({ color: 0x9ca3af, transparent: true, opacity: 0.28, depthWrite: false }),
    );
    smoke.position.copy(point).add(new THREE.Vector3(THREE.MathUtils.randFloatSpread(2.2), THREE.MathUtils.randFloat(0.35, 2.1), THREE.MathUtils.randFloatSpread(2.2)));
    smoke.scale.set(1.5, 0.72, 1.25);
    scene.add(smoke);
    particles.push({
      mesh: smoke,
      velocity: new THREE.Vector3(THREE.MathUtils.randFloatSpread(0.42), THREE.MathUtils.randFloat(0.18, 0.55), THREE.MathUtils.randFloatSpread(0.42)),
      life: THREE.MathUtils.randFloat(7.5, 10),
      startLife: 10,
      type: "smoke cloud",
    });
  }
  showMessage("Smoke deployed");
}

function detonateFlashbang(grenade) {
  const point = grenade.mesh.position.clone();
  scene.remove(grenade.mesh);
  const flash = new THREE.PointLight(0xffffff, 5.5, 28);
  flash.position.copy(point).y += 1.2;
  scene.add(flash);
  particles.push({ mesh: flash, life: 0.18, startLife: 0.18, type: "explosion light" });
  for (const bot of bots) {
    if (!bot.alive || bot.team === player.team) continue;
    const distance = bot.position.distanceTo(point);
    if (distance < 13) bot.shootCooldown += THREE.MathUtils.lerp(2.8, 0.6, distance / 13);
  }
  if (player.alive && player.position.distanceTo(point) < 14) {
    flashTimer = 1.35;
    flashOverlayEl.classList.add("active");
  }
  showMessage("Flashbang popped");
}

function makeExplosion(point, radius = 7) {
  const flash = new THREE.PointLight(0xffc36b, 4.2, 26);
  flash.position.copy(point).y += 1.3;
  scene.add(flash);
  particles.push({ mesh: flash, life: 0.2, startLife: 0.2, type: "explosion light" });

  const shock = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 18, 12),
    new THREE.MeshBasicMaterial({ color: 0xffb86b, transparent: true, opacity: 0.36, depthWrite: false }),
  );
  shock.position.copy(point).y += 0.8;
  scene.add(shock);
  particles.push({ mesh: shock, life: 0.38, startLife: 0.38, type: "shockwave", radius });

  for (let i = 0; i < 34; i += 1) {
    const spark = new THREE.Mesh(
      new THREE.SphereGeometry(THREE.MathUtils.randFloat(0.025, 0.075), 6, 5),
      new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffedd5 : 0xfb923c, transparent: true, opacity: 0.95 }),
    );
    spark.position.copy(point).y += THREE.MathUtils.randFloat(0.2, 1.1);
    const velocity = new THREE.Vector3(
      THREE.MathUtils.randFloatSpread(9),
      THREE.MathUtils.randFloat(2, 8),
      THREE.MathUtils.randFloatSpread(9),
    );
    scene.add(spark);
    particles.push({ mesh: spark, velocity, life: THREE.MathUtils.randFloat(0.45, 0.85), startLife: 0.85, type: "spark" });
  }
  addCrater(point.x, point.z, THREE.MathUtils.randFloat(1.4, 2.1), 0.12);
  addSmokeColumn(point.x, point.z);
}

function knifeAttack() {
  if (!gameStarted || gameOver || !player.alive) return;
  if (activeVehicle) {
    showMessage("Exit the vehicle to use the knife");
    return;
  }
  if (knifeCooldown > 0) return;
  knifeCooldown = 0.72;
  knifeSlashTimer = 0.16;
  knifeSlashEl.classList.add("active");

  const origin = new THREE.Vector3();
  const direction = new THREE.Vector3();
  camera.getWorldPosition(origin);
  camera.getWorldDirection(direction);
  raycaster.set(origin, direction);
  raycaster.far = 2.75;
  const activeEnemyMeshes = botHitMeshes.filter((mesh) => mesh.userData.bot?.alive && mesh.userData.bot.team !== player.team);
  const hit = raycaster.intersectObjects(activeEnemyMeshes, true)[0];
  if (hit) {
    const bot = findBotFromObject(hit.object);
    if (bot) {
      damageBot(bot, 94, "player", hit.object.userData.zone || "body", hit.point);
      showHitMarker();
      showMessage(`Knife hit ${bot.name}`);
      makeImpact(hit.point, 0xf8fafc, 4);
      return;
    }
  }
  showMessage("Knife missed", 0.8);
}

function useMedkit() {
  if (!gameStarted || gameOver || !player.alive) return;
  if (activeVehicle) {
    showMessage("Exit the vehicle to use a med kit");
    return;
  }
  if (medkitCooldown > 0) return;
  if (player.medkits <= 0) {
    showMessage("No med kits left");
    return;
  }
  if (player.health >= 100 && player.armor >= 45) {
    showMessage("Already patched up");
    return;
  }
  player.medkits -= 1;
  medkitCooldown = 3.4;
  player.health = Math.min(100, player.health + 46);
  player.armor = Math.min(45, player.armor + 18);
  showMessage(`Med kit used (${player.medkits} left)`);
  updateHud();
}

function createRocketProjectile(origin, direction, options = {}) {
  const rocketGroup = new THREE.Group();
  const bodyMat = mat(options.color || 0x2f3a32, 0.55, 0.46);
  const body = configureMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.62, 12), bodyMat), true, false);
  body.quaternion.setFromUnitVectors(UP, direction.clone().normalize());
  const nose = configureMesh(new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.18, 12), mat(0xef4444, 0.5, 0.35)), true, false);
  nose.position.copy(direction.clone().multiplyScalar(0.4));
  nose.quaternion.copy(body.quaternion);
  const flare = new THREE.PointLight(0xffb86b, 1.7, 8);
  flare.position.copy(direction.clone().multiplyScalar(-0.36));
  rocketGroup.add(body, nose, flare);
  rocketGroup.position.copy(origin);
  scene.add(rocketGroup);
  projectiles.push({
    mesh: rocketGroup,
    velocity: direction.clone().normalize().multiplyScalar(options.speed || 42),
    life: options.life || 3.2,
    radius: options.radius || 8.5,
    damage: options.damage || 130,
    source: options.source || "player",
    label: options.label || "rocket",
  });
}

function fireRpg(weapon) {
  const origin = new THREE.Vector3();
  const direction = new THREE.Vector3();
  camera.getWorldPosition(origin);
  camera.getWorldDirection(direction);
  origin.addScaledVector(direction, 0.8);
  createRocketProjectile(origin, direction, {
    speed: weapon.projectileSpeed,
    radius: weapon.explosionRadius,
    damage: weapon.damage,
    label: weapon.name,
  });
  weaponKick += weapon.recoil * 1.7;
  pitchRig.rotation.x = THREE.MathUtils.clamp(pitchRig.rotation.x + weapon.recoil * 0.42, -1.36, 1.28);
  makeMuzzleFlash();
  showMessage("RPG away");
}

function fireVehicleWeapon() {
  if (!activeVehicle || !player.alive || gameOver) return;
  const vehicle = activeVehicle;
  if (vehicle.maxMissileAmmo <= 0) {
    showMessage(`${vehicle.label} has armor only`);
    return;
  }
  if (vehicle.missileCooldown > 0) return;
  if (vehicle.missileAmmo <= 0) {
    showMessage(`${vehicle.label} missiles empty`);
    return;
  }
  vehicle.missileAmmo -= 1;
  vehicle.missileCooldown = vehicle.missileCooldownTime;
  const origin = vehicle.position.clone();
  origin.y += vehicle.seatHeight * 0.72;
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  if (!vehicle.airVehicle && direction.y < -0.15) direction.y = -0.15;
  direction.normalize();
  createRocketProjectile(origin.addScaledVector(direction, vehicle.radius + 0.75), direction, {
    speed: vehicle.type === "tank" ? 46 : vehicle.type === "jet" ? 64 : 52,
    radius: vehicle.type === "tank" ? 10.5 : 8.2,
    damage: vehicle.type === "tank" ? 190 : 140,
    color: vehicle.type === "tank" ? 0x3f3f35 : 0x334155,
    label: `${vehicle.label} missile`,
  });
  weaponKick += vehicle.type === "tank" ? 0.14 : 0.06;
  makeMuzzleFlash();
  showMessage(`${vehicle.label} missile fired (${vehicle.missileAmmo})`);
  updateHud();
}

function updateProjectiles(delta) {
  for (let i = projectiles.length - 1; i >= 0; i -= 1) {
    const projectile = projectiles[i];
    projectile.life -= delta;
    const previous = projectile.mesh.position.clone();
    projectile.mesh.position.addScaledVector(projectile.velocity, delta);
    projectile.mesh.lookAt(projectile.mesh.position.clone().add(projectile.velocity));

    const move = projectile.mesh.position.clone().sub(previous);
    const distance = move.length();
    if (distance > 0.01) {
      raycaster.set(previous, move.normalize());
      raycaster.far = distance + 0.35;
      const activeEnemyMeshes = botHitMeshes.filter((mesh) => mesh.userData.bot?.alive && mesh.userData.bot.team !== player.team);
      const hit = raycaster.intersectObjects([...activeEnemyMeshes, ...obstacleMeshes], true)[0];
      if (hit) {
        explodeProjectile(projectile, hit.point);
        projectiles.splice(i, 1);
        continue;
      }
    }

    if (projectile.mesh.position.y <= 0.2 || projectile.life <= 0) {
      explodeProjectile(projectile, projectile.mesh.position.clone());
      projectiles.splice(i, 1);
      continue;
    }

    const trail = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xffc36b, transparent: true, opacity: 0.28, depthWrite: false }),
    );
    trail.position.copy(projectile.mesh.position).addScaledVector(projectile.velocity.clone().normalize(), -0.38);
    scene.add(trail);
    particles.push({ mesh: trail, velocity: new THREE.Vector3(0, 0.25, 0), life: 0.32, startLife: 0.32, type: "muzzle smoke" });
  }
}

function explodeProjectile(projectile, point) {
  scene.remove(projectile.mesh);
  makeExplosion(point, projectile.radius);
  for (const bot of bots) {
    if (!bot.alive || bot.team === player.team) continue;
    const distance = bot.position.distanceTo(point);
    if (distance > projectile.radius) continue;
    const damage = THREE.MathUtils.clamp(projectile.damage * (1 - distance / projectile.radius), 22, projectile.damage);
    damageBot(bot, damage, "player", "body", bot.position.clone().add(new THREE.Vector3(0, 1, 0)));
  }
  if (activeVehicle && activeVehicle.position.distanceTo(point) < projectile.radius * 0.7) {
    damageVehicle(projectile.damage * 0.55, { name: projectile.label });
  } else if (player.alive && player.position.distanceTo(point) < projectile.radius * 0.65) {
    takePlayerDamage(projectile.damage * 0.26, { name: projectile.label, team: "germany" });
  }
}

function ejectShell(weapon) {
  if (weapon.explosive) return;
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.getWorldQuaternion(tempQuat));
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.getWorldQuaternion(tempQuat));
  const back = new THREE.Vector3();
  camera.getWorldDirection(back).multiplyScalar(-1);
  const shell = configureMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, weapon.id === "shotgun" ? 0.22 : 0.16, 10), mat(0xd9a441, 0.46, 0.62)), true, false);
  shell.position.copy(getWeaponMuzzleWorld()).addScaledVector(right, 0.28).addScaledVector(back, 0.72).addScaledVector(up, -0.08);
  shell.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  scene.add(shell);
  particles.push({
    mesh: shell,
    velocity: right.multiplyScalar(1.8).add(up.multiplyScalar(0.9)).add(back.multiplyScalar(0.8)),
    life: 1.8,
    startLife: 1.8,
    type: "spent casing",
  });
}

function updateWeapons(delta) {
  const weapon = playerWeapons[selectedWeapon];
  if (weapon.reloading) {
    weapon.reloadElapsed += delta;
    if (weapon.reloadElapsed >= weapon.reloadTime) finishReload(weapon);
  }

  if (mouseDown && weapon.automatic) tryShoot();

  aimBlend = THREE.MathUtils.damp(aimBlend, isAiming && player.alive ? 1 : 0, 14, delta);
  const targetFov = THREE.MathUtils.lerp(BASE_FOV, AIM_FOV, aimBlend);
  if (Math.abs(camera.fov - targetFov) > 0.01) {
    camera.fov = targetFov;
    camera.updateProjectionMatrix();
  }
  scopeOverlayEl.classList.toggle("active", aimBlend > 0.72);
  if (currentWeaponModel) {
    currentWeaponModel.traverse((child) => {
      if (!child.isMesh || !child.userData.fadeOnAim || !child.material) return;
      const baseOpacity = child.userData.baseOpacity ?? 1;
      const targetOpacity = Math.min(baseOpacity, 0.025);
      child.material.transparent = child.userData.baseTransparent || aimBlend > 0.02;
      child.material.opacity = THREE.MathUtils.lerp(baseOpacity, targetOpacity, aimBlend);
      child.material.depthWrite = aimBlend < 0.45;
      child.visible = aimBlend < 0.96;
    });
  }

  weaponKick = THREE.MathUtils.damp(weaponKick, 0, 12, delta);
  weaponSwayX = THREE.MathUtils.damp(weaponSwayX, 0, 6, delta);
  weaponSwayY = THREE.MathUtils.damp(weaponSwayY, 0, 6, delta);

  const walkBob = player.moving && player.grounded ? Math.sin(clock.elapsedTime * (player.sprinting ? 11 : 8)) : 0;
  if (currentWeaponModel) {
    const aimPosition = currentWeaponBasePosition.clone().lerp(currentWeaponAimPosition, aimBlend);
    const swayScale = 1 - aimBlend * 0.75;
    const walkScale = 1 - aimBlend * 0.9;
    const reloadProgress = weapon.reloading ? THREE.MathUtils.clamp(weapon.reloadElapsed / weapon.reloadTime, 0, 1) : 0;
    const reloadBlend = weapon.reloading ? Math.sin(reloadProgress * Math.PI) : 0;
    currentWeaponModel.position.x = aimPosition.x + weaponSwayX * 0.55 * swayScale + Math.sin(clock.elapsedTime * 4.2) * 0.006 * walkScale;
    currentWeaponModel.position.y = aimPosition.y - weaponKick * 0.6 + Math.abs(walkBob) * 0.025 * walkScale - weaponSwayY * 0.28 * swayScale - reloadBlend * 0.16;
    currentWeaponModel.position.z = aimPosition.z + weaponKick * 1.2 + reloadBlend * 0.18;
    currentWeaponModel.rotation.x = THREE.MathUtils.lerp(-0.02, -0.005, aimBlend) - weaponKick * 0.8 - weaponSwayY * 0.3 * swayScale - reloadBlend * 0.2;
    currentWeaponModel.rotation.y = THREE.MathUtils.lerp(-0.18, 0, aimBlend) - weaponSwayX * 0.55 * swayScale;
    currentWeaponModel.rotation.z = THREE.MathUtils.lerp(0.02, 0, aimBlend) + walkBob * 0.012 * walkScale + reloadBlend * (weapon.id === "rpg" ? -0.34 : 0.22);
  }
}

function tryShoot() {
  if (!gameStarted || gameOver || !player.alive) return;
  if (activeVehicle) {
    fireVehicleWeapon();
    return;
  }

  const weapon = playerWeapons[selectedWeapon];
  const now = clock.elapsedTime;
  if (weapon.reloading || now < weapon.nextShot) return;
  if (weapon.ammo <= 0) {
    startReload();
    return;
  }

  weapon.nextShot = now + 60 / weapon.rpm;
  weapon.ammo -= 1;
  weaponKick += weapon.recoil;
  pitchRig.rotation.x = THREE.MathUtils.clamp(pitchRig.rotation.x + weapon.recoil * (weapon.explosive ? 0.42 : 0.28), -1.36, 1.28);
  playerRig.rotation.y += THREE.MathUtils.randFloatSpread(weapon.recoil * 0.11);
  if (weapon.explosive) {
    fireRpg(weapon);
    updateHud();
    return;
  }
  makeMuzzleFlash();
  ejectShell(weapon);

  const cameraPos = new THREE.Vector3();
  const baseDir = new THREE.Vector3();
  camera.getWorldPosition(cameraPos);
  camera.getWorldDirection(baseDir);
  tempRight.set(1, 0, 0).applyQuaternion(camera.getWorldQuaternion(tempQuat));
  tempUp.set(0, 1, 0).applyQuaternion(camera.getWorldQuaternion(tempQuat));

  const aimAccuracy = isAiming ? 0.38 : 1;
  const spread = weapon.spread * aimAccuracy + (player.moving ? weapon.movingSpread * (isAiming ? 0.45 : 1) : 0) + (player.sprinting && !isAiming ? 0.01 : 0);
  for (let i = 0; i < weapon.pellets; i += 1) {
    const direction = baseDir
      .clone()
      .addScaledVector(tempRight, THREE.MathUtils.randFloatSpread(spread))
      .addScaledVector(tempUp, THREE.MathUtils.randFloatSpread(spread))
      .normalize();
    castPlayerShot(cameraPos, direction, weapon);
  }

  if (weapon.ammo <= 0 && weapon.reserve > 0) {
    showMessage("Magazine empty. Press R to reload.");
  }
  updateHud();
}

function castPlayerShot(origin, direction, weapon) {
  raycaster.set(origin, direction);
  raycaster.far = weapon.range;

  const activeEnemyMeshes = botHitMeshes.filter((mesh) => mesh.userData.bot?.alive && mesh.userData.bot.team !== player.team);
  const hits = raycaster.intersectObjects([...activeEnemyMeshes, ...obstacleMeshes], true);
  let impactPoint = origin.clone().addScaledVector(direction, weapon.range);
  let hitBot = null;
  let hitZone = "body";

  for (const hit of hits) {
    const bot = findBotFromObject(hit.object);
    if (bot && bot.alive && bot.team !== player.team) {
      hitBot = bot;
      hitZone = hit.object.userData.zone || "body";
      impactPoint = hit.point.clone();
      break;
    }
    if (!bot) {
      impactPoint = hit.point.clone();
      break;
    }
  }

  const muzzle = getWeaponMuzzleWorld();
  createTracer(muzzle, impactPoint, 0xf8fafc, 0.08);

  if (hitBot) {
    const damage = weapon.damage * (hitZone === "head" ? weapon.headshot : 1);
    damageBot(hitBot, damage, "player", hitZone, impactPoint);
    showHitMarker();
    makeImpact(impactPoint, teams.germany.light, 9);
  } else {
    makeImpact(impactPoint, 0xf8fafc, 5);
    addDecal(impactPoint, direction);
  }
}

function findBotFromObject(object) {
  let node = object;
  while (node) {
    if (node.userData?.bot) return node.userData.bot;
    node = node.parent;
  }
  return null;
}

function startReload() {
  if (!gameStarted || gameOver || !player.alive) return;
  const weapon = playerWeapons[selectedWeapon];
  if (weapon.reloading || weapon.ammo >= weapon.magSize || weapon.reserve <= 0) return;
  weapon.reloading = true;
  weapon.reloadElapsed = 0;
  showMessage(`Reloading ${weapon.name}`);
}

function finishReload(weapon) {
  const needed = weapon.magSize - weapon.ammo;
  const loaded = Math.min(needed, weapon.reserve);
  weapon.ammo += loaded;
  weapon.reserve -= loaded;
  weapon.reloading = false;
  weapon.reloadElapsed = 0;
  showMessage(`${weapon.name} loaded`);
}

function getWeaponMuzzleWorld() {
  return weaponRoot.localToWorld(currentMuzzleLocal.clone());
}

function makeMuzzleFlash() {
  const group = new THREE.Group();
  const pos = getWeaponMuzzleWorld();
  group.position.copy(pos);
  const flash = new THREE.Mesh(
    new THREE.ConeGeometry(0.16, 0.44, 12),
    new THREE.MeshBasicMaterial({ color: 0xfff7ad, transparent: true, opacity: 0.92 }),
  );
  flash.rotation.x = Math.PI / 2;
  group.add(flash);
  const light = new THREE.PointLight(0xffdf8a, 1.4, 9);
  group.add(light);
  scene.add(group);
  particles.push({ mesh: group, life: 0.055, startLife: 0.055, type: "flash" });

  const smoke = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xb6bec4, transparent: true, opacity: 0.24, depthWrite: false }),
  );
  smoke.position.copy(pos);
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  scene.add(smoke);
  particles.push({
    mesh: smoke,
    velocity: forward.multiplyScalar(1.8).add(new THREE.Vector3(0, 0.35, 0)),
    life: 0.42,
    startLife: 0.42,
    type: "muzzle smoke",
  });
}

function createTracer(start, end, color = 0xf8fafc, life = 0.1) {
  const delta = end.clone().sub(start);
  const length = delta.length();
  if (length <= 0.01) return;
  const tracer = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, length, 7),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.72 }),
  );
  tracer.position.copy(start).addScaledVector(delta, 0.5);
  tracer.quaternion.setFromUnitVectors(UP, delta.normalize());
  scene.add(tracer);
  tracers.push({ mesh: tracer, life, startLife: life });
}

function makeImpact(position, color = 0xf8fafc, count = 7) {
  const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
  for (let i = 0; i < count; i += 1) {
    const spark = new THREE.Mesh(new THREE.SphereGeometry(0.035, 7, 5), material.clone());
    spark.position.copy(position);
    const velocity = new THREE.Vector3(
      THREE.MathUtils.randFloatSpread(3.5),
      THREE.MathUtils.randFloat(0.4, 3.2),
      THREE.MathUtils.randFloatSpread(3.5),
    );
    scene.add(spark);
    particles.push({ mesh: spark, velocity, life: 0.34, startLife: 0.34, type: "spark" });
  }
}

function addDecal(position, direction) {
  if (decals.length > 72) {
    const old = decals.shift();
    scene.remove(old);
  }
  const decal = new THREE.Mesh(
    new THREE.CircleGeometry(THREE.MathUtils.randFloat(0.055, 0.13), 12),
    new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? 0x0a0d12 : 0x2a2018, transparent: true, opacity: THREE.MathUtils.randFloat(0.38, 0.62), side: THREE.DoubleSide }),
  );
  decal.position.copy(position).addScaledVector(direction, -0.012);
  decal.lookAt(position.clone().sub(direction));
  decal.scale.y = THREE.MathUtils.randFloat(0.55, 1.25);
  decal.rotation.z = Math.random() * Math.PI;
  scene.add(decal);
  decals.push(decal);
}

function updateEffects(delta) {
  for (let i = tracers.length - 1; i >= 0; i -= 1) {
    const tracer = tracers[i];
    tracer.life -= delta;
    tracer.mesh.material.opacity = Math.max(0, tracer.life / tracer.startLife) * 0.72;
    if (tracer.life <= 0) {
      scene.remove(tracer.mesh);
      tracer.mesh.geometry.dispose();
      tracer.mesh.material.dispose();
      tracers.splice(i, 1);
    }
  }

  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const particle = particles[i];
    particle.life -= delta;
    if (particle.velocity) {
      if (particle.type === "smoke cloud") {
        particle.velocity.y += 0.12 * delta;
      } else {
        particle.velocity.y -= 8 * delta;
      }
      particle.mesh.position.addScaledVector(particle.velocity, delta);
    }
    if (particle.type === "muzzle smoke") {
      const grow = 1 + (1 - particle.life / particle.startLife) * 3.5;
      particle.mesh.scale.setScalar(grow);
      if (particle.velocity) particle.velocity.y += 8.5 * delta;
    }
    if (particle.type === "smoke cloud") {
      const progress = 1 - particle.life / particle.startLife;
      particle.mesh.scale.multiplyScalar(1 + delta * 0.05);
      particle.mesh.rotation.y += delta * 0.12;
      particle.mesh.material.opacity = Math.max(0, 0.28 * (1 - progress));
    }
    if (particle.type === "spent casing") {
      particle.mesh.rotation.x += delta * 13;
      particle.mesh.rotation.z += delta * 9;
    }
    if (particle.type === "shockwave") {
      const progress = 1 - particle.life / particle.startLife;
      particle.mesh.scale.setScalar(1 + progress * particle.radius);
    }
    if (particle.type === "explosion light") {
      particle.mesh.intensity = Math.max(0, particle.life / particle.startLife) * 4.2;
    }
    particle.mesh.traverse((child) => {
      if (child.material) {
        const maxOpacity = particle.type === "smoke cloud" ? 0.28 : 1;
        child.material.opacity = Math.max(0, particle.life / particle.startLife) * maxOpacity;
      }
    });
    if (particle.life <= 0) {
      scene.remove(particle.mesh);
      particle.mesh.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
      particles.splice(i, 1);
    }
  }

  if (hitMarkerTimer > 0) {
    hitMarkerTimer -= delta;
    if (hitMarkerTimer <= 0) hitMarkerEl.classList.remove("active");
  }
  if (damageTimer > 0) {
    damageTimer -= delta;
    if (damageTimer <= 0) damageVignetteEl.classList.remove("active");
  }
  if (knifeSlashTimer > 0) {
    knifeSlashTimer -= delta;
    if (knifeSlashTimer <= 0) knifeSlashEl.classList.remove("active");
  }
  if (flashTimer > 0) {
    flashTimer -= delta;
    flashOverlayEl.style.setProperty("--flash-opacity", String(THREE.MathUtils.clamp(flashTimer / 1.35, 0, 0.94)));
    if (flashTimer <= 0) flashOverlayEl.classList.remove("active");
  }
  if (messageTimer > 0) {
    messageTimer -= delta;
    if (messageTimer <= 0 && !gameOver) messageEl.textContent = "";
  }
}

function updateAmbientGraphics() {
  for (const puff of smokePuffs) {
    const wave = Math.sin(clock.elapsedTime * 0.45 + puff.seed);
    puff.mesh.position.y = puff.baseY + wave * 0.08;
    puff.mesh.position.x += Math.sin(clock.elapsedTime * 0.23 + puff.seed) * 0.0009;
    puff.mesh.rotation.y += 0.0015;
    puff.mesh.material.opacity = 0.11 + wave * 0.025;
    puff.mesh.quaternion.copy(camera.quaternion);
  }
  for (const mote of dustMotes) {
    mote.mesh.position.x += Math.sin(clock.elapsedTime * 0.34 + mote.seed) * 0.002 * mote.drift;
    mote.mesh.position.z += Math.cos(clock.elapsedTime * 0.26 + mote.seed) * 0.002 * mote.drift;
    mote.mesh.position.y += Math.sin(clock.elapsedTime * 0.58 + mote.seed) * 0.0015;
    if (mote.mesh.position.y < 0.4) mote.mesh.position.y = 7.5;
    mote.mesh.quaternion.copy(camera.quaternion);
  }
}

function updateBots(delta) {
  for (const bot of bots) {
    if (!bot.alive) {
      bot.respawnTimer -= delta;
      if (bot.respawnTimer <= 0 && !gameOver) respawnBot(bot);
      continue;
    }

    bot.shootCooldown -= delta;
    const target = findBestTarget(bot);
    let visible = false;
    let targetPoint = null;

    if (target) {
      targetPoint = getTargetPoint(target);
      const eye = getBotEye(bot);
      visible = hasLineOfSight(eye, targetPoint);
      faceToward(bot, targetPoint, delta);
      moveBotCombat(bot, target, visible, delta);

      const dist = eye.distanceTo(targetPoint);
      if (visible && dist <= bot.weapon.range && bot.shootCooldown <= 0) {
        botFire(bot, target, targetPoint);
      }
    } else {
      patrolBot(bot, delta);
    }

    updateBotAnimation(bot, delta);
    updateBotHealthBar(bot);
  }
}

function findBestTarget(bot) {
  let best = null;
  let bestScore = Infinity;

  if (bot.team === "germany" && player.alive) {
    const dist = bot.position.distanceTo(player.position);
    best = { type: "player", object: player };
    bestScore = dist * 0.78;
  }

  for (const other of bots) {
    if (!other.alive || other.team === bot.team) continue;
    const dist = bot.position.distanceTo(other.position);
    if (dist < bestScore) {
      best = { type: "bot", object: other };
      bestScore = dist;
    }
  }
  return best;
}

function getTargetPoint(target) {
  if (target.type === "player") {
    return new THREE.Vector3(player.position.x, player.eyeHeight + player.verticalOffset - 0.08, player.position.z);
  }
  return target.object.position.clone().add(new THREE.Vector3(0, 1.32, 0));
}

function getBotEye(bot) {
  return bot.position.clone().add(new THREE.Vector3(0, 1.58, 0));
}

function getBotMuzzle(bot) {
  if (!bot.rifle) return getBotEye(bot);
  return bot.rifle.localToWorld(new THREE.Vector3(0, 0.04, -1.15));
}

function hasLineOfSight(from, to) {
  const direction = to.clone().sub(from);
  const distance = direction.length();
  if (distance <= 0.01) return false;
  raycaster.set(from, direction.normalize());
  raycaster.far = distance - 0.4;
  return raycaster.intersectObjects(obstacleMeshes, true).length === 0;
}

function faceToward(bot, point, delta) {
  const dx = point.x - bot.position.x;
  const dz = point.z - bot.position.z;
  const targetYaw = Math.atan2(-dx, -dz);
  bot.group.rotation.y = dampAngle(bot.group.rotation.y, targetYaw, 8, delta);
}

function dampAngle(current, target, lambda, delta) {
  const diff = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + diff * (1 - Math.exp(-lambda * delta));
}

function moveBotCombat(bot, target, visible, delta) {
  const targetPos = target.type === "player" ? player.position : target.object.position;
  const toTarget = targetPos.clone().sub(bot.position);
  const distance = toTarget.length();
  if (distance <= 0.01) return;
  toTarget.normalize();

  const side = new THREE.Vector3(-toTarget.z, 0, toTarget.x).multiplyScalar(Math.sin(clock.elapsedTime * 1.1 + bot.strafeSeed));
  const desired = new THREE.Vector3();
  const engagementDistance = bot.weapon.range > 65 ? 34 : 26;
  const retreatDistance = bot.weapon.range > 65 ? 11 : 9.5;

  if (!visible || distance > engagementDistance) desired.add(toTarget);
  if (distance < retreatDistance) desired.addScaledVector(toTarget, -0.9);
  if (distance >= retreatDistance && distance <= engagementDistance + 5) desired.addScaledVector(side, 0.75);
  if (desired.lengthSq() < 0.001) desired.copy(side);
  desired.normalize();

  const speed = visible ? 2.7 : 3.35;
  moveWithCollision(bot.position, desired.x * speed * delta, desired.z * speed * delta, BOT_RADIUS);
  bot.group.position.copy(bot.position);
}

function patrolBot(bot, delta) {
  const toDest = bot.destination.clone().sub(bot.position);
  if (toDest.length() < 2.2 || collides(bot.destination, BOT_RADIUS)) {
    bot.destination = getPatrolPoint(bot.team);
    return;
  }
  toDest.normalize();
  faceToward(bot, bot.destination, delta);
  moveWithCollision(bot.position, toDest.x * 2.4 * delta, toDest.z * 2.4 * delta, BOT_RADIUS);
  bot.group.position.copy(bot.position);
}

function updateBotAnimation(bot, delta) {
  const moved = bot.group.position.distanceTo(bot.position) > 0.001;
  bot.anim += delta * (moved ? 8 : 2.8);
  const bob = Math.sin(clock.elapsedTime * 6 + bot.strafeSeed) * 0.025;
  bot.group.position.y = bob;
  if (bot.rifle) {
    bot.rifle.rotation.x = -0.02 + Math.sin(clock.elapsedTime * 3 + bot.strafeSeed) * 0.01;
  }
}

function updateBotHealthBar(bot) {
  if (!bot.healthFill || !bot.healthBack) return;
  const healthRatio = THREE.MathUtils.clamp(bot.health / 100, 0, 1);
  bot.healthFill.scale.x = healthRatio;
  bot.healthFill.position.x = -0.41 * (1 - healthRatio);
  bot.healthFill.material.color.setHex(bot.team === "usa" ? teams.usa.light : teams.germany.light);
  bot.healthBack.quaternion.copy(camera.quaternion);
  bot.healthFill.quaternion.copy(camera.quaternion);
}

function botFire(bot, target, targetPoint) {
  const weapon = bot.weapon;
  bot.shootCooldown = 60 / weapon.rpm + THREE.MathUtils.randFloat(0.07, 0.22);

  const muzzle = getBotMuzzle(bot);
  const dist = muzzle.distanceTo(targetPoint);
  const hitChance = THREE.MathUtils.clamp(0.78 - dist * 0.009, 0.16, 0.82);
  const endpoint = targetPoint.clone().add(new THREE.Vector3(
    THREE.MathUtils.randFloatSpread(weapon.spread * dist),
    THREE.MathUtils.randFloatSpread(weapon.spread * dist * 0.6),
    THREE.MathUtils.randFloatSpread(weapon.spread * dist),
  ));
  createTracer(muzzle, endpoint, bot.team === "usa" ? teams.usa.light : teams.germany.light, 0.12);

  if (Math.random() > hitChance) {
    makeImpact(endpoint, 0xd1d5db, 3);
    return;
  }

  if (target.type === "player") {
    takePlayerDamage(weapon.damage * THREE.MathUtils.randFloat(0.8, 1.2), bot);
    makeImpact(targetPoint, teams.usa.light, 4);
  } else {
    damageBot(target.object, weapon.damage * THREE.MathUtils.randFloat(0.85, 1.15), bot, "body", targetPoint);
    makeImpact(targetPoint, target.object.team === "usa" ? teams.usa.light : teams.germany.light, 4);
  }
}

function damageBot(bot, damage, attacker, zone, point) {
  if (!bot.alive) return;
  const armorAbsorb = Math.min(bot.armor, damage * 0.28);
  bot.armor -= armorAbsorb;
  bot.health -= damage - armorAbsorb * 0.65;
  bot.lastAttacker = attacker;

  if (bot.health <= 0) {
    killBot(bot, attacker, zone);
  } else if (point) {
    makeImpact(point, bot.team === "usa" ? teams.usa.light : teams.germany.light, zone === "head" ? 12 : 6);
  }
}

function killBot(bot, attacker, zone) {
  bot.alive = false;
  bot.health = 0;
  bot.armor = 0;
  bot.respawnTimer = 4.5;
  bot.group.visible = false;

  const killerTeam = attacker === "player" ? "usa" : attacker.team;
  if (killerTeam === "usa") usaScore += 1;
  if (killerTeam === "germany") germanyScore += 1;

  if (attacker === "player") {
    addFeed(`You eliminated <b>${bot.name}</b>${zone === "head" ? " with a headshot" : ""}`);
    showMessage(zone === "head" ? "Headshot" : "Target down");
  } else {
    addFeed(`<b>${attacker.name}</b> eliminated <b>${bot.name}</b>`);
  }
  checkRoundEnd();
  updateHud();
}

function respawnBot(bot) {
  const index = Number(bot.id.split("-")[1]) || 0;
  bot.position.copy(getSpawnPoint(bot.team, index));
  bot.group.position.copy(bot.position);
  bot.group.visible = true;
  bot.health = 100;
  bot.armor = 25;
  bot.alive = true;
  bot.destination = getPatrolPoint(bot.team);
  bot.shootCooldown = Math.random() * 0.9;
}

function damageVehicle(amount, source = { name: "incoming fire" }) {
  if (!activeVehicle) return 0;
  const vehicle = activeVehicle;
  vehicle.health = Math.max(0, vehicle.health - amount);
  if (vehicle.health <= 0) {
    const wreckPoint = vehicle.position.clone();
    makeExplosion(wreckPoint, vehicle.type === "tank" ? 11 : 8);
    addFeed(`<b>${vehicle.label}</b> was destroyed`);
    activeVehicle = null;
    weaponRoot.visible = true;
    player.position.copy(wreckPoint);
    player.position.y = 0;
    player.health = Math.max(0, player.health - 45);
    player.armor = Math.max(0, player.armor - 20);
    updatePlayerRig();
    showMessage(`${vehicle.label} destroyed by ${source.name}`);
    if (player.health <= 0) takePlayerDamage(999, { name: source.name, team: "germany" });
  }
  return vehicle.health;
}

function takePlayerDamage(amount, sourceBot) {
  if (!player.alive || gameOver) return;
  if (activeVehicle) {
    const blocked = amount * activeVehicle.armorBlock;
    const leaked = amount - blocked;
    damageVehicle(blocked * 1.35, sourceBot);
    if (!activeVehicle) {
      updateHud();
      return;
    }
    if (leaked <= 1.5) {
      showMessage(`${activeVehicle.label} armor absorbed hit`);
      updateHud();
      return;
    }
    amount = leaked;
  }
  const armorAbsorb = Math.min(player.armor, amount * 0.62);
  player.armor -= armorAbsorb;
  player.health -= amount - armorAbsorb * 0.68;
  damageTimer = 0.24;
  damageVignetteEl.classList.add("active");
  showMessage(`Hit by ${sourceBot.name}`);

  if (player.health <= 0) {
    player.health = 0;
    player.alive = false;
    player.respawnTimer = 3.2;
    germanyScore += 1;
    if (activeVehicle) exitVehicle({ silent: true });
    mouseDown = false;
    addFeed(`<b>${sourceBot.name}</b> eliminated you`);
    showMessage("You are down. Respawning...");
    checkRoundEnd();
  }
  updateHud();
}

function respawnPlayer() {
  const spawn = teams.usa.spawn;
  const offsets = [
    [0, -6],
    [-7, -8],
    [7, -8],
    [-13, -4],
    [13, -4],
    [-20, -10],
    [20, -10],
    [-5, 5],
    [5, 5],
  ];
  let respawnPosition = new THREE.Vector3(spawn.x, 0, spawn.z - 8);
  for (let attempt = 0; attempt < offsets.length * 2; attempt += 1) {
    const [x, z] = offsets[attempt % offsets.length];
    const candidate = new THREE.Vector3(
      spawn.x + x + THREE.MathUtils.randFloatSpread(2),
      0,
      spawn.z + z + THREE.MathUtils.randFloatSpread(2),
    );
    if (!collides(candidate, PLAYER_RADIUS + 0.25)) {
      respawnPosition = candidate;
      break;
    }
  }
  player.position.copy(respawnPosition);
  player.velocity.set(0, 0, 0);
  player.verticalVelocity = 0;
  player.verticalOffset = 0;
  player.eyeHeight = 1.68;
  player.stance = "stand";
  player.health = 100;
  player.armor = 45;
  player.grenades = player.maxGrenades;
  player.smokes = player.maxSmokes;
  player.flashes = player.maxFlashes;
  player.medkits = player.maxMedkits;
  player.alive = true;
  activeVehicle = null;
  weaponRoot.visible = true;
  updatePlayerRig();
  showMessage("Back in the fight");
}

function showHitMarker() {
  hitMarkerTimer = 0.12;
  hitMarkerEl.classList.add("active");
}

function addFeed(html) {
  const line = document.createElement("div");
  line.className = "feed-line";
  line.innerHTML = html;
  feedEl.prepend(line);
  while (feedEl.children.length > 5) feedEl.lastElementChild.remove();
  setTimeout(() => line.remove(), 5200);
}

function showMessage(text, duration = 2.2) {
  messageEl.textContent = text;
  messageTimer = duration;
}

function updateRound(delta) {
  if (!gameStarted || gameOver) return;
  roundTime = Math.max(0, roundTime - delta);
  if (roundTime <= 0) {
    const winner = usaScore === germanyScore ? "Draw" : usaScore > germanyScore ? teams.usa.shortLabel : teams.germany.shortLabel;
    endRound(winner);
  }
}

function checkRoundEnd() {
  if (gameOver) return;
  if (usaScore >= TARGET_SCORE) endRound(teams.usa.shortLabel);
  if (germanyScore >= TARGET_SCORE) endRound(teams.germany.shortLabel);
}

function endRound(winner) {
  gameOver = true;
  roundResetTimer = 6;
  mouseDown = false;
  if (winner === "Draw") {
    showMessage("Round ended in a draw. Resetting...", 6);
  } else {
    showMessage(`${winner} wins the round. Resetting...`, 6);
  }
}

function resetRound() {
  usaScore = 0;
  germanyScore = 0;
  roundTime = ROUND_SECONDS;
  gameOver = false;
  playerWeapons.forEach((weapon) => {
    weapon.ammo = weapon.magSize;
    weapon.reserve = weapon.reserveAmmo;
    weapon.reloading = false;
    weapon.reloadElapsed = 0;
    weapon.nextShot = 0;
  });
  player.grenades = player.maxGrenades;
  player.smokes = player.maxSmokes;
  player.flashes = player.maxFlashes;
  player.medkits = player.maxMedkits;
  vehicles.forEach((vehicle) => {
    vehicle.health = vehicle.maxHealth;
    vehicle.missileAmmo = vehicle.maxMissileAmmo;
    vehicle.missileCooldown = 0;
    vehicle.speed = 0;
  });
  activeVehicle = null;
  weaponRoot.visible = true;
  bots.forEach(respawnBot);
  respawnPlayer();
  addFeed("New skirmish round started");
  updateHud();
}

function updateHud() {
  usaScoreEl.textContent = String(usaScore);
  germanyScoreEl.textContent = String(germanyScore);
  roundTimerEl.textContent = formatTime(roundTime);
  targetScoreLabelEl.textContent = `Target score: ${TARGET_SCORE}`;

  healthTextEl.textContent = String(Math.max(0, Math.round(player.health)));
  armorTextEl.textContent = String(Math.max(0, Math.round(player.armor)));
  healthFillEl.style.width = `${THREE.MathUtils.clamp(player.health, 0, 100)}%`;
  armorFillEl.style.width = `${THREE.MathUtils.clamp((player.armor / 45) * 100, 0, 100)}%`;
  stanceTextEl.textContent = player.stance === "prone" ? "Prone" : player.stance === "crouch" ? "Crouch" : "Stand";
  stanceFillEl.style.width = player.stance === "prone" ? "35%" : player.stance === "crouch" ? "65%" : "100%";
  grenadeTextEl.textContent = String(player.grenades);
  grenadeFillEl.style.width = `${THREE.MathUtils.clamp((player.grenades / player.maxGrenades) * 100, 0, 100)}%`;
  utilityTextEl.textContent = `S${player.smokes}/F${player.flashes}/M${player.medkits}`;
  utilityFillEl.style.width = `${THREE.MathUtils.clamp(((player.smokes + player.flashes + player.medkits) / (player.maxSmokes + player.maxFlashes + player.maxMedkits)) * 100, 0, 100)}%`;
  if (activeVehicle) {
    vehicleTextEl.textContent = activeVehicle.maxMissileAmmo > 0 ? `${Math.round(activeVehicle.health)} | ${activeVehicle.missileAmmo}` : `${Math.round(activeVehicle.health)}`;
    vehicleFillEl.style.width = `${THREE.MathUtils.clamp((activeVehicle.health / activeVehicle.maxHealth) * 100, 0, 100)}%`;
  } else {
    vehicleTextEl.textContent = "--";
    vehicleFillEl.style.width = "0%";
  }

  const weapon = playerWeapons[selectedWeapon];
  weaponClassEl.textContent = weapon.className;
  weaponNameEl.textContent = weapon.name;
  classTextEl.textContent = weapon.roleName;
  ammoTextEl.textContent = String(weapon.ammo);
  reserveTextEl.textContent = `/ ${weapon.reserve}`;
  reloadBarEl.style.width = weapon.reloading
    ? `${THREE.MathUtils.clamp((weapon.reloadElapsed / weapon.reloadTime) * 100, 0, 100)}%`
    : "0%";
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  const activelyPlaying = gameStarted && !gameOver;

  updateWeapons(delta);
  updateGrenades(delta);
  updateProjectiles(delta);
  if (activelyPlaying) {
    updatePlayer(delta);
    updateBots(delta);
    updateRound(delta);
  }
  updateEffects(delta);
  updateAmbientGraphics();

  if (gameOver) {
    roundResetTimer -= delta;
    if (roundResetTimer <= 0) resetRound();
  }

  updateHud();
  renderer.render(scene, camera);
}

function init() {
  applyExtraDetailMaterials();
  buildLights();
  buildMap();
  spawnTeams();
  selectWeapon(0);
  updatePlayerRig();
  onResize();

  window.addEventListener("resize", onResize);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mouseup", onMouseUp);
  window.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("blur", () => {
    mouseDown = false;
    isAiming = false;
  });
  window.addEventListener("wheel", onWheel, { passive: true });
  canvas.addEventListener("contextmenu", onContextMenu);
  document.addEventListener("contextmenu", onContextMenu);
  document.addEventListener("pointerlockchange", updatePointerLockState);
  document.addEventListener("pointerlockerror", () => {
    pauseScreen.classList.add("hidden");
    showMessage("Mouse look active. Click and drag if the cursor is not locked.");
  });
  startButton.addEventListener("click", requestLock);
  pauseScreen.addEventListener("click", requestLock);
  canvas.addEventListener("click", () => {
    if (document.pointerLockElement !== canvas) requestLock();
  });

  addFeed("Asterian squad deployed against Eisenmark squad");
  addFeed("Use 1-7 classes, G/T/Q throwables, H med kit, E vehicles, click missiles");
  animate();
}

init();
