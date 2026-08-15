import { useEffect, useState } from 'react'
import type { Assistant } from '../data/mockData'
import { Icon } from './Icon'

interface ContactFullscreenProps {
  assistant: Assistant
  onClose: () => void
}

export default function ContactFullscreen({ assistant, onClose }: ContactFullscreenProps) {
  const [mounted, setMounted] = useState(false)

  const rawWa = (assistant.wa && assistant.wa.trim() !== '') ? assistant.wa.replace(/\D/g, '') : ''
  const waTarget = rawWa.startsWith('0') ? `62${rawWa.slice(1)}` : (rawWa || '6281283020758')
  const igTarget = (assistant.ig && assistant.ig.trim() !== '') ? assistant.ig.replace('@', '').trim() : 'ical.itpln'

  const socialButtons = (
    <>
      <button
        onClick={() => window.open(`https://wa.me/${waTarget}`, '_blank')}
        className="flex items-center gap-3 px-6 py-3.5 rounded-full bg-white transition-all duration-300 hover:-translate-y-[2px] shadow-[0_4px_12px_rgba(34,197,94,0.12)] hover:shadow-[0_8px_20px_rgba(34,197,94,0.22)] border border-green-100 group cursor-pointer"
      >
        <svg viewBox="0 0 24 24" width="24" height="24" fill="#22c55e" className="transition-transform duration-300 group-hover:scale-110 shrink-0">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
        </svg>
        <span className="text-slate-700 font-[600] text-[15px] md:text-[16px] group-hover:text-green-700 transition-colors duration-300">Hubungi via <span className="text-green-600">WhatsApp</span></span>
      </button>

      <button
        onClick={() => window.open(`https://instagram.com/${igTarget}`, '_blank')}
        className="flex items-center gap-3 px-6 py-3.5 rounded-full bg-white transition-all duration-300 hover:-translate-y-[2px] shadow-[0_4px_12px_rgba(236,72,153,0.12)] hover:shadow-[0_8px_20px_rgba(236,72,153,0.22)] border border-pink-100 group cursor-pointer"
      >
        <svg viewBox="0 0 24 24" width="24" height="24" fill="url(#ig-grad)" className="transition-transform duration-300 group-hover:scale-110 shrink-0">
          <defs>
            <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fdf497" />
              <stop offset="5%" stopColor="#fdf497" />
              <stop offset="45%" stopColor="#fd5949" />
              <stop offset="60%" stopColor="#d6249f" />
              <stop offset="90%" stopColor="#285aeb" />
            </linearGradient>
          </defs>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.667.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z"/>
        </svg>
        <span className="text-slate-700 font-[600] text-[15px] md:text-[16px] group-hover:text-pink-700 transition-colors duration-300">Ikuti di <span className="text-pink-600">Instagram</span></span>
      </button>
    </>
  )

  useEffect(() => {
    setMounted(true)
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [])

  return (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto overflow-x-hidden transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}
      style={{ background: '#f8fafc' }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400&family=Great+Vibes&display=swap');
        
        .font-serif-elegant {
          font-family: 'Playfair Display', serif;
        }

        .font-script-elegant {
          font-family: 'Great Vibes', cursive;
        }
        
        .font-inter {
          font-family: 'Inter', sans-serif;
        }

        @keyframes customFadeInUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-customFadeInUp {
          animation: customFadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-customFadeIn {
          animation: customFadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-delay: 0.2s;
          opacity: 0;
        }
        @keyframes blobShape {
          0% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
          100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
        }
        .animate-blob {
          animation: blobShape 8s ease-in-out infinite;
        }
      `}</style>
      
      {/* Background patterns */}
      <div className="absolute inset-0 dots-bg opacity-30 pointer-events-none" />
      
      {/* Top Navbar Area */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-end items-center z-20">
        <button
          onClick={onClose}
          className="font-inter flex items-center gap-2 px-6 py-2.5 rounded-full text-white font-[500] text-[14px] md:text-[15px] tracking-wide transition-all duration-200 hover:-translate-y-[2px] shadow-md hover:shadow-lg bg-[#015c61]"
        >
          <Icon name="x" size={16} /> Tutup
        </button>
      </div>

      {/* Copyright Bottom Left */}
      
      {/* Main Content Area */}
      <div className="relative w-full max-w-6xl mx-auto min-h-screen flex flex-col md:flex-row items-center justify-start md:justify-between px-6 md:px-12 z-10 pt-24 pb-8 md:pt-0 md:pb-0">
        
        {/* Left Content */}
        <div className="shrink-0 flex-1 w-full md:max-w-xl animate-customFadeInUp z-20 flex flex-col justify-center mt-4 md:mt-0">
          <h1 
            className="font-serif-elegant font-[800] text-[42px] sm:text-[48px] md:text-[54px] lg:text-[64px] text-slate-800 leading-[1.05] tracking-[-0.02em] mb-3 md:mb-4 text-center md:text-left"
          >
            <span style={{ color: '#015c61' }}>{assistant.name}</span>
          </h1>

          {/* NIM & Role */}
          <div className="flex items-center justify-center md:justify-start gap-2.5 mb-6 md:mb-8 font-inter">
            {assistant.nim && (
              <span
                className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs sm:text-sm font-semibold tracking-wide shadow-sm"
                style={{
                  background: '#e0f7fa',
                  color: '#015c61',
                  border: '1px solid #b2ebf2',
                }}
              >
                NIM: {assistant.nim}
              </span>
            )}
            {assistant.role && (
              <span
                className="inline-flex items-center px-3.5 py-1 rounded-full text-xs sm:text-sm font-semibold shadow-sm"
                style={{
                  background: assistant.role === 'Koordinator' ? '#fef3c7' : '#f1f5f9',
                  color: assistant.role === 'Koordinator' ? '#92400e' : '#475569',
                  border: `1px solid ${assistant.role === 'Koordinator' ? '#fde68a' : '#e2e8f0'}`,
                }}
              >
                {assistant.role}
              </span>
            )}
          </div>

          {/* Desktop Buttons (Hidden on Mobile) */}
          <div className="hidden md:flex font-inter flex-wrap gap-4">
            {socialButtons}
          </div>
        </div>

        {/* Right Content - Photo */}
        <div className="shrink-0 flex-1 w-full flex justify-center items-center relative py-12 md:py-0 md:h-screen animate-customFadeIn z-10">
          {assistant.photo ? (
            <div className="relative w-full max-w-[320px] md:max-w-[420px] aspect-[4/5] flex justify-center items-center overflow-visible group">
              {/* Decorative Blob Glow */}
              <div 
                className="absolute inset-0 animate-blob opacity-50 blur-2xl transition-all duration-700 group-hover:opacity-80"
                style={{ background: `linear-gradient(135deg, ${assistant.color}55, #38bdf855)` }}
              />
              
              {/* The Image inside the Blob */}
              <img
                src={assistant.photo}
                alt={assistant.name}
                className="relative w-full h-full object-cover animate-blob transition-transform duration-700 group-hover:scale-105"
                style={{ 
                  border: '6px solid white',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  objectPosition: 'top'
                }}
              />
            </div>
          ) : (
            <div className="relative w-[280px] h-[340px] md:w-[420px] md:h-[500px] flex items-center justify-center bg-slate-100 rounded-[40px] border-2 border-dashed border-slate-300">
              <Icon name="user" size={64} className="text-slate-300" />
            </div>
          )}
        </div>

        {/* Mobile Buttons (Hidden on Desktop) */}
        <div className="shrink-0 flex md:hidden font-inter flex-col sm:flex-row justify-center items-center gap-4 w-full z-20 pb-16">
          {socialButtons}
        </div>
      </div>
    </div>
  )
}
