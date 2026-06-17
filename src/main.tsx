import './style.css'
import { render } from 'solid-js/web'
import { App } from '@/App'

const appRoot = document.getElementById('app-root')
if (appRoot) {
  render(() => <App />, appRoot)
}
