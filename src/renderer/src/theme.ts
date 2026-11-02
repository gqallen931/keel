import type { ThemeConfig } from 'antd'

/**
 * 设计令牌唯一来源：styles.css 的 :root 变量与此保持一致。
 * 新增/调整令牌必须两处同步。
 */
export const tokens = {
  bg: '#f5f5f4',
  side: '#fbfbfa',
  panel: '#ffffff',
  ink: '#171717',
  ink2: '#5c5c5a',
  ink3: '#9a9a97',
  ink4: '#b8b8b4',
  line: '#ececea',
  line2: '#e2e2df',
  fill: '#f3f3f2',
  fill2: '#ebebea',
  blue: '#2f7ff0',
  blueSoft: '#e8f1fe',
  blueInk: '#1f63c7',
  red: '#e5483b',
  redSoft: '#fdecea',
  redInk: '#c23a2e',
  amber: '#e89a0c',
  amberSoft: '#fdf3df',
  amberInk: '#a86c00',
  green: '#1d9a57',
  greenSoft: '#e6f5ec',
  greenInk: '#167a45',
  tagBg: '#f8eee8',
  tagInk: '#ad5136',
  rowHover: '#fafaf9',
  hoverSoft: '#f1f1ef',
  navOn: '#ececea',
  sign: '#c2c2bf',
  rXl: 20,
  rLg: 16,
  rMd: 12,
  rSm: 8,
  sideW: 216,
  railW: 300,
  titlebarH: 44,
  shadowCard: '0 12px 40px rgba(0, 0, 0, .075), 0 2px 6px rgba(0, 0, 0, .04)',
  shadowPop: '0 18px 60px rgba(0, 0, 0, .12), 0 3px 10px rgba(0, 0, 0, .05)'
}

export const fontStack =
  '"PingFang SC", "HarmonyOS Sans SC", "MiSans", "Microsoft YaHei UI", "Microsoft YaHei", "Noto Sans CJK SC", "Source Han Sans SC", system-ui, sans-serif'

export const appTheme: ThemeConfig = {
  token: {
    colorPrimary: tokens.blue,
    colorInfo: tokens.blue,
    colorSuccess: tokens.green,
    colorWarning: tokens.amber,
    colorError: tokens.red,
    colorBgBase: tokens.bg,
    colorBgLayout: tokens.bg,
    colorBgContainer: tokens.panel,
    colorBgElevated: tokens.panel,
    colorText: tokens.ink,
    colorTextSecondary: tokens.ink2,
    colorTextTertiary: tokens.ink3,
    colorTextQuaternary: tokens.ink4,
    colorBorder: tokens.line2,
    colorBorderSecondary: tokens.line,
    colorSplit: tokens.line,
    fontFamily: fontStack,
    fontSize: 14,
    borderRadius: tokens.rMd,
    borderRadiusLG: tokens.rLg,
    borderRadiusSM: tokens.rSm,
    controlHeight: 34,
    boxShadow: tokens.shadowCard,
    boxShadowSecondary: tokens.shadowPop
  },
  components: {
    Menu: {
      itemBg: 'transparent',
      itemColor: tokens.ink2,
      itemHoverBg: tokens.fill,
      itemSelectedBg: tokens.blueSoft,
      itemSelectedColor: tokens.blue,
      itemHeight: 40,
      itemBorderRadius: 10,
      itemMarginInline: 8,
      iconSize: 16,
      fontSize: 14
    },
    Table: {
      headerBg: tokens.panel,
      headerColor: tokens.ink3,
      borderColor: tokens.line,
      rowHoverBg: tokens.rowHover,
      headerSplitColor: 'transparent',
      cellPaddingBlock: 8,
      cellPaddingInline: 12
    },
    Button: {
      controlHeight: 34,
      borderRadius: 999,
      borderRadiusSM: 999,
      borderRadiusLG: 999,
      fontWeight: 500,
      primaryShadow: 'none',
      defaultShadow: 'none',
      defaultBg: tokens.panel,
      defaultBorderColor: tokens.line2
    },
    Input: {
      controlHeight: 38,
      borderRadius: 9,
      colorBgContainer: tokens.fill,
      hoverBg: tokens.fill2,
      activeBg: tokens.panel,
      activeBorderColor: tokens.ink,
      hoverBorderColor: 'transparent',
      activeShadow: 'none'
    },
    Select: { controlHeight: 38, borderRadius: 9, optionSelectedBg: tokens.blueSoft },
    Tag: { defaultBg: tokens.tagBg, defaultColor: tokens.tagInk },
    Switch: { colorPrimary: tokens.ink },
    Modal: {
      borderRadiusLG: 18,
      contentBg: tokens.panel,
      headerBg: tokens.panel,
      titleFontSize: 16,
      titleColor: tokens.ink
    }
  }
}

/** ECharts 统一浅色主题片段 */
export const chart = {
  text: tokens.ink3,
  textStrong: tokens.ink2,
  grid: tokens.line,
  blue: tokens.blue,
  blueSoft: 'rgba(47,127,240,0.18)',
  amber: tokens.amber,
  green: tokens.green,
  red: tokens.red,
  tooltip: {
    backgroundColor: tokens.panel,
    borderWidth: 0,
    textStyle: { color: tokens.ink, fontSize: 12 },
    extraCssText: `box-shadow: ${tokens.shadowPop}; border-radius: 12px; padding: 8px 10px;`
  }
}
