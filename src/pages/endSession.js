import { getSessionNotes } from '../supabase.js'
import { explainNote } from '../apertus.js'
import { appState } from '../state.js'

export async function renderEndSession(container, navigate) {
  const session = appState.currentSession

  container.innerHTML = `
    <div class="page-layout">
      <header class="topbar">
        <button class="btn btn-ghost btn-sm" id="btn-back">← Dashboard</button>
        <div class="topbar-center">
          <span class="logo-mark">▶</span>
          <span class="topbar-title">${esc(session.productionName)}</span>
        </div>
        <span class="topbar-right-label">Session Notes</span>
      </header>

      <div class="tabs-bar">
        <button class="tab active" data-tab="all">All</button>
        <button class="tab" data-tab="actor">By Actor</button>
        <button class="tab" data-tab="page">By Page</button>
        <button class="tab" data-tab="scene">By Scene</button>
        <button class="tab" data-tab="category">By Category</button>
      </div>

      <main class="page-main">
        <div id="notes-loading" class="loading-state">Loading notes…</div>
        <div id="notes-error" class="message-box error hidden"></div>
        <div id="notes-view" class="notes-view hidden"></div>
        <div id="notes-empty" class="empty-state hidden">
          <p>No notes in this session yet.</p>
        </div>
      </main>
    </div>
  `

  container.querySelector('#btn-back').addEventListener('click', () => navigate('#dashboard'))

  const loadingEl = container.querySelector('#notes-loading')
  const errorEl = container.querySelector('#notes-error')
  const notesView = container.querySelector('#notes-view')
  const emptyEl = container.querySelector('#notes-empty')

  let allNotes = []

  try {
    allNotes = await getSessionNotes(session.id)
    loadingEl.classList.add('hidden')

    if (!allNotes.length) {
      emptyEl.classList.remove('hidden')
      return
    }

    notesView.classList.remove('hidden')
    renderTab(notesView, allNotes, 'all')

    container.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', e => {
        container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
        e.target.classList.add('active')
        renderTab(notesView, allNotes, e.target.dataset.tab)
      })
    })
  } catch (err) {
    loadingEl.classList.add('hidden')
    errorEl.textContent = `Failed to load notes: ${err.message}`
    errorEl.classList.remove('hidden')
  }
}

function renderTab(container, notes, tabType) {
  const groups = groupNotes(notes, tabType)
  const sortedKeys = sortGroupKeys(groups, tabType)

  container.innerHTML = sortedKeys.map(key => `
    <div class="note-group">
      ${tabType !== 'all' ? `<h3 class="group-header">${esc(key)}</h3>` : ''}
      <div class="note-list">
        ${groups[key].map(note => noteCard(note)).join('')}
      </div>
    </div>
  `).join('')

  // Attach "What did I mean?" handlers
  container.querySelectorAll('.btn-explain').forEach(btn => {
    btn.addEventListener('click', async e => {
      const noteId = e.target.dataset.noteId
      const note = notes.find(n => n.id === noteId)
      if (!note) return

      const panel = container.querySelector(`#exp-${noteId}`)
      const button = e.target

      button.disabled = true
      button.textContent = 'Thinking…'
      panel.classList.remove('hidden')
      panel.textContent = 'Getting explanation…'
      panel.classList.remove('exp-error')

      try {
        const explanation = await explainNote(note.content, note.line_snippet)
        panel.textContent = explanation.trim()
      } catch (err) {
        panel.textContent = `Could not get explanation: ${err.message}`
        panel.classList.add('exp-error')
      } finally {
        button.disabled = false
        button.textContent = 'What did I mean?'
      }
    })
  })
}

function groupNotes(notes, tabType) {
  const groups = {}
  notes.forEach(n => {
    let key
    switch (tabType) {
      case 'actor':    key = n.actor || 'No Actor'; break
      case 'page':     key = n.page_number != null ? `Page ${n.page_number}` : 'No Page'; break
      case 'scene':    key = n.scene || 'No Scene'; break
      case 'category': key = n.emotional_category ? cap(n.emotional_category) : 'Uncategorized'; break
      default:         key = 'All Notes'
    }
    if (!groups[key]) groups[key] = []
    groups[key].push(n)
  })
  return groups
}

function sortGroupKeys(groups, tabType) {
  const fallback = { actor: 'No Actor', page: 'No Page', scene: 'No Scene', category: 'Uncategorized' }
  const tail = fallback[tabType]
  return Object.keys(groups).sort((a, b) => {
    if (a === tail) return 1
    if (b === tail) return -1
    if (tabType === 'page') return pageNum(a) - pageNum(b)
    return a.localeCompare(b)
  })
}

function pageNum(label) {
  const m = label.match(/\d+/)
  return m ? parseInt(m[0]) : Infinity
}

function noteCard(note) {
  const timeStr = note.created_at
    ? new Date(note.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : ''
  return `
    <div class="note-card">
      <p class="note-content">${esc(note.content)}</p>
      <div class="note-meta">
        ${note.page_number != null ? `<span class="meta-badge">Pg ${note.page_number}</span>` : ''}
        ${note.scene ? `<span class="meta-badge">${esc(note.scene)}</span>` : ''}
        ${note.actor ? `<span class="meta-badge actor-badge">${esc(note.actor)}</span>` : ''}
        ${note.emotional_category ? `<span class="meta-badge cat-badge">${cap(note.emotional_category)}</span>` : ''}
        ${timeStr ? `<span class="meta-badge time-badge">${timeStr}</span>` : ''}
      </div>
      <button class="btn btn-ghost btn-xs btn-explain" data-note-id="${note.id}">
        What did I mean?
      </button>
      <div id="exp-${note.id}" class="explanation-panel hidden"></div>
    </div>
  `
}

function esc(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function cap(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
