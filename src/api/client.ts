import axios from 'axios'
import { refreshToken } from './auth'
import { createLogger } from '../utils/logger'

const log = createLogger('api-client')

const REFRESH_KEY = 'scalefish_refresh_token'

const client = axios.create({
  baseURL: 'https://jinelei.asia/api',
  headers: { 'Content-Type': 'application/json' },
  paramsSerializer: { indexes: null },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('scalefish_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  log.debug('Request: %s %s', config.method?.toUpperCase(), config.url)
  return config
})

let isRefreshing = false
let pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

function processQueue(error: unknown, token: string | null) {
  pendingQueue.forEach((p) => {
    if (error) {
      p.reject(error)
    } else {
      p.resolve(token!)
    }
  })
  pendingQueue = []
}

client.interceptors.response.use(
  (res) => {
    log.debug('Response: %d %s %s', res.status, res.config.method?.toUpperCase(), res.config.url)
    return res
  },
  async (err) => {
    const originalRequest = err.config
    if (originalRequest.url === '/auth/refresh') {
      return Promise.reject(err)
    }

    if (err.response?.status === 401 && !originalRequest._retry) {
      log.warn('Received 401, attempting token refresh')
      const refreshTokenStr = localStorage.getItem(REFRESH_KEY)
      if (!refreshTokenStr) {
        log.warn('No refresh token available, redirecting to login')
        localStorage.removeItem('scalefish_access_token')
        localStorage.removeItem(REFRESH_KEY)
        window.location.href = '/login'
        return Promise.reject(err)
      }

      if (isRefreshing) {
        log.debug('Token refresh already in progress, queueing request')
        return new Promise((resolve, reject) => {
          pendingQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`
              resolve(client(originalRequest))
            },
            reject,
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const res = await refreshToken(refreshTokenStr)
        const { accessToken, refreshToken: newRefresh } = res.data
        localStorage.setItem('scalefish_access_token', accessToken)
        localStorage.setItem(REFRESH_KEY, newRefresh)
        log.info('Token refreshed successfully')
        processQueue(null, accessToken)
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return client(originalRequest)
      } catch (e) {
        log.error('Token refresh failed:', e)
        processQueue(e, null)
        localStorage.removeItem('scalefish_access_token')
        localStorage.removeItem(REFRESH_KEY)
        window.location.href = '/login'
        return Promise.reject(e)
      } finally {
        isRefreshing = false
      }
    }

    const msg = err.response?.data?.message || err.message || 'Network error'
    log.warn('Request failed: %s %s - %s', err.config?.method?.toUpperCase(), err.config?.url, msg)
    return Promise.reject(new Error(msg))
  },
)

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export default client
