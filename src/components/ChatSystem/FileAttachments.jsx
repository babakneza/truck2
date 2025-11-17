import { Download, File } from 'lucide-react'
import { useChatContext } from '../../context/ChatContext'
import './FileAttachments.css'

const getFileIcon = (fileType) => {
  if (fileType.includes('image')) return '🖼️'
  if (fileType.includes('pdf')) return '📄'
  if (fileType.includes('video')) return '🎥'
  if (fileType.includes('audio')) return '🎵'
  if (fileType.includes('word') || fileType.includes('document')) return '📝'
  if (fileType.includes('sheet') || fileType.includes('excel')) return '📊'
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('archive')) return '📦'
  return '📎'
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

export default function FileAttachments({ attachments }) {
  const { downloadFile } = useChatContext()

  if (!attachments || attachments.length === 0) return null

  return (
    <div className="file-attachments">
      {attachments.map((attachment) => (
        <div key={attachment.id} className="attachment-card">
          <div className="attachment-icon">
            {getFileIcon(attachment.file_type)}
          </div>
          <div className="attachment-info">
            <p className="attachment-name">{attachment.file_name}</p>
            <p className="attachment-size">{formatFileSize(attachment.file_size)}</p>
          </div>
          <button
            className="attachment-download"
            onClick={() => downloadFile(attachment.file_id, attachment.file_name)}
            title="Download file"
            aria-label={`Download ${attachment.file_name}`}
          >
            <Download size={18} />
          </button>
        </div>
      ))}
    </div>
  )
}
