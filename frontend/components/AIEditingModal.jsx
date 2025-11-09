import { useState, useEffect } from 'react'
import Toast from 'react-hot-toast'
import {FiX,FiCopy,FiCheck,FiRefreshCw,FiZap,FiMessageSquare,FiEdit2,
} from 'react-icons/fi'

import {improveGrammar,changeTone,makeConcise,expandText,fixPunctuation,simplifyText,makeProfessional,generateSuggestions,analyzeWriting,
} from '../utils/aiService'

export default function AIEditingModal({ isOpen, onClose, selectedText, onApply }) {
  const [loading, setLoading] = useState(false)
  const [currentEdit, setCurrentEdit] = useState(null)
  const [editHistory, setEditHistory] = useState([
    { type: 'original', text: selectedText, label: 'Original' },
  ])
  const [selectedTone, setSelectedTone] = useState('professional')

  // Update edit history when selectedText changes
  useEffect(() => {
    if (isOpen && selectedText) {
      setEditHistory([
        { type: 'original', text: selectedText, label: 'Original' },
      ])
    }
  }, [isOpen, selectedText])

  if (!isOpen) return null

  const toneOptions = [
    { value: 'formal', label: 'Formal' },
    { value: 'casual', label: 'Casual' },
    { value: 'professional', label: 'Professional' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'academic', label: 'Academic' },
  ]

  const aiFeatures = [
    {
      id: 'grammar',
      label: 'Improve Grammar',
      handler: improveGrammar,
      description: 'Fix grammar and spelling errors',
    },
    {
      id: 'concise',
      label: 'Make Concise',
      handler: makeConcise,
      description: 'Reduce verbosity and improve clarity',
    },
    {
      id: 'expand',
      label: 'Expand Text',
      handler: expandText,
      description: 'Add more details and examples',
    },
    {
      id: 'punctuation',
      label: 'Fix Punctuation',
      handler: fixPunctuation,
      description: 'Fix punctuation and formatting',
    },
    {
      id: 'simplify',
      label: 'Simplify',
      handler: simplifyText,
      description: 'Simplify for better readability',
    },
    {
      id: 'professional',
      label: 'Make Professional',
      handler: makeProfessional,
      description: 'Improve business communication style',
    },
    {
      id: 'suggestions',
      label: 'Get Suggestions',
      handler: generateSuggestions,
      description: 'Get specific improvement suggestions',
    },
    {
      id: 'analyze',
      label: 'Analyze Writing',
      handler: analyzeWriting,
      description: 'Get detailed writing analysis',
    },
  ]

  const handleEditOption = async (feature) => {
    setLoading(true)
    setCurrentEdit({ id: feature.id, label: feature.label })
    try {
      const textToEdit = editHistory[editHistory.length - 1].text
      let result

      if (feature.id === 'tone') {
        result = await changeTone(textToEdit, selectedTone)
      } else {
        result = await feature.handler(textToEdit)
      }

      const newEntry = {
        type: feature.id,
        text: result,
        label: feature.label,
      }
      setEditHistory([...editHistory, newEntry])
      Toast.success(`${feature.label} completed!`)
    } catch (error) {
      console.error('Error applying edit:', error)
      Toast.error(`Failed to apply ${feature.label}: ${error.message}`)
    } finally {
      setLoading(false)
      setCurrentEdit(null)
    }
  }

  const handleToneChange = async (tone) => {
    setSelectedTone(tone)
    setLoading(true)
    setCurrentEdit({ id: 'tone', label: `Change to ${tone}` })
    try {
      const textToEdit = editHistory[editHistory.length - 1].text
      const result = await changeTone(textToEdit, tone)

      const newEntry = {
        type: 'tone',
        text: result,
        label: `${tone.charAt(0).toUpperCase() + tone.slice(1)} Tone`,
      }
      setEditHistory([...editHistory, newEntry])
      Toast.success(`Tone changed to ${tone}!`)
    } catch (error) {
      console.error('Error changing tone:', error)
      Toast.error(`Failed to change tone: ${error.message}`)
    } finally {
      setLoading(false)
      setCurrentEdit(null)
    }
  }

  const handleCopy = () => {
    const currentText = editHistory[editHistory.length - 1].text
    navigator.clipboard.writeText(currentText)
    Toast.success('Copied to clipboard!')
  }

  const handleApply = () => {
    const currentText = editHistory[editHistory.length - 1].text
    onApply(currentText)
    onClose()
  }

  const handleUndo = () => {
    if (editHistory.length > 1) {
      setEditHistory(editHistory.slice(0, -1))
      Toast.success('Undo applied')
    }
  }

  const handleReset = () => {
    setEditHistory([editHistory[0]])
    Toast.success('Reset to original text')
  }

  const currentText = editHistory[editHistory.length - 1].text

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="sketchy-card shadow-sketchy-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b-2 border-dashed border-orange-300 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="font-sketch text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 flex items-center gap-2">
              <FiZap size={20} className="text-yellow-500" />
              AI-Assisted Editing
            </h2>
            <p className="font-handlee text-gray-700 mt-1">
              Selected text: {selectedText.substring(0, 50)}{selectedText.length > 50 ? '...' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-700 hover:text-orange-600 transition-colors p-2"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-4 p-6">
          {/* Left Panel - Options */}
          <div className="w-full md:w-72 flex flex-col gap-4 overflow-y-auto">
            {/* Tone Selector */}
            <div className="sketchy-card p-4">
              <h3 className="font-sketch font-bold text-gray-800 mb-3 flex items-center gap-2 text-lg">
                <FiMessageSquare size={16} />
                Change Tone
              </h3>
              <div className="flex flex-wrap gap-2">
                {toneOptions.map((tone) => (
                  <button
                    key={tone.value}
                    onClick={() => handleToneChange(tone.value)}
                    disabled={loading && currentEdit?.id === 'tone'}
                    className={`px-3 py-2 rounded-lg text-sm transition-all font-sketch font-bold ${
                      selectedTone === tone.value
                        ? 'bg-gradient-to-r from-orange-400 to-red-400 text-white shadow-sketchy'
                        : 'bg-gradient-to-r from-amber-200 to-yellow-200 text-gray-800 hover:from-amber-300 hover:to-yellow-300'
                    } disabled:opacity-50`}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Features */}
            <div className="sketchy-card p-4 flex-1 overflow-y-auto">
              <h3 className="font-sketch font-bold text-gray-800 mb-3 flex items-center gap-2 text-lg">
                <FiEdit2 size={16} />
                Editing Tools
              </h3>
              <div className="space-y-2">
                {aiFeatures.map((feature) => (
                  <button
                    key={feature.id}
                    onClick={() => handleEditOption(feature)}
                    disabled={loading && currentEdit?.id === feature.id}
                    title={feature.description}
                    className="w-full px-3 py-2 rounded-lg text-sm text-left transition-all bg-gradient-to-r from-amber-100 to-yellow-100 text-gray-800 hover:from-amber-200 hover:to-yellow-200 disabled:opacity-50 flex items-center justify-between group font-handlee"
                  >
                    <span>{feature.label}</span>
                    {loading && currentEdit?.id === feature.id && (
                      <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleUndo}
                disabled={editHistory.length <= 1 || loading}
                className="w-full px-3 py-2 rounded-lg text-sm transition-all sketchy-button flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FiRefreshCw size={16} />
                Undo
              </button>
              <button
                onClick={handleReset}
                disabled={editHistory.length <= 1 || loading}
                className="w-full px-3 py-2 rounded-lg text-sm transition-all sketchy-button bg-gradient-to-r from-red-400 to-pink-400 border-red-600 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Right Panel - Text Preview */}
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            {/* Edit History Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 border-b-2 border-dashed border-orange-300">
              {editHistory.map((edit, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (idx < editHistory.length) {
                      setEditHistory(editHistory.slice(0, idx + 1))
                    }
                  }}
                  className={`px-3 py-2 rounded-lg text-xs whitespace-nowrap transition-all font-sketch font-bold ${
                    idx === editHistory.length - 1
                      ? 'bg-gradient-to-r from-orange-400 to-red-400 text-white shadow-sketchy'
                      : 'bg-gradient-to-r from-amber-200 to-yellow-200 text-gray-800 hover:from-amber-300 hover:to-yellow-300'
                  }`}
                >
                  {edit.label}
                </button>
              ))}
            </div>

            {/* Text Display */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 overflow-y-auto border-2 border-dashed border-orange-300">
                <p className="font-handlee text-gray-800 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
                  {currentText}
                </p>
              </div>

              {/* Word Count */}
              <div className="font-handlee text-sm text-gray-700 mt-2 text-right">
                Original: {selectedText.length} chars | Current: {currentText.length} chars
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCopy}
                disabled={loading}
                className="flex-1 sketchy-button px-4 py-2 bg-gradient-to-r from-green-400 to-emerald-500 border-emerald-700 flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-sketchy-hover"
              >
                <FiCopy size={16} />
                Copy
              </button>
              <button
                onClick={handleApply}
                disabled={loading}
                className="flex-1 sketchy-button px-4 py-2 flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-sketchy-hover"
              >
                <FiCheck size={16} />
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}