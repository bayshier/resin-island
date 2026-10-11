import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { ThreeEvent, useFrame } from '@react-three/fiber'
import { H_MAX, H_MIN, INNER, TIDE0 } from '../lib/terrain'
import type { WaterSimulator } from '../lib/waterSim'
import type { JellyState } from '../hooks/useJelly'

export interface WaterParams {
  shallowColor: string
  deepColor: string
  waveHeight: number
  rippleStrength: number
  foamWidth: number
  tide: number
}

/** 顶点/片元共用的 uniforms、varyings 与辅助函数 */
const COMMON_GLSL = /* glsl */ `
uniform sampler2D uSim;
uniform sampler2D uHeightTex;
uniform vec2 uSimTexel;
uniform vec2 uHeightRange;
uniform float uTideAbs;
uniform float uTime;
uniform float uWaveHeight;
uniform float uFoamWidth;
uniform vec3 uColorShallow;
uniform vec3 uColorDeep;
uniform float uDebug;
uniform vec2 uJelly;
uniform vec2 uSize;
varying vec2 vWUv;
varying float vSimG;

float waterTerrainH(vec2 uv) {
  return uHeightRange.x + texture2D(uHeightTex, uv).a * uHeightRange.y;
}

// 模拟纹理 + 三层环境涌浪，返回高度、uv 空间梯度与模拟坡度；近岸衰减
void waveField(vec2 uv, float depth, out float h, out vec2 g, out float simGrad) {
  float damp = mix(0.25, 1.0, smoothstep(0.0, 0.14, depth));
  float s0 = texture2D(uSim, uv).r;
  float sx =
    texture2D(uSim, uv + vec2(uSimTexel.x, 0.0)).r -
    texture2D(uSim, uv - vec2(uSimTexel.x, 0.0)).r;
  float sy =
    texture2D(uSim, uv + vec2(0.0, uSimTexel.y)).r -
    texture2D(uSim, uv - vec2(0.0, uSimTexel.y)).r;
  h = s0 * damp;
  g = vec2(sx, sy) * damp / (2.0 * uSimTexel);
  simGrad = length(g);

  vec2 d1 = normalize(vec2(0.8, 0.6));
  vec2 d2 = normalize(vec2(-0.6, 0.8));
  vec2 d3 = normalize(vec2(0.95, -0.3));
  float p1 = dot(uv, d1) * 12.0 + uTime * 1.15;
  float p2 = dot(uv, d2) * 21.0 + uTime * 1.8;
  float p3 = dot(uv, d3) * 33.0 + uTime * 2.4;
  float a1 = 0.02;
  float a2 = 0.011;
  float a3 = 0.005;
  h += (a1 * sin(p1) + a2 * sin(p2) + a3 * sin(p3)) * damp;
  g += (a1 * cos(p1) * 12.0 * d1 + a2 * cos(p2) * 21.0 * d2 + a3 * cos(p3) * 33.0 * d3) * damp;

  h *= uWaveHeight;
  g *= uWaveHeight;
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x),
    mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}
`

function createWaterMaterial(heightTex: THREE.Texture) {
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.42,
    metalness: 0,
    envMapIntensity: 0.5,
    specularIntensity: 0.18,
    side: THREE.DoubleSide,
  })
  const uniforms = {
    uSim: { value: null as THREE.Texture | null },
    uSimTexel: { value: new THREE.Vector2(1 / 256, 1 / 256) },
    uHeightTex: { value: heightTex },
    uHeightRange: { value: new THREE.Vector2(H_MIN, H_MAX - H_MIN) },
    uTideAbs: { value: TIDE0 },
    uTime: { value: 0 },
    uWaveHeight: { value: 1 },
    uFoamWidth: { value: 0.05 },
    uColorShallow: { value: new THREE.Color('#8cecd6') },
    uColorDeep: { value: new THREE.Color('#0f95a0') },
    uDebug: { value: 0 },
    uJelly: { value: new THREE.Vector2() },
    uSize: { value: new THREE.Vector2(INNER.w, INNER.d) },
  }

  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)

    shader.vertexShader =
      COMMON_GLSL +
      'float g_h = 0.0;\nvec2 g_g = vec2(0.0);\nfloat g_depth = 0.0;\n' +
      shader.vertexShader
    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      /* glsl */ `
      #include <beginnormal_vertex>
      vWUv = uv;
      {
        g_depth = max(uTideAbs - waterTerrainH(uv), 0.0);
        float gh;
        vec2 gg;
        waveField(uv, g_depth, gh, gg, vSimG);
        g_h = gh;
        g_g = gg;
        float sx = g_g.x / uSize.x;
        float sy = g_g.y / uSize.y;
        objectNormal = normalize(vec3(-sx, -sy, 1.0));
      }
      `,
    )
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      /* glsl */ `
      #include <begin_vertex>
      {
        // 果冻滞后：液体表面向晃动反方向倾斜堆积
        vec2 cell = vWUv - 0.5;
        transformed.z += g_h;
        transformed.z += -dot(uJelly, cell) * 1.1;
      }
      `,
    )

    shader.fragmentShader =
      COMMON_GLSL + 'float g_foam = 0.0;\n' + shader.fragmentShader
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      /* glsl */ `
      #include <color_fragment>
      {
        vec4 info = texture2D(uHeightTex, vWUv);
        float tH = uHeightRange.x + info.a * uHeightRange.y;
        float depth = max(uTideAbs - tH, 0.0);
        if (uDebug > 0.5) {
          // ?wd=1 高度灰度 / ?wd=2 uv 红绿图 / ?wd=3 模拟纹理状态（R=高度 G=速度，×8 增益）
          if (uDebug < 1.5) {
            diffuseColor.rgb = vec3(info.a);
          } else if (uDebug < 2.5) {
            diffuseColor.rgb = vec3(vWUv, 0.0);
          } else {
            vec3 simState = texture2D(uSim, vWUv).rgb;
            diffuseColor.rgb = vec3(0.5) + vec3(simState.r * 8.0, simState.g * 8.0, 0.0);
          }
          g_foam = 0.0;
        } else {
        float dN = smoothstep(0.0, 0.32, depth);

        // 假折射：浅水透出烘焙的底色，深水渐入青绿
        vec3 shallowTint = uColorShallow * 1.35;
        vec3 body = mix(
          info.rgb * mix(vec3(1.0), shallowTint, 0.6),
          mix(uColorShallow, uColorDeep, smoothstep(0.12, 0.5, depth)),
          dN
        );
        diffuseColor.rgb = body;

        // 岸边泡沫 + 拍岸小浪环 + 涟漪浪尖
        float n1 = vnoise(vWUv * vec2(150.0, 95.0) + vec2(uTime * 0.4, uTime * 0.25));
        float n2 = vnoise(vWUv * vec2(330.0, 210.0) - vec2(uTime * 0.55, uTime * 0.1));
        float fn = 0.6 * n1 + 0.4 * n2;
        float shore = 1.0 - smoothstep(0.004, uFoamWidth, depth);
        float ring =
          smoothstep(0.6, 0.95, sin(depth * 85.0 - uTime * 2.4) * 0.5 + 0.5) *
          smoothstep(0.012, 0.05, depth) *
          (1.0 - smoothstep(uFoamWidth * 2.0, uFoamWidth * 3.2, depth));
        float crest = smoothstep(1.2, 3.2, vSimG * uWaveHeight) * 0.3;
        g_foam = clamp(
          shore * (0.15 + 0.85 * smoothstep(0.35, 0.8, fn)) + ring * (0.3 + 0.4 * fn) + crest,
          0.0,
          1.0
        );
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.97, 0.99, 0.985), g_foam);
        }
      }
      `,
    )
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughness_fragment>',
      /* glsl */ `
      #include <roughness_fragment>
      roughnessFactor = mix(roughnessFactor, 0.9, g_foam);
      `,
    )
  }
  mat.customProgramCacheKey = () => 'resin-water-v1'
  return { mat, uniforms }
}

