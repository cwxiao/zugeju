const { request, isAuthExpiredError, getBaseUrl } = require('../../utils/request')
const { requestInitialSubscribePermission } = require('../../utils/subscribe')
const cdn = require('../../utils/cdn')

Page({
  data: {
    cdnImg: cdn,
    ongoingItems: [],
    loggedIn: false,
    authVisible: false,
    authLoading: false,
    silentLoginTried: false,
    authNickname: '',
    authAvatarUrl: '',
    pendingShowAuth: false,
    charging: false,
    canBrowse: true,  // 新增：允许浏览模式
    gameDrawerOpen: false
  },

  onLoad(options) {
    if (options && options.showAuth === '1') {
      this.setData({ pendingShowAuth: true })
    }
  },

  onShareAppMessage() {
    return {
      title: '来整 — 约人整活，一个按钮就搞定',
      path: '/pages/home/index'
    }
  },

  onShareTimeline() {
    return {
      title: '来整 — 约人整活，一个按钮就搞定'
    }
  },

  async onShow() {
    // 已登录的情况
    if (getApp().hasLoginState()) {
      this.setData({ loggedIn: true, authVisible: false })
      await this.loadActivities()
      this.consumePendingInvitePath()
      return
    }

    // 未登录：只设置 loggedIn: false，不弹授权框
    // 让用户先浏览，需要时再提示登录
    this.setData({
      loggedIn: false,
      authVisible: false,  // 绝对不自动弹授权框
      ongoingItems: [],
      silentLoginTried: true  // 标记已尝试，避免重复逻辑
    })
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

  handleChooseAvatar(event) {
    const { avatarUrl } = event.detail
    if (!avatarUrl) {
      return
    }

    this.setData({ authAvatarUrl: avatarUrl })
  },

  closeAuthDialog() {
    this.setData({ authVisible: false })
  },

  async confirmLogin() {
    this.setData({ authLoading: true })

    try {
      await requestInitialSubscribePermission()
      const loginData = await getApp().loginWithConfirm({
        nickname: '微信用户',
        avatarUrl: ''
      })

      // 登录成功后，如果选择了临时头像，上传到后端获取远程 URL
      const tmpAvatarUrl = this.data.authAvatarUrl
      if (tmpAvatarUrl && tmpAvatarUrl.startsWith('http://tmp')) {
        try {
          const uploadRes = await new Promise((resolve, reject) => {
            wx.uploadFile({
              url: getBaseUrl() + '/api/files/upload',
              filePath: tmpAvatarUrl,
              name: 'file',
              header: {
                'Authorization': 'Bearer ' + loginData.token
              },
              success: resolve,
              fail: reject
            })
          })

          const result = JSON.parse(uploadRes.data)
          if (result.data) {
            const remoteUrl = getBaseUrl() + result.data
            // 更新后端用户头像
            await request({
              url: '/api/users/avatar',
              method: 'PUT',
              data: { avatarUrl: remoteUrl }
            })
            // 更新本地存储
            const user = wx.getStorageSync('user') || {}
            user.avatarUrl = remoteUrl
            wx.setStorageSync('user', user)
            getApp().globalData.user = user
          }
        } catch (uploadErr) {
          console.error('头像上传失败', uploadErr)
          // 上传失败不影响登录流程
        }
      } else if (tmpAvatarUrl && tmpAvatarUrl.startsWith('http')) {
        // 已经是远程 URL（如微信头像），直接更新后端
        try {
          await request({
            url: '/api/users/avatar',
            method: 'PUT',
            data: { avatarUrl: tmpAvatarUrl }
          })
          const user = wx.getStorageSync('user') || {}
          user.avatarUrl = tmpAvatarUrl
          wx.setStorageSync('user', user)
          getApp().globalData.user = user
        } catch (e) {
          console.error('头像更新失败', e)
        }
      }

      this.setData({ authVisible: false, loggedIn: true, silentLoginTried: false })
      await this.loadActivities()
      this.consumePendingInvitePath()
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

  onChargeStart() {
    this.setData({ charging: true })
    wx.vibrateShort({ type: 'light' })
  },

  onChargeEnd() {
    if (!this.data.charging) {
      return
    }
    this.setData({ charging: false })
    wx.vibrateShort({ type: 'heavy' })
    this.goCreate()
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

  showAuth() {
    this.setData({ authVisible: true })
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
      loggedIn: false,
      ongoingItems: [],
      silentLoginTried: false,
      authNickname: profile.nickname || '',
      authAvatarUrl: profile.avatarUrl || ''
    })
    wx.showToast({
      title: '登录已过期，请重新确认',
      icon: 'none'
    })
  },

  consumePendingInvitePath() {
    const pendingPath = wx.getStorageSync('pendingInvitePath')
    if (!pendingPath) {
      return
    }

    wx.removeStorageSync('pendingInvitePath')
    wx.navigateTo({
      url: pendingPath
    })
  },

  toggleGameDrawer() {
    this.setData({ gameDrawerOpen: !this.data.gameDrawerOpen })
  },

  closeGameDrawer() {
    this.setData({ gameDrawerOpen: false })
  },

  goToXuantianzhen() {
    wx.navigateToMiniProgram({
      appId: 'wx0be195871454d924',
      path: '',
      envVersion: 'release',
      success: () => {
        this.setData({ gameDrawerOpen: false })
      },
      fail: (err) => {
        console.error('跳转旋天阵失败', err)
        wx.showToast({ title: '跳转失败，请稍后重试', icon: 'none' })
      }
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