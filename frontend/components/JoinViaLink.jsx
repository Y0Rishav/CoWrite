import { useState } from 'react'
import Toast from 'react-hot-toast'
import { FiLink } from 'react-icons/fi'

export default function JoinViaLink() {
  const [loading, setLoading] = useState(false)

  // This component handles joining via direct link: /join/CODE
  // Logic is in pages/join/[code].js

  return (
    <div className="text-center py-6">
      <p className="font-handlee text-gray-700 text-lg">
        🔗 Or share this link format to invite others:
      </p>
      <code className="sketchy-badge px-4 py-2 rounded-lg text-sm mt-3 inline-block font-mono text-lg">
        {typeof window !== 'undefined' ? window.location.origin : ''}/join/CODE
      </code>
    </div>
  )
}
