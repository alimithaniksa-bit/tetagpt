import JSZip from 'jszip';

export interface MeshData {
  name: string;
  vertices: [number, number, number][];
  faces: number[][]; // Indices into vertices (3 or 4 points per face)
  colorHex: string; // e.g. '#10b981'
  layerName: string;
  roughness?: number;
  metallic?: number;
}

export interface Model3DData {
  title: string;
  description?: string;
  meshes: MeshData[];
}

// Convert Hex to RGB [0..1]
export const hexToRgb01 = (hex: string): [number, number, number] => {
  const clean = hex.replace('#', '');
  let r = 0, g = 0, b = 0;
  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16) / 255;
    g = parseInt(clean[1] + clean[1], 16) / 255;
    b = parseInt(clean[2] + clean[2], 16) / 255;
  } else if (clean.length === 6) {
    r = parseInt(clean.substring(0, 2), 16) / 255;
    g = parseInt(clean.substring(2, 4), 16) / 255;
    b = parseInt(clean.substring(4, 6), 16) / 255;
  } else {
    r = 0.06; g = 0.72; b = 0.50; // default emerald
  }
  return [
    Math.max(0, Math.min(1, r)),
    Math.max(0, Math.min(1, g)),
    Math.max(0, Math.min(1, b))
  ];
};

// Map RGB to closest AutoCAD Color Index (ACI 1 to 7 standard)
export const hexToAutoCadColorIndex = (hex: string): number => {
  const [r, g, b] = hexToRgb01(hex);
  if (r > 0.6 && g < 0.3 && b < 0.3) return 1; // Red
  if (r > 0.6 && g > 0.6 && b < 0.3) return 2; // Yellow
  if (r < 0.3 && g > 0.5 && b < 0.5) return 3; // Green
  if (r < 0.3 && g > 0.5 && b > 0.5) return 4; // Cyan
  if (r < 0.3 && g < 0.3 && b > 0.6) return 5; // Blue
  if (r > 0.5 && g < 0.3 && b > 0.5) return 6; // Magenta
  return 7; // White / Default
};

// ==========================================
// ====== PROCEDURAL 3D SHAPE BUILDERS ======
// ==========================================

export const createBoxMesh = (
  name: string,
  w: number,
  h: number,
  d: number,
  cx = 0,
  cy = 0,
  cz = 0,
  colorHex = '#10b981',
  layerName = '3D_OBJECTS'
): MeshData => {
  const hw = w / 2;
  const hh = h / 2;
  const hd = d / 2;

  const vertices: [number, number, number][] = [
    [cx - hw, cy - hh, cz - hd], // 0
    [cx + hw, cy - hh, cz - hd], // 1
    [cx + hw, cy + hh, cz - hd], // 2
    [cx - hw, cy + hh, cz - hd], // 3
    [cx - hw, cy - hh, cz + hd], // 4
    [cx + hw, cy - hh, cz + hd], // 5
    [cx + hw, cy + hh, cz + hd], // 6
    [cx - hw, cy + hh, cz + hd], // 7
  ];

  const faces = [
    [0, 3, 2, 1], // Back
    [4, 5, 6, 7], // Front
    [0, 1, 5, 4], // Bottom
    [3, 7, 6, 2], // Top
    [0, 4, 7, 3], // Left
    [1, 2, 6, 5], // Right
  ];

  return { name, vertices, faces, colorHex, layerName };
};

export const createCylinderMesh = (
  name: string,
  radius: number,
  height: number,
  segments = 16,
  cx = 0,
  cy = 0,
  cz = 0,
  colorHex = '#38bdf8',
  layerName = '3D_CYLINDERS'
): MeshData => {
  const vertices: [number, number, number][] = [];
  const faces: number[][] = [];
  const hh = height / 2;

  // Bottom rim (0..segments-1)
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    vertices.push([
      cx + Math.cos(angle) * radius,
      cy - hh,
      cz + Math.sin(angle) * radius,
    ]);
  }

  // Top rim (segments..2*segments-1)
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    vertices.push([
      cx + Math.cos(angle) * radius,
      cy + hh,
      cz + Math.sin(angle) * radius,
    ]);
  }

  // Bottom center
  const bottomCenterIdx = vertices.length;
  vertices.push([cx, cy - hh, cz]);

  // Top center
  const topCenterIdx = vertices.length;
  vertices.push([cx, cy + hh, cz]);

  // Side faces (quads)
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    const b1 = i;
    const b2 = next;
    const t1 = segments + i;
    const t2 = segments + next;
    faces.push([b1, b2, t2, t1]);
  }

  // Bottom cap (triangles)
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    faces.push([bottomCenterIdx, next, i]);
  }

  // Top cap (triangles)
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    faces.push([topCenterIdx, segments + i, segments + next]);
  }

  return { name, vertices, faces, colorHex, layerName };
};

export const createSphereMesh = (
  name: string,
  radius: number,
  latSegments = 12,
  lonSegments = 16,
  cx = 0,
  cy = 0,
  cz = 0,
  colorHex = '#a855f7',
  layerName = '3D_SPHERES'
): MeshData => {
  const vertices: [number, number, number][] = [];
  const faces: number[][] = [];

  for (let lat = 0; lat <= latSegments; lat++) {
    const theta = (lat * Math.PI) / latSegments;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let lon = 0; lon <= lonSegments; lon++) {
      const phi = (lon * 2 * Math.PI) / lonSegments;
      const x = cx + radius * sinTheta * Math.cos(phi);
      const y = cy + radius * cosTheta;
      const z = cz + radius * sinTheta * Math.sin(phi);
      vertices.push([x, y, z]);
    }
  }

  for (let lat = 0; lat < latSegments; lat++) {
    for (let lon = 0; lon < lonSegments; lon++) {
      const first = lat * (lonSegments + 1) + lon;
      const second = first + lonSegments + 1;
      faces.push([first, second, second + 1, first + 1]);
    }
  }

  return { name, vertices, faces, colorHex, layerName };
};

export const createPolyhedronCrystalMesh = (
  name: string,
  radius = 2.5,
  height = 5,
  cx = 0,
  cy = 0,
  cz = 0,
  colorHex = '#10b981',
  layerName = '3D_CRYSTALS'
): MeshData => {
  const vertices: [number, number, number][] = [];
  const faces: number[][] = [];
  const segments = 8;

  // Top vertex
  const topIdx = 0;
  vertices.push([cx, cy + height / 2, cz]);

  // Upper ring
  const upperStart = vertices.length;
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    vertices.push([
      cx + Math.cos(angle) * (radius * 0.9),
      cy + height * 0.2,
      cz + Math.sin(angle) * (radius * 0.9),
    ]);
  }

  // Middle ring (widest)
  const midStart = vertices.length;
  for (let i = 0; i < segments; i++) {
    const angle = ((i + 0.5) / segments) * Math.PI * 2;
    vertices.push([
      cx + Math.cos(angle) * radius,
      cy,
      cz + Math.sin(angle) * radius,
    ]);
  }

  // Lower ring
  const lowerStart = vertices.length;
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    vertices.push([
      cx + Math.cos(angle) * (radius * 0.8),
      cy - height * 0.25,
      cz + Math.sin(angle) * (radius * 0.8),
    ]);
  }

  // Bottom vertex
  const botIdx = vertices.length;
  vertices.push([cx, cy - height / 2, cz]);

  // Top pyramid facets
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    faces.push([topIdx, upperStart + i, upperStart + next]);
  }

  // Upper to middle facets (triangles)
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    faces.push([upperStart + i, midStart + i, upperStart + next]);
    faces.push([upperStart + next, midStart + i, midStart + next]);
  }

  // Middle to lower facets
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    faces.push([midStart + i, lowerStart + i, midStart + next]);
    faces.push([midStart + next, lowerStart + i, lowerStart + next]);
  }

  // Bottom pyramid facets
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    faces.push([botIdx, lowerStart + next, lowerStart + i]);
  }

  return { name, vertices, faces, colorHex, layerName };
};

