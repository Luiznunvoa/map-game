import { createEffect, onCleanup, onMount } from 'solid-js'
import * as echarts from 'echarts'

export interface LineChartProps {
  data: number[]
  color?: string
  width?: string
  height?: string
  min?: number
  max?: number
}

export function LineChart(props: LineChartProps) {
  let chartRef!: HTMLDivElement
  let chartInstance: echarts.ECharts | undefined

  onMount(() => {
    chartInstance = echarts.init(chartRef)

    const handleResize = () => {
      chartInstance?.resize()
    }
    window.addEventListener('resize', handleResize)
    
    onCleanup(() => {
      window.removeEventListener('resize', handleResize)
      chartInstance?.dispose()
    })
  })

  createEffect(() => {
    if (!chartInstance) return

    // Limit re-renders overhead for high frequency data by disabling most animations
    const option = {
      grid: {
        top: 2,
        bottom: 2,
        left: 2,
        right: 2,
      },
      xAxis: {
        type: 'category',
        show: false,
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        show: false,
        min: props.min ?? 0,
        max: props.max ?? 60,
      },
      series: [
        {
          data: props.data,
          type: 'line',
          smooth: true,
          showSymbol: false,
          lineStyle: {
            color: props.color || '#10b981',
            width: 2,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: props.color || '#10b981' },
              { offset: 1, color: 'transparent' },
            ]),
            opacity: 0.3,
          },
          animation: false,
        },
      ],
      animation: false,
    }

    chartInstance.setOption(option, { replaceMerge: ['series'] })
  })

  return (
    <div
      ref={chartRef}
      style={{
        width: props.width || '100px',
        height: props.height || '40px',
      }}
    />
  )
}
