import * as fs from "fs";
import * as path from "path";

// ============================================================
// Kinau 3D Jersey GLB Generator v3 — Anatomical Mesh
// ============================================================
// Uses realistic cross-section profiles instead of circles.
// Cross-section shape: slightly oval, wider front-back than side-to-side,
// with natural shoulder/chest/waist contour.
// ============================================================

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// Shape profile: returns [x_scale, z_scale] for cross-section at normalized
// angle u (0..1 = full revolution) at height ratio y_norm (0=bottom, 1=top)
function getTorsoProfile(u: number, yNorm: number): { x: number; z: number } {
  // Angle in radians (0 = front center, PI = back center)
  const angle = u * Math.PI * 2;

  // Base oval shape: wider in X (side to side), narrower in Z (front-back)
  // A realistic torso is wider front-back: ratio ~1:0.7 for a t-shirt mockup
  const baseX = Math.sin(angle);
  const baseZ = Math.cos(angle) * 0.68;

  // Chest bulge at front (angle near 0 or 2PI)
  const frontFactor = Math.max(0, Math.cos(angle)); // positive at front
  const chestBulge =
    yNorm > 0.55 ? smoothstep(0.55, 0.85, yNorm) * 0.12 * frontFactor : 0;

  // Shoulder width tapers at very top and flares slightly at shoulder height
  let widthMod = 1.0;
  if (yNorm > 0.72) {
    // Upper shoulder: taper toward neck
    widthMod = lerp(1.0, 0.55, smoothstep(0.72, 1.0, yNorm));
  } else if (yNorm > 0.55) {
    // Shoulder flare
    widthMod = lerp(1.0, 1.12, smoothstep(0.55, 0.68, yNorm));
  } else if (yNorm < 0.15) {
    // Hip flare
    widthMod = lerp(1.0, 1.04, smoothstep(0.15, 0.0, yNorm));
  } else if (yNorm < 0.35) {
    // Waist taper
    widthMod = lerp(0.96, 1.0, smoothstep(0.15, 0.35, yNorm));
  }

  return {
    x: (baseX + chestBulge * 0.5) * widthMod,
    z: (baseZ + chestBulge) * widthMod,
  };
}

// Sleeve cross-section: teardrop shape
function getSleeveProfile(
  u: number,
  _taper: number,
): { lx: number; lz: number } {
  const angle = u * Math.PI * 2;
  // Slightly oval: narrower toward elbow
  const lx = Math.cos(angle);
  const lz = Math.sin(angle) * 0.85;
  return { lx, lz };
}

