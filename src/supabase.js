import { createClient } from '@supabase/supabase-js'
import { getSettings } from './settings.js'

let _client = null
let _cachedUrl = null
let _cachedKey = null

export function getSupabase() {
  const { supabaseUrl, supabaseAnonKey } = getSettings()
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase credentials not configured. Please go to Settings.')
  }
  if (_client && _cachedUrl === supabaseUrl && _cachedKey === supabaseAnonKey) {
    return _client
  }
  _client = createClient(supabaseUrl, supabaseAnonKey)
  _cachedUrl = supabaseUrl
  _cachedKey = supabaseAnonKey
  return _client
}

export async function getCurrentUser() {
  const sb = getSupabase()
  const { data: { user } } = await sb.auth.getUser()
  return user
}

export async function createSession(productionName, scriptName) {
  const sb = getSupabase()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await sb
    .from('sessions')
    .insert({ user_id: user.id, production_name: productionName, script_name: scriptName || null })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getUserSessions() {
  const sb = getSupabase()

  const { data: sessions, error } = await sb
    .from('sessions')
    .select('id, production_name, script_name, created_at')
    .order('created_at', { ascending: false })

  if (error) throw error
  if (!sessions || sessions.length === 0) return []

  const counts = await Promise.all(
    sessions.map(s =>
      sb.from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', s.id)
    )
  )

  return sessions.map((s, i) => ({
    ...s,
    noteCount: counts[i].count ?? 0,
  }))
}

export async function createNote(sessionId, noteData) {
  const sb = getSupabase()
  const { data, error } = await sb
    .from('notes')
    .insert({ session_id: sessionId, ...noteData })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getSessionNotes(sessionId) {
  const sb = getSupabase()
  const { data, error } = await sb
    .from('notes')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}
