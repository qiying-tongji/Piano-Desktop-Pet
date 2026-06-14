/**
 * MediaPipe 手部关键点检测器
 *
 * 单例加载 HandLandmarker 模型，支持本地/远程模型与 GPU/CPU 回退。
 */
import { FilesetResolver, HandLandmarker, type HandLandmarkerOptions } from '@mediapipe/tasks-vision'
import type { NormalizedLandmark } from '@mediapipe/tasks-vision'
import { HAND_MODEL_URL, HAND_MODEL_URL_REMOTE, WASM_BASE } from './constants'

let landmarkerSingleton: HandLandmarker | null = null
let landmarkerPromise: Promise<HandLandmarker> | null = null

async function createLandmarker(modelAssetPath: string, delegate: 'GPU' | 'CPU'): Promise<HandLandmarker> {
  const vision = await FilesetResolver.forVisionTasks(WASM_BASE)
  const options: HandLandmarkerOptions = {
    baseOptions: {
      modelAssetPath,
      delegate,
    },
    runningMode: 'VIDEO',
    numHands: 2,
  }
  return HandLandmarker.createFromOptions(vision, options)
}

export async function getHandLandmarker(): Promise<HandLandmarker> {
  if (landmarkerSingleton) return landmarkerSingleton
  if (landmarkerPromise) return landmarkerPromise

  landmarkerPromise = (async () => {
    const candidates = [HAND_MODEL_URL, HAND_MODEL_URL_REMOTE]
    let lastError: unknown

    for (const modelAssetPath of candidates) {
      for (const delegate of ['GPU', 'CPU'] as const) {
        try {
          landmarkerSingleton = await createLandmarker(modelAssetPath, delegate)
          return landmarkerSingleton
        } catch (err) {
          lastError = err
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error('MediaPipe 模型加载失败')
  })()

  return landmarkerPromise
}

export function disposeHandLandmarker(): void {
  landmarkerSingleton?.close()
  landmarkerSingleton = null
  landmarkerPromise = null
}

export function toHandFrame(
  result: { landmarks?: NormalizedLandmark[][]; handednesses?: Array<Array<{ categoryName?: string }>> },
  timestamp: number,
) {
  const hands = result.landmarks ?? []
  const labels =
    result.handednesses?.map((cats) => cats[0]?.categoryName ?? 'Hand') ?? hands.map(() => 'Hand')
  return { hands, labels, timestamp }
}
