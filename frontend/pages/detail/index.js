const { request, isAuthExpiredError, getBaseUrl } = require('../../utils/request')
const { requestInitialSubscribePermission } = require('../../utils/subscribe')
const cdn = require('../../utils/cdn')

const MEMBER_REFRESH_INTERVAL = 10000

/** 确保头像URL是完整可访问地址 */
function resolveAvatarUrl(avatarUrl) {
  if (!avatarUrl) return ''
  if (avatarUrl.startsWith('http://tmp') || avatarUrl.startsWith('wxfile://')) return ''
  if (avatarUrl.startsWith('http')) return avatarUrl
  // 相对路径（如 /uploads/avatars/xxx.png）拼接域名
  return getBaseUrl() + avatarUrl
}

const REACTION_OPTIONS = [
  { emoji: '🔥', label: '冲！' },
  { emoji: '😋', label: '馋了' },
  { emoji: '🎮', label: '开干' },
  { emoji: '😂', label: '哈哈' },
  { emoji: '💤', label: '再看看' }
]

Page({
  data: {
    cdnImg: cdn,
    loading: false,
    joining: false,
    inviteSource: '',
    reactions: [],
    floatingReactions: [],
    // 内联登录弹窗状态
    authVisible: false,
    authLoading: false,
    authNickname: '',
    authAvatarUrl: '',
    detail: {
      id: '',
      title: '详情',
      tag: '',
      rawStatus: '',
      time: '',
      mode: '',
      place: '',
      placeName: '',
      latitude: null,
      longitude: null,
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

  autoAccept: false, // 页面级变量：是否需要自动接受邀请

  async onLoad(options) {
    const activityId = options.id || ''
    const inviteSource = options.source || ''

    if (!activityId) {
      wx.showToast({ title: '活动不存在', icon: 'none' })
      return
    }

    // 记录 autoAccept 标记（来自登录后跳回的 URL 参数）
    this.autoAccept = (options.autoAccept === '1')

    this.setData({ inviteSource, reactions: loadReactions(activityId) })
    await this.loadDetail(activityId)
    if (getApp().hasLoginState()) {
      this.startMemberRefresh()
    }

    // loadDetail 完成后再检查是否需要自动接受
    if (this.autoAccept && getApp().hasLoginState()) {
      this.autoAccept = false // 用完即丢
      // 还没加入才自动接受
      if (!this.data.detail.currentUserJoined) {
        this.acceptInvite()
      }
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
        menus: ['shareAppMessage', 'shareTimeline']
      })

      const isCreator = detail.currentUserCreator || (hasLogin && (detail.members || []).some((member) => member.userId === localUser.id && member.role === 'creator'))

      // canJoin 判断：优先用后端返回值，未登录时用前端兜底（招募中+未满+未加入+非创建者+非结束）
      const rawStatus = detail.status
      const notJoined = !detail.currentUserJoined
      const notFull = detail.joinedCount < detail.maxParticipantCount
      const isRecruiting = rawStatus === 'recruiting'
      const isActive = rawStatus !== 'finished' && rawStatus !== 'cancelled'
      const showJoinButton = hasLogin
        ? !!detail.canJoin
        : (isActive && isRecruiting && notFull && notJoined && !isCreator)

      const mappedMembers = (detail.members || []).map((member) => {
        const colors = generateAvatarColors(member.userId)
        const resolvedAvatar = resolveAvatarUrl(member.avatarUrl) || (member.userId === localUser.id ? resolveAvatarUrl(localUser.avatarUrl) : '')
        return {
          id: member.userId,
          nickname: member.nickname || '友',
          shortName: (member.nickname || '友').slice(0, 1),
          avatarUrl: resolvedAvatar,
          avatarBg: colors.bg,
          avatarFg: colors.fg,
          avatarError: false
        }
      })

      // 调试：打印第一个成员的 avatarUrl，帮助排查头像问题
      if (mappedMembers.length > 0) {
        console.log('[头像调试] 成员头像URL:', mappedMembers.map(m => ({ nickname: m.nickname, avatarUrl: m.avatarUrl ? '有' : '无' })))
      }

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
          placeName: detail.mode === 'offline'
            ? (detail.venueAddress || detail.meetupAddress || '待补充')
            : '',
          latitude: detail.latitude || null,
          longitude: detail.longitude || null,
          expenseModeLabel: resolveExpenseModeLabel(detail.expenseMode),
          status: resolveActivityStatusText(detail.status, detail.joinedCount, detail.maxParticipantCount),
          count: `${detail.joinedCount} / ${detail.maxParticipantCount}`,
          isCreator,
          canJoin: showJoinButton,
          currentUserJoined: detail.currentUserJoined,
          members: mappedMembers
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

  onShareTimeline() {
    const { detail } = this.data
    return {
      title: `${detail.title}，来整一下`,
      query: `id=${detail.id}&source=invite`
    }
  },

  async acceptInvite() {
    if (!this.data.detail.id || this.data.joining) {
      return
    }

    if (!getApp().hasLoginState()) {
      // 直接在详情页弹出内联登录框，不再跳首页
      const profile = wx.getStorageSync('profile') || {}
      const savedUser = wx.getStorageSync('user') || {}
      const cachedNickname = profile.nickname || (savedUser.nickname && savedUser.nickname !== '微信用户' ? savedUser.nickname : '')
      this.setData({
        authVisible: true,
        authNickname: cachedNickname,
        authAvatarUrl: profile.avatarUrl || ''
      })
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
      this.startMemberRefresh()
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

  // ===== 内联登录弹窗方法 =====

  handleChooseAvatar(event) {
    const { avatarUrl } = event.detail
    if (!avatarUrl) {
      return
    }
    this.setData({ authAvatarUrl: avatarUrl })
  },

  onNicknameBlur(event) {
    const nickname = (event.detail.value || '').trim()
    if (nickname) {
      this.setData({ authNickname: nickname })
    }
  },

  onNicknameConfirm(event) {
    const nickname = (event.detail.value || '').trim()
    if (nickname) {
      this.setData({ authNickname: nickname })
    }
  },

  closeAuthDialog() {
    this.setData({ authVisible: false })
  },

  async confirmLoginAndJoin() {
    this.setData({ authLoading: true })

    try {
      const userNickname = (this.data.authNickname || '').trim() || '微信用户'
      const loginData = await getApp().loginWithConfirm({
        nickname: userNickname,
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
            const remoteUrl = result.data.startsWith('http') ? result.data : (getBaseUrl() + result.data)
            await request({
              url: '/api/users/avatar',
              method: 'PUT',
              data: { avatarUrl: remoteUrl }
            })
            const user = wx.getStorageSync('user') || {}
            user.avatarUrl = remoteUrl
            wx.setStorageSync('user', user)
            getApp().globalData.user = user
          }
        } catch (uploadErr) {
          console.error('头像上传失败', uploadErr)
        }
      } else if (tmpAvatarUrl && tmpAvatarUrl.startsWith('http')) {
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

      // 登录成功，关闭弹窗
      this.setData({ authVisible: false, authLoading: false })

      // 刷新详情数据（登录后可以获取更完整的成员信息）
      await this.loadDetail(this.data.detail.id, true)
      this.startMemberRefresh()

      // 登录后自动接受邀请
      if (!this.data.detail.currentUserJoined) {
        this.acceptInvite()
      }
    } catch (error) {
      this.setData({ authLoading: false })
      wx.showToast({
        title: isAuthExpiredError(error) ? '登录已失效，请重试' : '登录失败',
        icon: 'none'
      })
    }
  },

  // ===== 邀请操作方法 =====

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

  quitActivity() {
    wx.showModal({
      title: '退出活动',
      content: '确定退出这场活动吗？退出后就不会出现在成员列表里了。',
      confirmText: '确认退出',
      success: async (res) => {
        if (!res.confirm) {
          return
        }

        try {
          await request({
            url: `/api/activities/${this.data.detail.id}/decline`,
            method: 'POST'
          })
          wx.showToast({ title: '已退出', icon: 'success' })
          wx.redirectTo({ url: '/pages/home/index' })
        } catch (error) {
          if (isAuthExpiredError(error)) {
            wx.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
            wx.redirectTo({ url: '/pages/home/index' })
            return
          }

          wx.showToast({ title: '退出失败', icon: 'none' })
        }
      }
    })
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

  openNavigation() {
    const { latitude, longitude, placeName } = this.data.detail
    if (!latitude || !longitude) {
      wx.showToast({ title: '没有位置信息，无法导航', icon: 'none' })
      return
    }
    wx.openLocation({
      latitude,
      longitude,
      name: placeName || '',
      address: placeName || '',
      scale: 16
    })
  },

  sendReaction(event) {
    const { emoji, label } = event.currentTarget.dataset
    const activityId = this.data.detail.id
    if (!activityId) {
      return
    }

    const reactions = this.data.reactions.map((item) => {
      if (item.emoji === emoji) {
        return { ...item, count: item.count + 1 }
      }
      return item
    })

    const floatId = Date.now() + Math.random()
    const floatingReactions = [
      ...this.data.floatingReactions,
      { id: floatId, emoji, label, left: 20 + Math.random() * 60, delay: 0 }
    ]

    this.setData({ reactions, floatingReactions })
    saveReactions(activityId, reactions)
    wx.vibrateShort({ type: 'light' })

    setTimeout(() => {
      this.setData({
        floatingReactions: this.data.floatingReactions.filter((item) => item.id !== floatId)
      })
    }, 1200)
  },

  onAvatarError(event) {
    const index = event.currentTarget.dataset.index
    const members = this.data.detail.members
    if (members && members[index]) {
      this.setData({
        [`detail.members[${index}].avatarError`]: true
      })
    }
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

function loadReactions(activityId) {
  const stored = wx.getStorageSync(`reactions_${activityId}`)
  if (stored && Array.isArray(stored)) {
    return REACTION_OPTIONS.map((opt) => {
      const found = stored.find((item) => item.emoji === opt.emoji)
      return { ...opt, count: found ? found.count : 0 }
    })
  }
  return REACTION_OPTIONS.map((opt) => ({ ...opt, count: 0 }))
}

function saveReactions(activityId, reactions) {
  wx.setStorageSync(`reactions_${activityId}`, reactions)
}

function generateAvatarColors(userId) {
  if (!userId) {
    return { bg: '#e8d2b8', fg: '#5d4127' }
  }
  const palettes = [
    { bg: '#FFD6A5', fg: '#8B5E28' },
    { bg: '#A0C4FF', fg: '#1D4E89' },
    { bg: '#B9FBC0', fg: '#1B5E20' },
    { bg: '#FFC6FF', fg: '#6A1B9A' },
    { bg: '#FDFFB6', fg: '#827717' },
    { bg: '#CAFFBF', fg: '#2E7D32' },
    { bg: '#9BF6FF', fg: '#006064' },
    { bg: '#A0C4FF', fg: '#0D47A1' },
    { bg: '#BDB2FF', fg: '#311B92' },
    { bg: '#FFC6FF', fg: '#880E4F' },
    { bg: '#FFADAD', fg: '#B71C1C' },
    { bg: '#FFD6A5', fg: '#E65100' }
  ]
  let hash = 0
  const str = String(userId)
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % palettes.length
  return palettes[index]
}
