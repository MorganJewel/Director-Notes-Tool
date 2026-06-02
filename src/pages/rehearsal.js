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
          <span class="live-badge">Live</span>
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
            <div class="moment-indicator hidden" id="moment-indicator">
              <span class="moment-label">Note for:</span>
              <span id="moment-text" class="moment-text"></span>
              <button type="button" id="clear-moment" class="btn-clear-moment">✕</button>
            </div>

            <div class="form-group">
              <label for="note-content">Note Content</label>
              <textarea
                id="note-content"
                rows="5"
                placeholder="Click a line in the script, then type your note…"
              ></textarea>
            </div>

            <div class="ghost-hint hidden" id="ghost-hint">
              <span class="ghost-tab-badge">Tab</span>
              <span id="ghost-text" class="ghost-text"></span>
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
                  <option value="">(none)</option>
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
    clearMoment()
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

  // ── Ghost text autocomplete ──────────────────────────────────────────────────
  const noteContentEl = container.querySelector('#note-content')
  const ghostHint = container.querySelector('#ghost-hint')
  const ghostTextEl = container.querySelector('#ghost-text')
  const noteErrorEl = container.querySelector('#note-error')
  const noteSuccessEl = container.querySelector('#note-success')
  const saveBtn = container.querySelector('#btn-save')
  const notesCountEl = container.querySelector('#notes-count')

  let ghostSuggestions = []
  let ghostIndex = 0
  let debounceTimer = null
  let selectedMoment = null
  const DEBOUNCE_MS = 800
  const MIN_CHARS = 15

  function showGhost(suggestions, index = 0) {
    ghostSuggestions = suggestions
    ghostIndex = index
    const total = suggestions.length
    ghostTextEl.textContent = suggestions[index]
    ghostHint.querySelector('.ghost-tab-badge').textContent =
      total > 1 ? `Tab  /  1 for next (${index + 1}/${total})` : 'Tab'
    ghostHint.classList.remove('hidden')
  }

  function clearGhost() {
    ghostSuggestions = []
    ghostIndex = 0
    ghostHint.classList.add('hidden')
    ghostTextEl.textContent = ''
  }

  function recentNoteExamples() {
    return (appState.sessionNotes || [])
      .slice(-5)
      .map(n => n.content)
      .filter(Boolean)
  }

  function showMomentIndicator(text) {
    container.querySelector('#moment-text').textContent =
      text.length > 70 ? text.substring(0, 70) + '…' : text
    container.querySelector('#moment-indicator').classList.remove('hidden')
  }

  function clearMoment() {
    selectedMoment = null
    container.querySelector('#moment-indicator').classList.add('hidden')
    container.querySelector('#moment-text').textContent = ''
  }

  container.querySelector('#clear-moment').addEventListener('click', clearMoment)

  scriptContent.addEventListener('click', e => {
    const line = e.target.closest('.script-line')
    if (!line) return
    scriptContent.querySelectorAll('.script-line.selected').forEach(el => el.classList.remove('selected'))
    line.classList.add('selected')
    selectedMoment = { text: line.textContent.trim(), lineIndex: parseInt(line.dataset.index) }
    showMomentIndicator(selectedMoment.text)
    notePageInput.value = currentPage
    noteContentEl.focus()
  })

  noteContentEl.addEventListener('keydown', e => {
    if (ghostSuggestions.length === 0) return

    if (e.key === 'Tab') {
      e.preventDefault()
      const current = noteContentEl.value.trimEnd()
      noteContentEl.value = current + ' ' + ghostSuggestions[ghostIndex].trimStart()
      clearGhost()
      clearTimeout(debounceTimer)
      return
    }

    if (e.key === '1') {
      e.preventDefault()
      const next = (ghostIndex + 1) % ghostSuggestions.length
      showGhost(ghostSuggestions, next)
      return
    }

    if (e.key === 'Escape') clearGhost()
  })

  noteContentEl.addEventListener('input', () => {
    clearGhost()
    clearTimeout(debounceTimer)
    const content = noteContentEl.value.trim()
    if (content.length < MIN_CHARS) return
    debounceTimer = setTimeout(async () => {
      if (noteContentEl.value.trim().length < MIN_CHARS) return
      try {
        const actor = container.querySelector('#note-actor').value.trim()
        const suggestions = await suggestCompletion(content, recentNoteExamples(), actor)
        if (suggestions.length > 0) showGhost(suggestions)
      } catch { /* fail silently, ghost text is non-critical */ }
    }, DEBOUNCE_MS)
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
    const lineSnippet = selectedMoment ? selectedMoment.text : getLineSnippet(pages, pageNum)
    const lineIndex = selectedMoment ? selectedMoment.lineIndex : null

    const noteData = {
      content,
      page_number: pageNum,
      scene: container.querySelector('#note-scene').value.trim() || null,
      actor: container.querySelector('#note-actor').value.trim() || null,
      emotional_category: container.querySelector('#note-cat').value || null,
      line_snippet: lineSnippet,
      line_index: lineIndex,
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
      clearGhost()
      clearMoment()
      clearTimeout(debounceTimer)

      scriptContent.innerHTML = renderScriptPage(pages, currentPage)

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

  const annotated = new Set(
    (appState.sessionNotes || [])
      .filter(n => n.page_number === pageNum && n.line_index != null)
      .map(n => n.line_index)
  )

  const lines = (page.text || '').split('\n')
  const linesHtml = lines.map((line, i) => {
    if (!line.trim()) return `<span class="script-line-blank"></span>`
    const dot = annotated.has(i) ? `<span class="line-note-dot" title="Note exists">◆</span>` : ''
    return `<span class="script-line${annotated.has(i) ? ' has-note' : ''}" data-index="${i}">${dot}${esc(line)}</span>`
  }).join('\n')

  return `
    <div class="script-page">
      <div class="script-page-label">Page ${pageNum}, click any line to anchor your note</div>
      <pre class="script-text">${linesHtml}</pre>
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
