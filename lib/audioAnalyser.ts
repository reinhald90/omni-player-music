let analyser: AnalyserNode | null = null
let dataArray: Uint8Array | null = null
let ready = false

export function setAnalyser(a: AnalyserNode | null) {
  analyser = a
  ready = false
  if (a) {
    dataArray = new Uint8Array(a.frequencyBinCount)
    ready = true
  } else {
    dataArray = null
  }
}

export function isAnalyserReady(): boolean {
  return ready && analyser !== null && dataArray !== null
}

/**
 * Ambil data frekuensi real-time. Return null kalau analyser belum siap.
 * Data range 0-255 per bin.
 */
export function getFrequencyData(): Uint8Array | null {
  if (!analyser || !dataArray) return null
  try {
    // TS 5.6 safe — pakai cast karena signature berbeda antar versi
    analyser.getByteFrequencyData(dataArray as any)
    return dataArray
  } catch {
    return null
  }
}
