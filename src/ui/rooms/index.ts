import { bg } from '@/assets'
import { html } from '@/lib/utils/html'

export class RoomsUI {
  private element: HTMLElement
  private onRoomClick: (roomId: number) => void

  constructor(container: HTMLElement, onRoomClick: (roomId: number) => void) {
    this.onRoomClick = onRoomClick

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
            <button id="refresh-btn" class="px-4 py-2 bg-indigo-600 text-white rounded-lg transition-colors text-sm font-medium">
              Refresh
            </button>
          </div>
          
          <div id="rooms-grid" class="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            <!-- Loading state -->
            <div class="col-span-full flex justify-center items-center py-10">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
          </div>
        </div>
      </div>
    `
    
    container.appendChild(this.element)
  }

  public updateList(rooms: any[]): void {
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
            <span class="text-lg font-bold text-indigo-400">Room #${room.room_id}</span>
            <span class="px-2 py-1 bg-green-900/50 text-green-400 text-xs rounded border border-green-700">
              ${room.status}
            </span>
          </div>
          <div class="flex justify-between text-sm text-gray-400 mt-2">
            <span>Players: <strong class="text-white">${room.player_count}</strong></span>
            <span>Speed: <strong class="text-white">${room.speed}x</strong></span>
          </div>
          <div class="text-xs text-gray-500 mt-1">
            Created: ${new Date(room.created_at).toLocaleTimeString()}
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
