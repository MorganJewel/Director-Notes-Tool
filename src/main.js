import { getSettings } from './settings.js'
import { getSupabase } from './supabase.js'
import { appState } from './state.js'
import { renderLogin } from './pages/login.js'
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

async function isAuthenticated() {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSettings()
    if (!supabaseUrl || !supabaseAnonKey) return false
    const sb = getSupabase()
    const { data: { user } } = await sb.auth.getUser()
    return !!user
  } catch (_) {
    return false
  }
}

async function router() {
  const hash = window.location.hash || '#login'
  const publicRoutes = new Set(['#login', '#settings'])
  app.innerHTML = ''

  if (!publicRoutes.has(hash)) {
    const authed = await isAuthenticated()
    if (!authed) {
      const { supabaseUrl, supabaseAnonKey } = getSettings()
      window.location.hash = (!supabaseUrl || !supabaseAnonKey) ? '#settings' : '#login'
      return
    }
  }

  switch (hash) {
    case '#login':
      renderLogin(app, navigate)
      break

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
      navigate('#login')
  }
}

window.addEventListener('hashchange', router)
window.addEventListener('load', router)
