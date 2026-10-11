import { useMemo } from 'react'
import * as THREE from 'three'
import { EffectComposer, DepthOfField, Bloom, Vignette, SMAA } from '@react-three/postprocessing'
import { TIERS } from '../state/quality'

export interface LookParams {
  background: string
  bokehScale: number
  focalLength: number
  bloom: number
  vignette: number
}

/** 产品摄影式后期：SMAA + 景深（微缩感）+ 轻泛光 + 暗角 */
export function Effects({ tier, look }: { tier: number; look: LookParams }) {
  const t = TIERS[tier]
  const focusTarget = useMemo(() => new THREE.Vector3(0, 0.6, 0), [])

  return (
    <EffectComposer key={tier} multisampling={t.msaa}>
      <SMAA />
      {t.dof ? (
        <DepthOfField target={focusTarget} focalLength={look.focalLength} bokehScale={look.bokehScale} />
      ) : (
        <></>
      )}
      {t.bloom ? (
        <Bloom mipmapBlur intensity={look.bloom} luminanceThreshold={0.75} luminanceSmoothing={0.12} />
      ) : (
        <></>
      )}
      <Vignette offset={0.22} darkness={look.vignette * 0.85} />
    </EffectComposer>
  )
}