// ==========================================
// ====== CHARACTER & ADVANCED SCULPTORS ====
// ==========================================

export const createCharacterMeshSet = (
  characterName: string,
  primaryColor = '#10b981',
  accentColor = '#38bdf8',
  suitColor = '#1e293b'
): MeshData[] => {
  const meshes: MeshData[] = [];

  // Head & Facial Features
  meshes.push(createBoxMesh('Head_Cranium', 1.4, 1.5, 1.4, 0, 7.2, 0, '#fbcfe8', '3D_CHAR_HEAD'));
  meshes.push(createBoxMesh('Head_Visor_Optics', 1.2, 0.35, 0.6, 0, 7.3, 0.65, accentColor, '3D_CHAR_VISOR'));
  meshes.push(createBoxMesh('Hair_Helmet_Crown', 1.6, 0.8, 1.6, 0, 8.0, -0.1, primaryColor, '3D_CHAR_HELMET'));
  meshes.push(createCylinderMesh('Neck_Joint', 0.45, 0.6, 12, 0, 6.3, 0, suitColor, '3D_CHAR_ANATOMY'));

  // Torso & Armor Plates
  meshes.push(createBoxMesh('Chest_Torso_Armor', 2.6, 2.2, 1.6, 0, 5.0, 0, suitColor, '3D_CHAR_TORSO'));
  meshes.push(createBoxMesh('Chest_Emblem_Plate', 1.4, 1.2, 0.4, 0, 5.2, 0.85, primaryColor, '3D_CHAR_CHEST_ARMOR'));
  meshes.push(createBoxMesh('Abdomen_Core_Belt', 2.0, 1.0, 1.3, 0, 3.8, 0, '#0f172a', '3D_CHAR_BELT'));
  meshes.push(createBoxMesh('Pelvis_Waist_Armor', 2.2, 0.9, 1.4, 0, 3.0, 0, suitColor, '3D_CHAR_PELVIS'));

  // Shoulders & Arms (Left & Right)
  meshes.push(createBoxMesh('Shoulder_Puldron_L', 1.2, 0.9, 1.2, -1.9, 5.7, 0, primaryColor, '3D_CHAR_SHOULDERS'));
  meshes.push(createBoxMesh('Shoulder_Puldron_R', 1.2, 0.9, 1.2, 1.9, 5.7, 0, primaryColor, '3D_CHAR_SHOULDERS'));

  meshes.push(createCylinderMesh('Upper_Arm_L', 0.38, 1.4, 12, -1.9, 4.6, 0, suitColor, '3D_CHAR_LIMBS'));
  meshes.push(createCylinderMesh('Upper_Arm_R', 0.38, 1.4, 12, 1.9, 4.6, 0, suitColor, '3D_CHAR_LIMBS'));

  meshes.push(createBoxMesh('Forearm_Gauntlet_L', 0.7, 1.3, 0.8, -1.9, 3.4, 0.3, primaryColor, '3D_CHAR_GAUNTLETS'));
  meshes.push(createBoxMesh('Forearm_Gauntlet_R', 0.7, 1.3, 0.8, 1.9, 3.4, 0.3, primaryColor, '3D_CHAR_GAUNTLETS'));

  meshes.push(createBoxMesh('Hand_Fist_L', 0.5, 0.6, 0.6, -1.9, 2.5, 0.6, suitColor, '3D_CHAR_HANDS'));
  meshes.push(createBoxMesh('Hand_Fist_R', 0.5, 0.6, 0.6, 1.9, 2.5, 0.6, suitColor, '3D_CHAR_HANDS'));

  // Signature Weapon (Energy Katana / Saber)
  meshes.push(createBoxMesh('Weapon_Energy_Blade', 0.1, 4.0, 0.35, 2.3, 4.5, 1.2, accentColor, '3D_CHAR_WEAPON'));
  meshes.push(createBoxMesh('Weapon_Blade_Guard', 0.6, 0.12, 0.6, 2.3, 2.4, 1.2, '#f59e0b', '3D_CHAR_WEAPON'));
  meshes.push(createCylinderMesh('Weapon_Hilt_Grip', 0.18, 1.1, 10, 2.3, 1.8, 1.2, '#334155', '3D_CHAR_WEAPON'));

  // Legs & Footwear
  meshes.push(createCylinderMesh('Thigh_Leg_L', 0.5, 1.8, 14, -0.8, 2.0, 0, suitColor, '3D_CHAR_LEGS'));
  meshes.push(createCylinderMesh('Thigh_Leg_R', 0.5, 1.8, 14, 0.8, 2.0, 0, suitColor, '3D_CHAR_LEGS'));

  meshes.push(createBoxMesh('Knee_Guard_L', 0.65, 0.65, 0.45, -0.8, 1.1, 0.5, primaryColor, '3D_CHAR_KNEES'));
  meshes.push(createBoxMesh('Knee_Guard_R', 0.65, 0.65, 0.45, 0.8, 1.1, 0.5, primaryColor, '3D_CHAR_KNEES'));

  meshes.push(createBoxMesh('Calf_Boot_L', 0.8, 1.5, 1.3, -0.8, 0.3, 0.15, suitColor, '3D_CHAR_BOOTS'));
  meshes.push(createBoxMesh('Calf_Boot_R', 0.8, 1.5, 1.3, 0.8, 0.3, 0.15, suitColor, '3D_CHAR_BOOTS'));

  // Display Pedestal Podium with Ring
  meshes.push(createCylinderMesh('Pedestal_Display_Stage', 4.5, 0.4, 28, 0, -0.6, 0, '#0f172a', '3D_PEDESTAL'));
  meshes.push(createCylinderMesh('Pedestal_Aura_Ring', 4.8, 0.1, 32, 0, -0.4, 0, primaryColor, '3D_PEDESTAL'));

  return meshes;
};

