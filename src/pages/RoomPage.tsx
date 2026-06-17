import { createEffect, onCleanup, Show } from 'solid-js';
import { useParams, useNavigate } from '@solidjs/router';
import { MapView } from '@/views/map';
import { useMapData } from '@/hooks/useMapData';

export function RoomPage() {
  const params = useParams();
  const navigate = useNavigate();
  let containerRef!: HTMLDivElement;
  let mapEngine: MapView | null = null;
  
  const mapDataResource = useMapData();

  createEffect(() => {
    const data = mapDataResource();
    if (data && containerRef && !mapEngine) {
      console.log(`Entrando na sala: ${params.id}`);
      
      mapEngine = new MapView(containerRef, data.worldData, data.mapData);
      
      mapEngine.onEvent = (event) => {
        if (event.type === 'BACK_TO_MENU') {
          navigate('/lobby');
        }
      };
      
      mapEngine.start();
    }
  });

  onCleanup(async () => {
    if (mapEngine) {
      mapEngine.stop();
      await mapEngine.unload();
      mapEngine = null;
    }
  });

  return (
    <div style="position: relative; width: 100%; height: 100%;">
      <Show when={mapDataResource()} fallback={
        <div class="absolute inset-0 flex items-center justify-center bg-gray-900 text-white z-50">
          <div class="flex flex-col items-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
            <h2 class="text-xl font-bold tracking-widest text-indigo-300">CARREGANDO MAPA...</h2>
          </div>
        </div>
      }>
        <div ref={containerRef} style="position: absolute; inset: 0;" />
      </Show>
    </div>
  );
}
