import { TOUR_KEY } from '../components/tour.js'

const SESSIONS_KEY = 'dma_sessions'
const NOTES_KEY = 'dma_notes'
export const GROQ_KEY_STORAGE = 'dma_groq_key'

export function renderSettings(container, navigate) {
  const currentKey = localStorage.getItem(GROQ_KEY_STORAGE) || ''

  container.innerHTML = `
    <div class="page-layout">
      <header class="topbar">
        <button class="btn btn-ghost btn-sm" id="btn-back">← Back</button>
        <span class="topbar-title">Settings</span>
      </header>

      <main class="page-main narrow">
        <section class="settings-section">
          <h2>AI Provider</h2>
          <p class="settings-help">
            By default, suggestions use Pollinations.ai, which is free and keyless but shared across
            many users and can hit rate limits. For reliable access, add a free Groq API key below.
            Sign up at <strong>console.groq.com</strong> — no credit card required.
          </p>
          <div class="form-group">
            <label for="groq-key">Groq API Key <span class="optional">(optional)</span></label>
            <div class="input-row">
              <input
                type="password"
                id="groq-key"
                value="${escAttr(currentKey)}"
                placeholder="gsk_..."
                autocomplete="off"
              />
              <button type="button" class="btn btn-ghost btn-sm" id="toggle-vis">Show</button>
            </div>
          </div>
          <button class="btn btn-primary btn-sm" id="btn-save-key">Save Key</button>
        </section>

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

  container.querySelector('#toggle-vis').addEventListener('click', btn => {
    const input = container.querySelector('#groq-key')
    if (input.type === 'password') { input.type = 'text'; btn.target.textContent = 'Hide' }
    else { input.type = 'password'; btn.target.textContent = 'Show' }
  })

  container.querySelector('#btn-save-key').addEventListener('click', () => {
    const key = container.querySelector('#groq-key').value.trim()
    if (key) localStorage.setItem(GROQ_KEY_STORAGE, key)
    else localStorage.removeItem(GROQ_KEY_STORAGE)
    msgEl.textContent = key ? 'Groq key saved. AI will now use Groq.' : 'Key cleared. Falling back to Pollinations.'
    msgEl.className = 'message-box success'
    setTimeout(() => (msgEl.className = 'message-box hidden'), 3000)
  })

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

function escAttr(str) {
  if (!str) return ''
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}
