import chatAPI from '../services/chatAPI'
import chatSocket from '../services/chatSocket'

export const testChatSystem = async (token, userId) => {
  const results = {
    socketConnection: { status: 'pending', message: '' },
    conversationFetch: { status: 'pending', message: '' },
    messageCreation: { status: 'pending', message: '' },
    messageFetch: { status: 'pending', message: '' },
    readReceipts: { status: 'pending', message: '' },
    reactions: { status: 'pending', message: '' },
    typing: { status: 'pending', message: '' }
  }

  try {
    console.log('🔍 Starting Chat System Tests...')

    await new Promise(resolve => setTimeout(resolve, 1000))

    try {
      console.log('📌 Test 1: Socket Connection')
      await chatSocket.connect(token, userId)
      results.socketConnection = {
        status: 'success',
        message: 'Socket.io connected successfully'
      }
      console.log('✅ Socket Connection: PASSED')
    } catch (err) {
      results.socketConnection = {
        status: 'failed',
        message: `Socket connection failed: ${err.message}`
      }
      console.error('❌ Socket Connection: FAILED', err)
    }

    try {
      console.log('📌 Test 2: Fetch Conversations')
      const conversations = await chatAPI.getConversations(token, userId)
      results.conversationFetch = {
        status: 'success',
        message: `Fetched ${conversations.length} conversations`
      }
      console.log('✅ Fetch Conversations: PASSED', conversations.length)
    } catch (err) {
      results.conversationFetch = {
        status: 'failed',
        message: `Fetch conversations failed: ${err.message}`
      }
      console.error('❌ Fetch Conversations: FAILED', err)
    }

    try {
      console.log('📌 Test 3: Create Message')
      const conversations = await chatAPI.getConversations(token, userId)
      if (conversations.length > 0) {
        const testMessage = await chatAPI.sendMessage(
          token,
          conversations[0].id,
          userId,
          'Test message from chat system test',
          []
        )
        results.messageCreation = {
          status: 'success',
          message: `Message created with ID: ${testMessage.id}`
        }
        console.log('✅ Message Creation: PASSED', testMessage.id)
      } else {
        results.messageCreation = {
          status: 'skipped',
          message: 'No conversations available for message creation test'
        }
      }
    } catch (err) {
      results.messageCreation = {
        status: 'failed',
        message: `Message creation failed: ${err.message}`
      }
      console.error('❌ Message Creation: FAILED', err)
    }

    try {
      console.log('📌 Test 4: Fetch Messages')
      const conversations = await chatAPI.getConversations(token, userId)
      if (conversations.length > 0) {
        const messages = await chatAPI.getMessages(token, conversations[0].id, 0, 10)
        results.messageFetch = {
          status: 'success',
          message: `Fetched ${messages.length} messages`
        }
        console.log('✅ Fetch Messages: PASSED', messages.length)
      } else {
        results.messageFetch = {
          status: 'skipped',
          message: 'No conversations available for message fetch test'
        }
      }
    } catch (err) {
      results.messageFetch = {
        status: 'failed',
        message: `Fetch messages failed: ${err.message}`
      }
      console.error('❌ Fetch Messages: FAILED', err)
    }

    try {
      console.log('📌 Test 5: Mark Message as Read')
      const conversations = await chatAPI.getConversations(token, userId)
      if (conversations.length > 0) {
        const messages = await chatAPI.getMessages(token, conversations[0].id, 0, 1)
        if (messages.length > 0) {
          await chatAPI.markMessageAsRead(token, messages[0].id, userId)
          results.readReceipts = {
            status: 'success',
            message: 'Message marked as read'
          }
          console.log('✅ Read Receipts: PASSED')
        }
      }
    } catch (err) {
      results.readReceipts = {
        status: 'failed',
        message: `Read receipt failed: ${err.message}`
      }
      console.error('❌ Read Receipts: FAILED', err)
    }

    try {
      console.log('📌 Test 6: Add Reaction')
      const conversations = await chatAPI.getConversations(token, userId)
      if (conversations.length > 0) {
        const messages = await chatAPI.getMessages(token, conversations[0].id, 0, 1)
        if (messages.length > 0) {
          await chatAPI.addReaction(token, messages[0].id, userId, '👍')
          results.reactions = {
            status: 'success',
            message: 'Reaction added successfully'
          }
          console.log('✅ Reactions: PASSED')
        }
      }
    } catch (err) {
      results.reactions = {
        status: 'failed',
        message: `Reaction failed: ${err.message}`
      }
      console.error('❌ Reactions: FAILED', err)
    }

    try {
      console.log('📌 Test 7: Typing Indicator')
      const conversations = await chatAPI.getConversations(token, userId)
      if (conversations.length > 0 && chatSocket.socket) {
        chatSocket.socket.emit('user_typing', {
          conversation_id: conversations[0].id,
          userId: userId
        })
        await new Promise(resolve => setTimeout(resolve, 500))
        chatSocket.socket.emit('user_stopped_typing', {
          conversation_id: conversations[0].id,
          userId: userId
        })
        results.typing = {
          status: 'success',
          message: 'Typing indicators emitted successfully'
        }
        console.log('✅ Typing Indicator: PASSED')
      }
    } catch (err) {
      results.typing = {
        status: 'failed',
        message: `Typing indicator failed: ${err.message}`
      }
      console.error('❌ Typing Indicator: FAILED', err)
    }

    console.log('🎉 Chat System Tests Completed')
    return results
  } catch (err) {
    console.error('❌ Unexpected test error:', err)
    return results
  }
}

export const logTestResults = (results) => {
  console.log('\n📊 TEST RESULTS SUMMARY')
  console.log('=======================')
  let passed = 0
  let failed = 0
  let skipped = 0

  Object.entries(results).forEach(([test, result]) => {
    const statusEmoji = result.status === 'success' ? '✅' : result.status === 'failed' ? '❌' : '⏭️'
    console.log(`${statusEmoji} ${test}: ${result.message}`)

    if (result.status === 'success') passed++
    if (result.status === 'failed') failed++
    if (result.status === 'skipped') skipped++
  })

  console.log('=======================')
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`⏭️  Skipped: ${skipped}`)
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(2)}%`)
}
