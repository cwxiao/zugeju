const { request, isAuthExpiredError } = require('../../utils/request')

Page({
  data: {
    pageTitle: '开始整',
    submitLabel: '下一步',
    editingId: '',
    participantCountOptions: [2, 3, 4, 5, 6, 8, 10, 12],
    participantCountIndex: 2,
    modes: ['线上', '线下'],
    modeIndex: 0,
    expenseOptions: [
      { code: 'host_treat', label: '我请客' },
      { code: 'aa', label: 'AA' }
    ],
    expenseOptionIndex: 1,
    activityTypes: [
      { code: 'custom', name: '自定义', presetTitle: '' },
      { code: 'dinner', name: '吃饭', presetTitle: '一起吃个饭' },
      { code: 'game', name: '开黑', presetTitle: '一起开黑' },
      { code: 'sports', name: '运动', presetTitle: '一起动一动' },
      { code: 'coffee', name: '咖啡', presetTitle: '一起喝杯咖啡' }
    ],
    activityTypeIndex: 0,
    activityRuleHint: '',
    modeRequiredTip: '',
    diceRolling: false,
    diceDisplayIndex: 0,
    locationRequired: false,
    locationTip: '',
    form: {
      title: '',
      date: '',
      time: '',
      location: '',
      locationAddress: '',
      note: ''
    }
  },

  async onLoad(options) {
    if (!getApp().hasLoginState()) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      wx.navigateTo({
        url: '/pages/home/index?showAuth=1'
      })
      return
    }

    if (options && options.id) {
      await this.loadForEdit(options.id)
      return
    }

    const now = new Date()
    const ruleState = buildRuleState(this.data.activityTypes, this.data.activityTypeIndex)
    this.setData({
      ...ruleState,
      form: {
        ...this.data.form,
        date: formatDate(now),
        time: formatTime(now)
      }
    })
  },

  async loadForEdit(activityId) {
    try {
      const detail = await request({
        url: `/api/activities/${activityId}`
      })
      const isOffline = detail.mode === 'offline'
      const startDate = detail.startTime ? detail.startTime.slice(0, 10) : ''
      const startTime = detail.startTime ? detail.startTime.slice(11, 16) : ''
      const activityTypeIndex = resolveActivityTypeIndex(this.data.activityTypes, detail.typeCode, detail.typeName)
      const ruleState = buildRuleState(this.data.activityTypes, activityTypeIndex)

      this.setData({
        pageTitle: '修改活动',
        submitLabel: '保存修改',
        editingId: activityId,
        participantCountIndex: resolveParticipantCountIndex(this.data.participantCountOptions, detail.maxParticipantCount),
        modeIndex: ruleState.forceOffline ? 1 : (isOffline ? 1 : 0),
        expenseOptionIndex: resolveExpenseOptionIndex(this.data.expenseOptions, detail.expenseMode),
        activityTypeIndex,
        ...ruleState,
        form: {
          title: detail.title || '',
          date: startDate,
          time: startTime,
          location: isOffline ? (detail.venueAddress || detail.meetupAddress || '') : '',
          locationAddress: isOffline ? (detail.venueAddress || detail.meetupAddress || '') : '',
          note: detail.description || ''
        }
      })
    } catch (error) {
      if (isAuthExpiredError(error)) {
        wx.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
        wx.redirectTo({ url: '/pages/home/index' })
        return
      }

      wx.showToast({
        title: '加载活动失败',
        icon: 'none'
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
    const modeIndex = Number(event.detail.value)
    const selectedType = this.data.activityTypes[this.data.activityTypeIndex] || this.data.activityTypes[0]
    const typeRule = getActivityTypeRule(selectedType.code)

    if (typeRule.forceOffline && this.data.modes[modeIndex] !== '线下') {
      wx.showToast({
        title: `${selectedType.name}默认线下`,
        icon: 'none'
      })
      this.setData({ modeIndex: 1 })
      return
    }

    const nextState = { modeIndex }

    if (this.data.modes[modeIndex] === '线上') {
      nextState['form.location'] = ''
      nextState['form.locationAddress'] = ''
    }

    this.setData(nextState)
  },

  onParticipantCountChange(event) {
    this.setData({
      participantCountIndex: Number(event.detail.value)
    })
  },

  chooseExpenseMode(event) {
    this.setData({
      expenseOptionIndex: Number(event.currentTarget.dataset.index)
    })
  },

  chooseActivityType(event) {
    if (this.data.diceRolling) {
      return
    }
    const activityTypeIndex = Number(event.currentTarget.dataset.index)
    const selectedType = this.data.activityTypes[activityTypeIndex]
    const nextTitle = selectedType.presetTitle || this.data.form.title
    const ruleState = buildRuleState(this.data.activityTypes, activityTypeIndex)

    this.setData({
      activityTypeIndex,
      modeIndex: ruleState.forceOffline ? 1 : this.data.modeIndex,
      ...ruleState,
      'form.title': nextTitle
    })
  },

  onTitleInput(event) {
    this.setData({
      'form.title': event.detail.value
    })
  },

  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        const label = res.name || res.address || '已选地点'
        this.setData({
          'form.location': label,
          'form.locationAddress': res.address || label
        })
      },
      fail: (error) => {
        if (error && error.errMsg && error.errMsg.includes('cancel')) {
          return
        }
        wx.showToast({
          title: '选地点失败',
          icon: 'none'
        })
      }
    })
  },

  onNoteInput(event) {
    this.setData({
      'form.note': event.detail.value
    })
  },

  rollDice() {
    if (this.data.diceRolling) {
      return
    }
    const types = this.data.activityTypes
    this.setData({ diceRolling: true })

    let tick = 0
    const maxTicks = 12
    const rollInterval = setInterval(() => {
      tick++
      const randomIndex = Math.floor(Math.random() * types.length)
      this.setData({ diceDisplayIndex: randomIndex })

      if (tick >= maxTicks) {
        clearInterval(rollInterval)
        const finalIndex = Math.floor(Math.random() * types.length)
        this.setData({ diceRolling: false, diceDisplayIndex: 0 })
        this.chooseActivityType({ currentTarget: { dataset: { index: finalIndex } } })
        wx.vibrateShort({ type: 'heavy' })
      }
    }, 70)
  },

  async submit() {
    const {
      form,
      modes,
      modeIndex,
      editingId,
      activityTypes,
      activityTypeIndex,
      expenseOptions,
      expenseOptionIndex,
      participantCountOptions,
      participantCountIndex
    } = this.data
    if (!form.date || !form.time) {
      wx.showToast({ title: '请先选时间', icon: 'none' })
      return
    }

    if (!form.title.trim()) {
      wx.showToast({ title: '先写活动主题', icon: 'none' })
      return
    }

    const selectedType = activityTypes[activityTypeIndex] || activityTypes[0]
    const isOffline = modes[modeIndex] === '线下'
    const typeRule = getActivityTypeRule(selectedType.code)
    const participantCount = participantCountOptions[participantCountIndex] || participantCountOptions[0]
    const selectedExpenseMode = isOffline
      ? (expenseOptions[expenseOptionIndex] || expenseOptions[1]).code
      : 'none'

    if (typeRule.forceOffline && !isOffline) {
      wx.showToast({ title: `${selectedType.name}必须线下`, icon: 'none' })
      return
    }

    if (isOffline && !hasLocationValue(form)) {
      wx.showToast({ title: '线下活动要填地点', icon: 'none' })
      return
    }

    try {
      const payload = {
        typeCode: selectedType.code,
        typeName: selectedType.name,
        title: form.title.trim(),
        description: form.note || '',
        mode: isOffline ? 'offline' : 'online',
        targetParticipantCount: participantCount,
        maxParticipantCount: participantCount,
        startTime: `${form.date}T${form.time}:00+08:00`,
        endTime: null,
        meetupTime: null,
        meetupAddress: isOffline ? (form.locationAddress || form.location || null) : null,
        venueAddress: isOffline ? (form.locationAddress || form.location || null) : null,
        onlineJoinInfo: null,
        expenseMode: selectedExpenseMode,
        expenseFlag: isOffline ? 1 : 0,
        allowMemberAddExpense: false
      }
      const result = await request({
        url: editingId ? `/api/activities/${editingId}` : '/api/activities',
        method: editingId ? 'PUT' : 'POST',
        data: payload
      })

      wx.showToast({ title: editingId ? '已保存' : '已创建', icon: 'success' })
      wx.redirectTo({
        url: `/pages/detail/index?id=${result.activityId}`
      })
    } catch (error) {
      wx.showToast({
        title: resolveSubmitErrorMessage(error, editingId),
        icon: 'none'
      })
    }
  }
})

