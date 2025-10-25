import React, { useState, useEffect } from 'react'
import { saveSharedInfo, loadSharedInfo } from '../utils/storage'

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function ShareFolder({ photos }) {
  const [shared, setShared] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(()=>{
    const st = loadSharedInfo()
    if (st) setShared(st)
  }, [])

  async function generateShare() {
    setBusy(true)
    try {
      const payload = { photos, generatedAt: Date.now() }
      const json = JSON.stringify(payload, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const file = new File([blob], 'remindme-memories.json', { type: 'application/json' })

      // Try Web Share Level 2 (files)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'ReMind Me memories', text: 'Sharing my memories from ReMind Me' })
        const info = { ts: Date.now(), method: 'web-share-file' }
        saveSharedInfo(info)
        setShared(info)
        setBusy(false)
        return
      }

      // Try Web Share with a blob URL (some browsers accept)
      const url = URL.createObjectURL(blob)
      if (navigator.share) {
        try {
          await navigator.share({ title: 'ReMind Me memories', text: 'Sharing my memories from ReMind Me', url })
          const info = { ts: Date.now(), method: 'web-share-url' }
          saveSharedInfo(info)
          setShared(info)
          URL.revokeObjectURL(url)
          setBusy(false)
          return
        } catch (err) {
          // fallthrough to copy/download
          URL.revokeObjectURL(url)
        }
      }

      // Fallback: offer download and copy-to-clipboard
      downloadBlob(blob, 'remindme-memories.json')
      try {
        await navigator.clipboard.writeText(json)
      } catch (e) {
        // ignore clipboard failure
      }
      const info = { ts: Date.now(), method: 'download+clipboard' }
      saveSharedInfo(info)
      setShared(info)

    } catch (e) {
      console.error('Share failed', e)
    } finally {
      setBusy(false)
    }
  }

  function copyJSON() {
    try {
      const payload = { photos, generatedAt: Date.now() }
      const json = JSON.stringify(payload)
      navigator.clipboard.writeText(json)
      const info = { ts: Date.now(), method: 'copied-json' }
      saveSharedInfo(info)
      setShared(info)
    } catch (e) {
      console.warn('copy failed', e)
    }
  }

  function unshare() {
    saveSharedInfo(null)
    setShared(null)
  }

  return (
    <div className="mt-6 bg-white p-3 rounded-xl shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold">Shared Folder</h4>
          <p className="text-sm text-gray-600">Share a packaged copy of your memories to other devices or apps. On mobile, use the native share dialog (iOS/Android).</p>
        </div>
        <div className="text-sm text-gray-500">{shared ? <>Last shared: {new Date(shared.ts).toLocaleString()}</> : <span className="text-gray-400">Not shared</span>}</div>
      </div>

      <div className="mt-3 flex gap-2">
  <button className="px-3 py-2 bg-rose-500 text-white rounded btn-press" onClick={generateShare} disabled={busy || !photos || photos.length===0}>{busy ? 'Sharing…' : 'Share / Export'}</button>
        <button className="px-3 py-2 bg-gray-100 rounded" onClick={copyJSON}>Copy JSON</button>
        <button className="px-3 py-2 bg-gray-100 rounded" onClick={unshare}>Unshare</button>
      </div>

      <div className="mt-3 text-sm text-gray-600">
        Tips: On iPhone/Android, tap "Share / Export" and choose an app (Messages, Mail, Files). If your browser doesn't support file share, the file will download and JSON will be copied to your clipboard.
      </div>
    </div>
  )
}