export const createRobotMechMeshSet = (
  mechName: string,
  chassisColor = '#0284c7',
  accentColor = '#f59e0b',
  frameColor = '#1e293b'
): MeshData[] => {
  const meshes: MeshData[] = [];

  // Heavy Cockpit & Optical Head
  meshes.push(createBoxMesh('Mech_Cockpit_Head', 2.2, 1.6, 2.2, 0, 7.0, 0.4, chassisColor, '3D_MECH_COCKPIT'));
  meshes.push(createBoxMesh('Mech_Optical_Sensor', 1.8, 0.4, 0.4, 0, 7.1, 1.5, '#ef4444', '3D_MECH_OPTICS'));
  meshes.push(createCylinderMesh('Mech_Neck_Rotator', 0.9, 0.7, 16, 0, 6.0, 0, frameColor, '3D_MECH_CHASSIS'));

  // Heavy Armored Torso with Reactor
  meshes.push(createBoxMesh('Mech_Chest_Chassis', 4.2, 2.8, 2.8, 0, 4.6, 0, frameColor, '3D_MECH_CHASSIS'));
  meshes.push(createCylinderMesh('Mech_Plasma_Reactor', 1.1, 0.6, 18, 0, 4.8, 1.4, accentColor, '3D_MECH_REACTOR'));
  meshes.push(createBoxMesh('Mech_Thruster_Pack', 3.4, 2.4, 1.2, 0, 4.8, -1.8, chassisColor, '3D_MECH_THRUSTERS'));
  meshes.push(createCylinderMesh('Mech_Exhaust_L', 0.6, 1.0, 14, -1.2, 4.8, -2.4, '#f97316', '3D_MECH_THRUSTERS'));
  meshes.push(createCylinderMesh('Mech_Exhaust_R', 0.6, 1.0, 14, 1.2, 4.8, -2.4, '#f97316', '3D_MECH_THRUSTERS'));

  // Heavy Shoulder Pods & Cannons
  meshes.push(createBoxMesh('Shoulder_Pod_L', 1.8, 1.6, 2.0, -3.0, 5.6, 0, chassisColor, '3D_MECH_SHOULDERS'));
  meshes.push(createBoxMesh('Shoulder_Pod_R', 1.8, 1.6, 2.0, 3.0, 5.6, 0, chassisColor, '3D_MECH_SHOULDERS'));
  meshes.push(createCylinderMesh('Shoulder_Cannon_L', 0.4, 3.0, 14, -3.0, 6.6, 1.0, frameColor, '3D_MECH_CANNON'));
  meshes.push(createCylinderMesh('Shoulder_Cannon_R', 0.4, 3.0, 14, 3.0, 6.6, 1.0, frameColor, '3D_MECH_CANNON'));

  // Hydraulic Arms & Heavy Gauntlets
  meshes.push(createCylinderMesh('Arm_Actuator_L', 0.6, 1.8, 12, -3.0, 4.2, 0, frameColor, '3D_MECH_ARMS'));
  meshes.push(createCylinderMesh('Arm_Actuator_R', 0.6, 1.8, 12, 3.0, 4.2, 0, frameColor, '3D_MECH_ARMS'));
  meshes.push(createBoxMesh('Heavy_Gauntlet_L', 1.2, 1.8, 1.4, -3.0, 2.8, 0.4, chassisColor, '3D_MECH_ARMS'));
  meshes.push(createBoxMesh('Heavy_Gauntlet_R', 1.2, 1.8, 1.4, 3.0, 2.8, 0.4, chassisColor, '3D_MECH_ARMS'));

  // Massive Bipedal Legs & Treads
  meshes.push(createCylinderMesh('Leg_Hydraulic_L', 0.8, 2.2, 16, -1.4, 2.0, 0, frameColor, '3D_MECH_LEGS'));
  meshes.push(createCylinderMesh('Leg_Hydraulic_R', 0.8, 2.2, 16, 1.4, 2.0, 0, frameColor, '3D_MECH_LEGS'));
  meshes.push(createBoxMesh('Knee_Armor_Plate_L', 1.1, 1.0, 0.9, -1.4, 1.1, 0.8, chassisColor, '3D_MECH_KNEES'));
  meshes.push(createBoxMesh('Knee_Armor_Plate_R', 1.1, 1.0, 0.9, 1.4, 1.1, 0.8, chassisColor, '3D_MECH_KNEES'));
  meshes.push(createBoxMesh('Mech_Foot_Pad_L', 1.6, 0.6, 2.6, -1.4, -0.2, 0.4, frameColor, '3D_MECH_FEET'));
  meshes.push(createBoxMesh('Mech_Foot_Pad_R', 1.6, 0.6, 2.6, 1.4, -0.2, 0.4, frameColor, '3D_MECH_FEET'));

  // Heavy Foundry Base
  meshes.push(createBoxMesh('Hangar_Floor_Grate', 10.0, 0.4, 10.0, 0, -0.7, 0, '#0f172a', '3D_PEDESTAL'));
  meshes.push(createBoxMesh('Hangar_Warning_Border', 10.4, 0.1, 10.4, 0, -0.5, 0, accentColor, '3D_PEDESTAL'));

  return meshes;
};

export const createCreatureDragonMeshSet = (
  creatureName: string,
  scaleColor = '#10b981',
  wingColor = '#065f46',
  bellyColor = '#f59e0b'
): MeshData[] => {
  const meshes: MeshData[] = [];

  // Head, Snout & Horns
  meshes.push(createBoxMesh('Dragon_Head_Cranium', 1.8, 1.4, 2.2, 0, 5.2, 2.4, scaleColor, '3D_CREATURE_HEAD'));
  meshes.push(createBoxMesh('Dragon_Snout_Muzzle', 1.2, 0.8, 1.6, 0, 4.9, 4.0, scaleColor, '3D_CREATURE_SNOUT'));
  meshes.push(createBoxMesh('Dragon_Glowing_Eyes', 1.4, 0.3, 0.4, 0, 5.4, 3.2, '#fbbf24', '3D_CREATURE_EYES'));
  meshes.push(createCylinderMesh('Dragon_Horn_L', 0.2, 1.8, 10, -0.8, 6.4, 1.8, '#f59e0b', '3D_CREATURE_HORNS'));
  meshes.push(createCylinderMesh('Dragon_Horn_R', 0.2, 1.8, 10, 0.8, 6.4, 1.8, '#f59e0b', '3D_CREATURE_HORNS'));

  // Neck & Spine
  meshes.push(createCylinderMesh('Dragon_Neck', 1.0, 2.4, 14, 0, 4.2, 1.4, scaleColor, '3D_CREATURE_NECK'));
  meshes.push(createBoxMesh('Dragon_Body_Chest', 3.2, 2.4, 4.0, 0, 3.0, -0.6, scaleColor, '3D_CREATURE_BODY'));
  meshes.push(createBoxMesh('Dragon_Underbelly', 2.2, 1.8, 3.2, 0, 2.2, -0.4, bellyColor, '3D_CREATURE_BELLY'));

  // Wings (Left & Right)
  meshes.push(createBoxMesh('Wing_Arm_L', 4.5, 0.3, 0.6, -3.2, 4.5, -0.8, scaleColor, '3D_CREATURE_WINGS'));
  meshes.push(createBoxMesh('Wing_Arm_R', 4.5, 0.3, 0.6, 3.2, 4.5, -0.8, scaleColor, '3D_CREATURE_WINGS'));
  meshes.push(createBoxMesh('Wing_Membrane_L', 5.0, 0.1, 3.4, -3.5, 4.0, -2.2, wingColor, '3D_CREATURE_WINGS'));
  meshes.push(createBoxMesh('Wing_Membrane_R', 5.0, 0.1, 3.4, 3.5, 4.0, -2.2, wingColor, '3D_CREATURE_WINGS'));

  // Limbs with Claws
  meshes.push(createCylinderMesh('Forelimb_L', 0.5, 2.2, 12, -1.6, 1.4, 0.8, scaleColor, '3D_CREATURE_LIMBS'));
  meshes.push(createCylinderMesh('Forelimb_R', 0.5, 2.2, 12, 1.6, 1.4, 0.8, scaleColor, '3D_CREATURE_LIMBS'));
  meshes.push(createCylinderMesh('Hindlimb_L', 0.7, 2.6, 12, -1.8, 1.6, -2.0, scaleColor, '3D_CREATURE_LIMBS'));
  meshes.push(createCylinderMesh('Hindlimb_R', 0.7, 2.6, 12, 1.8, 1.6, -2.0, scaleColor, '3D_CREATURE_LIMBS'));

  // Tail
  meshes.push(createBoxMesh('Tail_Segment_1', 1.2, 1.0, 3.0, 0, 2.6, -3.8, scaleColor, '3D_CREATURE_TAIL'));
  meshes.push(createBoxMesh('Tail_Spade_Blade', 0.2, 1.6, 1.4, 0, 2.6, -5.6, '#f59e0b', '3D_CREATURE_TAIL'));

  // Volcanic / Fantasy Pedestal
  meshes.push(createCylinderMesh('Fantasy_Stage_Platform', 5.0, 0.5, 24, 0, -0.3, 0, '#1c1917', '3D_PEDESTAL'));
  meshes.push(createCylinderMesh('Magma_Energy_Ring', 5.2, 0.1, 28, 0, -0.1, 0, '#ef4444', '3D_PEDESTAL'));

  return meshes;
};

