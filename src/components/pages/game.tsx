import { createEffect, onCleanup, Show } from 'solid-js';
import { useParams, useNavigate } from '@solidjs/router';
import { useMapData } from '@/hooks/map/useMapData';
import { GameEngine } from '@/game';
import { Loading } from '@/components/features/loading';

export function RoomPage() {
  const params = useParams();
  const navigate = useNavigate();
  let containerRef!: HTMLDivElement;
  let mapEngine: GameEngine | null = null;
  
  const mapDataResource = useMapData();

  createEffect(() => {
    const data = mapDataResource();
    if (data && containerRef && !mapEngine) {
      console.log(`Entrando na sala: ${params.id}`);
      
      mapEngine = new GameEngine(containerRef, data.worldData, data.mapData);
      
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
    <div class="relative h-full w-full">
      <Show when={mapDataResource()} fallback={
        <Loading message='LOADING MAP...' />
      }>
        <div ref={containerRef} class='absolute inset-0' />
      </Show>
    </div>
  );
}

