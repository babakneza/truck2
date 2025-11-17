import { useState } from 'react'
import { testChatSystem, logTestResults } from '../tests/chatSystem.test'
import { testReconnectionScenarios, logReconnectionResults } from '../tests/reconnection.test'
import { testPerformance, logPerformanceResults } from '../tests/performance.test'
import { testBrowserCompatibility, logCompatibilityResults, getDeviceInfo } from '../tests/compatibility.test'
import { getAuthToken, getStoredUser } from '../services/directusAuth'
import './ChatSystemTester.css'

export default function ChatSystemTester() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState(null)
  const [showResults, setShowResults] = useState(false)
  const [testType, setTestType] = useState('chat')

  const handleRunTests = async () => {
    setIsRunning(true)
    setShowResults(true)
    setResults(null)

    try {
      let testResults

      if (testType === 'chat') {
        const token = getAuthToken()
        const user = getStoredUser()

        if (!token || !user) {
          alert('Please log in first')
          setIsRunning(false)
          return
        }

        testResults = await testChatSystem(token, user.id)
        logTestResults(testResults)
      } else if (testType === 'reconnection') {
        const token = getAuthToken()
        const user = getStoredUser()

        if (!token || !user) {
          alert('Please log in first')
          setIsRunning(false)
          return
        }

        testResults = await testReconnectionScenarios(token, user.id)
        logReconnectionResults(testResults)
      } else if (testType === 'performance') {
        const token = getAuthToken()
        const user = getStoredUser()

        if (!token || !user) {
          alert('Please log in first')
          setIsRunning(false)
          return
        }

        testResults = await testPerformance(token, user.id)
        logPerformanceResults(testResults)
      } else if (testType === 'compatibility') {
        testResults = testBrowserCompatibility()
        logCompatibilityResults(testResults)

        const deviceInfo = getDeviceInfo()
        console.log('\n📱 DEVICE INFORMATION')
        console.log('====================')
        Object.entries(deviceInfo).forEach(([key, value]) => {
          if (typeof value === 'object') {
            console.log(`${key}: ${JSON.stringify(value, null, 2)}`)
          } else {
            console.log(`${key}: ${value}`)
          }
        })
      }

      setResults(testResults)
    } catch (err) {
      console.error('Test execution error:', err)
      alert('Error running tests: ' + err.message)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="chat-system-tester">
      <div className="tester-card">
        <h3>🧪 Chat System Tester</h3>
        <p>Run automated tests on the chat system functionality</p>

        <div className="test-type-selector">
          <label>Select Test Type:</label>
          <select
            value={testType}
            onChange={(e) => setTestType(e.target.value)}
            disabled={isRunning}
            className="test-type-select"
          >
            <option value="chat">💬 Chat System Tests</option>
            <option value="reconnection">🔄 Reconnection Tests</option>
            <option value="performance">⚡ Performance Tests</option>
            <option value="compatibility">🌐 Browser Compatibility Tests</option>
          </select>
        </div>

        <button
          onClick={handleRunTests}
          disabled={isRunning}
          className="test-button"
        >
          {isRunning ? '⏳ Running Tests...' : '▶️ Run Tests'}
        </button>

        {showResults && results && (
          <div className="test-results">
            <h4>📊 Test Results</h4>
            <div className="results-list">
              {Object.entries(results).map(([test, result]) => (
                <div
                  key={test}
                  className={`result-item result-${result.status}`}
                >
                  <span className="result-name">{test}</span>
                  <span className="result-status">{result.status}</span>
                  <span className="result-message">{result.message}</span>
                  {result.duration > 0 && (
                    <span className="result-duration">{result.duration.toFixed(2)}ms</span>
                  )}
                </div>
              ))}
            </div>

            {(() => {
              let passed = 0
              let failed = 0
              let skipped = 0

              Object.values(results).forEach((result) => {
                if (result.status === 'success') passed++
                if (result.status === 'failed') failed++
                if (result.status === 'skipped') skipped++
              })

              return (
                <div className="results-summary">
                  <p>✅ Passed: {passed}</p>
                  <p>❌ Failed: {failed}</p>
                  {skipped > 0 && <p>⏭️ Skipped: {skipped}</p>}
                  <p>📈 Success Rate: {((passed / (passed + failed)) * 100).toFixed(2)}%</p>
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
