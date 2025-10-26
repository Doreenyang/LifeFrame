import React, { useState, useEffect } from 'react'
import { saveSession, saveReminder } from '../utils/storage'
import { summarizeSession } from '../utils/ai'

function speak(text) {
  try {
    const s = window.speechSynthesis
    if (!s) return
    s.cancel()
    const ut = new SpeechSynthesisUtterance(text)
    ut.lang = 'en-US'
    // prefer slightly slower rate and a warmer pitch for a more natural female tone
    try { ut.rate = 0.92 } catch(_) {}
    try { ut.pitch = 1.12 } catch(_) {}

    // pick a female-sounding voice if available
    try {
      const voices = s.getVoices() || []
      const femaleCandidates = ['female','woman','girl','samantha','victoria','amelia','aria','eva','olivia','emma']
      let v = voices.find(vv => femaleCandidates.some(f => vv.name && vv.name.toLowerCase().includes(f)))
      if (!v) v = voices.find(vv => /en[-_]?us/i.test(vv.lang))
      if (!v) v = voices[0]
      if (v) ut.voice = v
    } catch (e) { console.warn('voice pick failed', e) }

    // if voices aren't loaded yet, schedule speak and also listen for voiceschanged
    if (!s.getVoices().length) {
      const cb = () => {
        try {
          const voices = s.getVoices() || []
          const femaleCandidates = ['female','woman','girl','samantha','victoria','amelia','aria','eva','olivia','emma']
          let v = voices.find(vv => femaleCandidates.some(f => vv.name && vv.name.toLowerCase().includes(f)))
          if (!v) v = voices.find(vv => /en[-_]?us/i.test(vv.lang))
          if (!v) v = voices[0]
          if (v) ut.voice = v
        } catch(_){}
        try { s.removeEventListener('voiceschanged', cb) } catch(_){}
      }
      try { s.addEventListener('voiceschanged', cb) } catch(_){}
      setTimeout(() => { try { s.speak(ut) } catch(_){} }, 60)
    }

    try { s.speak(ut) } catch (e) { console.warn('speak failed', e) }
  } catch (e) {
    console.warn('TTS not available', e)
  }
}

