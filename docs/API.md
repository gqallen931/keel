# 接口说明（IPC / HTTP / WebSocket / 前端模块）

本文档覆盖框架对外与对内全部接口。字段命名遵循 `camelCase`（前端）/ `snake_case`（HTTP 查询参数与响应），
与 `src/renderer/src/types/index.ts`、`ai-service/app/schemas.py` 一一对应。

---

## 0. 约定

| 项 | 约定 |
| --- | --- |
| HTTP Base | 开发：`/api`（vite 代理到 `127.0.0.1:8800`）；生产：`http://127.0.0.1:8800/api` |
| 时间格式 | ISO 8601 字符串（本地时区，秒级），如 `2026-11-02T15:30:00+08:00` |
| 错误响应 | `{ "detail": "错误描述" }`，HTTP 状态码语义化（400/404/409/500） |
| 降级策略 | 服务不可用或返回 5xx 时，`withBackend()` 自动使用 `mock/demo.ts` 数据 |
| 超时 | axios 全局 8s；健康探测 2.5s |

---

## 1. 主进程 IPC（`window.desktop`）

> preload 通过 `contextBridge.exposeInMainWorld('desktop', api)` 暴露，渲染进程**不能**直接访问 Node/Electron。
> 通道命名约定：`domain:action`。

### 1.1 窗口控制 `window.desktop.win`

| 方法 | IPC 通道 | 参数 | 返回值 | 说明 |
| --- | --- | --- | --- | --- |
| `minimize()` | `window:minimize` | — | `Promise<true>` | 最小化当前窗口 |
| `toggleMaximize()` | `window:toggle-maximize` | — | `Promise<boolean>` | 最大化/还原，返回操作后是否最大化 |
| `close()` | `window:close` | — | `Promise<true>` | 关闭当前窗口 |
| `isMaximized()` | `window:is-maximized` | — | `Promise<boolean>` | 查询最大化状态 |

示例：

```ts
const maximized = await window.desktop.win.toggleMaximize()
if (maximized) console.log('已最大化')
```

> 无边框窗口（`frame: false`）下，标题栏拖拽区由 CSS `-webkit-app-region: drag` 实现，
> 交互控件必须声明 `no-drag`；双击标题栏空白处会调用 `toggleMaximize()`。

### 1.2 服务健康探测 `window.desktop.service`

| 方法 | IPC 通道 | 参数 | 返回值 |
| --- | --- | --- | --- |
| `health()` | `service:health` | — | `Promise<{ ok: boolean; status?: number; error?: string }>` |

说明：由主进程使用 `net.fetch` 请求 `http://127.0.0.1:8800/health`，避免渲染进程跨域问题。

```ts
const { ok, status } = await window.desktop.service.health()
```

### 1.3 PDF 导出 `window.desktop.report`

| 方法 | IPC 通道 | 参数 | 返回值 |
| --- | --- | --- | --- |
| `savePdf(payload)` | `report:save-pdf` | `{ filename: string; html: string }` | `Promise<{ ok: boolean; path?: string; canceled?: boolean; error?: string }>` |

行为：弹出保存对话框 → 隐藏窗口加载 HTML → `webContents.printToPDF` → 写入所选路径。

```ts
await window.desktop.report.savePdf({ filename: 'report', html: '<h1>Hello</h1>' })
```

### 1.4 可选：RTSP 拉流 `window.desktop.stream`

> 不需要流媒体能力时，可整体删除 `src/main/stream/`、本组 IPC、preload 的 `stream` 段与 `ffmpeg-static` 依赖。

| 方法 | IPC 通道 | 参数 | 返回值 |
| --- | --- | --- | --- |
| `start(streamId, rtspUrl)` | `stream:start` | `streamId: string, rtspUrl: string` | `Promise<{ streamId: string; status: string; wsUrl: string; error?: string }>` |
| `stop(streamId)` | `stream:stop` | `streamId: string` | `Promise<{ ok: boolean }>` |
| `status(streamId?)` | `stream:status` | `streamId?: string` | `Promise<StreamInfo \| StreamInfo[]>` |

```ts
const { wsUrl } = await window.desktop.stream.start('ch-01', 'rtsp://user:pass@host/stream')
// 前端用 JSMpeg 等播放器订阅 wsUrl
```

---

## 2. HTTP 接口（FastAPI）

Base URL：`http://127.0.0.1:8800`

### 2.1 健康检查

`GET /health`

- 用途：前端 `isBackendReady()` 探测、容器探针
- 返回：`{ "status": "ok", "time": "2026-11-02T15:30:00.123456" }`

