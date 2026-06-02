const TOUR_KEY = 'dma_tour_seen'

const STEPS = [
  {
    title: 'Welcome to Director Margin AI',
    body: 'Capture rehearsal notes faster with AI assistance. This quick tour shows you how everything works.',
    icon: '▶',
  },
  {
    title: 'Start a Session',
    body: 'Click <strong>+ New Session</strong>, give your production a name, and optionally upload your script as a PDF. Scanned scripts are supported too. OCR runs automatically.',
    icon: '📋',
  },
  {
    title: 'Anchor Notes to Lines',
    body: 'Your script appears on the left. <strong>Click any line</strong> to anchor your note to that exact moment. The line highlights and a banner at the top of the note form confirms your selection.',
    icon: '📍',
  },
  {
    title: 'AI Completes Your Notes',
    body: 'Start typing a note. After a short pause, the AI suggests a completion below the text box. <strong>Press Tab to accept</strong> or <strong>1 to cycle</strong> through options. Fill in the Actor field to keep suggestions focused on one character.',
    icon: '✦',
  },
  {
    title: 'Review After Rehearsal',
    body: 'Hit <strong>End Session</strong> when you are done. Notes are organized by actor, page, scene, or category, in script order. Tap <strong>What did I mean?</strong> on any note for an AI explanation of your intention.',
    icon: '📒',
  },
]

export function showTourIfFirstVisit() {
  if (!localStorage.getItem(TOUR_KEY)) startTour()
}

export function startTour() {
  if (document.getElementById('tour-overlay')) return
  localStorage.setItem(TOUR_KEY, '1')

  let step = 0

  const overlay = document.createElement('div')
  overlay.id = 'tour-overlay'
  overlay.className = 'tour-overlay'
  overlay.innerHTML = buildStep(step)

  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeTour(overlay)
  })

  overlay.addEventListener('click', e => {
    if (e.target.closest('#tour-next')) {
      step++
      if (step >= STEPS.length) { closeTour(overlay); return }
      overlay.querySelector('.tour-card').innerHTML = stepInner(step)
      bindStepButtons(overlay, () => {
        step++
        if (step >= STEPS.length) { closeTour(overlay); return }
        overlay.querySelector('.tour-card').innerHTML = stepInner(step)
      }, () => closeTour(overlay))
    }
    if (e.target.closest('#tour-prev')) {
      step = Math.max(0, step - 1)
      overlay.querySelector('.tour-card').innerHTML = stepInner(step)
      bindStepButtons(overlay, () => {
        step++
        if (step >= STEPS.length) { closeTour(overlay); return }
        overlay.querySelector('.tour-card').innerHTML = stepInner(step)
      }, () => closeTour(overlay))
    }
    if (e.target.closest('#tour-skip')) closeTour(overlay)
  })

  document.body.appendChild(overlay)
}

function closeTour(overlay) {
  overlay.classList.add('tour-fade-out')
  setTimeout(() => overlay.remove(), 200)
}

function buildStep(step) {
  return `<div class="tour-card">${stepInner(step)}</div>`
}

function stepInner(step) {
  const s = STEPS[step]
  const isLast = step === STEPS.length - 1
  const dots = STEPS.map((_, i) =>
    `<span class="tour-dot${i === step ? ' active' : ''}"></span>`
  ).join('')

  return `
    <div class="tour-icon">${s.icon}</div>
    <h2 class="tour-title">${s.title}</h2>
    <p class="tour-body">${s.body}</p>
    <div class="tour-dots">${dots}</div>
    <div class="tour-actions">
      ${step > 0 ? `<button id="tour-prev" class="btn btn-ghost btn-sm">Back</button>` : `<span></span>`}
      <button id="tour-skip" class="btn btn-ghost btn-sm">Skip</button>
      <button id="tour-next" class="btn btn-primary btn-sm">${isLast ? 'Get Started' : 'Next'}</button>
    </div>
  `
}

function bindStepButtons() { /* delegation handles this */ }
