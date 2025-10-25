const PHOTOS_KEY = 'remindme_photos_v1'
const QUERY_KEY = 'remindme_query_v1'
const PREMIUM_KEY = 'remindme_premium_v1'
const SHARED_KEY = 'remindme_shared_v1'
const SESSIONS_KEY = 'remindme_sessions_v1'
const REMINDERS_KEY = 'remindme_reminders_v1'

export function loadPhotos() {
  try {
    const raw = localStorage.getItem(PHOTOS_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to load photos from storage', e)
    return null
  }
}

export function savePhotos(photos) {
  try {
    localStorage.setItem(PHOTOS_KEY, JSON.stringify(photos))
  } catch (e) {
    console.error('Failed to save photos to storage', e)
  }
}

export function loadQuery() {
  try {
    return localStorage.getItem(QUERY_KEY) || ''
  } catch (e) {
    return ''
  }
}

export function saveQuery(q) {
  try {
    localStorage.setItem(QUERY_KEY, q || '')
  } catch (e) {
    console.error('Failed to save query', e)
  }
}

export function loadPremium() {
  try {
    return localStorage.getItem(PREMIUM_KEY) === '1'
  } catch (e) {
    return false
  }
}

export function savePremium(val) {
  try {
    localStorage.setItem(PREMIUM_KEY, val ? '1' : '0')
  } catch (e) {
    console.error('Failed to save premium flag', e)
  }
}

export function loadSharedInfo() {
  try {
    const raw = localStorage.getItem(SHARED_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (e) {
    return null
  }
}

export function saveSharedInfo(info) {
  try {
    localStorage.setItem(SHARED_KEY, JSON.stringify(info))
  } catch (e) {
    console.error('Failed to save shared info', e)
  }
}

export function loadSessions() {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    return []
  }
}

export function saveSession(session) {
  try {
    const all = loadSessions()
    all.push(session)
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(all))
  } catch (e) {
    console.error('Failed to save session', e)
  }
}

export function clearSessions() {
  try { localStorage.removeItem(SESSIONS_KEY) } catch(e){}
}

export function loadReminders() {
  try {
    const raw = localStorage.getItem(REMINDERS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    return []
  }
}

export function saveReminder(reminder) {
  try {
    const all = loadReminders()
    all.unshift(reminder)
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(all))
  } catch (e) { console.error('Failed to save reminder', e) }
}

export function deleteReminder(idx) {
  try {
    const all = loadReminders()
    all.splice(idx, 1)
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(all))
  } catch (e) { console.error('Failed to delete reminder', e) }
}

export function exportData() {
  const photos = loadPhotos() || []
  const query = loadQuery() || ''
  return { photos, query }
}

export function importData({ photos, query }) {
  if (Array.isArray(photos)) savePhotos(photos)
  if (typeof query === 'string') saveQuery(query)
}

export default {
  loadPhotos, savePhotos, loadQuery, saveQuery, exportData, importData
}
