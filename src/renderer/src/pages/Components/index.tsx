import { useState } from 'react'
import { Kpi, Panel, StatStrip, InfoGrid, Timeline, Seg, Chips } from '@/components/ui'
import { Tag, Tabs } from '@/components/opc'
import RoiCanvas from '@/components/RoiCanvas'
import type { RoiZone } from '@/types'

const DEMO_ZONES: RoiZone[] = [
  {
    id: 'zone-a',
    name: '区域 A',
    shape: 'polygon',
    points: [
      [0.12, 0.14],
      [0.42, 0.14],
      [0.42, 0.42],
      [0.12, 0.42]
    ]
  },
  {
    id: 'zone-b',
    name: '越界线 B',
    shape: 'line',
    points: [
      [0.58, 0.22],
      [0.86, 0.38]
    ]
  }
]

type TabKey = 'basic' | 'advanced'

/** 组件库页：展示框架内置 UI 原子组件与画布标注组件 */
export default function Components(): JSX.Element {
  const [chip, setChip] = useState('all')
  const [seg, setSeg] = useState<string | number>('day')
  const [tab, setTab] = useState<TabKey>('basic')

  return (
    <div>
      <div className="kpi-grid">
        <Kpi label="Kpi 指标卡" value="1,280" hint="支持 tone 语义色" />
        <Kpi label="启用" value="96.4%" hint="趋势正常" tone="green" />
        <Kpi label="告警" value="12" hint="需关注" tone="amber" />
        <Kpi label="异常" value="3" hint="需处理" tone="red" />
      </div>

      <div className="grid2" style={{ marginTop: 16 }}>
        <Panel title="软色标签 Tag" sub="tone: gray / blue / green / amber / red">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Tag>默认</Tag>
            <Tag tone="blue">信息</Tag>
            <Tag tone="green">正常</Tag>
            <Tag tone="amber">关注</Tag>
            <Tag tone="red">异常</Tag>
            <Tag tone="blue" dot="#2f7ff0">
              带圆点
            </Tag>
          </div>
          <div className="demo-gap" />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <Chips
              value={chip}
              onChange={setChip}
              options={[
                { label: '全部', value: 'all' },
                { label: '启用', value: 'active' },
                { label: '暂停', value: 'paused' }
              ]}
            />
            <Seg
              value={seg}
              onChange={setSeg}
              options={[
                { label: '日', value: 'day' },
                { label: '周', value: 'week' },
                { label: '月', value: 'month' }
              ]}
            />
          </div>
        </Panel>

        <Panel title="页签 Tabs" sub="下划线页签，与筛选胶囊 Seg 区分">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { label: '基础', value: 'basic' },
              { label: '高级', value: 'advanced' }
            ]}
          />
          <div className="demo-text">
            {tab === 'basic'
              ? '基础页签内容：适合承载同层级、互斥的视图切换。'
              : '高级页签内容：可结合权限或路由懒加载做二级视图。'}
          </div>
        </Panel>

        <Panel title="数据条 StatStrip" sub="三格数字概览">
          <StatStrip
            items={[
              { value: 238, label: '总数' },
              { value: 233, label: '在线' },
              { value: 5, label: '离线' }
            ]}
          />
          <div className="demo-gap" />
          <InfoGrid
            items={[
              ['键值网格', '用于展示对象属性'],
              ['标签列宽', '96px，内容自适应'],
              ['典型场景', '服务信息、配置详情']
            ]}
          />
        </Panel>

        <Panel title="时间线 Timeline" sub="左侧竖线 + 状态圆点">
          <Timeline
            items={[
              { title: '服务启动', desc: '加载配置与数据库连接', time: '09:02', tone: 'green' },
              { title: '数据同步', desc: '增量拉取完成', time: '09:15', tone: 'default' },
              { title: '容量预警', desc: '使用率达到 82%', time: '10:40', tone: 'amber' }
            ]}
          />
        </Panel>
      </div>

      <Panel title="画布标注组件 RoiCanvas" sub="归一化坐标多边形/折线绘制与拖拽顶点" style={{ marginTop: 16 }}>
        <div className="roi-canvas-wrap">
          <RoiCanvas
            zones={DEMO_ZONES}
            draft={null}
            selectedId={null}
            drawing={false}
            onCanvasClick={() => undefined}
            onFinishDraft={() => undefined}
            onSelectZone={() => undefined}
            onMoveVertex={() => undefined}
          />
        </div>
        <div className="demo-text">
          组件只负责坐标与绘制，业务侧的规则绑定、保存下发由页面自行实现。
        </div>
      </Panel>
    </div>
  )
}
