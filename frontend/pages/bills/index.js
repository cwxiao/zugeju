const { request, isAuthExpiredError } = require('../../utils/request')

Page({
  data: {
    activityId: '',
    loading: true,
    itemName: '',
    amountYuan: '',
    summary: null
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
      return
    }

    await this.loadSummary()
  },

  async loadSummary() {
    try {
      const summary = await request({
        url: `/api/activities/${this.data.activityId}/expenses/summary`
      })
      this.setData({
        summary: mapSummary(summary),
        loading: false
      })
    } catch (error) {
      if (isAuthExpiredError(error)) {
        wx.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
        wx.redirectTo({ url: '/pages/home/index' })
        return
      }

      this.setData({ loading: false })
      wx.showToast({ title: '账单加载失败', icon: 'none' })
    }
  },

  onItemNameInput(event) {
    this.setData({ itemName: event.detail.value })
  },

  onAmountInput(event) {
    this.setData({ amountYuan: event.detail.value })
  },

  async submitExpense() {
    const itemName = this.data.itemName.trim()
    const amountFen = parseAmountToFen(this.data.amountYuan)

    if (!itemName) {
      wx.showToast({ title: '先写消费事项', icon: 'none' })
      return
    }
    if (!amountFen) {
      wx.showToast({ title: '金额填对一点', icon: 'none' })
      return
    }

    try {
      const summary = await request({
        url: `/api/activities/${this.data.activityId}/expenses`,
        method: 'POST',
        data: {
          itemName,
          amountFen
        }
      })
      this.setData({
        itemName: '',
        amountYuan: '',
        summary: mapSummary(summary)
      })
      wx.showToast({ title: '已记一笔', icon: 'success' })
    } catch (error) {
      if (isAuthExpiredError(error)) {
        wx.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
        wx.redirectTo({ url: '/pages/home/index' })
        return
      }

      wx.showToast({ title: '记账失败', icon: 'none' })
    }
  },

  finishActivity() {
    wx.showModal({
      title: '结束活动',
      content: '结束后会按当前到场人数计算每个人该转多少钱。',
      confirmText: '确认结束',
      success: async (res) => {
        if (!res.confirm) {
          return
        }

        try {
          const summary = await request({
            url: `/api/activities/${this.data.activityId}/finish`,
            method: 'POST'
          })
          this.setData({ summary: mapSummary(summary) })
          wx.showToast({ title: '活动已结束', icon: 'success' })
        } catch (error) {
          if (isAuthExpiredError(error)) {
            wx.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
            wx.redirectTo({ url: '/pages/home/index' })
            return
          }

          wx.showToast({ title: '结束失败', icon: 'none' })
        }
      }
    })
  }
})

function mapSummary(summary) {
  return {
    ...summary,
    expenseModeLabel: resolveExpenseModeLabel(summary.expenseMode),
    totalAmountText: formatFen(summary.totalAmountFen),
    expenseItems: (summary.expenseItems || []).map((item) => ({
      ...item,
      amountText: formatFen(item.amountFen)
    })),
    settlementItems: (summary.settlementItems || []).map((item) => ({
      ...item,
      amountText: item.amountFen > 0 ? formatFen(item.amountFen) : '不用转',
      roleLabel: item.role === 'creator' ? '发起人' : '成员'
    }))
  }
}

function formatFen(amountFen) {
  return `${(amountFen / 100).toFixed(2)} 元`
}

function parseAmountToFen(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount <= 0) {
    return 0
  }
  return Math.round(amount * 100)
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