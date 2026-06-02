// All AI inference calls live here exclusively.

const POLLINATIONS_CHAT = 'https://text.pollinations.ai/openai'

// Serial request queue — Pollinations allows only 1 concurrent request per IP.
let _queue = Promise.resolve()

function callAI(systemMsg, userMsg) {
  const result = new Promise((resolve, reject) => {
    _queue = _queue.then(() => _fetch(systemMsg, userMsg).then(resolve, reject))
  })
  return result
}

async function _fetch(systemMsg, userMsg, attempt = 0) {
  const response = await fetch(POLLINATIONS_CHAT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'openai',
      messages: [
        { role: 'system', content: systemMsg },
        { role: 'user', content: userMsg },
      ],
      max_tokens: 300,
      temperature: 0.7,
    }),
  })

  if (response.status === 429 && attempt < 3) {
    await new Promise(r => setTimeout(r, 3000 * (attempt + 1)))
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

export async function suggestCompletion(noteContent, recentNotes = [], actorName = '') {
  const actorConstraint = actorName
    ? `\nThis note is specifically about "${actorName}". Every suggestion must be about ${actorName} only — never introduce or mention any other character.`
    : ''

  const examplesBlock = recentNotes.length > 0
    ? '\n\nHere are recent notes from this director — match their style and vocabulary:\n' +
      recentNotes.map(n => `- "${n}"`).join('\n')
    : ''

  const system =
    'You are helping a theater director complete a rehearsal note about an actor\'s performance. ' +
    'Suggestions must be about acting choices only: character motivation, emotional intention, ' +
    'physical action, relationship dynamics, subtext, or blocking. ' +
    'Never suggest anything involving lighting, sound, costumes, set design, or other production departments — ' +
    'those are never the actor\'s job. ' +
    'Suggest exactly 3 short completions (under 15 words each) that finish the thought naturally. ' +
    'Do not rewrite what they have written — only complete it. ' +
    'Reply with one completion per line, no numbering, no bullet points, nothing else.' +
    actorConstraint +
    examplesBlock

  const raw = await callAI(system, `Note so far: "${noteContent}"`)

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

  return (await callAI(system, userMsg)).trim()
}
