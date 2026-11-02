import type { HealthInfo, Item, ItemPage, ItemQuery, ServiceInfo } from '@/types'

/**
 * 本地示例数据：后端未启动时的降级数据，同时作为接口文档中的返回示例。
 * 二次开发时可直接删除本文件，并把 api/index.ts 中的 mock 分支去掉。
 */
const CATEGORIES = ['Alpha', 'Beta', 'Gamma', 'Delta']

const NAMES = [
  '示例条目 A',
  '示例条目 B',
  '示例条目 C',
  '示例条目 D',
  '示例条目 E',
  '示例条目 F',
  '示例条目 G',
  '示例条目 H'
]

const STATUS: Item['status'][] = ['active', 'active', 'paused', 'active']

/** 生成 24 条稳定示例数据（与后端 seed 数据同构） */
export const DEMO_ITEMS: Item[] = Array.from({ length: 24 }, (_, i) => ({
  id: `item-${String(i + 1).padStart(3, '0')}`,
  name: NAMES[i % NAMES.length],
  category: CATEGORIES[i % CATEGORIES.length],
  status: STATUS[i % STATUS.length],
  value: 40 + ((i * 37) % 160),
  updatedAt: new Date(Date.now() - i * 3600_000).toISOString()
}))

export function mockItems(query: ItemQuery = {}): ItemPage {
  const page = query.page ?? 1
  const pageSize = query.page_size ?? 10
  const keyword = (query.keyword ?? '').trim().toLowerCase()
  let rows = DEMO_ITEMS
  if (keyword) rows = rows.filter((x) => `${x.id} ${x.name} ${x.category}`.toLowerCase().includes(keyword))
  if (query.status) rows = rows.filter((x) => x.status === query.status)
  const total = rows.length
  const start = (page - 1) * pageSize
  return { total, page, page_size: pageSize, items: rows.slice(start, start + pageSize) }
}

export function mockHealth(): HealthInfo {
  return {
    status: 'ok',
    time: new Date().toISOString(),
    version: '1.0.0',
    device: 'demo'
  }
}

export function mockInfo(): ServiceInfo {
  return {
    name: 'Desktop Framework Service',
    version: '1.0.0',
    python: '3.10+',
    device: 'cpu',
    startedAt: new Date(Date.now() - 3600_000).toISOString()
  }
}