export const createWeaponPropMeshSet = (
  weaponName: string,
  bladeColor = '#00f5ff',
  guardColor = '#f59e0b',
  gripColor = '#1e293b'
): MeshData[] => {
  const meshes: MeshData[] = [];

  // Main Blade / Beam
  meshes.push(createBoxMesh('Weapon_Blade_Core', 0.25, 8.0, 0.9, 0, 4.5, 0, bladeColor, '3D_WEAPON_BLADE'));
  meshes.push(createBoxMesh('Weapon_Blade_Edge', 0.08, 8.2, 1.1, 0, 4.6, 0, '#ffffff', '3D_WEAPON_EDGE'));
  meshes.push(createBoxMesh('Weapon_Fuller_Channel', 0.35, 6.0, 0.25, 0, 4.0, 0, '#0284c7', '3D_WEAPON_BLADE'));

  // Crossguard & Emblems
  meshes.push(createBoxMesh('Crossguard_Main', 2.8, 0.5, 1.0, 0, 0.3, 0, guardColor, '3D_WEAPON_GUARD'));
  meshes.push(createCylinderMesh('Guard_Gem_Core', 0.45, 1.1, 14, 0, 0.3, 0, bladeColor, '3D_WEAPON_GEM'));

  // Handle Grip & Pommel
  meshes.push(createCylinderMesh('Handle_Hilt_Grip', 0.35, 2.6, 14, 0, -1.2, 0, gripColor, '3D_WEAPON_HILT'));
  meshes.push(createBoxMesh('Pommel_Counterweight', 0.8, 0.8, 0.8, 0, -2.7, 0, guardColor, '3D_WEAPON_POMMEL'));

  // Display Stand
  meshes.push(createBoxMesh('Pedestal_Weapon_Rack', 3.6, 0.4, 2.2, 0, -3.4, 0, '#0f172a', '3D_PEDESTAL'));
  meshes.push(createCylinderMesh('Stand_Support_Pillars', 0.15, 2.0, 10, 0, -2.4, 0, '#475569', '3D_PEDESTAL'));

  return meshes;
};

// ==========================================
// ====== EXTRACT OR ASSEMBLE 3D MODEL ======
// ==========================================

