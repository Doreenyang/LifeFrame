import React, { useState, useEffect } from 'react'
import { loadPremium, savePremium } from '../utils/storage'
import MemoryCoach from './MemoryCoach'
import ShareFolder from './ShareFolder'

export default function ProfilePage({ photosCount, photos = [], onSavePhoto }) {
  const [syncing, setSyncing] = useState(null)
  const providers = ['Google Drive','Dropbox','Box']
  const [premium, setPremium] = useState(false)

  useEffect(()=>{
    setPremium(loadPremium())
  }, [])

  function connect(name) {
    setSyncing({ name, progress: 0 })
    let p = 0
    const t = setInterval(() => {
      p += Math.floor(Math.random()*20)+5
      if (p >= 100) { p = 100; clearInterval(t) }
      setSyncing({ name, progress: p })
    }, 500)
  }

  function unlock() {
    // mock upgrade flow
    savePremium(true)
    setPremium(true)
  }

  return (
    <section className="max-w-3xl mx-auto py-6">
      <h2 className="text-xl font-semibold mb-3">Cloud & Coach</h2>

      <div className="space-y-3">
        {providers.map(p => (
          <div key={p} className="flex items-center justify-between bg-white p-3 rounded shadow-sm">
            <div>{p}</div>
            <div>
              <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => connect(p)}>Connect</button>
            </div>
          </div>
        ))}
      </div>

      {syncing && (
        <div className="mt-4 bg-white p-3 rounded shadow">
          <div className="text-sm">Syncing to {syncing.name}</div>
          <div className="w-full bg-gray-200 h-3 rounded mt-2">
            <div style={{width: syncing.progress+'%'}} className="h-3 bg-green-500 rounded"></div>
          </div>
          <div className="text-xs text-gray-600 mt-1">{syncing.progress}%</div>
        </div>
      )}

      {photosCount > 10 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">Upgrade to Premium to upload more memories.</div>
      )}

      <div className="mt-6">
        <div className="bg-white p-3 rounded shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Memory Coach</div>
              <div className="text-sm text-gray-600">Guided recall sessions to help practice remembering moments.</div>
            </div>
            <div>
              {!premium ? (
                <button className="px-3 py-1 bg-indigo-600 text-white rounded" onClick={unlock}>Upgrade</button>
              ) : (
                <div className="text-sm text-green-600 font-semibold">Premium unlocked</div>
              )}
            </div>
          </div>
        </div>

        {premium && (
          <>
            <MemoryCoach photos={photos} onSavePhoto={onSavePhoto} />
            <ShareFolder photos={photos} />
          </>
        )}
      </div>
    </section>
  )
}