```bash
curl http://127.0.0.1:8800/health
```

### 2.2 服务健康（结构化）

`GET /api/system/health`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `status` | string | 固定 `ok` |
| `time` | string | 响应时间（ISO 8601） |
| `version` | string | 服务版本 |
| `device` | string | 运行平台（`platform.machine()`） |

```json
{ "status": "ok", "time": "2026-11-02T15:30:00+08:00", "version": "1.0.0", "device": "AMD64" }
```

### 2.3 服务信息

`GET /api/system/info`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `name` | string | 服务名称 |
| `version` | string | 版本号 |
| `python` | string | Python 版本 |
| `device` | string | 运行平台 |
| `startedAt` | string | 进程启动时间 |

### 2.4 示例实体 items

#### 2.4.1 分页查询

`GET /api/items`

| 查询参数 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `page` | int ≥1 | 1 | 页码 |
| `page_size` | int 1~200 | 10 | 每页条数 |
| `keyword` | string | `""` | 模糊匹配 id / name / category |
| `status` | `active` \| `paused` | 空 | 状态过滤 |

响应 `ItemPage`：

```json
{
  "total": 24,
  "page": 1,
  "page_size": 10,
  "items": [
    {
      "id": "item-001",
      "name": "示例条目 A",
      "category": "Alpha",
      "status": "active",
      "value": 40,
      "updatedAt": "2026-11-02T14:30:00+08:00"
    }
  ]
}
```

#### 2.4.2 查询单条

`GET /api/items/{item_id}` → `Item`；不存在返回 `404 {"detail": "条目不存在"}`

#### 2.4.3 新增

`POST /api/items`

```json
{ "name": "新条目", "category": "Alpha", "status": "active", "value": 10 }
```

- 成功：`201` + `Item`（服务端生成 `id` 与 `updatedAt`）
- 副作用：向 `/ws/events` 广播 `info` 级事件

#### 2.4.4 更新

`PUT /api/items/{item_id}`，请求体字段均可选：

```json
{ "value": 20, "status": "paused" }
```

- 成功：`200` + 更新后的 `Item`
- 不存在：`404`
- 副作用：广播 `info` 级事件

#### 2.4.5 删除

`DELETE /api/items/{item_id}`

- 成功：`204`（无响应体）
- 不存在：`404`
- 副作用：广播 `warning` 级事件

---

## 3. WebSocket

### 3.1 实时事件 `/ws/events`

- 连接：`ws://127.0.0.1:8800/ws/events`（开发环境由 vite 代理 `ws://localhost:5180/ws/events`）
- 客户端：保持连接即可，服务端单向推送；可发送任意文本作为心跳（会被忽略）
- 消息体 `AppEvent`：

