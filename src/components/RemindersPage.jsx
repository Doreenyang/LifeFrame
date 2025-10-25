import React, { useState, useEffect } from 'react'
import { loadReminders, saveReminder, deleteReminder } from '../utils/storage'

const PROMPTS = [
  `Hey — do you remember this? This is your old friend from elementary school. You two were best friends but haven't talked for about five years. Maybe text her and say "Hello old friend". Do you have any memory about her?`,
  `Do you remember this place — your mother's school? Do you still recall what it looked like? Any idea you want to share? Maybe it's time to go back and see it. It's been a long time.`,
  `This photo might bring back a familiar smell or a song. Can you recall a sound or smell that makes this moment vivid?`,
  `Think about a small detail here — a color, a gesture, or a phrase someone said. What comes to mind first?`,
  `Who would you like to tell this story to? Imagine telling them now — what do you say?`
]

function speak(text) {
  try {
    const s = window.speechSynthesis
    if (!s) return
    s.cancel()
    const ut = new SpeechSynthesisUtterance(text)
    ut.lang = 'en-US'
    ut.rate = 0.95
    s.speak(ut)
  } catch (e) { console.warn('TTS not available', e) }
}

const FALLBACK_PHOTOS = [
  { id: 'sample-1', url: 'https://images.unsplash.com/photo-1503264116251-35a269479413?w=1200&q=80&auto=format&fit=crop', title: 'Old friends' },
  { id: 'sample-2', url: 'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?w=1200&q=80&auto=format&fit=crop', title: 'School building' },
  { id: 'sample-3', url: 'https://images.unsplash.com/photo-1504198453319-5ce911bafcde?w=1200&q=80&auto=format&fit=crop', title: 'Family gathering' },
  { id: 'sample-4', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1200&q=80&auto=format&fit=crop', title: 'Childhood memory' }
]

export default function RemindersPage({ photos = [] }) {
  const [reminders, setReminders] = useState([])
  const [busyIdx, setBusyIdx] = useState(-1)
  const [attachedMap, setAttachedMap] = useState({})
  const availablePhotos = [...photos, ...FALLBACK_PHOTOS]

  // prefill a default photo for each prompt so the image is shown on the card
  useEffect(() => {
    if (!availablePhotos || !availablePhotos.length) return
    const defaults = {}
    PROMPTS.forEach((_, i) => {
      const pick = availablePhotos[i % availablePhotos.length]
      if (pick) defaults[i] = pick.id
    })
    setAttachedMap(defaults)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos])

  useEffect(()=>{
    setReminders(loadReminders())
  }, [])

  function handleSave(prompt, idx) {
    // pick the attached/default photo for this prompt
    const attachedId = attachedMap[idx]
    const photo = attachedId ? availablePhotos.find(p => p.id === attachedId) : null
    const photoSnapshot = photo ? { id: photo.id, url: photo.url, title: photo.title } : null
    const item = { text: prompt, at: Date.now(), photo: photoSnapshot }
    saveReminder(item)
    setReminders(loadReminders())
    setBusyIdx(-1)
  }

  function handleDelete(i) {
    deleteReminder(i)
    setReminders(loadReminders())
  }

  return (
    <section className="max-w-3xl mx-auto py-6">
      <h2 className="text-xl font-semibold mb-3">Reminders & Memory Prompts</h2>

      <p className="text-sm text-gray-600 mb-4">Use these friendly prompts to jog memories — play them aloud or save a reminder to reflect later.</p>

      <div className="space-y-3">
        {PROMPTS.map((p, i) => (
          <div key={i} className="bg-white p-3 rounded-xl shadow-sm animate-pop">
            {/* show photo on top of the prompt so user sees a visual first */}
            {availablePhotos[i % availablePhotos.length] && (
              <img src={availablePhotos[i % availablePhotos.length].url} alt={availablePhotos[i % availablePhotos.length].title} className="w-full h-40 object-cover rounded-md mb-3" />
            )}
            <div className="text-sm text-gray-800 mb-2">{p}</div>
            <div className="flex gap-2 items-center">
              <button className="px-3 py-2 bg-rose-500 text-white rounded btn-press" onClick={()=>speak(p)}>Play</button>
              <button className="px-3 py-2 bg-amber-400 text-white rounded btn-press" onClick={()=>{ setBusyIdx(i); handleSave(p, i) }}>{busyIdx===i ? 'Saved' : 'Save reminder'}</button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <h3 className="text-md font-semibold">Saved reminders</h3>
        {reminders.length === 0 ? (
          <div className="mt-2 text-sm text-gray-500">No reminders yet — save a prompt above.</div>
        ) : (
          <ul className="mt-2 space-y-2">
            {reminders.map((r, idx) => (
              <li key={idx} className="bg-white p-3 rounded shadow-sm flex justify-between items-start animate-fade-up">
                <div className="flex gap-3">
                  {r.photo && (
                    <img src={r.photo.url} alt={r.photo.title} className="w-20 h-14 object-cover rounded" />
                  )}
                  <div>
                    <div className="text-sm text-gray-800">{r.text}</div>
                    <div className="text-xs text-gray-400 mt-1">Saved {new Date(r.at).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button className="px-2 py-1 bg-gray-100 rounded btn-press" onClick={()=>speak(r.text)}>🔈</button>
                  <button className="px-2 py-1 bg-red-100 text-red-700 rounded btn-press" onClick={()=>handleDelete(idx)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
