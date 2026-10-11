import { Suspense } from 'react'
import * as THREE from 'three'
import { Canvas, useThree } from '@react-three/fiber'
import { Loader } from '@react-three/drei'
import { useParams } from './state/params'
import { TIERS, useTier } from './state/quality'
import { Experience } from './scene/Experience'
import { Effects } from './scene/Effects'

const CAM_DIR = new THREE.Vector3(5.0, 5.3, 8.2).normalize()
const CAM_LOOK = new THREE.Vector3(0, 0.5, 0)
const BASE_DIST = 11.0

/** 按纵横比拉远相机，保证竖屏手机也能看到完整块体 */
function CameraFit() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const aspect = size.width / Math.max(size.height, 1)
  const hFov = 2 * Math.atan(Math.tan((camera.fov * Math.PI) / 360) * aspect)
  const dist = Math.max(BASE_DIST, 2.55 / Math.tan(hFov / 2))
  camera.position.copy(CAM_DIR).multiplyScalar(dist)
  camera.lookAt(CAM_LOOK)
  return null
}

export default function App() {
  const params = useParams()
  const tier = useTier()

  return (
    <div className="app-root">
      <Canvas
        dpr={TIERS[tier].dpr}
        camera={{ fov: 21, position: [5.0, 5.3, 8.2], near: 0.4, far: 40 }}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
        }}
        onCreated={({ camera }) => camera.lookAt(0, 0.5, 0)}
      >
        <CameraFit />
        <color attach="background" args={[params.look.background]} />
        <Suspense fallback={null}>
          <Experience params={params} tier={tier} />
          <Effects tier={tier} look={params.look} />
        </Suspense>
      </Canvas>
      <Loader />
      <div className="hint">移动鼠标搅动海水 · 点击激起浪花 · 右上面板可调参</div>
    </div>
  )
}
