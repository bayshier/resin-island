import { useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { JellyState } from '../hooks/useJelly'

/**
 * 果冻组：整个场景以块底为支点做欠阻尼弹簧跟随。
 * 平移 + 倾转叠加，天然实现"顶部晃得比底部多"。
 */
export function JellyGroup({
  jelly,
  tilt,
  children,
}: {
  jelly: JellyState
  tilt: number
  children: ReactNode
}) {
  const ref = useRef<THREE.Group>(null)

  useFrame(() => {
    const g = ref.current
    if (!g) return
    g.position.set(jelly.x, -Math.hypot(jelly.vx, jelly.vz) * 0.1, jelly.z)
    g.rotation.z = -jelly.x * tilt
    g.rotation.x = jelly.z * tilt
  })

  return <group ref={ref}>{children}</group>
}
