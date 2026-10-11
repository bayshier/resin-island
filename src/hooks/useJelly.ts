import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

/** 果冻弹簧的共享状态（位置 + 速度），场景组件按各自系数取用 */
export interface JellyState {
  x: number
  z: number
  vx: number
  vz: number
}

export interface JellyParams {
  stiffness: number
  damping: number
  amplitude: number
  tilt: number
}

/**
 * 欠阻尼弹簧跟随指针；点击注入冲量。帧率无关的积分与阻尼。
 * tilt 旋转在 JellyGroup 里以块底为支点应用，天然"顶部比底部晃得多"。
 */
export function useJelly(params: JellyParams) {
  const state = useRef<JellyState>({ x: 0, z: 0, vx: 0, vz: 0 }).current
  const paramsRef = useRef(params)
  paramsRef.current = params

  useFrame((st, delta) => {
    const dt = Math.min(delta, 1 / 30)
    const { stiffness, damping, amplitude } = paramsRef.current
    const tx = st.pointer.x * amplitude
    const tz = st.pointer.y * amplitude
    state.vx += (tx - state.x) * stiffness * dt
    state.vz += (tz - state.z) * stiffness * dt
    const dampF = Math.pow(damping, dt * 60)
    state.vx *= dampF
    state.vz *= dampF
    state.x += state.vx * dt
    state.z += state.vz * dt
  })

  const kick = (fx: number, fz: number) => {
    state.vx += fx
    state.vz += fz
  }

  return { state, kick }
}
