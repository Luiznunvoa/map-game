import { createSignal, createEffect, onCleanup, Show } from 'solid-js';
import { useParams, useNavigate } from '@solidjs/router';
import { useMapData } from '@/hooks/map/useMapData';
import { bg } from '@/assets';
import { GameEngine } from '@/game';
import { Loading } from '@/components/features/loading';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import type { MapColorMode } from '@/types/globe';

export function RoomPage() {
  const params = useParams();
  const navigate = useNavigate();
  let containerRef!: HTMLDivElement;
  let engine: GameEngine | null = null;

  const mapDataResource = useMapData();
  const [fps, setFps] = createSignal(0);

  function handleFrame () {

  }

  createEffect(() => {
    const data = mapDataResource();
    if (data && containerRef && !engine) {
      console.log(`Entrando na sala: ${params.id}`);

      engine = new GameEngine(containerRef, data.worldData, data.mapData);

      engine.onEvent = (event) => {
        if (event.type === 'NAVIGATE') {
          navigate(event.payload.to);
        }
      };

      engine.onFrame = (currentFps) => {
        handleFrame()
        setFps(currentFps);
      };

      engine.start();
    }
  });

  onCleanup(async () => {
    if (engine) {
      engine.stop();
      await engine.unload();
      engine = null;
    }
  });

  return (
    <div
      class="relative h-screen w-full overflow-hidden"
      style={{ "background-image": `url('${bg}')` }}
    >
      <Show when={mapDataResource()} fallback={
        <Loading message='LOADING MAP...' />
      }>
        <div ref={containerRef} class='absolute inset-0' />
      </Show>

      {/* UI Overlay */}
      <div class="absolute top-0 left-0 right-0 p-4 flex justify-between pointer-events-none z-10">
        <div class="flex flex-col gap-2 pointer-events-auto">
          <div class="bg-gray-900/90 text-white px-3 py-1 rounded border border-gray-700 font-mono text-sm shadow">
            FPS: {fps()}
          </div>
        </div>

        <div class="flex gap-3 pointer-events-auto items-center">
          <Select
            class="bg-gray-900/90 py-1.5 text-sm shadow"
            onChange={(e) => engine?.setColorMode(e.currentTarget.value as MapColorMode)}
          >
            <option value="political">Modo Político</option>
            <option value="terrain">Modo Terreno</option>
            <option value="province">Modo Províncias</option>
            <option value="continent">Modo Continentes</option>
            <option value="region">Modo Regiões</option>
          </Select>

          <Button class="bg-red-600 hover:bg-red-700 py-1.5 px-4 text-sm shadow" onClick={() => navigate('/lobby')}>
            Sair da Sala
          </Button>
        </div>
      </div>
    </div>
  );
}

