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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Create New Document</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
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
          className="w-full bg-dark-700 text-white px-4 py-2 rounded-lg border border-dark-600 focus:border-blue-500 focus:outline-none mb-4"
          disabled={loading}
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
            onClick={handleCreate}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
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
