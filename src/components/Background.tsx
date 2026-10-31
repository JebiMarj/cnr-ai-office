import { useEffect, useRef } from 'react'
import { brand } from '../brand.tsx'

type Star = { x: number; y: number; r: number; a: number; s: number; tint: string }

export function Background() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const fine = window.matchMedia('(pointer: fine)')
    const stars = createStars(150)
    let frame = 0
    let running = !motion.matches

    const draw = (move: boolean) => {
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      const scale = Math.min(window.devicePixelRatio || 1, 2)
      const nextWidth = Math.max(1, Math.floor(width * scale))
      const nextHeight = Math.max(1, Math.floor(height * scale))
      if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
        canvas.width = nextWidth
        canvas.height = nextHeight
      }
      context.setTransform(scale, 0, 0, scale, 0, 0)
      context.clearRect(0, 0, width, height)
      for (const star of stars) {
        if (move) {
          star.y -= star.s
          if (star.y < 0) star.y += 1
        }
        context.globalAlpha = star.a
        context.fillStyle = star.tint
        context.beginPath()
        context.arc(star.x * width, star.y * height, star.r, 0, Math.PI * 2)
        context.fill()
      }
      context.globalAlpha = 1
    }

    const resize = () => draw(false)
    resize()

    const tick = () => {
      draw(true)
      frame = window.requestAnimationFrame(tick)
    }
    if (running) frame = window.requestAnimationFrame(tick)

    const onMotion = () => {
      window.cancelAnimationFrame(frame)
      running = !motion.matches
      if (running) frame = window.requestAnimationFrame(tick)
      else draw(false)
    }
    motion.addEventListener('change', onMotion)
    window.addEventListener('resize', resize)

    const onMove = (event: MouseEvent) => {
      if (motion.matches || !fine.matches) return
      const x = (event.clientX / window.innerWidth - 0.5) * 16
      const y = (event.clientY / window.innerHeight - 0.5) * 10
      document.documentElement.style.setProperty('--parallax-x', `${x.toFixed(2)}px`)
      document.documentElement.style.setProperty('--parallax-y', `${y.toFixed(2)}px`)
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    const onVisibility = () => {
      window.cancelAnimationFrame(frame)
      if (!document.hidden && running) frame = window.requestAnimationFrame(tick)
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.cancelAnimationFrame(frame)
      motion.removeEventListener('change', onMotion)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <div className="sky" aria-hidden="true">
      <div className="aurora aurora-a" />
      <div className="aurora aurora-b" />
      <div className="aurora aurora-c" />
      <div className="stars-layer">
        <canvas ref={canvasRef} className="stars" />
      </div>
      <div className="floor-grid" />
      <div className="vignette" />
    </div>
  )
}

function createStars(count: number): Star[] {
  const tints = [brand.colors.paper, brand.colors.gold, brand.colors.pink]
  return Array.from({ length: count }, (_, index) => ({
    x: ((index * 47) % 100) / 100,
    y: ((index * 29) % 100) / 100,
    r: index % 7 === 0 ? 1.6 : 1,
    a: 0.18 + (index % 5) * 0.08,
    s: 0.00025 + (index % 4) * 0.00015,
    tint: tints[index % tints.length]!,
  }))
}
