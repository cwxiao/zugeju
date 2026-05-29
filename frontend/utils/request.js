const BASE_URL = 'http://127.0.0.1:8080'

function request({ url, method = 'GET', data, auth = true }) {
  const token = wx.getStorageSync('token')

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${url}`,
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
  BASE_URL
}