import * as THREE from 'three'
import { clamp01, fbm2, lerp, ridge2, smoothstep } from './noise'

/** 树脂块尺寸（世界单位），y 从 0（块底）到 h（块顶） */
export const BLOCK = { w: 3.4, d: 2.15, h: 1.0, radius: 0.14, wall: 0.1 }
/** 块内水域范围 */
export const INNER = { w: BLOCK.w - BLOCK.wall * 2, d: BLOCK.d - BLOCK.wall * 2 }

/** 潮位为 0 时的水面世界高度（贴近块口，悬崖穿出顶面） */
export const TIDE0 = 0.98
/** 地形高度编码范围（烘焙进数据纹理的 A 通道） */
export const H_MIN = 0.1
export const H_MAX = 1.5

const SEABED = 0.16
/** 岛屿中心（放在块内一角） */
export const ISLAND = { x: -0.82, z: -0.34 }
/** 沙滩朝向：指向块中心，这一侧山体坡度放缓形成月牙形沙滩 */
const BEACH_DIR = (() => {
  const l = Math.hypot(-ISLAND.x, -ISLAND.z)
  return { x: -ISLAND.x / l, z: -ISLAND.z / l }
})()

/**
 * 程序化地形高度（绝对世界高度）：
 * 海床 + 一角岛屿。岛屿背侧陡峭悬崖，朝块中心一侧坡度放缓成沙滩。
 */
export function terrainHeight(x: number, z: number): number {
  let h = SEABED + fbm2(x * 2.3 + 9.7, z * 2.3 - 5.1, 3) * 0.045

  const dx = x - ISLAND.x
  const dz = z - ISLAND.z
  const along = dx * BEACH_DIR.x + dz * BEACH_DIR.z // >0 朝沙滩方向
  const perp = -dx * BEACH_DIR.z + dz * BEACH_DIR.x

  // 海岸线形状：沙滩侧衰减半径大 1 倍以上，其余侧是陡崖；低频噪声让轮廓不规则
  const coastWobble = fbm2(x * 2.0 + 40, z * 2.0 + 40, 2)
  const R = 0.66 * (1 + 1.35 * smoothstep(-0.15, 0.9, along)) * (1 + 0.22 * coastWobble)
  const r = Math.hypot(perp * 1.12, along + (along < 0 ? along * 0.3 : 0))
  const mask = smoothstep(R, R * 0.1, r)
  if (mask <= 0.001) return h

  const ridge = ridge2(x * 3.2 - 11, z * 3.2 + 7, 4)
  const detail = fbm2(x * 7.5 + 3, z * 7.5 - 2, 4)
  const cliffTop = 1.32 + ridge * 0.16

  h = h + (cliffTop - h) * mask
  h += mask * detail * 0.075
  // 崖壁水平层理
  h -= mask * 0.012 * (0.5 + 0.5 * Math.sin(h * 46 + ridge * 6)) * smoothstep(0.35, 0.8, mask)
  return h
}

/** 坡度（|∇h|），中心差分 */
export function terrainSlope(x: number, z: number): number {
  const e = 0.02
  const gx = (terrainHeight(x + e, z) - terrainHeight(x - e, z)) / (2 * e)
  const gz = (terrainHeight(x, z + e) - terrainHeight(x, z - e)) / (2 * e)
  return Math.hypot(gx, gz)
}

const COL = {
  sandDry: [0.84, 0.73, 0.54] as const,
  sandWet: [0.6, 0.5, 0.36] as const,
  sandDeep: [0.4, 0.41, 0.33] as const,
  grassA: [0.32, 0.48, 0.2] as const,
  grassB: [0.52, 0.58, 0.24] as const,
  rockA: [0.42, 0.38, 0.32] as const,
  rockB: [0.28, 0.26, 0.22] as const,
}

function mix3(a: readonly number[], b: readonly number[], t: number, out: number[]): void {
  out[0] = lerp(a[0], b[0], t)
  out[1] = lerp(a[1], b[1], t)
  out[2] = lerp(a[2], b[2], t)
}

