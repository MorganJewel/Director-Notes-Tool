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
            <h2>Supabase</h2>
            <p class="settings-help">
              Find these in your Supabase project →
              <strong>Settings → API</strong>.
            </p>

            <div class="form-group">
              <label for="sb-url">Project URL</label>
              <input
                type="url"
                id="sb-url"
                value="${escAttr(current.supabaseUrl)}"
                placeholder="https://xxxxxxxxxxxx.supabase.co"
                autocomplete="off"
              />
            </div>

            <div class="form-group">
              <label for="sb-key">Anon / Public Key</label>
              <div class="input-row">
                <input
                  type="password"
                  id="sb-key"
                  value="${escAttr(current.supabaseAnonKey)}"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…"
                  autocomplete="off"
                />
                <button type="button" class="btn btn-ghost btn-sm toggle-vis" data-target="sb-key">Show</button>
              </div>
            </div>
          </section>

          <section class="settings-section">
            <h2>HuggingFace</h2>
            <p class="settings-help">
              Get your token from
              <strong>huggingface.co → Settings → Access Tokens</strong>.
              A free account with a read token is sufficient.
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

          <button type="submit" class="btn btn-primary btn-full">Save Settings</button>
        </form>
      </main>
    </div>
  `

  container.querySelector('#btn-back').addEventListener('click', () => {
    if (window.history.length > 1) window.history.back()
    else navigate('#login')
  })

  container.querySelectorAll('.toggle-vis').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = container.querySelector(`#${btn.dataset.target}`)
      if (input.type === 'password') {
        input.type = 'text'
        btn.textContent = 'Hide'
      } else {
        input.type = 'password'
        btn.textContent = 'Show'
      }
    })
  })

  const form = container.querySelector('#settings-form')
  const msgEl = container.querySelector('#settings-msg')

  form.addEventListener('submit', e => {
    e.preventDefault()
    const supabaseUrl = container.querySelector('#sb-url').value.trim()
    const supabaseAnonKey = container.querySelector('#sb-key').value.trim()
    const hfApiKey = container.querySelector('#hf-key').value.trim()

    try {
      saveSettings({ supabaseUrl, supabaseAnonKey, hfApiKey })
      msgEl.textContent = 'Settings saved.'
      msgEl.className = 'message-box success'
      setTimeout(() => (msgEl.className = 'message-box hidden'), 3000)
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