export function WaterSurface({
  sim,
  heightTex,
  tier,
  water,
  jelly,
}: {
  sim: WaterSimulator
  heightTex: THREE.Texture
  tier: number
  water: WaterParams
  jelly: { state: JellyState; kick: (fx: number, fz: number) => void }
}) {
  const seg = tier === 0 ? [224, 144] : tier === 1 ? [176, 112] : [128, 80]
  const geo = useMemo(
    () => new THREE.PlaneGeometry(INNER.w - 0.02, INNER.d - 0.02, seg[0], seg[1]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tier],
  )
  const { mat, uniforms } = useMemo(() => createWaterMaterial(heightTex), [heightTex])
  const meshRef = useRef<THREE.Mesh>(null)
  const lastUv = useRef<{ u: number; v: number } | null>(null)
  const droplet = useRef(1.5)

  const debugMode = useMemo(() => {
    const wd = new URLSearchParams(window.location.search).get('wd')
    return wd === '1' ? 1 : wd === '2' ? 2 : wd === '3' ? 3 : 0
  }, [])
  uniforms.uDebug.value = debugMode

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30)
    sim.update()

    // 空闲时的随机水滴，维持微弱自然波动
    droplet.current -= dt
    if (droplet.current <= 0) {
      droplet.current = 2.5 + Math.random() * 3.5
      sim.splat(0.15 + Math.random() * 0.7, 0.15 + Math.random() * 0.7, 0.05 + Math.random() * 0.04, 0.05)
    }

    const tideAbs = TIDE0 + water.tide
    uniforms.uTime.value = state.clock.elapsedTime
    uniforms.uTideAbs.value = tideAbs
    uniforms.uWaveHeight.value = water.waveHeight * 2
    uniforms.uFoamWidth.value = water.foamWidth
    uniforms.uColorShallow.value.set(water.shallowColor)
    uniforms.uColorDeep.value.set(water.deepColor)
    uniforms.uSim.value = sim.texture
    uniforms.uSimTexel.value.set(1 / sim.resolution, 1 / sim.resolution)
    uniforms.uJelly.value.set(jelly.state.x, jelly.state.z)
    if (meshRef.current) meshRef.current.position.y = tideAbs
  })

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!e.uv) return
    const u = e.uv.x
    const v = e.uv.y
    const last = lastUv.current
    let s = 0.25
    if (last) {
      const d = Math.hypot(u - last.u, v - last.v)
      s = Math.min(0.15 + d * 26, 1.1)
    }
    lastUv.current = { u, v }
    sim.splat(u, v, s * 0.32 * water.rippleStrength, 0.03)
  }

  return (
    <mesh
      ref={meshRef}
      geometry={geo}
      material={mat}
      position={[0, TIDE0, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      onPointerMove={onMove}
      onPointerOut={() => (lastUv.current = null)}
      onPointerDown={(e) => {
        if (!e.uv) return
        sim.splat(e.uv.x, e.uv.y, 1.3 * water.rippleStrength, 0.05)
        jelly.kick((Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 0.7)
      }}
    />
  )
}
