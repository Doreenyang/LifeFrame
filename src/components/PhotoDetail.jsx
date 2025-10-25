import React, { useState, useEffect } from 'react'
import CoachPrompt from './CoachPrompt'
import { parseReminder, formatReminder } from '../utils/datetime'

export default function PhotoDetail({ photo, onClose, onSave }) {
  const [comment, setComment] = useState('')
  const [local, setLocal] = useState(photo)
  const [reminderMsg, setReminderMsg] = useState('')

  // ensure we show latest photo prop updates
  React.useEffect(()=>{
    setLocal(photo)
  }, [photo])

  function addComment() {
    if (!comment.trim()) return
    const updated = { ...local, comments: [...(local.comments||[]), comment] }
    setLocal(updated)
    onSave(updated)
    setComment('')
  }

  function handleSaveUpdated(updated) {
    setLocal(updated)
    onSave(updated)
  }

  function setReminderFromText(text) {
    const parsed = parseReminder(text)
    const timeLabel = parsed ? formatReminder(parsed) : text
    const reminder = { note: text, timeISO: parsed ? parsed.toISOString() : null, timeLabel, at: Date.now() }
    const updated = { ...local, reminders: [...(local.reminders||[]), reminder] }
    setLocal(updated)
    onSave(updated)
    setReminderMsg(`Reminder set for ${timeLabel}`)
    setTimeout(()=>setReminderMsg(''), 4000)
  }

  async function recordReminder() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) { alert('Speech API not supported'); return }
    const rec = new SpeechRecognition()
    rec.lang = 'en-US'
    rec.interimResults = false
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript
      setReminderFromText(text)
    }
    rec.start()
  }

  // optional voice note to comment
  async function recordToComment() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) { alert('Speech API not supported'); return }
    const rec = new SpeechRecognition()
    rec.lang = 'en-US'
    rec.interimResults = false
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript
      setComment(prev => (prev ? prev + ' ' + text : text))
    }
    rec.start()
  }

  return (
    <div className="max-w-3xl mx-auto py-6">
      <button className="text-sm text-blue-600 mb-3" onClick={onClose}>Back</button>

      <div className="card p-3">
        <img src={local.url} alt="detail" className="w-full h-64 object-cover rounded" />
        <div className="mt-3">
          <div className="text-sm text-gray-700">Emotion: <span className={`emotion-pill ${local.emotion ? 'emotion-'+local.emotion : 'emotion-wonder'}`}>{local.emotion}</span></div>
          <div className="mt-2">
            <h3 className="text-sm font-semibold">Comments</h3>
            <ul className="mt-2 text-sm text-gray-700 space-y-1">
              {(local.comments || []).map((c, i) => <li key={i} className="border rounded p-2 bg-gray-50">{c}</li>)}
            </ul>

            <div className="mt-3 flex gap-2">
              <input value={comment} onChange={e=>setComment(e.target.value)} placeholder="Add a comment" className="flex-1 p-2 border rounded" />
              <button onClick={addComment} className="px-3 py-2 bg-indigo-600 text-white rounded">Add</button>
              <button onClick={recordToComment} className="px-3 py-2 bg-gray-100 rounded">🎤</button>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-semibold">Reminders</h4>
              <div className="mt-2 flex gap-2">
                <input placeholder="e.g. Remind me at 8 PM" className="flex-1 p-2 border rounded" onBlur={e=>e.target.value && setReminderFromText(e.target.value)} />
                <button onClick={recordReminder} className="px-3 py-2 bg-green-600 text-white rounded">Set by Voice</button>
              </div>
              {reminderMsg && <div className="mt-2 text-sm text-green-700">{reminderMsg}</div>}
              <ul className="mt-2 text-sm text-gray-700 space-y-1">
                {(local.reminders || []).map((r,i) => <li key={i} className="border rounded p-2 bg-gray-50">{r.timeLabel || r.timeISO || r.time} — {r.note}</li>)}
              </ul>
            </div>

            <div className="mt-4">
              <CoachPrompt photo={local} onSave={handleSaveUpdated} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
