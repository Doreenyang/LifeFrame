export function searchPhotos(query, photos) {
  if (!query) return photos
  const q = query.toLowerCase()
  const words = q.split(/\s+/).filter(Boolean)

  return photos.filter(p => {
    const hay = [p.title || '', ...(p.tags||[]), ...(p.comments||[])].join(' ').toLowerCase()
    // match all words OR any word? We'll match any word
    return words.some(w => hay.includes(w))
  })
}

const keywordMap = {
  joy: ['happy','joy','fun','party','celebrate','cute'],
  nostalgia: ['nostalgia','old','memory','remind','childhood'],
  peace: ['calm','peace','quiet','serene','relax'],
  surprise: ['surprise','wow','amazing'],
  sadness: ['sad','cry','miss']
}

export function categorizePhoto(photo) {
  const hay = [photo.title || '', ...(photo.tags||[]), ...(photo.comments||[])].join(' ').toLowerCase()
  for (const [emo, keys] of Object.entries(keywordMap)) {
    for (const k of keys) {
      if (hay.includes(k)) return emo
    }
  }
  // fallback random small set
  const fallback = ['joy','peace','nostalgia','wonder']
  return fallback[Math.floor(Math.random()*fallback.length)]
}
