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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="sketchy-card shadow-sketchy-lg max-w-4xl w-full max-h-screen overflow-auto">
        {/* Header */}
        <div className="sticky top-0 sketchy-container border-b-2 border-dashed border-orange-300 px-6 py-4 flex justify-between items-center shadow-sketchy">
          <div className="flex items-center gap-2">
            <FiGitBranch size={20} className="text-purple-600" />
            <h2 className="font-sketch font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              📜 Version History
            </h2>
            <span className="font-handlee text-gray-700">({versions.length} versions)</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-700 hover:text-orange-600 transition-colors p-1"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex h-full">
          {/* Versions List */}
          <div className="w-full md:w-1/3 border-r-2 border-dashed border-orange-300 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-orange-200 border-t-orange-600 mx-auto mb-2"></div>
                <p className="font-handlee text-gray-700">Loading versions...</p>
              </div>
            ) : versions.length === 0 ? (
              <div className="p-6 text-center font-handlee text-gray-700">
                <FiClock size={32} className="mx-auto mb-2 opacity-50" />
                <p>No versions yet</p>
              </div>
            ) : (
              <div className="divide-y divide-dashed divide-orange-300">
                {versions.map((version, index) => (
                  <button
                    key={version.id}
                    onClick={() => setSelectedVersion(version)}
                    className={`w-full text-left p-4 transition-colors border-l-4 ${
                      selectedVersion?.id === version.id
                        ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-l-orange-500 shadow-sketchy'
                        : 'hover:bg-yellow-50 border-l-orange-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-sketch font-bold text-gray-800 truncate text-lg">
                          {version.reason || 'Version'}
                        </p>
                        <p className="font-handlee text-sm text-gray-700 mt-1">
                          {version.createdAt.toLocaleString()}
                        </p>
                        <p className="font-handlee text-xs text-gray-600 mt-1">
                          by {version.createdByName || 'Unknown'}
                        </p>
                      </div>
                      <div className="text-right font-handlee text-xs text-gray-700">
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
              <div className="border-b-2 border-dashed border-orange-300 px-6 py-4 bg-gradient-to-r from-yellow-100 to-orange-100">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-sketch font-bold text-gray-800 text-lg">{selectedVersion.reason}</h3>
                      <p className="font-handlee text-gray-700 mt-1">
                        {selectedVersion.createdAt.toLocaleString()}
                      </p>
                    </div>
                    <span className="sketchy-badge text-xs">
                      {selectedVersion.isRestore ? 'Restore' : selectedVersion.isBackup ? 'Backup' : 'Manual'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 font-handlee">
                    <div>
                      <p className="text-gray-700">Words</p>
                      <p className="text-gray-800 font-bold">{selectedVersion.wordCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-700">Characters</p>
                      <p className="text-gray-800 font-bold">{selectedVersion.characterCount}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="flex-1 overflow-auto p-6">
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 font-handlee text-sm text-gray-800 whitespace-pre-wrap break-words max-h-64 overflow-auto border-2 border-dashed border-orange-300">
                  {selectedVersion.content.substring(0, 500)}
                  {selectedVersion.content.length > 500 && (
                    <p className="text-gray-600 mt-2 italic">... (content truncated)</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="border-t-2 border-dashed border-orange-300 p-4 flex gap-2 flex-wrap">
                <button
                  onClick={() => handleRestore(selectedVersion)}
                  disabled={restoring}
                  className="sketchy-button flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-400 to-emerald-500 border-emerald-700 disabled:opacity-50 hover:shadow-sketchy-hover"
                >
                  <FiRotateCcw size={16} />
                  Restore
                </button>
                <div className="flex gap-1 border-l-2 border-dashed border-orange-300 pl-2 ml-2">
                  <button
                    onClick={() => handleExport(selectedVersion, 'md')}
                    className="sketchy-badge px-3 py-2 text-xs font-bold hover:shadow-sketchy"
                    title="Export as Markdown"
                  >
                    <FiDownload size={14} className="inline mr-1" />
                    MD
                  </button>
                  <button
                    onClick={() => handleExport(selectedVersion, 'txt')}
                    className="sketchy-badge px-3 py-2 text-xs font-bold hover:shadow-sketchy"
                    title="Export as Text"
                  >
                    <FiDownload size={14} className="inline mr-1" />
                    TXT
                  </button>
                  <button
                    onClick={() => handleExport(selectedVersion, 'html')}
                    className="sketchy-badge px-3 py-2 text-xs font-bold hover:shadow-sketchy"
                    title="Export as HTML"
                  >
                    <FiDownload size={14} className="inline mr-1" />
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
