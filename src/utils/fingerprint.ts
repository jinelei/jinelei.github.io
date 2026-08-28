import { createLogger } from './logger'

const log = createLogger('fingerprint')

type FeatureMap = Record<string, string>

function getWebglInfo(): { vendor: string; renderer: string } {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null
    if (!gl) return { vendor: '', renderer: '' }
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    if (!debugInfo) return { vendor: '', renderer: '' }
    return {
      vendor: String(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || ''),
      renderer: String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || ''),
    }
  } catch (e) {
    log.warn('WebGL fingerprint collection failed: %o', e)
    return { vendor: '', renderer: '' }
  }
}

let cached: FeatureMap | null = null

export function collectFingerprintFeatures(): FeatureMap {
  if (cached) return cached

  const features: FeatureMap = {}
  const nav = navigator as Navigator & { deviceMemory?: number; userAgentData?: { platform?: string; mobile?: boolean } }

  const ua = nav.userAgent || ''
  features.userAgent = ua

  const uaPlatform = nav.userAgentData?.platform
  features.platform = uaPlatform || nav.platform || ''
  features.language = nav.language || (nav.languages || []).join(',')
  features.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
  features.timezoneOffset = String(new Date().getTimezoneOffset())

  features.screenResolution = `${window.screen.width}x${window.screen.height}x${window.devicePixelRatio || 1}`
  features.colorDepth = String(window.screen.colorDepth || '')
  features.cpuCores = String(nav.hardwareConcurrency || '')
  features.hardwareConcurrency = String(nav.hardwareConcurrency || '')
  features.deviceMemory = nav.deviceMemory !== undefined ? String(nav.deviceMemory) : ''

  features.touchSupport = (('ontouchstart' in window) || nav.maxTouchPoints > 0)
    ? `touch:${nav.maxTouchPoints || 0}`
    : 'no-touch'

  const webgl = getWebglInfo()
  features.webglVendor = webgl.vendor
  features.webglRenderer = webgl.renderer

  cached = features
  log.debug('Fingerprint features collected: %d fields', Object.keys(features).length)
  return features
}
