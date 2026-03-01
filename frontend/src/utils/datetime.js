// Tiny natural-language reminder parser for common quick forms.
// Not as full-featured as chrono, but handles typical demo inputs.
export function parseReminder(text, now = new Date()) {
  if (!text) return null
  const t = text.toLowerCase().trim()

  // in X hours / minutes
  let m = t.match(/in\s+(\d+)\s+hour/)
  if (m) {
    const d = new Date(now.getTime() + parseInt(m[1],10)*60*60*1000)
    return d
  }
  m = t.match(/in\s+(\d+)\s+min/)
  if (m) {
    const d = new Date(now.getTime() + parseInt(m[1],10)*60*1000)
    return d
  }

  // tomorrow at 8 pm / tomorrow 8pm
  m = t.match(/tomorrow(?:\s+at)?\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/)
  if (m) {
    const hour = parseInt(m[1],10)
    const minute = m[2] ? parseInt(m[2],10) : 0
    let h = hour
    if (m[3]) {
      const ap = m[3]
      if (ap === 'pm' && hour < 12) h = hour + 12
      if (ap === 'am' && hour === 12) h = 0
    }
    const d = new Date(now)
    d.setDate(d.getDate()+1)
    d.setHours(h, minute, 0, 0)
    return d
  }

  // explicit time like '8 pm' or '8:30 am'
  m = t.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/)
  if (m) {
    const hour = parseInt(m[1],10)
    const minute = m[2] ? parseInt(m[2],10) : 0
    let h = hour
    if (m[3]) {
      const ap = m[3]
      if (ap === 'pm' && hour < 12) h = hour + 12
      if (ap === 'am' && hour === 12) h = 0
    }
    const d = new Date(now)
    d.setHours(h, minute, 0, 0)
    // if time already passed today, assume tomorrow
    if (d.getTime() <= now.getTime()) d.setDate(d.getDate()+1)
    return d
  }

  // relative weekday: next monday at 9am
  m = t.match(/next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?)?/) 
  if (m) {
    const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
    const target = days.indexOf(m[1])
    const cur = now.getDay()
    let delta = (target - cur + 7) % 7
    if (delta === 0) delta = 7
    const d = new Date(now)
    d.setDate(d.getDate() + delta)
    if (m[2]) {
      let hh = parseInt(m[2],10)
      const mm = m[3] ? parseInt(m[3],10) : 0
      const ap = m[4]
      if (ap) {
        if (ap === 'pm' && hh < 12) hh += 12
        if (ap === 'am' && hh === 12) hh = 0
      }
      d.setHours(hh, mm, 0, 0)
    } else {
      d.setHours(9,0,0,0)
    }
    return d
  }

  // fallback: try Date.parse
  const parsed = Date.parse(text)
  if (!isNaN(parsed)) return new Date(parsed)

  return null
}

export function formatReminder(d) {
  if (!d) return ''
  const dt = new Date(d)
  return dt.toLocaleString()
}

export default { parseReminder, formatReminder }
