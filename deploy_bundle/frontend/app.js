const { loginWithWechat } = require('./utils/auth')

App({
  globalData: {
    brandName: '来整',
    user: null,
    token: ''
  },

  onLaunch() {
    this.syncLoginState()
  },

  syncLoginState() {
    const token = wx.getStorageSync('token')
    const user = wx.getStorageSync('user')

    if (token && user) {
      this.globalData.token = token
      this.globalData.user = user
      return true
    }

    this.globalData.token = ''
    this.globalData.user = null
    return false
  },

  hasLoginState() {
    return this.syncLoginState()
  },

  async loginWithConfirm(profile) {
    const loginData = await loginWithWechat(profile)
    this.globalData.token = loginData.token
    this.globalData.user = loginData.user
    return loginData
  },

  logout() {
    wx.removeStorageSync('token')
    wx.removeStorageSync('user')
    this.globalData.token = ''
    this.globalData.user = null
  }
})