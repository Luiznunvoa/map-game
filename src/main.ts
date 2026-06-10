import './style.css'
import { MapView } from './views/map';
 
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <section id="scene-container"></section>
`

const container = document.querySelector<HTMLElement>('#scene-container')!
const mapView = new MapView(container)
 
await mapView.mount();

(window as any).setColorMode = mapView.setColorMode.bind(mapView)
 
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    mapView.unmount()
  })
}
