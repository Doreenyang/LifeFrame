import React, { useState, useEffect } from 'react'
import { loadSessions, clearSessions } from '../utils/storage'

export default function SessionSummary() {
  const [sessions, setSessions] = useState([])

  useEffect(()=>{
    setSessions(loadSessions())
  }, [])

  function downloadAll() {
    const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'remindme-sessions.json'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function clearAll() {
    clearSessions()
    setSessions([])
  }

  return (
    <div className="mt-4 bg-white p-3 rounded-xl shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold">Session Summary</h4>
          <div className="text-sm text-gray-600">Past Memory Coach sessions and transcripts.</div>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 bg-gray-100 rounded" onClick={downloadAll} disabled={!sessions.length}>Download</button>
          <button className="px-3 py-2 bg-red-100 text-red-700 rounded" onClick={clearAll} disabled={!sessions.length}>Clear</button>
        </div>
      </div>

      <div className="mt-3 space-y-3">
        {sessions.length === 0 && <div className="text-sm text-gray-500">No sessions yet.</div>}
        {sessions.map((s,i) => (
          <div key={i} className="border rounded p-2 bg-gray-50">
            <div className="text-sm font-semibold">Session {i+1} — {new Date(s.startedAt||s.ts||Date.now()).toLocaleString()}</div>
            <ul className="text-sm mt-2 space-y-1">
              {(s.entries || []).map((e,idx) => <li key={idx}>• <strong>{e.title||e.photoId}</strong>: {e.answer}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
