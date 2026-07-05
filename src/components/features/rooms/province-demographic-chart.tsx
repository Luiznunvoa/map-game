import { onMount, onCleanup, createEffect } from 'solid-js'
import * as echarts from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

import type { POPState } from '@/types/state'
import type { CultureData } from '@/types/data'

echarts.use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer])

interface ProvinceDemographicChartProps {
  pops: POPState[]
  category: 'culture' | 'type'
  cultures?: Record<string, CultureData>
}

export function ProvinceDemographicChart(props: ProvinceDemographicChartProps) {
  let chartRef!: HTMLDivElement
  let chart: echarts.ECharts

  onMount(() => {
    chart = echarts.init(chartRef)
    
    const resizeHandler = () => chart.resize()
    window.addEventListener('resize', resizeHandler)
    
    onCleanup(() => {
      window.removeEventListener('resize', resizeHandler)
      chart.dispose()
    })
  })

  createEffect(() => {
    if (!chart || !props.pops || props.pops.length === 0) {
      chart?.clear()
      return
    }

    const aggregated: Record<string, number> = {}
    let totalSize = 0
    props.pops.forEach((pop) => {
      const key = props.category === 'culture' ? pop.culture : pop.type
      aggregated[key] = (aggregated[key] || 0) + pop.size
      totalSize += pop.size
    })

    const chartData: any[] = []
    let othersSize = 0
    for (const [key, size] of Object.entries(aggregated)) {
      if (size / totalSize >= 0.05) {
        const capName = key.charAt(0).toUpperCase() + key.slice(1)
        const item: any = {
          name: capName,
          value: size
        }
        
        if (props.category === 'culture' && props.cultures?.[key]) {
          item.itemStyle = {
            color: props.cultures[key].color
          }
        }
        chartData.push(item)
      } else {
        othersSize += size
      }
    }

    // Sort to make the chart look more organized
    chartData.sort((a, b) => b.value - a.value)

    if (othersSize > 0) {
      chartData.push({
        name: 'Outros',
        value: othersSize,
        itemStyle: { color: '#555555' }
      })
    }

    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
        backgroundColor: '#1f2937',
        borderColor: '#374151',
        textStyle: { color: '#f3f4f6', fontSize: 12 },
        padding: [8, 12],
        appendToBody: true,
        confine: true
      },
      legend: {
        bottom: '0%',
        left: 'center',
        textStyle: { color: '#9ca3af', fontSize: 11 },
        itemWidth: 12,
        itemHeight: 12,
        type: 'scroll',
        formatter: (name: string) => {
          const item = chartData.find(d => d.name === name)
          const percent = totalSize > 0 && item ? Math.round((item.value / totalSize) * 100) : 0
          return `${name} - ${percent}%`
        }
      },
      series: [
        {
          name: props.category === 'culture' ? 'Culturas' : 'Profissões',
          type: 'pie',
          radius: '65%',
          center: ['50%', '42%'],
          avoidLabelOverlap: false,
          label: {
            show: false
          },
          labelLine: {
            show: false
          },
          data: chartData
        }
      ]
    }

    chart.setOption(option)
  })

  return <div ref={chartRef} style={{ width: '100%', height: '220px' }} />
}
