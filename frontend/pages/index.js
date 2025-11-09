import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '../utils/firebase'
import { useAuthStore } from '../utils/authStore'
import Toast from 'react-hot-toast'
import { FiLogIn } from 'react-icons/fi'

export default function Login() {
  const router = useRouter()
  const { user, loading, setUser } = useAuthStore()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
        })
        router.push('/dashboard')
      } else {
        setUser(null)
      }
    })

    return () => unsubscribe()
  }, [router, setUser])

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      setUser({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      })
      router.push('/dashboard')
      Toast.success('Signed in successfully!')
    } catch (error) {
      console.error('Sign-in error:', error)
      Toast.error(error.message || 'Failed to sign in')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-dark-900">
      <div className="w-full max-w-md">
        <div className="bg-dark-800 rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-4xl font-bold mb-2 text-white">CoWrite.AI</h1>
          <p className="text-gray-400 mb-8">Write together. Smarter. Faster. Cleaner.</p>

          <button
            onClick={handleGoogleSignIn}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <FiLogIn size={20} />
            Sign in with Google
          </button>

          <p className="text-gray-500 text-sm mt-8">
            Collaborate on documents in real-time with AI-powered writing assistance.
          </p>
        </div>
      </div>
    </div>
  )
}
