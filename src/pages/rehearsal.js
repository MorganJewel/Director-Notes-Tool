import { createNote } from '../supabase.js'
import { suggestCompletion } from '../apertus.js'
import { appState } from '../state.js'

export function renderRehearsal(container, navigate) {
  const session = appState.currentSession
  const pages = appState.parsedScript || []
  let currentPage = 1

  container.innerHTML = `
    <div class="rehearsal-layout">
      <header class="rehearsal-topbar">
        <div class="rehearsal-info">
          <span class="logo-mark">▶</span>
          <span class="rehearsal-prod">${esc(session.productionName)}</span>
          <span class="live-badge">● LIVE</span>
        </div>
        <button class="btn btn-danger btn-sm" id="btn-end">End Session</button>
      </header>

      <div class="rehearsal-split">
        <!-- Script panel -->
        <div class="script-panel">
          <div class="script-nav">
            <button class="btn btn-ghost btn-sm" id="prev-page" ${pages.length === 0 ? 'disabled' : ''}>← Prev</button>
            <span class="page-label">
              Page <input type="number" id="page-jump" class="page-jump-input" value="1" min="1" ${pages.length > 0 ? `max="${pages.length}"` : ''} />
              ${pages.length > 0 ? `<span class="page-total">/ ${pages.length}</span>` : ''}
            </span>
            <button class="btn btn-ghost btn-sm" id="next-page" ${pages.length === 0 ? 'disabled' : ''}>Next →</button>
          </div>

          <div id="script-content" class="script-content">
            ${pages.length > 0 ? renderScriptPage(pages, 1) : noScriptPlaceholder()}
          </div>
        </div>

        <!-- Notes panel -->
        <div class="notes-panel">
          <div class="notes-panel-header">
            <h2>New Note</h2>
            <span class="notes-count-badge" id="notes-count">0 notes</span>
          </div>

          <div class="note-form">
            <div class="form-group">
              <label for="note-content">Note Content</label>
              <textarea
                id="note-content"
                rows="5"
                placeholder="Start typing your directorial note…"
              ></textarea>
            </div>

            <div class="suggestions-area hidden" id="suggestions-area">
              <p class="suggestions-label">Click a suggestion to append it:</p>
              <div id="suggestions-list" class="suggestions-list"></div>
            </div>

            <div class="note-meta-grid">
              <div class="form-group">
                <label for="note-page">Page</label>
                <input type="number" id="note-page" value="1" min="1" />
              </div>
              <div class="form-group">
                <label for="note-scene">Scene</label>
                <input type="text" id="note-scene" placeholder="Act 1, Sc 2" />
              </div>
              <div class="form-group">
                <label for="note-actor">Actor</label>
                <input type="text" id="note-actor" placeholder="Name" />
              </div>
              <div class="form-group">
                <label for="note-cat">Category</label>
                <select id="note-cat">
                  <option value="">— none —</option>
                  <option value="timing">Timing</option>
                  <option value="intention">Intention</option>
                  <option value="physical">Physical</option>
                  <option value="relationship">Relationship</option>
                  <option value="technical">Technical</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div id="note-error" class="message-box error hidden"></div>
            <div id="note-success" class="message-box success hidden"></div>

            <div class="note-actions">
              <button class="btn btn-secondary" id="btn-suggest">Suggest Completion</button>
              <button class="btn btn-primary" id="btn-save">Complete Note</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `

  // ── Navigation ──────────────────────────────────────────────────────────────
  const scriptContent = container.querySelector('#script-content')
  const pageJump = container.querySelector('#page-jump')
  const notePageInput = container.querySelector('#note-page')

  function goToPage(n) {
    if (pages.length === 0) return
    const clamped = Math.max(1, Math.min(pages.length, n))
    currentPage = clamped
    pageJump.value = clamped
    notePageInput.value = clamped
    scriptContent.innerHTML = renderScriptPage(pages, clamped)
  }

  container.querySelector('#prev-page').addEventListener('click', () => goToPage(currentPage - 1))
  container.querySelector('#next-page').addEventListener('click', () => goToPage(currentPage + 1))

  pageJump.addEventListener('change', () => goToPage(parseInt(pageJump.value) || 1))

  // Keep note page field in sync when user manually changes page jump
  notePageInput.addEventListener('change', () => {
    const n = parseInt(notePageInput.value) || 1
    if (pages.length > 0) goToPage(n)
    else currentPage = n
  })

  // ── End session ─────────────────────────────────────────────────────────────
  container.querySelector('#btn-end').addEventListener('click', () => navigate('#end-session'))

  // ── Suggest completion ───────────────────────────────────────────────────────
  const noteContentEl = container.querySelector('#note-content')
  const suggestionsArea = container.querySelector('#suggestions-area')
  const suggestionsList = container.querySelector('#suggestions-list')
  const noteErrorEl = container.querySelector('#note-error')
  const noteSuccessEl = container.querySelector('#note-success')
  const suggestBtn = container.querySelector('#btn-suggest')
  const saveBtn = container.querySelector('#btn-save')
  const notesCountEl = container.querySelector('#notes-count')

  suggestBtn.addEventListener('click', async () => {
    const content = noteContentEl.value.trim()
    if (!content) {
      showError('Write some of the note first before requesting suggestions.')
      return
    }

    clearMessages()
    suggestBtn.disabled = true
    suggestBtn.textContent = 'Thinking…'
    suggestionsArea.classList.add('hidden')

    try {
      const suggestions = await suggestCompletion(content)
      suggestionsList.innerHTML = suggestions
        .map(s => `<button class="suggestion-chip">${esc(s)}</button>`)
        .join('')
      suggestionsArea.classList.remove('hidden')

      suggestionsList.querySelectorAll('.suggestion-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          const current = noteContentEl.value.trimEnd()
          const addition = chip.textContent.trimStart()
          const separator = current.endsWith('.') || current.endsWith('?') || current.endsWith('!') ? ' ' : ' '
          noteContentEl.value = current + separator + addition
          suggestionsArea.classList.add('hidden')
          noteContentEl.focus()
        })
      })
    } catch (err) {
      showError(`Suggestion failed: ${err.message}`)
    } finally {
      suggestBtn.disabled = false
      suggestBtn.textContent = 'Suggest Completion'
    }
  })

  // ── Save note ────────────────────────────────────────────────────────────────
  saveBtn.addEventListener('click', async () => {
    const content = noteContentEl.value.trim()
    if (!content) {
      showError('Note content cannot be empty.')
      return
    }

    clearMessages()
    saveBtn.disabled = true
    saveBtn.textContent = 'Saving…'

    const pageNum = parseInt(notePageInput.value) || currentPage
    const lineSnippet = getLineSnippet(pages, pageNum)

    const noteData = {
      content,
      page_number: pageNum,
      scene: container.querySelector('#note-scene').value.trim() || null,
      actor: container.querySelector('#note-actor').value.trim() || null,
      emotional_category: container.querySelector('#note-cat').value || null,
      line_snippet: lineSnippet,
      timestamp_seconds: Math.floor(Date.now() / 1000),
    }

    try {
      const saved = await createNote(session.id, noteData)
      appState.sessionNotes.push(saved)

      const count = appState.sessionNotes.length
      notesCountEl.textContent = `${count} note${count !== 1 ? 's' : ''}`

      // Reset note fields
      noteContentEl.value = ''
      container.querySelector('#note-scene').value = ''
      container.querySelector('#note-actor').value = ''
      container.querySelector('#note-cat').value = ''
      suggestionsArea.classList.add('hidden')

      noteSuccessEl.textContent = 'Note saved!'
      noteSuccessEl.classList.remove('hidden')
      setTimeout(() => noteSuccessEl.classList.add('hidden'), 2500)
      noteContentEl.focus()
    } catch (err) {
      showError(`Failed to save: ${err.message}`)
    } finally {
      saveBtn.disabled = false
      saveBtn.textContent = 'Complete Note'
    }
  })

  function showError(msg) {
    noteErrorEl.textContent = msg
    noteErrorEl.classList.remove('hidden')
    noteSuccessEl.classList.add('hidden')
  }

  function clearMessages() {
    noteErrorEl.classList.add('hidden')
    noteSuccessEl.classList.add('hidden')
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function renderScriptPage(pages, pageNum) {
  const page = pages.find(p => p.pageNumber === pageNum)
  if (!page) return `<p class="script-missing">Page ${pageNum} not available.</p>`
  return `
    <div class="script-page">
      <div class="script-page-label">Page ${pageNum}</div>
      <pre class="script-text">${esc(page.text || '(no text on this page)')}</pre>
    </div>
  `
}

function noScriptPlaceholder() {
  return `
    <div class="no-script-notice">
      <p>No script uploaded.</p>
      <p class="muted">Page numbers are set manually in the note form.</p>
    </div>
  `
}

function getLineSnippet(pages, pageNum) {
  const page = pages.find(p => p.pageNumber === pageNum)
  if (!page || !page.text) return null
  return page.text.substring(0, 200)
}

function esc(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
