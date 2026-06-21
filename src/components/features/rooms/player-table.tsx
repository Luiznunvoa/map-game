import { For } from 'solid-js'
import type { PlayerInRoom } from '@/types/room'

interface PlayerTableProps {
  players: PlayerInRoom[]
}

const ROLE_LABELS: Record<string, string> = {
  HOST: 'Anfitrião',
  GUEST: 'Jogador',
  SPECTATOR: 'Espectador',
}

const ROLE_THEME: Record<string, { avatarBg: string, avatarBorder: string, text: string }> = {
  HOST: { avatarBg: 'bg-gradient-to-br from-amber-500/30 to-amber-500/10', avatarBorder: 'border-amber-500/50', text: 'text-amber-500' },
  GUEST: { avatarBg: 'bg-gradient-to-br from-blue-400/30 to-blue-400/10', avatarBorder: 'border-blue-400/50', text: 'text-blue-400' },
  SPECTATOR: { avatarBg: 'bg-gradient-to-br from-gray-400/30 to-gray-400/10', avatarBorder: 'border-gray-400/50', text: 'text-gray-400' },
}

const DEFAULT_THEME = { avatarBg: 'bg-gradient-to-br from-gray-400/30 to-gray-400/10', avatarBorder: 'border-gray-400/50', text: 'text-gray-400' }

export function PlayerTable(props: PlayerTableProps) {
  return (
    <div class="bg-[#0a0c14]/90 border border-white/10 rounded-xl min-w-[220px] h-[400px] max-w-[280px] backdrop-blur-md overflow-scroll shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      {/* Header */}
      <div class="px-3.5 py-2.5 border-b border-white/10 flex items-center gap-2">
        <span class="text-[13px] text-gray-400 font-semibold tracking-[0.05em] uppercase">
          Jogadores
        </span>
        <span class="ml-auto bg-blue-400/15 text-blue-400 rounded-full px-2 py-0.5 text-[11px] font-bold">
          {props.players.length}
        </span>
      </div>

      {/* Player rows */}
      <div class="py-1.5">
        <For
          each={props.players}
          fallback={
            <div class="px-3.5 py-3 text-gray-500 text-xs text-center">
              Nenhum jogador conectado
            </div>
          }
        >
          {(player) => {
            const theme = ROLE_THEME[player.role] || DEFAULT_THEME
            return (
              <div class="flex items-center gap-2.5 px-3.5 py-[7px] transition-colors duration-150 hover:bg-white/5 player-row">
                {/* Avatar placeholder */}
                <div class={`w-7 h-7 rounded-full border-[1.5px] flex items-center justify-center text-xs font-bold shrink-0 ${theme.avatarBg} ${theme.avatarBorder} ${theme.text}`}>
                  {player.name.charAt(0).toUpperCase()}
                </div>

                {/* Name + role */}
                <div class="min-w-0 flex-1">
                  <div class="text-slate-100 text-[13px] font-semibold truncate">
                    {player.name}
                  </div>
                  <div class={`${theme.text} text-[10px] font-medium uppercase tracking-[0.04em]`}>
                    {ROLE_LABELS[player.role] ?? player.role}
                  </div>
                </div>

                {/* Online indicator */}
                <div class="w-[7px] h-[7px] rounded-full bg-green-500 shadow-[0_0_6px_#22c55e] shrink-0" />
              </div>
            )
          }}
        </For>
      </div>
    </div>
  )
}
