// In-memory state. currentSession is also mirrored to sessionStorage
// so it survives hash-navigation within the same tab.
export const appState = {
  _currentSession: null,
  parsedScript: null,
  sessionNotes: [],

  get currentSession() {
    if (this._currentSession) return this._currentSession
    const stored = sessionStorage.getItem('dma_current_session')
    if (stored) {
      try { this._currentSession = JSON.parse(stored) } catch (_) {}
    }
    return this._currentSession
  },

  set currentSession(value) {
    this._currentSession = value
    if (value) {
      sessionStorage.setItem('dma_current_session', JSON.stringify(value))
    } else {
      sessionStorage.removeItem('dma_current_session')
    }
  },
}
