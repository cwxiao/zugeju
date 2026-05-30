const { request, isAuthExpiredError } = require('../../utils/request')

Page({
  data: {
    detail: {
      id: '',
      title: '详情',
      tag: '',
      rawStatus: '',
      time: '',
      mode: '',
      place: '',
      expenseModeLabel: '',
      status: '',
      count: '',
      isCreator: false,
      members: []
    }
  },

  async onLoad(options) {
    if (!getApp().hasLoginState()) {
      wx.showToast({
        title: '请先确认登录',
        icon: 'none'
      })
      wx.redirectTo({
        url: '/pages/home/index'
      })
      return
    }

    try {
      const localUser = wx.getStorageSync('user') || {}
      const detail = await request({
        url: `/api/activities/${options.id}`
      })

      wx.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage']
      })

      const isCreator = (detail.members || []).some((member) => member.userId === localUser.id && member.role === 'creator')

      this.setData({
        detail: {
          id: detail.id,
          title: detail.title,
          tag: resolveActivityTag(detail.status),
          rawStatus: detail.status,
          time: formatTime(detail.startTime),
          mode: detail.mode === 'offline' ? '线下' : '线上',
          place: detail.mode === 'offline'
            ? (detail.venueAddress || detail.meetupAddress || '待补充')
            : '线上无需地点',
          expenseModeLabel: resolveExpenseModeLabel(detail.expenseMode),
          status: resolveActivityStatusText(detail.status, detail.joinedCount, detail.maxParticipantCount),
          count: `${detail.joinedCount} / ${detail.maxParticipantCount}`,
          isCreator,
          members: (detail.members || []).map((member) => ({
            id: member.userId,
            nickname: member.nickname || '友',
            shortName: (member.nickname || '友').slice(0, 1),
            avatarUrl: member.avatarUrl || (member.userId === localUser.id ? (localUser.avatarUrl || '') : '')
          }))
        }
      })
    } catch (error) {
      if (isAuthExpiredError(error)) {
        wx.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
        wx.redirectTo({ url: '/pages/home/index' })
        return
      }

      wx.showToast({
        title: '详情加载失败',
        icon: 'none'
      })
    }
  },

  onShareAppMessage() {
    const { detail } = this.data
    return {
      title: `${detail.title}，来整一下`,
      path: `/pages/detail/index?id=${detail.id}`
    }
  },

  goEdit() {
    wx.navigateTo({
      url: `/pages/create/index?id=${this.data.detail.id}`
    })
  },

  goBills() {
    wx.navigateTo({
      url: `/pages/bills/index?id=${this.data.detail.id}`
    })
  },

  cancelActivity() {
    wx.showModal({
      title: '取消活动',
      content: '确定不组了吗？取消后首页就不会再显示这条活动。',
      confirmText: '确认取消',
      success: async (res) => {
        if (!res.confirm) {
          return
        }

        try {
          await request({
            url: `/api/activities/${this.data.detail.id}/cancel`,
            method: 'POST'
          })
          wx.showToast({ title: '已取消', icon: 'success' })
          wx.redirectTo({
            url: '/pages/home/index'
          })
        } catch (error) {
          if (isAuthExpiredError(error)) {
            wx.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
            wx.redirectTo({ url: '/pages/home/index' })
            return
          }

          wx.showToast({
            title: '取消失败',
            icon: 'none'
          })
        }
      }
    })
  }
})

function formatTime(value) {
  if (!value) {
    return '时间待定'
  }
  return value.replace('T', ' ').slice(0, 16)
}

function resolveActivityTag(status) {
  if (status === 'finished') {
    return '已结束'
  }
  if (status === 'cancelled') {
    return '已取消'
  }
  return status === 'recruiting' ? '进行中' : '已确认'
}

function resolveExpenseModeLabel(expenseMode) {
  if (expenseMode === 'host_treat') {
    return '我请客'
  }
  if (expenseMode === 'aa') {
    return 'AA'
  }
  return ''
}

function resolveActivityStatusText(status, joinedCount, maxParticipantCount) {
  if (status === 'finished') {
    return '这场已经结束，可以直接看结算。'
  }
  if (status === 'cancelled') {
    return '这场已经取消。'
  }
  return joinedCount < maxParticipantCount ? `还差 ${maxParticipantCount - joinedCount} 人` : '人已到齐'
}
