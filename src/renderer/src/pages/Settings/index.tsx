import { useEffect, useState } from 'react'
import { App, Button, Form, Input, Select, Switch } from 'antd'
import { systemApi } from '@/api'
import { Panel, InfoGrid } from '@/components/ui'
import { Tag } from '@/components/opc'
import type { HealthInfo, ServiceInfo } from '@/types'

const STORAGE_KEY = 'framework.settings'

interface Preferences {
  refreshSeconds: number
  density: 'compact' | 'default'
  notify: boolean
  endpoint: string
}

const DEFAULTS: Preferences = {
  refreshSeconds: 10,
  density: 'default',
  notify: true,
  endpoint: 'http://127.0.0.1:8800'
}

/** 设置页：服务状态 + 本地偏好（localStorage） */
export default function Settings(): JSX.Element {
  const { message } = App.useApp()
  const [form] = Form.useForm<Preferences>()
  const [health, setHealth] = useState<HealthInfo | null>(null)
  const [info, setInfo] = useState<ServiceInfo | null>(null)

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    form.setFieldsValue(raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS)

    let alive = true
    const load = async () => {
      const [h, i] = await Promise.all([systemApi.health(), systemApi.info()])
      if (!alive) return
      setHealth(h)
      setInfo(i)
    }
    void load()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const save = async () => {
    const values = await form.validateFields()
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values))
    message.success('偏好已保存到本地')
  }

  const ok = health?.status === 'ok'

  return (
    <div className="set-layout">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Panel
          title="服务信息"
          sub="来自 GET /api/system/health 与 /api/system/info"
          extra={ok ? <Tag tone="green">在线</Tag> : <Tag tone="amber">离线</Tag>}
        >
          <InfoGrid
            items={[
              ['服务名称', info?.name ?? '-'],
              ['版本', info?.version ?? '-'],
              ['运行环境', info?.python ?? '-'],
              ['设备', info?.device ?? '-'],
              ['启动时间', info?.startedAt ? new Date(info.startedAt).toLocaleString() : '-'],
              ['健康检查', health ? `${health.status} · ${health.time}` : '未探测']
            ]}
          />
          <div className="demo-text">
            服务未启动时页面自动降级为内置示例数据，功能与交互不受影响。
          </div>
        </Panel>

        <Panel title="偏好设置" sub="仅保存在本机 localStorage，不写入后端">
          <Form form={form} layout="vertical" initialValues={DEFAULTS}>
            <div className="switch-row">
              <div>
                <div>自动刷新</div>
                <div className="hint">轮询间隔（秒），用于列表与指标刷新</div>
              </div>
              <Form.Item name="refreshSeconds" noStyle>
                <Select
                  style={{ width: 140 }}
                  options={[5, 10, 30, 60].map((v) => ({ label: `${v} 秒`, value: v }))}
                />
              </Form.Item>
            </div>
            <div className="switch-row">
              <div>
                <div>界面密度</div>
                <div className="hint">紧凑模式下表格行高更小</div>
              </div>
              <Form.Item name="density" noStyle>
                <Select
                  style={{ width: 140 }}
                  options={[
                    { label: '默认', value: 'default' },
                    { label: '紧凑', value: 'compact' }
                  ]}
                />
              </Form.Item>
            </div>
            <div className="switch-row">
              <div>
                <div>桌面通知</div>
                <div className="hint">收到实时事件时弹出系统通知</div>
              </div>
              <Form.Item name="notify" valuePropName="checked" noStyle>
                <Switch />
              </Form.Item>
            </div>
            <div className="switch-row" style={{ marginBottom: 16 }}>
              <div style={{ flex: 1, marginRight: 16 }}>
                <div>服务地址</div>
                <div className="hint">仅供展示，实际地址由构建配置决定</div>
              </div>
              <Form.Item name="endpoint" noStyle>
                <Input style={{ width: 240 }} />
              </Form.Item>
            </div>
            <Button type="primary" onClick={() => void save()}>
              保存偏好
            </Button>
          </Form>
        </Panel>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Panel title="关于" sub="可直接 fork 作为项目起点">
          <InfoGrid
            items={[
              ['框架', 'Electron + React + TypeScript'],
              ['构建', 'electron-vite（Vite 5）'],
              ['UI', 'Ant Design 5 + 自建原子组件'],
              ['状态', 'Zustand'],
              ['图表', 'ECharts 5'],
              ['许可', 'MIT']
            ]}
          />
        </Panel>
        <Panel title="目录速览">
          <InfoGrid
            items={[
              ['src/main', '主进程：窗口、IPC、可选拉流'],
              ['src/preload', 'contextBridge 安全桥'],
              ['src/renderer', 'React 渲染层'],
              ['ai-service', 'Python FastAPI 服务骨架'],
              ['docs/API.md', '接口说明'],
              ['docs/ARCHITECTURE.md', '架构说明']
            ]}
          />
        </Panel>
      </div>
    </div>
  )
}
