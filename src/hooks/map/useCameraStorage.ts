export interface CameraPosition {
  radius: number
  theta: number
  phi: number
}

export function useCameraStorage() {
  const STORAGE_KEY = 'camera_position'

  const updateStoredCameraPosition = (position: CameraPosition) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(position))
  }

  const getStoredCameraPosition = (): CameraPosition | null => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const state = JSON.parse(saved)
        if (state && typeof state.radius === 'number') {
          return state
        }
      } catch (e) {
        console.warn('Failed to parse camera state', e)
      }
    }
    return null
  }

  return { updateStoredCameraPosition, getStoredCameraPosition }
}
