import { Component, Suspense, useEffect, useMemo, type ReactNode } from 'react'
import { Environment, ContactShadows } from '@react-three/drei'
import { BLOCK, buildTerrainTexture } from '../lib/terrain'
import { useJelly } from '../hooks/useJelly'
import { useWaterSimulation } from '../hooks/useWaterSimulation'
import { TIERS } from '../state/quality'
import type { Params } from '../state/params'
import { QualityGuard } from '../components/QualityGuard'
import { JellyGroup } from './JellyGroup'
import { ResinBlock } from './ResinBlock'
import { Terrain } from './Terrain'
import { WaterSurface } from './WaterSurface'
import { Rocks } from './Rocks'
import { Vegetation } from './Vegetation'

/** Environment 预设需在线拉取 HDR，失败时静默降级为纯灯光照明 */
class EnvBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed) return null
    return <Suspense fallback={null}>{this.props.children}</Suspense>
  }
}

/** 场景总装：灯光 + 果冻组（块体/地形/水面/岩石/植被）+ 接触阴影 */
export function Experience({ params, tier }: { params: Params; tier: number }) {
  const heightTex = useMemo(() => buildTerrainTexture(256, 168), [])
  useEffect(() => () => heightTex.dispose(), [heightTex])

  const jelly = useJelly(params.jelly)
  const sim = useWaterSimulation(TIERS[tier].sim)

  const sun = useMemo(() => {
    const { sunAzimuth: az, sunElevation: el } = params.light
    const r = 5.5
    return [
      Math.sin(az) * r * Math.cos(el),
      Math.sin(el) * r,
      Math.cos(az) * r * Math.cos(el),
    ] as [number, number, number]
  }, [params.light.sunAzimuth, params.light.sunElevation])

  return (
    <>
      <EnvBoundary>
        <Environment preset="studio" environmentIntensity={0.45} />
      </EnvBoundary>
      <directionalLight position={sun} intensity={params.light.sunIntensity} color="#fff3e0" />
      <ambientLight intensity={0.1} color="#eef4ff" />
      <QualityGuard />

      <JellyGroup jelly={jelly.state} tilt={params.jelly.tilt}>
        <ResinBlock tier={tier} attenuationColor={params.water.deepColor} />
        <Terrain caustics={params.light.caustics} tide={params.water.tide} />
        <WaterSurface sim={sim} heightTex={heightTex} tier={tier} water={params.water} jelly={jelly} />
        <Rocks />
        <Vegetation />
      </JellyGroup>

      <ContactShadows
        position={[0, -0.16, 0]}
        scale={11}
        blur={2.6}
        far={1.8}
        opacity={0.55}
        resolution={TIERS[tier].contactRes}
        color="#8a7a63"
      />
    </>
  )
}
