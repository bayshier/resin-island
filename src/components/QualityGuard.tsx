import { useFrame } from '@react-three/fiber'
import { getTier, setTier } from '../state/quality'
import { useRef } from 'react'

/** 帧率守卫：每 2.5s 统计平均帧率，低于 33fps 就降一档（只降不升，避免震荡） */
export function QualityGuard() {
  const acc = useRef({ t: 0, n: 0 })

  useFrame((_, delta) => {
    const a = acc.current
    a.t += delta
    a.n++
    if (a.t >= 2.5) {
      const fps = a.n / a.t
      if (fps < 33) setTier(getTier() + 1)
      a.t = 0
      a.n = 0
    }
  })

  return null
}
