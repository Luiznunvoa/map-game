interface MapSettingsProps {
  showBorders: boolean
  showRivers: boolean
  onBordersChange: (show: boolean) => void
  onRiversChange: (show: boolean) => void
}

export function MapSettings(props: MapSettingsProps) {
  return (
    <div class="flex flex-col gap-2 pointer-events-auto bg-gray-900/90 p-3 rounded shadow text-sm text-white">
      <label class="flex items-center gap-2 cursor-pointer hover:text-gray-300">
        <input
          type="checkbox"
          checked={props.showBorders}
          onChange={(e) => props.onBordersChange(e.currentTarget.checked)}
          class="accent-red-600"
        />
        Show Province Borders
      </label>
      <label class="flex items-center gap-2 cursor-pointer hover:text-gray-300">
        <input
          type="checkbox"
          checked={props.showRivers}
          onChange={(e) => props.onRiversChange(e.currentTarget.checked)}
          class="accent-red-600"
        />
        Show Rivers
      </label>
    </div>
  )
}
