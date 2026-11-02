import React, { CSSProperties, ReactNode } from 'react'

/** 通用面板：白底 + 15px 半粗标题 + 12.5px 灰副标题（迁移自参考项目 .panel） */
export function Panel(props: {
  title?: ReactNode
  sub?: ReactNode
  extra?: ReactNode
  children: ReactNode
  style?: CSSProperties
  bodyStyle?: CSSProperties
}): JSX.Element {
  const { title, sub, extra, children, style, bodyStyle } = props
  return (
    <div className="panel" style={style}>
      {(title || extra) && (
        <div className="panel-head">
          <div style={{ minWidth: 0 }}>
            {title && <div className="panel-title">{title}</div>}
            {sub && <div className="panel-sub">{sub}</div>}
          </div>
          <div className="panel-extra">{extra}</div>
        </div>
      )}
      <div style={bodyStyle}>{children}</div>
    </div>
  )
}

/** KPI 指标卡：小灰标签 + 大号数字 + 说明（迁移自参考项目 .kpi） */
export function Kpi(props: {
  label: ReactNode
  value: ReactNode
  hint?: ReactNode
  tone?: 'default' | 'blue' | 'red' | 'amber' | 'green'
}): JSX.Element {
  const { label, value, hint, tone = 'default' } = props
  return (
    <div className="kpi">
      <div className="k">{label}</div>
      <div className={`v tone-${tone}`}>{value}</div>
      {hint && <div className="d">{hint}</div>}
    </div>
  )
}

/** 键值信息网格（96px 标签列 + 内容列，迁移自参考项目 .info-grid） */
export function InfoGrid(props: { items: Array<[ReactNode, ReactNode]> }): JSX.Element {
  return (
    <div className="info-grid">
      {props.items.map(([k, v], i) => (
        <React.Fragment key={i}>
          <div className="ig-key">{k}</div>
          <div className="ig-val">{v}</div>
        </React.Fragment>
      ))}
    </div>
  )
}

/** 时间线（左侧竖线 + 圆点，迁移自参考项目 .timeline） */
export function Timeline(props: {
  items: Array<{ title: ReactNode; desc?: ReactNode; time?: ReactNode; tone?: 'default' | 'red' | 'amber' | 'green' }>
}): JSX.Element {
  return (
    <div className="timeline">
      {props.items.map((it, i) => (
        <div className={`tl-item tone-${it.tone ?? 'default'}`} key={i}>
          <div className="tl-title">
            <span>{it.title}</span>
            {it.time && <span className="tl-time">{it.time}</span>}
          </div>
          {it.desc && <div className="tl-desc">{it.desc}</div>}
        </div>
      ))}
    </div>
  )
}

/** 三格数据条（迁移自参考项目 .hc-stats / .trio） */
export function StatStrip(props: { items: Array<{ value: ReactNode; label: ReactNode }> }): JSX.Element {
  return (
    <div className="stat-strip">
      {props.items.map((it, i) => (
        <div key={i}>
          <b>{it.value}</b>
          <span>{it.label}</span>
        </div>
      ))}
    </div>
  )
}

/** 筛选胶囊组（单选，迁移自参考项目 .chips） */
export function Chips(props: {
  options: Array<{ label: ReactNode; value: string }>
  value: string
  onChange: (v: string) => void
}): JSX.Element {
  return (
    <div className="chips">
      {props.options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={o.value === props.value ? 'on' : ''}
          onClick={() => props.onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** 分段胶囊切换（迁移自参考项目 .seg） */
export function Seg(props: {
  options: Array<{ label: ReactNode; value: string | number }>
  value: string | number
  onChange: (v: any) => void
}): JSX.Element {
  return (
    <div className="seg">
      {props.options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={o.value === props.value ? 'on' : ''}
          onClick={() => props.onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
