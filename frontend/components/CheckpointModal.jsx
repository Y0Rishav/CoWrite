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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg shadow-2xl p-6 w-full max-w-md border border-dark-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FiCheckCircle className="text-green-500" size={20} />
            <h3 className="text-xl font-semibold text-white">Create Checkpoint</h3>
          </div>
          <button
            onClick={() => {
              onClose()
              setMessage('')
            }}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Message explaining feature */}
        <p className="text-sm text-gray-400 mb-4">
          Save a checkpoint with a descriptive message. This will create a named milestone in your version history.
        </p>

        {/* Input field */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g., Fixed typos in section 2, Added new graphics, Final draft ready..."
          className="w-full bg-dark-900 text-white border border-dark-700 rounded p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 resize-none"
          rows={4}
          disabled={isSaving}
          autoFocus
        />

        {/* Character count */}
        <div className="text-xs text-gray-500 mb-4">
          {message.length} characters
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => {
              onClose()
              setMessage('')
            }}
            disabled={isSaving}
            className="px-4 py-2 rounded bg-dark-700 text-gray-300 hover:bg-dark-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !message.trim()}
            className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
        <div className="mt-4 pt-3 border-t border-dark-700">
          <p className="text-xs text-gray-500">
            💡 Tip: Press Ctrl+Enter to save quickly. Checkpoints show in version history with your message.
          </p>
        </div>
      </div>
    </div>
  )
}
