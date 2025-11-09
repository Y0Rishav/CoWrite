import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuthStore } from '../../utils/authStore'
import { db } from '../../utils/firebase'
import { doc, getDoc } from 'firebase/firestore'
import CollaborativeEditor from '../../components/CollaborativeEditor'
import Toast from 'react-hot-toast'
import { FiArrowLeft } from 'react-icons/fi'

export default function EditorPage() {
  const router = useRouter()
  const { id } = router.query
  const { user, loading: authLoading } = useAuthStore()
  const [docData, setDocData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check auth
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  // Load document
  useEffect(() => {
    const loadDocument = async () => {
      if (!id || !user) return

      try {
        const docRef = doc(db, 'docs', id)
        const snapshot = await getDoc(docRef)

        if (!snapshot.exists()) {
          setError('Document not found')
          Toast.error('Document not found')
          return
        }

        const data = snapshot.data()

        // Check if user is a participant
        if (!data.participants[user.uid]) {
          setError('You do not have access to this document')
          Toast.error('Access denied')
          return
        }

        setDocData(data)
      } catch (err) {
        console.error('Error loading document:', err)
        setError('Failed to load document')
        Toast.error('Failed to load document')
      } finally {
        setLoading(false)
      }
    }

    loadDocument()
  }, [id, user])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading document...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-900">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg mx-auto"
          >
            <FiArrowLeft size={18} />
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!docData) {
    return null
  }

  return (
    <div className="h-screen bg-dark-900 flex flex-col">
      {/* Back Button */}
      <div className="bg-dark-800 border-b border-dark-700 px-4 py-3">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <FiArrowLeft size={18} />
          <span>Back to Dashboard</span>
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <CollaborativeEditor docId={id} docTitle={docData.title} />
      </div>
    </div>
  )
}
