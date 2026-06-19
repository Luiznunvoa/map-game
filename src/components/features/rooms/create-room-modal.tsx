import { Show } from 'solid-js'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { CreateRoomRequest } from '@/types/room'

interface CreateRoomModalProps {
  isOpen: boolean
  isLoading: boolean
  errorMessage?: string
  onClose: () => void
  onSubmit: (data: CreateRoomRequest) => void
}

export function CreateRoomModal(props: CreateRoomModalProps) {
  const handleSubmit = (e: Event) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    props.onSubmit({
      name: formData.get('name') as string,
      visibility: formData.get('visibility') as string,
      map_id: 1,
      speed: parseInt(formData.get('speed') as string, 10),
      save_size_limit: 1048576,
      max_players: parseInt(formData.get('max_players') as string, 10),
    })
  }

  return (
    <Show when={props.isOpen}>
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
        <div class="bg-white p-6 rounded shadow w-full max-w-sm">
          <h3 class="text-lg font-bold mb-4">Nova Sala</h3>
          <form onSubmit={handleSubmit} class="flex flex-col gap-3">
            <Input type="text" name="name" placeholder="Nome" required />
            <Select name="visibility" required>
              <option value="PUBLIC">Público</option>
              <option value="PRIVATE">Privado</option>
            </Select>
            <div class="flex gap-2">
              <Input
                type="number"
                name="speed"
                value="1"
                min="1"
                placeholder="Velocidade"
                class="w-1/2"
                required
              />
              <Input
                type="number"
                name="max_players"
                value="10"
                min="2"
                max="100"
                placeholder="Máx Jogadores"
                class="w-1/2"
                required
              />
            </div>
            <Show when={props.errorMessage}>
              <p class="text-red-600 text-sm">{props.errorMessage}</p>
            </Show>
            <div class="flex justify-end gap-2 mt-4">
              <Button type="button" class="bg-gray-400 hover:bg-gray-500" onClick={props.onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={props.isLoading}>
                Criar
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Show>
  )
}
