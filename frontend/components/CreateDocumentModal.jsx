import { useState } from 'react'
import { useRouter } from 'next/router'
import { createNewDocument } from '../utils/documentService'
import { useAuthStore } from '../utils/authStore'
import Toast from 'react-hot-toast'
import { FiPlus, FiX } from 'react-icons/fi'

export default function CreateDocumentModal({ isOpen, onClose, onDocumentCreated }) {
  const [loading, setLoading] = useState(false)
  const [docName, setDocName] = useState('')
  const router = useRouter()
  const { user } = useAuthStore()

  const handleCreate = async () => {
    if (!docName.trim()) {
      Toast.error('Please enter a document name')
      return
    }

    setLoading(true)
    try {
      const { id, code } = await createNewDocument(user.uid, user.email, user.displayName)
      
      // Update document with custom name
      const { doc, updateDoc } = await import('firebase/firestore')
      const { db } = await import('../utils/firebase')
      await updateDoc(doc(db, 'docs', id), { title: docName })

      Toast.success('Document created!')
      onDocumentCreated()
      setDocName('')
      onClose()
      
      // Redirect to editor
      router.push(`/doc/${id}`)
    } catch (error) {
      console.error('Error:', error)
      Toast.error('Failed to create document')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="sketchy-card p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-sketch text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">
            📝 Create Document
          </h2>
          <button
            onClick={onClose}
            className="text-gray-700 hover:text-orange-600 transition-colors p-1"
          >
            <FiX size={24} />
          </button>
        </div>

        <input
          type="text"
          value={docName}
          onChange={(e) => setDocName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="Enter document name..."
          className="sketchy-input w-full mb-6"
          disabled={loading}
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
            onClick={handleCreate}
            className="sketchy-button px-6 py-2 flex items-center gap-2 hover:shadow-sketchy-hover"
            disabled={loading}
          >
            <FiPlus size={18} />
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
