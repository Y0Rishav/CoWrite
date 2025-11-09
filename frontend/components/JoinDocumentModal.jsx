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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="sketchy-card p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-sketch text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">
            🔗 Join Document
          </h2>
          <button
            onClick={onClose}
            className="text-gray-700 hover:text-orange-600 transition-colors p-1"
          >
            <FiX size={24} />
          </button>
        </div>

        <p className="font-handlee text-gray-700 text-lg mb-4">
          Enter the 6-character join code to access a shared document.
        </p>

        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
          placeholder="e.g., ABC123"
          maxLength="6"
          className="sketchy-input w-full mb-6 text-center font-mono text-2xl tracking-widest"
          disabled={loading}
          autoFocus
        />

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-amber-200 to-yellow-200 hover:from-amber-300 hover:to-yellow-300 text-gray-800 font-sketch font-bold transition-all disabled:opacity-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleJoin}
            className="sketchy-button px-6 py-2 hover:shadow-sketchy-hover disabled:opacity-50"
            disabled={loading || code.length !== 6}
          >
            {loading ? 'Joining...' : 'Join'}
          </button>
        </div>
      </div>
    </div>
  )
}
