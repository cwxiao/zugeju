const DEFAULT_BASE_URL = 'http://192.168.0.13:8080'

function getBaseUrl() {
  return wx.getStorageSync('apiBaseUrl') || DEFAULT_BASE_URL
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

        reject(new Error((body && body.message) || 'request failed'))
      },
      fail: reject
    })
  })
}

module.exports = {
  request,
  BASE_URL: DEFAULT_BASE_URL,
  getBaseUrl
}