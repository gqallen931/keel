import { ChildProcessByStdio, spawn } from 'node:child_process'
import { Readable } from 'node:stream'
import { EventEmitter } from 'node:events'
import ffmpegPath from 'ffmpeg-static'
import { wsStreamServer } from './WsStreamServer'

type FfmpegProc = ChildProcessByStdio<null, Readable, Readable>

export interface StreamInfo {
  streamId: string
  rtspUrl: string
  status: 'connecting' | 'running' | 'error' | 'stopped'
  startedAt?: number
  error?: string
}

/**
 * 多路 RTSP 拉流管理器。
 * 每路视频通道启动一个 FFmpeg 子进程：RTSP -> MPEG1-TS（JSMpeg 可解码），
 * stdout 流式数据交给 WsStreamServer 按 streamId 广播。
 */
class StreamManager extends EventEmitter {
  private processes = new Map<string, FfmpegProc>()
  private infos = new Map<string, StreamInfo>()
  private restartTimers = new Map<string, NodeJS.Timeout>()

  /** 启动一路流，返回前端可订阅的 ws 地址 */
  start(streamId: string, rtspUrl: string): StreamInfo {
    this.stop(streamId)

    const bin = (ffmpegPath as unknown as string) || 'ffmpeg'
    const args = [
      '-rtsp_transport', 'tcp',
      '-fflags', 'nobuffer',
      '-analyzeduration', '1000000',
      '-probesize', '1000000',
      '-i', rtspUrl,
      '-f', 'mpegts',
      '-codec:v', 'mpeg1video',
      '-s', '960x540',
      '-b:v', '800k',
      '-r', '15',
      '-bf', '0',
      '-codec:a', 'mp2',
      '-ar', '44100',
      '-b:a', '128k',
      'pipe:1'
    ]

    const info: StreamInfo = { streamId, rtspUrl, status: 'connecting', startedAt: Date.now() }
    this.infos.set(streamId, info)

    try {
      const proc = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] })
      this.processes.set(streamId, proc)

      proc.stdout.on('data', (chunk: Buffer) => {
        if (info.status !== 'running') {
          info.status = 'running'
          this.emit('status', info)
        }
        wsStreamServer.broadcast(streamId, chunk)
      })

      let errBuf = ''
      proc.stderr.on('data', (d: Buffer) => {
        errBuf = (errBuf + d.toString()).slice(-2000)
      })

      proc.on('error', (err) => {
        info.status = 'error'
        info.error = err.message
        this.emit('status', info)
      })

      proc.on('close', (code) => {
        this.processes.delete(streamId)
        if (info.status !== 'stopped') {
          info.status = 'error'
          info.error = `ffmpeg exited code=${code}: ${errBuf.slice(-300)}`
          this.emit('status', info)
          // 断线 5s 后自动重连（对应 7x24 在线率要求）
          const timer = setTimeout(() => {
            if (this.infos.get(streamId)?.status === 'error') this.start(streamId, rtspUrl)
          }, 5000)
          this.restartTimers.set(streamId, timer)
        }
      })
    } catch (e) {
      info.status = 'error'
      info.error = (e as Error).message
    }
    return info
  }

  stop(streamId: string): void {
    const timer = this.restartTimers.get(streamId)
    if (timer) clearTimeout(timer)
    this.restartTimers.delete(streamId)

    const proc = this.processes.get(streamId)
    if (proc) {
      const info = this.infos.get(streamId)
      if (info) info.status = 'stopped'
      proc.kill('SIGKILL')
      this.processes.delete(streamId)
    }
  }

  stopAll(): void {
    for (const id of [...this.processes.keys()]) this.stop(id)
  }

  status(streamId?: string): StreamInfo[] {
    if (streamId) {
      const i = this.infos.get(streamId)
      return i ? [i] : []
    }
    return [...this.infos.values()]
  }
}

export const streamManager = new StreamManager()
