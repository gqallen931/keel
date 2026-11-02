import type { ReactNode } from 'react'

/** OPC 软色标签色板（与 styles.css 的 .tag.tone-* 对齐） */
export type TagTone = 'gray' | 'blue' | 'red' | 'amber' | 'green'

export interface OpcTagProps {
  tone?: TagTone
  /** 前置圆点颜色，用于保留算法/级别的身份色 */
  dot?: string
  children: ReactNode
}

/** 软色标签：替代 AntD <Tag color> 的实心色块 */
export function Tag({ tone = 'gray', dot, children }: OpcTagProps): JSX.Element {
  return (
    <span className={`tag tone-${tone}`}>
      {dot && <i className="tag-dot" style={{ background: dot }} />}
      {children}
    </span>
  )
}

export interface OpcTabItem<T extends string = string> {
  label: string
  value: T
}

export interface OpcTabsProps<T extends string = string> {
  items: OpcTabItem<T>[]
  value: T
  onChange: (value: T) => void
}

/** 下划线页签：对齐参考项目 .tabs（区别于筛选用的 .seg 胶囊） */
export function Tabs<T extends string = string>({
  items,
  value,
  onChange
}: OpcTabsProps<T>): JSX.Element {
  return (
    <div className="tabs">
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          className={it.value === value ? 'on' : ''}
          onClick={() => onChange(it.value)}
        >
          {it.label}
        </button>
      ))}
    </div>
  )
}