export const extractOrGenerate3DModel = (
  code: string,
  projectName = '3D_Model',
  promptContext = ''
): Model3DData => {
  const norm = (code + ' ' + promptContext).toLowerCase();
  let meshes: MeshData[] = [];

  // A. Check if Character / Humanoid / Hero / Samurai / Warrior / Avatar / Anime / Person / Photo Reference
  if (
    norm.includes('character') ||
    norm.includes('human') ||
    norm.includes('warrior') ||
    norm.includes('samurai') ||
    norm.includes('avatar') ||
    norm.includes('anime') ||
    norm.includes('person') ||
    norm.includes('hero') ||
    norm.includes('knight') ||
    norm.includes('ninja') ||
    norm.includes('soldier') ||
    norm.includes('cyberpunk') ||
    norm.includes('action figure') ||
    norm.includes('photo') ||
    norm.includes('reference')
  ) {
    // Choose theme colors based on context
    const primary = norm.includes('cyber') || norm.includes('neon') ? '#00f5ff' : norm.includes('gold') || norm.includes('samurai') ? '#f59e0b' : '#10b981';
    const accent = norm.includes('red') ? '#ef4444' : norm.includes('purple') ? '#a855f7' : '#38bdf8';
    meshes = createCharacterMeshSet(projectName || 'Detailed_3D_Character', primary, accent, '#1e293b');

    return {
      title: projectName || 'Articulated_3D_Character',
      description: 'Fully articulated 3D character model with head, visor, torso armor, shoulders, limbs, weapon, and display pedestal',
      meshes
    };
  }

  // B. Robot / Mech / Android / Cyborg / Exosuit
  if (
    norm.includes('robot') ||
    norm.includes('mech') ||
    norm.includes('android') ||
    norm.includes('cyborg') ||
    norm.includes('exosuit') ||
    norm.includes('gundam') ||
    norm.includes('transformer') ||
    norm.includes('drone')
  ) {
    meshes = createRobotMechMeshSet(projectName || 'Heavy_Armored_Mech', '#0284c7', '#f59e0b', '#1e293b');
    return {
      title: projectName || 'Heavy_Armored_Mech',
      description: 'Articulated bipedal heavy sci-fi mech with cockpit, reactor core, shoulder cannons, and hydraulic actuators',
      meshes
    };
  }

  // C. Creature / Dragon / Monster / Beast / Animal
  if (
    norm.includes('creature') ||
    norm.includes('dragon') ||
    norm.includes('monster') ||
    norm.includes('beast') ||
    norm.includes('dinosaur') ||
    norm.includes('alien') ||
    norm.includes('animal') ||
    norm.includes('wolf')
  ) {
    meshes = createCreatureDragonMeshSet(projectName || 'Mythical_Creature_Dragon', '#10b981', '#065f46', '#f59e0b');
    return {
      title: projectName || 'Mythical_Creature_Dragon',
      description: 'Anatomically sculpted 3D creature with snout, horns, articulated wings, limbs, tail, and magma platform',
      meshes
    };
  }

  // D. Weapon / Prop / Sword / Gun / Artifact
  if (
    norm.includes('sword') ||
    norm.includes('weapon') ||
    norm.includes('blade') ||
    norm.includes('gun') ||
    norm.includes('blaster') ||
    norm.includes('staff') ||
    norm.includes('shield') ||
    norm.includes('katana') ||
    norm.includes('artifact')
  ) {
    meshes = createWeaponPropMeshSet(projectName || 'Legendary_Energy_Blade', '#00f5ff', '#f59e0b', '#1e293b');
    return {
      title: projectName || 'Legendary_Energy_Blade',
      description: 'Precision hard-surface 3D weapon with core blade, fuller channel, crossguard gem, and display rack',
      meshes
    };
  }

  // 1. Check if architectural / city / buildings
  if (norm.includes('city') || norm.includes('building') || norm.includes('tower') || norm.includes('architect') || norm.includes('house')) {
    // Base ground slab
    meshes.push(createBoxMesh('Ground_Foundation', 24, 0.4, 24, 0, -0.2, 0, '#1e293b', '3D_SITE_GROUND'));
    
    // Central Highrise Tower
    meshes.push(createBoxMesh('Tower_Main_Core', 4, 12, 4, 0, 6, 0, '#0284c7', '3D_ARCH_TOWERS'));
    meshes.push(createBoxMesh('Tower_Crown_Spire', 1.2, 3, 1.2, 0, 13.5, 0, '#38bdf8', '3D_ARCH_SPIRES'));
    
    // Surrounding commercial towers
    meshes.push(createBoxMesh('Building_East', 3.5, 8, 3.5, 6, 4, 5, '#10b981', '3D_ARCH_BUILDINGS'));
    meshes.push(createBoxMesh('Building_West', 3, 9, 3, -6, 4.5, -4, '#6366f1', '3D_ARCH_BUILDINGS'));
    meshes.push(createBoxMesh('Building_North', 4, 6, 2.5, -5, 3, 6, '#f59e0b', '3D_ARCH_BUILDINGS'));
    meshes.push(createBoxMesh('Building_South', 3, 7, 4, 5, 3.5, -5, '#ec4899', '3D_ARCH_BUILDINGS'));
    
    // Architectural Columns & Plaza Accents
    meshes.push(createCylinderMesh('Plaza_Column_1', 0.4, 3, 12, -2.5, 1.5, 2.5, '#94a3b8', '3D_ARCH_DETAILS'));
    meshes.push(createCylinderMesh('Plaza_Column_2', 0.4, 3, 12, 2.5, 1.5, 2.5, '#94a3b8', '3D_ARCH_DETAILS'));
    meshes.push(createCylinderMesh('Plaza_Column_3', 0.4, 3, 12, -2.5, 1.5, -2.5, '#94a3b8', '3D_ARCH_DETAILS'));
    meshes.push(createCylinderMesh('Plaza_Column_4', 0.4, 3, 12, 2.5, 1.5, -2.5, '#94a3b8', '3D_ARCH_DETAILS'));

    return {
      title: projectName || 'Architectural_City_Model',
      description: 'Parametric multi-structure architectural model with building blocks, foundation slab, and columns',
      meshes
    };
  }

  // 2. Mechanical / Engineering / Gear
  if (norm.includes('gear') || norm.includes('engine') || norm.includes('mechanic') || norm.includes('part')) {
    // Central Hub
    meshes.push(createCylinderMesh('Central_Gear_Hub', 2.2, 1.2, 20, 0, 0, 0, '#059669', '3D_MECH_CORE'));
    meshes.push(createCylinderMesh('Central_Axle_Bore', 0.8, 1.6, 16, 0, 0, 0, '#047857', '3D_MECH_BORE'));
    
    // Gear Teeth
    const teethCount = 8;
    for (let i = 0; i < teethCount; i++) {
      const angle = (i / teethCount) * Math.PI * 2;
      const tx = Math.cos(angle) * 2.8;
      const tz = Math.sin(angle) * 2.8;
      meshes.push(createBoxMesh(`Gear_Tooth_${i + 1}`, 0.9, 1.0, 0.8, tx, 0, tz, '#10b981', '3D_MECH_TEETH'));
    }

    // Mounting Flange & Base plate
    meshes.push(createBoxMesh('Mounting_Base_Plate', 8, 0.4, 8, 0, -1.8, 0, '#334155', '3D_MECH_FLANGE'));
    meshes.push(createCylinderMesh('Bearing_Support_Col', 0.5, 1.2, 12, 0, -1.0, 0, '#64748b', '3D_MECH_SHAFTS'));

    return {
      title: projectName || 'Mechanical_Gear_Assembly',
      description: 'Precision engineering gear assembly with involute teeth, central hub, and bearing support',
      meshes
    };
  }

  // 3. Space / Celestial / Solar
  if (norm.includes('space') || norm.includes('solar') || norm.includes('planet') || norm.includes('star') || norm.includes('orbit')) {
    // Central Sun / Star
    meshes.push(createSphereMesh('Central_Sun', 2.8, 16, 20, 0, 0, 0, '#f59e0b', '3D_ASTRONOMY_STAR'));
    
    // Planetary Bodies
    meshes.push(createSphereMesh('Planet_Mercury', 0.6, 10, 12, 4.5, 0, 0, '#94a3b8', '3D_ASTRONOMY_PLANETS'));
    meshes.push(createSphereMesh('Planet_Venus', 0.9, 10, 14, -6.5, 0.5, 2, '#fbbf24', '3D_ASTRONOMY_PLANETS'));
    meshes.push(createSphereMesh('Planet_Earth', 1.1, 12, 16, 3, 0, 8.5, '#38bdf8', '3D_ASTRONOMY_PLANETS'));
    meshes.push(createSphereMesh('Earth_Moon', 0.35, 8, 10, 4.2, 0.3, 9.2, '#e2e8f0', '3D_ASTRONOMY_MOONS'));
    meshes.push(createSphereMesh('Planet_Mars', 0.75, 10, 14, -9.5, -0.4, -4, '#ef4444', '3D_ASTRONOMY_PLANETS'));
    
    // Orbit Rings & Marker
    meshes.push(createCylinderMesh('Orbit_Ring_Guide', 9.5, 0.05, 32, 0, 0, 0, '#6366f1', '3D_ASTRONOMY_ORBITS'));

    return {
      title: projectName || 'Celestial_Solar_System',
      description: 'Cosmic celestial orbit model with central star, orbital bodies, and planetary coordinates',
      meshes
    };
  }

  // 4. Vehicle / Aircraft / Spaceship
  if (norm.includes('car') || norm.includes('ship') || norm.includes('plane') || norm.includes('flight') || norm.includes('speed')) {
    // Main Fuselage
    meshes.push(createBoxMesh('Main_Fuselage', 3.2, 1.4, 7.0, 0, 1.0, 0, '#0f172a', '3D_VEHICLE_BODY'));
    // Cockpit canopy
    meshes.push(createBoxMesh('Cockpit_Canopy', 2.2, 0.9, 3.2, 0, 2.0, 0.4, '#06b6d4', '3D_VEHICLE_CANOPY'));
    // Front aerodynamic nose
    meshes.push(createBoxMesh('Aero_Nose', 2.6, 0.8, 2.2, 0, 0.8, 4.2, '#1e293b', '3D_VEHICLE_NOSE'));
    // Rear Aerodynamic Spoiler
    meshes.push(createBoxMesh('Aero_Spoiler_Wing', 4.4, 0.2, 0.8, 0, 2.5, -3.2, '#10b981', '3D_VEHICLE_WINGS'));
    meshes.push(createCylinderMesh('Spoiler_Strut_L', 0.1, 1.2, 8, -1.2, 1.8, -3.2, '#94a3b8', '3D_VEHICLE_STRUTS'));
    meshes.push(createCylinderMesh('Spoiler_Strut_R', 0.1, 1.2, 8, 1.2, 1.8, -3.2, '#94a3b8', '3D_VEHICLE_STRUTS'));
    // Thrusters / Wheels
    meshes.push(createCylinderMesh('Propulsion_Exhaust_L', 0.6, 1.4, 16, -1.1, 1.0, -3.8, '#f97316', '3D_VEHICLE_THRUSTERS'));
    meshes.push(createCylinderMesh('Propulsion_Exhaust_R', 0.6, 1.4, 16, 1.1, 1.0, -3.8, '#f97316', '3D_VEHICLE_THRUSTERS'));

    return {
      title: projectName || 'Aerodynamic_Cyber_Craft',
      description: 'Sleek aerodynamic high-speed cyber vehicle with dual propulsion thrusters and cockpit canopy',
      meshes
    };
  }

  // 5. Default High-Fidelity Parametric Crystal & Pedestal
  // Central Multi-Faceted Crystal
  meshes.push(createPolyhedronCrystalMesh('Cosmic_Crystal_Gem', 2.4, 5.2, 0, 2.8, 0, '#10b981', '3D_GEM_CORE'));
  // Floating Orbit Rings
  meshes.push(createCylinderMesh('Gimbal_Ring_Outer', 3.8, 0.15, 24, 0, 2.8, 0, '#38bdf8', '3D_GIMBAL_RINGS'));
  meshes.push(createCylinderMesh('Gimbal_Ring_Inner', 3.2, 0.12, 24, 0, 2.8, 0, '#a855f7', '3D_GIMBAL_RINGS'));
  // Floating Mini Satellites
  meshes.push(createPolyhedronCrystalMesh('Satellite_Gem_1', 0.6, 1.2, 3.8, 3.2, 1.5, '#f59e0b', '3D_SATELLITES'));
  meshes.push(createPolyhedronCrystalMesh('Satellite_Gem_2', 0.6, 1.2, -3.8, 2.4, -1.5, '#ec4899', '3D_SATELLITES'));
  // Base Pedestal
  meshes.push(createCylinderMesh('Pedestal_Top_Ring', 3.0, 0.4, 20, 0, 0.2, 0, '#334155', '3D_BASE_PEDESTAL'));
  meshes.push(createCylinderMesh('Pedestal_Main_Base', 3.6, 0.5, 24, 0, -0.2, 0, '#1e293b', '3D_BASE_PEDESTAL'));

  return {
    title: projectName || 'Parametric_Crystal_Geometry',
    description: 'Precision multifaceted 3D crystal polyhedron with orbital gimbal rings and geometric pedestal',
    meshes
  };
};

