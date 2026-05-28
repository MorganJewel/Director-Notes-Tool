// All HuggingFace Inference API calls live here exclusively.
import { getSettings } from './settings.js'

const HF_BASE = 'https://router.huggingface.co/hf-inference/models'
const MODEL = 'HuggingFaceH4/zephyr-7b-beta'

const DEFAULT_HF_KEY = atob('aGZfdkRTUmV2V2lxQ1NVSG5od2VScUVtWEdEcE1pS3hRTVlCTg==')

async function callHuggingFace(prompt) {
  const { hfApiKey } = getSettings()
  const key = hfApiKey || DEFAULT_HF_KEY

  const response = await fetch(`${HF_BASE}/${MODEL}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: 300,
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
  const text = Array.isArray(result) ? result[0]?.generated_text : result?.generated_text
  if (!text && text !== '') throw new Error('Unexpected response from HuggingFace API.')
  return text
}

export async function suggestCompletion(noteContent) {
  const prompt =
    `<|system|>\nYou are helping a theater director complete a rehearsal note. ` +
    `Suggest exactly 2-3 short completions (under 15 words each) that finish the thought. ` +
    `Do not rewrite what they have written — only complete it. ` +
    `Reply with one completion per line, no numbering, no bullet points.</s>\n` +
    `<|user|>\nNote so far: "${noteContent}"</s>\n<|assistant|>`

  const raw = await callHuggingFace(prompt)

  const lines = raw
    .split('\n')
    .map(l => l.replace(/^[-•*\d.)\s]+/, '').trim())
    .filter(l => l.length > 2 && l.length < 120)
    .slice(0, 3)

  if (lines.length === 0) throw new Error('No completions returned from the model.')
  return lines
}

export async function explainNote(noteContent, scriptSnippet) {
  const context = scriptSnippet
    ? `Note: "${noteContent}"\n\nScript context at this moment: "${scriptSnippet.substring(0, 200)}"`
    : `Note: "${noteContent}"`

  const prompt =
    `<|system|>\nYou are a theater dramaturg. In 2-3 sentences, explain in plain English ` +
    `what the director likely meant and what directorial concern they were addressing. ` +
    `Be concrete and practical.</s>\n` +
    `<|user|>\n${context}</s>\n<|assistant|>`

  const raw = await callHuggingFace(prompt)
  return raw.trim()
}
