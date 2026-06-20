import { useNavigate } from '@solidjs/router'
import { createSignal, Show } from 'solid-js'

import { bg } from '@/assets'
import { CreateRoomModal } from '@/components/features/rooms/create-room-modal'
import { RoomList } from '@/components/features/rooms/room-list'
import { Button } from '@/components/ui/button'
import { useLogout } from '@/hooks/auth/useAuthMutations'
import { useCreateRoom } from '@/hooks/rooms/useRoomMutations'
import { useLobbyWs } from '@/hooks/rooms/use-lobby-ws'

export function LobbyPage() {
  const navigate = useNavigate()
  const [showCreateModal, setShowCreateModal] = createSignal(false)
  const { rooms, isLoading, isRefreshing, fetchRooms } = useLobbyWs()
  const { mutate: logoutMutate } = useLogout()

  const { mutate: createRoomMutate, resource: createRoomResource } = useCreateRoom((roomId) => {
    setShowCreateModal(false)
    navigate(`/room/${roomId}`)
  })

  return (
    <div
      class="flex flex-col items-center justify-center min-h-screen p-6 bg-repeat text-white"
      style={{ 'background-image': `url('${bg}')` }}
    >
      <div class="w-full max-w-4xl bg-gray-900 p-6 rounded shadow border border-gray-700 mt-10">
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-2xl font-bold">Lobby</h1>
          <div class="flex gap-2">
            <Button onClick={() => setShowCreateModal(true)}>Criar Sala</Button>
            <Button onClick={fetchRooms} disabled={isRefreshing()}>
              <Show when={!isRefreshing()} fallback="Refreshing...">
                Refresh
              </Show>
            </Button>
            <Button class="bg-red-600 hover:bg-red-700" onClick={() => logoutMutate()}>
              Sair
            </Button>
          </div>
        </div>

        <RoomList
          rooms={rooms()}
          isLoading={isLoading()}
          onJoinRoom={(id) => navigate(`/room/${id}`)}
        />
      </div>

      <CreateRoomModal
        isOpen={showCreateModal()}
        isLoading={createRoomResource.loading}
        errorMessage={
          createRoomResource.error?.message || (createRoomResource.error ? 'Error' : undefined)
        }
        onClose={() => setShowCreateModal(false)}
        onSubmit={(data) => createRoomMutate(data)}
      />
    </div>
  )
}
