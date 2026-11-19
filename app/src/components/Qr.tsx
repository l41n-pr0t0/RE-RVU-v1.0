import { useEffect, useState } from 'react'

/** QR code as an <img>. The encoder is loaded on demand so it never weighs on first paint. */
export function Qr({ value, size = 184, label }: { value: string; size?: number; label: string }) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    import('qrcode').then(({ default: QR }) =>
      QR.toDataURL(value, { margin: 1, width: size * 2, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#F2EDE3' } }).then((url) => alive && setSrc(url)),
    )
    return () => {
      alive = false
    }
  }, [value, size])
  return src ? (
    <img src={src} width={size} height={size} alt={label} className="block [image-rendering:pixelated]" />
  ) : (
    <div className="skeleton" style={{ width: size, height: size }} role="img" aria-label={`${label} (loading)`} />
  )
}
