import { Show } from 'solid-js'
import type { RichMapData, WorldData, ProvinceId } from '@/types/data'

interface ProvincePanelProps {
  provinceId: ProvinceId | null
  mapData: RichMapData | undefined
  worldData: WorldData | undefined
}

export function ProvincePanel(props: ProvincePanelProps) {
  const provinceDef = () => {
    if (!props.provinceId || !props.mapData) return null
    return props.mapData.provinceById[props.provinceId]
  }

  const provinceData = () => {
    if (!props.provinceId || !props.worldData) return null
    return props.worldData.provinces.find((p) => p.id === props.provinceId)
  }

  const ownerCountry = () => {
    const data = provinceData()
    if (!data || !data.owner || !props.worldData) return null
    return props.worldData.countries.find((c) => c.tag === data.owner)
  }

  const controllerCountry = () => {
    const data = provinceData()
    if (!data || !data.controller || !props.worldData) return null
    return props.worldData.countries.find((c) => c.tag === data.controller)
  }

  const terrain = () => {
    if (!props.provinceId || !props.mapData) return null
    const overrides = props.mapData.terrain.overrides
    if (overrides && overrides[props.provinceId]) {
      return overrides[props.provinceId]
    }
    return 'Unknown'
  }

  return (
    <Show when={props.provinceId && provinceDef()}>
      <div class="pointer-events-auto w-80 bg-gray-900 border border-gray-700 rounded shadow-lg overflow-hidden flex flex-col text-white">
        <div class="bg-gray-800 px-4 py-3 border-b border-gray-700 flex justify-between items-center">
          <h2 class="font-bold text-lg text-white">{provinceDef()?.name || `Province ${props.provinceId}`}</h2>
          <span class="text-xs text-gray-400 font-mono">ID: {props.provinceId}</span>
        </div>
        
        <div class="p-4 flex flex-col gap-4">
          <Show when={provinceData()} fallback={<div class="text-sm text-gray-400 italic">Uncolonized or unknown territory.</div>}>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div class="flex flex-col bg-gray-800 p-3 rounded border border-gray-700">
                <span class="text-gray-400 text-xs uppercase font-bold mb-1">Owner</span>
                <span class="font-medium flex items-center gap-2 text-base text-white">
                  <Show when={ownerCountry()} fallback={<span class="text-gray-500 italic">None</span>}>
                    <div 
                      class="w-4 h-4 rounded-sm shadow-sm border border-gray-900" 
                      style={{ "background-color": `rgb(${ownerCountry()?.color[0]}, ${ownerCountry()?.color[1]}, ${ownerCountry()?.color[2]})` }} 
                    />
                    <span>{ownerCountry()?.tag}</span>
                  </Show>
                </span>
              </div>
              
              <div class="flex flex-col bg-gray-800 p-3 rounded border border-gray-700">
                <span class="text-gray-400 text-xs uppercase font-bold mb-1">Controller</span>
                <span class="font-medium flex items-center gap-2 text-base text-white">
                  <Show when={controllerCountry()} fallback={ownerCountry() ? (
                    <>
                      <div 
                        class="w-4 h-4 rounded-sm shadow-sm border border-gray-900" 
                        style={{ "background-color": `rgb(${ownerCountry()?.color[0]}, ${ownerCountry()?.color[1]}, ${ownerCountry()?.color[2]})` }} 
                      />
                      <span>{ownerCountry()?.tag}</span>
                    </>
                  ) : <span class="text-gray-500 italic">None</span>}>
                    <div 
                      class="w-4 h-4 rounded-sm shadow-sm border border-gray-900" 
                      style={{ "background-color": `rgb(${controllerCountry()?.color[0]}, ${controllerCountry()?.color[1]}, ${controllerCountry()?.color[2]})` }} 
                    />
                    <span>{controllerCountry()?.tag}</span>
                  </Show>
                </span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3 text-sm">
              <div class="flex flex-col bg-gray-800 p-3 rounded border border-gray-700">
                <span class="text-gray-400 text-xs uppercase font-bold mb-1">Population</span>
                <span class="text-lg text-white">{provinceData()?.population?.toLocaleString() || 0}</span>
              </div>
              
              <div class="flex flex-col bg-gray-800 p-3 rounded border border-gray-700">
                <span class="text-gray-400 text-xs uppercase font-bold mb-1">Terrain</span>
                <span class="font-medium capitalize text-white">{terrain()}</span>
              </div>
            </div>
            
            <Show when={provinceData()?.cores && provinceData()!.cores.length > 0}>
              <div class="flex flex-col mt-1 bg-gray-800 p-3 rounded border border-gray-700">
                <span class="text-gray-400 text-xs uppercase font-bold mb-2">Cores</span>
                <div class="flex flex-wrap gap-1.5">
                  {provinceData()?.cores.map(core => {
                    const coreCountry = props.worldData?.countries.find(c => c.tag === core)
                    return (
                      <span class="flex items-center gap-1.5 px-2 py-1 bg-gray-900 rounded text-xs border border-gray-700">
                        <Show when={coreCountry}>
                          <div 
                            class="w-2.5 h-2.5 rounded-sm border border-gray-900" 
                            style={{ "background-color": `rgb(${coreCountry?.color[0]}, ${coreCountry?.color[1]}, ${coreCountry?.color[2]})` }} 
                          />
                        </Show>
                        {core}
                      </span>
                    )
                  })}
                </div>
              </div>
            </Show>
          </Show>
        </div>
      </div>
    </Show>
  )
}
