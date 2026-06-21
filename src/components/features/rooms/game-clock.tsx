import { Show } from 'solid-js'

export interface GameClockProps {
  date: () => string;
  period: () => number;
  speed: () => number;
  isPaused: () => boolean;
  play: (newSpeed?: number) => void;
  pause: () => void;
  changeSpeed: (newSpeed: number) => void;
  isHost: boolean;
}

export function GameClock(props: GameClockProps) {
  return (
    <div class="flex flex-col items-center gap-1 pointer-events-auto mt-2">
      <div class="bg-gray-900/90 text-white px-4 py-2 rounded border border-gray-700 shadow flex items-center gap-4">
        <div class="flex flex-col items-center min-w-[100px]">
          <span class="text-xs text-gray-400 font-bold uppercase tracking-wider">
            {props.period() === 0 && 'Manhã'}
            {props.period() === 1 && 'Tarde'}
            {props.period() === 2 && 'Noite'}
            {props.period() === 3 && 'Madrugada'}
          </span>
          <span class="font-mono text-lg font-bold">{props.date()}</span>
        </div>
        
        <div class="flex items-center gap-2 border-l border-gray-700 pl-4">
          <Show when={props.isHost}>
            <Show when={props.isPaused()} fallback={
              <button onClick={() => props.pause()} class="px-3 py-1.5 bg-yellow-600/20 text-yellow-500 rounded hover:bg-yellow-600/40 transition-colors font-bold text-sm">
                PAUSE
              </button>
            }>
              <button onClick={() => props.play()} class="px-3 py-1.5 bg-green-600/20 text-green-500 rounded hover:bg-green-600/40 transition-colors font-bold text-sm">
                PLAY
              </button>
            </Show>
          </Show>
          
          <div class="flex items-center gap-1 bg-gray-800 rounded p-1 ml-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  disabled={!props.isHost}
                  class={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold transition-colors ${
                    props.speed() === s ? 'bg-blue-600 text-white' : 'text-gray-400'
                  } ${props.isHost ? 'hover:bg-gray-700 hover:text-white cursor-pointer' : 'cursor-default'}`}
                  onClick={() => props.changeSpeed(s)}
                >
                  {s}x
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
