import { useCallback, useEffect, useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { App, Button, Input, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DownloadOutlined, FilePdfOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { itemApi } from '@/api'
import { chart } from '@/theme'
import { Kpi, Panel, StatStrip } from '@/components/ui'
import { Tag } from '@/components/opc'
import { buildSimpleReportHtml, downloadCsv, exportPdf, fileStamp } from '@/utils/export'
import type { Item } from '@/types'

const AXIS_LABEL = { color: chart.text, fontSize: 12 }
const SPLIT_LINE = { lineStyle: { color: chart.grid } }

/** 总览页：演示「列表接口 + 指标卡 + 图表 + 导出」的典型组合 */
export default function Overview(): JSX.Element {
  const { message } = App.useApp()
  const [items, setItems] = useState<Item[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await itemApi.list({ page, page_size: 8, keyword })
      setItems(res.items)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }, [page, keyword])

  useEffect(() => {
    void load()
  }, [load])

  const activeCount = items.filter((x) => x.status === 'active').length
  const totalValue = items.reduce((sum, x) => sum + x.value, 0)

  // 类别分布（柱状图）
  const categoryOption = useMemo(() => {
    const counter = new Map<string, number>()
    items.forEach((x) => counter.set(x.category, (counter.get(x.category) ?? 0) + x.value))
    const rows = [...counter.entries()].sort((a, b) => b[1] - a[1])
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis', ...chart.tooltip },
      grid: { left: 8, right: 8, top: 18, bottom: 4, containLabel: true },
      xAxis: {
        type: 'category',
        data: rows.map((r) => r[0]),
        axisLabel: AXIS_LABEL,
        axisLine: { lineStyle: { color: chart.grid } },
        axisTick: { show: false }
      },
      yAxis: { type: 'value', axisLabel: AXIS_LABEL, splitLine: SPLIT_LINE, axisLine: { show: false } },
      series: [
        {
          type: 'bar',
          barMaxWidth: 28,
          data: rows.map((r) => r[1]),
          itemStyle: { color: chart.blue, borderRadius: [6, 6, 0, 0] }
        }
      ]
    }
  }, [items])

  // 近 7 日趋势（示例序列，替换为真实时序接口即可）
  const trendOption = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return `${d.getMonth() + 1}/${d.getDate()}`
    })
    const base = Math.max(20, Math.round(totalValue / 8))
    const series = days.map((_, i) => Math.round(base * (0.7 + ((i * 3) % 5) / 10)))
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis', ...chart.tooltip },
      grid: { left: 8, right: 8, top: 18, bottom: 4, containLabel: true },
      xAxis: {
        type: 'category',
        data: days,
        axisLabel: AXIS_LABEL,
        axisLine: { lineStyle: { color: chart.grid } },
        axisTick: { show: false }
      },
      yAxis: { type: 'value', axisLabel: AXIS_LABEL, splitLine: SPLIT_LINE, axisLine: { show: false } },
      series: [
        {
          type: 'line',
          smooth: true,
          symbolSize: 5,
          data: series,
          lineStyle: { color: chart.blue, width: 2 },
          itemStyle: { color: chart.blue },
          areaStyle: { color: chart.blueSoft }
        }
      ]
    }
  }, [totalValue])

  const columns: ColumnsType<Item> = [
    { title: 'ID', dataIndex: 'id', width: 110 },
    { title: '名称', dataIndex: 'name' },
    { title: '分类', dataIndex: 'category', width: 110 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: Item['status']) =>
        v === 'active' ? <Tag tone="green">启用</Tag> : <Tag tone="gray">暂停</Tag>
    },
    {
      title: '指标值',
      dataIndex: 'value',
      width: 100,
      sorter: (a, b) => a.value - b.value,
      render: (v: number) => <b>{v}</b>
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 180,
      render: (v: string) => new Date(v).toLocaleString()
    }
  ]

  const exportRows = () => {
    downloadCsv(`示例数据_${fileStamp()}`, [
      ['ID', '名称', '分类', '状态', '指标值', '更新时间'],
      ...items.map((x) => [x.id, x.name, x.category, x.status, x.value, x.updatedAt])
    ])
    message.success('已导出 CSV')
  }

  const exportReport = async () => {
    const rows = items
      .map((x) => `<tr><td>${x.id}</td><td>${x.name}</td><td>${x.category}</td><td>${x.value}</td></tr>`)
      .join('')
    const html = buildSimpleReportHtml(
      '示例数据报告',
      `<table border="0" cellspacing="0" cellpadding="6" style="width:100%;font-size:11.5px">
        <thead><tr><th align="left">ID</th><th align="left">名称</th><th align="left">分类</th><th align="left">指标值</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`
    )
    const res = await exportPdf(`示例数据报告_${fileStamp()}`, html)
    if (res === 'saved') message.success('PDF 已保存')
    if (res === 'printed') message.info('已打开打印预览，可另存为 PDF')
  }

  return (
    <div className="ov-page">
      <div className="kpi-grid">
        <Kpi label="条目总数" value={total} hint="当前筛选条件下的记录数" />
        <Kpi label="本页启用" value={activeCount} hint="status=active" tone="green" />
        <Kpi label="本页指标合计" value={totalValue} hint="value 字段求和" tone="blue" />
        <Kpi label="数据来源" value={loading ? '加载中' : 'REST'} hint="后端不可用时自动降级示例数据" />
      </div>

      <div className="grid2" style={{ marginTop: 16 }}>
        <Panel title="类别指标分布" sub="按 category 汇总 value（示例）">
          <div style={{ height: 220 }}>
            <ReactECharts option={categoryOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </Panel>
        <Panel title="近 7 日趋势" sub="示例时序，替换为真实接口即可">
          <div style={{ height: 220 }}>
            <ReactECharts option={trendOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </Panel>
      </div>

      <Panel
        title="示例条目"
        sub="GET /api/items 分页查询"
        style={{ marginTop: 16 }}
        extra={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="搜索名称 / 分类"
              style={{ width: 200 }}
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value)
                setPage(1)
              }}
            />
            <Button icon={<ReloadOutlined />} onClick={() => void load()}>
              刷新
            </Button>
            <button type="button" className="btn btn-light btn-sm" onClick={exportRows}>
              <DownloadOutlined /> 导出表格
            </button>
            <button type="button" className="btn btn-dark btn-sm" onClick={() => void exportReport()}>
              <FilePdfOutlined /> 导出 PDF
            </button>
          </div>
        }
      >
        <StatStrip
          items={[
            { value: total, label: '记录总数' },
            { value: activeCount, label: '本页启用' },
            { value: items.length, label: '本页条数' }
          ]}
        />
        <Table
          rowKey="id"
          size="middle"
          style={{ marginTop: 12 }}
          loading={loading}
          columns={columns}
          dataSource={items}
          pagination={{
            current: page,
            pageSize: 8,
            total,
            showSizeChanger: false,
            onChange: setPage
          }}
        />
      </Panel>
    </div>
  )
}
