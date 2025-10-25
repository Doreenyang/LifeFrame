import React, { useState, useEffect } from 'react'
import { saveSession } from '../utils/storage'

function speak(text) {
  try {
    const s = window.speechSynthesis
    if (!s) return
    s.cancel()
    const ut = new SpeechSynthesisUtterance(text)
    ut.lang = 'en-US'
    ut.rate = 0.95
    s.speak(ut)
  } catch (e) {
    console.warn('TTS not available', e)
  }
}

export default function MemoryCoach({ photos=[], onSavePhoto }) {
  const [running, setRunning] = useState(false)
  const [index, setIndex] = useState(0)
  const [session, setSession] = useState([])
  const [sessionStart, setSessionStart] = useState(null)
  const [answer, setAnswer] = useState('')
  const [order, setOrder] = useState([])

  useEffect(() => {
    // prepare a randomized subset (up to 5) to run through
    const ids = photos.map(p => p.id)
    const shuffled = ids.sort(() => Math.random()-0.5).slice(0, Math.min(5, ids.length))
    setOrder(shuffled)
  }, [photos])

  function start() {
    if (!order.length) return
    setSession([])
    setSessionStart(Date.now())
    setIndex(0)
    setRunning(true)
    speak('Welcome to Memory Coach. I will show you a few memories and ask a short question. Ready?')
  }

  function currentPhoto() {
    const id = order[index]
    return photos.find(p => p.id === id)
  }

  function ask() {
    const p = currentPhoto()
    if (!p) return
    const q = `Look at this moment: ${p.title || 'a memory'}. Can you tell me one thing you remember about it?`;
    speak(q)
  }

  function submit() {
    const p = currentPhoto()
    if (!p) return
    const record = { photoId: p.id, answer: answer || '(no answer)', at: Date.now(), photoTitle: p.title }
    setSession(s => {
      const next = [...s, record]
      return next
    })
    // append as a comment to the photo (soft save)
    const updated = { ...p, comments: [...(p.comments||[]), `Coach: ${record.answer}`] }
    onSavePhoto && onSavePhoto(updated)
    setAnswer('')
    // move to next
    if (index + 1 < order.length) {
      setIndex(i => i+1)
      setTimeout(() => ask(), 700)
    } else {
      // session complete: persist the whole session
      setRunning(false)
      try {
        saveSession({ startedAt: sessionStart || Date.now(), entries: [...session, record] })
      } catch(e) { console.warn(e) }
      speak('Great job — session complete. You can review your answers below.')
    }
  }

  useEffect(() => {
    if (running) {
      // small delay then ask about first image
      setTimeout(() => ask(), 600)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, index])

  return (
    <div className="mt-4 bg-white p-4 rounded-xl shadow-sm">
      <h3 className="text-lg font-semibold mb-2">Memory Coach (Premium)</h3>
      {!running ? (
        <div>
          <p className="text-sm text-gray-600">Guided, voice-enabled recall sessions to help strengthen memory. Sessions are short and friendly — great for seniors or patients practicing recall.</p>
          <div className="mt-3 flex gap-2">
            <button className="px-4 py-2 bg-indigo-600 text-white rounded" onClick={start} disabled={!order.length}>Start Session</button>
            <button className="px-4 py-2 bg-gray-100 rounded" onClick={() => speak('Take a moment to breathe and relax. This session will help you recall details about your memories.')}>Play Intro</button>
          </div>
          {session.length > 0 && (
            <div className="mt-3 text-sm">
              <div className="font-semibold">Session answers</div>
              <ul className="mt-2 space-y-1">
                {session.map((s,i) => <li key={i} className="text-sm text-gray-700">• {s.answer}</li>)}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="text-sm text-gray-600 mb-2">Question {index+1} of {order.length}</div>
          <div className="card overflow-hidden">
            <img src={currentPhoto()?.url} alt="coach" className="card-img" />
            <div className="p-3">
              <div className="text-base font-semibold">{currentPhoto()?.title || 'Memory'}</div>
              <div className="text-sm text-gray-600 mt-2">Tell me one thing you remember about this moment.</div>
              <textarea value={answer} onChange={e=>setAnswer(e.target.value)} className="w-full mt-3 border rounded p-2" rows={3} />
              <div className="mt-3 flex gap-2">
                <button className="px-4 py-2 bg-indigo-600 text-white rounded" onClick={submit}>Submit</button>
                <button className="px-4 py-2 bg-gray-100 rounded" onClick={() => speak(`Please take your time. What do you remember about ${currentPhoto()?.title || 'this memory'}?`)}>Hear prompt</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
