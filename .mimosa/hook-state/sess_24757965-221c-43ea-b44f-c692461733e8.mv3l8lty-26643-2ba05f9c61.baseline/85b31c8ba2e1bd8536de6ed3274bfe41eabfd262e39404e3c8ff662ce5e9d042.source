import { useControls } from 'leva'

/** leva 调参面板：水、光照、果冻、镜头与后期 */
export function useParams() {
  const water = useControls(
    '水',
    {
      shallowColor: { value: '#8cecd6', label: '浅水色' },
      deepColor: { value: '#0b8c8f', label: '深水色' },
      waveHeight: { value: 0.6, min: 0, max: 1, label: '浪高' },
      rippleStrength: { value: 0.7, min: 0, max: 1.5, label: '涟漪强度' },
      foamWidth: { value: 0.035, min: 0.005, max: 0.15, label: '泡沫宽度' },
      tide: { value: 0, min: -0.05, max: 0.02, step: 0.005, label: '潮位' },
    },
    { collapsed: true },
  )

  const light = useControls(
    '光照',
    {
      sunAzimuth: { value: 0.7, min: -Math.PI, max: Math.PI, label: '太阳方位' },
      sunElevation: { value: 0.9, min: 0.15, max: 1.4, label: '太阳高度' },
      sunIntensity: { value: 2.2, min: 0, max: 6, label: '太阳强度' },
      caustics: { value: 0.4, min: 0, max: 1.5, label: '焦散强度' },
    },
    { collapsed: true },
  )

  const jelly = useControls(
    '果冻',
    {
      stiffness: { value: 46, min: 8, max: 160, label: '软硬（刚度）' },
      damping: { value: 0.94, min: 0.7, max: 0.995, label: '阻尼' },
      amplitude: { value: 0.12, min: 0, max: 0.35, label: '晃动幅度' },
      tilt: { value: 0.55, min: 0, max: 1.5, label: '顶部摆动' },
    },
    { collapsed: true },
  )

  const look = useControls(
    '镜头与后期',
    {
      background: { value: '#f3eee2', label: '背景色' },
      bokehScale: { value: 1.9, min: 0, max: 8, label: '景深光斑' },
      focalLength: { value: 0.028, min: 0.005, max: 0.12, label: '对焦距离' },
      bloom: { value: 0.32, min: 0, max: 1.5, label: '泛光' },
      vignette: { value: 0.55, min: 0, max: 1, label: '暗角' },
    },
    { collapsed: true },
  )

  return { water, light, jelly, look }
}

export type Params = ReturnType<typeof useParams>
