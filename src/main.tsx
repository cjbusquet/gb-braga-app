import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

// A previously reported "stale UI" bug traced back to the service worker
// (generateSW mode) letting an already-open tab keep running an old JS
// bundle indefinitely — skipWaiting/clientsClaim hand control to the new SW,
// but React doesn't remount itself, so nothing actually changes on screen
// until a real reload happens. Forcing that reload once, right when the new
// SW takes over, is what makes deploys actually show up for open tabs.
if ('serviceWorker' in navigator) {
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return
    reloading = true
    window.location.reload()
  })
}

const updateSW = registerSW({ immediate: true })
// Catch updates on tabs left open for a long time, not just on next visit.
setInterval(() => { updateSW() }, 60 * 60 * 1000)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
