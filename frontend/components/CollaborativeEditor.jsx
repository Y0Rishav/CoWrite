import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../utils/authStore'
import { db } from '../utils/firebase'
import { doc, updateDoc, onSnapshot } from 'firebase/firestore'
import Toast from 'react-hot-toast'
import { FiEdit, FiEye, FiBold, FiItalic, FiCode, FiList, FiLink2, FiType, FiType2, FiGitBranch, FiSave, FiFlag, FiZap } from 'react-icons/fi'
import ParticipantPresence from './ParticipantPresence'
import MarkdownPreview from './MarkdownPreview'
import VersionHistory from './VersionHistory'
import CheckpointModal from './CheckpointModal'
import AIEditingModal from './AIEditingModal'
import { updateUserPresence, removeUserPresence, keepPresenceAlive } from '../utils/presenceService'
import { createVersionSnapshot } from '../utils/versionService'

export default function CollaborativeEditor({ docId, docTitle }) {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [viewMode, setViewMode] = useState('edit') // 'edit' or 'split'
  const [isSaving, setIsSaving] = useState(false)
  const [fontSize, setFontSize] = useState('sm')
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [showCheckpointModal, setShowCheckpointModal] = useState(false)
  const [isSavingCheckpoint, setIsSavingCheckpoint] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [selectionStart, setSelectionStart] = useState(0)
  const [docData, setDocData] = useState({ title: docTitle })
  const syncTimeoutRef = useRef(null)
  const versionTimeoutRef = useRef(null)
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
          
          // Store document data for versioning
          setDocData({
            title: data.title || docTitle,
            content: firestoreContent,
          })
          
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

    // Debounced save to Firestore with version snapshots
    clearTimeout(syncTimeoutRef.current)
    clearTimeout(versionTimeoutRef.current)
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

        // Create version snapshot periodically
        versionTimeoutRef.current = setTimeout(async () => {
          try {
            await createVersionSnapshot(
              docId,
              user.uid,
              user.displayName,
              newContent,
              docData.title || docTitle,
              'Auto-save'
            )
          } catch (error) {
            console.error('Error creating version snapshot:', error)
          }
        }, 30000)
      } catch (error) {
        console.error('Error saving content:', error)
        Toast.error('Failed to save changes')
        setIsSaving(false)
      }
    }, 500)
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

  // Handle text selection for AI editing
  const handleTextSelection = () => {
    if (!textareaRef.current) return
    const textarea = textareaRef.current
    const selected = content.substring(textarea.selectionStart, textarea.selectionEnd)
    
    if (selected.length > 0) {
      setSelectedText(selected)
      setSelectionStart(textarea.selectionStart)
      setShowAIModal(true)
    } else {
      Toast.error('Please select some text first')
    }
  }

  // Apply AI-edited text to the document
  const handleApplyAIEdit = (editedText) => {
    if (!textareaRef.current) return
    const textarea = textareaRef.current
    const newContent = 
      content.substring(0, selectionStart) +
      editedText +
      content.substring(selectionStart + selectedText.length)
    
    setContent(newContent)
    Toast.success('Text updated!')
  }

  // Handle checkpoint/commit save
  const handleCheckpointSave = async (message) => {
    if (!user || !docId) return

    setIsSavingCheckpoint(true)
    try {
      // First, save current content to Firestore
      const docRef = doc(db, 'docs', docId)
      await updateDoc(docRef, {
        content: content,
        lastEdited: new Date(),
      })
      lastSavedRef.current = content

      // Then create a checkpoint version with custom message
      await createVersionSnapshot(
        docId,
        user.uid,
        user.displayName,
        content,
        docData.title || docTitle,
        `Checkpoint: ${message}`
      )

      Toast.success('Checkpoint saved successfully! ✓')
    } catch (error) {
      console.error('Error saving checkpoint:', error)
      Toast.error('Failed to save checkpoint')
      throw error
    } finally {
      setIsSavingCheckpoint(false)
    }
  }

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
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse-save"></div>
              <span className="text-xs text-blue-400 animate-pulse-save">Saving...</span>
            </div>
          )}
          {!isSaving && lastSavedRef.current && (
            <span className="text-xs text-gray-500">✓ Saved</span>
          )}
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          <ParticipantPresence docId={docId} />
          <button
            onClick={() => setShowCheckpointModal(true)}
            className="flex items-center gap-2 px-3 py-1 rounded transition-all duration-200 transform hover:scale-105 active:scale-95 bg-green-600 hover:bg-green-700 text-white"
            title="Save checkpoint with message"
          >
            <FiFlag size={16} />
            <span className="hidden sm:inline text-sm">Checkpoint</span>
          </button>
          <button
            onClick={() => setShowVersionHistory(true)}
            className="flex items-center gap-2 px-3 py-1 rounded transition-all duration-200 transform hover:scale-105 active:scale-95 bg-purple-600 hover:bg-purple-700 text-white"
            title="View version history"
          >
            <FiGitBranch size={16} />
            <span className="hidden sm:inline text-sm">History</span>
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('edit')}
              className={`flex items-center gap-2 px-3 py-1 rounded transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                viewMode === 'edit'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
              }`}
            >
              <FiEdit size={16} />
              <span className="hidden sm:inline text-sm">Edit</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-2 px-3 py-1 rounded transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                viewMode === 'split'
                  ? 'bg-blue-600 text-white shadow-lg'
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
        {/* AI Editing Button */}
        <button
          onClick={handleTextSelection}
          className="p-2 text-gray-400 hover:text-white hover:bg-purple-700 bg-dark-700 rounded transition-all duration-200 transform hover:scale-110 active:scale-95 toolbar-item border border-purple-600"
          title="Select text and use AI editing tools"
        >
          <FiZap size={16} />
        </button>

        <div className="flex gap-1 border-r border-dark-700 pr-2">
          <button
            onClick={handleBold}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded transition-all duration-200 transform hover:scale-110 active:scale-95 toolbar-item"
            title="Bold (Ctrl+B)"
          >
            <FiBold size={16} />
          </button>
          <button
            onClick={handleItalic}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded transition-all duration-200 transform hover:scale-110 active:scale-95 toolbar-item"
            title="Italic (Ctrl+I)"
          >
            <FiItalic size={16} />
          </button>
          <button
            onClick={handleCode}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded transition-all duration-200 transform hover:scale-110 active:scale-95 toolbar-item"
            title="Inline Code (Ctrl+E)"
          >
            <FiCode size={16} />
          </button>
        </div>

        <div className="flex gap-1 border-r border-dark-700 pr-2">
          <button
            onClick={() => handleHeading(1)}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded transition-all duration-200 transform hover:scale-110 active:scale-95 toolbar-item text-sm font-bold"
            title="Heading 1"
          >
            H1
          </button>
          <button
            onClick={() => handleHeading(2)}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded transition-all duration-200 transform hover:scale-110 active:scale-95 toolbar-item text-sm font-bold"
            title="Heading 2"
          >
            H2
          </button>
          <button
            onClick={() => handleHeading(3)}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded transition-all duration-200 transform hover:scale-110 active:scale-95 toolbar-item text-sm font-bold"
            title="Heading 3"
          >
            H3
          </button>
        </div>

        <div className="flex gap-1 border-r border-dark-700 pr-2">
          <button
            onClick={handleLink}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded transition-all duration-200 transform hover:scale-110 active:scale-95 toolbar-item"
            title="Link (Ctrl+K)"
          >
            <FiLink2 size={16} />
          </button>
          <button
            onClick={handleBulletList}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded transition-all duration-200 transform hover:scale-110 active:scale-95 toolbar-item"
            title="Bullet List"
          >
            <FiList size={16} />
          </button>
          <button
            onClick={handleNumberedList}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded transition-all duration-200 transform hover:scale-110 active:scale-95 toolbar-item text-sm font-bold"
            title="Numbered List"
          >
            1.
          </button>
        </div>

        <div className="flex gap-1 border-r border-dark-700 pr-2">
          <button
            onClick={handleCodeBlock}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded transition-all duration-200 transform hover:scale-110 active:scale-95 toolbar-item text-xs font-mono"
            title="Code Block"
          >
            &lt;/&gt;
          </button>
          <button
            onClick={handleQuote}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded transition-all duration-200 transform hover:scale-110 active:scale-95 toolbar-item font-bold"
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
            className="bg-dark-700 text-gray-300 px-2 py-1 rounded text-sm border border-dark-600 focus:outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:bg-dark-600"
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
            className={`w-full h-full bg-dark-900 text-white p-4 resize-none focus:outline-none font-mono text-${fontSize} transition-all duration-75 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
            spellCheck="false"
            style={{
              lineHeight: '1.6',
              scrollBehavior: 'smooth',
              backfaceVisibility: 'hidden',
              WebkitFontSmoothing: 'antialiased',
            }}
          />
        </div>

        {/* Markdown Preview */}
        {viewMode === 'split' && (
          <div className="flex-1 border-l border-dark-700 overflow-auto p-4 bg-dark-800">
            <MarkdownPreview content={content} />
          </div>
        )}
      </div>

      {/* Version History Modal */}
      <VersionHistory
        docId={docId}
        docTitle={docData.title || docTitle}
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        onRestore={() => {
          setShowVersionHistory(false)
          Toast.success('Document restored from version history')
        }}
      />

      {/* Checkpoint Modal */}
      <CheckpointModal
        isOpen={showCheckpointModal}
        onClose={() => setShowCheckpointModal(false)}
        onSave={handleCheckpointSave}
        isSaving={isSavingCheckpoint}
      />

      {/* AI Editing Modal */}
      <AIEditingModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        selectedText={selectedText}
        onApply={handleApplyAIEdit}
      />
    </div>
  )
}
