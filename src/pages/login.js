import { getSupabase } from '../supabase.js'

export function renderLogin(container, navigate) {
  container.innerHTML = `
    <div class="auth-wrapper">
      <div class="auth-card">
        <div class="auth-logo">
          <span class="logo-mark">▶</span>
          <h1 class="app-title">Director Margin AI</h1>
        </div>
        <p class="app-subtitle">Rehearsal notes, intelligently organized.</p>

        <div class="tab-group">
          <button class="tab active" id="tab-login">Login</button>
          <button class="tab" id="tab-register">Register</button>
        </div>

        <form id="auth-form" novalidate>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" required placeholder="you@example.com" autocomplete="email" />
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" required placeholder="••••••••" autocomplete="current-password" />
          </div>
          <div id="auth-message" class="message-box hidden"></div>
          <button type="submit" class="btn btn-primary btn-full" id="auth-submit">Login</button>
        </form>

        <div class="auth-footer">
          <button class="btn-link" id="goto-settings">Configure API Keys →</button>
        </div>
      </div>
    </div>
  `

  let mode = 'login'
  const form = container.querySelector('#auth-form')
  const msgEl = container.querySelector('#auth-message')
  const submitBtn = container.querySelector('#auth-submit')
  const tabLogin = container.querySelector('#tab-login')
  const tabRegister = container.querySelector('#tab-register')

  function setMessage(text, type = 'error') {
    msgEl.textContent = text
    msgEl.className = `message-box ${type}`
  }

  tabLogin.addEventListener('click', () => {
    mode = 'login'
    tabLogin.classList.add('active')
    tabRegister.classList.remove('active')
    submitBtn.textContent = 'Login'
    msgEl.className = 'message-box hidden'
  })

  tabRegister.addEventListener('click', () => {
    mode = 'register'
    tabRegister.classList.add('active')
    tabLogin.classList.remove('active')
    submitBtn.textContent = 'Create Account'
    msgEl.className = 'message-box hidden'
  })

  container.querySelector('#goto-settings').addEventListener('click', () => navigate('#settings'))

  form.addEventListener('submit', async e => {
    e.preventDefault()
    msgEl.className = 'message-box hidden'
    submitBtn.disabled = true
    submitBtn.textContent = mode === 'login' ? 'Logging in…' : 'Creating account…'

    const email = container.querySelector('#email').value.trim()
    const password = container.querySelector('#password').value

    if (!email || !password) {
      setMessage('Please fill in all fields.')
      submitBtn.disabled = false
      submitBtn.textContent = mode === 'login' ? 'Login' : 'Create Account'
      return
    }

    try {
      const sb = getSupabase()
      let result
      if (mode === 'login') {
        result = await sb.auth.signInWithPassword({ email, password })
      } else {
        result = await sb.auth.signUp({ email, password })
      }

      if (result.error) throw result.error

      if (mode === 'register' && !result.data.session) {
        setMessage('Account created! Check your email to confirm, then log in.', 'success')
      } else {
        navigate('#dashboard')
      }
    } catch (err) {
      setMessage(err.message)
    } finally {
      submitBtn.disabled = false
      submitBtn.textContent = mode === 'login' ? 'Login' : 'Create Account'
    }
  })
}
