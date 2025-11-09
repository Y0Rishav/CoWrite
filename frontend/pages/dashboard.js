import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuthStore } from '../utils/authStore'
import { fetchUserDocuments } from '../utils/documentService'
import { useDocStore } from '../utils/docStore'
import CreateDocumentModal from '../components/CreateDocumentModal'
import DocumentCard from '../components/DocumentCard'
import Toast from 'react-hot-toast'
import { FiPlus, FiLogOut } from 'react-icons/fi'
import { signOut } from 'firebase/auth'
import { auth } from '../utils/firebase'

export default function Dashboard() {
  const router = useRouter()
  const { user, loading: authLoading, logout } = useAuthStore()
  const { docs, loading: docsLoading, setDocs } = useDocStore()
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      loadDocuments()
    }
  }, [user])

  const loadDocuments = async () => {
    if (!user) return
    try {
      const userDocs = await fetchUserDocuments(user.uid)
      setDocs(userDocs)
    } catch (error) {
      console.error('Error loading documents:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      logout()
      Toast.success('Signed out')
      router.push('/')
    } catch (error) {
      Toast.error('Failed to sign out')
    }
  }

  const handleDocumentCreated = () => {
    loadDocuments()
  }

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <div className="bg-dark-800 border-b border-dark-700">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">CoWrite.AI</h1>
              <p className="text-gray-400 text-sm mt-1">Welcome, {user.displayName}!</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded-lg transition-colors"
            >
              <FiLogOut size={18} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Create Document Button */}
        <div className="mb-8">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            <FiPlus size={20} />
            Create New Document
          </button>
        </div>

        {/* Documents Grid */}
        {docsLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-gray-400">Loading your documents...</p>
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center py-12 bg-dark-800 rounded-lg border border-dark-700">
            <p className="text-gray-400 mb-4">No documents yet. Create one to get started!</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <FiPlus size={18} />
              Create First Document
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {docs.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} docId={doc.id} />
            ))}
          </div>
        )}
      </div>

      {/* Create Document Modal */}
      <CreateDocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDocumentCreated={handleDocumentCreated}
      />
    </div>
  )
}
