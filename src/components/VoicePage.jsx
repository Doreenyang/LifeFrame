import React, { useState, useEffect, useRef } from 'react'
import { searchPhotos } from '../data/search'

export default function VoicePage({ photos = [], onQuery, query }) {
  const [listening, setListening] = useState(false)
  // Do not initialize the transcript from the Home query so Voice remains independent
  const [transcript, setTranscript] = useState('')
  const [resultPhoto, setResultPhoto] = useState(null)
  const [noMatch, setNoMatch] = useState(false)
  const recognitionRef = useRef(null)

  useEffect(() => {
    // Initialize SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.maxAlternatives = 1
      recognition.onresult = (e) => {
      // assemble transcript from results (supports interim results)
      let final = ''
      let interim = ''
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) final += r[0].transcript + ' '
        else interim += r[0].transcript + ' '
      }
      const text = (final + interim).trim()
      setTranscript(text)
      // only set query on final result
      if (final.trim()) {
        const full = (final+interim).trim()
        // Do NOT automatically change the Home page query from voice input.
        // Instead, only resolve a local match and show it here. The user
        // can explicitly apply the result to Home using the button below.
        try {
          const matches = searchPhotos(full, photos || [])
          if (matches && matches.length) {
            setResultPhoto(matches[0])
            setNoMatch(false)
          } else {
            setResultPhoto(null)
            setNoMatch(true)
          }
        } catch (e) {
          setResultPhoto(null)
          setNoMatch(false)
        }
      }
    }
    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop()
    }
  }, [photos])

  function toggleListen() {
    if (!recognitionRef.current) {
      alert('SpeechRecognition not supported in this browser')
      return
    }

    if (listening) {
      recognitionRef.current.stop()
      setListening(false)
    } else {
      try {
        recognitionRef.current.start()
        setListening(true)
      } catch (err) {
        console.error(err)
      }
    }
  }

  function clearAll() {
    // clear voice-local state
    setTranscript('')
    setResultPhoto(null)
    setNoMatch(false)
    // clear global Home query if provided
    try { if (typeof onQuery === 'function') onQuery('') } catch(_){}
  }

  return (
    <section className="max-w-3xl mx-auto py-6 text-center">
      <h2 className="text-xl font-semibold mb-4">Voice Search</h2>

      <div className="flex flex-col items-center gap-3">
  <button onClick={toggleListen} className={`rounded-full p-5 bg-gradient-to-br from-rose-500 to-orange-300 text-white shadow-2xl animate-pop btn-press ${listening ? 'listening scale-105' : 'hover:scale-105 transition-transform'}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">🎙️</div>
            <div className="text-sm font-semibold">{listening ? 'Listening' : 'Tap to speak'}</div>
          </div>
        </button>

        <div className="mt-2">
          {listening && (
            <div className="wave text-white flex justify-center mt-2">
              <span style={{height:8}}></span>
              <span style={{height:12}}></span>
              <span style={{height:6}}></span>
              <span style={{height:10}}></span>
            </div>
          )}
        </div>

        <div className="mt-3 w-full">
          <label className="block text-left text-xs text-gray-600 mb-1">Query</label>
          <div className="bg-white p-3 rounded border min-h-[48px] text-left">{transcript || <span className="text-gray-400">No input yet</span>}</div>
        </div>

        {/* result preview shown inline on the Voice tab */}
        <div className="mt-4 w-full">
          <div className="text-sm font-semibold mb-2">Result</div>
          {resultPhoto ? (
            <div className="bg-white rounded p-3 shadow-sm">
              <img src={resultPhoto.url} alt={resultPhoto.title} className="w-full h-56 object-contain rounded-md bg-gray-50" />
              <div className="mt-2 flex items-center justify-between">
                <div className="text-sm text-gray-800">{resultPhoto.title}</div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-gray-100 rounded" onClick={()=> window.open(resultPhoto.url, '_blank')}>Open</button>
                  {/* single clear handled below */}
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">Note: Home will not change automatically from voice — use "Apply to Home" to filter the home view.</div>
            </div>
          ) : noMatch ? (
            <div className="text-sm text-gray-500">No matching photo found for your query.</div>
          ) : (
            <div className="text-sm text-gray-500">Results will appear here after you finish speaking.</div>
          )}

          {/* single clear button that clears both Voice-local state and Home query */}
          {(transcript || resultPhoto || noMatch || query) && (
            <div className="mt-3 w-full text-right">
              <button className="px-3 py-2 bg-red-100 text-red-700 rounded" onClick={clearAll}> Clear</button>
            </div>
          )}
        </div>
        {/* allow user to clear the global Home query if set (explicit action) */}
        {typeof onQuery === 'function' && query && (
          <div className="mt-3 w-full text-right">
            <button className="px-2 py-1 bg-red-100 text-red-700 rounded" onClick={() => onQuery('')}>Clear Home filter</button>
          </div>
        )}
      </div>
    </section>
  )
}
