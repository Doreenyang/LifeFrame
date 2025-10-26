import React, { useState, useEffect, useRef } from 'react'
import { loadReminders, saveReminder, deleteReminder } from '../utils/storage'
import { searchPhotos } from '../data/search'
import washuImg from '../assets/washu.png'
import winImg from '../assets/win.jpg'
import { speak, speakWithFeedback } from '../utils/tts-clean'

const PROMPTS = [
  `Do you remember 10 years ago when you won the math competition? You were the winner — be proud of yourself. That took courage, hard work, and determination. What do you remember from that day?`,
  `Do you remember this place — your undergraduate school? Do you still recall what it looked like? Any idea you want to share? Maybe it's time to go back and see it. It's been a long time.`,
  `This photo might bring back a familiar smell or a song. Can you recall a sound or smell that makes this moment vivid?`,
  `Think about a small detail here — a color, a gesture, or a phrase someone said. What comes to mind first?`,
  `Who would you like to tell this story to? Imagine telling them now — what do you say?`
]

// Uses the shared TTS helper in src/utils/tts.js

const FALLBACK_PHOTOS = [
  { id: 'sample-1', url: winImg, title: 'Competition Winner', tags: ['winner','competition','achievement'], peopleCount: 1 },
  { id: 'sample-2', url: 'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?w=1200&q=80&auto=format&fit=crop', title: 'School building', tags: ['school','building'], peopleCount: 0 },
  { id: 'sample-3', url: 'https://images.unsplash.com/photo-1504198453319-5ce911bafcde?w=1200&q=80&auto=format&fit=crop', title: 'Family gathering', tags: ['family','gathering'], peopleCount: 4 },
  { id: 'sample-4', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1200&q=80&auto=format&fit=crop', title: 'Childhood memory', tags: ['childhood','nostalgia'], peopleCount: 1 },
  // extra samples: two-person candids and a campus image (WashU-style)
  { id: 'sample-5', url: 'https://images.unsplash.com/photo-1524504388940-8f20f5f8a0c6?w=1200&q=80&auto=format&fit=crop', title: 'Two friends laughing', tags: ['friends','two','laughing'], peopleCount: 2 },
  { id: 'sample-6', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200&q=80&auto=format&fit=crop', title: 'Outdoor pair', tags: ['couple','two','friends'], peopleCount: 2 },
  { id: 'sample-7', url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=80&auto=format&fit=crop', title: 'University campus', tags: ['campus','university','washu'], peopleCount: 0 },
  // local WashU asset provided in the repo (preferred for campus prompts)
  { id: 'washu-local', url: washuImg, title: 'WashU campus', tags: ['washu','campus','washington university'], peopleCount: 0 }
]

export default function RemindersPage({ photos = [], openAlbum }) {
  const [reminders, setReminders] = useState([])
  const [busyIdx, setBusyIdx] = useState(-1)
  const [attachedMap, setAttachedMap] = useState({})
  const [playingIdx, setPlayingIdx] = useState(-1)
  const availablePhotos = [...photos, ...FALLBACK_PHOTOS]
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryPhotos, setGalleryPhotos] = useState([])
  const [galleryTitle, setGalleryTitle] = useState('')

  // swipe state for Tinder-style single-card UI
  const [translates, setTranslates] = useState({}) // idx -> x
  const [draggingIdx, setDraggingIdx] = useState(null)
  const dragRef = useRef({ startX: 0, pointerId: null })
  const [currentIdx, setCurrentIdx] = useState(0)
  const [showSaved, setShowSaved] = useState(true)

  // pointer-based swipe handlers (mouse & touch)
  function onPointerStart(e, idx) {
    // don't start a drag if user pressed an interactive element inside the card
    try {
      const tg = e.target
      if (tg && tg.closest && (tg.closest('button') || tg.closest('a') || tg.closest('input') || tg.closest('textarea'))) return
    } catch(_) {}
    try { e.currentTarget?.setPointerCapture?.(e.pointerId) } catch (__) {}
    // store start position for this pointer
    dragRef.current = { startX: e.clientX, pointerId: e.pointerId }
    setDraggingIdx(idx)
  }

  function onPointerMove(e, idx) {
    if (draggingIdx !== idx) return
    const dx = e.clientX - dragRef.current.startX
    setTranslates(prev => ({ ...prev, [idx]: dx }))
  }

  function onPointerEnd(e, prompt, idx) {
    try { e.currentTarget?.releasePointerCapture?.(e.pointerId) } catch (__) {}
    const dx = translates[idx] || 0
    const threshold = 120
    setDraggingIdx(null)
    if (dx > threshold) {
      // swipe right -> save and advance
      setTranslates(prev => ({ ...prev, [idx]: window.innerWidth }))
      setTimeout(() => {
        handleSave(prompt, idx)
        setCurrentIdx(ci => ci + 1)
        setTranslates(prev => ({ ...prev, [idx]: 0 }))
      }, 220)
      return
    }
    if (dx < -threshold) {
      // swipe left -> dismiss and advance
      setTranslates(prev => ({ ...prev, [idx]: -window.innerWidth }))
      setTimeout(() => {
        setCurrentIdx(ci => ci + 1)
        setTranslates(prev => ({ ...prev, [idx]: 0 }))
      }, 220)
      return
    }
    // snap back
    setTranslates(prev => ({ ...prev, [idx]: 0 }))
  }

  function openGallery(photo) {
    if (!photo) return
    const tags = (photo.tags || []).map(t => t.toLowerCase())
    const people = photo.peopleCount
    // find related photos by overlapping tags, peopleCount, or similar title words
    const related = availablePhotos.filter(p => {
      if (!p || p.id === photo.id) return false
      const ptags = (p.tags || []).map(t => t.toLowerCase())
      const tagMatch = ptags.some(t => tags.includes(t))
      const peopleMatch = (p.peopleCount && people && p.peopleCount === people)
      const titleMatch = photo.title && p.title && p.title.split(' ')[0] === photo.title.split(' ')[0]
      return tagMatch || peopleMatch || titleMatch
    })
    const picks = related.length ? related : availablePhotos.filter(p=>p.id!==photo.id).slice(0,6)
    // if parent provided openAlbum, navigate to album view instead of modal
    if (openAlbum) {
      openAlbum(picks, photo.title || 'Related photos')
      return
    }
    setGalleryPhotos(picks)
    setGalleryTitle(photo.title || 'Related photos')
    setGalleryOpen(true)
  }

  function closeGallery() {
    setGalleryOpen(false)
    setGalleryPhotos([])
    setGalleryTitle('')
  }

  // keyboard support: left = dismiss, right = save
  function handleKeyDown(e) {
    if (currentIdx >= PROMPTS.length) return
    if (e.key === 'ArrowRight') {
      const i = currentIdx
      handleSave(PROMPTS[i], i)
      setCurrentIdx(ci => ci + 1)
    } else if (e.key === 'ArrowLeft') {
      setCurrentIdx(ci => ci + 1)
    }
  }

  // choose the most relevant photo for each prompt by searching available photos
  useEffect(() => {
    if (!availablePhotos || !availablePhotos.length) return
    const defaults = {}
  PROMPTS.forEach((p, i) => {
      try {
        const matches = searchPhotos(p, availablePhotos)
        if (matches && matches.length) {
          // prefer a match that explicitly looks like "friends" or has peopleCount === 2 when prompt mentions friend
          const text = p.toLowerCase()
          const wantsFriend = text.includes('friend') || text.includes('friends')
          const wantsCampus = text.includes('school') || text.includes('campus') || text.includes('university') || text.includes("mother")
          // if campus-related prompt, prefer any photo tagged 'washu' or with 'wash' in the title
          if (wantsCampus) {
            const wash = matches.find(m => ((m.tags||[]).some(t => /washu|washington/i.test(t)) ) || (m.title||'').toLowerCase().includes('wash'))
            if (wash) { defaults[i] = wash.id; return }
          }
          if (wantsFriend) {
            const friendMatch = matches.find(m => (m.tags||[]).some(t => /friend|friends|pair|couple|two|2/.test(t)) || (m.peopleCount && m.peopleCount === 2) || (m.title||'').toLowerCase().includes('friend'))
            if (friendMatch) { defaults[i] = friendMatch.id; return }
          }
          // otherwise use the first match
          defaults[i] = matches[0].id
          return
        }
      } catch (e) {
        // fallback below
      }
      const pick = availablePhotos[i % availablePhotos.length]
      if (pick) defaults[i] = pick.id
    })
    // ensure the second prompt (index 1 — the "mother's school" campus prompt) uses the bundled WashU image when available
    try {
      const localWashu = availablePhotos.find(p => p.id === 'washu-local')
      if (localWashu) defaults[1] = localWashu.id
    } catch (e) { /* ignore */ }
    // force the first prompt to use the bundled win image fallback so it's always the celebratory photo
    try {
      const winLocal = availablePhotos.find(p => p.id === 'sample-1')
      if (winLocal) defaults[0] = winLocal.id
    } catch (e) { /* ignore */ }
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
  <section className="max-w-3xl mx-auto pt-24 pb-36 px-4">
      <h2 className="text-xl font-semibold mb-3">Reminders & Memory Prompts</h2>

      <p className="text-sm text-gray-600 mb-4">Use these friendly prompts to jog memories — play them aloud or save a reminder to reflect later.</p>

      <div className="mb-4 text-sm text-gray-500 bg-gray-50 p-2 rounded-md border">
        Tip: Swipe right to save a prompt, swipe left to skip it. You can also use the ← and → arrow keys to skip or save.
      </div>

      <div className="space-y-3">
        {/* Tinder-style single card view */}
  <div className="relative h-80 flex items-center justify-center overflow-hidden">
          {currentIdx >= PROMPTS.length ? (
            <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center justify-center w-full max-w-md">
              <div className="text-lg font-medium mb-2">No more prompts</div>
              <div className="text-sm text-gray-500 mb-4">You've reached the end of today's prompts.</div>
              <button className="px-4 py-2 bg-amber-400 text-white rounded btn-press" onClick={()=>setCurrentIdx(0)}>Restart</button>
            </div>
          ) : (
            (() => {
              const i = currentIdx
              const p = PROMPTS[i]
              const sel = attachedMap[i] ? availablePhotos.find(x => x.id === attachedMap[i]) : null
              const selectedPhoto = sel || availablePhotos[i % availablePhotos.length]
              const x = translates[i] || 0
              const isDragging = draggingIdx === i
              const rotate = x / 20
              const opacity = 1 - Math.min(0.7, Math.abs(x) / 600)
              const nextIdx = i + 1
              const nextSel = attachedMap[nextIdx] ? availablePhotos.find(x => x.id === attachedMap[nextIdx]) : null
              const nextPhoto = nextSel || availablePhotos[nextIdx % availablePhotos.length]
              const reveal = Math.min(1, Math.abs(x) / 200)
              return (
                <div className="w-full max-w-md relative">
                  {/* next card peek */}
                  {nextIdx < PROMPTS.length && (
                    <div className="absolute top-3 left-0 right-0 mx-auto w-full max-w-md transform scale-95 opacity-90" style={{ zIndex: 1 }}>
                      <div className="bg-white p-3 rounded-xl shadow-sm h-full flex flex-col justify-between opacity-80">
                        {nextPhoto && <img src={nextPhoto.url} alt={nextPhoto.title} className="w-full h-56 object-contain rounded-md mb-3 bg-gray-50" />}
                        <div className="text-sm text-gray-500">{PROMPTS[nextIdx]}</div>
                      </div>
                    </div>
                  )}

                  {/* action overlays (left = dismiss, right = save) */}
                  <div style={{ pointerEvents: 'none' }}>
                    <div className="absolute inset-0 rounded-xl" style={{ background: x > 0 ? 'linear-gradient(90deg,#34d39922,#10b98133)' : 'transparent', opacity: x > 0 ? reveal : 0, zIndex: 2 }} />
                    <div className="absolute inset-0 rounded-xl" style={{ background: x < 0 ? 'linear-gradient(270deg,#fca5a522,#ef444433)' : 'transparent', opacity: x < 0 ? reveal : 0, zIndex: 2 }} />
                    {/* icons */}
                    <div className="absolute left-4 top-4 text-white text-2xl" style={{ opacity: x > 0 ? reveal : 0, zIndex: 3 }}>✅</div>
                    <div className="absolute right-4 top-4 text-white text-2xl" style={{ opacity: x < 0 ? reveal : 0, zIndex: 3 }}>✖️</div>
                  </div>

                  {/* current card */}
                  <div
                    key={i}
                    className="bg-white p-3 rounded-xl shadow-lg mx-auto w-full h-full flex flex-col justify-between relative"
                    onPointerDown={(e) => onPointerStart(e, i)}
                    onPointerMove={(e) => onPointerMove(e, i)}
                    onPointerUp={(e) => onPointerEnd(e, p, i)}
                    onPointerCancel={(e) => onPointerEnd(e, p, i)}
                    onKeyDown={handleKeyDown}
                    tabIndex={0}
                    style={{ transform: `translateX(${x}px) rotate(${rotate}deg)`, transition: isDragging ? 'none' : 'transform 220ms ease', opacity, zIndex: 4, touchAction: 'none' }}
                  >
                    {selectedPhoto && (
                      <img onClick={() => openGallery(selectedPhoto)} src={selectedPhoto.url} alt={selectedPhoto.title} crossOrigin="anonymous" onError={(e) => { console.warn('Image failed to load, falling back', e?.target?.src); e.target.onerror = null; e.target.src = FALLBACK_PHOTOS[0].url }} className="w-full h-56 object-contain rounded-md mb-3 cursor-pointer bg-gray-50" />
                    )}
                    <div className="text-sm text-gray-800 mb-2 flex-1">{p}</div>
                    <div className="flex gap-2 items-center">
                      <button className="px-3 py-2 bg-rose-500 text-white rounded btn-press" onClick={()=>{
                        if (playingIdx === i) { window.speechSynthesis.cancel(); setPlayingIdx(-1); return }
                        setPlayingIdx(i)
                        speakWithFeedback(p, () => setPlayingIdx(i), () => setPlayingIdx(-1), { preferFemale: true, humanize: true })
                      }}>{playingIdx===i ? 'Playing...' : 'Play'}</button>
                      <button className="px-3 py-2 bg-amber-400 text-white rounded btn-press" onClick={()=>{ setBusyIdx(i); handleSave(p, i); setCurrentIdx(ci=>ci+1) }}>{busyIdx===i ? 'Saved' : 'Save & next'}</button>
                      <button className="px-3 py-2 bg-gray-100 rounded btn-press" onClick={()=>setCurrentIdx(ci=>ci+1)}>Skip</button>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">Tip: swipe right to save, swipe left to skip • Use ← → keys</div>
                  </div>
                  {/* page indicator placed below card to avoid overlap with content */}
                  <div className="text-center text-xs text-gray-500 mt-2">{i+1} / {PROMPTS.length}</div>
                </div>
              )
            })()
          )}
        </div>
      </div>
      {/* Gallery modal for related photos */}
      {galleryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={closeGallery} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-3xl w-full mx-4 p-4" style={{ maxHeight: '80vh', overflow: 'auto' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold">{galleryTitle}</div>
              <button className="px-3 py-1 bg-gray-100 rounded" onClick={closeGallery}>Close</button>
            </div>
            {galleryPhotos.length === 0 ? (
              <div className="text-sm text-gray-500">No related photos found.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {galleryPhotos.map((g) => (
                  <div key={g.id} className="rounded overflow-hidden bg-gray-50">
                    <img src={g.url} alt={g.title} className="w-full h-48 object-contain bg-gray-50" crossOrigin="anonymous" onError={(e)=>{ e.target.onerror=null; e.target.src = FALLBACK_PHOTOS[0].url }} />
                    <div className="p-2 text-xs text-gray-600">{g.title}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
                    <img onClick={() => openGallery(r.photo)} src={r.photo.url} alt={r.photo.title} crossOrigin="anonymous" onError={(e)=>{ console.warn('Saved reminder image failed to load', e?.target?.src); e.target.onerror=null; e.target.src = FALLBACK_PHOTOS[0].url }} className="w-24 h-20 object-contain rounded cursor-pointer bg-gray-50" />
                  )}
                  <div>
                    <div className="text-sm text-gray-800">{r.text}</div>
                    <div className="text-xs text-gray-400 mt-1">Saved {new Date(r.at).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button className="px-2 py-1 bg-gray-100 rounded btn-press" onClick={()=>{
                    // saved-list play button
                    const key = `saved-${idx}`
                    if (playingIdx === key) { window.speechSynthesis.cancel(); setPlayingIdx(-1); return }
                    setPlayingIdx(key)
                    speakWithFeedback(r.text, () => setPlayingIdx(key), () => setPlayingIdx(-1), { preferFemale: true, humanize: true })
                  }}>
                    {playingIdx === `saved-${idx}` ? '🔊' : '🔈'}
                  </button>
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