export default function MemoryCoach({ photos=[], onSavePhoto, openAlbum }) {
  const [running, setRunning] = useState(false)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [responses, setResponses] = useState([])
  const [sessionStart, setSessionStart] = useState(null)
  const [answer, setAnswer] = useState('')
  const [order, setOrder] = useState([])
  const [listening, setListening] = useState(false)
  const recognitionRef = React.useRef(null)
  const [hintReveal, setHintReveal] = useState(0)
  const [showRemindOption, setShowRemindOption] = useState(false)

  const QUESTIONS = [
    'Where did this happen? Try to name a place or setting.',
    'Who was with you in this moment?',
    'What is one small detail you remember (a smell, sound, or color)?'
  ]

  useEffect(() => {
    // prepare a randomized subset (up to 5) to run through
    const ids = photos.map(p => p.id)
    const shuffled = ids.sort(() => Math.random()-0.5).slice(0, Math.min(5, ids.length))
    setOrder(shuffled)
  }, [photos])

  function start() {
    if (!order.length) return
    setResponses([])
    setSessionStart(Date.now())
    setPhotoIndex(0)
    setQuestionIndex(0)
    setRunning(true)
    speak('Welcome to Memory Coach. I will show you a few memories and ask a short question. Ready?')
  }

  function currentPhoto() {
    const id = order[photoIndex]
    return photos.find(p => p.id === id)
  }

  function askCurrentQuestion() {
    const p = currentPhoto()
    if (!p) return
    const qText = QUESTIONS[questionIndex]
    const q = `Look at this moment: ${p.title || 'a memory'}. ${qText}`
    speak(q)
  }

  function maskedTitle(title) {
    if (!title) return ''
    const clean = title.trim()
    const reveal = Math.min(clean.length, Math.max(0, hintReveal))
    return clean.split('').map((ch, i) => i < reveal ? ch : (ch === ' ' ? ' ' : '●')).join('')
  }

  function requestHint() {
    setHintReveal(h => Math.min((currentPhoto()?.title||'').length, h + 1))
    speak('Here is a small hint to help you remember.')
  }

  function startListening() {
    if (listening) return
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      speak('Voice recognition is not available in this browser.')
      return
    }
    const r = new SpeechRecognition()
    r.lang = 'en-US'
    r.interimResults = false
    r.maxAlternatives = 1
    r.onstart = () => { setListening(true); speak('Listening now. Please speak your answer.') }
    r.onresult = (ev) => {
      try {
        const t = ev.results[0][0].transcript
        setAnswer(t)
        setListening(false)
        // Do not auto-submit — let the user confirm by pressing Submit.
        speak('Got it. I captured your answer. Press submit when you are ready to continue.')
      } catch (e) { console.warn(e) }
    }
    r.onerror = (e) => { console.warn('recognition error', e); setListening(false); speak('I could not understand. Please try again.') }
    r.onend = () => { setListening(false) }
    recognitionRef.current = r
    try { r.start() } catch (e) { console.warn('start failed', e); setListening(false) }
  }

  function stopListening() {
    try { recognitionRef.current?.stop(); setListening(false) } catch(_){}
  }

  function submit() {
    const p = currentPhoto()
    if (!p) return
    const qText = QUESTIONS[questionIndex]
    const record = { photoId: p.id, photoTitle: p.title, question: qText, answer: answer || '(no answer)', at: Date.now() }
    setResponses(rs => [...rs, record])
    // append as a comment to the photo (soft save)
    const updated = { ...p, comments: [...(p.comments||[]), `Coach: ${record.question} -> ${record.answer}`] }
    onSavePhoto && onSavePhoto(updated)
    setAnswer('')
    setHintReveal(0)
    setShowRemindOption(false)
    // advance question or photo
    if (questionIndex + 1 < QUESTIONS.length) {
      setQuestionIndex(q => q + 1)
      setTimeout(() => askCurrentQuestion(), 600)
      return
    }
    // finished questions for this photo
    if (photoIndex + 1 < order.length) {
      setPhotoIndex(pidx => pidx + 1)
      setQuestionIndex(0)
      setTimeout(() => askCurrentQuestion(), 700)
      return
    }
    // session complete: persist and show summary
    setRunning(false)
    try {
      saveSession({ startedAt: sessionStart || Date.now(), entries: responses.concat([record]) })
    } catch(e) { console.warn(e) }
    speak('Great job — session complete. You can review your answers below.')
  }

  // advance without saving an answer (skip)
  function skip() {
    setAnswer('')
    setHintReveal(0)
    setShowRemindOption(false)
    // advance question or photo
    if (questionIndex + 1 < QUESTIONS.length) {
      setQuestionIndex(q => q + 1)
      setTimeout(() => askCurrentQuestion(), 400)
      return
    }
    if (photoIndex + 1 < order.length) {
      setPhotoIndex(pidx => pidx + 1)
      setQuestionIndex(0)
      setTimeout(() => askCurrentQuestion(), 400)
      return
    }
    setRunning(false)
    try { saveSession({ startedAt: sessionStart || Date.now(), entries: responses }) } catch(e){ console.warn(e) }
    speak('Session complete.')
  }

  function viewDetails() {
    const p = currentPhoto()
    if (!p) return
    if (typeof openAlbum === 'function') {
      try { openAlbum([p], p.title || 'Related photos') } catch(e) { console.warn(e) }
      return
    }
    try { window.open(p.url, '_blank') } catch(e) { console.warn('open failed', e) }
  }

  function simulateVoice() {
    const p = currentPhoto()
    if (!p) return
    const mock = '(simulated voice answer)'
    setAnswer(mock)
    speak('Simulated voice captured. Press Submit to continue or Skip to move on without saving.')
  }

  useEffect(() => {
    if (running) {
      // small delay then ask about first image/question
      setTimeout(() => askCurrentQuestion(), 600)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, photoIndex, questionIndex])

  // reset per-question transient state when photo/question changes
  useEffect(() => {
    setHintReveal(0)
    setShowRemindOption(false)
    setListening(false)
  }, [photoIndex, questionIndex, running])

  // derived AI summary for the current in-memory session
  const aiSessionSummary = summarizeSession(responses)

  return (
    <div className="mt-4 bg-white p-4 sm:p-5 rounded-xl shadow-sm">
      <h3 className="text-lg font-semibold mb-2">Memory Coach (Premium)</h3>
      {!running ? (
        <div>
          <p className="text-sm text-gray-600">Guided, voice-enabled recall sessions to help strengthen memory. Sessions are short and friendly — great for seniors or patients practicing recall.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="w-full sm:w-auto px-4 py-2 bg-rose-500 text-white rounded btn-press animate-pop" onClick={start} disabled={!order.length}>Start Session</button>
            <button className="w-full sm:w-auto px-4 py-2 bg-gray-100 rounded btn-press" onClick={() => speak('Take a moment to breathe and relax. This session will help you recall details about your memories.')}>Play Intro</button>
          </div>
          {responses.length > 0 && (
                <div className="mt-3 text-sm">
                  <div className="font-semibold">Session answers</div>
                  <ul className="mt-2 space-y-1 max-h-40 overflow-auto">
                    {responses.map((s,i) => <li key={i} className="text-sm text-gray-700">• {s.question}: {s.answer}</li>)}
                  </ul>
                </div>
              )}
        </div>
      ) : (
        <div>
          <div className="text-sm text-gray-600 mb-2">Memory {photoIndex+1} of {order.length} • Question {questionIndex+1} of {QUESTIONS.length}</div>
          <div className="card overflow-hidden">
            <img src={currentPhoto()?.url} alt="coach" className="w-full h-44 sm:h-56 md:h-64 lg:h-72 object-cover" />
            <div className="p-3 sm:p-4">
              <div className="text-base font-semibold">{currentPhoto()?.title || 'Memory'}</div>
              <div className="text-sm text-gray-600 mt-2">{QUESTIONS[questionIndex]}</div>
              <div className="mt-3">
                <div className="text-sm text-gray-700">{answer ? 'Voice answer captured — press Submit when ready.' : 'No voice answer yet. Use "Answer by voice" to record.'}</div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="w-full sm:w-auto px-4 py-2 bg-rose-500 text-white rounded btn-press" onClick={submit} disabled={!answer}>Submit</button>
                <button className="w-full sm:w-auto px-4 py-2 bg-gray-100 rounded" onClick={skip}>Skip</button>
                <button className="w-full sm:w-auto px-4 py-2 bg-gray-100 rounded" onClick={simulateVoice}>Simulate voice</button>
                <button className="w-full sm:w-auto px-4 py-2 bg-gray-100 rounded" onClick={viewDetails}>Details</button>
                <button className="w-full sm:w-auto px-4 py-2 bg-gray-100 rounded" onClick={() => speak(QUESTIONS[questionIndex])}>Hear prompt</button>
              </div>
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex gap-2 items-center">
                  <button className="flex-1 sm:flex-none px-3 py-2 bg-rose-200 text-rose-800 rounded btn-press" onClick={()=> listening ? stopListening() : startListening()}>{listening ? 'Stop listening' : 'Answer by voice'}</button>
                  <button className="px-3 py-2 bg-amber-100 text-amber-800 rounded btn-press" onClick={requestHint}>Hint</button>
                  <div className="text-sm text-gray-500">{maskedTitle(currentPhoto()?.title)}</div>
                </div>
                <div className="flex gap-2 items-center">
                  <button className="px-3 py-2 bg-gray-100 text-gray-800 rounded" onClick={() => { setShowRemindOption(true); speak('No problem — I can remind you to check this later.') }}>I don't remember</button>
                  {showRemindOption && (
                    <button className="px-3 py-2 bg-amber-400 text-white rounded btn-press" onClick={() => {
                      const p = currentPhoto()
                      const item = { text: `Reminder to revisit: ${p?.title || 'a memory'}`, at: Date.now(), photo: p ? { id: p.id, url: p.url, title: p.title } : null }
                      try { saveReminder(item); speak('Reminder saved. I will remind you later.'); setShowRemindOption(false) } catch(e){ console.warn(e) }
                    }}>Remind me</button>
                  )}
                </div>
              </div>
              {aiSessionSummary && !running && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded animate-fade-up">
                  <div className="text-sm font-semibold">AI Session Insight</div>
                  <div className="text-sm mt-1 text-gray-800">{aiSessionSummary}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
