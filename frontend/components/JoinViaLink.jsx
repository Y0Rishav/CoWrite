import { useState } from 'react'
import Toast from 'react-hot-toast'
import { FiLink } from 'react-icons/fi'

export default function JoinViaLink() {
  const [loading, setLoading] = useState(false)

  // This component handles joining via direct link: /join/CODE
  // Logic is in pages/join/[code].js

  return (
    <div className="text-center py-4">
      <p className="text-gray-400 text-sm">
        Or share this link format to invite others:
      </p>
      <code className="bg-dark-700 text-blue-300 px-3 py-1 rounded text-sm mt-2 inline-block">
        {typeof window !== 'undefined' ? window.location.origin : ''}/join/CODE
      </code>
    </div>
  )
}
