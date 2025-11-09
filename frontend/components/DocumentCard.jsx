import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Toast from 'react-hot-toast'
import { FiCopy, FiExternalLink, FiShare2 } from 'react-icons/fi'
import { formatDate } from '../utils/documentService'

export default function DocumentCard({ doc, docId }) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/doc/${docId}`
  const joinCode = doc.code

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

  return (
    <div
      onClick={() => router.push(`/doc/${docId}`)}
      className="bg-dark-800 rounded-lg p-4 hover:bg-dark-700 transition-colors cursor-pointer border border-dark-700 hover:border-dark-600"
    >
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-white truncate">{doc.title}</h3>
        <p className="text-sm text-gray-400">Last edited {formatDate(doc.lastEdited)}</p>
      </div>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="inline-block bg-blue-900 text-blue-200 px-2 py-1 rounded text-xs font-mono">
          {joinCode}
        </span>
        <span className="text-gray-500 text-xs">
          {Object.keys(doc.participants).length} participant{Object.keys(doc.participants).length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleCopyCode()
          }}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded text-sm transition-colors"
          title="Copy join code"
        >
          <FiCopy size={14} />
          <span className="hidden sm:inline">Code</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleCopyLink()
          }}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded text-sm transition-colors"
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
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
          title="Open document"
        >
          <FiExternalLink size={14} />
          <span className="hidden sm:inline">Open</span>
        </button>
      </div>
    </div>
  )
}
