const { request, isAuthExpiredError } = require('../../utils/request')

Page({
  data: {
    report: null
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
      this.setData({ report })
    } catch (error) {
      if (isAuthExpiredError(error)) {
        wx.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
        wx.redirectTo({ url: '/pages/home/index' })
        return
      }

      wx.showToast({ title: '海报加载失败', icon: 'none' })
    }
  },

  onShareAppMessage() {
    const report = this.data.report || {}

    return {
      title: report.shareCallout || '来看看我的 AI 人格海报',
      path: '/pages/personality-poster/index'
    }
  }
})