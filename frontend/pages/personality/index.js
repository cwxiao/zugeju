const { request, isAuthExpiredError } = require('../../utils/request')

const FINANCE_PERIODS = [
  { value: 'daily', label: '日' },
  { value: 'weekly', label: '周' },
  { value: 'monthly', label: '月' },
  { value: 'quarterly', label: '季' },
  { value: 'yearly', label: '年' }
]

Page({
  data: {
    report: null,
    heatmapVisible: false,
    financePeriods: FINANCE_PERIODS,
    financePeriod: 'monthly',
    currentFinanceBuckets: []
  },

  async onShow() {
    if (!getApp().hasLoginState()) {
      wx.showToast({ title: '请先确认登录', icon: 'none' })
      wx.redirectTo({ url: '/pages/home/index' })
      return
    }

    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage']
    })

    try {
      const report = await request({
        url: '/api/activities/mine/personality-report'
      })
      const mappedReport = mapReport(report)
      this.setData({
        report: mappedReport,
        currentFinanceBuckets: resolveFinanceBuckets(mappedReport.financeReport, this.data.financePeriod)
      })
    } catch (error) {
      if (isAuthExpiredError(error)) {
        wx.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
        wx.redirectTo({ url: '/pages/home/index' })
        return
      }

      wx.showToast({ title: '人格档案加载失败', icon: 'none' })
    }
  },

  onShareAppMessage() {
    const report = this.data.report || {}

    return {
      title: report.shareCallout || '来看看我的 AI 人格档案',
      path: '/pages/personality/index'
    }
  },

  goPoster() {
    wx.navigateTo({
      url: '/pages/personality-poster/index'
    })
  },

  toggleHeatmap() {
    this.setData({ heatmapVisible: !this.data.heatmapVisible })
  },

  selectFinancePeriod(event) {
    const financePeriod = event.currentTarget.dataset.value
    this.setData({
      financePeriod,
      currentFinanceBuckets: resolveFinanceBuckets(this.data.report.financeReport, financePeriod)
    })
  }
})

function mapReport(report) {
  const radarMetrics = (report.radarMetrics || []).map((item, index) => ({
    ...item,
    axisClass: `radar-axis-${index + 1}`,
    percentText: `${item.percent}%`
  }))

  return {
    ...report,
    radarMetrics,
    radarPolygon: buildRadarPolygon(radarMetrics),
    financeReport: report.financeReport || buildEmptyFinanceReport()
  }
}

function buildRadarPolygon(metrics) {
  if (!metrics.length) {
    return 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%, 50% 50%)'
  }

  const points = metrics.slice(0, 6).map((item, index) => {
    const angle = (-90 + index * 60) * Math.PI / 180
    const radius = 42 * Math.max(0, Math.min(item.percent, 100)) / 100
    const x = 50 + Math.cos(angle) * radius
    const y = 50 + Math.sin(angle) * radius
    return `${x.toFixed(1)}% ${y.toFixed(1)}%`
  })

  return `polygon(${points.join(', ')})`
}

function resolveFinanceBuckets(financeReport, period) {
  const buckets = financeReport && financeReport[period]
  return Array.isArray(buckets) ? buckets : []
}

function buildEmptyFinanceReport() {
  return {
    treatCount: 0,
    totalSpentText: '0.00 元',
    aaSpentText: '0.00 元',
    treatSpentText: '0.00 元',
    daily: [],
    weekly: [],
    monthly: [],
    quarterly: [],
    yearly: []
  }
}