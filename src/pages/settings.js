import { TOUR_KEY } from '../components/tour.js'

const SESSIONS_KEY = 'dma_sessions'
const NOTES_KEY = 'dma_notes'

export function renderSettings(container, navigate) {
  container.innerHTML = `
    <div class="page-layout">
      <header class="topbar">
        <button class="btn btn-ghost btn-sm" id="btn-back">← Back</button>
        <span class="topbar-title">Settings</span>
      </header>

      <main class="page-main narrow">
        <section class="settings-section">
          <h2>Data</h2>
          <p class="settings-help">
            All sessions and notes are stored locally in your browser. Nothing is sent to a server.
          </p>
          <div class="settings-actions">
            <button class="btn btn-ghost btn-sm" id="btn-reset-tour">Replay walkthrough tour</button>
            <button class="btn btn-danger btn-sm" id="btn-clear-data">Clear all sessions and notes</button>
          </div>
        </section>

        <div id="settings-msg" class="message-box hidden"></div>
      </main>
    </div>
  `

  container.querySelector('#btn-back').addEventListener('click', () => {
    if (window.history.length > 1) window.history.back()
    else navigate('#dashboard')
  })

  const msgEl = container.querySelector('#settings-msg')

  container.querySelector('#btn-reset-tour').addEventListener('click', () => {
    localStorage.removeItem(TOUR_KEY)
    msgEl.textContent = 'Tour reset. It will appear next time you visit the dashboard.'
    msgEl.className = 'message-box success'
    setTimeout(() => (msgEl.className = 'message-box hidden'), 3000)
  })

  container.querySelector('#btn-clear-data').addEventListener('click', () => {
    if (!confirm('Delete all sessions and notes? This cannot be undone.')) return
    localStorage.removeItem(SESSIONS_KEY)
    localStorage.removeItem(NOTES_KEY)
    msgEl.textContent = 'All data cleared.'
    msgEl.className = 'message-box success'
    setTimeout(() => (msgEl.className = 'message-box hidden'), 2500)
  })
}
