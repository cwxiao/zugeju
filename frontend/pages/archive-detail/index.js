const { request, isAuthExpiredError } = require('../../utils/request')

Page({
  data: {
    activityId: '',
    loading: true,
    detail: null,
    bill: null
  },

  async onLoad(options) {
    if (!getApp().hasLoginState()) {
      wx.showToast({ title: '请先确认登录', icon: 'none' })
      wx.redirectTo({ url: '/pages/home/index' })
      return
    }

    const activityId = (options && options.id) || ''
    this.setData({ activityId })

    if (!activityId) {
      this.setData({ loading: false })
      wx.showToast({ title: '缺少活动', icon: 'none' })
      return
    }

    await this.loadArchiveDetail()
  },

  onShareAppMessage() {
    return {
      title: '来整 — 活动档案',
      path: '/pages/home/index'
    }
  },

  async loadArchiveDetail() {
    try {
      const [detail, bill] = await Promise.all([
        request({ url: `/api/activities/${this.data.activityId}` }),
        request({ url: `/api/activities/${this.data.activityId}/expenses/summary` })
      ])

      this.setData({
        detail: mapDetail(detail),
        bill: mapBill(bill),
        loading: false
      })
    } catch (error) {
      if (isAuthExpiredError(error)) {
        wx.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
        wx.redirectTo({ url: '/pages/home/index' })
        return
      }

      this.setData({ loading: false })
      wx.showToast({ title: '档案详情加载失败', icon: 'none' })
    }
  },

  goBills() {
    wx.navigateTo({
      url: `/pages/bills/index?id=${this.data.activityId}`
    })
  },

  openNavigation() {
    const detail = this.data.detail
    if (!detail || !detail.latitude || !detail.longitude) {
      wx.showToast({ title: '没有位置信息，无法导航', icon: 'none' })
      return
    }
    wx.openLocation({
      latitude: detail.latitude,
      longitude: detail.longitude,
      name: detail.placeText || '',
      address: detail.placeText || '',
      scale: 16
    })
  }
})

function mapDetail(detail) {
  return {
    ...detail,
    statusLabel: resolveStatusLabel(detail.status),
    modeLabel: detail.mode === 'offline' ? '线下' : '线上',
    expenseModeLabel: resolveExpenseModeLabel(detail.expenseMode),
    timeText: formatTime(detail.startTime),
    placeText: detail.mode === 'offline'
      ? (detail.venueAddress || detail.meetupAddress || '待补充')
      : '线上活动',
    latitude: detail.latitude || null,
    longitude: detail.longitude || null,
    memberCountText: `${detail.joinedCount} / ${detail.maxParticipantCount}`,
    members: (detail.members || []).map((member) => ({
      ...member,
      roleLabel: member.role === 'creator' ? '发起人' : '成员',
      shortName: (member.nickname || '友').slice(0, 1)
    }))
  }
}

function mapBill(bill) {
  const participantCount = Math.max(bill.joinedCount || 0, 1)
  const expenseItems = (bill.expenseItems || []).map((item) => ({
    ...item,
    amountText: formatFen(item.amountFen)
  }))
  const settlementItems = (bill.settlementItems || []).map((item) => ({
    ...item,
    roleLabel: item.role === 'creator' ? '发起人' : '成员',
    amountText: item.amountFen > 0 ? formatFen(item.amountFen) : '不用转'
  }))

  return {
    ...bill,
    totalAmountText: formatFen(bill.totalAmountFen),
    perHeadAmountText: formatFen(Math.round(bill.totalAmountFen / participantCount)),
    expenseModeLabel: resolveExpenseModeLabel(bill.expenseMode),
    recordCount: expenseItems.length,
    expenseItems,
    settlementItems
  }
}

function resolveStatusLabel(status) {
  if (status === 'finished') {
    return '已结束'
  }
  if (status === 'cancelled') {
    return '已取消'
  }
  return '进行中'
}

function resolveExpenseModeLabel(expenseMode) {
  if (expenseMode === 'host_treat') {
    return '我请客'
  }
  if (expenseMode === 'aa') {
    return 'AA'
  }
  return '无需结算'
}

function formatTime(value) {
  if (!value) {
    return '时间待定'
  }
  return value.replace('T', ' ').slice(0, 16)
}

function formatFen(amountFen) {
  return `${((amountFen || 0) / 100).toFixed(2)} 元`
}