function createJerseyGLB() {
  console.log("🎽 Building Anatomical 3D Jersey GLB v3...");

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // ═══════════════════════════════════════════════
  // 1. TORSO
  // ═══════════════════════════════════════════════
  // Height range: y from -1.35 (bottom hem) to +1.15 (neck opening)
  const TORSO_ROWS = 52;
  const TORSO_COLS = 56;
  const TORSO_HEIGHT = 2.5;
  const TORSO_SCALE = 1.08; // base radius

  for (let r = 0; r <= TORSO_ROWS; r++) {
    const yNorm = 1.0 - r / TORSO_ROWS; // 1.0 = top (neck), 0.0 = bottom (hem)
    const y = lerp(-1.35, 1.15, yNorm);
    const vTexY = 0.5 + yNorm * 0.5; // UV: torso occupies top half [0.5..1.0] vertically

    for (let c = 0; c <= TORSO_COLS; c++) {
      const u = c / TORSO_COLS;
      const profile = getTorsoProfile(u, yNorm);

      const px = profile.x * TORSO_SCALE;
      const py = y;
      const pz = profile.z * TORSO_SCALE;

      positions.push(px, py, pz);

      // Outward normal (approximate)
      const nx = profile.x;
      const nz = profile.z;
      const nLen = Math.sqrt(nx * nx + 0.015 * 0.015 + nz * nz) || 1;
      normals.push(nx / nLen, 0.015 / nLen, nz / nLen);

      // UV: front half [0, 0.5] → u in [0, 0.5], back half → u in [0.5, 1.0]
      // v mapped to top UV half
      uvs.push(u * 0.5, vTexY);
    }
  }

  // Torso faces
  for (let r = 0; r < TORSO_ROWS; r++) {
    for (let c = 0; c < TORSO_COLS; c++) {
      const i0 = r * (TORSO_COLS + 1) + c;
      const i1 = i0 + 1;
      const i2 = (r + 1) * (TORSO_COLS + 1) + c;
      const i3 = i2 + 1;
      indices.push(i0, i2, i1);
      indices.push(i1, i2, i3);
    }
  }

  // ═══════════════════════════════════════════════
  // 2. NECK TUBE (Crew Neck / O-Neck)
  // ═══════════════════════════════════════════════
  const neckStartIdx = positions.length / 3;
  const NECK_ROWS = 10;
  const NECK_COLS = 36;
  const NECK_RADIUS_X = 0.38;
  const NECK_RADIUS_Z = 0.32;

  for (let r = 0; r <= NECK_ROWS; r++) {
    const t = r / NECK_ROWS;
    const y = 1.15 + t * 0.18; // rises slightly from torso top

    for (let c = 0; c <= NECK_COLS; c++) {
      const u = c / NECK_COLS;
      const angle = u * Math.PI * 2;

      const px = Math.sin(angle) * NECK_RADIUS_X;
      const pz = Math.cos(angle) * NECK_RADIUS_Z;

      positions.push(px, y, pz);
      normals.push(Math.sin(angle), 0.2, Math.cos(angle));
      uvs.push(0.5 + u * 0.5, 0.98); // collar mapped to top-right quadrant
    }
  }

  for (let r = 0; r < NECK_ROWS; r++) {
    for (let c = 0; c < NECK_COLS; c++) {
      const i0 = neckStartIdx + r * (NECK_COLS + 1) + c;
      const i1 = i0 + 1;
      const i2 = neckStartIdx + (r + 1) * (NECK_COLS + 1) + c;
      const i3 = i2 + 1;
      indices.push(i0, i2, i1);
      indices.push(i1, i2, i3);
    }
  }

  // ═══════════════════════════════════════════════
  // 3. LEFT SLEEVE (Short sleeve jersey style)
  // ═══════════════════════════════════════════════
  const lSleeveStartIdx = positions.length / 3;
  const SL_ROWS = 20;
  const SL_COLS = 28;
  const SL_RADIUS = 0.42; // shoulder joint radius
  const SL_LENGTH = 0.95; // sleeve length

  // Shoulder attachment point (left side)
  const SL_ATTACH_X = -1.05;
  const SL_ATTACH_Y = 0.82;
  const SL_ATTACH_Z = 0.0;

  // Sleeve axis direction: downward-outward at ~55° from vertical
  const SL_ANGLE = Math.PI / 3.4;
  const SL_AX_COS = Math.cos(SL_ANGLE);
  const SL_AX_SIN = Math.sin(SL_ANGLE);

  for (let r = 0; r <= SL_ROWS; r++) {
    const t = r / SL_ROWS; // 0 = shoulder, 1 = cuff
    const taper = 1.0 - t * 0.28; // taper toward cuff

    for (let c = 0; c <= SL_COLS; c++) {
      const u = c / SL_COLS;
      const { lx, lz } = getSleeveProfile(u, taper);

      // Local sleeve space: x=radius * lx, z=radius * lz, y = along sleeve axis
      const radius = SL_RADIUS * taper;
      const localX = lx * radius;
      const localY = t * SL_LENGTH;
      const localZ = lz * radius;

      // Rotate sleeve axis (downward & outward from body)
      const worldX = SL_ATTACH_X + (localX * 1.0 - localY * SL_AX_SIN);
      const worldY = SL_ATTACH_Y + (localX * 0.0 + localY * -SL_AX_COS);
      const worldZ = SL_ATTACH_Z + localZ;

      positions.push(worldX, worldY, worldZ);

      const nx = lx;
      const nz = lz;
      const nl = Math.sqrt(nx * nx + nz * nz) || 1;
      normals.push((-nx / nl) * SL_AX_COS, SL_AX_SIN, nz / nl);

      // UV: left sleeve → bottom-left quadrant [0..0.5] x [0..0.5]
      uvs.push(u * 0.5, t * 0.5);
    }
  }

  for (let r = 0; r < SL_ROWS; r++) {
    for (let c = 0; c < SL_COLS; c++) {
      const i0 = lSleeveStartIdx + r * (SL_COLS + 1) + c;
      const i1 = i0 + 1;
      const i2 = lSleeveStartIdx + (r + 1) * (SL_COLS + 1) + c;
      const i3 = i2 + 1;
      indices.push(i0, i2, i1);
      indices.push(i1, i2, i3);
    }
  }

  // ═══════════════════════════════════════════════
  // 4. RIGHT SLEEVE (mirrored)
  // ═══════════════════════════════════════════════
  const rSleeveStartIdx = positions.length / 3;
  const RS_ATTACH_X = +1.05;

  for (let r = 0; r <= SL_ROWS; r++) {
    const t = r / SL_ROWS;
    const taper = 1.0 - t * 0.28;

    for (let c = 0; c <= SL_COLS; c++) {
      const u = c / SL_COLS;
      const { lx, lz } = getSleeveProfile(u, taper);

      const radius = SL_RADIUS * taper;
      const localX = lx * radius;
      const localY = t * SL_LENGTH;
      const localZ = lz * radius;

      // Mirror X direction
      const worldX = RS_ATTACH_X + (-localX * 1.0 + localY * SL_AX_SIN);
      const worldY = SL_ATTACH_Y + (localX * 0.0 + localY * -SL_AX_COS);
      const worldZ = SL_ATTACH_Z + localZ;

      positions.push(worldX, worldY, worldZ);

      const nx = -lx;
      const nz = lz;
      const nl = Math.sqrt(nx * nx + nz * nz) || 1;
      normals.push((nx / nl) * SL_AX_COS, SL_AX_SIN, nz / nl);

      // UV: right sleeve → bottom-right quadrant [0.5..1.0] x [0..0.5]
      uvs.push(0.5 + u * 0.5, t * 0.5);
    }
  }

  for (let r = 0; r < SL_ROWS; r++) {
    for (let c = 0; c < SL_COLS; c++) {
      const i0 = rSleeveStartIdx + r * (SL_COLS + 1) + c;
      const i1 = i0 + 1;
      const i2 = rSleeveStartIdx + (r + 1) * (SL_COLS + 1) + c;
      const i3 = i2 + 1;
      indices.push(i0, i2, i1);
      indices.push(i1, i2, i3);
    }
  }

  // ═══════════════════════════════════════════════
  // GLB Binary Packing
  // ═══════════════════════════════════════════════
  const posBuffer = Buffer.from(new Float32Array(positions).buffer);
  const normBuffer = Buffer.from(new Float32Array(normals).buffer);
  const uvBuffer = Buffer.from(new Float32Array(uvs).buffer);
  const idxBuffer = Buffer.from(new Uint32Array(indices).buffer);

  // GLB spec: JSON chunk padded with spaces (0x20), BIN chunk padded with zeros (0x00)
  const padBufferBin = (buf: Buffer) => {
    const pad = (4 - (buf.length % 4)) % 4;
    return pad > 0 ? Buffer.concat([buf, Buffer.alloc(pad, 0x00)]) : buf;
  };
  const padBufferJson = (buf: Buffer) => {
    const pad = (4 - (buf.length % 4)) % 4;
    return pad > 0 ? Buffer.concat([buf, Buffer.alloc(pad, 0x20)]) : buf;
  };

  const pBuf = padBufferBin(posBuffer);
  const nBuf = padBufferBin(normBuffer);
  const uBuf = padBufferBin(uvBuffer);
  const iBuf = padBufferBin(idxBuffer);

  const totalBinBuffer = Buffer.concat([pBuf, nBuf, uBuf, iBuf]);

  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity,
    maxZ = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    minX = Math.min(minX, positions[i]);
    minY = Math.min(minY, positions[i + 1]);
    minZ = Math.min(minZ, positions[i + 2]);
    maxX = Math.max(maxX, positions[i]);
    maxY = Math.max(maxY, positions[i + 1]);
    maxZ = Math.max(maxZ, positions[i + 2]);
  }

  const gltf = {
    asset: { version: "2.0", generator: "Kinau Anatomical Jersey Engine v3" },
    scene: 0,
    scenes: [{ name: "Scene", nodes: [0] }],
    nodes: [{ name: "Jersey_Anatomical", mesh: 0 }],
    materials: [
      {
        name: "JerseyMaterial",
        pbrMetallicRoughness: {
          baseColorFactor: [1, 1, 1, 1],
          roughnessFactor: 0.75,
          metallicFactor: 0.0,
        },
        doubleSided: true,
      },
    ],
    meshes: [
      {
        name: "Jersey_Mesh",
        primitives: [
          {
            attributes: { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 },
            indices: 3,
            material: 0,
            mode: 4,
          },
        ],
      },
    ],
    accessors: [
      {
        bufferView: 0,
        byteOffset: 0,
        componentType: 5126,
        count: positions.length / 3,
        type: "VEC3",
        max: [maxX, maxY, maxZ],
        min: [minX, minY, minZ],
      },
      {
        bufferView: 1,
        byteOffset: 0,
        componentType: 5126,
        count: normals.length / 3,
        type: "VEC3",
      },
      {
        bufferView: 2,
        byteOffset: 0,
        componentType: 5126,
        count: uvs.length / 2,
        type: "VEC2",
      },
      {
        bufferView: 3,
        byteOffset: 0,
        componentType: 5125,
        count: indices.length,
        type: "SCALAR",
      },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: posBuffer.length, target: 34962 },
      {
        buffer: 0,
        byteOffset: pBuf.length,
        byteLength: normBuffer.length,
        target: 34962,
      },
      {
        buffer: 0,
        byteOffset: pBuf.length + nBuf.length,
        byteLength: uvBuffer.length,
        target: 34962,
      },
      {
        buffer: 0,
        byteOffset: pBuf.length + nBuf.length + uBuf.length,
        byteLength: idxBuffer.length,
        target: 34963,
      },
    ],
    buffers: [{ byteLength: totalBinBuffer.length }],
  };

  const jsonText = JSON.stringify(gltf);
  const jsonBuffer = padBufferJson(Buffer.from(jsonText, "utf8"));

  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  const totalLength = 12 + 8 + jsonBuffer.length + 8 + totalBinBuffer.length;
  header.writeUInt32LE(totalLength, 8);

  const jsonChunkHeader = Buffer.alloc(8);
  jsonChunkHeader.writeUInt32LE(jsonBuffer.length, 0);
  jsonChunkHeader.writeUInt32LE(0x4e4f534a, 4);

  const binChunkHeader = Buffer.alloc(8);
  binChunkHeader.writeUInt32LE(totalBinBuffer.length, 0);
  binChunkHeader.writeUInt32LE(0x004e4942, 4);

  const glbFile = Buffer.concat([
    header,
    jsonChunkHeader,
    jsonBuffer,
    binChunkHeader,
    totalBinBuffer,
  ]);

  const outputDir = path.resolve(process.cwd(), "public/models");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, "tshirt.glb");
  fs.writeFileSync(outputPath, glbFile);

  const vtxCount = positions.length / 3;
  const triCount = indices.length / 3;
  console.log(`✅ Created anatomical 3D Jersey GLB: ${outputPath}`);
  console.log(
    `   Size: ${(glbFile.length / 1024).toFixed(1)} KB | Vertices: ${vtxCount.toLocaleString()} | Triangles: ${triCount.toLocaleString()}`,
  );
}

createJerseyGLB();
