const { request, isAuthExpiredError } = require('../../utils/request')
const { requestInitialSubscribePermission } = require('../../utils/subscribe')

const MEMBER_REFRESH_INTERVAL = 10000

const REACTION_OPTIONS = [
  { emoji: '🔥', label: '冲！' },
  { emoji: '😋', label: '馋了' },
  { emoji: '🎮', label: '开干' },
  { emoji: '😂', label: '哈哈' },
  { emoji: '💤', label: '再看看' }
]

Page({
  data: {
    loading: false,
    joining: false,
    inviteSource: '',
    reactions: [],
    floatingReactions: [],
    roundTablePositions: [],
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

    this.setData({ inviteSource, reactions: loadReactions(activityId) })
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

      const mappedMembers = (detail.members || []).map((member) => {
        const colors = generateAvatarColors(member.userId)
        return {
          id: member.userId,
          nickname: member.nickname || '友',
          shortName: (member.nickname || '友').slice(0, 1),
          avatarUrl: member.avatarUrl || (member.userId === localUser.id ? (localUser.avatarUrl || '') : ''),
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
          expenseModeLabel: resolveExpenseModeLabel(detail.expenseMode),
          status: resolveActivityStatusText(detail.status, detail.joinedCount, detail.maxParticipantCount),
          count: `${detail.joinedCount} / ${detail.maxParticipantCount}`,
          isCreator,
          canJoin: showJoinButton,
          currentUserJoined: detail.currentUserJoined,
          members: mappedMembers
        },
        roundTablePositions: buildRoundTablePositions(mappedMembers)
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

  onRoundAvatarError(event) {
    const index = event.currentTarget.dataset.index
    const positions = this.data.roundTablePositions
    if (positions && positions[index]) {
      this.setData({
        [`roundTablePositions[${index}].avatarError`]: true
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

function buildRoundTablePositions(members) {
  const count = members.length
  if (count === 0) return []
  const centerX = 50
  const centerY = 50
  const radius = 38
  const startAngle = -90
  return members.map((member, index) => {
    const angle = startAngle + (360 / count) * index
    const rad = angle * Math.PI / 180
    const x = centerX + Math.cos(rad) * radius
    const y = centerY + Math.sin(rad) * radius
    return { ...member, x: `${x.toFixed(1)}%`, y: `${y.toFixed(1)}%` }
  })
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
