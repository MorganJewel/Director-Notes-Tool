import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url'
import { createSession } from '../supabase.js'
import { appState } from '../state.js'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

export function renderNewSession(container, navigate) {
  container.innerHTML = `
    <div class="page-layout">
      <header class="topbar">
        <button class="btn btn-ghost btn-sm" id="btn-back">← Back</button>
        <span class="topbar-title">New Rehearsal Session</span>
      </header>

      <main class="page-main narrow">
        <form id="session-form" novalidate>
          <div class="form-group">
            <label for="production-name">Production Name <span class="required">*</span></label>
            <input
              type="text"
              id="production-name"
              required
              placeholder="e.g. A Midsummer Night's Dream"
              autofocus
            />
          </div>

          <div class="form-group">
            <label>Script PDF <span class="optional">(optional)</span></label>
            <div class="upload-zone" id="upload-zone">
              <input type="file" id="script-file" accept=".pdf" class="visually-hidden" />
              <label for="script-file" class="upload-label">
                <span class="upload-icon">📄</span>
                <span id="upload-label-text">Click to upload a PDF script</span>
                <span class="upload-hint">If your PDF is scanned, OCR will run automatically on the first 10 pages.</span>
              </label>
            </div>
            <div id="upload-status" class="upload-status hidden"></div>
          </div>

          <div id="form-error" class="message-box error hidden"></div>
          <button type="submit" class="btn btn-primary btn-full" id="btn-start">
            Start Rehearsal
          </button>
        </form>
      </main>
    </div>
  `

  container.querySelector('#btn-back').addEventListener('click', () => navigate('#dashboard'))

  const fileInput = container.querySelector('#script-file')
  const uploadZone = container.querySelector('#upload-zone')
  const statusEl = container.querySelector('#upload-status')
  const labelText = container.querySelector('#upload-label-text')
  let parsedPages = null
  let scriptFileName = null

  uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over') })
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'))
  uploadZone.addEventListener('drop', e => {
    e.preventDefault()
    uploadZone.classList.remove('drag-over')
    const file = e.dataTransfer.files[0]
    if (file && file.type === 'application/pdf') handleFile(file)
  })

  fileInput.addEventListener('change', e => {
    const file = e.target.files[0]
    if (file) handleFile(file)
  })

  async function handleFile(file) {
    scriptFileName = file.name
    labelText.textContent = file.name
    setStatus('Parsing PDF…', 'loading')

    try {
      parsedPages = await parsePDF(file, setStatus)
      setStatus(`✓ Parsed ${parsedPages.length} pages successfully.`, 'success')
    } catch (err) {
      setStatus(`PDF parse failed: ${err.message}`, 'error')
      parsedPages = null
    }
  }

  function setStatus(text, type = '') {
    statusEl.textContent = text
    statusEl.className = `upload-status ${type}`
    statusEl.classList.remove('hidden')
  }

  const form = container.querySelector('#session-form')
  const formErrorEl = container.querySelector('#form-error')
  const startBtn = container.querySelector('#btn-start')

  form.addEventListener('submit', async e => {
    e.preventDefault()
    formErrorEl.classList.add('hidden')

    const productionName = container.querySelector('#production-name').value.trim()
    if (!productionName) {
      formErrorEl.textContent = 'Production name is required.'
      formErrorEl.classList.remove('hidden')
      return
    }

    startBtn.disabled = true
    startBtn.textContent = 'Creating session…'

    try {
      const session = await createSession(productionName, scriptFileName)
      appState.currentSession = {
        id: session.id,
        productionName: session.production_name,
        scriptName: session.script_name,
      }
      appState.parsedScript = parsedPages
      appState.sessionNotes = []
      navigate('#rehearsal')
    } catch (err) {
      formErrorEl.textContent = `Failed to create session: ${err.message}`
      formErrorEl.classList.remove('hidden')
    } finally {
      startBtn.disabled = false
      startBtn.textContent = 'Start Rehearsal'
    }
  })
}

// ── PDF parsing ──────────────────────────────────────────────────────────────

async function parsePDF(file, onStatus) {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const pages = []

  for (let i = 1; i <= pdf.numPages; i++) {
    onStatus(`Extracting text — page ${i} of ${pdf.numPages}…`, 'loading')
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const text = extractLines(content)
    pages.push({ pageNumber: i, text })
  }

  const avgChars = pages.reduce((sum, p) => sum + p.text.length, 0) / pages.length

  if (avgChars < 50) {
    onStatus('No text found — looks like a scanned PDF. Loading OCR…', 'loading')
    await loadTesseract()
    const ocrCount = Math.min(10, pdf.numPages)
    const ocrPages = await ocrPDF(buffer, ocrCount, onStatus)
    return [...ocrPages, ...pages.slice(ocrCount)]
  }

  return pages
}

// Groups PDF text items by their vertical position to reconstruct readable lines.
function extractLines(content) {
  if (!content.items.length) return ''

  const items = content.items
    .filter(item => item.str)
    .map(item => ({
      str: item.str,
      x: item.transform[4],
      y: Math.round(item.transform[5]),
    }))

  if (!items.length) return ''

  // Sort top-to-bottom (PDF y=0 is bottom of page, so descending = top first)
  items.sort((a, b) => b.y - a.y || a.x - b.x)

  // Group into lines by y proximity
  const LINE_GAP = 3
  const lineGroups = []
  let currentY = items[0].y
  let currentGroup = []

  for (const item of items) {
    if (Math.abs(item.y - currentY) > LINE_GAP) {
      if (currentGroup.length) lineGroups.push(currentGroup)
      currentY = item.y
      currentGroup = [item]
    } else {
      currentGroup.push(item)
    }
  }
  if (currentGroup.length) lineGroups.push(currentGroup)

  // Within each line, sort left-to-right and join
  return lineGroups
    .map(group => {
      group.sort((a, b) => a.x - b.x)
      return group.map(i => i.str).join('').trimEnd()
    })
    .filter(line => line.trim())
    .join('\n')
}

function loadTesseract() {
  return new Promise((resolve, reject) => {
    if (window.Tesseract) { resolve(); return }
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'
    s.onload = resolve
    s.onerror = () => reject(new Error('Failed to load Tesseract.js'))
    document.head.appendChild(s)
  })
}

async function ocrPDF(buffer, pageCount, onStatus) {
  const pdf = await pdfjsLib.getDocument({ data: buffer.slice(0) }).promise
  const worker = await window.Tesseract.createWorker('eng')
  const pages = []

  try {
    for (let i = 1; i <= pageCount; i++) {
      onStatus(`OCR — page ${i} of ${pageCount}…`, 'loading')
      const page = await pdf.getPage(i)
      const viewport = page.getViewport({ scale: 2.0 })
      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
      const { data: { text } } = await worker.recognize(canvas)
      pages.push({ pageNumber: i, text: text.trim() })
    }
  } finally {
    await worker.terminate()
  }

  return pages
}
