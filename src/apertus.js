// All AI inference calls live here exclusively.

const APERTUS_ENDPOINT = 'https://router.huggingface.co/publicai/v1/chat/completions'
const APERTUS_MODEL = 'APERTUS8B'
const APERTUS_API_KEY = import.meta.env.VITE_APERTUS_API_KEY

const POLLINATIONS_ENDPOINT = 'https://text.pollinations.ai/openai'

let aiInFlight = false

function getConfig() {
  if (APERTUS_API_KEY) {
    return {
      url: APERTUS_ENDPOINT,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${APERTUS_API_KEY}` },
      model: APERTUS_MODEL,
    }
  }
  return {
    url: POLLINATIONS_ENDPOINT,
    headers: { 'Content-Type': 'application/json' },
    model: 'openai',
  }
}

async function _fetch(systemMsg, userMsg, attempt = 0) {
  const cfg = getConfig()
  const response = await fetch(cfg.url, {
    method: 'POST',
    headers: cfg.headers,
    body: JSON.stringify({
      model: cfg.model,
      messages: [
        { role: 'system', content: systemMsg },
        { role: 'user', content: userMsg },
      ],
      max_tokens: 300,
      temperature: 0.7,
    }),
  })

  if (response.status === 429 && attempt < 4) {
    await new Promise(r => setTimeout(r, 5000 * (attempt + 1)))
    return _fetch(systemMsg, userMsg, attempt + 1)
  }

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`AI error (${response.status}): ${body}`)
  }

  const result = await response.json()
  const text = result?.choices?.[0]?.message?.content
  if (!text) throw new Error('Unexpected response from AI.')
  return text
}

async function callAI(systemMsg, userMsg) {
  if (aiInFlight) return null
  aiInFlight = true
  try {
    return await _fetch(systemMsg, userMsg)
  } finally {
    aiInFlight = false
  }
}

export async function suggestCompletion(noteContent, recentNotes = [], actorName = '') {
  const actorConstraint = actorName
    ? `\nThis note is specifically about "${actorName}". Every suggestion must be about ${actorName} only. Never introduce or mention any other character.`
    : ''

  const examplesBlock = recentNotes.length > 0
    ? '\n\nHere are recent notes from this director. Match their style and vocabulary:\n' +
      recentNotes.map(n => `- "${n}"`).join('\n')
    : ''

  const system =
    'You are helping a theater director complete a rehearsal note about an actor\'s performance. ' +
    'Suggestions must be about acting choices only: character motivation, emotional intention, ' +
    'physical action, relationship dynamics, subtext, or blocking. ' +
    'Never suggest anything involving lighting, sound, costumes, set design, or other production departments. ' +
    'those are never the actor\'s job. ' +
    'Suggest exactly 3 short completions (under 15 words each) that finish the thought naturally. ' +
    'Do not rewrite what they have written. Only complete it. ' +
    'Reply with one completion per line, no numbering, no bullet points, nothing else.' +
    actorConstraint +
    examplesBlock

  const raw = await callAI(system, `Note so far: "${noteContent}"`)
  if (raw === null) return []

  const lines = raw
    .split('\n')
    .map(l => l.replace(/^[-•*\d.)\s]+/, '').trim())
    .filter(l => l.length > 2 && l.length < 120)
    .slice(0, 3)

  if (lines.length === 0) throw new Error('No completions returned.')
  return lines
}

export async function explainNote(noteContent, scriptSnippet) {
  const system =
    'You are a theater dramaturg. In 2-3 sentences, explain in plain English ' +
    'what the director likely meant and what directorial concern they were addressing. ' +
    'Be concrete and practical.'

  const userMsg = scriptSnippet
    ? `Note: "${noteContent}"\n\nScript context: "${scriptSnippet.substring(0, 200)}"`
    : `Note: "${noteContent}"`

  const raw = await callAI(system, userMsg)
  if (raw === null) throw new Error('Another request is in progress. Try again in a moment.')
  return raw.trim()
}
