/** 框架公共类型：页面元信息、服务健康、示例业务实体（items）、事件与画布区域 */

export interface PageMeta {
  title: string
  desc: string
}

// ---------------------------------------------------------------- 服务

export interface HealthInfo {
  status: string
  time: string
  version?: string
  device?: string
}

export interface ServiceInfo {
  name: string
  version: string
  python?: string
  device?: string
  startedAt?: string
}

// ---------------------------------------------------------------- 示例实体（items）

export type ItemStatus = 'active' | 'paused'

export interface Item {
  id: string
  name: string
  category: string
  status: ItemStatus
  /** 任意数值指标，用于演示排序/统计/图表 */
  value: number
  updatedAt: string
}

export interface ItemPage {
  total: number
  page: number
  page_size: number
  items: Item[]
}

export interface ItemQuery {
  page?: number
  page_size?: number
  keyword?: string
  status?: ItemStatus | ''
}

// ---------------------------------------------------------------- 实时事件（WebSocket）

export type EventLevel = 'info' | 'warning' | 'error'

export interface AppEvent {
  id: string
  level: EventLevel
  title: string
  message: string
  timestamp: string
}

// ---------------------------------------------------------------- 画布区域（RoiCanvas）

export type ZoneShape = 'polygon' | 'line'

/** 归一化坐标（0~1）多边形/折线区域，用于任意画布叠加标注 */
export interface RoiZone {
  id: string
  name: string
  shape: ZoneShape
  points: Array<[number, number]>
}
