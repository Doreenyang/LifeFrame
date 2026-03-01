// Minimal, single-definition TTS helper
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
    const femaleCandidates = ['female','woman','girl','samantha','victoria','amelia','aria','eva','olivia','emma','zira','hazel','susan','karen']
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
// src/utils/tts.js
// Small, robust TTS helper using the browser SpeechSynthesis API.
// Exports: pickVoice, speak, speakWithFeedback
// - pickVoice({ preferFemale, lang }) -> SpeechSynthesisVoice | null
// - speak(text, opts) -> Promise that resolves when speaking finishes
// - speakWithFeedback(text, onStart, onEnd, opts) -> either returns the utterance or undefined
//
// This file intentionally keeps a single, clear implementation to avoid Vite parsing errors.

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

    const femaleCandidates = [
      'female','woman','girl','samantha','victoria','amelia','aria','eva','olivia','emma',
      'zira','hazel','susan','karen','heather','nancy','anna','bella','clara','diana','ella',
      'fiona','grace','hannah','iris','julia','kate','lily','maya','nora','paula','rachel',
      'sara','tina','vera','zoe'
    ]

    let chosen = null
    if (preferFemale) {
      chosen = voices.find(v => v && v.name && femaleCandidates.some(f => v.name.toLowerCase().includes(f)))
    }

    if (!chosen) {
      // try to match language
      try {
        const langPattern = new RegExp(lang.replace('-', '[-_]?' ), 'i')
        chosen = voices.find(v => v && v.lang && langPattern.test(v.lang))
      } catch (_) {}
    }

    if (!chosen) chosen = voices[0]
    return chosen || null
  } catch (e) {
    console.warn('pickVoice failed', e)
    return null
  }
}

