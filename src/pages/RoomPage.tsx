import { onMount, onCleanup } from 'solid-js';
import { useParams, useNavigate } from '@solidjs/router';
import { MapView } from '@/views/map'; // Em breve será MapEngine

export function RoomPage() {
  const params = useParams();
  const navigate = useNavigate();
  let containerRef!: HTMLDivElement;
  let mapEngine: MapView | null = null;

  onMount(async () => {
    // Aloca a engine do jogo
    console.log(`Entrando na sala: ${params.id}`);
    
    // TODO: Passar params.id para o MapView quando ele suportar
    mapEngine = new MapView(containerRef);
    
    // Simula os eventos da View antiga para o Router do SolidJS
    mapEngine.onEvent = (event) => {
      if (event.type === 'BACK_TO_MENU') {
        navigate('/lobby');
      }
    };

    await mapEngine.load();
    mapEngine.start();
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
      {/* O Canvas do jogo será montado aqui dentro pelo MapView */}
      <div ref={containerRef} style="position: absolute; inset: 0;" />
    </div>
  );
}
