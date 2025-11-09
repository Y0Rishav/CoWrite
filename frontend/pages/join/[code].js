import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuthStore } from '../../utils/authStore'
import { findDocumentByCode, joinDocument } from '../../utils/documentService'
import Toast from 'react-hot-toast'

export default function JoinViLink() {
  const router = useRouter()
  const { code } = router.query
  const { user, loading: authLoading } = useAuthStore()

  useEffect(() => {
    if (!authLoading && !user) {
      // Store the code and redirect to login
      if (code) {
        router.push(`/?joinCode=${code}`)
      } else {
        router.push('/')
      }
    }
  }, [user, authLoading, router, code])

  useEffect(() => {
    if (user && code) {
      handleJoin()
    }
  }, [user, code])

  const handleJoin = async () => {
    try {
      // Find document by code
      const doc = await findDocumentByCode(code)

      if (!doc) {
        Toast.error('Invalid join code or document not found')
        setTimeout(() => router.push('/dashboard'), 2000)
        return
      }

      // Add user to document
      await joinDocument(doc.id, user.uid, user.email, user.displayName)

      Toast.success('Successfully joined document!')

      // Redirect to document
      setTimeout(() => router.push(`/doc/${doc.id}`), 500)
    } catch (error) {
      console.error('Error:', error)
      Toast.error(error.message || 'Failed to join document')
      setTimeout(() => router.push('/dashboard'), 2000)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-600 mx-auto mb-6"></div>
        <p className="font-handlee text-gray-700 text-xl">Joining document...</p>
        <div className="mt-4 flex gap-1 justify-center">
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
          <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
      </div>
    </div>
  )
}
