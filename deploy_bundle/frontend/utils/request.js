const DEFAULT_BASE_URL = 'https://ywsfs.cn'

function getBaseUrl() {
  return DEFAULT_BASE_URL
}

function request({ url, method = 'GET', data, auth = true }) {
  const token = wx.getStorageSync('token')
  const baseUrl = getBaseUrl()

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${baseUrl}${url}`,
      method,
      data,
      header: auth && token ? { Authorization: `Bearer ${token}` } : {},
      success: (res) => {
        const { data: body, statusCode } = res

        if (statusCode >= 200 && statusCode < 300 && body && body.code === 0) {
          resolve(body.data)
          return
        }

        if (auth && (statusCode === 401 || statusCode === 403)) {
          clearAuthState()
        }

        const error = new Error((body && body.message) || 'request failed')
        error.statusCode = statusCode
        error.body = body
        reject(error)
      },
      fail: reject
    })
  })
}

function clearAuthState() {
  const app = typeof getApp === 'function' ? getApp() : null

  wx.removeStorageSync('token')
  wx.removeStorageSync('user')

  if (app && typeof app.logout === 'function') {
    app.logout()
  }
}

function isAuthExpiredError(error) {
  return !!(error && (error.statusCode === 401 || error.statusCode === 403))
}

module.exports = {
  request,
  BASE_URL: DEFAULT_BASE_URL,
  getBaseUrl,
  isAuthExpiredError
}