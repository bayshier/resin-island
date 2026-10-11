import { RoundedBox, MeshTransmissionMaterial } from '@react-three/drei'
import { BLOCK } from '../lib/terrain'
import { TIERS } from '../state/quality'

/** 圆角透明树脂块：块体本身即海水 */
export function ResinBlock({ tier, attenuationColor }: { tier: number; attenuationColor: string }) {
  const t = TIERS[tier].transmission
  return (
    <RoundedBox
      args={[BLOCK.w, BLOCK.h, BLOCK.d]}
      radius={BLOCK.radius}
      smoothness={4}
      position={[0, BLOCK.h / 2, 0]}
    >
      <MeshTransmissionMaterial
        transmission={1}
        thickness={0.35}
        roughness={0.05}
        ior={1.33}
        chromaticAberration={tier === 0 ? 0.035 : 0}
        anisotropicBlur={0.1}
        samples={t.samples}
        resolution={t.resolution}
        backside={t.backside}
        backsideResolution={t.backside ? 256 : 0}
        color="#f8fffd"
        attenuationColor={attenuationColor}
        attenuationDistance={1.3}
        clearcoat={0.5}
        clearcoatRoughness={0.2}
      />
    </RoundedBox>
  )
}