/** 按高度与坡度分层着色：深海沙 → 湿沙 → 干沙 → 草甸 → 岩崖 */
export function terrainColor(h: number, slope: number, x: number, z: number, out: number[]): void {
  const n = fbm2(x * 11 + 5, z * 11 - 3, 2) * 0.5 + 0.5
  const w = TIDE0

  mix3(COL.sandWet, COL.sandDry, smoothstep(w - 0.06, w + 0.12, h), out)
  mix3(out, COL.sandDeep, smoothstep(w - 0.12, SEABED + 0.02, h), out)

  // 草甸：水面之上、缓坡、崖顶之下
  const grassZone =
    smoothstep(w + 0.12, w + 0.24, h) * (1 - smoothstep(0.55, 0.9, slope)) * (1 - smoothstep(1.26, 1.38, h))
  const grass = [0, 0, 0]
  mix3(COL.grassA, COL.grassB, n, grass)
  mix3(out, grass, grassZone, out)

  // 岩崖：陡坡或崖顶
  const rockZone = Math.min(smoothstep(0.5, 0.9, slope) + smoothstep(1.16, 1.32, h) * 0.7, 1)
  const strata = 0.5 + 0.5 * Math.sin(h * 34 + n * 4)
  const rock = [0, 0, 0]
  mix3(COL.rockA, COL.rockB, strata * 0.7 + 0.15 * n, rock)
  mix3(out, rock, rockZone, out)

  const speck = 0.92 + 0.16 * n
  out[0] = clamp01(out[0] * speck)
  out[1] = clamp01(out[1] * speck)
  out[2] = clamp01(out[2] * speck)

  // 水下部分烘焙进水体吸收色调：越深越暗、越偏青绿
  const uw = smoothstep(w + 0.02, w - 0.3, h)
  if (uw > 0.001) {
    const tinted = [out[0] * 0.42, out[1] * 0.72, out[2] * 0.68]
    mix3(out, tinted, uw * 0.85, out)
  }
}

/**
 * 烘焙地形数据纹理：RGB = 反照率，A = 归一化高度。
 * 供水面着色器查询水深 / 岸线 / 假折射底色，映射与水面网格 uv 一致：
 * u → x = (u - 0.5) * INNER.w，v → z = (0.5 - v) * INNER.d
 */
export function buildTerrainTexture(resX = 256, resZ = 168): THREE.DataTexture {
  const data = new Uint8Array(resX * resZ * 4)
  const col = [0, 0, 0]
  let p = 0
  for (let j = 0; j < resZ; j++) {
    const v = (j + 0.5) / resZ
    const z = (0.5 - v) * INNER.d
    for (let i = 0; i < resX; i++) {
      const u = (i + 0.5) / resX
      const x = (u - 0.5) * INNER.w
      const h = terrainHeight(x, z)
      terrainColor(h, terrainSlope(x, z), x, z, col)
      data[p++] = Math.round(clamp01(col[0]) * 255)
      data[p++] = Math.round(clamp01(col[1]) * 255)
      data[p++] = Math.round(clamp01(col[2]) * 255)
      data[p++] = Math.round(clamp01((h - H_MIN) / (H_MAX - H_MIN)) * 255)
    }
  }
  const tex = new THREE.DataTexture(data, resX, resZ, THREE.RGBAFormat, THREE.UnsignedByteType)
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.wrapS = THREE.ClampToEdgeWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.needsUpdate = true
  return tex
}

/** 地形网格：整块水域的海床 + 岛屿一体成形，顶点色分层 */
export function buildTerrainGeometry(segX = 230, segZ = 150): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(INNER.w - 0.04, INNER.d - 0.04, segX, segZ)
  geo.rotateX(-Math.PI / 2)
  const pos = geo.attributes.position as THREE.BufferAttribute
  const colors = new Float32Array(pos.count * 3)
  const col = [0, 0, 0]
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    const h = terrainHeight(x, z)
    pos.setY(i, h)
    terrainColor(h, terrainSlope(x, z), x, z, col)
    colors[i * 3] = col[0]
    colors[i * 3 + 1] = col[1]
    colors[i * 3 + 2] = col[2]
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.computeVertexNormals()
  return geo
}

export interface ScatterPoint {
  x: number
  z: number
  h: number
  slope: number
}

/** 拒绝采样在块内撒点 */
export function scatterOnTerrain(
  count: number,
  seed: number,
  accept: (h: number, slope: number, x: number, z: number) => boolean,
  maxTries = 800,
): ScatterPoint[] {
  const rng = mulberry(seed)
  const pts: ScatterPoint[] = []
  let tries = 0
  while (pts.length < count && tries < maxTries) {
    tries++
    const x = (rng() - 0.5) * (INNER.w - 0.12)
    const z = (rng() - 0.5) * (INNER.d - 0.12)
    const h = terrainHeight(x, z)
    const slope = terrainSlope(x, z)
    if (accept(h, slope, x, z)) pts.push({ x, z, h, slope })
  }
  return pts
}

function mulberry(seed: number): () => number {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
