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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-600 mx-auto mb-6"></div>
          <p className="font-handlee text-gray-700 text-xl">Loading your workspace...</p>
          <div className="mt-4 flex gap-1 justify-center">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 p-4">
      <div className="w-full max-w-md animate-slide-in-left">
        {/* Sketchy container with hand-drawn feel */}
        <div className="sketchy-card p-8 md:p-12 relative overflow-hidden">
          {/* Decorative dots */}
          <div className="absolute top-4 right-4 w-3 h-3 bg-orange-400 rounded-full opacity-60"></div>
          <div className="absolute bottom-6 left-6 w-2 h-2 bg-amber-400 rounded-full opacity-50"></div>
          
          <div className="text-center relative z-10">
            <h1 className="font-sketch text-5xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">
              CoWrite.AI
            </h1>
            <p className="font-handlee text-gray-700 mb-8 text-lg leading-relaxed">
               Write together. Smarter. Faster. Cleaner.
            </p>

            <button
              onClick={handleGoogleSignIn}
              className="sketchy-button w-full flex items-center justify-center gap-3 mb-6 hover:shadow-sketchy-hover"
            >
              <FiLogIn size={22} />
              <span className="text-lg">Sign in with Google</span>
            </button>

            <p className="font-handlee text-gray-600 text-sm leading-relaxed">
              Collaborate on documents in real-time with AI-powered writing assistance.
            </p>
          </div>

          {/* Sketchy underline decoration */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-red-400 to-orange-400 opacity-40" 
               style={{ transform: 'skewY(-1deg)' }}></div>
        </div>

        {/* Decorative elements */}
        <div className="mt-8 text-center">
          <div className="inline-block px-4 py-2 sketchy-badge">
             Real-time collaboration
          </div>
        </div>
      </div>
    </div>
  )
}
