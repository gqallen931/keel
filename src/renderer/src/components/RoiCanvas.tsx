import { useCallback, useEffect, useRef } from 'react'
import type { RoiZone } from '@/types'

const W = 960
const H = 540
const ZONE_COLORS = ['#fa8c16', '#13c2c2', '#eb2f96', '#52c41a', '#722ed1', '#faad14']

export interface RoiDraft {
  shape: 'polygon' | 'line'
  points: [number, number][]
}

interface Props {
  zones: RoiZone[]
  draft: RoiDraft | null
  selectedId: string | null
  drawing: boolean
  /** 点击画布（归一化坐标），双击闭合多边形 */
  onCanvasClick: (pt: [number, number]) => void
  onFinishDraft: () => void
  onSelectZone: (id: string | null) => void
  onMoveVertex: (zoneId: string, vertexIdx: number, pt: [number, number]) => void
}

/** 射线法判断点是否在多边形内 */
function pointInPolygon(pt: [number, number], poly: [number, number][]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

/** 区域标注画布：渲染已保存区域 + 交互绘制（归一化坐标） */
export default function RoiCanvas({
  zones,
  draft,
  selectedId,
  drawing,
  onCanvasClick,
  onFinishDraft,
  onSelectZone,
  onMoveVertex
}: Props): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragRef = useRef<{ zoneId: string; idx: number } | null>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, W, H)

    // 背景网格（模拟视频底图）
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
    for (let x = 0; x <= W; x += 60) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, H)
      ctx.stroke()
    }
    for (let y = 0; y <= H; y += 60) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
      ctx.stroke()
    }

    const drawShape = (shape: string, pts: [number, number][], color: string, selected: boolean) => {
      if (pts.length === 0) return
      ctx.strokeStyle = color
      ctx.fillStyle = color + '33'
      ctx.lineWidth = selected ? 3 : 2
      ctx.beginPath()
      ctx.moveTo(pts[0][0] * W, pts[0][1] * H)
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] * W, pts[i][1] * H)
      if (shape === 'polygon' && pts.length > 2) {
        ctx.closePath()
        ctx.fill()
      }
      ctx.stroke()
      // 顶点
      pts.forEach(([nx, ny]) => {
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(nx * W, ny * H, selected ? 5 : 4, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    zones.forEach((z, i) => {
      drawShape(z.shape, z.points, ZONE_COLORS[i % ZONE_COLORS.length], z.id === selectedId)
      // 区域名
      if (z.points.length > 0) {
        ctx.fillStyle = '#fff'
        ctx.font = '13px sans-serif'
        ctx.fillText(z.name, z.points[0][0] * W + 6, z.points[0][1] * H - 6)
      }
    })

    if (draft) drawShape(draft.shape, draft.points, '#ff4d4f', true)
  }, [zones, draft, selectedId])

  useEffect(() => {
    draw()
  }, [draw])

  const toNorm = (ev: React.MouseEvent): [number, number] => {
    const rect = (ev.target as HTMLCanvasElement).getBoundingClientRect()
    return [
      Math.min(1, Math.max(0, (ev.clientX - rect.left) / rect.width)),
      Math.min(1, Math.max(0, (ev.clientY - rect.top) / rect.height))
    ]
  }

  const nearestVertex = (pt: [number, number]): { zoneId: string; idx: number } | null => {
    const THRESH = 0.012
    for (const z of zones) {
      for (let i = 0; i < z.points.length; i++) {
        const [x, y] = z.points[i]
        if (Math.hypot(x - pt[0], y - pt[1]) < THRESH) return { zoneId: z.id, idx: i }
      }
    }
    return null
  }

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      onMouseDown={(ev) => {
        const pt = toNorm(ev)
        if (drawing) return
        const v = nearestVertex(pt)
        if (v) dragRef.current = v
      }}
      onMouseMove={(ev) => {
        if (dragRef.current) {
          onMoveVertex(dragRef.current.zoneId, dragRef.current.idx, toNorm(ev))
        }
      }}
      onMouseUp={() => (dragRef.current = null)}
      onClick={(ev) => {
        const pt = toNorm(ev)
        if (drawing) {
          onCanvasClick(pt)
          return
        }
        // 点选区域
        const hit = zones.find(
          (z) => z.shape === 'polygon' && z.points.length > 2 && pointInPolygon(pt, z.points)
        )
        onSelectZone(hit?.id ?? null)
      }}
      onDoubleClick={() => drawing && onFinishDraft()}
      onContextMenu={(ev) => {
        ev.preventDefault()
        if (drawing) onFinishDraft()
      }}
    />
  )
}
