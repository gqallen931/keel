/** 通用导出工具：CSV 下载、HTML 打印 / PDF 保存（Electron 优先，浏览器降级打印） */

/** 文件名时间戳：20261102_1530 */
export function fileStamp(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`
}

/** 下载 CSV（UTF-8 BOM，Excel 可直接打开；自动转义逗号/引号/换行） */
export function downloadCsv(
  filename: string,
  rows: Array<Array<string | number | null | undefined>>
): void {
  const body = rows
    .map((row) =>
      row
        .map((cell) => {
          const text = cell == null ? '' : String(cell)
          return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
        })
        .join(',')
    )
    .join('\r\n')
  const blob = new Blob([`\uFEFF${body}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * 导出 HTML 为 PDF：
 * - Electron：主进程 printToPDF 后弹出保存对话框
 * - 浏览器：打开打印预览，由用户选择「另存为 PDF」
 */
export async function exportPdf(
  filename: string,
  html: string
): Promise<'saved' | 'canceled' | 'printed'> {
  const bridge = typeof window !== 'undefined' ? window.desktop?.report : undefined
  if (bridge) {
    const res = await bridge.savePdf({ filename, html })
    return res?.ok ? 'saved' : 'canceled'
  }

  const frame = document.createElement('iframe')
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;'
  document.body.appendChild(frame)
  const doc = frame.contentWindow?.document
  if (!doc) {
    frame.remove()
    return 'canceled'
  }
  doc.open()
  doc.write(html)
  doc.close()
  await new Promise((r) => window.setTimeout(r, 400))
  frame.contentWindow?.focus()
  frame.contentWindow?.print()
  window.setTimeout(() => frame.remove(), 5000)
  return 'printed'
}

/** 最小可用 HTML 模板：标题 + 内容 + 页脚，可直接交给 exportPdf */
export function buildSimpleReportHtml(title: string, bodyHtml: string): string {
  const time = new Date().toLocaleString()
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8" />
<style>
  @page { size: A4; margin: 14mm; }
  body { margin: 0; color: #171717; font-size: 12px;
    font-family: "PingFang SC", "Microsoft YaHei", sans-serif; }
  h1 { font-size: 20px; margin: 0 0 6px; }
  .meta { color: #9a9a97; font-size: 11px; margin-bottom: 16px; }
  footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #ececea;
    color: #b8b8b4; font-size: 10.5px; }
</style></head><body>
  <h1>${title}</h1>
  <div class="meta">生成时间：${time}</div>
  ${bodyHtml}
  <footer>Desktop Framework · 示例报告</footer>
</body></html>`
}
