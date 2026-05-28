const HF_KEY = 'dma_hf_api_key'

export function getSettings() {
  return {
    hfApiKey: localStorage.getItem(HF_KEY) || '',
  }
}

export function saveSettings({ hfApiKey }) {
  localStorage.setItem(HF_KEY, hfApiKey || '')
}
