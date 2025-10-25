import React from 'react'
import { HomeIcon, MicIcon, UserIcon } from './Icons'

export default function BottomNav({ page, setPage }) {
  return (
    <nav className="fixed bottom-4 left-0 right-0 z-30">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-md flex justify-between items-center px-3 py-2">
          <button onClick={() => setPage('home')} className={`flex items-center gap-2 ${page==='home' ? 'text-rose-600 font-semibold' : 'text-gray-600'}`}>
            <HomeIcon /> <span className="hidden sm:inline">Home</span>
          </button>

          <button onClick={() => setPage('voice')} className={`flex items-center gap-2 ${page==='voice' ? 'text-rose-500 font-semibold' : 'text-gray-600'}`}>
            <MicIcon /> <span className="hidden sm:inline">Voice</span>
          </button>

          <button onClick={() => setPage('coach')} className={`flex items-center gap-2 px-3 py-2 rounded-full ${page==='coach' ? 'bg-rose-500 text-white shadow-lg' : 'bg-white text-gray-700'}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2v6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 12h14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 22v-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="hidden sm:inline">Coach</span>
          </button>

          <button onClick={() => setPage('profile')} className={`flex items-center gap-2 ${page==='profile' ? 'text-rose-500 font-semibold' : 'text-gray-600'}`}>
            <UserIcon /> <span className="hidden sm:inline">Profile</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
