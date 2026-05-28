import { getSettings, saveSettings } from '../settings.js'

export function renderSettings(container, navigate) {
  const current = getSettings()

  container.innerHTML = `
    <div class="page-layout">
      <header class="topbar">
        <button class="btn btn-ghost btn-sm" id="btn-back">← Back</button>
        <span class="topbar-title">Settings</span>
      </header>

      <main class="page-main narrow">
        <form id="settings-form" novalidate>
          <section class="settings-section">
            <h2>HuggingFace</h2>
            <p class="settings-help">
              Get your free token from
              <strong>huggingface.co → Settings → Access Tokens</strong>.
              A read-scope token is all you need.
            </p>

            <div class="form-group">
              <label for="hf-key">API Token</label>
              <div class="input-row">
                <input
                  type="password"
                  id="hf-key"
                  value="${escAttr(current.hfApiKey)}"
                  placeholder="hf_…"
                  autocomplete="off"
                />
                <button type="button" class="btn btn-ghost btn-sm toggle-vis" data-target="hf-key">Show</button>
              </div>
            </div>
          </section>

          <div id="settings-msg" class="message-box hidden"></div>
          <button type="submit" class="btn btn-primary btn-full">Save</button>
        </form>
      </main>
    </div>
  `

  container.querySelector('#btn-back').addEventListener('click', () => {
    if (window.history.length > 1) window.history.back()
    else navigate('#dashboard')
  })

  container.querySelector('.toggle-vis').addEventListener('click', btn => {
    const input = container.querySelector('#hf-key')
    if (input.type === 'password') { input.type = 'text'; btn.target.textContent = 'Hide' }
    else { input.type = 'password'; btn.target.textContent = 'Show' }
  })

  const msgEl = container.querySelector('#settings-msg')
  container.querySelector('#settings-form').addEventListener('submit', e => {
    e.preventDefault()
    const hfApiKey = container.querySelector('#hf-key').value.trim()
    try {
      saveSettings({ hfApiKey })
      msgEl.textContent = 'Saved.'
      msgEl.className = 'message-box success'
      setTimeout(() => (msgEl.className = 'message-box hidden'), 2500)
    } catch (err) {
      msgEl.textContent = `Save failed: ${err.message}`
      msgEl.className = 'message-box error'
    }
  })
}

function escAttr(str) {
  if (!str) return ''
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}
