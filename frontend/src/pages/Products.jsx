import { useEffect, useRef, useState, useMemo } from 'react'

export default function Products() {
  const [cakes, setCakes] = useState([])
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [currentImageIndex, setCurrentImageIndex] = useState({})

  // Full-featured modal state (Instagram-style)
  const [zoomOpen, setZoomOpen] = useState(false)
  const [zoomGalleryImages, setZoomGalleryImages] = useState([]) // resolved URLs array
  const [zoomIndex, setZoomIndex] = useState(0)

  // interactive zoom states
  const [zoomScale, setZoomScale] = useState(1) // 1 = normal
  const [zoomTranslate, setZoomTranslate] = useState({ x: 0, y: 0 }) // px pan
  const pinchRef = useRef(null) // {dist, baseScale}
  const panRef = useRef(null)   // {x,y}
  const lastTapRef = useRef(0)
  const containerRef = useRef(null)

  // --- Fetch cakes ---
  useEffect(() => {
    let ignore = false
    async function loadCakes() {
      setError('')
      try {
        let res = await fetch('/api/cakes', { method: 'GET', headers: { 'Content-Type': 'application/json' } }).catch(() => null)
        if (!res || !res.ok) {
          res = await fetch('http://localhost:4000/api/cakes', { method: 'GET', headers: { 'Content-Type': 'application/json' } }).catch(() => null)
        }
        if (!res || !res.ok) {
          if (!ignore) setError('Backend server is not running. Please start the backend server on port 4000.')
          return
        }
        const data = await res.json()
        if (!ignore) {
          if (Array.isArray(data) && data.length > 0) {
            setCakes(data)
            setError('')
          } else {
            setCakes([])
            setError('No cakes found in the database.')
          }
        }
      } catch (err) {
        console.error('Failed to load cakes:', err)
        if (!ignore) setError('Failed to connect to backend. Please ensure backend is running on port 4000.')
      }
    }
    loadCakes()
    return () => { ignore = true }
  }, [])

  // keyboard nav & ESC
  useEffect(() => {
    function onKey(e) {
      if (!zoomOpen) return
      if (e.key === 'Escape') closeZoom()
      if (e.key === 'ArrowRight') zoomNext()
      if (e.key === 'ArrowLeft') zoomPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [zoomOpen, zoomGalleryImages.length, zoomIndex])

  const categories = useMemo(() => ['All', ...Array.from(new Set(cakes.map(c => c.category)))], [cakes])
  const filtered = useMemo(() => {
    return cakes.filter(cake => {
      const byCat = category === 'All' || cake.category === category
      const byQuery = cake.name.toLowerCase().includes(query.toLowerCase())
      return byCat && byQuery
    })
  }, [query, category, cakes])

  // helper to compute URL
  function imageUrlFor(imagePath) {
    if (!imagePath) return ''
    if (imagePath.startsWith('/src/')) return imagePath
    if (imagePath.startsWith('/')) return `http://localhost:4000${imagePath}`
    return imagePath
  }

  // images per cake rules
  function getCakeImages(cake) {
    let imgs = []
    if (cake.images && Array.isArray(cake.images) && cake.images.length > 0) imgs = cake.images
    else if (cake.image) imgs = [cake.image]

    if (cake.category === 'Cupcakes') return imgs.slice(0, 2)
    if (cake.category === 'Brownies') return imgs.slice(0, 2)
    return imgs.slice(0, 4)
  }

  // carousel helpers
  function nextImage(cakeId, totalImages) {
    setCurrentImageIndex(prev => ({ ...prev, [cakeId]: ((prev[cakeId] || 0) + 1) % totalImages }))
  }
  function prevImage(cakeId, totalImages) {
    setCurrentImageIndex(prev => ({ ...prev, [cakeId]: ((prev[cakeId] || 0) - 1 + totalImages) % totalImages }))
  }
  function setImageIndex(cakeId, index) {
    setCurrentImageIndex(prev => ({ ...prev, [cakeId]: index }))
  }

  // placeholder svg
  const svgPlaceholder = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>
      <rect width='100%' height='100%' fill='#f3f3f3'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#b0b0b0' font-family='Arial' font-size='20'>No image</text>
    </svg>`
  )}`

  // ensure zoomIndex in range
  useEffect(() => {
    if (!zoomGalleryImages || zoomGalleryImages.length === 0) return
    if (zoomIndex < 0) setZoomIndex(0)
    if (zoomIndex >= zoomGalleryImages.length) setZoomIndex(zoomGalleryImages.length - 1)
  }, [zoomGalleryImages, zoomIndex])

  // navigation inside modal
  function zoomPrev() {
    setZoomIndex(i => (i - 1 + (zoomGalleryImages.length || 1)) % (zoomGalleryImages.length || 1))
    if (zoomScale <= 1) setZoomTranslate({ x: 0, y: 0 })
  }
  function zoomNext() {
    setZoomIndex(i => (i + 1) % (zoomGalleryImages.length || 1))
    if (zoomScale <= 1) setZoomTranslate({ x: 0, y: 0 })
  }

  // clamp generous pan
  function clampTranslate(t) {
    const max = 3000
    return { x: Math.max(-max, Math.min(max, t.x)), y: Math.max(-max, Math.min(max, t.y)) }
  }

  // open/close helpers
  function openZoom(gallery, index = 0) {
    setZoomGalleryImages(gallery.length ? gallery : [svgPlaceholder])
    setZoomIndex(index)
    setZoomScale(1)
    setZoomTranslate({ x: 0, y: 0 })
    pinchRef.current = null
    panRef.current = null
    setZoomOpen(true)
  }
  function closeZoom() {
    setZoomOpen(false)
    setZoomGalleryImages([])
    setZoomIndex(0)
    setZoomScale(1)
    setZoomTranslate({ x: 0, y: 0 })
    pinchRef.current = null
    panRef.current = null
  }

  // interactive handlers (touch / mouse / wheel / double)
  function onTouchStart(e) {
    if (!e.touches) return
    if (e.touches.length === 2) {
      const t0 = e.touches[0], t1 = e.touches[1]
      const dx = t1.clientX - t0.clientX, dy = t1.clientY - t0.clientY
      const dist = Math.hypot(dx, dy)
      pinchRef.current = { dist, baseScale: zoomScale }
    } else if (e.touches.length === 1 && zoomScale > 1) {
      panRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
  }
  function onTouchMove(e) {
    if (!e.touches) return
    if (e.touches.length === 2 && pinchRef.current) {
      const t0 = e.touches[0], t1 = e.touches[1]
      const dx = t1.clientX - t0.clientX, dy = t1.clientY - t0.clientY
      const dist = Math.hypot(dx, dy)
      const factor = dist / pinchRef.current.dist
      let next = pinchRef.current.baseScale * factor
      next = Math.max(1, Math.min(4, next))
      setZoomScale(Number(next.toFixed(3)))
    } else if (e.touches.length === 1 && zoomScale > 1 && panRef.current) {
      const t = e.touches[0]
      const dx = t.clientX - panRef.current.x, dy = t.clientY - panRef.current.y
      panRef.current = { x: t.clientX, y: t.clientY }
      setZoomTranslate(prev => clampTranslate({ x: prev.x + dx, y: prev.y + dy }))
    }
  }
  function onTouchEnd(e) {
    if (!e.touches || e.touches.length === 0) {
      pinchRef.current = null
      panRef.current = null
    }
    // double-tap
    const now = Date.now()
    if (now - lastTapRef.current < 300) {
      setZoomScale(s => {
        const next = s > 1 ? 1 : 2
        if (next === 1) setZoomTranslate({ x: 0, y: 0 })
        return next
      })
    }
    lastTapRef.current = now
  }

  // mouse pan while zoomed
  function onMouseDown(e) {
    if (zoomScale <= 1) return
    e.preventDefault()
    const startX = e.clientX, startY = e.clientY
    let lastX = startX, lastY = startY
    function onMove(ev) {
      const dx = ev.clientX - lastX, dy = ev.clientY - lastY
      lastX = ev.clientX; lastY = ev.clientY
      setZoomTranslate(prev => clampTranslate({ x: prev.x + dx, y: prev.y + dy }))
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // wheel zoom
  function onWheel(e) {
    e.preventDefault()
    const delta = -e.deltaY
    const amount = delta > 0 ? 0.12 : -0.12
    setZoomScale(s => {
      const next = Math.min(4, Math.max(1, Number((s + amount).toFixed(2))))
      if (next === 1) setZoomTranslate({ x: 0, y: 0 })
      return next
    })
  }

  // double-click (desktop)
  function onDoubleClick() {
    setZoomScale(s => {
      const next = s > 1 ? 1 : 2
      if (next === 1) setZoomTranslate({ x: 0, y: 0 })
      return next
    })
  }

  return (
    <section className="products">
      <div className="filters">
        <input
          type="text"
          placeholder="Search cakes..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <select value={category} onChange={e => setCategory(e.target.value)}>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      <div className="grid">
        {filtered.map(cake => {
          const images = getCakeImages(cake)
          const currentIndex = currentImageIndex[cake.id] || 0
          const currentImageUrl = images.length > 0 ? imageUrlFor(images[currentIndex]) : ''
          const showNavigation = images.length > 1

          return (
            <article
              key={cake.id}
              className="card"
              style={{
                minHeight: 400,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'center',
                padding: 24
              }}
            >
              {/* Image box */}
              <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: 260,
                height: 260,
                marginBottom: 12,
                borderRadius: 8,
                overflow: 'hidden',
                background: '#f8f8f8'
              }}>
                {currentImageUrl ? (
                  <img
                    src={currentImageUrl}
                    alt={`${cake.name} - Image ${currentIndex + 1}`}
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      display: 'block',
                      cursor: 'zoom-in'
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      const gallery = images.map(img => imageUrlFor(img))
                      openZoom(gallery, currentIndex)
                    }}
                    onError={(e) => { e.currentTarget.src = svgPlaceholder }}
                  />
                ) : (
                  <img
                    src={svgPlaceholder}
                    alt="No image"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      display: 'block',
                      cursor: 'zoom-in'
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      const gallery = images.map(img => imageUrlFor(img))
                      openZoom(gallery, 0)
                    }}
                  />
                )}

                {/* carousel arrows */}
                {showNavigation && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); prevImage(cake.id, images.length) }}
                      style={{
                        position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                        background: 'rgba(255,255,255,0.95)', border: 'none', borderRadius: '50%', width: 32, height: 32,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)', fontSize: 18, fontWeight: 'bold', color: '#111'
                      }}
                      aria-label="Previous image">‹</button>

                    <button
                      onClick={(e) => { e.stopPropagation(); nextImage(cake.id, images.length) }}
                      style={{
                        position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                        background: 'rgba(255,255,255,0.95)', border: 'none', borderRadius: '50%', width: 32, height: 32,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)', fontSize: 18, fontWeight: 'bold', color: '#111'
                      }}
                      aria-label="Next image">›</button>
                  </>
                )}
              </div>

              <h3 style={{ marginBottom: 8 }}>{cake.name}</h3>
              <div style={{ color: 'var(--text-muted)', marginBottom: 12 }}>{cake.category}</div>

              {images.length > 1 && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 8 }}>
                  {currentIndex + 1} / {images.length} photos
                </div>
              )}

              {/* dots below image */}
              {showNavigation && (
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center', gap: 6 }}>
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); setImageIndex(cake.id, i) }}
                      style={{
                        width: currentIndex === i ? 24 : 8,
                        height: 8,
                        borderRadius: 4,
                        border: 'none',
                        background: currentIndex === i ? 'var(--red-primary)' : 'rgba(0,0,0,0.2)',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        padding: 0
                      }}
                      aria-label={`Go to image ${i + 1}`} />
                  ))}
                </div>
              )}

              {/* price display */}
              {cake.category === "Cupcakes" ? (
                <div style={{ background: "var(--gray-light)", padding: "6px 16px", borderRadius: 999, fontWeight: 500, marginBottom: 8 }}>
                  Price: ₹{cake.price}
                </div>
              ) : cake.category === "Brownies" ? (
                <div style={{ background: "var(--gray-light)", padding: "6px 16px", borderRadius: 999, fontWeight: 500, marginBottom: 8 }}>
                  250 g: ₹{cake.price250g}
                </div>
              ) : (
                <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
                  {cake.priceHalfKg !== null && cake.priceHalfKg !== undefined && (
                    <span style={{ background: "var(--gray-light)", padding: "6px 16px", borderRadius: 999, fontWeight: 500 }}>½ kg: ₹{cake.priceHalfKg}</span>
                  )}
                  {cake.priceOneKg !== null && cake.priceOneKg !== undefined && (
                    <span style={{ background: "var(--gray-light)", padding: "6px 16px", borderRadius: 999, fontWeight: 500 }}>1 kg: ₹{cake.priceOneKg}</span>
                  )}
                </div>
              )}

            </article>
          )
        })}
        {!cakes.length && !error && <div style={{ color: 'var(--text-muted)' }}>Loading cakes...</div>}
        {error && <div style={{ color: 'var(--danger, #c0392b)' }}>{error}</div>}
      </div>

      {/* Instagram-style full black modal */}
      {zoomOpen && (
        <div
          onClick={() => closeZoom()}
          style={{
            position: 'fixed',
            inset: 0,
            background: '#000', // full black background
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: 20,
            cursor: 'zoom-out'
          }}
          aria-modal="true"
          role="dialog"
        >
          {/* Close button (white) */}
          <button
            onClick={(e) => { e.stopPropagation(); closeZoom() }}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: 'rgba(255,255,255,0.95)',
              border: 'none',
              width: 36,
              height: 36,
              borderRadius: '50%',
              fontSize: 20,
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 14px rgba(255,255,255,0.06)'
            }}
            aria-label="Close image"
          >
            ✕
          </button>

          <div
            ref={containerRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 1000,
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Prev (white) */}
              {zoomGalleryImages.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); zoomPrev() }}
                  style={{
                    position: 'absolute',
                    left: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255,255,255,0.06)',
                    border: 'none',
                    color: '#fff',
                    fontSize: 36,
                    width: 56,
                    height: 56,
                    borderRadius: 999,
                    cursor: 'pointer'
                  }}
                  aria-label="Previous"
                >
                  ‹
                </button>
              )}

              {/* interactive area */}
              <div
                onWheel={(e) => { e.preventDefault(); onWheel(e) }}
                onDoubleClick={onDoubleClick}
                onMouseDown={onMouseDown}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                style={{
                  touchAction: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  maxWidth: '100%',
                  maxHeight: '72vh',
                  width: '100%',
                }}
              >
                <img
                  src={zoomGalleryImages[zoomIndex] || svgPlaceholder}
                  alt={`Image ${zoomIndex + 1}`}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '72vh',
                    objectFit: 'contain',
                    display: 'block',
                    borderRadius: 8,
                    boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
                    transform: `translate(${zoomTranslate.x}px, ${zoomTranslate.y}px) scale(${zoomScale})`,
                    transition: 'transform 120ms ease-out'
                  }}
                  onDragStart={(e) => e.preventDefault()}
                />
              </div>

              {/* Next (white) */}
              {zoomGalleryImages.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); zoomNext() }}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255,255,255,0.06)',
                    border: 'none',
                    color: '#fff',
                    fontSize: 36,
                    width: 56,
                    height: 56,
                    borderRadius: 999,
                    cursor: 'pointer'
                  }}
                  aria-label="Next"
                >
                  ›
                </button>
              )}
            </div>

            {/* thumbnails (white border when active) */}
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '6px 4px', width: '100%', justifyContent: 'center' }}>
              {zoomGalleryImages.map((thumbSrc, i) => (
                <img
                  key={i}
                  src={thumbSrc}
                  onClick={() => { setZoomIndex(i); setZoomScale(1); setZoomTranslate({ x: 0, y: 0 }) }}
                  style={{
                    width: 70,
                    height: 70,
                    objectFit: 'cover',
                    borderRadius: 6,
                    cursor: 'pointer',
                    border: zoomIndex === i ? '3px solid #fff' : '2px solid rgba(255,255,255,0.12)'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
