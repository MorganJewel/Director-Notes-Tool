// All HuggingFace Inference API calls live here exclusively.
import { getSettings } from './settings.js'

const HF_API_BASE = 'https://api-inference.huggingface.co/models'
const MODEL = 'mistralai/Mistral-7B-Instruct-v0.2'

async function callHuggingFace(prompt) {
  const { hfApiKey } = getSettings()
  if (!hfApiKey) {
    throw new Error('HuggingFace API key not configured. Please go to Settings.')
  }

  const response = await fetch(`${HF_API_BASE}/${MODEL}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${hfApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: 250,
        temperature: 0.7,
        return_full_text: false,
      },
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

  if (Array.isArray(result) && result[0]?.generated_text !== undefined) {
    return result[0].generated_text
  }
  if (result?.generated_text !== undefined) {
    return result.generated_text
  }
  throw new Error('Unexpected response shape from HuggingFace API.')
}

export async function suggestCompletion(noteContent) {
  const prompt =
    `<s>[INST] You are helping a theater director complete a rehearsal note. ` +
    `The director has written the beginning of a note. ` +
    `Suggest 2-3 short completions (under 15 words each) that finish the thought. ` +
    `Do not rewrite what they have written. Only complete it.\n\n` +
    `Note so far: "${noteContent}"\n\n` +
    `Provide exactly 2-3 completions, one per line, without numbering or bullet points. ` +
    `Each completion is only the ending that follows what the director already wrote. [/INST]`

  const raw = await callHuggingFace(prompt)

  const lines = raw
    .split('\n')
    .map(l => l.replace(/^[-•*\d.)\s]+/, '').trim())
    .filter(l => l.length > 2 && l.length < 120)
    .slice(0, 3)

  if (lines.length === 0) {
    throw new Error('No completions returned from the model.')
  }
  return lines
}

export async function explainNote(noteContent, scriptSnippet) {
  const snippetPart = scriptSnippet
    ? `\n\nContext from the script at this moment: "${scriptSnippet.substring(0, 200)}"`
    : ''

  const prompt =
    `<s>[INST] You are a theater dramaturg helping a director reflect on their rehearsal notes. ` +
    `A director wrote this note: "${noteContent}"${snippetPart}\n\n` +
    `In 2-3 sentences, explain in plain English what the director likely meant ` +
    `and what specific directorial concern they were addressing. Be concrete and practical. [/INST]`

  const raw = await callHuggingFace(prompt)
  return raw.trim()
}
