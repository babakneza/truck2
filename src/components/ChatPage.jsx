import { ChatProvider } from '../context/ChatContext'
import ChatWindow from './ChatSystem/ChatWindow'
import './ChatPage.css'

export default function ChatPage() {
  return (
    <ChatProvider>
      <div className="chat-page">
        <ChatWindow />
      </div>
    </ChatProvider>
  )
}
