const API_ENV_KEY = 'apiEnv'
const CUSTOM_BASE_URL_KEY = 'customBaseUrl'

const BASE_URL_MAP = {
  local: 'http://127.0.0.1:8080',
  prod: 'https://ywsfs.cn'
}

const DEFAULT_API_ENV = 'prod'

function normalizeBaseUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '')
}

function getApiEnv() {
  const env = wx.getStorageSync(API_ENV_KEY)
  return BASE_URL_MAP[env] ? env : DEFAULT_API_ENV
}

function getBaseUrl() {
  const customBaseUrl = normalizeBaseUrl(wx.getStorageSync(CUSTOM_BASE_URL_KEY))
  if (customBaseUrl) {
    return customBaseUrl
  }

  return BASE_URL_MAP[getApiEnv()]
}

function setApiEnv(env) {
  if (!BASE_URL_MAP[env]) {
    throw new Error(`unsupported api env: ${env}`)
  }

  wx.setStorageSync(API_ENV_KEY, env)
}

function setCustomBaseUrl(url) {
  const normalized = normalizeBaseUrl(url)
  if (!normalized) {
    throw new Error('custom base url is empty')
  }

  wx.setStorageSync(CUSTOM_BASE_URL_KEY, normalized)
}

function clearCustomBaseUrl() {
  wx.removeStorageSync(CUSTOM_BASE_URL_KEY)
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
  BASE_URL_MAP,
  DEFAULT_API_ENV,
  getBaseUrl,
  getApiEnv,
  setApiEnv,
  setCustomBaseUrl,
  clearCustomBaseUrl,
  isAuthExpiredError
}