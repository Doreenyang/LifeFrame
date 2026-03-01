// Simple hardcoded 'AI' summarizer for demo purposes.
export function generateSummaryFromText(text) {
  if (!text) return 'No details provided.'
  const t = text.toLowerCase()
  if (t.includes('beach') || t.includes('sunset')) return 'A warm, peaceful moment by the beach — sounds like a relaxing trip.'
  if (t.includes('dog') || t.includes('puppy')) return 'A joyful memory with a beloved pet — lots of smiles and play.'
  if (t.includes('mountain') || t.includes('hike')) return 'An adventurous outdoor memory — you explored nature and felt accomplished.'
  if (t.includes('coffee') || t.includes('cafe')) return 'A cozy, social moment over coffee — likely a calm catch-up with friends.'
  if (t.includes('nostalgia') || t.includes('childhood')) return 'A nostalgic memory that reminds you of earlier times.'
  // default template
  if (text.length < 80) return `A memorable moment: "${text}".`
  return text.slice(0,200) + (text.length>200? '…' : '')
}

export function summarizeSession(entries=[]) {
  if (!entries || entries.length === 0) return 'No session entries.'
  // pick top themes
  const joined = entries.map(e=>e.answer).join(' ')
  const summary = generateSummaryFromText(joined)
  return `Session summary: ${summary}`
}

export default { generateSummaryFromText, summarizeSession }
