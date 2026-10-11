/**
 * 种子化 2D simplex 噪声 + fbm / ridged 分形，供地形程序化生成使用。
 */

export function mulberry32(seed: number): () => number {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const F2 = 0.5 * (Math.sqrt(3) - 1)
const G2 = (3 - Math.sqrt(3)) / 6
const GRAD = [
  [1, 1], [-1, 1], [1, -1], [-1, -1],
  [1, 0], [-1, 0], [0, 1], [0, -1],
] as const

const perm = new Uint8Array(512)

export function reseedNoise(seed: number): void {
  const rng = mulberry32(seed)
  const p = new Uint8Array(256)
  for (let i = 0; i < 256; i++) p[i] = i
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const t = p[i]
    p[i] = p[j]
    p[j] = t
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255]
}

reseedNoise(20261011)

/** simplex 噪声，输出约 [-1, 1] */
export function noise2(xin: number, yin: number): number {
  const s = (xin + yin) * F2
  const i = Math.floor(xin + s)
  const j = Math.floor(yin + s)
  const t = (i + j) * G2
  const x0 = xin - (i - t)
  const y0 = yin - (j - t)

  const i1 = x0 > y0 ? 1 : 0
  const j1 = x0 > y0 ? 0 : 1

  const x1 = x0 - i1 + G2
  const y1 = y0 - j1 + G2
  const x2 = x0 - 1 + 2 * G2
  const y2 = y0 - 1 + 2 * G2

  const ii = i & 255
  const jj = j & 255

  let n = 0

  let t0 = 0.5 - x0 * x0 - y0 * y0
  if (t0 > 0) {
    const g = GRAD[perm[ii + perm[jj]] & 7]
    t0 *= t0
    n += t0 * t0 * (g[0] * x0 + g[1] * y0)
  }
  let t1 = 0.5 - x1 * x1 - y1 * y1
  if (t1 > 0) {
    const g = GRAD[perm[ii + i1 + perm[jj + j1]] & 7]
    t1 *= t1
    n += t1 * t1 * (g[0] * x1 + g[1] * y1)
  }
  let t2 = 0.5 - x2 * x2 - y2 * y2
  if (t2 > 0) {
    const g = GRAD[perm[ii + 1 + perm[jj + 1]] & 7]
    t2 *= t2
    n += t2 * t2 * (g[0] * x2 + g[1] * y2)
  }
  return 70 * n
}

/** 分形布朗运动，约 [-1, 1] */
export function fbm2(x: number, y: number, octaves = 4, lacunarity = 2, gain = 0.5): number {
  let sum = 0
  let amp = 0.5
  let norm = 0
  for (let o = 0; o < octaves; o++) {
    sum += noise2(x, y) * amp
    norm += amp
    amp *= gain
    x *= lacunarity
    y *= lacunarity
  }
  return sum / norm
}

/** ridged 噪声，约 [0, 1]，山脊感 */
export function ridge2(x: number, y: number, octaves = 4): number {
  let sum = 0
  let amp = 0.5
  let norm = 0
  let prev = 1
  for (let o = 0; o < octaves; o++) {
    let n = 1 - Math.abs(noise2(x, y))
    n *= n
    n *= prev
    prev = n
    sum += n * amp
    norm += amp
    amp *= 0.5
    x *= 2
    y *= 2
  }
  return sum / norm
}

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

export function smoothstep(a: number, b: number, x: number): number {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
