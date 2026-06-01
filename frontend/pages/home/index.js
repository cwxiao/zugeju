const { request, isAuthExpiredError } = require('../../utils/request')
const { requestInitialSubscribePermission } = require('../../utils/subscribe')

Page({
  data: {
    ongoingItems: [],
    authVisible: false,
    authLoading: false,
    silentLoginTried: false,
    authNickname: '',
    authAvatarUrl: ''
  },

  async onShow() {
    const app = getApp()
    if (!app.hasLoginState()) {
      const profile = wx.getStorageSync('profile') || {}

      if (!this.data.silentLoginTried && hasCachedProfile(profile)) {
        this.setData({
          authVisible: false,
          authLoading: true,
          silentLoginTried: true,
          authNickname: profile.nickname || '',
          authAvatarUrl: profile.avatarUrl || ''
        })

        try {
          await app.loginWithConfirm({
            nickname: profile.nickname || '微信用户',
            avatarUrl: profile.avatarUrl || ''
          })
          this.setData({ authLoading: false })
          await this.loadActivities()
          return
        } catch (error) {
          this.setData({ authLoading: false })
        }
      }

      this.setData({
        authVisible: true,
        ongoingItems: [],
        authNickname: profile.nickname || '',
        authAvatarUrl: profile.avatarUrl || ''
      })
      return
    }

    this.setData({ authVisible: false })
    await this.loadActivities()
  },

  async loadActivities() {
    try {
      const list = await request({
        url: '/api/activities/mine/ongoing'
      })

      const ongoingItems = list.map((item) => ({
        id: item.id,
        tag: item.status === 'recruiting' ? '进行中' : '已确认',
        title: item.title,
        mode: item.mode === 'offline' ? '线下' : '线上',
        time: formatTime(item.startTime),
        place: item.venueAddress || '待补充',
        status: item.joinedCount < item.maxParticipantCount ? `还差 ${item.maxParticipantCount - item.joinedCount} 人` : '人已到齐',
        count: `${item.joinedCount} / ${item.maxParticipantCount}`,
        members: ['我']
      }))

      this.setData({ ongoingItems })
    } catch (error) {
      if (isAuthExpiredError(error)) {
        this.promptRelogin()
        return
      }

      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  handleNicknameInput(event) {
    this.setData({
      authNickname: event.detail.value
    })
  },

  handleChooseAvatar(event) {
    const { avatarUrl } = event.detail
    if (!avatarUrl) {
      return
    }

    this.setData({ authAvatarUrl: avatarUrl })
  },

  async confirmLogin() {
    this.setData({ authLoading: true })

    try {
      await requestInitialSubscribePermission()
      await getApp().loginWithConfirm({
        nickname: this.data.authNickname.trim() || '微信用户',
        avatarUrl: this.data.authAvatarUrl
      })
      this.setData({ authVisible: false, silentLoginTried: false })
      await this.loadActivities()
    } catch (error) {
      wx.showToast({
        title: isAuthExpiredError(error) ? '登录已失效，请重试' : '登录失败',
        icon: 'none'
      })
    } finally {
      this.setData({ authLoading: false })
    }
  },

  goCreate() {
    if (!getApp().hasLoginState()) {
      this.setData({ authVisible: true })
      return
    }

    wx.navigateTo({
      url: '/pages/create/index'
    })
  },

  goDetail(event) {
    if (!getApp().hasLoginState()) {
      this.setData({ authVisible: true })
      return
    }

    const { id } = event.currentTarget.dataset

    wx.navigateTo({
      url: `/pages/detail/index?id=${id}`
    })
  },

  goActivities() {
    if (!getApp().hasLoginState()) {
      this.setData({ authVisible: true })
      return
    }

    wx.navigateTo({
      url: '/pages/activities/index'
    })
  },

  goPersonality() {
    if (!getApp().hasLoginState()) {
      this.setData({ authVisible: true })
      return
    }

    wx.navigateTo({
      url: '/pages/personality/index'
    })
  },

  goBills() {
    if (!getApp().hasLoginState()) {
      this.setData({ authVisible: true })
      return
    }

    wx.navigateTo({
      url: '/pages/bills/index'
    })
  },

  promptRelogin() {
    const profile = wx.getStorageSync('profile') || {}
    this.setData({
      authVisible: true,
      authLoading: false,
      ongoingItems: [],
      silentLoginTried: false,
      authNickname: profile.nickname || '',
      authAvatarUrl: profile.avatarUrl || ''
    })
    wx.showToast({
      title: '登录已过期，请重新确认',
      icon: 'none'
    })
  }
})

function hasCachedProfile(profile) {
  return !!(profile && (profile.nickname || profile.avatarUrl))
}

function formatTime(value) {
  if (!value) {
    return '时间待定'
  }
  return value.replace('T', ' ').slice(0, 16)
}