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
    <div className="flex items-center justify-center min-h-screen bg-dark-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-gray-400">Joining document...</p>
      </div>
    </div>
  )
}
