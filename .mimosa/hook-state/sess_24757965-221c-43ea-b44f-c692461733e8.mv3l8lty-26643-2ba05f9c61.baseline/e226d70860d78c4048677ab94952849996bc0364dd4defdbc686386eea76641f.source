import { useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { WaterSimulator } from '../lib/waterSim'

/** 水面高度场模拟的 React 封装：负责生命周期与资源释放 */
export function useWaterSimulation(resolution: number): WaterSimulator {
  const gl = useThree((s) => s.gl)
  const sim = useMemo(() => new WaterSimulator(gl, resolution), [gl, resolution])
  useEffect(() => () => sim.dispose(), [sim])
  return sim
}
