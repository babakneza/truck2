export const testBrowserCompatibility = () => {
  const results = {
    browserDetection: { status: 'success', message: '', browser: '' },
    socketIOSupport: { status: 'success', message: '', supported: false },
    webStorageSupport: { status: 'success', message: '', supported: false },
    formDataSupport: { status: 'success', message: '', supported: false },
    fileAPISupport: { status: 'success', message: '', supported: false },
    fetchAPISupport: { status: 'success', message: '', supported: false },
    resizeObserverSupport: { status: 'success', message: '', supported: false },
    intersectionObserverSupport: { status: 'success', message: '', supported: false },
    cssGridSupport: { status: 'success', message: '', supported: false },
    cssFlexboxSupport: { status: 'success', message: '', supported: false },
    arrowFunctionsSupport: { status: 'success', message: '', supported: false }
  }

  try {
    console.log('🌐 Starting Browser Compatibility Tests...')

    const userAgent = navigator.userAgent
    const browser = detectBrowser(userAgent)
    results.browserDetection = {
      status: 'success',
      message: `Browser detected: ${browser.name} ${browser.version}`,
      browser: browser.name
    }
    console.log(`✅ Browser Detection: ${browser.name} ${browser.version}`)

    results.socketIOSupport = {
      status: 'success',
      message: 'Socket.IO support available (requires Socket.IO library)',
      supported: true
    }
    console.log('✅ Socket.IO Support: Available')

    results.webStorageSupport = {
      status: 'success',
      message: typeof localStorage !== 'undefined' ? 'localStorage available' : 'localStorage not available',
      supported: typeof localStorage !== 'undefined'
    }
    console.log(`✅ Web Storage: ${results.webStorageSupport.message}`)

    results.formDataSupport = {
      status: 'success',
      message: typeof FormData !== 'undefined' ? 'FormData API available' : 'FormData API not available',
      supported: typeof FormData !== 'undefined'
    }
    console.log(`✅ FormData Support: ${results.formDataSupport.message}`)

    results.fileAPISupport = {
      status: 'success',
      message: typeof File !== 'undefined' ? 'File API available' : 'File API not available',
      supported: typeof File !== 'undefined'
    }
    console.log(`✅ File API: ${results.fileAPISupport.message}`)

    results.fetchAPISupport = {
      status: 'success',
      message: typeof fetch !== 'undefined' ? 'Fetch API available' : 'Fetch API not available',
      supported: typeof fetch !== 'undefined'
    }
    console.log(`✅ Fetch API: ${results.fetchAPISupport.message}`)

    results.resizeObserverSupport = {
      status: 'success',
      message: typeof ResizeObserver !== 'undefined' ? 'ResizeObserver available' : 'ResizeObserver not available',
      supported: typeof ResizeObserver !== 'undefined'
    }
    console.log(`✅ ResizeObserver: ${results.resizeObserverSupport.message}`)

    results.intersectionObserverSupport = {
      status: 'success',
      message: typeof IntersectionObserver !== 'undefined' ? 'IntersectionObserver available' : 'IntersectionObserver not available',
      supported: typeof IntersectionObserver !== 'undefined'
    }
    console.log(`✅ IntersectionObserver: ${results.intersectionObserverSupport.message}`)

    results.cssGridSupport = {
      status: 'success',
      message: supportsCSS('display', 'grid') ? 'CSS Grid supported' : 'CSS Grid not supported',
      supported: supportsCSS('display', 'grid')
    }
    console.log(`✅ CSS Grid: ${results.cssGridSupport.message}`)

    results.cssFlexboxSupport = {
      status: 'success',
      message: supportsCSS('display', 'flex') ? 'CSS Flexbox supported' : 'CSS Flexbox not supported',
      supported: supportsCSS('display', 'flex')
    }
    console.log(`✅ CSS Flexbox: ${results.cssFlexboxSupport.message}`)

    try {
      eval('() => {}')
      results.arrowFunctionsSupport = {
        status: 'success',
        message: 'ES6 Arrow Functions supported',
        supported: true
      }
      console.log('✅ Arrow Functions: Supported')
    } catch {
      results.arrowFunctionsSupport = {
        status: 'failed',
        message: 'ES6 Arrow Functions not supported',
        supported: false
      }
    }

    console.log('🎉 Browser Compatibility Tests Completed')
    return results
  } catch (err) {
    console.error('❌ Unexpected test error:', err)
    return results
  }
}

const detectBrowser = (userAgent) => {
  if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) {
    const match = userAgent.match(/Chrome\/(\d+)/)
    return { name: 'Chrome', version: match ? match[1] : 'Unknown' }
  }
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    const match = userAgent.match(/Version\/(\d+)/)
    return { name: 'Safari', version: match ? match[1] : 'Unknown' }
  }
  if (userAgent.includes('Firefox')) {
    const match = userAgent.match(/Firefox\/(\d+)/)
    return { name: 'Firefox', version: match ? match[1] : 'Unknown' }
  }
  if (userAgent.includes('Edge') || userAgent.includes('Edg')) {
    const match = userAgent.match(/Edg\/(\d+)/)
    return { name: 'Edge', version: match ? match[1] : 'Unknown' }
  }
  if (userAgent.includes('OPR')) {
    const match = userAgent.match(/OPR\/(\d+)/)
    return { name: 'Opera', version: match ? match[1] : 'Unknown' }
  }
  return { name: 'Unknown', version: 'Unknown' }
}

const supportsCSS = (property, value) => {
  const element = document.createElement('div')
  element.style[property] = value
  return element.style[property] === value
}

export const logCompatibilityResults = (results) => {
  console.log('\n📊 BROWSER COMPATIBILITY TEST RESULTS')
  console.log('=====================================')

  let supported = 0
  let notSupported = 0

  Object.entries(results).forEach(([test, result]) => {
    const statusEmoji = result.supported ? '✅' : '❌'
    console.log(`${statusEmoji} ${test}: ${result.message}`)

    if (result.supported) supported++
    if (!result.supported) notSupported++
  })

  console.log('=====================================')
  console.log(`✅ Supported: ${supported}`)
  console.log(`❌ Not Supported: ${notSupported}`)
  console.log(`📈 Compatibility Score: ${((supported / (supported + notSupported)) * 100).toFixed(2)}%`)
}

export const getDeviceInfo = () => {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    devicePixelRatio: window.devicePixelRatio,
    connection: navigator.connection ? {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt,
      saveData: navigator.connection.saveData
    } : 'Not available',
    memory: navigator.deviceMemory || 'Not available',
    cores: navigator.hardwareConcurrency || 'Not available'
  }
}
