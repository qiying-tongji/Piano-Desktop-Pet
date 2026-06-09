import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const wasmSrc = path.join(root, 'node_modules/@mediapipe/tasks-vision/wasm')
const wasmDest = path.join(root, 'public/mediapipe/wasm')
const modelDest = path.join(root, 'public/models/hand_landmarker.task')
const modelUrl =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const name of fs.readdirSync(src)) {
    fs.copyFileSync(path.join(src, name), path.join(dest, name))
  }
}

if (!fs.existsSync(wasmSrc)) {
  console.error('[sync-gesture-assets] @mediapipe/tasks-vision not installed')
  process.exit(1)
}

copyDir(wasmSrc, wasmDest)
console.log('[sync-gesture-assets] wasm copied to public/mediapipe/wasm')

const requireModel = process.argv.includes('--require-model')

if (!fs.existsSync(modelDest)) {
  console.log('[sync-gesture-assets] downloading hand_landmarker.task …')
  const res = await fetch(modelUrl)
  if (!res.ok) {
    const msg = '[sync-gesture-assets] model download failed'
    if (requireModel) {
      console.error(msg)
      process.exit(1)
    }
    console.warn(`${msg}, will use remote URL fallback`)
    process.exit(0)
  }
  fs.mkdirSync(path.dirname(modelDest), { recursive: true })
  fs.writeFileSync(modelDest, Buffer.from(await res.arrayBuffer()))
  console.log('[sync-gesture-assets] model saved to public/models/hand_landmarker.task')
} else {
  console.log('[sync-gesture-assets] model already present')
}
