import { getSupabase, getUserSessions } from '../supabase.js'
import { appState } from '../state.js'

export async function renderDashboard(container, navigate) {
  container.innerHTML = `
    <div class="page-layout">
      <header class="topbar">
        <div class="topbar-brand">
          <span class="logo-mark">▶</span>
          <span class="topbar-title">Director Margin AI</span>
        </div>
        <nav class="topbar-nav">
          <button class="btn btn-ghost btn-sm" id="btn-settings">Settings</button>
          <button class="btn btn-ghost btn-sm" id="btn-logout">Logout</button>
        </nav>
      </header>

      <main class="page-main">
        <div class="page-heading">
          <h2>Your Productions</h2>
          <button class="btn btn-primary" id="btn-new-session">+ New Session</button>
        </div>

        <div id="sessions-loading" class="loading-state">Loading sessions…</div>
        <div id="sessions-error" class="message-box error hidden"></div>
        <div id="sessions-grid" class="sessions-grid hidden"></div>
        <div id="sessions-empty" class="empty-state hidden">
          <p>No sessions yet.</p>
          <p class="muted">Hit <strong>New Session</strong> to start your first rehearsal.</p>
        </div>
      </main>
    </div>
  `

  container.querySelector('#btn-settings').addEventListener('click', () => navigate('#settings'))
  container.querySelector('#btn-new-session').addEventListener('click', () => navigate('#new-session'))

  container.querySelector('#btn-logout').addEventListener('click', async () => {
    try {
      const sb = getSupabase()
      await sb.auth.signOut()
    } catch (_) {}
    appState.currentSession = null
    navigate('#login')
  })

  const loadingEl = container.querySelector('#sessions-loading')
  const errorEl = container.querySelector('#sessions-error')
  const gridEl = container.querySelector('#sessions-grid')
  const emptyEl = container.querySelector('#sessions-empty')

  try {
    const sessions = await getUserSessions()
    loadingEl.classList.add('hidden')

    if (!sessions.length) {
      emptyEl.classList.remove('hidden')
      return
    }

    gridEl.classList.remove('hidden')
    gridEl.innerHTML = sessions.map(s => {
      const date = new Date(s.created_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
      return `
        <div class="session-card"
          data-id="${s.id}"
          data-name="${escAttr(s.production_name)}"
          data-script="${escAttr(s.script_name || '')}">
          <div class="session-card-body">
            <h3 class="session-name">${esc(s.production_name)}</h3>
            ${s.script_name ? `<p class="session-script">${esc(s.script_name)}</p>` : ''}
          </div>
          <div class="session-card-foot">
            <span class="meta-badge">${date}</span>
            <span class="meta-badge">${s.noteCount} note${s.noteCount !== 1 ? 's' : ''}</span>
            <button class="btn btn-secondary btn-sm view-btn">View Notes</button>
          </div>
        </div>
      `
    }).join('')

    gridEl.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const card = e.target.closest('.session-card')
        appState.currentSession = {
          id: card.dataset.id,
          productionName: card.dataset.name,
          scriptName: card.dataset.script,
        }
        appState.parsedScript = null
        appState.sessionNotes = []
        navigate('#end-session')
      })
    })
  } catch (err) {
    loadingEl.classList.add('hidden')
    errorEl.textContent = `Failed to load sessions: ${err.message}`
    errorEl.classList.remove('hidden')
  }
}

function esc(str) {
  if (!str) return ''
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escAttr(str) {
  if (!str) return ''
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}
