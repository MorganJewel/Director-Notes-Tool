const KEYS = {
  SUPABASE_URL: 'dma_supabase_url',
  SUPABASE_ANON_KEY: 'dma_supabase_anon_key',
  HF_API_KEY: 'dma_hf_api_key',
}

export function getSettings() {
  return {
    supabaseUrl: localStorage.getItem(KEYS.SUPABASE_URL) || '',
    supabaseAnonKey: localStorage.getItem(KEYS.SUPABASE_ANON_KEY) || '',
    hfApiKey: localStorage.getItem(KEYS.HF_API_KEY) || '',
  }
}

export function saveSettings({ supabaseUrl, supabaseAnonKey, hfApiKey }) {
  localStorage.setItem(KEYS.SUPABASE_URL, supabaseUrl || '')
  localStorage.setItem(KEYS.SUPABASE_ANON_KEY, supabaseAnonKey || '')
  localStorage.setItem(KEYS.HF_API_KEY, hfApiKey || '')
}
