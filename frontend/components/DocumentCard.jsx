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
      <div className="sketchy-card p-6 flex flex-col h-full hover:shadow-sketchy-lg transition-shadow">
        <div className="mb-4 flex-1">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-sketch text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 truncate flex-1">
              {doc.title}
            </h3>
            {isOwner && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteDocument()
                }}
                disabled={isDeleting}
                className="ml-2 p-2 text-red-600 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 font-handlee"
                title="Delete document"
              >
                <FiTrash2 size={18} />
              </button>
            )}
          </div>
          <p className="font-handlee text-gray-700 text-sm">
            📅 Last edited {formatDate(doc.lastEdited)}
          </p>
        </div>

        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="sketchy-badge font-mono text-xs">
            {joinCode}
          </span>
          <span className="font-handlee text-gray-700 text-sm">
            👥 {participants.length} participant{participants.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Show first few participants */}
        {participants.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {participants.slice(0, 3).map(([userId, participantData]) => (
              <div key={userId} className="flex items-center gap-2 bg-gradient-to-r from-amber-100 to-yellow-100 px-3 py-1 rounded-lg">
                <span className="text-lg">
                  {participantData.role === 'owner' ? '👑' : '👤'}
                </span>
                <span className="font-handlee text-sm text-gray-700 truncate max-w-xs" title={participantData.displayName}>
                  {participantData.displayName}
                </span>
              </div>
            ))}
            {participants.length > 3 && (
              <span className="font-handlee text-sm text-gray-600">+{participants.length - 3} more</span>
            )}
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowCodeModal(true)
            }}
            className="flex-1 min-w-max flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-r from-amber-200 to-yellow-200 hover:from-amber-300 hover:to-yellow-300 text-gray-800 rounded-lg font-sketch font-bold transition-all text-sm"
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
            className="flex-1 min-w-max flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-r from-amber-200 to-yellow-200 hover:from-amber-300 hover:to-yellow-300 text-gray-800 rounded-lg font-sketch font-bold transition-all text-sm"
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
            className="flex-1 min-w-max flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-r from-amber-200 to-yellow-200 hover:from-amber-300 hover:to-yellow-300 text-gray-800 rounded-lg font-sketch font-bold transition-all text-sm"
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
            className="sketchy-button flex-1 min-w-max flex items-center justify-center gap-1 px-3 py-2 text-sm"
            title="Open document"
          >
            <FiExternalLink size={14} />
            <span className="hidden sm:inline">Open</span>
          </button>
        </div>
      </div>

      {/* Code Share Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="sketchy-card p-8 max-w-md w-full">
            <h2 className="font-sketch text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 mb-6">
              📤 Share Document
            </h2>
            
            <div className="space-y-6">
              {/* Join Code */}
              <div>
                <p className="font-sketch font-bold text-gray-800 mb-2 text-lg">Join Code</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinCode}
                    readOnly
                    className="sketchy-input flex-1 font-mono text-sm"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(joinCode)
                      Toast.success('Code copied!')
                    }}
                    className="sketchy-button px-4 py-2"
                  >
                    Copy
                  </button>
                </div>
                <p className="font-handlee text-gray-700 mt-2 text-sm">
                  Share this code with teammates. They can use it to join the document.
                </p>
              </div>

              {/* Share Link */}
              <div>
                <p className="font-sketch font-bold text-gray-800 mb-2 text-lg">Share Link</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="sketchy-input flex-1 font-mono text-xs break-all"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl)
                      Toast.success('Link copied!')
                    }}
                    className="sketchy-button px-4 py-2"
                  >
                    Copy
                  </button>
                </div>
                <p className="font-handlee text-gray-700 mt-2 text-sm">
                  Share this link with teammates. They'll automatically join when they click it.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowCodeModal(false)}
              className="w-full mt-6 px-4 py-2 bg-gradient-to-r from-amber-200 to-yellow-200 hover:from-amber-300 hover:to-yellow-300 text-gray-800 rounded-lg font-sketch font-bold transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}

