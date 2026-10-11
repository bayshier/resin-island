import { terrainHeight, TIDE0, ISLAND, INNER } from '../src/lib/terrain.ts'

console.log('TIDE0 =', TIDE0, 'island center =', ISLAND)
// 沿 x 轴穿过岛屿中心的剖面
console.log('\n--- 剖面 z = ISLAND.z, x 从 -1.6 到 1.6 ---')
for (let x = -1.6; x <= 1.61; x += 0.1) {
  const h = terrainHeight(x, ISLAND.z)
  const bar = '#'.repeat(Math.max(0, Math.round((h - 0.1) * 60)))
  console.log(`x=${x.toFixed(1)} h=${h.toFixed(3)} ${h > TIDE0 ? '^' : ' '} ${bar}`)
}
console.log('\n--- 剖面 x = ISLAND.x, z 从 -1.0 到 1.0 ---')
for (let z = -1.0; z <= 1.01; z += 0.1) {
  const h = terrainHeight(ISLAND.x, z)
  console.log(`z=${z.toFixed(1)} h=${h.toFixed(3)} ${h > TIDE0 ? '^ABOVE' : ''}`)
}
let max = 0
let min = 9
for (let x = -INNER.w / 2; x <= INNER.w / 2; x += 0.04) {
  for (let z = -INNER.d / 2; z <= INNER.d / 2; z += 0.04) {
    const h = terrainHeight(x, z)
    if (h > max) max = h
    if (h < min) min = h
  }
}
console.log(`\n全场高度范围: ${min.toFixed(3)} ~ ${max.toFixed(3)}，水面 ${TIDE0}`)
