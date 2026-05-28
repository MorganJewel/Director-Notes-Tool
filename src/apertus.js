// All HuggingFace Inference API calls live here exclusively.
import { getSettings } from './settings.js'

const HF_ROUTER = 'https://router.huggingface.co/hf-inference/models'
const MODEL = 'mistralai/Mistral-7B-Instruct-v0.2'

const DEFAULT_HF_KEY = atob('aGZfdkRTUmV2V2lxQ1NVSG5od2VScUVtWEdEcE1pS3hRTVlCTg==')

async function callHuggingFace(systemPrompt, userMessage) {
  const { hfApiKey } = getSettings()
  const key = hfApiKey || DEFAULT_HF_KEY

  const response = await fetch(`${HF_ROUTER}/${MODEL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 300,
      temperature: 0.7,
    }),
  })

  if (response.status === 503) {
    throw new Error('Model is loading — please wait 20–30 seconds and try again.')
  }
  if (!response.ok) {
    const body = await response.text()
    throw new Error(`HuggingFace API error (${response.status}): ${body}`)
  }

  const result = await response.json()
  const text = result?.choices?.[0]?.message?.content
  if (!text) throw new Error('Unexpected response from HuggingFace API.')
  return text
}

export async function suggestCompletion(noteContent) {
  const system =
    'You are helping a theater director complete a rehearsal note. ' +
    'The director has written the beginning of a note. ' +
    'Suggest exactly 2-3 short completions (under 15 words each) that finish the thought. ' +
    'Do not rewrite what they have written — only complete it. ' +
    'Reply with one completion per line, no numbering, no bullet points.'

  const raw = await callHuggingFace(system, `Note so far: "${noteContent}"`)

  const lines = raw
    .split('\n')
    .map(l => l.replace(/^[-•*\d.)\s]+/, '').trim())
    .filter(l => l.length > 2 && l.length < 120)
    .slice(0, 3)

  if (lines.length === 0) throw new Error('No completions returned from the model.')
  return lines
}

export async function explainNote(noteContent, scriptSnippet) {
  const system =
    'You are a theater dramaturg helping a director reflect on their rehearsal notes. ' +
    'In 2-3 sentences, explain in plain English what the director likely meant ' +
    'and what specific directorial concern they were addressing. Be concrete and practical.'

  const context = scriptSnippet
    ? `Note: "${noteContent}"\n\nScript context: "${scriptSnippet.substring(0, 200)}"`
    : `Note: "${noteContent}"`

  const raw = await callHuggingFace(system, context)
  return raw.trim()
}