// ==========================================
// ====== AUTODESK AUTOCAD DXF GENERATOR ====
// ==========================================

/**
 * Generates an AutoCAD-compliant DXF (Drawing Exchange Format) ASCII file.
 * Compatible with AutoCAD 2000-2026, AutoCAD LT, Autodesk Viewer, Fusion 360,
 * FreeCAD, LibreCAD, and SolidWorks.
 * Uses native 3DFACE entities on distinct CAD layers with AutoCAD standard colors.
 */
export const generateAutoCadDxf = (model: Model3DData): string => {
  const lines: string[] = [];

  const add = (group: number, value: string | number) => {
    lines.push(group.toString());
    lines.push(value.toString());
  };

  // Collect unique layers
  const layersMap = new Map<string, number>();
  layersMap.set('0', 7); // Default layer
  model.meshes.forEach(m => {
    const aciColor = hexToAutoCadColorIndex(m.colorHex);
    layersMap.set(m.layerName || '3D_GEOMETRY', aciColor);
  });

  // 1. HEADER SECTION
  add(0, 'SECTION');
  add(2, 'HEADER');
  add(9, '$ACADVER');
  add(1, 'AC1015'); // AutoCAD 2000/2002 DXF format (maximum backwards and forwards compatibility)
  add(9, '$INSUNITS');
  add(70, 4); // 4 = Millimeters
  add(9, '$MEASUREMENT');
  add(70, 1); // 1 = Metric
  add(0, 'ENDSEC');

  // 2. TABLES SECTION (LAYERS)
  add(0, 'SECTION');
  add(2, 'TABLES');
  
  // Layer Table
  add(0, 'TABLE');
  add(2, 'LAYER');
  add(70, layersMap.size);

  layersMap.forEach((color, layerName) => {
    add(0, 'LAYER');
    add(2, layerName);
    add(70, 0); // standard layer flags
    add(62, color); // AutoCAD Color Index (ACI)
    add(6, 'CONTINUOUS');
  });

  add(0, 'ENDTAB');
  add(0, 'ENDSEC');

  // 3. ENTITIES SECTION (3D GEOMETRY FACES)
  add(0, 'SECTION');
  add(2, 'ENTITIES');

  for (const mesh of model.meshes) {
    const layer = mesh.layerName || '3D_GEOMETRY';
    const color = hexToAutoCadColorIndex(mesh.colorHex);
    const verts = mesh.vertices;

    for (const face of mesh.faces) {
      if (face.length < 3) continue;

      const p0 = verts[face[0]];
      const p1 = verts[face[1]];
      const p2 = verts[face[2]];
      // If triangle, replicate point 3 to point 4 as per DXF 3DFACE standard
      const p3 = face.length >= 4 ? verts[face[3]] : p2;

      if (!p0 || !p1 || !p2 || !p3) continue;

      add(0, '3DFACE');
      add(8, layer);
      add(62, color);
      
      // Point 1 (X, Y, Z)
      add(10, p0[0].toFixed(4));
      add(20, p0[1].toFixed(4));
      add(30, p0[2].toFixed(4));

      // Point 2 (X, Y, Z)
      add(11, p1[0].toFixed(4));
      add(21, p1[1].toFixed(4));
      add(31, p1[2].toFixed(4));

      // Point 3 (X, Y, Z)
      add(12, p2[0].toFixed(4));
      add(22, p2[1].toFixed(4));
      add(32, p2[2].toFixed(4));

      // Point 4 (X, Y, Z)
      add(13, p3[0].toFixed(4));
      add(23, p3[1].toFixed(4));
      add(33, p3[2].toFixed(4));

      add(70, 0); // All edges visible
    }
  }

  add(0, 'ENDSEC');

  // 4. EOF
  add(0, 'EOF');

  return lines.join('\r\n');
};

/**
 * Generates an AutoCAD automation script (.scr) that opens the model,
 * configures 3D Isometric view, sets Realistic visual style, and centers view.
 */
export const generateAutoCadScript = (dxfFilename: string): string => {
  return `; Tetagpt Cosmic Builder - AutoCAD 3D Setup Script
; Run by typing SCRIPT in AutoCAD and selecting this file.
OPEN "${dxfFilename}"
-VIEW _SWISO
SHADEMODE _REALISTIC
ZOOM _EXTENTS
3DORBIT
`;
};

// ==========================================
// ====== BLENDER PYTHON SCRIPT GENERATOR ===
// ==========================================

/**
 * Generates a complete Blender Python script (.py).
 * When run in Blender's Scripting tab (or via `blender -P script.py`),
 * it clears default scene, creates native Blender meshes, assigns Principled BSDF
 * materials with exact colors/roughness, creates a studio lighting setup, and targets camera.
 */
