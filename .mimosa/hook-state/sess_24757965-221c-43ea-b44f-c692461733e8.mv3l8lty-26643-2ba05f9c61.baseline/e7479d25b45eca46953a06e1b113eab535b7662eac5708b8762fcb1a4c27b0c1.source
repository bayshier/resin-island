import { useSyncExternalStore } from 'react'

/**
 * 质量分档（0 高 / 1 中 / 2 低）。帧率守卫在 Canvas 内监测，
 * 通过这个微型外部 store 通知 Canvas 外的 dpr 绑定。
 */

export interface TierConfig {
  dpr: number
  sim: number
  waterSeg: [number, number]
  transmission: { resolution: number; samples: number; backside: boolean }
  dof: boolean
  bloom: boolean
  msaa: number
  contactRes: number
}

export const TIERS: TierConfig[] = [
  {
    dpr: 2,
    sim: 256,
    waterSeg: [224, 144],
    transmission: { resolution: 512, samples: 8, backside: true },
    dof: true,
    bloom: true,
    msaa: 4,
    contactRes: 512,
  },
  {
    dpr: 1.5,
    sim: 192,
    waterSeg: [176, 112],
    transmission: { resolution: 384, samples: 6, backside: false },
    dof: true,
    bloom: true,
    msaa: 2,
    contactRes: 384,
  },
  {
    dpr: 1,
    sim: 128,
    waterSeg: [128, 80],
    transmission: { resolution: 256, samples: 4, backside: false },
    dof: false,
    bloom: false,
    msaa: 0,
    contactRes: 256,
  },
]

function initialTier(): number {
  if (typeof window === 'undefined') return 0
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const small = Math.min(window.innerWidth, window.innerHeight) < 720
  const weakCpu = (navigator.hardwareConcurrency ?? 8) <= 4
  return coarse || small || weakCpu ? 1 : 0
}

let tier = initialTier()
const listeners = new Set<() => void>()

export function getTier(): number {
  return tier
}

export function setTier(next: number): void {
  const t = Math.max(0, Math.min(TIERS.length - 1, next))
  if (t === tier) return
  tier = t
  listeners.forEach((l) => l())
}

export function useTier(): number {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    getTier,
    getTier,
  )
}
