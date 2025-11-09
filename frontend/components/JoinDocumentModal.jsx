import { useState } from 'react'
import { useRouter } from 'next/router'
import { useAuthStore } from '../utils/authStore'
import { findDocumentByCode, joinDocument } from '../utils/documentService'
import Toast from 'react-hot-toast'
import { FiX } from 'react-icons/fi'

export default function JoinDocumentModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState('')
  const router = useRouter()
  const { user } = useAuthStore()

  const handleJoin = async () => {
    if (!code.trim()) {
      Toast.error('Please enter a join code')
      return
    }

    setLoading(true)
    try {
      // Find document by code
      const doc = await findDocumentByCode(code)

      if (!doc) {
        Toast.error('Invalid join code')
        setLoading(false)
        return
      }

      // Add user to document
      await joinDocument(doc.id, user.uid, user.email, user.displayName)

      Toast.success('Successfully joined document!')
      setCode('')
      onClose()

      // Redirect to document
      router.push(`/doc/${doc.id}`)
    } catch (error) {
      console.error('Error:', error)
      Toast.error(error.message || 'Failed to join document')
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Join Document</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        <p className="text-gray-400 text-sm mb-4">
          Enter the 6-character join code to access a shared document.
        </p>

        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
          placeholder="e.g., ABC123"
          maxLength="6"
          className="w-full bg-dark-700 text-white px-4 py-2 rounded-lg border border-dark-600 focus:border-blue-500 focus:outline-none mb-4 text-center font-mono text-lg tracking-widest"
          disabled={loading}
          autoFocus
        />

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-dark-700 text-gray-300 hover:bg-dark-600 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleJoin}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={loading || code.length !== 6}
          >
            {loading ? 'Joining...' : 'Join'}
          </button>
        </div>
      </div>
    </div>
  )
}
