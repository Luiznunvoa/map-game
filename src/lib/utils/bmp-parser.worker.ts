import { parseBmp } from './bmp-parser'

self.onmessage = async (e: MessageEvent) => {
  const { bytes, filename } = e.data
  try {
    const result = await parseBmp(bytes, filename)
    // Transfer the ArrayBuffer back to the main thread to avoid copying memory
    self.postMessage({ success: true, result }, { transfer: [result.data.buffer] })
  } catch (error) {
    self.postMessage({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}
