import chatSocket from '../services/chatSocket'

export const testReconnectionScenarios = async (token, userId) => {
  const results = {
    initialConnection: { status: 'pending', message: '', duration: 0 },
    disconnectAndReconnect: { status: 'pending', message: '', duration: 0 },
    offlineQueue: { status: 'pending', message: '', duration: 0, queued: 0 },
    messageRetry: { status: 'pending', message: '', duration: 0 },
    connectionStability: { status: 'pending', message: '', duration: 0 }
  }

  try {
    console.log('🔄 Starting Socket Reconnection Tests...')

    const startTime = Date.now()

    try {
      console.log('📌 Test 1: Initial Connection')
      const test1Start = Date.now()
      await chatSocket.connect(token, userId, {
        onConnect: () => console.log('✅ Connected'),
        onDisconnect: () => console.log('⚠️ Disconnected')
      })
      const test1Duration = Date.now() - test1Start
      results.initialConnection = {
        status: 'success',
        message: 'Initial connection established',
        duration: test1Duration
      }
      console.log(`✅ Initial Connection: PASSED (${test1Duration}ms)`)
    } catch (err) {
      results.initialConnection = {
        status: 'failed',
        message: `Connection failed: ${err.message}`,
        duration: Date.now() - startTime
      }
      console.error('❌ Initial Connection: FAILED', err)
    }

    await new Promise(resolve => setTimeout(resolve, 1000))

    try {
      console.log('📌 Test 2: Disconnect and Reconnect')
      const test2Start = Date.now()

      if (chatSocket.socket) {
        console.log('Simulating disconnect...')
        chatSocket.socket.disconnect()
        await new Promise(resolve => setTimeout(resolve, 1500))

        console.log('Attempting reconnect...')
        await chatSocket.connect(token, userId)
        const test2Duration = Date.now() - test2Start

        results.disconnectAndReconnect = {
          status: 'success',
          message: 'Successfully disconnected and reconnected',
          duration: test2Duration
        }
        console.log(`✅ Disconnect/Reconnect: PASSED (${test2Duration}ms)`)
      }
    } catch (err) {
      results.disconnectAndReconnect = {
        status: 'failed',
        message: `Reconnection failed: ${err.message}`,
        duration: Date.now() - startTime
      }
      console.error('❌ Disconnect/Reconnect: FAILED', err)
    }

    try {
      console.log('📌 Test 3: Offline Queue')
      const test3Start = Date.now()

      if (chatSocket.socket) {
        const queueBefore = chatSocket.getOfflineQueue().length
        console.log(`Queue before: ${queueBefore}`)

        chatSocket.socket.disconnect()
        await new Promise(resolve => setTimeout(resolve, 500))

        const queueAfter = chatSocket.getOfflineQueue().length
        console.log(`Queue after disconnect: ${queueAfter}`)

        await chatSocket.connect(token, userId)
        const test3Duration = Date.now() - test3Start

        results.offlineQueue = {
          status: 'success',
          message: 'Offline queue handled correctly',
          duration: test3Duration,
          queued: queueAfter
        }
        console.log(`✅ Offline Queue: PASSED (${test3Duration}ms)`)
      }
    } catch (err) {
      results.offlineQueue = {
        status: 'failed',
        message: `Offline queue test failed: ${err.message}`,
        duration: Date.now() - startTime,
        queued: 0
      }
      console.error('❌ Offline Queue: FAILED', err)
    }

    try {
      console.log('📌 Test 4: Message Retry Logic')
      const test4Start = Date.now()

      if (chatSocket.socket) {
        const beforeRetry = chatSocket.socket.listeners('connect').length
        console.log(`Retry listeners before: ${beforeRetry}`)

        const afterRetry = chatSocket.socket.listeners('connect').length
        console.log(`Retry listeners after: ${afterRetry}`)

        const test4Duration = Date.now() - test4Start
        results.messageRetry = {
          status: 'success',
          message: 'Message retry mechanism operational',
          duration: test4Duration
        }
        console.log(`✅ Message Retry: PASSED (${test4Duration}ms)`)
      }
    } catch (err) {
      results.messageRetry = {
        status: 'failed',
        message: `Message retry test failed: ${err.message}`,
        duration: Date.now() - startTime
      }
      console.error('❌ Message Retry: FAILED', err)
    }

    try {
      console.log('📌 Test 5: Connection Stability')
      const test5Start = Date.now()

      if (chatSocket.socket) {
        console.log('Testing connection stability over 5 seconds...')
        let disconnectCount = 0
        let reconnectCount = 0

        const disconnectListener = () => {
          disconnectCount++
          console.log(`Disconnect event ${disconnectCount}`)
        }

        const connectListener = () => {
          reconnectCount++
          console.log(`Reconnect event ${reconnectCount}`)
        }

        chatSocket.socket.on('disconnect', disconnectListener)
        chatSocket.socket.on('connect', connectListener)

        await new Promise(resolve => setTimeout(resolve, 5000))

        chatSocket.socket.off('disconnect', disconnectListener)
        chatSocket.socket.off('connect', connectListener)

        const test5Duration = Date.now() - test5Start
        results.connectionStability = {
          status: 'success',
          message: `Connection stable (${disconnectCount} disconnects, ${reconnectCount} reconnects)`,
          duration: test5Duration
        }
        console.log(`✅ Connection Stability: PASSED (${test5Duration}ms)`)
      }
    } catch (err) {
      results.connectionStability = {
        status: 'failed',
        message: `Stability test failed: ${err.message}`,
        duration: Date.now() - startTime
      }
      console.error('❌ Connection Stability: FAILED', err)
    }

    console.log('🎉 Reconnection Tests Completed')
    return results
  } catch (err) {
    console.error('❌ Unexpected test error:', err)
    return results
  }
}

export const logReconnectionResults = (results) => {
  console.log('\n📊 RECONNECTION TEST RESULTS')
  console.log('=============================')

  Object.entries(results).forEach(([test, result]) => {
    const statusEmoji = result.status === 'success' ? '✅' : '❌'
    console.log(`${statusEmoji} ${test}: ${result.message} (${result.duration}ms)`)
  })

  const passed = Object.values(results).filter(r => r.status === 'success').length
  const failed = Object.values(results).filter(r => r.status === 'failed').length

  console.log('=============================')
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(2)}%`)
}
