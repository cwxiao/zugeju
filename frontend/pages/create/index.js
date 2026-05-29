const { request } = require('../../utils/request')

Page({
  data: {
    modes: ['线上', '线下'],
    modeIndex: 0,
    form: {
      date: '',
      time: '',
      location: '',
      note: ''
    }
  },

  onLoad() {
    if (!getApp().hasLoginState()) {
      wx.showToast({
        title: '请先确认登录',
        icon: 'none'
      })
      wx.redirectTo({
        url: '/pages/home/index'
      })
    }
  },

  onDateChange(event) {
    this.setData({
      'form.date': event.detail.value
    })
  },

  onTimeChange(event) {
    this.setData({
      'form.time': event.detail.value
    })
  },

  onModeChange(event) {
    this.setData({
      modeIndex: Number(event.detail.value)
    })
  },

  onLocationInput(event) {
    this.setData({
      'form.location': event.detail.value
    })
  },

  onNoteInput(event) {
    this.setData({
      'form.note': event.detail.value
    })
  },

  async submit() {
    const { form, modes, modeIndex } = this.data
    if (!form.date || !form.time) {
      wx.showToast({ title: '请先选时间', icon: 'none' })
      return
    }

    try {
      const payload = {
        typeCode: 'custom',
        typeName: '来整',
        title: form.note || '来整一下',
        description: form.note || '',
        mode: modes[modeIndex] === '线下' ? 'offline' : 'online',
        targetParticipantCount: 4,
        maxParticipantCount: 4,
        startTime: `${form.date}T${form.time}:00+08:00`,
        endTime: null,
        meetupTime: null,
        meetupAddress: form.location || null,
        venueAddress: form.location || null,
        onlineJoinInfo: null,
        expenseMode: 'aa',
        expenseFlag: 1,
        allowMemberAddExpense: true
      }
      const result = await request({
        url: '/api/activities',
        method: 'POST',
        data: payload
      })

      wx.showToast({ title: '已创建', icon: 'success' })
      wx.redirectTo({
        url: `/pages/detail/index?id=${result.activityId}`
      })
    } catch (error) {
      wx.showToast({ title: '创建失败', icon: 'none' })
    }
  }
})