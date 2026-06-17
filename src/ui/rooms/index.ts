import { bg } from '@/assets'
import { html } from '@/lib/utils/html'

export class RoomsUI {
  private element: HTMLElement
  private onRoomClick: (roomId: string) => void
  private onLeave: () => void
  private onRefresh: () => void

  constructor(
    container: HTMLElement,
    onRoomClick: (roomId: string) => void,
    onLeave: () => void,
    onRefresh: () => void,
    onCreateRoomSubmit: (data: any) => void
  ) {
    this.onRoomClick = onRoomClick
    this.onLeave = onLeave
    this.onRefresh = onRefresh

    this.element = html`
      <div 
        class="flex flex-col items-center justify-start min-w-screen min-h-screen bg-repeat bg-cover pt-10" 
        style="background-image: url('${bg}'); background-color: rgba(0,0,0,0.7); background-blend-mode: overlay;"
      >
        <h1 class="text-5xl font-bold text-white tracking-widest drop-shadow-xl mb-8">
          LOBBY
        </h1>
        
        <div class="bg-gray-900/80 p-8 rounded-2xl shadow-2xl border border-gray-700 w-[800px] max-w-[90vw] backdrop-blur-xl">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-semibold text-gray-200">Available Rooms</h2>
            <div class="flex gap-3">
              <button id="create-btn" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium shadow-md">
                Criar Sala
              </button>
              <button id="refresh-btn" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium">
                Refresh
              </button>
              <button id="leave-btn" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium shadow-md">
                Sair
              </button>
            </div>
          </div>
          
          <div id="rooms-grid" class="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            <!-- Loading state -->
            <div class="col-span-full flex justify-center items-center py-10">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
          </div>
        </div>
      <!-- Create Room Modal -->
      <div id="create-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm hidden flex items-center justify-center z-50">
        <div class="bg-gray-800 p-6 rounded-xl border border-gray-700 w-[400px] shadow-2xl">
          <h3 class="text-xl font-bold text-white mb-4">Nova Sala</h3>
          <form id="create-form" class="flex flex-col gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1">Nome</label>
              <input type="text" name="name" class="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500" required>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1">Visibilidade</label>
              <select name="visibility" class="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500">
                <option value="PUBLIC">Público</option>
                <option value="PRIVATE">Privado</option>
                <option value="ONLY FRIENDS">Apenas Amigos</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-400 mb-1">Velocidade</label>
                <input type="number" name="speed" value="1" min="1" class="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500" required>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-400 mb-1">Máx Jogadores</label>
                <input type="number" name="max_players" value="10" min="2" max="100" class="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500" required>
              </div>
            </div>
            <div class="flex justify-end gap-3 mt-4">
              <button type="button" id="cancel-create-btn" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium">
                Cancelar
              </button>
              <button type="submit" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium shadow-md">
                Criar
              </button>
            </div>
          </form>
        </div>
      </div>
      </div>
    `
    
    container.appendChild(this.element)

    const leaveBtn = this.element.querySelector('#leave-btn') as HTMLButtonElement
    if (leaveBtn) {
      leaveBtn.onclick = () => this.onLeave()
    }

    const refreshBtn = this.element.querySelector('#refresh-btn') as HTMLButtonElement
    if (refreshBtn) {
      refreshBtn.onclick = () => {
        refreshBtn.innerHTML = '<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block"></div>'
        this.onRefresh()
      }
    }

    const createBtn = this.element.querySelector('#create-btn') as HTMLButtonElement
    const createModal = this.element.querySelector('#create-modal') as HTMLDivElement
    const cancelCreateBtn = this.element.querySelector('#cancel-create-btn') as HTMLButtonElement
    const createForm = this.element.querySelector('#create-form') as HTMLFormElement

    if (createBtn && createModal) {
      createBtn.onclick = () => {
        createModal.classList.remove('hidden')
      }
    }

    if (cancelCreateBtn && createModal) {
      cancelCreateBtn.onclick = () => {
        createModal.classList.add('hidden')
      }
    }

    if (createForm && createModal) {
      createForm.onsubmit = (e) => {
        e.preventDefault()
        const formData = new FormData(createForm)
        const data = {
          name: formData.get('name') as string,
          visibility: formData.get('visibility') as string,
          map_id: 1,
          speed: parseInt(formData.get('speed') as string, 10),
          save_size_limit: 1048576,
          max_players: parseInt(formData.get('max_players') as string, 10),
        }
        onCreateRoomSubmit(data)
        createModal.classList.add('hidden')
        createForm.reset()
      }
    }
  }

  public updateList(rooms: any[]): void {
    const refreshBtn = this.element.querySelector('#refresh-btn') as HTMLButtonElement
    if (refreshBtn) {
      refreshBtn.innerHTML = 'Refresh'
    }

    const grid = this.element.querySelector('#rooms-grid') as HTMLDivElement
    grid.innerHTML = ''

    if (!rooms || rooms.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full text-center py-10 text-gray-400">
          <p class="text-lg">No waiting rooms available.</p>
          <p class="text-sm mt-2">Try refreshing or create a new one.</p>
        </div>
      `
      return
    }

    rooms.forEach(room => {
      const card = html`
        <div class="bg-gray-800 border border-gray-600 p-5 rounded-xl cursor-pointer transition-all flex flex-col gap-2">
          <div class="flex justify-between items-center">
            <div class="flex flex-col">
              <span class="text-lg font-bold text-indigo-400">${room.name || `Room #${room.room_id.substring(0, 8)}`}</span>
            </div>
            <span class="px-2 py-1 bg-green-900/50 text-green-400 text-xs rounded border border-green-700">
              ${room.status}
            </span>
          </div>
          <div class="flex justify-between text-sm text-gray-400 mt-2">
            <span>Players: <strong class="text-white">${room.player_count}/${room.max_players || 10}</strong></span>
            <span>Speed: <strong class="text-white">${room.speed}x</strong></span>
          </div>

          <div class="flex flex-col">
            <div class="text-xs text-gray-500 mt-1">
              Created: ${new Date(room.created_at).toLocaleDateString()} | ${new Date(room.created_at).toLocaleTimeString()}
            </div>
            <div class="text-xs text-gray-500 mt-1">
              Id: ${room.room_id}
            </div>
          </div>
        </div>
      `

      card.onclick = () => this.onRoomClick(room.room_id)
      grid.appendChild(card)
    })
  }

  public dispose(): void {
    this.element.remove()
  }
}
