import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Toast from 'react-hot-toast'
import { FiCopy, FiExternalLink, FiShare2, FiTrash2, FiCode } from 'react-icons/fi'
import { formatDate, deleteDocument, getUserRole } from '../utils/documentService'
import { useAuthStore } from '../utils/authStore'

export default function DocumentCard({ doc, docId, onDocumentDeleted }) {
  const router = useRouter()
  const { user } = useAuthStore()
  const [copied, setCopied] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [showCodeModal, setShowCodeModal] = useState(false)

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/doc/${docId}`
  const joinCode = doc.code
  const participants = Object.entries(doc.participants || {})

  // Check if current user is owner
  useEffect(() => {
    const checkOwner = async () => {
      if (user) {
        const role = await getUserRole(docId, user.uid)
        setIsOwner(role === 'owner')
      }
    }
    checkOwner()
  }, [user, docId])

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(joinCode)
    Toast.success('Join code copied!')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl)
    Toast.success('Share link copied!')
  }

  const handleDeleteDocument = async () => {
    if (!isOwner) {
      Toast.error('Only document owner can delete')
      return
    }

    if (!window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteDocument(docId, user.uid)
      Toast.success('Document deleted successfully')
      // Refresh documents
      if (onDocumentDeleted) {
        onDocumentDeleted()
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      Toast.error(error.message || 'Failed to delete document')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="bg-dark-800 rounded-lg p-4 border border-dark-700 hover:border-dark-600 transition-colors flex flex-col h-full">
        <div className="mb-3 flex-1">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-white truncate flex-1">{doc.title}</h3>
            {isOwner && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteDocument()
                }}
                disabled={isDeleting}
                className="ml-2 p-1 text-red-400 hover:text-red-300 hover:bg-red-900 hover:bg-opacity-30 rounded transition-colors disabled:opacity-50"
                title="Delete document"
              >
                <FiTrash2 size={16} />
              </button>
            )}
          </div>
          <p className="text-sm text-gray-400">Last edited {formatDate(doc.lastEdited)}</p>
        </div>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="inline-block bg-blue-900 text-blue-200 px-2 py-1 rounded text-xs font-mono">
            {joinCode}
          </span>
          <span className="text-gray-500 text-xs">
            {participants.length} participant{participants.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Show first few participants */}
        {participants.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {participants.slice(0, 3).map(([userId, participantData]) => (
              <div key={userId} className="flex items-center gap-1">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                  participantData.role === 'owner' 
                    ? 'bg-yellow-900 text-yellow-200' 
                    : 'bg-blue-900 text-blue-200'
                }`}>
                  {participantData.role === 'owner' ? '👑' : '👤'}
                </span>
                <span className="text-xs text-gray-400 truncate max-w-xs" title={participantData.displayName}>
                  {participantData.displayName}
                </span>
              </div>
            ))}
            {participants.length > 3 && (
              <span className="text-xs text-gray-500">+{participants.length - 3} more</span>
            )}
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowCodeModal(true)
            }}
            className="flex-1 min-w-max flex items-center justify-center gap-1 px-3 py-2 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded text-sm transition-colors"
            title="Show share code"
          >
            <FiCode size={14} />
            <span className="hidden sm:inline">Code</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleCopyCode()
            }}
            className="flex-1 min-w-max flex items-center justify-center gap-1 px-3 py-2 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded text-sm transition-colors"
            title="Copy join code"
          >
            <FiCopy size={14} />
            <span className="hidden sm:inline">Copy</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleCopyLink()
            }}
            className="flex-1 min-w-max flex items-center justify-center gap-1 px-3 py-2 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded text-sm transition-colors"
            title="Copy share link"
          >
            <FiShare2 size={14} />
            <span className="hidden sm:inline">Link</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/doc/${docId}`)
            }}
            className="flex-1 min-w-max flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
            title="Open document"
          >
            <FiExternalLink size={14} />
            <span className="hidden sm:inline">Open</span>
          </button>
        </div>
      </div>

      {/* Code Share Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-lg p-6 max-w-md w-full border border-dark-700">
            <h2 className="text-xl font-bold text-white mb-4">Share Document</h2>
            
            <div className="space-y-4">
              {/* Join Code */}
              <div>
                <p className="text-sm text-gray-400 mb-2">Join Code</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinCode}
                    readOnly
                    className="flex-1 bg-dark-700 text-white px-3 py-2 rounded border border-dark-600 font-mono text-sm"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(joinCode)
                      Toast.success('Code copied!')
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Share this code with teammates. They can use it to join the document.
                </p>
              </div>

              {/* Share Link */}
              <div>
                <p className="text-sm text-gray-400 mb-2">Share Link</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 bg-dark-700 text-white px-3 py-2 rounded border border-dark-600 font-mono text-xs break-all"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl)
                      Toast.success('Link copied!')
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Share this link with teammates. They'll automatically join when they click it.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowCodeModal(false)}
              className="w-full mt-6 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}

