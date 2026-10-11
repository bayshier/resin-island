import * as THREE from 'three'

/** 程序化沙粒凹凸贴图（多层值噪声灰度图） */
export function makeSandBumpTexture(size = 256): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(size, size)

  // 可平铺值噪声：晶格随机 + 双线性插值，多倍频叠加
  const grids = [8, 24, 64].map((n) => {
    const g = new Float32Array(n * n)
    let s = n * 7919
    const rnd = () => {
      s = (s * 16807) % 2147483647
      return s / 2147483647
    }
    for (let i = 0; i < g.length; i++) g[i] = rnd()
    return { n, g }
  })

  const sample = (n: number, g: Float32Array, x: number, y: number) => {
    const fx = x * n
    const fy = y * n
    const x0 = Math.floor(fx)
    const y0 = Math.floor(fy)
    const tx = fx - x0
    const ty = fy - y0
    const gx0 = ((x0 % n) + n) % n
    const gy0 = ((y0 % n) + n) % n
    const gx1 = (gx0 + 1) % n
    const gy1 = (gy0 + 1) % n
    const a = g[gy0 * n + gx0]
    const b = g[gy0 * n + gx1]
    const c = g[gy1 * n + gx0]
    const d = g[gy1 * n + gx1]
    const sx = tx * tx * (3 - 2 * tx)
    const sy = ty * ty * (3 - 2 * ty)
    return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy
  }

  let p = 0
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size
      const v = y / size
      const n =
        sample(8, grids[0].g, u, v) * 0.5 +
        sample(24, grids[1].g, u, v) * 0.32 +
        sample(64, grids[2].g, u, v) * 0.18
      const g = Math.round(n * 255)
      img.data[p++] = g
      img.data[p++] = g
      img.data[p++] = g
      img.data[p++] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  return tex
}
