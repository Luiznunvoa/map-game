import { bg } from '@/assets'
import { html } from '@/lib/utils/html'

export class MainMenuUI {
  private element: HTMLElement
  private onLogin: (email: string, pass: string) => Promise<void>
  private onStart: () => void

  constructor(
    container: HTMLElement, 
    onLogin: (email: string, pass: string) => Promise<void>, 
    onStart: () => void
  ) {
    this.onLogin = onLogin
    this.onStart = onStart

    this.element = html`
      <div 
        class="flex flex-col items-center justify-center min-w-screen min-h-screen bg-repeat bg-cover backdrop-blur-md" 
        style="background-image: url('${bg}'); background-color: rgba(0,0,0,0.6); background-blend-mode: overlay;"
      >
        <div class="bg-gray-900/80 p-10 rounded-2xl shadow-2xl border border-gray-700 w-96 backdrop-blur-xl">
          <h1 class="text-4xl font-bold tracking-wider mb-8 text-white drop-shadow-lg text-center">
            Map Game
          </h1>

          <div id="login-form-container" class="flex flex-col gap-4">
            <input 
              id="email-input" 
              type="email" 
              placeholder="Email" 
              class="px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            <input 
              id="password-input" 
              type="password" 
              placeholder="Password" 
              class="px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            <button 
              id="login-btn" 
              class="mt-4 px-10 py-3 text-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all duration-200 rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.5)]"
            >
              Login
            </button>
            <p id="error-msg" class="text-red-400 text-sm text-center hidden mt-2"></p>
          </div>

          <div id="start-game-container" class="hidden flex-col items-center gap-4">
            <p class="text-green-400 text-center font-semibold mb-2">Logged in successfully!</p>
            <button 
              id="start-btn" 
              class="w-full px-10 py-4 text-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-500 hover:scale-105 active:scale-95 transition-all duration-200 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.5)]"
            >
              Start Game
            </button>
          </div>
        </div>
      </div>
    `
    
    this.setupListeners()
    container.appendChild(this.element)
  }

  private setupListeners() {
    const loginBtn = this.element.querySelector('#login-btn') as HTMLButtonElement
    const startBtn = this.element.querySelector('#start-btn') as HTMLButtonElement
    const emailInput = this.element.querySelector('#email-input') as HTMLInputElement
    const passInput = this.element.querySelector('#password-input') as HTMLInputElement
    const errorMsg = this.element.querySelector('#error-msg') as HTMLParagraphElement

    loginBtn.onclick = async () => {
      loginBtn.disabled = true
      loginBtn.innerText = 'Loading...'
      errorMsg.classList.add('hidden')
      
      try {
        await this.onLogin(emailInput.value, passInput.value)
      } catch (err: any) {
        errorMsg.innerText = err.message || 'Login failed. Please try again.'
        errorMsg.classList.remove('hidden')
      } finally {
        loginBtn.disabled = false
        loginBtn.innerText = 'Login'
      }
    }

    startBtn.onclick = this.onStart
  }

  public showStartGame(): void {
    const loginForm = this.element.querySelector('#login-form-container') as HTMLDivElement
    const startContainer = this.element.querySelector('#start-game-container') as HTMLDivElement

    loginForm.classList.add('hidden')
    loginForm.classList.remove('flex')
    
    startContainer.classList.remove('hidden')
    startContainer.classList.add('flex')
  }

  public dispose(): void {
    this.element.remove()
  }
}
