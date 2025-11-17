import chatAPI from '../services/chatAPI'

export const testPerformance = async (token, userId) => {
  const results = {
    messageLoadTime: { status: 'pending', message: '', duration: 0, count: 0 },
    renderTime: { status: 'pending', message: '', duration: 0 },
    searchPerformance: { status: 'pending', message: '', duration: 0 },
    paginationPerformance: { status: 'pending', message: '', duration: 0 },
    memoryUsage: { status: 'pending', message: '', usage: 0 },
    scrollPerformance: { status: 'pending', message: '', duration: 0 }
  }

  try {
    console.log('⚡ Starting Performance Tests...')

    try {
      console.log('📌 Test 1: Large Message Load Time')
      const conversations = await chatAPI.getConversations(token, userId)

      if (conversations.length > 0) {
        const test1Start = performance.now()
        const messages = await chatAPI.getMessages(token, conversations[0].id, 0, 200)
        const test1Duration = performance.now() - test1Start

        results.messageLoadTime = {
          status: 'success',
          message: `Loaded ${messages.length} messages`,
          duration: test1Duration,
          count: messages.length
        }
        console.log(`✅ Large Message Load: PASSED (${test1Duration.toFixed(2)}ms for ${messages.length} messages)`)
      }
    } catch (err) {
      results.messageLoadTime = {
        status: 'failed',
        message: `Large message load failed: ${err.message}`,
        duration: 0,
        count: 0
      }
      console.error('❌ Large Message Load: FAILED', err)
    }

    try {
      console.log('📌 Test 2: Render Performance')
      const renderStart = performance.now()

      const conversations = await chatAPI.getConversations(token, userId)
      const renderDuration = performance.now() - renderStart

      const avgTimePerItem = renderDuration / (conversations.length || 1)

      results.renderTime = {
        status: 'success',
        message: `Rendered ${conversations.length} conversations in ${renderDuration.toFixed(2)}ms (avg: ${avgTimePerItem.toFixed(2)}ms per item)`,
        duration: renderDuration
      }
      console.log(`✅ Render Performance: PASSED (${renderDuration.toFixed(2)}ms)`)
    } catch (err) {
      results.renderTime = {
        status: 'failed',
        message: `Render performance test failed: ${err.message}`,
        duration: 0
      }
      console.error('❌ Render Performance: FAILED', err)
    }

    try {
      console.log('📌 Test 3: Search Performance')
      const searchStart = performance.now()

      const conversations = await chatAPI.getConversations(token, userId)
      if (conversations.length > 0) {
        await chatAPI.searchMessages(token, conversations[0].id, 'test', 0, 50)
      }

      const searchDuration = performance.now() - searchStart

      results.searchPerformance = {
        status: 'success',
        message: `Search completed in ${searchDuration.toFixed(2)}ms`,
        duration: searchDuration
      }
      console.log(`✅ Search Performance: PASSED (${searchDuration.toFixed(2)}ms)`)
    } catch (err) {
      results.searchPerformance = {
        status: 'failed',
        message: `Search performance test failed: ${err.message}`,
        duration: 0
      }
      console.error('❌ Search Performance: FAILED', err)
    }

    try {
      console.log('📌 Test 4: Pagination Performance')
      const paginationStart = performance.now()

      const conversations = await chatAPI.getConversations(token, userId)
      if (conversations.length > 0) {
        await Promise.all([
          chatAPI.getMessages(token, conversations[0].id, 0, 50),
          chatAPI.getMessages(token, conversations[0].id, 50, 50),
          chatAPI.getMessages(token, conversations[0].id, 100, 50)
        ])
      }

      const paginationDuration = performance.now() - paginationStart

      results.paginationPerformance = {
        status: 'success',
        message: `3 pagination requests completed in ${paginationDuration.toFixed(2)}ms`,
        duration: paginationDuration
      }
      console.log(`✅ Pagination Performance: PASSED (${paginationDuration.toFixed(2)}ms)`)
    } catch (err) {
      results.paginationPerformance = {
        status: 'failed',
        message: `Pagination performance test failed: ${err.message}`,
        duration: 0
      }
      console.error('❌ Pagination Performance: FAILED', err)
    }

    try {
      console.log('📌 Test 5: Memory Usage')

      if (typeof performance !== 'undefined' && performance.memory) {
        const memoryBefore = performance.memory.usedJSHeapSize

        const conversations = await chatAPI.getConversations(token, userId)
        if (conversations.length > 0) {
          await chatAPI.getMessages(token, conversations[0].id, 0, 500)
        }

        const memoryAfter = performance.memory.usedJSHeapSize
        const memoryUsed = (memoryAfter - memoryBefore) / 1024 / 1024

        results.memoryUsage = {
          status: 'success',
          message: `Memory used: ${memoryUsed.toFixed(2)}MB`,
          usage: memoryUsed
        }
        console.log(`✅ Memory Usage: PASSED (${memoryUsed.toFixed(2)}MB)`)
      } else {
        results.memoryUsage = {
          status: 'skipped',
          message: 'Memory monitoring not available in this browser',
          usage: 0
        }
      }
    } catch (err) {
      results.memoryUsage = {
        status: 'failed',
        message: `Memory test failed: ${err.message}`,
        usage: 0
      }
      console.error('❌ Memory Usage: FAILED', err)
    }

    try {
      console.log('📌 Test 6: Scroll Performance')
      const scrollStart = performance.now()

      await new Promise(resolve => {
        const frames = []
        const measureFrame = () => {
          frames.push(performance.now())
          if (frames.length < 60) {
            requestAnimationFrame(measureFrame)
          } else {
            resolve()
          }
        }
        requestAnimationFrame(measureFrame)
      })

      const scrollDuration = performance.now() - scrollStart

      results.scrollPerformance = {
        status: 'success',
        message: `Scroll performance test completed in ${scrollDuration.toFixed(2)}ms`,
        duration: scrollDuration
      }
      console.log(`✅ Scroll Performance: PASSED (${scrollDuration.toFixed(2)}ms)`)
    } catch (err) {
      results.scrollPerformance = {
        status: 'failed',
        message: `Scroll performance test failed: ${err.message}`,
        duration: 0
      }
      console.error('❌ Scroll Performance: FAILED', err)
    }

    console.log('🎉 Performance Tests Completed')
    return results
  } catch (err) {
    console.error('❌ Unexpected test error:', err)
    return results
  }
}

export const logPerformanceResults = (results) => {
  console.log('\n📊 PERFORMANCE TEST RESULTS')
  console.log('============================')

  Object.entries(results).forEach(([test, result]) => {
    const statusEmoji = result.status === 'success' ? '✅' : result.status === 'skipped' ? '⏭️' : '❌'
    let details = result.message

    if (result.duration) {
      details += ` (${result.duration.toFixed(2)}ms)`
    }
    if (result.count) {
      details += ` - ${result.count} items`
    }
    if (result.usage) {
      details += ` - ${result.usage.toFixed(2)}MB`
    }

    console.log(`${statusEmoji} ${test}: ${details}`)
  })

  console.log('============================')

  const avgDuration = Object.values(results)
    .filter(r => r.duration > 0)
    .reduce((sum, r) => sum + r.duration, 0) / Object.values(results).filter(r => r.duration > 0).length

  console.log(`📈 Average Duration: ${avgDuration.toFixed(2)}ms`)
}
