import { useMemo } from 'react'
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, Texture } from 'three'

export function useTiled(map: Texture | null, repeatX: number, repeatY: number): Texture | null {
  return useMemo(() => {
    if (!map) return null
    const clone = map.clone()
    clone.wrapS = RepeatWrapping
    clone.wrapT = RepeatWrapping
    clone.repeat.set(repeatX, repeatY)
    clone.needsUpdate = true
    return clone
  }, [map, repeatX, repeatY])
}

function paint(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void,
): CanvasTexture | null {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  draw(ctx, width, height)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.anisotropy = 8
  return texture
}

function oak(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = '#e7cfa6'
  ctx.fillRect(0, 0, width, height)
  const rows = 8
  const rowH = height / rows
  for (let row = 0; row < rows; row += 1) {
    const y = row * rowH
    const tone = 214 + ((row * 19) % 26)
    ctx.fillStyle = `rgb(${tone}, ${tone - 34}, ${tone - 72})`
    ctx.fillRect(0, y + 1, width, rowH - 3)
    ctx.strokeStyle = 'rgba(112, 72, 34, 0.22)'
    ctx.lineWidth = 1
    for (let grain = 0; grain < 5; grain += 1) {
      const gy = y + 5 + grain * (rowH / 6)
      ctx.beginPath()
      ctx.moveTo(0, gy)
      ctx.bezierCurveTo(width * 0.28, gy + 3, width * 0.62, gy - 4, width, gy + 1)
      ctx.stroke()
    }
    ctx.fillStyle = 'rgba(92, 58, 28, 0.45)'
    ctx.fillRect(0, y, width, 2)
    const joint = ((row % 2) * width) / 2 + 36
    ctx.fillRect(joint, y, 2, rowH)
  }
  ctx.fillStyle = 'rgba(128, 78, 40, 0.35)'
  ctx.beginPath()
  ctx.ellipse(150, 70, 9, 5, 0.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(380, 340, 7, 4, -0.2, 0, Math.PI * 2)
  ctx.fill()
}

function carpet(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = '#c8c6cc'
  ctx.fillRect(0, 0, width, height)
  for (let i = 0; i < 2200; i += 1) {
    const x = (i * 97) % width
    const y = (i * 53) % height
    const tone = 160 + (i % 50)
    ctx.fillStyle = `rgba(${tone}, ${tone}, ${tone + 6}, 0.28)`
    ctx.fillRect(x, y, 2, 2)
  }
  ctx.strokeStyle = 'rgba(92, 90, 102, 0.7)'
  ctx.lineWidth = 4
  const tiles = 4
  for (let i = 0; i <= tiles; i += 1) {
    const p = (i * width) / tiles
    ctx.beginPath()
    ctx.moveTo(p, 0)
    ctx.lineTo(p, height)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, p)
    ctx.lineTo(width, p)
    ctx.stroke()
  }
}

function tile(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = '#cfc8bc'
  ctx.fillRect(0, 0, width, height)
  const count = 4
  const gap = 10
  const cell = width / count
  for (let y = 0; y < count; y += 1) {
    for (let x = 0; x < count; x += 1) {
      const tone = 236 + ((x + y * 3) % 3) * 6
      ctx.fillStyle = `rgb(${tone}, ${tone - 1}, ${tone - 5})`
      ctx.fillRect(x * cell + gap / 2, y * cell + gap / 2, cell - gap, cell - gap)
      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      ctx.fillRect(x * cell + gap, y * cell + gap, cell * 0.35, 2)
    }
  }
}

function plaster(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = '#e7e4dd'
  ctx.fillRect(0, 0, width, height)
  for (let i = 0; i < 900; i += 1) {
    const x = (i * 47) % width
    const y = (i * 29) % height
    const tone = 214 + (i % 28)
    ctx.fillStyle = `rgba(${tone}, ${tone - 2}, ${tone - 8}, 0.35)`
    ctx.fillRect(x, y, 3, 2)
  }
}

function rug(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = '#d9c4ae'
  ctx.fillRect(0, 0, width, height)
  ctx.strokeStyle = '#9a3d58'
  ctx.lineWidth = 18
  ctx.strokeRect(16, 16, width - 32, height - 32)
  ctx.strokeStyle = '#e7d3b4'
  ctx.lineWidth = 8
  ctx.strokeRect(36, 36, width - 72, height - 72)
  ctx.fillStyle = 'rgba(228, 56, 110, 0.16)'
  ctx.beginPath()
  ctx.ellipse(width / 2, height / 2, 90, 70, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(249, 162, 60, 0.55)'
  ctx.lineWidth = 4
  ctx.stroke()
}

function city(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, height)
  sky.addColorStop(0, '#120c1c')
  sky.addColorStop(0.45, '#2a1844')
  sky.addColorStop(0.78, '#4a2a38')
  sky.addColorStop(1, '#1a120e')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, width, height)
  const towers = [18, 70, 118, 176, 230, 292, 348, 410, 462]
  towers.forEach((x, index) => {
    const h = 80 + ((index * 47) % 120)
    const w = 32 + (index % 3) * 10
    ctx.fillStyle = index % 2 ? '#14121a' : '#1c1824'
    ctx.fillRect(x, height - 8 - h, w, h)
    const glow = index % 3 === 0 ? '#FDBE6A' : index % 3 === 1 ? '#E4386E' : '#f2efe6'
    ctx.fillStyle = glow
    for (let y = height - h; y < height - 16; y += 11) {
      for (let lx = x + 4; lx < x + w - 4; lx += 8) {
        if ((lx + y + index) % 3 === 0) ctx.fillRect(lx, y, 3, 4)
      }
    }
  })
}

export type OfficeMaps = {
  oak: Texture | null
  carpet: Texture | null
  tile: Texture | null
  plaster: Texture | null
  rug: Texture | null
  city: Texture | null
}

export function useOfficeMaps(): OfficeMaps {
  return useMemo(() => {
    const oakMap = paint(512, 512, oak)
    const carpetMap = paint(512, 512, carpet)
    const tileMap = paint(512, 512, tile)
    const plasterMap = paint(256, 256, plaster)
    const rugMap = paint(512, 512, rug)
    const cityMap = paint(512, 256, city)
    if (plasterMap) plasterMap.repeat.set(2.4, 1.6)
    return { oak: oakMap, carpet: carpetMap, tile: tileMap, plaster: plasterMap, rug: rugMap, city: cityMap }
  }, [])
}
