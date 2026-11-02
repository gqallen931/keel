import type { AppEvent } from '@/types'

type Listener = (event: AppEvent) => void

/**
 * 实时事件客户端：连接 /ws/events，断线后每 3 秒重连一次。
 * 服务端约定：每条消息为一个 JSON 序列化的 AppEvent。
 */
class EventStream {
  private ws: WebSocket | null = null
  private listeners = new Set<Listener>()
  private retryTimer: number | null = null
  private manualClose = false

  connect(): void {
    this.manualClose = false
    const url = import.meta.env.DEV
      ? `ws://${location.host}/ws/events`
      : 'ws://127.0.0.1:8800/ws/events'
    try {
      this.ws = new WebSocket(url)
    } catch {
      this.scheduleRetry()
      return
    }

    this.ws.onmessage = (ev) => {
      try {
        const event = JSON.parse(ev.data as string) as AppEvent
        this.listeners.forEach((fn) => fn(event))
      } catch {
        /* 忽略非 JSON 帧 */
      }
    }
    this.ws.onclose = () => {
      if (!this.manualClose) this.scheduleRetry()
    }
    this.ws.onerror = () => this.ws?.close()
  }

  private scheduleRetry(): void {
    if (this.retryTimer !== null) return
    this.retryTimer = window.setTimeout(() => {
      this.retryTimer = null
      this.connect()
    }, 3000)
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  disconnect(): void {
    this.manualClose = true
    if (this.retryTimer !== null) window.clearTimeout(this.retryTimer)
    this.ws?.close()
    this.ws = null
  }
}

export const eventStream = new EventStream()
