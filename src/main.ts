import './style.css'

import { Game } from '@/game'
 
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <section id="scene-container"></section>
`
const container = document.querySelector<HTMLElement>('#scene-container')!

const game = new Game(container)
 
await game.start()
 
if (import.meta.hot) {
  import.meta.hot.dispose(async () => {
    await game.destroy()
  })
}
