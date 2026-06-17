const { request, isAuthExpiredError } = require('../../utils/request')
const cdn = require('../../utils/cdn')

const FINANCE_PERIODS = [
  { value: 'daily', label: '日' },
  { value: 'weekly', label: '周' },
  { value: 'monthly', label: '月' },
  { value: 'quarterly', label: '季' },
  { value: 'yearly', label: '年' }
]

Page({
  data: {
    cdnImg: cdn,
    report: null,
    heatmapVisible: false,
    financePeriods: FINANCE_PERIODS,
    financePeriod: 'monthly',
    currentFinanceBuckets: []
  },

  async onShow() {
    // 不再拦截未登录用户
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })

    try {
      // 未登录时不请求
      if (!getApp().hasLoginState()) {
        this.setData({ report: null })
        return
      }

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

      wx.showToast({ title: '活动分析加载失败', icon: 'none' })
    }
  },

  onShareAppMessage() {
    const report = this.data.report || {}

    return {
      title: report.shareCallout || '来看看我的活动分析',
      path: '/pages/personality/index'
    }
  },

  onShareTimeline() {
    const report = this.data.report || {}
    return {
      title: report.shareCallout || '来看看我的活动分析'
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

const ANIMAL_EMOJI_MAP = {
  '哈士奇': '🐕‍🦺',
  '金毛': '🐕',
  '猫': '🐱',
  '狼': '🐺'
}

const ANIMAL_TRAITS = {
  '哈士奇': ['社牛', '夜猫子', '气氛组'],
  '金毛': ['靠谱', '人脉广', '组局王'],
  '猫': ['佛系', '精准出击', '舒适区'],
  '狼': ['高效', '选局准', '执行力']
}

function mapReport(report) {
  const radarMetrics = (report.radarMetrics || []).map((item, index) => ({
    ...item,
    axisClass: `radar-axis-${index + 1}`,
    percentText: `${item.percent}%`
  }))

  const animalName = report.animalName || ''
  const animalEmoji = ANIMAL_EMOJI_MAP[animalName] || '🐾'
  const animalTraits = ANIMAL_TRAITS[animalName] || []

  return {
    ...report,
    animalEmoji,
    animalTraits,
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