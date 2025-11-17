import './Reactions.css'

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😠', '🔥', '👏', '🎉', '💯']

export default function Reactions({ onSelectEmoji }) {
  return (
    <div className="reactions-picker">
      <div className="reactions-grid">
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            className="reaction-button"
            onClick={() => onSelectEmoji({ emoji })}
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}
