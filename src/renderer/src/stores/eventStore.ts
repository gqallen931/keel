import { create } from 'zustand'
import type { AppEvent } from '@/types'

interface EventState {
  /** WebSocket 推送的最新事件（最多保留 200 条） */
  events: AppEvent[]
  push: (event: AppEvent) => void
  clear: () => void
}

/** 实时事件 store 示例：演示 Zustand + WebSocket 的常见组合 */
export const useEventStore = create<EventState>((set) => ({
  events: [],
  push: (event) => set((s) => ({ events: [event, ...s.events].slice(0, 200) })),
  clear: () => set({ events: [] })
}))
