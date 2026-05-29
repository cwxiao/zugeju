const { request } = require('../../utils/request')

Page({
  data: {
    detail: {
      title: '详情',
      tag: '',
      time: '',
      mode: '',
      place: '',
      status: '',
      count: '',
      members: [],
      note: '',
      checklist: []
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
      const detail = await request({
        url: `/api/activities/${options.id}`
      })

      this.setData({
        detail: {
          title: detail.title,
          tag: detail.status === 'recruiting' ? '进行中' : '已确认',
          time: formatTime(detail.startTime),
          mode: detail.mode === 'offline' ? '线下' : '线上',
          place: detail.venueAddress || detail.meetupAddress || '待补充',
          status: detail.joinedCount < detail.maxParticipantCount ? `还差 ${detail.maxParticipantCount - detail.joinedCount} 人` : '人已到齐',
          count: `${detail.joinedCount} / ${detail.maxParticipantCount}`,
          members: (detail.members || []).map((member) => member.nickname || '友'),
          note: detail.description || '先把时间地点定下来。',
          checklist: buildChecklist(detail)
        }
      })
    } catch (error) {
      wx.showToast({
        title: '详情加载失败',
        icon: 'none'
      })
    }
  }
})

function formatTime(value) {
  if (!value) {
    return '时间待定'
  }
  return value.replace('T', ' ').slice(0, 16)
}

function buildChecklist(detail) {
  const items = []
  if (detail.meetupAddress || detail.venueAddress) {
    items.push('出发前再确认一次地点')
  }
  if (detail.expenseMode === 'aa') {
    items.push('费用按 AA 处理，活动后统一看账单')
  }
  items.push('如果有变化，记得及时更新信息')
  return items
}