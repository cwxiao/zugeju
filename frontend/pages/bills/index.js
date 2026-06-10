const { request, isAuthExpiredError } = require('../../utils/request')

Page({
  data: {
    activityId: '',
    loading: true,
    itemName: '',
    amountOptions: ['5', '10', '20', '30', '50', '80', '100', '150', '200', '300', '500', '800', '1000', '1500', '2000'],
    amountIndex: -1,
    summary: null,
    // 付款人选择
    payerOptions: [],
    payerIndex: 0,
    // 消费项目预设
    expenseCategories: [
      { label: '餐饮', items: ['吃饭', '火锅', '烧烤', '自助餐', '聚餐', '外卖', '宵夜', '下午茶', '工作餐', '团建餐'] },
      { label: '饮品', items: ['买水', '奶茶', '咖啡', '啤酒', '酒水', '果汁', '茶饮'] },
      { label: '娱乐', items: ['KTV', '电影票', '剧本杀', '桌游', '密室', '网费', '游戏币', '棋牌', '演出票'] },
      { label: '运动', items: ['场地费', '教练费', '器材费', '球费', '健身卡', '更衣柜'] },
      { label: '交通', items: ['打车', '油费', '停车费', '过路费', '地铁', '公交', '高铁票', '机票'] },
      { label: '住宿', items: ['房费', '民宿', '露营位', '酒店'] },
      { label: '购物', items: ['食材', '零食', '水果', '饮料', '装备', '日用品', '礼物'] },
      { label: '其他', items: ['门票', '小费', '杂费', '押金', '快递费', '包间费', '服务费', '清洁费'] }
    ],
    // 编辑弹窗
    editVisible: false,
    editExpenseId: '',
    editItemName: '',
    editAmountIndex: -1,
    editPayerOptions: [],
    editPayerIndex: 0,
    // 左滑
    touchStartX: 0,
    touchStartY: 0,
    swipeIndex: -1
  },

  async onLoad(options) {
    if (!getApp().hasLoginState()) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      wx.navigateTo({ url: '/pages/home/index?showAuth=1' })
      return
    }

    const activityId = (options && options.id) || ''
    this.setData({ activityId })

    if (!activityId) {
      this.setData({ loading: false })
      return
    }

    await this.loadSummary()
  },

  onShareAppMessage() {
    return {
      title: '来整 — 活动记账结算',
      path: '/pages/home/index'
    }
  },

  async loadSummary() {
    try {
      const summary = await request({
        url: `/api/activities/${this.data.activityId}/expenses/summary`
      })
      const mapped = mapSummary(summary)

      // 构建付款人选项
      const payerOptions = (summary.memberBalances || []).map(m => ({
        userId: m.userId,
        nickname: m.nickname
      }))
      if (payerOptions.length === 0) {
        // 兼容：如果没有 memberBalances，从 settlementItems 构建
        const items = summary.settlementItems || []
        items.forEach(item => {
          payerOptions.push({ userId: item.userId, nickname: item.nickname })
        })
      }

      this.setData({
        summary: mapped,
        payerOptions,
        payerIndex: 0,
        loading: false
      })
    } catch (error) {
      if (isAuthExpiredError(error)) {
        wx.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
        wx.redirectTo({ url: '/pages/home/index' })
        return
      }

      this.setData({ loading: false })
      wx.showToast({ title: '账单加载失败', icon: 'none' })
    }
  },

  onItemNameInput(event) {
    this.setData({ itemName: event.detail.value })
  },

  chooseExpenseItem(e) {
    const name = e.currentTarget.dataset.name
    this.setData({ itemName: name })
  },

  onAmountChange(event) {
    this.setData({ amountIndex: Number(event.detail.value) })
  },

  onPayerChange(event) {
    this.setData({ payerIndex: Number(event.detail.value) })
  },

  async submitExpense() {
    const itemName = this.data.itemName.trim()
    const amountYuan = this.data.amountOptions[this.data.amountIndex]
    const amountFen = amountYuan ? parseAmountToFen(amountYuan) : 0

    if (!itemName) {
      wx.showToast({ title: '先写消费事项', icon: 'none' })
      return
    }
    if (!amountFen) {
      wx.showToast({ title: '金额填对一点', icon: 'none' })
      return
    }

    const payerOptions = this.data.payerOptions
    const payerIndex = this.data.payerIndex
    const payerUserId = payerOptions[payerIndex] ? payerOptions[payerIndex].userId : null

    try {
      const summary = await request({
        url: `/api/activities/${this.data.activityId}/expenses`,
        method: 'POST',
        data: {
          itemName,
          amountFen,
          payerUserId
        }
      })
      this.setData({
        itemName: '',
        amountIndex: -1,
        summary: mapSummary(summary),
        payerIndex: 0
      })
      wx.showToast({ title: '已记一笔', icon: 'success' })
    } catch (error) {
      if (isAuthExpiredError(error)) {
        wx.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
        wx.redirectTo({ url: '/pages/home/index' })
        return
      }

      wx.showToast({ title: '记账失败', icon: 'none' })
    }
  },

  // ===== 左滑操作 =====

  onTouchStart(e) {
    this.setData({
      touchStartX: e.touches[0].clientX,
      touchStartY: e.touches[0].clientY
    })
  },

  onTouchMove(e) {
    const deltaX = e.touches[0].clientX - this.data.touchStartX
    const deltaY = Math.abs(e.touches[0].clientY - this.data.touchStartY)
    // 水平左滑大于垂直滑动才触发
    if (deltaX < -40 && deltaY < 40) {
      const index = e.currentTarget.dataset.index
      if (this.data.swipeIndex !== index) {
        this.setData({ swipeIndex: index })
      }
    } else if (deltaX > 40 && deltaY < 40) {
      // 右滑关闭
      this.setData({ swipeIndex: -1 })
    }
  },

  onTouchEnd() {
    // 滑动状态已设置
  },

  // 点击空白区域收起左滑
  closeSwipe() {
    if (this.data.swipeIndex !== -1) {
      this.setData({ swipeIndex: -1 })
    }
  },

  // ===== 删除消费 =====

  onDeleteExpense(e) {
    const index = e.currentTarget.dataset.index
    const item = this.data.summary.expenseItems[index]
    if (!item) return

    wx.showModal({
      title: '删除消费',
      content: `确定删除「${item.itemName}」(${item.amountText})？`,
      confirmText: '删除',
      confirmColor: '#e74c3c',
      success: async (res) => {
        if (!res.confirm) return

        try {
          const summary = await request({
            url: `/api/activities/${this.data.activityId}/expenses/${item.id}`,
            method: 'DELETE'
          })
          this.setData({
            summary: mapSummary(summary),
            swipeIndex: -1
          })
          wx.showToast({ title: '已删除', icon: 'success' })
        } catch (error) {
          if (isAuthExpiredError(error)) {
            wx.showToast({ title: '登录已过期', icon: 'none' })
            wx.redirectTo({ url: '/pages/home/index' })
            return
          }
          wx.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    })
  },

  // ===== 编辑消费 =====

  onEditExpense(e) {
    const index = e.currentTarget.dataset.index
    const item = this.data.summary.expenseItems[index]
    if (!item) return

    // 构建编辑弹窗的付款人选项
    const editPayerOptions = this.data.payerOptions
    let editPayerIndex = editPayerOptions.findIndex(p => p.userId === item.payerUserId)
    if (editPayerIndex < 0) editPayerIndex = 0

    const editAmountIndex = this.data.amountOptions.findIndex(a => a === String(item.amountFen / 100))
    this.setData({
      editVisible: true,
      editExpenseId: item.id,
      editItemName: item.itemName,
      editAmountIndex: editAmountIndex >= 0 ? editAmountIndex : -1,
      editPayerOptions,
      editPayerIndex,
      swipeIndex: -1
    })
  },

  onEditItemNameInput(e) {
    this.setData({ editItemName: e.detail.value })
  },

  chooseEditExpenseItem(e) {
    const name = e.currentTarget.dataset.name
    this.setData({ editItemName: name })
  },

  onEditAmountChange(e) {
    this.setData({ editAmountIndex: Number(e.detail.value) })
  },

  onEditPayerChange(e) {
    this.setData({ editPayerIndex: Number(e.detail.value) })
  },

  closeEditModal() {
    this.setData({ editVisible: false })
  },

  async confirmEdit() {
    const itemName = this.data.editItemName.trim()
    const editAmountYuan = this.data.amountOptions[this.data.editAmountIndex]
    const amountFen = editAmountYuan ? parseAmountToFen(editAmountYuan) : 0

    if (!itemName) {
      wx.showToast({ title: '项目名不能为空', icon: 'none' })
      return
    }
    if (!amountFen) {
      wx.showToast({ title: '金额要大于0', icon: 'none' })
      return
    }

    const payerOptions = this.data.editPayerOptions
    const editPayerIndex = this.data.editPayerIndex
    const payerUserId = payerOptions[editPayerIndex] ? payerOptions[editPayerIndex].userId : null

    try {
      const summary = await request({
        url: `/api/activities/${this.data.activityId}/expenses/${this.data.editExpenseId}`,
        method: 'PUT',
        data: {
          itemName,
          amountFen,
          payerUserId
        }
      })
      this.setData({
        editVisible: false,
        summary: mapSummary(summary)
      })
      wx.showToast({ title: '已修改', icon: 'success' })
    } catch (error) {
      if (isAuthExpiredError(error)) {
        wx.showToast({ title: '登录已过期', icon: 'none' })
        wx.redirectTo({ url: '/pages/home/index' })
        return
      }
      wx.showToast({ title: '修改失败', icon: 'none' })
    }
  },

  finishActivity() {
    wx.showModal({
      title: '结束活动',
      content: '结束后会按当前到场人数计算每个人该转多少钱。',
      confirmText: '确认结束',
      success: async (res) => {
        if (!res.confirm) return

        try {
          const summary = await request({
            url: `/api/activities/${this.data.activityId}/finish`,
            method: 'POST'
          })
          this.setData({ summary: mapSummary(summary) })
          wx.showToast({ title: '活动已结束', icon: 'success' })
        } catch (error) {
          if (isAuthExpiredError(error)) {
            wx.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
            wx.redirectTo({ url: '/pages/home/index' })
            return
          }

          wx.showToast({ title: '结束失败', icon: 'none' })
        }
      }
    })
  },

  goActivities() {
    wx.navigateTo({
      url: '/pages/activities/index'
    })
  }
})

function mapSummary(summary) {
  const settlementItems = (summary.settlementItems || []).map((item) => ({
    ...item,
    amountText: item.amountFen > 0 ? formatFen(item.amountFen) : '不用转',
    roleLabel: item.role === 'creator' ? '发起人' : '成员'
  }))
  const participantCount = summary.joinedCount || Math.max(settlementItems.length, 1)
  const settlementPendingCount = settlementItems.filter((item) => item.amountFen > 0).length

  // 每人收支明细
  const memberBalances = (summary.memberBalances || []).map((item) => ({
    ...item,
    paidText: formatFen(item.paidAmountFen),
    shareText: formatFen(item.shareAmountFen),
    balanceText: item.balanceFen > 0
      ? `收 ${formatFen(item.balanceFen)}`
      : item.balanceFen < 0
        ? `付 ${formatFen(Math.abs(item.balanceFen))}`
        : '已平'
  }))

  // 转账指令
  const transferItems = (summary.transferItems || []).map((item) => ({
    ...item,
    amountText: formatFen(item.amountFen)
  }))

  return {
    ...summary,
    expenseModeLabel: resolveExpenseModeLabel(summary.expenseMode),
    statusLabel: summary.activityStatus === 'finished' ? '已结束' : '进行中',
    totalAmountText: formatFen(summary.totalAmountFen),
    perHeadAmountText: formatFen(Math.round(summary.totalAmountFen / Math.max(participantCount, 1))),
    settlementPendingCount,
    participantCount,
    recordCount: (summary.expenseItems || []).length,
    expenseItems: (summary.expenseItems || []).map((item) => ({
      ...item,
      amountText: formatFen(item.amountFen)
    })),
    settlementItems,
    transferItems,
    memberBalances,
    settlementSummaryText: transferItems.length
      ? `${transferItems.length} 笔转账，多退少补自动算好。`
      : settlementPendingCount
          ? `结束后有 ${settlementPendingCount} 个人需要转账。`
          : '结束活动后会按到场人数均摊，没有人需要转账。'
  }
}

function formatFen(amountFen) {
  return `${(amountFen / 100).toFixed(2)} 元`
}

function parseAmountToFen(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount <= 0) {
    return 0
  }
  return Math.round(amount * 100)
}

function resolveExpenseModeLabel(expenseMode) {
  if (expenseMode === 'host_treat') {
    return '我请客'
  }
  if (expenseMode === 'aa') {
    return 'AA'
  }
  return '无需结算'
}
