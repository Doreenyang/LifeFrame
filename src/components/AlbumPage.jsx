import React from 'react'
import { searchPhotos } from '../data/search'

export default function AlbumPage({ photos, query, onOpen }) {
  const results = query ? searchPhotos(query, photos) : photos

  return (
    <section className="max-w-3xl mx-auto py-6">
      <h2 className="text-xl font-semibold mb-3">Your Moments</h2>

      {query && (
        <p className="mb-3 text-sm text-gray-600">Found {results.length} moments for "{query}".</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {results.map(p => (
          <div key={p.id} className="card cursor-pointer transform hover:scale-[1.02] transition-all duration-300 hover:shadow-lg" onClick={() => onOpen(p)}>
            <div className="relative">
              <img src={p.url} alt={p.comments?.join(', ')} className="card-img" />
              <div className="absolute left-2 top-2">
                <span className={`emotion-pill ${p.emotion ? 'emotion-'+p.emotion : 'emotion-wonder'}`}>{p.emotion}</span>
              </div>
                <div className="absolute left-0 right-0 bottom-0 p-3 title-overlay">
                <div className="text-white font-semibold text-sm">{p.title || 'Memory'}</div>
                <div className="text-xs text-white/80">{(p.comments||[]).length} comments</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {results.length === 0 && (
        <p className="mt-4 text-gray-500">No moments matched your query.</p>
      )}
    </section>
  )
}
