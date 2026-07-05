import { createSignal, onMount, onCleanup } from 'solid-js'
import { LineChart } from '@/components/ui/line-chart'
import { mapFetchTime } from '@/services/http/map-service'

export function FpsCounter({ fps }: { fps: () => number | string }) {
  const [history, setHistory] = createSignal<number[]>(Array(100).fill(0))
  const [stats, setStats] = createSignal({ latency: '0.0', memory: '0.0' })

  onMount(() => {
    const interval = setInterval(() => {
      const currentFps = Number(fps())
      if (!isNaN(currentFps)) {
        setHistory((prev) => {
          const next = prev.slice(1)
          next.push(currentFps)
          return next
        })

        const latency = currentFps > 0 ? (1000 / currentFps).toFixed(1) : '0.0'
        
        // Use performance.memory if available (Chrome/Edge only)
        interface PerformanceWithMemory extends Performance {
          memory?: { usedJSHeapSize: number }
        }
        const perf = performance as PerformanceWithMemory
        const mem = perf.memory 
          ? (perf.memory.usedJSHeapSize / 1048576).toFixed(1) 
          : 'N/A'

        setStats({ latency, memory: mem })
      }
    }, 100) // 10 vezes por segundo

    onCleanup(() => clearInterval(interval))
  })

  return (
    <div class="bg-gray-900/90 text-white p-3 rounded border border-gray-700 shadow flex flex-col gap-2 items-start w-56">
      <div class="font-mono text-sm text-gray-300 w-full flex justify-between">
        <span>FPS:</span> <span class="text-emerald-400 font-bold">{fps()}</span>
      <LineChart 
        data={history()} 
        color="#34d399" 
        width="100%" 
        height="40px"
        max={65}
      />
      </div>
      <div class="font-mono text-sm text-gray-400 w-full flex justify-between">
        <span>Frame Latency:</span> <span>{stats().latency} ms</span>
      </div>
      <div class="font-mono text-sm text-gray-400 w-full flex justify-between">
        <span>Memory (Heap):</span> <span>{stats().memory} MB</span>
      </div>
      <div class="font-mono text-xs text-gray-500 w-full flex justify-between mt-1">
        <span>Map Fetch:</span> <span>{mapFetchTime().toFixed(0)} ms</span>
      </div>
    </div>
  )
}
