// localStorage-backed data store. No Supabase, no auth required for demo.

const SESSIONS_KEY = 'dma_sessions'
const NOTES_KEY = 'dma_notes'

function uid() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function readSessions() {
  try { return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]') } catch (_) { return [] }
}

function readNotes() {
  try { return JSON.parse(localStorage.getItem(NOTES_KEY) || '[]') } catch (_) { return [] }
}

function writeSessions(sessions) { localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions)) }
function writeNotes(notes) { localStorage.setItem(NOTES_KEY, JSON.stringify(notes)) }

const MAX_SESSIONS = 5

export async function createSession(productionName, scriptName) {
  const session = {
    id: uid(),
    production_name: productionName,
    script_name: scriptName || null,
    created_at: new Date().toISOString(),
  }
  const sessions = readSessions()
  sessions.unshift(session)

  // Keep only the most recent MAX_SESSIONS sessions
  const trimmed = sessions.slice(0, MAX_SESSIONS)
  const keptIds = new Set(trimmed.map(s => s.id))
  writeSessions(trimmed)

  // Remove notes that belong to dropped sessions
  writeNotes(readNotes().filter(n => keptIds.has(n.session_id)))

  return session
}

export async function getUserSessions() {
  const sessions = readSessions()
  const notes = readNotes()
  return sessions.map(s => ({
    ...s,
    noteCount: notes.filter(n => n.session_id === s.id).length,
  }))
}

export async function createNote(sessionId, noteData) {
  const note = {
    id: uid(),
    session_id: sessionId,
    ...noteData,
    created_at: new Date().toISOString(),
  }
  const notes = readNotes()
  notes.push(note)
  writeNotes(notes)
  return note
}

export async function getSessionNotes(sessionId) {
  return readNotes()
    .filter(n => n.session_id === sessionId)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
}