export const generateBlenderPythonScript = (model: Model3DData): string => {
  const safeName = model.title.replace(/[^a-zA-Z0-9_]/g, '_');

  const meshesJson = JSON.stringify(
    model.meshes.map(m => ({
      name: m.name.replace(/[^a-zA-Z0-9_]/g, '_'),
      vertices: m.vertices,
      faces: m.faces,
      color: hexToRgb01(m.colorHex),
      roughness: m.roughness ?? 0.35,
      metallic: m.metallic ?? 0.2
    })),
    null,
    2
  );

  return `# ==============================================================================
# Tetagpt Cosmic 3D Studio - Blender Python Model Importer & Generator
# Project: ${model.title}
# Generated by Tetagpt (tetagpt.co)
#
# INSTRUCTIONS TO OPEN IN BLENDER:
# 1. Open Blender (v3.0, v3.6, v4.0, v4.1, v4.2+).
# 2. Switch to the 'Scripting' tab in the top header.
# 3. Click 'New' (or 'Open') and paste this entire code.
# 4. Click 'Run Script' (or press Alt + P).
# 5. Switch to 'Layout' or 'Shading' workspace and enable Material Preview (Z -> 2)!
# ==============================================================================

import bpy
import math

# 1. Clean existing scene objects (default cube, default light)
if bpy.context.active_object and bpy.context.active_object.mode == 'EDIT':
    bpy.ops.object.mode_set(mode='OBJECT')

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# 2. Create a dedicated Collection for the project
collection_name = "Tetagpt_${safeName}"
if collection_name not in bpy.data.collections:
    tetagpt_collection = bpy.data.collections.new(collection_name)
    bpy.context.scene.collection.children.link(tetagpt_collection)
else:
    tetagpt_collection = bpy.data.collections[collection_name]

# 3. Component Meshes & Geometry Data
meshes_data = ${meshesJson}

created_objects = []

for item in meshes_data:
    mesh_name = item["name"]
    verts = item["vertices"]
    faces = item["faces"]
    color_rgb = item["color"]
    roughness = item["roughness"]
    metallic = item["metallic"]

    # Create mesh & object
    mesh = bpy.data.meshes.new(mesh_name + "_Mesh")
    obj = bpy.data.objects.new(mesh_name, mesh)
    tetagpt_collection.objects.link(obj)

    # Build geometry
    mesh.from_pydata(verts, [], faces)
    mesh.update()

    # Create & configure Principled BSDF Material
    mat_name = mesh_name + "_Material"
    mat = bpy.data.materials.new(name=mat_name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    
    # Locate Principled BSDF node
    bsdf = None
    for n in nodes:
        if n.type == 'BSDF_PRINCIPLED':
            bsdf = n
            break

    if bsdf:
        # Base Color RGBA
        bsdf.inputs['Base Color'].default_value = (color_rgb[0], color_rgb[1], color_rgb[2], 1.0)
        
        # Roughness & Metallic
        if 'Roughness' in bsdf.inputs:
            bsdf.inputs['Roughness'].default_value = roughness
        if 'Metallic' in bsdf.inputs:
            bsdf.inputs['Metallic'].default_value = metallic

    obj.data.materials.append(mat)
    created_objects.append(obj)

# 4. Create Studio 3-Point Lighting Setup
# Key Sun Light
light_data = bpy.data.lights.new(name="Sun_Key_Light", type='SUN')
light_data.energy = 3.5
light_data.color = (1.0, 0.98, 0.94)
light_obj = bpy.data.objects.new(name="Sun_Key_Light", object_data=light_data)
tetagpt_collection.objects.link(light_obj)
light_obj.location = (8.0, -10.0, 12.0)
light_obj.rotation_euler = (math.radians(45), math.radians(15), math.radians(35))

# Fill Light
fill_data = bpy.data.lights.new(name="Fill_Light", type='POINT')
fill_data.energy = 500.0
fill_data.color = (0.7, 0.85, 1.0)
fill_obj = bpy.data.objects.new(name="Fill_Light", object_data=fill_data)
tetagpt_collection.objects.link(fill_obj)
fill_obj.location = (-9.0, 6.0, 8.0)

# 5. Create Camera targeting the 3D object
cam_data = bpy.data.cameras.new(name="Tetagpt_Camera")
cam_obj = bpy.data.objects.new(name="Tetagpt_Camera", object_data=cam_data)
tetagpt_collection.objects.link(cam_obj)
cam_obj.location = (12.0, -14.0, 9.0)
cam_obj.rotation_euler = (math.radians(65), 0, math.radians(40))
bpy.context.scene.camera = cam_obj

# 6. Select all and center view
for obj in created_objects:
    obj.select_set(True)

bpy.context.view_layer.objects.active = created_objects[0] if created_objects else None

print(f"✅ Tetagpt 3D Model '${model.title}' successfully built in Blender with {len(created_objects)} mesh objects!")
`;
};

// ==========================================
// ====== WAVEFRONT OBJ & MTL GENERATOR =====
// ==========================================

export const generateWavefrontObj = (model: Model3DData): { obj: string; mtl: string } => {
  const objLines: string[] = [
    `# Tetagpt Cosmic 3D Studio - Wavefront OBJ`,
    `# Model: ${model.title}`,
    `mtllib ${model.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.mtl`,
    ''
  ];

  const mtlLines: string[] = [
    `# Tetagpt Cosmic 3D Studio - Materials MTL`,
    `# Model: ${model.title}`,
    ''
  ];

  let vertexOffset = 1;

  for (const mesh of model.meshes) {
    const meshName = mesh.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const matName = `Mat_${meshName}`;

    // Add material to MTL
    const [r, g, b] = hexToRgb01(mesh.colorHex);
    mtlLines.push(`newmtl ${matName}`);
    mtlLines.push(`Ka 0.2000 0.2000 0.2000`);
    mtlLines.push(`Kd ${r.toFixed(4)} ${g.toFixed(4)} ${b.toFixed(4)}`);
    mtlLines.push(`Ks 0.5000 0.5000 0.5000`);
    mtlLines.push(`Ns 120.0000`);
    mtlLines.push(`d 1.0`);
    mtlLines.push(`illum 2`);
    mtlLines.push('');

    // Add object & vertices to OBJ
    objLines.push(`o ${meshName}`);
    objLines.push(`usemtl ${matName}`);

    for (const v of mesh.vertices) {
      objLines.push(`v ${v[0].toFixed(4)} ${v[1].toFixed(4)} ${v[2].toFixed(4)}`);
    }

    for (const f of mesh.faces) {
      if (f.length < 3) continue;
      const faceIndices = f.map(idx => idx + vertexOffset);
      objLines.push(`f ${faceIndices.join(' ')}`);
    }

    vertexOffset += mesh.vertices.length;
    objLines.push('');
  }

  return {
    obj: objLines.join('\n'),
    mtl: mtlLines.join('\n')
  };
};

// ==========================================
// ====== ONE-CLICK DOWNLOAD HELPERS ========
// ==========================================

