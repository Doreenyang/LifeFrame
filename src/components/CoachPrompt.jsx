import React, { useState, useEffect, useRef } from 'react'
import { generateSummaryFromText } from '../utils/ai'

const DEFAULT_PROMPTS = [
  'Who is in this photo?',
  'What did you do that day?',
  'How did you feel during this moment?',
  'Do you remember a smell or sound from this memory?',
  'Is there a story behind this photo?'
]

function getEncouragement(text) {
  const t = (text||'').toLowerCase()
  const happy = ['happy','joy','love','fun','great','amazing','smile']
  for (const h of happy) if (t.includes(h)) return 'That sounds like a happy memory 💛'
  const sad = ['sad','miss','cry','lonely']
  for (const s of sad) if (t.includes(s)) return 'Thank you for sharing — that was meaningful 🧡'
  return 'Nice — saved your memory.'
}

export default function CoachPrompt({ photo, onSave }) {
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState('')
  const recognitionRef = useRef(null)
  useEffect(()=>{
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript
      setAnswer(prev => prev ? prev + ' ' + text : text)
    }
    recognitionRef.current = recognition
    return () => { try { recognitionRef.current && recognitionRef.current.stop() } catch(e){} }
  }, [])

  useEffect(()=>{
    setAnswer('')
    setFeedback('')
  }, [photo, index])

  function startRecord() {
    const r = recognitionRef.current
    if (!r) { alert('SpeechRecognition not supported'); return }
    try { r.start() } catch(e) { console.warn(e) }
  }

  function stopRecord() {
    try { recognitionRef.current && recognitionRef.current.stop() } catch(e){}
  }

  function saveAnswer() {
    const text = (answer || '').trim()
    if (!text) return
    const newAnswers = [...(photo.answers||[]), { prompt: DEFAULT_PROMPTS[index], answer: text, at: Date.now() }]
    const aiSummary = generateSummaryFromText(newAnswers.map(a=>a.answer).join(' '))
  const updated = { ...photo, answers: newAnswers, aiSummary }
    onSave && onSave(updated)
    setFeedback(getEncouragement(text))
    setAiSummary(aiSummary)
    // advance to next prompt after a short delay
    setTimeout(()=>{
      setIndex(i => Math.min(i+1, DEFAULT_PROMPTS.length-1))
    }, 800)
  }

  const [aiSummary, setAiSummary] = useState('')

  return (
    <div className="mt-4 bg-white p-3 rounded-xl shadow-sm">
      <h4 className="font-semibold">Memory Coach Prompts</h4>
      <div className="mt-2 text-sm text-gray-700">{DEFAULT_PROMPTS[index]}</div>
      <div className="mt-3 flex gap-2">
        <input value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Type or use voice to answer" className="flex-1 p-2 border rounded" />
        <button onClick={startRecord} className="px-3 py-2 bg-gray-100 rounded">🎤</button>
        <button onClick={stopRecord} className="px-3 py-2 bg-gray-100 rounded">■</button>
        <button onClick={saveAnswer} className="px-3 py-2 bg-rose-500 text-white rounded">Save</button>
      </div>
      {feedback && <div className="mt-3 text-sm text-gray-700">{feedback}</div>}
      {aiSummary && (
        <div className="mt-3 p-3 bg-rose-50 border border-rose-100 rounded">
          <div className="text-sm font-semibold">AI Insight</div>
          <div className="text-sm mt-1 text-gray-800">{aiSummary}</div>
        </div>
      )}
      <div className="mt-3 text-xs text-gray-500">Prompt {index+1} of {DEFAULT_PROMPTS.length}</div>
    </div>
  )
}
