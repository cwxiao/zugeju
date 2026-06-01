const DEFAULT_SUBSCRIBE_TEMPLATE_IDS = []

function requestInitialSubscribePermission() {
  return new Promise((resolve) => {
    const templateIds = wx.getStorageSync('subscribeTemplateIds') || DEFAULT_SUBSCRIBE_TEMPLATE_IDS
    const alreadyPrompted = wx.getStorageSync('subscribePermissionPrompted')

    if (!wx.requestSubscribeMessage || !templateIds.length || alreadyPrompted) {
      resolve({ skipped: true })
      return
    }

    wx.requestSubscribeMessage({
      tmplIds: templateIds,
      success: (result) => {
        wx.setStorageSync('subscribePermissionPrompted', true)
        wx.setStorageSync('subscribePermissionResult', result)
        resolve(result)
      },
      fail: (error) => {
        wx.setStorageSync('subscribePermissionPrompted', true)
        wx.setStorageSync('subscribePermissionError', error.errMsg || 'subscribe failed')
        resolve({ failed: true })
      }
    })
  })
}

module.exports = {
  requestInitialSubscribePermission
}