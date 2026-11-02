# 架构说明

## 1. 总体分层

```
┌─────────────────────────────────────────────────────────────────────┐
│ Rendering Process (React 18 + TypeScript)                           │
│  pages  →  components  →  api  →  stores  →  utils/theme            │
└───────────────┬─────────────────────────────────────────────────────┘
                │  contextBridge（仅暴露白名单方法）
┌───────────────┴─────────────────────────────────────────────────────┐
│ Main Process (Electron)                                             │
│  window lifecycle · IPC registry · optional RTSP stream service      │
└───────────────┬─────────────────────────────────────────────────────┘
                │  HTTP / WebSocket
┌───────────────┴─────────────────────────────────────────────────────┐
│ Local Service (FastAPI + SQLite)  ← 可整体替换为任意后端              │
└─────────────────────────────────────────────────────────────────────┘
```

三层职责边界：

| 层 | 负责 | 不负责 |
| --- | --- | --- |
| 主进程 | 窗口生命周期、系统能力（文件、打印、托盘）、可选流媒体 | 业务逻辑、数据持久化 |
| 渲染层 | 视图、交互、状态、接口编排 | 直接访问 Node / 文件系统 |
| 本地服务 | 数据持久化、业务校验、实时推送 | 界面渲染 |

## 2. 目录与模块依赖

```
src/renderer/src
├── pages/*            ← 依赖 components / api / stores / utils
├── layouts/*          ← 依赖 components/TitleBar / stores / api
├── components/*       ← 只依赖 types / theme，不依赖 api（可复用）
├── api/*              ← 依赖 types / mock；不依赖页面
├── stores/*           ← 依赖 types
├── utils/*            ← 纯函数，无副作用（除文件下载）
└── theme.ts           ← 设计令牌，被 styles.css 镜像
```

约束：

1. `components/` 内不允许发起网络请求，保持“纯展示 + 事件回调”；
2. 页面不直接使用 `axios`，统一走 `api/index.ts`，便于统一降级与鉴权扩展；
3. 主进程新增能力必须先注册 IPC，再通过 preload 暴露，渲染层不感知底层实现。

## 3. 关键设计

### 3.1 无边框窗口 + 自绘标题栏

- 主进程 `BrowserWindow({ frame: false })`；
- 标题栏 44px，`-webkit-app-region: drag` 作为拖拽区，交互元素 `no-drag`；
- 窗口控制（最小化/最大化/关闭）通过 IPC 调用主进程，最大化状态由 `isMaximized()` + `resize` 事件同步；
- 浏览器联调时无 IPC 能力，窗口控制按钮自动隐藏。

### 3.2 设计令牌双来源同步

| 位置 | 用途 |
| --- | --- |
| `styles.css :root` | 原生 CSS / 自建组件 |
| `theme.ts tokens` | AntD ThemeConfig、ECharts 主题 |

新增令牌必须两处同步（`tokens` 中同名驼峰变量与 CSS 变量一一对应）。

### 3.3 数据获取与降级

```
page → api/xxxApi → withBackend(real, mock)
                        ├─ backendReady === false → mock
                        ├─ real() 成功            → 真实数据
                        └─ 网络错误 / 5xx         → 标记降级 + mock
```

- `isBackendReady()` 在应用启动时探测一次，之后由失败请求自动更新缓存；
- 4xx 不触发降级（属于请求本身错误），会向上抛出，由调用方提示。

### 3.4 实时通道

- 服务端 `EventHub` 维护连接集合，支持跨线程 `broadcast_threadsafe`；
- 前端 `EventStream` 断线 3 秒重连，事件写入 Zustand store；
- 事件结构固定为 `AppEvent`，新增事件类型只需扩展 `title/message` 语义，不改协议。

### 3.5 数据持久化（示例）

- SQLite 单文件 + WAL，适合桌面单机场景；
- 写入经进程内 `RLock` 串行化；
- 首次启动自动建表并写入 24 条示例数据，方便开箱验证。

## 4. 安全基线

| 项 | 现状 |
| --- | --- |
| `nodeIntegration` | `false` |
| `contextIsolation` | `true` |
| `sandbox` | `false`（需使用 preload 的 Node 能力） |
| 渲染层 Node 访问 | 禁止，仅 `window.desktop` 白名单 |
| CSP | `default-src 'self'`，仅放行 `127.0.0.1` / `localhost` 的 HTTP 与 WS |
| 外部链接 | `setWindowOpenHandler` 交给系统浏览器 |
| 敏感数据 | 仓库内不含任何密钥、数据库、日志或用户数据 |

## 5. 构建与产物

| 阶段 | 工具 | 产物 |
| --- | --- | --- |
| 类型检查 | `tsc --noEmit` | 无产物，失败即阻断 |
| 构建 | `electron-vite build` | `out/main`、`out/preload`、`out/renderer` |
| 打包 | `electron-builder` | `release/*-setup.exe`、`release/*-portable.exe` |

> 渲染层依赖（react/antd/echarts 等）在构建期被 Vite 打进 bundle，因此放在 `devDependencies`；
> 只有主进程运行时依赖（`ws`、`ffmpeg-static`）放在 `dependencies`，可显著减小安装包体积。

## 6. 扩展点

| 需求 | 扩展位置 |
| --- | --- |
| 新增页面 | `pages/` + `router/index.tsx` + `NAV_ITEMS` |
| 新增业务接口 | `api/index.ts` + `types/index.ts` + 后端 `api/` + `schemas.py` |
| 新增全局状态 | `stores/*`（Zustand） |
| 新增系统能力 | `main/ipc.ts` + `preload/index.ts` |
| 替换设计体系 | `styles.css :root` + `theme.ts` |
| 替换后端 | 保留 HTTP/WS 契约即可，前端不感知实现语言 |
| 移除示例能力 | 删除 `mock/`、`api/index.ts` 的 itemApi、`ai-service/app/api/items.py` |

## 7. 已知取舍

1. **单窗口 + 单实例**：未启用多窗口 / 单实例锁，需要时在 `main/index.ts` 增加；
2. **不做自动更新**：未集成 electron-updater，避免引入发布服务依赖；
3. **无鉴权**：登录/授权属于业务层，框架仅保留角色/权限的扩展位（可参考路由守卫模式自行实现）；
4. **SQLite 示例仅单进程写**：多实例部署时应替换为服务端数据库。