```json
{
  "id": "9f2c1a7b",
  "level": "info",
  "title": "条目已创建",
  "message": "item-8f21c0aa · 新条目",
  "timestamp": "2026-11-02T15:31:02+08:00"
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 事件 ID |
| `level` | `info` \| `warning` \| `error` | 级别，用于侧栏圆点颜色 |
| `title` | string | 标题 |
| `message` | string | 详情 |
| `timestamp` | string | 事件时间（ISO 8601） |

前端封装：`api/ws.ts` 提供 `eventStream.connect() / subscribe(fn) / disconnect()`，断线后每 3 秒自动重连。

服务端广播：`app/ws/events.py` 的 `hub.broadcast_threadsafe(dict)`（可从任意线程调用）。

---

## 4. 前端模块接口

### 4.1 HTTP 客户端 `api/client.ts`

| 导出 | 签名 | 说明 |
| --- | --- | --- |
| `http` | `AxiosInstance` | 统一 baseURL / 超时 |
| `isBackendReady()` | `() => Promise<boolean>` | 探测服务可用性并缓存结果 |
| `backendState()` | `() => boolean \| null` | 读取缓存（null=未探测） |
| `withBackend(real, mock)` | `<T>(real: () => Promise<T>, mock: () => T \| Promise<T>) => Promise<T>` | 真实接口优先，失败降级 |

### 4.2 接口集合 `api/index.ts`

| 方法 | 签名 | 对应 HTTP |
| --- | --- | --- |
| `systemApi.health()` | `() => Promise<HealthInfo>` | `GET /api/system/health` |
| `systemApi.info()` | `() => Promise<ServiceInfo>` | `GET /api/system/info` |
| `itemApi.list(query)` | `(q?: ItemQuery) => Promise<ItemPage>` | `GET /api/items` |
| `itemApi.get(id)` | `(id: string) => Promise<Item>` | `GET /api/items/{id}` |
| `itemApi.create(payload)` | `(p: Omit<Item,'id'\|'updatedAt'>) => Promise<Item>` | `POST /api/items` |
| `itemApi.update(id, patch)` | `(id: string, p: Partial<Item>) => Promise<Item>` | `PUT /api/items/{id}` |
| `itemApi.remove(id)` | `(id: string) => Promise<void>` | `DELETE /api/items/{id}` |

### 4.3 状态 `stores/eventStore.ts`

| 字段/方法 | 类型 | 说明 |
| --- | --- | --- |
| `events` | `AppEvent[]` | 最新事件，最多 200 条 |
| `push(event)` | `(e: AppEvent) => void` | 头插并截断 |
| `clear()` | `() => void` | 清空 |

### 4.4 UI 组件 `components/ui.tsx`

| 组件 | Props | 说明 |
| --- | --- | --- |
| `Panel` | `{ title?, sub?, extra?, children, style?, bodyStyle? }` | 白底卡片容器 |
| `Kpi` | `{ label, value, hint?, tone?: 'default'\|'blue'\|'red'\|'amber'\|'green' }` | 指标卡 |
| `InfoGrid` | `{ items: Array<[ReactNode, ReactNode]> }` | 键值网格（96px 标签列） |
| `Timeline` | `{ items: Array<{ title, desc?, time?, tone? }> }` | 时间线 |
| `StatStrip` | `{ items: Array<{ value, label }> }` | 三格数据条 |
| `Chips` | `{ options, value, onChange }` | 单选筛选胶囊 |
| `Seg` | `{ options, value, onChange }` | 分段切换胶囊 |

### 4.5 标签与页签 `components/opc.tsx`

| 组件 | Props | 说明 |
| --- | --- | --- |
| `Tag` | `{ tone?: 'gray'\|'blue'\|'red'\|'amber'\|'green'; dot?: string; children }` | 软色标签 |
| `Tabs<T>` | `{ items: {label,value}[], value: T, onChange: (v: T) => void }` | 下划线页签 |

### 4.6 画布标注 `components/RoiCanvas.tsx`

| Prop | 类型 | 说明 |
| --- | --- | --- |
| `zones` | `RoiZone[]` | 已保存区域（归一化坐标） |
| `draft` | `RoiDraft \| null` | 正在绘制的区域 |
| `selectedId` | `string \| null` | 选中区域 |
| `drawing` | `boolean` | 是否处于绘制模式 |
| `onCanvasClick(pt)` | `(pt: [number, number]) => void` | 点击画布（归一化坐标） |
| `onFinishDraft()` | `() => void` | 双击/右键闭合 |
| `onSelectZone(id)` | `(id: string \| null) => void` | 选中区域 |
| `onMoveVertex(zoneId, idx, pt)` | `(zoneId: string, idx: number, pt: [number, number]) => void` | 拖拽顶点 |

### 4.7 导出工具 `utils/export.ts`

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `fileStamp()` | `() => string` | `20261102_1530` |
| `downloadCsv(name, rows)` | `(name: string, rows: (string\|number\|null\|undefined)[][]) => void` | UTF-8 BOM，自动转义 |
| `exportPdf(name, html)` | `(name: string, html: string) => Promise<'saved'\|'canceled'\|'printed'>` | Electron 保存 / 浏览器打印 |
| `buildSimpleReportHtml(title, bodyHtml)` | `(title: string, body: string) => string` | 最小报告模板 |

### 4.8 标题栏 `components/TitleBar.tsx`

| Prop | 类型 | 说明 |
| --- | --- | --- |
| `title` | string | 当前页面标题 |
| `serviceOk` | `boolean \| null` | 服务状态（null=探测中） |
| `onOpenSettings` | `() => void` | 点击「设置」 |
| `showRailToggle` | boolean | 是否显示「概况」开关 |
| `railOpen` | boolean | 概况栏当前状态 |
| `onToggleRail` | `() => void` | 切换概况栏 |

> 浏览器环境（无 `window.desktop`）自动隐藏窗口控制按钮，避免出现不可用交互。

---

## 5. 扩展接口时的一致性清单

1. 前端类型（`types/index.ts`）与后端模型（`schemas.py`）字段同名同义；
2. 新接口在本文档补充：方法、路径、参数、响应、示例、错误码；
3. 写操作若需实时反馈，调用 `hub.broadcast_threadsafe()` 并复用 `AppEvent` 结构；
4. 前端接口函数统一放在 `api/index.ts`，并保留 `withBackend` 降级分支（除非明确要求离线即报错）。
