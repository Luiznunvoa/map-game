  import { createSignal, onMount, onCleanup } from 'solid-js'
import { LineChart } from '@/components/ui/line-chart'

export function FpsCounter({ fps }: { fps: () => number | string }) {
  const [history, setHistory] = createSignal<number[]>(Array(100).fill(0))

  onMount(() => {
    const interval = setInterval(() => {
      const currentFps = Number(fps())
      if (!isNaN(currentFps)) {
        setHistory((prev) => {
          const next = prev.slice(1)
          next.push(currentFps)
          return next
        })
      }
    }, 100) // 10 vezes por segundo

    onCleanup(() => clearInterval(interval))
  })

  return (
    <div class="bg-gray-900/90 text-white p-3 rounded border border-gray-700 shadow flex flex-col gap-2 items-start w-48">
      <div class="font-mono text-sm text-gray-300">
        FPS: <span class="text-emerald-400 font-bold">{fps()}</span>
      </div>
      <LineChart 
        data={history()} 
        color="#34d399" 
        width="100%" 
        height="40px"
        max={65}
      />
    </div>
  )
}
