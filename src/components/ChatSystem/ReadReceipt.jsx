import { Check, CheckCheck } from 'lucide-react'
import './ReadReceipt.css'

export default function ReadReceipt({ isRead, isDelivered }) {
  return (
    <span className="read-receipt" title={isRead ? 'Read' : isDelivered ? 'Delivered' : 'Sent'}>
      {isRead ? (
        <CheckCheck size={14} className="read-icon" />
      ) : isDelivered ? (
        <Check size={14} className="delivered-icon" />
      ) : (
        <Check size={14} className="sent-icon" />
      )}
    </span>
  )
}
