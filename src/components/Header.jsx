import React from 'react'
import { HomeIcon } from './Icons'

export default function Header({ title }) {
  return (
    <header className="w-full bg-gradient-to-r from-rose-400 to-orange-300 text-white p-4 sticky top-0 z-20">
      <div className="max-w-3xl mx-auto flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
          <HomeIcon className="text-white" />
        </div>
        <div>
          <div className="text-base font-semibold">{title}</div>
          <div className="text-sm text-rose-100">Find moments by voice or text</div>
        </div>
      </div>
    </header>
  )
}
