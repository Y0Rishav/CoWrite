import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../utils/authStore'
import { db } from '../utils/firebase'
import { doc, updateDoc, onSnapshot } from 'firebase/firestore'
import Toast from 'react-hot-toast'
import { FiEdit, FiEye, FiBold, FiItalic, FiCode, FiList, FiLink2, FiType, FiType2 } from 'react-icons/fi'
import ParticipantPresence from './ParticipantPresence'
import MarkdownPreview from './MarkdownPreview'
import { updateUserPresence, removeUserPresence, keepPresenceAlive } from '../utils/presenceService'

export default function CollaborativeEditor({ docId, docTitle }) {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [viewMode, setViewMode] = useState('edit') // 'edit' or 'split'
  const [isSaving, setIsSaving] = useState(false)
  const [fontSize, setFontSize] = useState('sm')
  const syncTimeoutRef = useRef(null)
  const lastSavedRef = useRef('')
  const presenceIntervalRef = useRef(null)
  const textareaRef = useRef(null)

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

  // Text formatting utilities
  const insertMarkdown = (before, after = '') => {
    if (!textareaRef.current) return
    
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end) || 'text'
    
    const newContent = 
      content.substring(0, start) + 
      before + selectedText + after + 
      content.substring(end)
    
    setContent(newContent)
    
    // Update cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.selectionStart = start + before.length
      textarea.selectionEnd = start + before.length + selectedText.length
    }, 0)
  }

  const handleBold = () => insertMarkdown('**', '**')
  const handleItalic = () => insertMarkdown('*', '*')
  const handleCode = () => insertMarkdown('`', '`')
  const handleLink = () => insertMarkdown('[', '](https://example.com)')
  const handleHeading = (level) => insertMarkdown(`${'#'.repeat(level)} `)
  const handleBulletList = () => insertMarkdown('- ')
  const handleNumberedList = () => insertMarkdown('1. ')
  const handleCodeBlock = () => insertMarkdown('```\n', '\n```')
  const handleQuote = () => insertMarkdown('> ')

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch(e.key.toLowerCase()) {
        case 'b':
          e.preventDefault()
          handleBold()
          break
        case 'i':
          e.preventDefault()
          handleItalic()
          break
        case 'k':
          e.preventDefault()
          handleLink()
          break
        case 'e':
          e.preventDefault()
          handleCode()
          break
        default:
          break
      }
    }
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
      {/* Main Toolbar */}
      <div className="bg-dark-800 border-b border-dark-700 px-4 py-3 flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-white truncate">{docTitle}</h2>
          {isSaving && (
            <span className="text-xs text-gray-400 animate-pulse">Saving...</span>
          )}
        </div>
        <div className="flex gap-3 items-center flex-wrap">
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

      {/* Formatting Toolbar */}
      <div className="bg-dark-800 border-b border-dark-700 px-4 py-2 flex gap-1 flex-wrap items-center overflow-x-auto">
        <div className="flex gap-1 border-r border-dark-700 pr-2">
          <button
            onClick={handleBold}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded transition-colors"
            title="Bold (Ctrl+B)"
          >
            <FiBold size={16} />
          </button>
          <button
            onClick={handleItalic}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded transition-colors"
            title="Italic (Ctrl+I)"
          >
            <FiItalic size={16} />
          </button>
          <button
            onClick={handleCode}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded transition-colors"
            title="Inline Code (Ctrl+E)"
          >
            <FiCode size={16} />
          </button>
        </div>

        <div className="flex gap-1 border-r border-dark-700 pr-2">
          <button
            onClick={() => handleHeading(1)}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded transition-colors text-sm font-bold"
            title="Heading 1"
          >
            H1
          </button>
          <button
            onClick={() => handleHeading(2)}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded transition-colors text-sm font-bold"
            title="Heading 2"
          >
            H2
          </button>
          <button
            onClick={() => handleHeading(3)}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded transition-colors text-sm font-bold"
            title="Heading 3"
          >
            H3
          </button>
        </div>

        <div className="flex gap-1 border-r border-dark-700 pr-2">
          <button
            onClick={handleLink}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded transition-colors"
            title="Link (Ctrl+K)"
          >
            <FiLink2 size={16} />
          </button>
          <button
            onClick={handleBulletList}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded transition-colors"
            title="Bullet List"
          >
            <FiList size={16} />
          </button>
          <button
            onClick={handleNumberedList}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded transition-colors text-sm font-bold"
            title="Numbered List"
          >
            1.
          </button>
        </div>

        <div className="flex gap-1 border-r border-dark-700 pr-2">
          <button
            onClick={handleCodeBlock}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded transition-colors text-xs font-mono"
            title="Code Block"
          >
            &lt;/&gt;
          </button>
          <button
            onClick={handleQuote}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded transition-colors font-bold"
            title="Quote"
          >
            "
          </button>
        </div>

        <div className="flex gap-1 items-center">
          <label className="text-xs text-gray-400 mr-2">Font Size:</label>
          <select
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
            className="bg-dark-700 text-gray-300 px-2 py-1 rounded text-sm border border-dark-600 focus:outline-none"
          >
            <option value="xs">XS</option>
            <option value="sm">Small</option>
            <option value="base">Normal</option>
            <option value="lg">Large</option>
            <option value="xl">XL</option>
          </select>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Text Editor */}
        <div className={`flex-1 overflow-hidden ${viewMode === 'split' ? '' : 'w-full'}`}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder="Start typing... Supports Markdown! Use Ctrl+B for bold, Ctrl+I for italic, Ctrl+K for links, Ctrl+E for code"
            className={`w-full h-full bg-dark-900 text-white p-4 resize-none focus:outline-none font-mono text-${fontSize}`}
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
