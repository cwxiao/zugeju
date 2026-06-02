const { request, isAuthExpiredError } = require('../../utils/request')
const { requestInitialSubscribePermission } = require('../../utils/subscribe')

const MEMBER_REFRESH_INTERVAL = 10000

Page({
  data: {
    loading: false,
    joining: false,
    inviteSource: '',
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
      canJoin: false,
      currentUserJoined: false,
      members: []
    }
  },
  refreshTimer: null,

  async onLoad(options) {
    const activityId = options.id || ''
    const inviteSource = options.source || ''

    if (!activityId) {
      wx.showToast({ title: '活动不存在', icon: 'none' })
      return
    }

    this.setData({ inviteSource })
    await this.loadDetail(activityId)
    if (getApp().hasLoginState()) {
      this.startMemberRefresh()
    }
  },

  onShow() {
    if (this.data.detail.id && getApp().hasLoginState()) {
      this.startMemberRefresh()
    }
  },

  onHide() {
    this.stopMemberRefresh()
  },

  onUnload() {
    this.stopMemberRefresh()
  },

  async loadDetail(activityId, silent = false) {
    if (!activityId) {
      wx.showToast({ title: '活动不存在', icon: 'none' })
      return
    }

    if (!silent) {
      this.setData({ loading: true })
    }

    try {
      const hasLogin = getApp().hasLoginState()
      const localUser = hasLogin ? (wx.getStorageSync('user') || {}) : {}
      const detail = await request({
        url: `/api/activities/${activityId}`,
        auth: hasLogin
      })

      wx.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage']
      })

      const isCreator = detail.currentUserCreator || (detail.members || []).some((member) => member.userId === localUser.id && member.role === 'creator')

      const showJoinButton = hasLogin
        ? detail.canJoin
        : (detail.status === 'recruiting' && detail.joinedCount < detail.maxParticipantCount)

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
          canJoin: showJoinButton,
          currentUserJoined: detail.currentUserJoined,
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
    } finally {
      if (!silent) {
        this.setData({ loading: false })
      }
    }
  },

  onShareAppMessage() {
    const { detail } = this.data
    return {
      title: `${detail.title}，来整一下`,
      path: `/pages/detail/index?id=${detail.id}&source=invite`
    }
  },

  async acceptInvite() {
    if (!this.data.detail.id || this.data.joining) {
      return
    }

    if (!getApp().hasLoginState()) {
      const activityId = this.data.detail.id
      const inviteSource = this.data.inviteSource
      wx.setStorageSync('pendingInvitePath', `/pages/detail/index?id=${activityId}&source=${inviteSource || 'invite'}`)
      wx.showToast({ title: '请先登录后再加入', icon: 'none' })
      wx.navigateTo({ url: '/pages/home/index?showAuth=1' })
      return
    }

    this.setData({ joining: true })
    try {
      await requestInitialSubscribePermission()
      await request({
        url: `/api/activities/${this.data.detail.id}/join`,
        method: 'POST'
      })
      wx.showToast({ title: '已加入', icon: 'success' })
      await this.loadDetail(this.data.detail.id, true)
    } catch (error) {
      if (isAuthExpiredError(error)) {
        wx.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
        wx.redirectTo({ url: '/pages/home/index' })
        return
      }

      wx.showToast({ title: error.message || '加入失败', icon: 'none' })
    } finally {
      this.setData({ joining: false })
    }
  },

  async declineInvite() {
    if (!this.data.detail.id) {
      return
    }

    try {
      await request({
        url: `/api/activities/${this.data.detail.id}/decline`,
        method: 'POST'
      })
    } catch (error) {
      if (isAuthExpiredError(error)) {
        wx.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
        wx.redirectTo({ url: '/pages/home/index' })
        return
      }
    }

    wx.showToast({ title: '已婉拒', icon: 'none' })
    wx.redirectTo({ url: '/pages/home/index' })
  },

  startMemberRefresh() {
    this.stopMemberRefresh()
    this.refreshTimer = setInterval(() => {
      const activityId = this.data.detail.id
      if (activityId) {
        this.loadDetail(activityId, true)
      }
    }, MEMBER_REFRESH_INTERVAL)
  },

  stopMemberRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = null
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
