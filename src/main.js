import { appState } from './state.js'
import { renderDashboard } from './pages/dashboard.js'
import { renderNewSession } from './pages/newSession.js'
import { renderRehearsal } from './pages/rehearsal.js'
import { renderEndSession } from './pages/endSession.js'
import { renderSettings } from './pages/settings.js'
import './styles/main.css'

const app = document.getElementById('app')

function navigate(hash) {
  window.location.hash = hash
}

async function router() {
  const hash = window.location.hash || '#dashboard'
  app.innerHTML = ''

  switch (hash) {
    case '#dashboard':
      await renderDashboard(app, navigate)
      break

    case '#new-session':
      renderNewSession(app, navigate)
      break

    case '#rehearsal':
      if (!appState.currentSession) { navigate('#dashboard'); return }
      renderRehearsal(app, navigate)
      break

    case '#end-session':
      if (!appState.currentSession) { navigate('#dashboard'); return }
      await renderEndSession(app, navigate)
      break

    case '#settings':
      renderSettings(app, navigate)
      break

    default:
      navigate('#dashboard')
  }
}

window.addEventListener('hashchange', router)
window.addEventListener('load', router)
