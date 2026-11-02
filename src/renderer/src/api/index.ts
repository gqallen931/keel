import { http, withBackend } from './client'
import { mockHealth, mockInfo, mockItems } from '@/mock/demo'
import type { HealthInfo, Item, ItemPage, ItemQuery, ServiceInfo } from '@/types'

/** 系统服务接口 */
export const systemApi = {
  /** 健康检查：/api/system/health */
  health: (): Promise<HealthInfo> =>
    withBackend(
      async () => (await http.get<HealthInfo>('/system/health')).data,
      () => mockHealth()
    ),

  /** 服务信息：/api/system/info */
  info: (): Promise<ServiceInfo> =>
    withBackend(
      async () => (await http.get<ServiceInfo>('/system/info')).data,
      () => mockInfo()
    )
}

/** 示例实体 CRUD 接口（二次开发时可据此替换为真实业务资源） */
export const itemApi = {
  list: (query: ItemQuery = {}): Promise<ItemPage> =>
    withBackend(
      async () => (await http.get<ItemPage>('/items', { params: query })).data,
      () => mockItems(query)
    ),

  get: (id: string): Promise<Item> =>
    withBackend(
      async () => (await http.get<Item>(`/items/${id}`)).data,
      () => {
        const hit = mockItems({ page_size: 200 }).items.find((x) => x.id === id)
        if (!hit) throw new Error('not found')
        return hit
      }
    ),

  create: (payload: Omit<Item, 'id' | 'updatedAt'>): Promise<Item> =>
    withBackend(
      async () => (await http.post<Item>('/items', payload)).data,
      () => ({ ...payload, id: `item-${Date.now()}`, updatedAt: new Date().toISOString() })
    ),

  update: (id: string, payload: Partial<Item>): Promise<Item> =>
    withBackend(
      async () => (await http.put<Item>(`/items/${id}`, payload)).data,
      () => ({ ...(mockItems({ page_size: 200 }).items[0] as Item), ...payload, id })
    ),

  remove: (id: string): Promise<void> =>
    withBackend(
      async () => {
        await http.delete(`/items/${id}`)
      },
      () => undefined
    )
}

export type { HealthInfo, Item, ItemPage, ItemQuery, ServiceInfo }