const triggerBrowserDownload = (content: string | Blob, filename: string, mimeType: string) => {
  const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Downloads the AutoCAD DXF (.dxf) file directly.
 */
export const downloadAutoCadDxf = (model: Model3DData) => {
  const safeName = (model.title || 'tetagpt-autocad').toLowerCase().replace(/[^a-z0-9-_]/g, '-');
  const dxf = generateAutoCadDxf(model);
  triggerBrowserDownload(dxf, `${safeName}-3d-cad.dxf`, 'application/dxf;charset=utf-8');
};

/**
 * Downloads the Blender Python Importer Script (.py) directly.
 */
export const downloadBlenderPythonScript = (model: Model3DData) => {
  const safeName = (model.title || 'tetagpt-blender').toLowerCase().replace(/[^a-z0-9-_]/g, '-');
  const pyScript = generateBlenderPythonScript(model);
  triggerBrowserDownload(pyScript, `${safeName}-blender-import.py`, 'text/x-python;charset=utf-8');
};

/**
 * Downloads the Universal Wavefront 3D (.obj) file directly.
 */
export const downloadWavefrontObjFiles = (model: Model3DData) => {
  const safeName = (model.title || 'tetagpt-model').toLowerCase().replace(/[^a-z0-9-_]/g, '-');
  const { obj } = generateWavefrontObj(model);
  triggerBrowserDownload(obj, `${safeName}-3d-model.obj`, 'text/plain;charset=utf-8');
};

/**
 * Downloads the Complete AutoCAD Package ZIP (.dxf + .scr + README_AUTOCAD.md).
 */
export const downloadAutoCadPackageZip = async (model: Model3DData): Promise<void> => {
  const zip = new JSZip();
  const safeName = (model.title || 'tetagpt-autocad').toLowerCase().replace(/[^a-z0-9-_]/g, '-');

  const dxfContent = generateAutoCadDxf(model);
  zip.file(`${safeName}.dxf`, dxfContent);

  const scrContent = generateAutoCadScript(`${safeName}.dxf`);
  zip.file('setup_autocad_view.scr', scrContent);

  const readmeContent = `# ${model.title} - Autodesk AutoCAD 3D Package

Generated with **Tetagpt Cosmic 3D Modeler** (tetagpt.co)

---

## 📐 How to Open in AutoCAD

### Method 1: Instant Direct Open (Easiest)
1. Launch **AutoCAD** (Compatible with AutoCAD 2000 through AutoCAD 2026, AutoCAD LT, Civil 3D, and Autodesk Viewer).
2. Go to **File > Open** (or type \`OPEN\` in the command bar).
3. Set the file filter dropdown to **DXF (*.dxf)**.
4. Select \`${safeName}.dxf\` and click **Open**.
5. Your 3D model will appear immediately with all layers and face coordinates!

### Method 2: High-Fidelity 3D Shaded View
1. In the command prompt, type:
   \`\`\`text
   SHADEMODE
   \`\`\`
   and select **REALISTIC** or **CONCEPTUAL**.
2. Type:
   \`\`\`text
   -VIEW
   \`\`\`
   and select **SW ISO** (Southwest Isometric) for a dramatic 3D perspective.
3. Use \`3DORBIT\` (or hold Shift + Middle Mouse button) to rotate freely in full 3D space!

### Method 3: Convert to AutoCAD 3D Solid / Mesh
- Type \`CONVTOMESH\` or \`MESHTOSOLID\` to turn the 3DFACE surfaces into watertight 3D solids for CNC, architectural drafting, or 3D printing slicing!

---
*Created by Tetagpt Cosmic Builder — Engineering & CAD Engine.*
`;
  zip.file('README_AUTOCAD.md', readmeContent);

  const blob = await zip.generateAsync({ type: 'blob' });
  triggerBrowserDownload(blob, `${safeName}-autocad-bundle.zip`, 'application/zip');
};

/**
 * Downloads the Complete Blender Studio Package ZIP (.py script + .obj + .mtl + README_BLENDER.md).
 */
export const downloadBlenderPackageZip = async (model: Model3DData): Promise<void> => {
  const zip = new JSZip();
  const safeName = (model.title || 'tetagpt-blender').toLowerCase().replace(/[^a-z0-9-_]/g, '-');

  // 1. Blender Python Script
  const pyScript = generateBlenderPythonScript(model);
  zip.file('import_to_blender.py', pyScript);

  // 2. Wavefront OBJ & MTL
  const { obj, mtl } = generateWavefrontObj(model);
  zip.file(`${safeName}.obj`, obj);
  zip.file(`${safeName}.mtl`, mtl);

  // 3. Detailed Blender README
  const readmeContent = `# ${model.title} - Blender 3D Project Package

Generated with **Tetagpt Cosmic 3D Modeler** (tetagpt.co)

---

## 🎨 How to Open in Blender

### Option A: 1-Click Python Auto-Builder (Recommended)
This method automatically creates all meshes, sets up Principled BSDF materials, adds a 3-point studio lighting rig, and positions the camera!

1. Open **Blender** (v3.0 to v4.x+).
2. Click on the **Scripting** tab in the top workspace navigation bar.
3. Click **Open** and select \`import_to_blender.py\` (or click **New** and paste the script).
4. Click the **Run Script** button (triangle icon) or press **Alt + P**.
5. Switch back to the **Layout** tab, press **Z** and choose **Material Preview**.
6. The entire 3D object is built natively in your scene!

---

### Option B: Direct File Import (Wavefront OBJ)
1. In Blender, go to **File > Import > Wavefront (.obj)**.
2. Select \`${safeName}.obj\` from this folder.
3. Click **Import OBJ**.
4. The model will load with its associated material colors from \`${safeName}.mtl\`.

---

## 💾 Saving as Native .blend File
Once imported into Blender, simply press **Ctrl + S** (or **File > Save As**) and save as \`${safeName}.blend\`.

*Created by Tetagpt Cosmic Builder — Autonomous 3D Creation Engine.*
`;
  zip.file('README_BLENDER.md', readmeContent);

  const blob = await zip.generateAsync({ type: 'blob' });
  triggerBrowserDownload(blob, `${safeName}-blender-bundle.zip`, 'application/zip');
};

/**
 * Downloads the Master 3D CAD & Blender Studio Bundle containing ALL formats:
 * AutoCAD DXF, AutoCAD SCR, Blender Python script, OBJ, MTL, and WebGL HTML viewer.
 */
export const downloadMaster3DCadBlenderZip = async (
  model: Model3DData,
  webGlHtmlCode?: string
): Promise<void> => {
  const zip = new JSZip();
  const safeName = (model.title || 'tetagpt-3d-master').toLowerCase().replace(/[^a-z0-9-_]/g, '-');

  // 1. AutoCAD folder
  const acadFolder = zip.folder('autocad');
  if (acadFolder) {
    acadFolder.file(`${safeName}.dxf`, generateAutoCadDxf(model));
    acadFolder.file('setup_autocad_view.scr', generateAutoCadScript(`${safeName}.dxf`));
  }

  // 2. Blender folder
  const blenderFolder = zip.folder('blender');
  if (blenderFolder) {
    blenderFolder.file('import_to_blender.py', generateBlenderPythonScript(model));
    const { obj, mtl } = generateWavefrontObj(model);
    blenderFolder.file(`${safeName}.obj`, obj);
    blenderFolder.file(`${safeName}.mtl`, mtl);
  }

  // 3. WebGL Offline Viewer
  if (webGlHtmlCode) {
    zip.file('webgl_viewer.html', webGlHtmlCode);
  }

  // 4. Master README
  const masterReadme = `# ${model.title} - Universal 3D CAD & Blender Master Studio

Exported from **Tetagpt Cosmic 3D Modeler** (tetagpt.co)

---

## 📂 Included Folders and Files:

1. **\`autocad/\`**
   - \`${safeName}.dxf\`: Native Autodesk AutoCAD Drawing Exchange format. Double-click or open in AutoCAD, Fusion 360, FreeCAD, or any CAD software.
   - \`setup_autocad_view.scr\`: AutoCAD script for instant isometric view and realistic shading.

2. **\`blender/\`**
   - \`import_to_blender.py\`: 1-click Python script to build the complete scene, meshes, materials, camera, and lights in Blender.
   - \`${safeName}.obj\` & \`${safeName}.mtl\`: Universal 3D geometry file for Blender, Maya, Cinema 4D, 3ds Max, Unity, and Unreal.

3. **\`webgl_viewer.html\`**
   - Double-click to view and interact with the 3D model in your browser with 60fps orbit controls!

---
*Created by Tetagpt Cosmic Builder.*
`;
  zip.file('README_MASTER_3D.md', masterReadme);

  const blob = await zip.generateAsync({ type: 'blob' });
  triggerBrowserDownload(blob, `${safeName}-cad-blender-master.zip`, 'application/zip');
};
