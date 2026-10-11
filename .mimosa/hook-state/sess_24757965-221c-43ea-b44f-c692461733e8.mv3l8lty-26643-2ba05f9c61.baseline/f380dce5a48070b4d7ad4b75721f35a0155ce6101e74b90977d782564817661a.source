import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { Instance, Instances } from '@react-three/drei'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { noise2, mulberry32 } from '../lib/noise'
import { INNER, ISLAND, scatterOnTerrain, terrainHeight, TIDE0 } from '../lib/terrain'

interface RockItem {
  x: number
  y: number
  z: number
  rot: [number, number, number]
  scale: [number, number, number]
  color: string
}

function useRockItems(): RockItem[] {
  return useMemo(() => {
    const rng = mulberry32(4242)
    const items: RockItem[] = []

    // 岸线岩石：部分露出水面
    let guard = 0
    let shore = 0
    while (shore < 5 && guard++ < 400) {
      const ang = rng() * Math.PI * 2
      const rad = 0.5 + rng() * 0.8
      const x = ISLAND.x + Math.cos(ang) * rad
      const z = ISLAND.z + Math.sin(ang) * rad * 0.85
      if (Math.abs(x) > INNER.w / 2 - 0.12 || Math.abs(z) > INNER.d / 2 - 0.12) continue
      const h = terrainHeight(x, z)
      if (Math.abs(h - TIDE0) < 0.08) {
        const s = 0.05 + rng() * 0.09
        items.push({
          x,
          y: h - s * 0.35,
          z,
          rot: [rng() * 0.7, rng() * Math.PI * 2, rng() * 0.7],
          scale: [s * (0.9 + rng() * 0.5), s * (0.6 + rng() * 0.4), s * (0.9 + rng() * 0.5)],
          color: new THREE.Color().setHSL(0.09 + rng() * 0.03, 0.1 + rng() * 0.1, 0.42 + rng() * 0.16).getStyle(),
        })
        shore++
      }
    }

    // 海床散石
    const bed = scatterOnTerrain(8, 777, (h) => h < TIDE0 - 0.08)
    for (const p of bed) {
      const s = 0.04 + rng() * 0.07
      items.push({
        x: p.x,
        y: p.h - s * 0.3,
        z: p.z,
        rot: [rng() * 0.7, rng() * Math.PI * 2, rng() * 0.7],
        scale: [s * (0.9 + rng() * 0.5), s * (0.6 + rng() * 0.4), s * (0.9 + rng() * 0.5)],
        color: new THREE.Color().setHSL(0.08 + rng() * 0.04, 0.08 + rng() * 0.1, 0.36 + rng() * 0.14).getStyle(),
      })
    }
    return items
  }, [])
}

/** 合并重复顶点后做位置扰动，得到嶙峋的碎岩几何 */
function useRockGeometry(): THREE.BufferGeometry {
  return useMemo(() => {
    let g: THREE.BufferGeometry = new THREE.DodecahedronGeometry(1, 0)
    g = mergeVertices(g, 1e-4)
    const pos = g.attributes.position as THREE.BufferAttribute
    const v = new THREE.Vector3()
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i)
      const n = noise2(v.x * 2.6 + 5, v.y * 2.2 + v.z * 3.1)
      v.multiplyScalar(1 + 0.32 * n)
      pos.setXYZ(i, v.x, v.y, v.z)
    }
    g.computeVertexNormals()
    return g
  }, [])
}

/** 散布岩石：岸线几块露头，其余沉在海床 */
export function Rocks() {
  const items = useRockItems()
  const geo = useRockGeometry()
  useEffect(() => () => geo.dispose(), [geo])

  return (
    <Instances geometry={geo} limit={items.length} range={items.length}>
      <meshStandardMaterial roughness={0.85} metalness={0.02} flatShading />
      {items.map((r, i) => (
        <Instance key={i} position={[r.x, r.y, r.z]} rotation={r.rot} scale={r.scale} color={r.color} />
      ))}
    </Instances>
  )
}