export function speak(text, opts = {}) {
  const { rate = 0.95, pitch = 1.05, volume = 0.95, lang = 'en-US', preferFemale = true, robotic = false } = opts
  const s = _safeGetSynthesis()
  if (!s) return Promise.reject(new Error('SpeechSynthesis not supported'))

  // Cancel any in-progress speech for a clean playback
  try { s.cancel() } catch (_) {}

  if (robotic) {
    // staccato word-by-word mode
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

  // single-utterance path
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

// speakWithFeedback provides simple hooks and a humanize option.
export function speakWithFeedback(text, onStart, onEnd, opts = {}) {
  const s = _safeGetSynthesis()
  if (!s) { try { onEnd && onEnd() } catch (_) {} ; return }

  // defensive cancel so new playback starts fresh
  try { s.cancel() } catch (_) {}

  const lang = opts.lang || 'en-US'
  const baseRate = opts.rate ?? 1.0
  const basePitch = opts.pitch ?? 1.05
  const volume = opts.volume ?? 0.95
  const preferFemale = opts.preferFemale !== false
  const humanize = opts.humanize !== false // default true
  const robotic = opts.robotic === true

  const v = pickVoice({ preferFemale, lang })

  // Helper to split into sentence-like chunks without using lookbehind
  const splitSentences = (str) => {
    const re = /[^.!?]+[.!?]*\s*/g
    const m = String(str).match(re)
    if (!m) return [String(str)]
    return m.map(s => s.trim()).filter(Boolean)
  }

  if (robotic) {
    // reuse the staccato words flow
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
      // gentle, bounded random variation
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

  // fallback: single utterance with onStart/onEnd hooks
  const ut = new SpeechSynthesisUtterance(String(text))
  ut.lang = lang
  try { ut.rate = baseRate } catch (_) {}
  try { ut.pitch = basePitch } catch (_) {}
  try { ut.volume = volume } catch (_) {}
  if (v) ut.voice = v
  ut.onstart = () => { try { onStart && onStart() } catch (_) {} }
  ut.onend = () => { try { onEnd && onEnd() } catch (_) {} }
  ut.onerror = (e) => { console.warn('tts error', e); try { onEnd && onEnd() } catch (_) {} }

  // If voices haven't loaded yet, keep a listener to set voice when available
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
// Lightweight TTS helper using the browser SpeechSynthesis API.
// Free, runs entirely in-browser (no API keys). Quality depends on platform-installed voices.

function _safeVoices() {
  try { return window.speechSynthesis.getVoices() || [] } catch (_) { return [] }
}

export function pickVoice({ preferFemale = true, lang = 'en-US' } = {}) {
  try {
    const voices = _safeVoices()
    if (!voices.length) return null

    // Extended list of common female voice name fragments across platforms
    const femaleCandidates = [
      'female','woman','girl','samantha','victoria','amelia','aria','eva','olivia','emma',
      'zira','hazel','susan','karen','heather','nancy','anna','bella','clara','diana','ella',
      'fiona','grace','hannah','iris','julia','kate','lily','maya','nora','paula','rachel',
      'sara','tina','vera','zoe','alloy'
    ]

    let v = null
    if (preferFemale) {
      v = voices.find(vv => vv.name && femaleCandidates.some(f => vv.name.toLowerCase().includes(f)))
    }
    if (!v) v = voices.find(vv => new RegExp(lang.replace('-', '[-_]?'), 'i').test(vv.lang))
    if (!v) v = voices[0]
    return v
  } catch (e) {
    console.warn('pickVoice failed', e)
    return null
  }
}

export function speak(text, { rate = 1.0, pitch = 1.05, volume = 0.95, lang = 'en-US', preferFemale = true } = {}) {
  try {
    const s = window.speechSynthesis
    if (!s) return Promise.reject(new Error('SpeechSynthesis not supported'))
    s.cancel()

    const ut = new SpeechSynthesisUtterance(String(text))
    ut.lang = lang
    try { ut.rate = rate } catch (_) {}
    try { ut.pitch = pitch } catch (_) {}
    try { ut.volume = volume } catch (_) {}
    const v = pickVoice({ preferFemale, lang })
    if (v) ut.voice = v

    return new Promise((resolve) => {
      ut.onend = () => resolve()
      ut.onerror = (e) => { console.warn('tts error', e); resolve() }
      try { s.speak(ut) } catch (e) { console.warn('speak call failed', e); resolve() }
    })
  } catch (e) {
    console.warn('speak failed', e)
    return Promise.resolve()
  }
}

export function speakWithFeedback(text, onStart, onEnd, opts = {}) {
  try {
    const s = window.speechSynthesis
    if (!s) { try { onEnd && onEnd() } catch (_) {} ; return }
    s.cancel()

    const lang = opts.lang || 'en-US'
    const baseRate = opts.rate ?? 1.0
    const basePitch = opts.pitch ?? 1.05
    const volume = opts.volume ?? 0.95
    const preferFemale = opts.preferFemale !== false
    const humanize = opts.humanize !== false // default true

    const v = pickVoice({ preferFemale, lang })

    if (humanize) {
      // Split into sentence-like chunks to create natural pauses and slight prosody variation
      const chunks = String(text).replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/).filter(Boolean)
      let idx = 0
      try { onStart && onStart() } catch (_) {}

      const speakChunk = () => {
        if (idx >= chunks.length) { try { onEnd && onEnd() } catch (_) {} ; return }
        const chunk = chunks[idx++]
        const ut = new SpeechSynthesisUtterance(chunk)
        ut.lang = lang
        // small random variation to mimic human prosody
        const rate = Math.max(0.88, Math.min(1.12, baseRate + (Math.random() - 0.5) * 0.06))
        const pitch = Math.max(0.96, Math.min(1.14, basePitch + (Math.random() - 0.5) * 0.04))
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

    // fallback: single smooth utterance
    const ut = new SpeechSynthesisUtterance(String(text))
    ut.lang = lang
    try { ut.rate = baseRate } catch (_) {}
    try { ut.pitch = basePitch } catch (_) {}
    try { ut.volume = volume } catch (_) {}
    if (v) ut.voice = v

    ut.onstart = () => { try { onStart && onStart() } catch (_) {} }
    ut.onend = () => { try { onEnd && onEnd() } catch (_) {} }
    ut.onerror = (e) => { console.warn('tts error', e); try { onEnd && onEnd() } catch (_) {} }

    if (!s.getVoices().length) {
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
  } catch (e) {
    console.warn('speakWithFeedback wrapper failed', e)
    try { onEnd && onEnd() } catch (_) {}
  }
}


// Lightweight TTS helper using the browser SpeechSynthesis API.
// Free, runs entirely in-browser (no API keys). Quality depends on platform-installed voices.

export function pickVoice({ preferFemale=true, lang='en-US' } = {}) {
  try {
    const s = window.speechSynthesis
    if (!s) return null
    const voices = s.getVoices() || []
    if (!voices.length) return null
    const femaleCandidates = ['female','woman','girl','samantha','victoria','amelia','aria','eva','olivia','emma']
    let v = null
    if (preferFemale) {
      v = voices.find(vv => vv.name && femaleCandidates.some(f => vv.name.toLowerCase().includes(f)))
    }
    if (!v) v = voices.find(vv => new RegExp(lang.replace('-', '[-_]?'), 'i').test(vv.lang))
    if (!v) v = voices[0]
    return v
  } catch (e) {
    console.warn('pickVoice failed', e)
    return null
  }
}

export function speak(text, { rate=0.95, pitch=1.0, volume=1, lang='en-US', preferFemale=true } = {}) {
  try {
    const s = window.speechSynthesis
    if (!s) return Promise.reject(new Error('SpeechSynthesis not supported'))
    s.cancel()
    // support a simple robotic mode by speaking in short staccato chunks
    // if caller passed `robotic: true` inside the options object
    const robotic = arguments[1] && arguments[1].robotic
    if (robotic) {
      // break text into words and speak each word as a separate utterance
      const words = String(text).split(/\s+/).filter(Boolean)
      const v = pickVoice({ preferFemale, lang })
      let idx = 0
      return new Promise((resolve) => {
        const speakNext = () => {
          if (idx >= words.length) return resolve()
          const w = words[idx++]
          const utw = new SpeechSynthesisUtterance(w)
          utw.lang = lang
          try { utw.rate = Math.max(0.6, Math.min(1.2, rate)) } catch(_) {}
          try { utw.pitch = pitch } catch(_) {}
          try { utw.volume = volume } catch(_) {}
          if (v) utw.voice = v
          utw.onend = () => {
            // short mechanical pause between words
            setTimeout(speakNext, 90)
          }
          utw.onerror = () => {
            setTimeout(speakNext, 90)
          }
          try { s.speak(utw) } catch (e) { console.warn('speak chunk failed', e); setTimeout(speakNext, 90) }
        }
        speakNext()
      })
    }

    const ut = new SpeechSynthesisUtterance(text)
    ut.lang = lang
    try { ut.rate = rate } catch(_) {}
    try { ut.pitch = pitch } catch(_) {}
    try { ut.volume = volume } catch(_) {}
    const v = pickVoice({ preferFemale, lang })
    if (v) ut.voice = v

    return new Promise((resolve, reject) => {
      ut.onend = () => resolve()
      ut.onerror = (e) => { console.warn('tts error', e); resolve() }
      // voices may not be loaded; ensure we still call speak
      try { s.speak(ut) } catch (e) { console.warn('speak call failed', e); resolve() }
    })
  } catch (e) {
    console.warn('speak failed', e)
    return Promise.resolve()
  }
}

export function speakWithFeedback(text, onStart, onEnd, opts = {}) {
  try {
    const s = window.speechSynthesis
    if (!s) { try { onEnd && onEnd() } catch(_){}; return }
    s.cancel()
    const lang = opts.lang || 'en-US'
    const rate = opts.rate ?? 0.95
      const lang = opts.lang || 'en-US'
      const baseRate = opts.rate ?? 1.0
      const basePitch = opts.pitch ?? 1.05
      const volume = opts.volume ?? 0.95
      const preferFemale = opts.preferFemale !== false
      const humanize = opts.humanize !== false // default true

    if (robotic) {
      // staccato speak: speak words one by one to produce a mechanical cadence
      const words = String(text).split(/\s+/).filter(Boolean)
    const lang = opts.lang || 'en-US'
    const baseRate = opts.rate ?? 1.0
    const basePitch = opts.pitch ?? 1.05
    const volume = opts.volume ?? 0.95
    const preferFemale = opts.preferFemale !== false
    const humanize = opts.humanize !== false // default true

    const v = pickVoice({ preferFemale, lang })

    // Natural-sounding: break into sentence-like chunks and add slight, varying prosody
    if (humanize) {
      const chunks = String(text)
        .replace(/\s+/g, ' ')
        .split(/(?<=[.!?])\s+/)
        .filter(Boolean)

      let idx = 0
      try { onStart && onStart() } catch(_){}

      const speakChunk = () => {
        if (idx >= chunks.length) { try { onEnd && onEnd() } catch(_){}; return }
        const chunk = chunks[idx++]
        const ut = new SpeechSynthesisUtterance(chunk)
        ut.lang = lang
        // gentle random variation to mimic human prosody
        const rate = Math.max(0.85, Math.min(1.15, baseRate + (Math.random() - 0.5) * 0.08))
        const pitch = Math.max(0.95, Math.min(1.2, basePitch + (Math.random() - 0.5) * 0.06))
        try { ut.rate = rate } catch(_){}
        try { ut.pitch = pitch } catch(_){}
        try { ut.volume = volume } catch(_){}
        if (v) ut.voice = v
        ut.onend = () => setTimeout(speakChunk, opts.pauseBetweenChunks ?? 140)
        ut.onerror = () => setTimeout(speakChunk, opts.pauseBetweenChunks ?? 140)
        try { s.speak(ut) } catch (e) { console.warn('speak chunk failed', e); setTimeout(speakChunk, opts.pauseBetweenChunks ?? 140) }
      }
      speakChunk()
      return
    }

    // fallback: single utterance
    const ut = new SpeechSynthesisUtterance(text)
    ut.lang = lang
    try { ut.rate = baseRate } catch(_){}
    try { ut.pitch = basePitch } catch(_){}
    try { ut.volume = volume } catch(_){}
    if (v) ut.voice = v

    ut.onstart = () => { try { onStart && onStart() } catch(_){} }
    ut.onend = () => { try { onEnd && onEnd() } catch(_){} }
    ut.onerror = (e) => { console.warn('tts error', e); try { onEnd && onEnd() } catch(_){} }

    if (!s.getVoices().length) {
      const cb = () => {
        try { const vv = pickVoice({ preferFemale, lang }); if (vv) ut.voice = vv } catch(_){}
        try { s.removeEventListener('voiceschanged', cb) } catch(_){}
      }
      try { s.addEventListener('voiceschanged', cb) } catch(_){}
      try { s.speak(ut) } catch(_){}
      return ut
    }

    try { s.speak(ut) } catch (e) { console.warn('speak failed', e); try { onEnd && onEnd() } catch(_){} }
    return ut
        try { utw.pitch = pitch } catch(_) {}
        try { utw.volume = volume } catch(_) {}
        if (v) utw.voice = v
        utw.onend = () => setTimeout(speakNext, opts.chunkPause || 90)
        utw.onerror = () => setTimeout(speakNext, opts.chunkPause || 90)
        try { s.speak(utw) } catch (e) { console.warn('speak chunk failed', e); setTimeout(speakNext, opts.chunkPause || 90) }
      }
      speakNext()
      return
    }

    const ut = new SpeechSynthesisUtterance(text)
    ut.lang = lang
    try { ut.rate = rate } catch(_) {}
    try { ut.pitch = pitch } catch(_) {}
    try { ut.volume = volume } catch(_) {}
    if (v) ut.voice = v

    ut.onstart = () => { try { onStart && onStart() } catch(_){} }
    ut.onend = () => { try { onEnd && onEnd() } catch(_){} }
    ut.onerror = (e) => { console.warn('tts error', e); try { onEnd && onEnd() } catch(_){} }

    // If voices not loaded yet, attach listener but still call speak
    if (!s.getVoices().length) {
      const cb = () => {
        try { const vv = pickVoice({ preferFemale, lang }); if (vv) ut.voice = vv } catch(_){}
        try { s.removeEventListener('voiceschanged', cb) } catch(_){}
      }
      try { s.addEventListener('voiceschanged', cb) } catch(_){}
      try { s.speak(ut) } catch(_){}
      return ut
    }

    try { s.speak(ut) } catch (e) { console.warn('speak failed', e); try { onEnd && onEnd() } catch(_){} }
    return ut
  } catch (e) {
    console.warn('speakWithFeedback wrapper failed', e)
    try { onEnd && onEnd() } catch(_){}
  }
}
