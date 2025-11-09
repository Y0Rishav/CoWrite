import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../utils/authStore'
import { db } from '../utils/firebase'
import { doc, updateDoc, onSnapshot } from 'firebase/firestore'
import Toast from 'react-hot-toast'
import { FiEdit, FiEye } from 'react-icons/fi'
import ParticipantPresence from './ParticipantPresence'
import { updateUserPresence, removeUserPresence, keepPresenceAlive } from '../utils/presenceService'

export default function CollaborativeEditor({ docId, docTitle }) {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [viewMode, setViewMode] = useState('edit') // 'edit' or 'split'
  const [isSaving, setIsSaving] = useState(false)
  const syncTimeoutRef = useRef(null)
  const lastSavedRef = useRef('')
  const presenceIntervalRef = useRef(null)

  // Initialize and sync with Firestore + presence
  useEffect(() => {
    if (!docId || !user) return

    try {
      const docRef = doc(db, 'docs', docId)
      
      // Update user presence when entering document
      updateUserPresence(docId, user.uid, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      })

      // Keep presence alive every 10 seconds
      presenceIntervalRef.current = setInterval(() => {
        keepPresenceAlive(docId, user.uid, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        })
      }, 10000)
      
      // Listen for real-time updates
      const unsubscribe = onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data()
          const firestoreContent = data.content || ''
          
          // Only update if content differs from what we just saved
          if (firestoreContent !== lastSavedRef.current) {
            setContent(firestoreContent)
            lastSavedRef.current = firestoreContent
          }
        }
        setLoading(false)
      })

      // Cleanup on unmount
      return () => {
        unsubscribe()
        clearInterval(presenceIntervalRef.current)
        removeUserPresence(docId, user.uid)
      }
    } catch (error) {
      console.error('Error initializing editor:', error)
      setLoading(false)
    }
  }, [docId, user])

  const handleContentChange = (e) => {
    const newContent = e.target.value
    setContent(newContent)

    // Debounced save to Firestore
    clearTimeout(syncTimeoutRef.current)
    setIsSaving(true)
    
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        const docRef = doc(db, 'docs', docId)
        await updateDoc(docRef, {
          content: newContent,
          lastEdited: new Date(),
        })
        lastSavedRef.current = newContent
        setIsSaving(false)
      } catch (error) {
        console.error('Error saving content:', error)
        Toast.error('Failed to save changes')
        setIsSaving(false)
      }
    }, 2000) // Save after 2 seconds of inactivity
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading editor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-dark-900">
      {/* Toolbar */}
      <div className="bg-dark-800 border-b border-dark-700 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-white truncate">{docTitle}</h2>
          {isSaving && (
            <span className="text-xs text-gray-400 animate-pulse">Saving...</span>
          )}
        </div>
        <div className="flex gap-3 items-center">
          <ParticipantPresence docId={docId} />
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('edit')}
              className={`flex items-center gap-2 px-3 py-1 rounded transition-colors ${
                viewMode === 'edit'
                  ? 'bg-blue-600 text-white'
                  : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
              }`}
            >
              <FiEdit size={16} />
              <span className="hidden sm:inline text-sm">Edit</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-2 px-3 py-1 rounded transition-colors ${
                viewMode === 'split'
                  ? 'bg-blue-600 text-white'
                  : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
              }`}
            >
              <FiEye size={16} />
              <span className="hidden sm:inline text-sm">Preview</span>
            </button>
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Text Editor */}
        <div className={`flex-1 overflow-hidden ${viewMode === 'split' ? '' : 'w-full'}`}>
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder="Start typing... Supports Markdown!"
            className="w-full h-full bg-dark-900 text-white p-4 resize-none focus:outline-none font-mono text-sm"
            spellCheck="false"
          />
        </div>

        {/* Markdown Preview */}
        {viewMode === 'split' && (
          <div className="flex-1 border-l border-dark-700 overflow-auto p-4 bg-dark-800">
            <MarkdownPreview content={content} />
          </div>
        )}
      </div>
    </div>
  )
}
