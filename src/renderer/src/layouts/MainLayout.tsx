import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  DashboardOutlined,
  AppstoreOutlined,
  SettingOutlined,
  SearchOutlined,
  ApiOutlined,
  UserOutlined
} from '@ant-design/icons'
import TitleBar from '@/components/TitleBar'
import { InfoGrid, StatStrip } from '@/components/ui'
import { useEventStore } from '@/stores/eventStore'
import { itemApi } from '@/api'
import { isBackendReady } from '@/api/client'
import type { Item, PageMeta } from '@/types'

interface NavItem {
  path: string
  label: string
  desc: string
  icon: ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { path: '/overview', label: '总览', desc: '指标与列表', icon: <DashboardOutlined /> },
  { path: '/components', label: '组件库', desc: '设计系统', icon: <AppstoreOutlined /> },
  { path: '/settings', label: '设置', desc: '服务与偏好', icon: <SettingOutlined /> }
]

/** 页面标题（显示在自绘标题栏中） */
const ROUTE_META: Record<string, PageMeta> = {
  '/overview': { title: '总览', desc: '示例数据概览' },
  '/components': { title: '组件库', desc: '内置 UI 组件' },
  '/settings': { title: '设置', desc: '服务信息与偏好' }
}

const WEEK = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

export default function MainLayout(): JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const events = useEventStore((s) => s.events)

  const [serviceOk, setServiceOk] = useState<boolean | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [railOpen, setRailOpen] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1280
  )
  const searchRef = useRef<HTMLInputElement>(null)

  const pathname = location.pathname
  const meta = ROUTE_META[pathname] ?? { title: 'Keel', desc: '' }
  const showRail = pathname === '/overview'

  // 服务健康探测
  useEffect(() => {
    let alive = true
    const probe = async () => {
      const ok = await isBackendReady()
      if (alive) setServiceOk(ok)
    }
    void probe()
    const timer = window.setInterval(() => void probe(), 15000)
    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [])

  // 右侧概况数据
  useEffect(() => {
    if (!showRail) return
    let alive = true
    void itemApi.list({ page: 1, page_size: 200 }).then((page) => {
      if (alive) setItems(page.items)
    })
    return () => {
      alive = false
    }
  }, [showRail])

  // Ctrl / ⌘ + K 聚焦搜索
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
        setSearchOpen(true)
      }
      if (e.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    setSearchOpen(false)
    setKeyword('')
    if (window.innerWidth < 1280) setRailOpen(false)
  }, [pathname])

  const hits = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return NAV_ITEMS.filter(
      (n) => !kw || n.label.toLowerCase().includes(kw) || n.desc.toLowerCase().includes(kw)
    )
  }, [keyword])

  const go = (path: string) => {
    setSearchOpen(false)
    setKeyword('')
    searchRef.current?.blur()
    navigate(path)
  }

  const now = new Date()
  const dateText = `${now.getMonth() + 1}月${now.getDate()}日 ${WEEK[now.getDay()]}`
  const activeCount = items.filter((x) => x.status === 'active').length
  const pausedCount = items.length - activeCount
  const totalValue = items.reduce((sum, x) => sum + x.value, 0)

  return (
    <div className={`app${showRail ? ' with-rail' : ''}${railOpen ? ' rail-open' : ' rail-closed'}`}>
      <TitleBar
        title={meta.title}
        serviceOk={serviceOk}
        onOpenSettings={() => go('/settings')}
        showRailToggle={showRail}
        railOpen={railOpen}
        onToggleRail={() => setRailOpen((v) => !v)}
      />

      <aside className="side">
        <div className="search">
          <SearchOutlined className="search-ico" />
          <input
            ref={searchRef}
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value)
              setSearchOpen(true)
            }}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => window.setTimeout(() => setSearchOpen(false), 120)}
            placeholder="搜索页面"
            autoComplete="off"
          />
          <span className="kbd">⌘K</span>
          {searchOpen && (
            <div className="search-pop">
              {hits.length === 0 ? (
                <div className="sp-empty">没有匹配结果</div>
              ) : (
                hits.map((h) => (
                  <button
                    key={h.path}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => go(h.path)}
                  >
                    <span className="sp-ico">{h.icon}</span>
                    <span>{h.label}</span>
                    <span className="sp-hint">{h.desc}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <nav className="nav">
          <div className="nav-label">导航</div>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              type="button"
              className={pathname === item.path ? 'on' : ''}
              onClick={() => go(item.path)}
            >
              <span className="ico">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="nav-label">最近事件（{events.length}）</div>
        <div className="recent">
          {events.length === 0 ? (
            <div className="recent-empty">暂无实时事件</div>
          ) : (
            events.slice(0, 5).map((e) => (
              <button key={e.id} type="button" title={e.message}>
                {e.title} · {e.message}
              </button>
            ))
          )}
        </div>

        <div className="side-foot">
          <button type="button" className="service-card" onClick={() => go('/settings')}>
            <span className="me-ava">
              <UserOutlined />
            </span>
            <div>
              <div className="svc-name">本地服务</div>
              <div className="svc-sub">
                {serviceOk === null
                  ? '正在探测…'
                  : serviceOk
                    ? '在线 · 127.0.0.1:8800'
                    : '离线 · 使用示例数据'}
              </div>
            </div>
            <ApiOutlined className="gear" />
          </button>
          <div className="sign">MIT Licensed · Keel</div>
        </div>
      </aside>

      <main className="main">
        <div className="page">
          <Outlet />
        </div>
      </main>

      {showRail && (
        <aside className="rail">
          <div className="rail-sec">
            <div className="rail-k">
              <span>今天</span>
            </div>
            <div className="rail-date">{dateText}</div>
            <div className="rail-big">
              {events.length}
              <small>条实时事件</small>
            </div>
            <div className="trio">
              <div>
                <b>{items.length}</b>
                <span>条目总数</span>
              </div>
              <div>
                <b>{activeCount}</b>
                <span>启用中</span>
              </div>
              <div>
                <b>{totalValue}</b>
                <span>指标合计</span>
              </div>
            </div>
          </div>

          <div className="rail-sec">
            <div className="rail-k">
              <span>最近事件</span>
              <span>WebSocket</span>
            </div>
            {events.length === 0 ? (
              <div className="rail-empty">暂无实时事件</div>
            ) : (
              <div className="mini-list">
                {events.slice(0, 6).map((e) => (
                  <div key={e.id} className="mini-item">
                    <span className={`dot ${e.level}`} />
                    <span className="grow">{e.title}</span>
                    <span className="r">{new Date(e.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rail-sec">
            <div className="rail-k">
              <span>条目状态</span>
            </div>
            <StatStrip
              items={[
                { value: activeCount, label: '启用' },
                { value: pausedCount, label: '暂停' },
                { value: items.length, label: '合计' }
              ]}
            />
          </div>

          <div className="rail-sec">
            <div className="rail-k">
              <span>服务状态</span>
            </div>
            <InfoGrid
              items={[
                ['服务地址', '127.0.0.1:8800'],
                ['连接状态', serviceOk ? '在线' : serviceOk === false ? '离线' : '探测中'],
                ['数据源', serviceOk ? 'REST API' : '本地示例数据'],
                ['渲染模式', window.desktop ? 'Electron' : 'Browser']
              ]}
            />
          </div>
        </aside>
      )}
    </div>
  )
}
