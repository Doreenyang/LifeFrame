import React, { useState, useEffect } from 'react'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import AlbumPage from './components/AlbumPage'
import VoicePage from './components/VoicePage'
import ProfilePage from './components/ProfilePage'
import RemindersPage from './components/RemindersPage'
import PhotoDetail from './components/PhotoDetail'
import CoachPage from './pages/CoachPage'

import photosData from './data/photos.json'
import { categorizePhoto } from './data/search'
import { loadPhotos, savePhotos, loadQuery, saveQuery } from './utils/storage'

export default function App() {
  const [page, setPage] = useState('home') // 'home' | 'voice' | 'profile'
  const [photos, setPhotos] = useState([])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [albumOverride, setAlbumOverride] = useState(null)

  // load cached data first
  useEffect(() => {
    const stored = loadPhotos()
    if (stored && Array.isArray(stored) && stored.length) {
      setPhotos(stored)
    } else {
      const initial = photosData.map(p => ({...p, emotion: categorizePhoto(p)}))
      setPhotos(initial)
      savePhotos(initial)
    }

    const q = loadQuery()
    if (q) setQuery(q)
  }, [])

  // persist photos
  useEffect(() => {
    if (photos && photos.length) savePhotos(photos)
  }, [photos])

  // persist query
  useEffect(() => {
    saveQuery(query)
  }, [query])

  function openPhoto(photo) {
    setSelected(photo)
  }

  function updatePhoto(updated) {
    setPhotos(ps => ps.map(p => p.id === updated.id ? updated : p))
    setSelected(updated)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="ReMind Me" />

      <main className="flex-1 overflow-auto px-4 pb-24">
        {selected ? (
          <PhotoDetail photo={selected} onClose={() => setSelected(null)} onSave={updatePhoto} />
        ) : page === 'home' ? (
          <AlbumPage
            photos={albumOverride ? albumOverride.photos : photos}
            query={query}
            title={albumOverride ? albumOverride.title : undefined}
            onOpen={openPhoto}
            onBack={albumOverride ? () => { setAlbumOverride(null); setPage('reminders') } : undefined}
          />
        ) : page === 'voice' ? (
          <VoicePage onQuery={q => setQuery(q)} query={query} />
        ) : page === 'reminders' ? (
          <RemindersPage photos={photos} openAlbum={(ps, title) => { setAlbumOverride({ photos: ps, title }); setPage('home') }} />
        ) : page === 'coach' ? (
          <CoachPage photos={photos} onSavePhoto={updatePhoto} />
        ) : (
          <ProfilePage photosCount={photos.length} photos={photos} onSavePhoto={updatePhoto} />
        )}
      </main>

      <BottomNav page={page} setPage={p => { setPage(p); setSelected(null); }} />
    </div>
  )
}
