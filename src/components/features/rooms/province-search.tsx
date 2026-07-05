import { Button } from '@/components/ui/button'

interface ProvinceSearchProps {
  onSearch: (id: number) => void
}

export function ProvinceSearch(props: ProvinceSearchProps) {
  const handleSearch = (input: HTMLInputElement) => {
    const id = parseInt(input.value)
    if (!isNaN(id)) {
      props.onSearch(id)
    }
    input.value = ''
    input.blur()
  }

  return (
    <div class="flex flex-col gap-2 pointer-events-auto bg-gray-900/90 p-3 rounded shadow text-sm text-white">
      <div class="font-semibold text-xs text-gray-400 uppercase tracking-wider mb-1">Search</div>
      <div class="flex items-center gap-2">
        <input
          type="text"
          placeholder="Province ID"
          class="bg-gray-800 text-white px-2 py-1 rounded w-28 outline-none border border-gray-700 focus:border-red-600"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch(e.currentTarget)
            }
          }}
        />
        <Button
          class="bg-red-600 hover:bg-red-700 py-1 px-3 text-xs h-auto"
          onClick={(e) => {
            const input = e.currentTarget.previousElementSibling as HTMLInputElement
            handleSearch(input)
          }}
        >
          Go
        </Button>
      </div>
    </div>
  )
}
