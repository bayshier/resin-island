import * as THREE from 'three'
import { INNER } from './terrain'

/**
 * GPU 高度场水面模拟：状态纹理存 (高度, 速度)，逐帧做波动方程积分，
 * 鼠标涟漪通过队列化的高斯 splat 注入。域纵横比取自块内水域。
 */

interface Splat {
  u: number
  v: number
  strength: number
  radius: number
}

const QUAD_VS = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

const STEP_FS = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uState;
uniform vec2 uTexel;
uniform float uSpeed;
uniform float uDamp;
uniform float uEdge;

void main() {
  vec4 c = texture2D(uState, vUv);
  float h = c.r;
  float v = c.g;
  float sum =
    texture2D(uState, vUv + vec2(uTexel.x, 0.0)).r +
    texture2D(uState, vUv - vec2(uTexel.x, 0.0)).r +
    texture2D(uState, vUv + vec2(0.0, uTexel.y)).r +
    texture2D(uState, vUv - vec2(0.0, uTexel.y)).r;
  v += (sum - 4.0 * h) * uSpeed;
  // 边缘强阻尼：块壁吸能，避免驻波环
  float edgeDist = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
  float edge = smoothstep(0.0, uEdge, edgeDist);
  v *= mix(0.90, uDamp, edge);
  h += v;
  gl_FragColor = vec4(h, v, 0.0, 1.0);
}
`

const SPLAT_FS = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform vec2 uPoint;
uniform float uAspect;
uniform float uRadius;
uniform float uStrength;

void main() {
  vec2 d = vec2((vUv.x - uPoint.x) * uAspect, vUv.y - uPoint.y);
  float g = exp(-dot(d, d) / max(uRadius * uRadius, 1e-6));
  gl_FragColor = vec4(uStrength * g, 0.0, 0.0, 1.0);
}
`

export class WaterSimulator {
  texture: THREE.Texture

  private renderer: THREE.WebGLRenderer
  private res: number
  private rtA: THREE.WebGLRenderTarget
  private rtB: THREE.WebGLRenderTarget
  private scene = new THREE.Scene()
  private cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  private quad: THREE.Mesh
  private stepMat: THREE.ShaderMaterial
  private splatMat: THREE.ShaderMaterial
  private queue: Splat[] = []

  constructor(renderer: THREE.WebGLRenderer, res: number) {
    this.renderer = renderer
    this.res = res
    const opts: THREE.RenderTargetOptions = {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      stencilBuffer: false,
      generateMipmaps: false,
    }
    this.rtA = new THREE.WebGLRenderTarget(res, res, opts)
    this.rtB = new THREE.WebGLRenderTarget(res, res, opts)

    const prevColor = renderer.getClearColor(new THREE.Color())
    const prevAlpha = renderer.getClearAlpha()
    renderer.setClearColor(0x000000, 1)
    for (const rt of [this.rtA, this.rtB]) {
      renderer.setRenderTarget(rt)
      renderer.clear(true, false, false)
    }
    renderer.setRenderTarget(null)
    renderer.setClearColor(prevColor, prevAlpha)

    this.stepMat = new THREE.ShaderMaterial({
      uniforms: {
        uState: { value: null },
        uTexel: { value: new THREE.Vector2(1 / res, 1 / res) },
        uSpeed: { value: 0.42 },
        uDamp: { value: 0.985 },
        uEdge: { value: 0.05 },
      },
      vertexShader: QUAD_VS,
      fragmentShader: STEP_FS,
      depthTest: false,
      depthWrite: false,
    })
    this.splatMat = new THREE.ShaderMaterial({
      uniforms: {
        uPoint: { value: new THREE.Vector2() },
        uAspect: { value: INNER.w / INNER.d },
        uRadius: { value: 0.035 },
        uStrength: { value: 0 },
      },
      vertexShader: QUAD_VS,
      fragmentShader: SPLAT_FS,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.stepMat)
    this.quad.frustumCulled = false
    this.scene.add(this.quad)
    this.texture = this.rtA.texture
  }

  /** uv ∈ [0,1]，strength 正负皆可，radius 为 uv 空间高斯半径 */
  splat(u: number, v: number, strength = 1, radius = 0.035): void {
    if (this.queue.length < 24) this.queue.push({ u, v, strength, radius })
  }

  update(): void {
    const r = this.renderer
    // 关键：渲染 splat 时不能让 autoClear 把模拟状态清掉
    const prevAutoClear = r.autoClear
    r.autoClear = false

    this.quad.material = this.stepMat
    this.stepMat.uniforms.uState.value = this.rtA.texture
    r.setRenderTarget(this.rtB)
    r.render(this.scene, this.cam)

    const t = this.rtA
    this.rtA = this.rtB
    this.rtB = t
    this.texture = this.rtA.texture

    let n = 0
    while (this.queue.length && n < 4) {
      const s = this.queue.shift()!
      this.splatMat.uniforms.uPoint.value.set(s.u, s.v)
      this.splatMat.uniforms.uStrength.value = s.strength
      this.splatMat.uniforms.uRadius.value = s.radius
      this.quad.material = this.splatMat
      r.setRenderTarget(this.rtA)
      r.render(this.scene, this.cam)
      n++
    }
    r.autoClear = prevAutoClear
    r.setRenderTarget(null)
  }

  get resolution(): number {
    return this.res
  }

  dispose(): void {
    this.rtA.dispose()
    this.rtB.dispose()
    this.stepMat.dispose()
    this.splatMat.dispose()
    this.quad.geometry.dispose()
  }
}
