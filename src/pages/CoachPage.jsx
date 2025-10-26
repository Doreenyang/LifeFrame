import React from 'react'
import MemoryCoach from '../components/MemoryCoach'
import SessionSummary from '../components/SessionSummary'

export default function CoachPage({ photos, onSavePhoto }) {
  return (
    <section className="w-full max-w-4xl mx-auto py-6 px-4 sm:px-6">
      <h2 className="text-xl font-semibold mb-3">Memory Coach</h2>
      <p className="text-sm text-gray-600 mb-4">Dedicated coach tab: guided recall sessions, session transcripts, and sharing.</p>

      <MemoryCoach photos={photos} onSavePhoto={onSavePhoto} />

      <SessionSummary />
    </section>
  )
}
