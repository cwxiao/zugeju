const { request } = require('./request')

function loginWithWechat(profile = {}) {
  return new Promise((resolve, reject) => {
    wx.login({
      success: async (loginRes) => {
        if (!loginRes.code) {
          reject(new Error('wx.login failed'))
          return
        }

        try {
          const data = await request({
            url: '/api/auth/wechat-login',
            method: 'POST',
            auth: false,
            data: {
              code: loginRes.code,
              nickname: profile.nickname || '微信用户',
              avatarUrl: isRemoteAvatarUrl(profile.avatarUrl) ? profile.avatarUrl : '',
              phoneCode: profile.phoneCode || ''
            }
          })

          const user = {
            ...data.user,
            nickname: profile.nickname || data.user.nickname,
            avatarUrl: profile.avatarUrl || data.user.avatarUrl || ''
          }

          wx.setStorageSync('token', data.token)
          wx.setStorageSync('user', user)
          wx.setStorageSync('profile', {
            nickname: user.nickname,
            avatarUrl: user.avatarUrl
          })
          resolve({
            ...data,
            user
          })
        } catch (error) {
          reject(error)
        }
      },
      fail: reject
    })
  })
}

function isRemoteAvatarUrl(value) {
  return /^https?:\/\//.test(value || '') && !value.startsWith('http://tmp')
}

module.exports = {
  loginWithWechat
}