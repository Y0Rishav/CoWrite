import { useState, useEffect } from 'react'
import Toast from 'react-hot-toast'
import { FiClock, FiDownload, FiRotateCcw, FiX, FiChevronRight, FiGitBranch } from 'react-icons/fi'
import { getDocumentVersions, restoreDocumentVersion, exportVersion, formatVersionMetadata } from '../utils/versionService'
import { useAuthStore } from '../utils/authStore'

export default function VersionHistory({ docId, docTitle, isOpen, onClose, onRestore }) {
  const { user } = useAuthStore()
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedVersion, setSelectedVersion] = useState(null)
  const [restoring, setRestoring] = useState(false)

  useEffect(() => {
    if (isOpen && docId) {
      loadVersions()
    }
  }, [isOpen, docId])

  const loadVersions = async () => {
    try {
      setLoading(true)
      const versionsList = await getDocumentVersions(docId)
      setVersions(versionsList)
      if (versionsList.length > 0) {
        setSelectedVersion(versionsList[0])
      }
    } catch (error) {
      console.error('Error loading versions:', error)
      Toast.error('Failed to load version history')
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (version) => {
    if (!window.confirm(`Restore to version from ${version.createdAt.toLocaleString()}?\n\nCurrent version will be saved as a backup.`)) {
      return
    }

    setRestoring(true)
    try {
      await restoreDocumentVersion(docId, version.id, user.uid, user.displayName)
      Toast.success('Document restored successfully')
      onRestore?.()
      loadVersions()
    } catch (error) {
      console.error('Error restoring version:', error)
      Toast.error('Failed to restore version')
    } finally {
      setRestoring(false)
    }
  }

  const handleExport = (version, format) => {
    try {
      exportVersion(version, format)
      Toast.success(`Exported as ${format.toUpperCase()}`)
    } catch (error) {
      console.error('Error exporting version:', error)
      Toast.error('Failed to export version')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-dark-800 rounded-lg max-w-4xl w-full max-h-screen overflow-auto border border-dark-700">
        {/* Header */}
        <div className="sticky top-0 bg-dark-800 border-b border-dark-700 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FiGitBranch size={20} className="text-blue-400" />
            <h2 className="text-xl font-bold text-white">Version History</h2>
            <span className="text-sm text-gray-400">({versions.length} versions)</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex h-full">
          {/* Versions List */}
          <div className="w-full md:w-1/3 border-r border-dark-700 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p className="text-gray-400">Loading versions...</p>
              </div>
            ) : versions.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <FiClock size={32} className="mx-auto mb-2 opacity-50" />
                <p>No versions yet</p>
              </div>
            ) : (
              <div className="divide-y divide-dark-700">
                {versions.map((version, index) => (
                  <button
                    key={version.id}
                    onClick={() => setSelectedVersion(version)}
                    className={`w-full text-left p-4 transition-colors border-l-4 ${
                      selectedVersion?.id === version.id
                        ? 'bg-dark-700 border-l-blue-500'
                        : 'hover:bg-dark-700 border-l-dark-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {version.reason || 'Version'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {version.createdAt.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          by {version.createdByName || 'Unknown'}
                        </p>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <div>{version.wordCount} words</div>
                        <div>{version.characterCount} chars</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Version Details */}
          {selectedVersion && (
            <div className="hidden md:flex flex-1 flex-col">
              {/* Version Info */}
              <div className="border-b border-dark-700 px-6 py-4 bg-dark-700">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-white">{selectedVersion.reason}</h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {selectedVersion.createdAt.toLocaleString()}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-blue-900 text-blue-200 rounded">
                      {selectedVersion.isRestore ? 'Restore' : selectedVersion.isBackup ? 'Backup' : 'Manual'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Words</p>
                      <p className="text-white font-semibold">{selectedVersion.wordCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Characters</p>
                      <p className="text-white font-semibold">{selectedVersion.characterCount}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="flex-1 overflow-auto p-6">
                <div className="bg-dark-900 rounded p-4 font-mono text-sm text-gray-300 whitespace-pre-wrap break-words max-h-64 overflow-auto">
                  {selectedVersion.content.substring(0, 500)}
                  {selectedVersion.content.length > 500 && (
                    <p className="text-gray-500 mt-2">... (content truncated)</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-dark-700 p-4 flex gap-2 flex-wrap">
                <button
                  onClick={() => handleRestore(selectedVersion)}
                  disabled={restoring}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50"
                >
                  <FiRotateCcw size={16} />
                  Restore
                </button>
                <div className="flex gap-1 border-l border-dark-600 pl-2 ml-2">
                  <button
                    onClick={() => handleExport(selectedVersion, 'md')}
                    className="flex items-center gap-1 px-3 py-2 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded transition-colors text-sm"
                    title="Export as Markdown"
                  >
                    <FiDownload size={14} />
                    MD
                  </button>
                  <button
                    onClick={() => handleExport(selectedVersion, 'txt')}
                    className="flex items-center gap-1 px-3 py-2 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded transition-colors text-sm"
                    title="Export as Text"
                  >
                    <FiDownload size={14} />
                    TXT
                  </button>
                  <button
                    onClick={() => handleExport(selectedVersion, 'html')}
                    className="flex items-center gap-1 px-3 py-2 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded transition-colors text-sm"
                    title="Export as HTML"
                  >
                    <FiDownload size={14} />
                    HTML
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
