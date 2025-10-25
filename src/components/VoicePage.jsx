import React, { useState, useEffect, useRef } from 'react'

export default function VoicePage({ onQuery, query }) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState(query || '')
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
      if (final.trim()) onQuery((final+interim).trim())
    }
    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop()
    }
  }, [onQuery])

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

  return (
    <section className="max-w-3xl mx-auto py-6 text-center">
      <h2 className="text-xl font-semibold mb-4">Voice Search</h2>

      <div className="flex flex-col items-center gap-3">
        <button onClick={toggleListen} className={`rounded-full p-5 bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-2xl ${listening ? 'listening scale-105' : 'hover:scale-105 transition-transform'}`}>
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
      </div>
    </section>
  )
}
