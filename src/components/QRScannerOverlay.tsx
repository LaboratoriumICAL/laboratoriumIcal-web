'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import jsQR from 'jsqr'
import { Icon } from './Icon'

export interface ScanResultData {
  nama: string | null
  nim: string
}

interface QRScannerOverlayProps {
  onClose: () => void
  onDecode: (text: string) => void
  scanResult: ScanResultData | null
  scanLoading: boolean
  scanError: string | null
  onScanAgain: () => void
}

export default function QRScannerOverlay({ onClose, onDecode, scanResult, scanLoading, scanError, onScanAgain }: QRScannerOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const decodedRef = useRef(false)

  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [mode, setMode] = useState<'scan' | 'result'>('scan')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)

  // Start kamera sekali saat overlay dibuka, biarkan tetap hidup selama overlay terbuka
  useEffect(() => {
    let cancelled = false
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        setCameraReady(true)
      } catch {
        setCameraError('Tidak bisa mengakses kamera. Gunakan "Unggah dari Galeri" sebagai alternatif.')
      }
    }
    startCamera()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const captureFrameDataUrl = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return null
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    return { ctx, canvas, dataUrl: canvas.toDataURL('image/jpeg', 0.85) }
  }

  // Loop scan REAL-TIME: baca tiap frame kamera terus-menerus, tidak perlu tap
  const scanLoop = useCallback(() => {
    if (decodedRef.current || mode !== 'scan') return
    const video = videoRef.current
    const canvas = canvasRef.current
    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const result = jsQR(imageData.data, imageData.width, imageData.height)
        if (result?.data && !decodedRef.current) {
          decodedRef.current = true
          const frame = captureFrameDataUrl()
          if (frame) setCapturedImage(frame.dataUrl)
          setMode('result')
          onDecode(result.data)
          return
        }
      }
    }
    rafRef.current = requestAnimationFrame(scanLoop)
  }, [mode, onDecode])

  useEffect(() => {
    if (cameraReady && mode === 'scan') {
      decodedRef.current = false
      rafRef.current = requestAnimationFrame(scanLoop)
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [cameraReady, mode, scanLoop])

  const handleScanAgain = () => {
    setCapturedImage(null)
    setMode('scan')
    onScanAgain()
  }

  const handleGalleryFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const result = jsQR(imageData.data, imageData.width, imageData.height)
        if (result?.data) {
          decodedRef.current = true
          setCapturedImage(canvas.toDataURL('image/jpeg', 0.85))
          setMode('result')
          onDecode(result.data)
        }
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#ffffff' }}>
      {/* Floating Close Pill for Instant Visibility */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-900/85 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-lg backdrop-blur-md cursor-pointer border border-white/20"
        title="Tutup Scanner (Esc)"
      >
        <Icon name="x" size={15} color="white" />
        <span>Tutup</span>
      </button>

      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-3 shrink-0 border-b border-slate-100 pr-24">
        <span style={{ color: '#1B3258', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem' }}>
          Scan QR Praktikan
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-4">
        {/* Viewfinder / captured frame */}
        <div className="flex items-center justify-center py-4">
          <div
            className="relative rounded-3xl overflow-hidden"
            style={{ width: '100%', maxWidth: '340px', aspectRatio: '3/4', background: '#1B3258', boxShadow: '0 16px 36px rgba(92, 139, 200,0.2)', border: '4px solid #C6DBF2' }}
          >
            <video
              ref={videoRef}
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: cameraReady && mode === 'scan' ? 1 : 0 }}
            />
            {mode === 'result' && capturedImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={capturedImage} alt="Hasil scan" className="absolute inset-0 w-full h-full object-cover" />
            )}

            {mode === 'scan' && !cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center">
                {cameraError ? (
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', textAlign: 'center', padding: '0 24px' }}>
                    <Icon name="warning" size={22} className="inline-block mb-2 block mx-auto" color="#94a3b8" />
                    {cameraError}
                  </p>
                ) : (
                  <span style={{ color: '#A5C3E8', fontFamily: 'var(--font-heading)', fontWeight: 700, letterSpacing: '0.15em', fontSize: '0.9rem' }}>
                    VIEWFINDER
                  </span>
                )}
              </div>
            )}

            {mode === 'scan' && cameraReady && (
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center">
                <span
                  className="px-3.5 py-1 rounded-full shadow-md"
                  style={{ background: 'rgba(27, 50, 88,0.85)', backdropFilter: 'blur(4px)', color: '#ffffff', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.05em' }}
                >
                  MENCARI QR...
                </span>
              </div>
            )}

            {/* Corner brackets */}
            {[
              { top: 14, left: 14, borderTop: true, borderLeft: true },
              { top: 14, right: 14, borderTop: true, borderRight: true },
              { bottom: 14, left: 14, borderBottom: true, borderLeft: true },
              { bottom: 14, right: 14, borderBottom: true, borderRight: true },
            ].map((pos, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  top: pos.top,
                  left: pos.left,
                  right: pos.right,
                  bottom: pos.bottom,
                  width: 40,
                  height: 40,
                  borderTop: pos.borderTop ? '4px solid #5C8BC8' : undefined,
                  borderLeft: pos.borderLeft ? '4px solid #5C8BC8' : undefined,
                  borderBottom: pos.borderBottom ? '4px solid #5C8BC8' : undefined,
                  borderRight: pos.borderRight ? '4px solid #5C8BC8' : undefined,
                  borderRadius:
                    pos.borderTop && pos.borderLeft
                      ? '12px 0 0 0'
                      : pos.borderTop && pos.borderRight
                      ? '0 12px 0 0'
                      : pos.borderBottom && pos.borderLeft
                      ? '0 0 0 12px'
                      : '0 0 12px 0',
                }}
              />
            ))}
          </div>
        </div>

        {/* Status Absensi card */}
        {mode === 'result' && (
          <div className="max-w-md mx-auto rounded-2xl p-5 mt-2" style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
            {scanLoading && (
              <div className="flex items-center justify-center py-6">
                <Icon name="loader" size={22} className="animate-spin" color="#2F4D7B" />
              </div>
            )}
            {scanError && !scanLoading && (
              <div className="flex items-start gap-2 py-2 text-red-600">
                <Icon name="warning" size={16} color="#dc2626" className="mt-0.5 shrink-0" />
                <p style={{ color: '#dc2626', fontSize: '0.82rem', fontWeight: 500 }}>{scanError}</p>
              </div>
            )}
            {scanResult && !scanLoading && !scanError && (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: '#dcfce7' }}
                  >
                    <Icon name="check-circle" size={20} color="#059669" />
                  </div>
                  <div>
                    <div style={{ color: '#065f46', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem' }}>
                      Absensi Berhasil
                    </div>
                    <div style={{ color: '#047857', fontSize: '0.8rem', marginTop: '1px' }}>
                      {scanResult.nama || '-'} — NIM {scanResult.nim}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {(['H', 'I', 'A'] as const).map((s) => (
                    <span
                      key={s}
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold"
                      style={
                        s === 'H'
                          ? { background: '#059669', color: 'white' }
                          : { background: '#f1f5f9', color: '#94a3b8' }
                      }
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="px-8 pb-10 pt-4 flex items-center justify-center gap-8 sm:gap-12 shrink-0 border-t border-slate-100">
        {/* Tombol Tutup Scanner */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={onClose}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 shadow-xs cursor-pointer"
            title="Tutup Scanner"
          >
            <Icon name="x" size={20} color="#e11d48" />
          </button>
          <span style={{ color: '#e11d48', fontSize: '0.68rem', textAlign: 'center', fontWeight: 600 }}>
            Tutup<br />Scanner
          </span>
        </div>

        {/* Tombol Kamera / Scan */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={mode === 'result' ? handleScanAgain : undefined}
            disabled={mode === 'scan'}
            className="w-16 h-16 rounded-full flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
            style={{
              background: '#537AB8',
              boxShadow: '0 8px 24px rgba(92,139,200,0.4)',
              opacity: mode === 'scan' ? 0.85 : 1,
            }}
          >
            {mode === 'scan' ? (
              <Icon name="loader" size={22} color="white" className="animate-spin" />
            ) : (
              <Icon name="camera" size={24} color="white" />
            )}
          </button>
          <span style={{ color: '#2F4D7B', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em' }}>
            {mode === 'scan' ? 'SCANNING...' : 'TAP TO SCAN'}
          </span>
        </div>

        {/* Tombol Unggah Galeri */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => galleryInputRef.current?.click()}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:bg-blue-50 cursor-pointer"
            style={{ background: '#f8fafc', border: '1.5px solid #C6DBF2' }}
          >
            <Icon name="image" size={20} color="#2F4D7B" />
          </button>
          <span style={{ color: '#64748b', fontSize: '0.68rem', textAlign: 'center', fontWeight: 500 }}>
            Unggah dari<br />Galeri
          </span>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleGalleryFile(file)
              e.target.value = ''
            }}
          />
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
