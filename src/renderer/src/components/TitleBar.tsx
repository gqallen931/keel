import { useEffect, useState, type MouseEvent } from 'react'
import { SettingOutlined, SafetyCertificateOutlined } from '@ant-design/icons'

interface TitleBarProps {
  /** 当前页面标题 */
  title: string
  /** 本地服务探测状态：null=探测中 */
  serviceOk: boolean | null
  onOpenSettings: () => void
  /** 概览页专用：右侧信息栏开关 */
  showRailToggle?: boolean
  railOpen?: boolean
  onToggleRail?: () => void
}

const getWinApi = () => (typeof window !== 'undefined' ? window.desktop?.win : undefined)

/** 自绘标题栏：品牌 / 页面标题 / 服务状态 / 设置 / 窗口控制 */
export default function TitleBar({
  title,
  serviceOk,
  onOpenSettings,
  showRailToggle,
  railOpen,
  onToggleRail
}: TitleBarProps): JSX.Element {
  const win = getWinApi()
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    if (!win) return
    let alive = true
    const sync = () => {
      void win.isMaximized().then((v) => {
        if (alive) setMaximized(v)
      })
    }
    sync()
    window.addEventListener('resize', sync)
    return () => {
      alive = false
      window.removeEventListener('resize', sync)
    }
  }, [win])

  const toggleMaximize = async () => {
    if (!win) return
    setMaximized(await win.toggleMaximize())
  }

  const onBarDoubleClick = (e: MouseEvent<HTMLElement>) => {
    if (!win) return
    if ((e.target as HTMLElement).closest('.tb-right')) return
    void toggleMaximize()
  }

  return (
    <header className="titlebar" onDoubleClick={onBarDoubleClick}>
      <div className="tb-left">
        <span className="tb-mark">
          <SafetyCertificateOutlined />
        </span>
        <span className="tb-brand">Desktop Framework</span>
        <span className="tb-sep" />
        <span className="tb-page">{title}</span>
      </div>

      <div className="tb-right">
        {showRailToggle && (
          <button type="button" className="tb-btn" onClick={onToggleRail}>
            {railOpen ? '收起概况' : '概况'}
          </button>
        )}

        <span
          className={`tb-status ${serviceOk ? 'ok' : serviceOk === false ? 'bad' : ''}`}
          title={serviceOk ? '本地服务在线（127.0.0.1:8800）' : '本地服务未连接'}
        >
          <i />
          <span className="tb-status-text">
            {serviceOk === null ? '探测中' : serviceOk ? '服务在线' : '服务离线'}
          </span>
        </span>

        <button type="button" className="tb-btn" onClick={onOpenSettings} title="打开设置">
          <SettingOutlined />
          <span className="tb-btn-text">设置</span>
        </button>

        {win && (
          <div className="tb-winctl">
            <button type="button" aria-label="最小化" title="最小化" onClick={() => void win.minimize()}>
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                <path d="M1 5h8" stroke="currentColor" strokeWidth="1" />
              </svg>
            </button>
            <button
              type="button"
              aria-label={maximized ? '向下还原' : '最大化'}
              title={maximized ? '向下还原' : '最大化'}
              onClick={() => void toggleMaximize()}
            >
              {maximized ? (
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                  <path d="M2.5 2.5h6v6h-6z" fill="none" stroke="currentColor" strokeWidth="1" />
                  <path d="M1 7.5V1h6.5" fill="none" stroke="currentColor" strokeWidth="1" />
                </svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                  <rect x="1" y="1" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1" />
                </svg>
              )}
            </button>
            <button
              type="button"
              className="tb-close"
              aria-label="关闭"
              title="关闭"
              onClick={() => void win.close()}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
