const { request, isAuthExpiredError } = require('../../utils/request')
const cdn = require('../../utils/cdn')

Page({
  data: {
    cdnImg: cdn,
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
      { code: 'coffee', name: '喝咖啡', presetTitle: '一起喝杯咖啡' },
      { code: 'dinner', name: '约饭', presetTitle: '一起吃个饭' },
      { code: 'hotpot', name: '火锅', presetTitle: '一起涮个火锅' },
      { code: 'bbq', name: '烧烤', presetTitle: '一起撸个串' },
      { code: 'game', name: '开黑', presetTitle: '一起开黑' },
      { code: 'mahjong', name: '搓麻', presetTitle: '一起搓个麻将' },
      { code: 'ktv', name: 'K歌', presetTitle: '一起去K歌' },
      { code: 'movie', name: '看电影', presetTitle: '一起看个电影' },
      { code: 'script_kill', name: '剧本杀', presetTitle: '一起来剧本杀' },
      { code: 'board_game', name: '桌游', presetTitle: '一起来桌游' },
      { code: 'escape_room', name: '密室逃脱', presetTitle: '一起密室逃脱' },
      { code: 'hiking', name: '徒步', presetTitle: '一起去徒步' },
      { code: 'cycling', name: '骑行', presetTitle: '一起去骑行' },
      { code: 'running', name: '跑步', presetTitle: '一起去跑步' },
      { code: 'badminton', name: '羽毛球', presetTitle: '一起打羽毛球' },
      { code: 'basketball', name: '篮球', presetTitle: '一起打篮球' },
      { code: 'swimming', name: '游泳', presetTitle: '一起去游泳' },
      { code: 'fitness', name: '健身', presetTitle: '一起去健身' },
      { code: 'yoga', name: '瑜伽', presetTitle: '一起练瑜伽' },
      { code: 'fishing', name: '钓鱼', presetTitle: '一起去钓鱼' },
      { code: 'camping', name: '露营', presetTitle: '一起去露营' },
      { code: 'picnic', name: '野餐', presetTitle: '一起去野餐' },
      { code: 'shopping', name: '逛街', presetTitle: '一起去逛街' },
      { code: 'bar', name: '小酌', presetTitle: '一起去小酌' },
      { code: 'tea', name: '喝茶', presetTitle: '一起喝个茶' },
      { code: 'photo', name: '拍照', presetTitle: '一起拍个照' },
      { code: 'concert', name: '演唱会', presetTitle: '一起看演唱会' },
      { code: 'museum', name: '逛展', presetTitle: '一起去逛展' },
      { code: 'park', name: '逛公园', presetTitle: '一起去逛公园' },
      { code: 'pet', name: '遛狗', presetTitle: '一起去遛狗' },
      { code: 'diy', name: '手工', presetTitle: '一起做手工' },
      { code: 'cooking', name: '做饭', presetTitle: '一起做个饭' },
      { code: 'study', name: '自习', presetTitle: '一起自习' },
      { code: 'online_game', name: '网游', presetTitle: '一起网游' },
      { code: 'spa', name: '泡温泉', presetTitle: '一起泡温泉' },
      { code: 'skiing', name: '滑雪', presetTitle: '一起去滑雪' },
      { code: 'surfing', name: '冲浪', presetTitle: '一起去冲浪' },
      { code: 'rock_climbing', name: '攀岩', presetTitle: '一起去攀岩' },
      { code: 'billiards', name: '台球', presetTitle: '一起打台球' },
      { code: 'bowling', name: '保龄球', presetTitle: '一起打保龄球' },
      { code: 'karate', name: '拳击', presetTitle: '一起去练拳' },
      { code: 'go', name: '围棋', presetTitle: '一起下围棋' },
      { code: 'chess', name: '象棋', presetTitle: '一起下象棋' },
      { code: 'darts', name: '飞镖', presetTitle: '一起掷飞镖' },
      { code: 'pottery', name: '陶艺', presetTitle: '一起做陶艺' },
      { code: 'painting', name: '画画', presetTitle: '一起画画' },
      { code: 'baking', name: '烘焙', presetTitle: '一起做烘焙' },
      { code: 'wine_tasting', name: '品酒', presetTitle: '一起品品酒' },
      { code: 'night_market', name: '夜市', presetTitle: '一起逛夜市' },
      { code: 'road_trip', name: '自驾游', presetTitle: '一起自驾游' },
      { code: 'amusement_park', name: '游乐园', presetTitle: '一起去游乐园' },
      { code: 'aquarium', name: '水族馆', presetTitle: '一起去水族馆' },
      { code: 'zoo', name: '动物园', presetTitle: '一起去动物园' },
      { code: 'library', name: '图书馆', presetTitle: '一起去图书馆' },
      { code: 'escape', name: '密室', presetTitle: '一起密室逃脱' },
      { code: 'ping_pong', name: '乒乓球', presetTitle: '一起打乒乓球' },
      { code: 'tennis', name: '网球', presetTitle: '一起打网球' },
      { code: 'volleyball', name: '排球', presetTitle: '一起打排球' },
      { code: 'football', name: '足球', presetTitle: '一起踢足球' },
      { code: 'frisbee', name: '飞盘', presetTitle: '一起扔飞盘' },
      { code: 'skateboard', name: '滑板', presetTitle: '一起玩滑板' },
      { code: 'roller_skating', name: '轮滑', presetTitle: '一起玩轮滑' },
      { code: 'kite', name: '放风筝', presetTitle: '一起去放风筝' },
      { code: 'star_gazing', name: '观星', presetTitle: '一起去看星星' },
      { code: 'sunrise', name: '看日出', presetTitle: '一起去看日出' },
      { code: 'sunset', name: '看日落', presetTitle: '一起去看日落' },
      { code: 'barbecue', name: '烤肉', presetTitle: '一起吃烤肉' },
      { code: 'seafood', name: '海鲜', presetTitle: '一起吃海鲜' },
      { code: 'dessert', name: '甜品', presetTitle: '一起去吃甜品' },
      { code: 'milk_tea', name: '奶茶', presetTitle: '一起去喝奶茶' },
      { code: 'ice_cream', name: '冰淇淋', presetTitle: '一起去吃冰淇淋' },
      { code: 'spa_massage', name: '按摩', presetTitle: '一起去按摩' },
      { code: 'karaoke', name: '唱歌', presetTitle: '一起去唱歌' }
    ],
    activityTypeIndex: 0,
    activityRuleHint: '',
    modeRequiredTip: '',
    diceRolling: false,
    diceDisplayIndex: 0,
    typeKeyword: '',
    filteredTypes: [],
    // 热门活动推荐（默认展示少量，其余搜索获取）
    hotActivityTypes: [
      { index: 0, name: '喝咖啡' },
      { index: 1, name: '约饭' },
      { index: 2, name: '火锅' },
      { index: 3, name: '烧烤' },
      { index: 4, name: '开黑' },
      { index: 5, name: '搓麻' },
      { index: 6, name: 'K歌' },
      { index: 7, name: '看电影' },
      { index: 20, name: '露营' },
      { index: 23, name: '小酌' }
    ],
    locationRequired: false,
    locationTip: '',
    form: {
      title: '',
      date: '',
      time: '',
      location: '',
      locationAddress: '',
      locationLatitude: null,
      locationLongitude: null
    }
  },

  onShareAppMessage() {
    return {
      title: '来整 — 发起一场活动',
      path: '/pages/home/index'
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
    const defaultIndex = 0
    const defaultType = this.data.activityTypes[defaultIndex]
    const ruleState = buildRuleState(this.data.activityTypes, defaultIndex)
    this.setData({
      activityTypeIndex: defaultIndex,
      ...ruleState,
      form: {
        ...this.data.form,
        title: defaultType.presetTitle,
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
      const selectedType = this.data.activityTypes[activityTypeIndex] || this.data.activityTypes[0]

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
          title: selectedType.presetTitle,
          date: startDate,
          time: startTime,
          location: isOffline ? (detail.venueAddress || detail.meetupAddress || '') : '',
          locationAddress: isOffline ? (detail.venueAddress || detail.meetupAddress || '') : '',
          locationLatitude: isOffline ? (detail.latitude || null) : null,
          locationLongitude: isOffline ? (detail.longitude || null) : null
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
      nextState['form.locationLatitude'] = null
      nextState['form.locationLongitude'] = null
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

  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        const label = res.name || res.address || '已选地点'
        this.setData({
          'form.location': label,
          'form.locationAddress': res.address || label,
          'form.locationLatitude': res.latitude,
          'form.locationLongitude': res.longitude
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

  onTypeSearch(event) {
    const keyword = event.detail.value
    const filtered = this.filterActivityTypes(keyword)
    this.setData({ typeKeyword: keyword, filteredTypes: filtered })
  },

  clearTypeSearch() {
    this.setData({ typeKeyword: '', filteredTypes: [] })
  },

  filterActivityTypes(keyword) {
    if (!keyword || !keyword.trim()) return []
    const kw = keyword.trim().toLowerCase()
    return this.data.activityTypes
      .map((item, index) => ({ ...item, _origIndex: index }))
      .filter(item => item.name.toLowerCase().includes(kw) || (item.code && item.code.toLowerCase().includes(kw)))
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
        description: '',
        mode: isOffline ? 'offline' : 'online',
        targetParticipantCount: participantCount,
        maxParticipantCount: participantCount,
        startTime: `${form.date}T${form.time}:00+08:00`,
        endTime: null,
        meetupTime: null,
        meetupAddress: isOffline ? (form.locationAddress || form.location || null) : null,
        venueAddress: isOffline ? (form.locationAddress || form.location || null) : null,
        latitude: isOffline ? (form.locationLatitude || null) : null,
        longitude: isOffline ? (form.locationLongitude || null) : null,
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