// src/utils/tts-clean.js
// Clean TTS helper — same API as the old module but written fresh.

function _safeGetSynthesis() {
  try { return window && window.speechSynthesis ? window.speechSynthesis : null } catch (_) { return null }
}

function _getVoicesSafe() {
  const s = _safeGetSynthesis()
  try { return s ? s.getVoices() || [] : [] } catch (_) { return [] }
}

export function pickVoice({ preferFemale = true, lang = 'en-US' } = {}) {
  try {
    const voices = _getVoicesSafe()
    if (!voices || !voices.length) return null
    const femaleCandidates = ['female','woman','girl','samantha','victoria','amelia','aria','eva','olivia','emma']
    let chosen = null
    if (preferFemale) chosen = voices.find(v => v && v.name && femaleCandidates.some(f => v.name.toLowerCase().includes(f)))
    if (!chosen) {
      try { const langPattern = new RegExp(lang.replace('-', '[-_]?'), 'i'); chosen = voices.find(v => v && v.lang && langPattern.test(v.lang)) } catch (_) {}
    }
    if (!chosen) chosen = voices[0]
    return chosen || null
  } catch (e) { console.warn('pickVoice failed', e); return null }
}

export function speak(text, opts = {}) {
  const { rate = 0.95, pitch = 1.05, volume = 0.95, lang = 'en-US', preferFemale = true, robotic = false } = opts
  const s = _safeGetSynthesis()
  if (!s) return Promise.reject(new Error('SpeechSynthesis not supported'))
  try { s.cancel() } catch (_) {}
  if (robotic) {
    const words = String(text).split(/\s+/).filter(Boolean)
    const v = pickVoice({ preferFemale, lang })
    let i = 0
    return new Promise(resolve => {
      const next = () => {
        if (i >= words.length) return resolve()
        const ut = new SpeechSynthesisUtterance(words[i++])
        ut.lang = lang
        try { ut.rate = Math.max(0.6, Math.min(1.2, rate)) } catch (_) {}
        try { ut.pitch = pitch } catch (_) {}
        try { ut.volume = volume } catch (_) {}
        if (v) ut.voice = v
        ut.onend = () => setTimeout(next, opts.wordPause || 90)
        ut.onerror = () => setTimeout(next, opts.wordPause || 90)
        try { s.speak(ut) } catch (e) { console.warn('speak word failed', e); setTimeout(next, opts.wordPause || 90) }
      }
      next()
    })
  }
  return new Promise(resolve => {
    const ut = new SpeechSynthesisUtterance(String(text))
    ut.lang = lang
    try { ut.rate = rate } catch (_) {}
    try { ut.pitch = pitch } catch (_) {}
    try { ut.volume = volume } catch (_) {}
    const v = pickVoice({ preferFemale, lang })
    if (v) ut.voice = v
    ut.onend = () => resolve()
    ut.onerror = (e) => { console.warn('tts error', e); resolve() }
    try { s.speak(ut) } catch (e) { console.warn('speak call failed', e); resolve() }
  })
}

export function speakWithFeedback(text, onStart, onEnd, opts = {}) {
  const s = _safeGetSynthesis()
  if (!s) { try { onEnd && onEnd() } catch (_) {} ; return }
  try { s.cancel() } catch (_) {}
  const lang = opts.lang || 'en-US'
  const baseRate = opts.rate ?? 1.0
  const basePitch = opts.pitch ?? 1.05
  const volume = opts.volume ?? 0.95
  const preferFemale = opts.preferFemale !== false
  const humanize = opts.humanize !== false
  const robotic = opts.robotic === true
  const v = pickVoice({ preferFemale, lang })
  const splitSentences = (str) => {
    const re = /[^.!?]+[.!?]*\s*/g
    const m = String(str).match(re)
    if (!m) return [String(str)]
    return m.map(s => s.trim()).filter(Boolean)
  }
  if (robotic) {
    const words = String(text).split(/\s+/).filter(Boolean)
    let idx = 0
    try { onStart && onStart() } catch (_) {}
    const speakNext = () => {
      if (idx >= words.length) { try { onEnd && onEnd() } catch (_) {} ; return }
      const ut = new SpeechSynthesisUtterance(words[idx++])
      ut.lang = lang
      try { ut.rate = Math.max(0.6, Math.min(1.2, baseRate)) } catch (_) {}
      try { ut.pitch = basePitch } catch (_) {}
      try { ut.volume = volume } catch (_) {}
      if (v) ut.voice = v
      ut.onend = () => setTimeout(speakNext, opts.wordPause || 90)
      ut.onerror = () => setTimeout(speakNext, opts.wordPause || 90)
      try { s.speak(ut) } catch (e) { console.warn('speak word failed', e); setTimeout(speakNext, opts.wordPause || 90) }
    }
    speakNext()
    return
  }
  if (humanize) {
    const chunks = splitSentences(String(text))
    let i = 0
    try { onStart && onStart() } catch (_) {}
    const speakChunk = () => {
      if (i >= chunks.length) { try { onEnd && onEnd() } catch (_) {} ; return }
      const chunk = chunks[i++]
      const ut = new SpeechSynthesisUtterance(chunk)
      ut.lang = lang
      const rate = Math.max(0.85, Math.min(1.15, baseRate + (Math.random() - 0.5) * 0.08))
      const pitch = Math.max(0.95, Math.min(1.2, basePitch + (Math.random() - 0.5) * 0.06))
      try { ut.rate = rate } catch (_) {}
      try { ut.pitch = pitch } catch (_) {}
      try { ut.volume = volume } catch (_) {}
      if (v) ut.voice = v
      ut.onend = () => setTimeout(speakChunk, opts.pauseBetweenChunks ?? 140)
      ut.onerror = () => setTimeout(speakChunk, opts.pauseBetweenChunks ?? 140)
      try { s.speak(ut) } catch (e) { console.warn('speak chunk failed', e); setTimeout(speakChunk, opts.pauseBetweenChunks ?? 140) }
    }
    speakChunk()
    return
  }
  const ut = new SpeechSynthesisUtterance(String(text))
  ut.lang = lang
  try { ut.rate = baseRate } catch (_) {}
  try { ut.pitch = basePitch } catch (_) {}
  try { ut.volume = volume } catch (_) {}
  if (v) ut.voice = v
  ut.onstart = () => { try { onStart && onStart() } catch (_) {} }
  ut.onend = () => { try { onEnd && onEnd() } catch (_) {} }
  ut.onerror = (e) => { console.warn('tts error', e); try { onEnd && onEnd() } catch (_) {} }
  const voicesNow = _getVoicesSafe()
  if (!voicesNow.length) {
    const cb = () => {
      try { const vv = pickVoice({ preferFemale, lang }); if (vv) ut.voice = vv } catch (_) {}
      try { s.removeEventListener('voiceschanged', cb) } catch (_) {}
    }
    try { s.addEventListener('voiceschanged', cb) } catch (_) {}
    try { s.speak(ut) } catch (_) {}
    return ut
  }
  try { s.speak(ut) } catch (e) { console.warn('speak failed', e); try { onEnd && onEnd() } catch (_) {} }
  return ut
}

export default { pickVoice, speak, speakWithFeedback }
