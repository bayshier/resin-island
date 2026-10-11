import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { Instance, Instances } from '@react-three/drei'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { mulberry32 } from '../lib/noise'
import { scatterOnTerrain, TIDE0 } from '../lib/terrain'

function paint(geo: THREE.BufferGeometry, r: number, g: number, b: number): void {
  const n = geo.attributes.position.count
  const arr = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    arr[i * 3] = r
    arr[i * 3 + 1] = g
    arr[i * 3 + 2] = b
  }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3))
}

/** 低多边形小松树：树干 + 两层锥形树冠，顶点色分区 */
function treeGeometry(): THREE.BufferGeometry {
  const trunk = new THREE.CylinderGeometry(0.012, 0.02, 0.07, 5)
  trunk.translate(0, 0.035, 0)
  paint(trunk, 0.36, 0.27, 0.19)
  const c1 = new THREE.ConeGeometry(0.065, 0.12, 6)
  c1.translate(0, 0.11, 0)
  paint(c1, 0.28, 0.45, 0.2)
  const c2 = new THREE.ConeGeometry(0.045, 0.09, 6)
  c2.translate(0, 0.185, 0)
  paint(c2, 0.33, 0.5, 0.22)
  return mergeGeometries([trunk, c1, c2])!
}

function bushGeometry(): THREE.BufferGeometry {
  const g = new THREE.IcosahedronGeometry(0.05, 1)
  g.scale(1, 0.72, 1)
  g.translate(0, 0.035, 0)
  paint(g, 0.33, 0.47, 0.21)
  return g
}

function grassGeometry(): THREE.BufferGeometry {
  const g = new THREE.ConeGeometry(0.015, 0.05, 4)
  g.translate(0, 0.025, 0)
  paint(g, 0.47, 0.55, 0.24)
  return g
}

interface Item {
  p: [number, number, number]
  ry: number
  s: number
  color: string
}

function useScatter(
  geoFactory: () => THREE.BufferGeometry,
  count: number,
  seed: number,
  accept: (h: number, slope: number) => boolean,
  scale: [number, number],
  hue: [number, number],
): { geo: THREE.BufferGeometry; items: Item[] } {
  const geo = useMemo(geoFactory, []) // eslint-disable-line react-hooks/exhaustive-deps
  const items = useMemo<Item[]>(() => {
    const rng = mulberry32(seed)
    const pts = scatterOnTerrain(count, seed + 1, (h, slope) => accept(h, slope))
    return pts.map((pt) => {
      const c = new THREE.Color().setHSL(
        hue[0] + rng() * (hue[1] - hue[0]),
        0.35 + rng() * 0.2,
        0.42 + rng() * 0.2,
      )
      return {
        p: [pt.x, pt.h - 0.008, pt.z] as [number, number, number],
        ry: rng() * Math.PI * 2,
        s: scale[0] + rng() * (scale[1] - scale[0]),
        color: c.getStyle(),
      }
    })
  }, [count, seed, hue, scale, accept]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => geo.dispose(), [geo])
  return { geo, items }
}

function InstancedGroup({ geo, items }: { geo: THREE.BufferGeometry; items: Item[] }) {
  if (!items.length) return null
  return (
    <Instances geometry={geo} limit={items.length} range={items.length}>
      <meshStandardMaterial vertexColors roughness={0.9} flatShading />
      {items.map((it, i) => (
        <Instance key={i} position={it.p} rotation={[0, it.ry, 0]} scale={it.s} color={it.color} />
      ))}
    </Instances>
  )
}

/** 缓坡植被：松树、灌木、草茎，按高度/坡度拒绝采样分布 */
export function Vegetation() {
  const trees = useScatter(
    treeGeometry,
    26,
    101,
    (h, slope) => h > TIDE0 + 0.09 && h < TIDE0 + 0.34 && slope < 0.6,
    [0.8, 1.5],
    [0.28, 0.36],
  )
  const bushes = useScatter(
    bushGeometry,
    20,
    202,
    (h, slope) => h > TIDE0 + 0.07 && h < TIDE0 + 0.3 && slope < 0.75,
    [0.7, 1.4],
    [0.26, 0.34],
  )
  const grass = useScatter(
    grassGeometry,
    70,
    303,
    (h, slope) => h > TIDE0 + 0.06 && h < TIDE0 + 0.36 && slope < 0.9,
    [0.7, 1.6],
    [0.18, 0.28],
  )

  return (
    <>
      <InstancedGroup geo={trees.geo} items={trees.items} />
      <InstancedGroup geo={bushes.geo} items={bushes.items} />
      <InstancedGroup geo={grass.geo} items={grass.items} />
    </>
  )
}
