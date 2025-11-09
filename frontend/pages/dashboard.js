import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuthStore } from '../utils/authStore'
import { fetchUserDocuments } from '../utils/documentService'
import { useDocStore } from '../utils/docStore'
import CreateDocumentModal from '../components/CreateDocumentModal'
import JoinDocumentModal from '../components/JoinDocumentModal'
import DocumentCard from '../components/DocumentCard'
import Toast from 'react-hot-toast'
import { FiPlus, FiLogOut, FiLink } from 'react-icons/fi'
import { signOut } from 'firebase/auth'
import { auth } from '../utils/firebase'

export default function Dashboard() {
  const router = useRouter()
  const { user, loading: authLoading, logout } = useAuthStore()
  const { docs, loading: docsLoading, setDocs } = useDocStore()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)

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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-600 mx-auto mb-6"></div>
          <p className="font-handlee text-gray-700 text-xl">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* Header */}
      <div className="sketchy-container border-b border-orange-300 shadow-sketchy">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="animate-slide-in-left">
              <h1 className="font-sketch text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">
                CoWrite.AI
              </h1>
              <p className="font-handlee text-gray-700 text-lg mt-2">
                👋 Welcome, {user.displayName}!
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="sketchy-button flex items-center gap-2 px-4 py-2 hover:shadow-sketchy-hover animate-slide-in-right"
            >
              <FiLogOut size={18} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Action Buttons */}
        <div className="mb-8 flex gap-4 flex-wrap animate-slide-down">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="sketchy-button flex items-center gap-2 px-6 py-3 hover:shadow-sketchy-hover"
          >
            <FiPlus size={22} />
            <span className="text-lg">Create Document</span>
          </button>
          <button
            onClick={() => setIsJoinModalOpen(true)}
            className="sketchy-button flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-400 to-emerald-500 border-emerald-700 hover:shadow-sketchy-hover"
          >
            <FiLink size={22} />
            <span className="text-lg">Join with Code</span>
          </button>
        </div>

        {/* Documents Grid */}
        {docsLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-600 mx-auto mb-6"></div>
            <p className="font-handlee text-gray-700 text-xl">Loading your documents...</p>
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center py-12 sketchy-card p-8">
            <p className="font-handlee text-gray-700 text-lg mb-6">
              📝 No documents yet. Create one to get started!
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="sketchy-button inline-flex items-center gap-2 px-6 py-2"
              >
                <FiPlus size={20} />
                Create Document
              </button>
              <button
                onClick={() => setIsJoinModalOpen(true)}
                className="sketchy-button inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-400 to-emerald-500 border-emerald-700"
              >
                <FiLink size={20} />
                Join Document
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {docs.map((doc, index) => (
              <div key={doc.id} className="animate-slide-in-left" style={{animationDelay: `${index * 0.1}s`}}>
                <DocumentCard 
                  doc={doc} 
                  docId={doc.id} 
                  onDocumentDeleted={loadDocuments}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateDocumentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onDocumentCreated={handleDocumentCreated}
      />
      <JoinDocumentModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />
    </div>
  )
}
