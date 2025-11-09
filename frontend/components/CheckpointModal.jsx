import { useState } from 'react'
import { FiX, FiCheckCircle } from 'react-icons/fi'
import Toast from 'react-hot-toast'

export default function CheckpointModal({ isOpen, onClose, onSave, isSaving = false }) {
  const [message, setMessage] = useState('')

  const handleSave = async () => {
    if (!message.trim()) {
      Toast.error('Please enter a checkpoint message')
      return
    }

    try {
      await onSave(message.trim())
      setMessage('')
      onClose()
    } catch (error) {
      console.error('Error saving checkpoint:', error)
      Toast.error('Failed to save checkpoint')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave()
    }
    if (e.key === 'Escape') {
      onClose()
      setMessage('')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="sketchy-card shadow-sketchy-lg p-8 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FiCheckCircle className="text-green-600" size={24} />
            <h3 className="font-sketch text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
              Create Checkpoint
            </h3>
          </div>
          <button
            onClick={() => {
              onClose()
              setMessage('')
            }}
            className="text-gray-700 hover:text-orange-600 transition-colors p-1"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Message explaining feature */}
        <p className="font-handlee text-gray-700 mb-4 text-lg leading-relaxed">
          📌 Save a checkpoint with a descriptive message. This will create a named milestone in your version history.
        </p>

        {/* Input field */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g., Fixed typos in section 2, Added new graphics, Final draft ready..."
          className="sketchy-input w-full mb-4 font-handlee resize-none"
          rows={4}
          disabled={isSaving}
          autoFocus
        />

        {/* Character count */}
        <div className="font-handlee text-sm text-gray-700 mb-4">
          ✏️ {message.length} characters
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 justify-end mb-4">
          <button
            onClick={() => {
              onClose()
              setMessage('')
            }}
            disabled={isSaving}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-amber-200 to-yellow-200 hover:from-amber-300 hover:to-yellow-300 font-sketch font-bold text-gray-800 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !message.trim()}
            className="sketchy-button px-6 py-2 bg-gradient-to-r from-green-400 to-emerald-500 border-emerald-700 flex items-center gap-2 hover:shadow-sketchy-hover disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <FiCheckCircle size={16} />
                Save Checkpoint
              </>
            )}
          </button>
        </div>

        {/* Helpful hint */}
        <div className="pt-3 border-t-2 border-dashed border-orange-300">
          <p className="font-handlee text-sm text-gray-700">
            💡 Tip: Press Ctrl+Enter to save quickly. Checkpoints show in version history with your message.
          </p>
        </div>
      </div>
    </div>
  )
}
