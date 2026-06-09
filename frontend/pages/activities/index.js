const { request, isAuthExpiredError } = require('../../utils/request')

const ROLE_OPTIONS = [
  { value: 'all', label: '全部活动' },
  { value: 'creator', label: '我发起的' },
  { value: 'member', label: '我参加的' }
]

const TIME_OPTIONS = [
  { value: 'latest', label: '最近在前' },
  { value: 'earliest', label: '最早在前' }
]

const STATUS_OPTIONS = [
  { value: 'all', label: '全部状态' },
  { value: 'finished', label: '已结束' },
  { value: 'cancelled', label: '已取消' },
  { value: 'active', label: '进行中' }
]

Page({
  data: {
    roleOptions: ROLE_OPTIONS,
    timeOptions: TIME_OPTIONS,
    statusOptions: STATUS_OPTIONS,
    roleFilter: 'all',
    timeFilter: 'latest',
    statusFilter: 'all',
    startDate: '',
    endDate: '',
    keyword: '',
    archiveRecords: [],
    filteredRecords: [],
    summaryText: ''
  },

  onShow() {
    if (!getApp().hasLoginState()) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      wx.navigateTo({ url: '/pages/home/index?showAuth=1' })
      return
    }
    this.loadArchive()
  },

  onShareAppMessage() {
    return {
      title: '来整 — 活动档案',
      path: '/pages/home/index'
    }
  },

  async loadArchive() {
    try {
      const archiveRecords = await request({
        url: '/api/activities/mine/archive'
      })

      this.setData({
        archiveRecords: archiveRecords.map(mapArchiveRecord)
      })
      this.applyFilters()
    } catch (error) {
      if (isAuthExpiredError(error)) {
        wx.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
        wx.redirectTo({ url: '/pages/home/index' })
        return
      }

      wx.showToast({ title: '活动档案加载失败', icon: 'none' })
    }
  },

  selectRole(event) {
    this.setData({ roleFilter: event.currentTarget.dataset.value })
    this.applyFilters()
  },

  selectTime(event) {
    this.setData({ timeFilter: event.currentTarget.dataset.value })
    this.applyFilters()
  },

  selectStatus(event) {
    this.setData({ statusFilter: event.currentTarget.dataset.value })
    this.applyFilters()
  },

  onStartDateChange(event) {
    this.setData({ startDate: event.detail.value || '' })
    this.applyFilters()
  },

  onEndDateChange(event) {
    this.setData({ endDate: event.detail.value || '' })
    this.applyFilters()
  },

  clearDateRange() {
    this.setData({ startDate: '', endDate: '' })
    this.applyFilters()
  },

  onKeywordInput(event) {
    this.setData({ keyword: event.detail.value || '' })
    this.applyFilters()
  },

  openArchiveDetail(event) {
    const { id } = event.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/archive-detail/index?id=${id}`
    })
  },

  applyFilters() {
    const keyword = this.data.keyword.trim().toLowerCase()
    const startTime = this.data.startDate ? new Date(`${this.data.startDate}T00:00:00`).getTime() : 0
    const endTime = this.data.endDate ? new Date(`${this.data.endDate}T23:59:59`).getTime() : Number.MAX_SAFE_INTEGER

    let filteredRecords = this.data.archiveRecords.filter((item) => {
      if (this.data.roleFilter !== 'all' && item.role !== this.data.roleFilter) {
        return false
      }

      if (this.data.statusFilter === 'finished' && item.status !== 'finished') {
        return false
      }

      if (this.data.statusFilter === 'cancelled' && item.status !== 'cancelled') {
        return false
      }

      if (this.data.statusFilter === 'active' && (item.status === 'finished' || item.status === 'cancelled')) {
        return false
      }

      const itemStartTime = item.startTimeValue || 0
      if (itemStartTime < startTime || itemStartTime > endTime) {
        return false
      }

      if (!keyword) {
        return true
      }

      return item.keywords.indexOf(keyword) >= 0
    })

    filteredRecords = filteredRecords.sort((left, right) => {
      const delta = new Date(left.roleTime).getTime() - new Date(right.roleTime).getTime()
      return this.data.timeFilter === 'earliest' ? delta : -delta
    })

    const createdCount = filteredRecords.filter((item) => item.role === 'creator').length
    const joinedCount = filteredRecords.filter((item) => item.role === 'member').length
    const finishedCount = filteredRecords.filter((item) => item.status === 'finished').length
    const cancelledCount = filteredRecords.filter((item) => item.status === 'cancelled').length
    const summaryText = `共 ${filteredRecords.length} 场，发起 ${createdCount} 场，参与 ${joinedCount} 场，结束 ${finishedCount} 场，取消 ${cancelledCount} 场`

    this.setData({
      filteredRecords,
      summaryText
    })
  }
})

function mapArchiveRecord(item) {
  const roleLabel = item.role === 'creator' ? '我发起的' : '我参加的'

  return {
    ...item,
    roleLabel,
    statusLabel: resolveStatusLabel(item.status),
    modeLabel: item.mode === 'offline' ? '线下' : '线上',
    startText: formatTime(item.startTime),
    startDateText: formatDate(item.startTime),
    startTimeValue: item.startTime ? new Date(item.startTime).getTime() : 0,
    roleTimeText: formatTime(item.roleTime),
    roleTimeLabel: `${item.role === 'creator' ? '发起时间' : '参与时间'} ${formatTime(item.roleTime)}`,
    totalAmountText: formatFen(item.totalAmountFen || 0),
    keywords: [item.title, item.typeName, item.place, item.highlight, roleLabel, resolveStatusLabel(item.status)].filter(Boolean).join('|').toLowerCase()
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

function formatTime(value) {
  if (!value) {
    return '时间待定'
  }
  return value.replace('T', ' ').slice(0, 16)
}

function formatDate(value) {
  if (!value) {
    return '日期待定'
  }
  return value.slice(0, 10)
}

function formatFen(amountFen) {
  return `${(amountFen / 100).toFixed(2)} 元`
}