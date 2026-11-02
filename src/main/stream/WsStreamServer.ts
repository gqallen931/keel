import { WebSocketServer, WebSocket } from 'ws'

/**
 * JSMpeg 流分发服务：前端按 ws://127.0.0.1:PORT/stream/<streamId> 订阅，
 * 服务端把对应 FFmpeg stdout 的 MPEG-TS 块广播给该路所有订阅者。
 */
class WsStreamServer {
  private wss: WebSocketServer | null = null
  /** streamId -> 订阅者集合 */
  private channels = new Map<string, Set<WebSocket>>()

  listen(port: number): void {
    if (this.wss) return
    this.wss = new WebSocketServer({ port })

    this.wss.on('connection', (socket, req) => {
      // 路径形如 /stream/CAM-001
      const match = /^\/stream\/([\w-]+)/.exec(req.url || '')
      if (!match) {
        socket.close()
        return
      }
      const streamId = match[1]
      let set = this.channels.get(streamId)
      if (!set) {
        set = new Set()
        this.channels.set(streamId, set)
      }
      set.add(socket)

      socket.on('close', () => {
        set.delete(socket)
        if (set.size === 0) this.channels.delete(streamId)
      })
      socket.on('error', () => socket.close())
    })
  }

  broadcast(streamId: string, chunk: Buffer): void {
    const set = this.channels.get(streamId)
    if (!set || set.size === 0) return
    for (const socket of set) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(chunk, { binary: true })
      }
    }
  }

  close(): void {
    this.wss?.close()
    this.wss = null
    this.channels.clear()
  }
}

export const wsStreamServer = new WsStreamServer()