function formatDate(date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatTime(date) {
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')
  return `${hours}:${minutes}`
}

function getActivityTypeRule(typeCode) {
  return ACTIVITY_TYPE_RULES[typeCode] || DEFAULT_ACTIVITY_TYPE_RULE
}

function buildRuleState(activityTypes, activityTypeIndex) {
  const selectedType = activityTypes[activityTypeIndex] || activityTypes[0] || { code: 'custom', name: '自定义' }
  const typeRule = getActivityTypeRule(selectedType.code)

  return {
    forceOffline: typeRule.forceOffline,
    activityRuleHint: typeRule.summary ? `${selectedType.name}${typeRule.summary}` : '',
    modeRequiredTip: typeRule.forceOffline ? `${selectedType.name}默认线下，不能改成线上。` : '',
    locationRequired: typeRule.requireLocation,
    locationTip: typeRule.requireLocation ? `${selectedType.name}需要先选地点。` : ''
  }
}

function hasLocationValue(form) {
  return !!((form.location || '').trim() || (form.locationAddress || '').trim())
}

function resolveSubmitErrorMessage(error, editingId) {
  const fallback = editingId ? '保存失败' : '创建失败'
  const message = error && error.message

  if (!message) {
    return fallback
  }

  if (message.includes('request:fail')) {
    return '后端没启动，先开服务'
  }

  if (isAuthExpiredError(error)) {
    return '登录已过期，请重新登录'
  }

  return fallback
}

function resolveActivityTypeIndex(activityTypes, typeCode, typeName) {
  const index = activityTypes.findIndex((item) => item.code === typeCode || item.name === typeName)
  return index >= 0 ? index : 0
}

function resolveExpenseOptionIndex(expenseOptions, expenseMode) {
  const index = expenseOptions.findIndex((item) => item.code === expenseMode)
  return index >= 0 ? index : 1
}

function resolveParticipantCountIndex(participantCountOptions, maxParticipantCount) {
  const index = participantCountOptions.findIndex((item) => item === maxParticipantCount)
  return index >= 0 ? index : 2
}

const DEFAULT_ACTIVITY_TYPE_RULE = {
  forceOffline: false,
  requireLocation: false,
  summary: ''
}

const ACTIVITY_TYPE_RULES = {
  dinner: {
    forceOffline: true,
    requireLocation: true,
    summary: '默认线下，地点必填。'
  },
  coffee: {
    forceOffline: true,
    requireLocation: true,
    summary: '默认线下，地点必填。'
  }
}