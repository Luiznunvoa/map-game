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

const ROLE_COLORS: Record<string, string> = {
  HOST: '#f59e0b',   // amber
  GUEST: '#60a5fa',  // blue
  SPECTATOR: '#9ca3af', // gray
}

export function PlayerTable(props: PlayerTableProps) {
  return (
    <div
      style={{
        background: 'rgba(10, 12, 20, 0.88)',
        border: '1px solid rgba(255,255,255,0.1)',
        'border-radius': '12px',
        'min-width': '220px',
        'max-width': '280px',
        'backdrop-filter': 'blur(12px)',
        overflow: 'hidden',
        'box-shadow': '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 14px',
          'border-bottom': '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          'align-items': 'center',
          gap: '8px',
        }}
      >
        <span style={{ 'font-size': '13px', color: '#9ca3af', 'font-weight': '600', 'letter-spacing': '0.05em', 'text-transform': 'uppercase' }}>
          Jogadores
        </span>
        <span
          style={{
            'margin-left': 'auto',
            background: 'rgba(96,165,250,0.15)',
            color: '#60a5fa',
            'border-radius': '999px',
            padding: '2px 8px',
            'font-size': '11px',
            'font-weight': '700',
          }}
        >
          {props.players.length}
        </span>
      </div>

      {/* Player rows */}
      <div style={{ padding: '6px 0' }}>
        <For
          each={props.players}
          fallback={
            <div style={{ padding: '12px 14px', color: '#6b7280', 'font-size': '12px', 'text-align': 'center' }}>
              Nenhum jogador conectado
            </div>
          }
        >
          {(player) => (
            <div
              style={{
                display: 'flex',
                'align-items': 'center',
                gap: '10px',
                padding: '7px 14px',
                transition: 'background 0.15s',
              }}
              class="player-row"
            >
              {/* Avatar placeholder */}
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  'border-radius': '50%',
                  background: `linear-gradient(135deg, ${ROLE_COLORS[player.role] ?? '#9ca3af'}44, ${ROLE_COLORS[player.role] ?? '#9ca3af'}22)`,
                  border: `1.5px solid ${ROLE_COLORS[player.role] ?? '#9ca3af'}88`,
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                  'font-size': '12px',
                  color: ROLE_COLORS[player.role] ?? '#9ca3af',
                  'font-weight': '700',
                  'flex-shrink': '0',
                }}
              >
                {player.name.charAt(0).toUpperCase()}
              </div>

              {/* Name + role */}
              <div style={{ 'min-width': '0', flex: '1' }}>
                <div
                  style={{
                    color: '#f1f5f9',
                    'font-size': '13px',
                    'font-weight': '600',
                    overflow: 'hidden',
                    'text-overflow': 'ellipsis',
                    'white-space': 'nowrap',
                  }}
                >
                  {player.name}
                </div>
                <div
                  style={{
                    color: ROLE_COLORS[player.role] ?? '#9ca3af',
                    'font-size': '10px',
                    'font-weight': '500',
                    'text-transform': 'uppercase',
                    'letter-spacing': '0.04em',
                  }}
                >
                  {ROLE_LABELS[player.role] ?? player.role}
                </div>
              </div>

              {/* Online indicator */}
              <div
                style={{
                  width: '7px',
                  height: '7px',
                  'border-radius': '50%',
                  background: '#22c55e',
                  'box-shadow': '0 0 6px #22c55e',
                  'flex-shrink': '0',
                }}
              />
            </div>
          )}
        </For>
      </div>
    </div>
  )
}
