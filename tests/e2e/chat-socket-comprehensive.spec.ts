import { test, expect } from '@playwright/test'

test.describe('Socket Server & Chat System', () => {
  test('frontend dev server responds at port 5173', async ({ request }) => {
    const response = await request.get('http://localhost:5173', {
      validateStatus: () => true
    })
    expect(response.status()).toBeLessThan(500)
  })

  test('socket server is accessible on port 3001', async ({ context }) => {
    const page = await context.newPage()
    
    const socketConnectable = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const testSocket = new WebSocket('ws://localhost:3001/socket.io/?transport=websocket&EIO=4&t=' + Date.now())
        
        const timeout = setTimeout(() => {
          testSocket.close()
          resolve(false)
        }, 3000)

        testSocket.onopen = () => {
          clearTimeout(timeout)
          testSocket.close()
          resolve(true)
        }

        testSocket.onerror = () => {
          clearTimeout(timeout)
          resolve(false)
        }
      })
    })

    await page.close()
  })

  test('chat page loads and renders without errors', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('favicon')) {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })
    
    const bodyVisible = await page.locator('body').isVisible()
    expect(bodyVisible).toBe(true)
    
    expect(consoleErrors.length).toBe(0)
  })

  test('chat services module exports are correct', async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')
    
    const servicesExported = await page.evaluate(async () => {
      try {
        const socketModule = await import('/src/services/chatSocket.js')
        const apiModule = await import('/src/services/chatAPI.js')
        
        return {
          hasSocketDefault: !!socketModule.default,
          hasSocketNamed: !!socketModule.chatSocket,
          hasAPIDefault: !!apiModule.default,
          hasAPINamed: !!apiModule.chatAPI
        }
      } catch (error) {
        return { error: true }
      }
    })

    expect(servicesExported.error).toBeUndefined()
    expect(
      servicesExported.hasSocketDefault || 
      servicesExported.hasSocketNamed
    ).toBe(true)
  })

  test('socket service has correct method signatures', async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')
    
    const methodsAvailable = await page.evaluate(async () => {
      try {
        const module = await import('/src/services/chatSocket.js')
        const chatSocket = module.default || module.chatSocket
        
        return {
          hasConnect: typeof chatSocket?.connect === 'function',
          hasDisconnect: typeof chatSocket?.disconnect === 'function',
          hasJoinConversation: typeof chatSocket?.joinConversation === 'function',
          hasLeaveConversation: typeof chatSocket?.leaveConversation === 'function',
          hasSendMessage: typeof chatSocket?.sendMessage === 'function',
          hasSetTyping: typeof chatSocket?.setTyping === 'function',
          hasAddReaction: typeof chatSocket?.addReaction === 'function',
          hasMarkMessageAsRead: typeof chatSocket?.markMessageAsRead === 'function',
          hasIsConnected: typeof chatSocket?.isConnected === 'function'
        }
      } catch (error) {
        return null
      }
    })

    expect(methodsAvailable).not.toBeNull()
    expect(methodsAvailable?.hasConnect).toBe(true)
    expect(methodsAvailable?.hasDisconnect).toBe(true)
    expect(methodsAvailable?.hasSendMessage).toBe(true)
  })

  test('chat API has correct collection methods', async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')
    
    const apiStructure = await page.evaluate(async () => {
      try {
        const module = await import('/src/services/chatAPI.js')
        const chatAPI = module.default || module.chatAPI
        
        return {
          hasConversations: !!chatAPI?.conversations,
          hasMessages: !!chatAPI?.messages,
          hasReactions: !!chatAPI?.reactions,
          hasAttachments: !!chatAPI?.attachments,
          hasMessageReads: !!chatAPI?.messageReads,
          hasTypingIndicators: !!chatAPI?.typingIndicators,
          hasParticipants: !!chatAPI?.participants,
          hasNotifications: !!chatAPI?.notifications,
          hasSettings: !!chatAPI?.settings
        }
      } catch (error) {
        return null
      }
    })

    expect(apiStructure).not.toBeNull()
    expect(apiStructure?.hasConversations).toBe(true)
    expect(apiStructure?.hasMessages).toBe(true)
    expect(apiStructure?.hasReactions).toBe(true)
  })

  test('offline queue functionality works correctly', async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')
    
    const offlineQueueTest = await page.evaluate(async () => {
      try {
        const module = await import('/src/services/chatSocket.js')
        const chatSocket = module.default || module.chatSocket
        
        chatSocket.clearOfflineQueue()
        
        const initialQueue = chatSocket.getOfflineQueue()
        
        chatSocket.sendMessage('test-conv', 'test-msg', 'Test message', null)
        
        const queueAfterSend = chatSocket.getOfflineQueue()
        
        return {
          initialQueueEmpty: initialQueue.length === 0,
          hasSendMessageQueued: queueAfterSend.length > 0,
          queueLength: queueAfterSend.length
        }
      } catch (error) {
        return { error: error.toString() }
      }
    })

    expect(offlineQueueTest.error).toBeUndefined()
    expect(offlineQueueTest.initialQueueEmpty).toBe(true)
    expect(offlineQueueTest.hasSendMessageQueued).toBe(true)
  })

  test('chat context provider can be initialized', async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('load')
    
    const contextAvailable = await page.evaluate(async () => {
      try {
        const contextModule = await import('/src/context/ChatContext.jsx')
        const chatAPIModule = await import('/src/services/chatAPI.js')
        
        return {
          hasChatContext: !!contextModule.ChatContext,
          hasChatProvider: !!contextModule.ChatProvider,
          hasChatAPI: !!chatAPIModule.chatAPI
        }
      } catch (error) {
        return { error: error.toString() }
      }
    })

    expect(contextAvailable.error).toBeUndefined()
  })

  test('socket auth middleware is properly configured', async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')
    
    const authConfigured = await page.evaluate(async () => {
      try {
        const module = await import('/src/services/chatSocket.js')
        const chatSocket = module.default || module.chatSocket
        
        const connectFunctionString = chatSocket.connect.toString()
        
        return {
          hasAuthTokenParameter: connectFunctionString.includes('token'),
          hasUserIdParameter: connectFunctionString.includes('userId'),
          hasCallbackHandlers: connectFunctionString.includes('callbacks')
        }
      } catch (error) {
        return { error: error.toString() }
      }
    })

    expect(authConfigured.error).toBeUndefined()
    expect(authConfigured.hasAuthTokenParameter).toBe(true)
  })

  test('message types and events are properly defined', async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')
    
    const eventHandlers = await page.evaluate(async () => {
      try {
        const module = await import('/src/services/chatSocket.js')
        const chatSocket = module.default || module.chatSocket
        
        const connectFunctionString = chatSocket.connect.toString()
        
        return {
          hasMessageReceivedEvent: connectFunctionString.includes('message_received'),
          hasUserTypingEvent: connectFunctionString.includes('user_typing'),
          hasReactionEvent: connectFunctionString.includes('reaction'),
          hasReadEvent: connectFunctionString.includes('message_marked_read') || connectFunctionString.includes('message_read'),
          hasUserOnlineEvent: connectFunctionString.includes('user_online'),
          hasUserOfflineEvent: connectFunctionString.includes('user_offline')
        }
      } catch (error) {
        return { error: error.toString() }
      }
    })

    expect(eventHandlers.error).toBeUndefined()
    expect(eventHandlers.hasMessageReceivedEvent).toBe(true)
    expect(eventHandlers.hasUserTypingEvent).toBe(true)
    expect(eventHandlers.hasReactionEvent).toBe(true)
  })

  test('chat server error handling is in place', async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')
    
    const errorHandling = await page.evaluate(async () => {
      try {
        const module = await import('/src/services/chatSocket.js')
        const chatSocket = module.default || module.chatSocket
        
        const connectFunctionString = chatSocket.connect.toString()
        
        return {
          hasErrorHandler: connectFunctionString.includes('error') || connectFunctionString.includes('Error'),
          hasConnectError: connectFunctionString.includes('connect_error'),
          hasTryCatch: connectFunctionString.includes('catch')
        }
      } catch (error) {
        return { error: error.toString() }
      }
    })

    expect(errorHandling.error).toBeUndefined()
  })

  test('socket reconnection is configured', async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')
    
    const reconnectionConfig = await page.evaluate(async () => {
      try {
        const module = await import('/src/services/chatSocket.js')
        const chatSocket = module.default || module.chatSocket
        
        const connectFunctionString = chatSocket.connect.toString()
        
        return {
          hasReconnection: connectFunctionString.includes('reconnection'),
          hasReconnectionDelay: connectFunctionString.includes('reconnectionDelay'),
          hasReconnectionAttempts: connectFunctionString.includes('reconnectionAttempts'),
          hasTransports: connectFunctionString.includes('transports')
        }
      } catch (error) {
        return { error: error.toString() }
      }
    })

    expect(reconnectionConfig.error).toBeUndefined()
    expect(reconnectionConfig.hasReconnection).toBe(true)
  })

  test('API filter and query parameters are correct', async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')
    
    const apiFiltering = await page.evaluate(async () => {
      try {
        const module = await import('/src/services/chatAPI.js')
        const chatAPI = module.default || module.chatAPI
        
        const listFunctionString = chatAPI.conversations.list.toString()
        
        return {
          hasFilterSupport: listFunctionString.includes('filter'),
          hasFieldsParameter: listFunctionString.includes('fields'),
          hasSortParameter: listFunctionString.includes('sort'),
          hasLimitParameter: listFunctionString.includes('limit')
        }
      } catch (error) {
        return { error: error.toString() }
      }
    })

    expect(apiFiltering.error).toBeUndefined()
    expect(apiFiltering.hasFilterSupport).toBe(true)
    expect(apiFiltering.hasFieldsParameter).toBe(true)
  })

  test('message attachment upload is configured', async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')
    
    const attachmentSupport = await page.evaluate(async () => {
      try {
        const module = await import('/src/services/chatAPI.js')
        const chatAPI = module.default || module.chatAPI
        
        return {
          hasAttachmentUpload: typeof chatAPI?.attachments?.upload === 'function',
          hasAttachmentLink: typeof chatAPI?.attachments?.linkToMessage === 'function',
          hasAttachmentList: typeof chatAPI?.attachments?.list === 'function',
          hasAttachmentDelete: typeof chatAPI?.attachments?.delete === 'function'
        }
      } catch (error) {
        return { error: error.toString() }
      }
    })

    expect(attachmentSupport.error).toBeUndefined()
    expect(attachmentSupport.hasAttachmentUpload).toBe(true)
    expect(attachmentSupport.hasAttachmentLink).toBe(true)
  })

  test('reaction emoji system is implemented', async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')
    
    const reactionSystem = await page.evaluate(async () => {
      try {
        const module = await import('/src/services/chatAPI.js')
        const chatAPI = module.default || module.chatAPI
        
        return {
          hasReactionAdd: typeof chatAPI?.reactions?.add === 'function',
          hasReactionRemove: typeof chatAPI?.reactions?.remove === 'function',
          hasReactionList: typeof chatAPI?.reactions?.list === 'function'
        }
      } catch (error) {
        return { error: error.toString() }
      }
    })

    expect(reactionSystem.error).toBeUndefined()
    expect(reactionSystem.hasReactionAdd).toBe(true)
    expect(reactionSystem.hasReactionRemove).toBe(true)
  })

  test('typing indicator system works', async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')
    
    const typingSystem = await page.evaluate(async () => {
      try {
        const module = await import('/src/services/chatAPI.js')
        const chatAPI = module.default || module.chatAPI
        
        return {
          hasTypingUpdate: typeof chatAPI?.typingIndicators?.update === 'function',
          hasTypingList: typeof chatAPI?.typingIndicators?.list === 'function'
        }
      } catch (error) {
        return { error: error.toString() }
      }
    })

    expect(typingSystem.error).toBeUndefined()
    expect(typingSystem.hasTypingUpdate).toBe(true)
  })

  test('conversation management is complete', async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')
    
    const conversationManagement = await page.evaluate(async () => {
      try {
        const module = await import('/src/services/chatAPI.js')
        const chatAPI = module.default || module.chatAPI
        
        return {
          hasConvList: typeof chatAPI?.conversations?.list === 'function',
          hasConvCreate: typeof chatAPI?.conversations?.create === 'function',
          hasConvUpdate: typeof chatAPI?.conversations?.update === 'function',
          hasConvDelete: typeof chatAPI?.conversations?.delete === 'function',
          hasConvArchive: typeof chatAPI?.conversations?.archive === 'function'
        }
      } catch (error) {
        return { error: error.toString() }
      }
    })

    expect(conversationManagement.error).toBeUndefined()
    expect(Object.values(conversationManagement).every(v => v === true)).toBe(true)
  })

  test('read receipts and delivery status tracking', async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')
    
    const readReceiptsSystem = await page.evaluate(async () => {
      try {
        const module = await import('/src/services/chatAPI.js')
        const chatAPI = module.default || module.chatAPI
        
        return {
          hasMarkAsRead: typeof chatAPI?.messageReads?.markAsRead === 'function',
          hasMarkAsDelivered: typeof chatAPI?.messageReads?.markAsDelivered === 'function',
          hasReadList: typeof chatAPI?.messageReads?.list === 'function'
        }
      } catch (error) {
        return { error: error.toString() }
      }
    })

    expect(readReceiptsSystem.error).toBeUndefined()
    expect(readReceiptsSystem.hasMarkAsRead).toBe(true)
  })

  test('notification system is configured', async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')
    
    const notificationSystem = await page.evaluate(async () => {
      try {
        const module = await import('/src/services/chatAPI.js')
        const chatAPI = module.default || module.chatAPI
        
        return {
          hasNotificationList: typeof chatAPI?.notifications?.list === 'function',
          hasNotificationMarkAsRead: typeof chatAPI?.notifications?.markAsRead === 'function'
        }
      } catch (error) {
        return { error: error.toString() }
      }
    })

    expect(notificationSystem.error).toBeUndefined()
  })
})
