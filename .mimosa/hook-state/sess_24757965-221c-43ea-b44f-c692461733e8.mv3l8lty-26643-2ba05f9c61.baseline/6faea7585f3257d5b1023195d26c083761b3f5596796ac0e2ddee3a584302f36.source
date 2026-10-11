import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { buildTerrainGeometry, TIDE0 } from '../lib/terrain'
import { makeSandBumpTexture } from '../lib/textures'

/** 经典多次折射干涉焦散纹样 */
const CAUSTIC_GLSL = /* glsl */ `
float causticPattern(vec2 uv, float t) {
  vec2 p = mod(uv * 6.2831853, 6.2831853) - 250.0;
  vec2 i = p;
  float c = 1.0;
  float inten = 0.005;
  for (int n = 0; n < 3; n++) {
    float tt = t * (1.0 - (3.5 / float(n + 1)));
    i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
  }
  c /= 3.0;
  c = 1.17 - pow(c, 1.4);
  return pow(abs(c), 8.0);
}
`

function createTerrainMaterial(bump: THREE.Texture) {
  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.95,
    metalness: 0,
    bumpMap: bump,
    bumpScale: 0.012,
  })
  const uniforms = {
    uTime: { value: 0 },
    uTideAbs: { value: TIDE0 },
    uCaustics: { value: 0.55 },
  }
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = 'varying vec3 vWPos;\n' + shader.vertexShader
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      /* glsl */ `
      #include <begin_vertex>
      vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
      `,
    )
    shader.fragmentShader =
      'uniform float uTime;\nuniform float uTideAbs;\nuniform float uCaustics;\nvarying vec3 vWPos;\n' +
      CAUSTIC_GLSL +
      shader.fragmentShader
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      /* glsl */ `
      #include <color_fragment>
      {
        float below = smoothstep(uTideAbs + 0.03, uTideAbs - 0.06, vWPos.y);
        if (below > 0.001) {
          float deepFade = mix(1.0, 0.45, smoothstep(uTideAbs - 0.12, uTideAbs - 0.45, vWPos.y));
          float c = causticPattern(vWPos.xz * 2.6, uTime * 0.7);
          diffuseColor.rgb *= 1.0 + uCaustics * c * below * deepFade;
        }
      }
      `,
    )
  }
  mat.customProgramCacheKey = () => 'resin-terrain-v1'
  return { mat, uniforms }
}

/** 海床 + 岛屿一体成形的程序化地形，水下部分带动态焦散光斑 */
export function Terrain({ caustics, tide }: { caustics: number; tide: number }) {
  const geo = useMemo(() => buildTerrainGeometry(230, 150), [])
  const bump = useMemo(() => {
    const t = makeSandBumpTexture(256)
    t.repeat.set(5, 3.2)
    return t
  }, [])
  const { mat, uniforms } = useMemo(() => createTerrainMaterial(bump), [bump])

  useEffect(
    () => () => {
      geo.dispose()
      mat.dispose()
      bump.dispose()
    },
    [geo, mat, bump],
  )

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime
    uniforms.uTideAbs.value = TIDE0 + tide
    uniforms.uCaustics.value = caustics
  })

  return <mesh geometry={geo} material={mat} />
}
