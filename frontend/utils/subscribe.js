const DEFAULT_SUBSCRIBE_TEMPLATE_IDS = []

function requestInitialSubscribePermission() {
  return new Promise((resolve) => {
    const templateIds = wx.getStorageSync('subscribeTemplateIds') || DEFAULT_SUBSCRIBE_TEMPLATE_IDS

    if (!wx.requestSubscribeMessage || !templateIds.length) {
      resolve({ skipped: true })
      return
    }

    wx.requestSubscribeMessage({
      tmplIds: templateIds,
      success: (result) => {
        wx.setStorageSync('subscribePermissionResult', result)
        resolve(result)
      },
      fail: (error) => {
        wx.setStorageSync('subscribePermissionError', error.errMsg || 'subscribe failed')
        resolve({ failed: true })
      }
    })
  })
}

module.exports = {
  requestInitialSubscribePermission
}