'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';   // App Router
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '../utils/firebase';
import { useAuthStore } from '../utils/authStore';
import toast from 'react-hot-toast';
import {
  FiLogIn,
  FiEdit3,
  FiUsers,
  FiZap,
  FiCheck,
} from 'react-icons/fi';

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */
export default function Login() {
  const router = useRouter();
  const { user, loading, setUser } = useAuthStore();
  const [isVisible, setIsVisible] = useState(false);

  /* ---------------------------------------------------------------------- */
  /*  Fade-in animation (same as fancy version)                             */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  /* ---------------------------------------------------------------------- */
  /*  Firebase auth listener – identical to basic version                   */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
        });
        router.push('/dashboard');
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [router, setUser]);

  /* ---------------------------------------------------------------------- */
  /*  Google sign-in – identical to basic version                           */
  /* ---------------------------------------------------------------------- */
  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      setUser({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      });

      router.push('/dashboard');
      toast.success('Signed in successfully!');
    } catch (error) {
      console.error('Sign-in error:', error);
      toast.error(error.message || 'Failed to sign in');
    }
  };

  /* ---------------------------------------------------------------------- */
  /*  Feature cards (same as fancy version)                                 */
  /* ---------------------------------------------------------------------- */
  const features = [
    { icon: FiEdit3, text: 'AI-Powered Writing', color: 'text-orange-600' },
    { icon: FiUsers, text: 'Real-time Collaboration', color: 'text-red-600' },
    { icon: FiZap, text: 'Smart Suggestions', color: 'text-amber-600' },
  ];

  /* ---------------------------------------------------------------------- */
  /*  Loading UI – same spinner as basic version                            */
  /* ---------------------------------------------------------------------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-600 mx-auto mb-6"></div>
          <p className="font-handlee text-gray-700 text-xl">Loading your workspace...</p>
          <div className="mt-4 flex gap-1 justify-center">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /*  MAIN UI – fancy layout + basic hover classes                         */
  /* ---------------------------------------------------------------------- */
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 p-4 relative overflow-hidden">
      {/* Fade-in wrapper */}
      <div
        className={`w-full max-w-5xl transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* ---------- LEFT – HERO CONTENT ---------- */}
          <div className="order-2 md:order-1 text-center md:text-left space-y-6">
            <div className="inline-block">
              <h1 className="font-sketch text-6xl md:text-7xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-red-600 to-orange-600">
                CoWrite.AI
              </h1>
              <div
                className="h-1 bg-gradient-to-r from-orange-400 to-red-400 rounded-full"
                style={{ transform: 'rotate(-1deg)' }}
              ></div>
            </div>

            <p className="font-handlee text-gray-700 text-2xl md:text-3xl leading-relaxed">
              Write together.{' '}
              <span className="text-orange-600 font-bold">Smarter.</span>{' '}
              <span className="text-red-600 font-bold">Faster.</span>{' '}
              <span className="text-amber-600 font-bold">Cleaner.</span>
            </p>

            <p className="font-handlee text-gray-600 text-lg leading-relaxed max-w-lg">
              Transform your writing process with AI-powered collaboration. Create,
              edit, and perfect documents together in real-time.
            </p>

            {/* Feature cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-3 bg-white/60 rounded-lg border-2 border-dashed border-orange-300 hover:border-orange-500 transition-all duration-200"
                  >
                    <Icon className={`${f.color} flex-shrink-0`} size={20} />
                    <span className="font-handlee text-sm text-gray-700">{f.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ---------- RIGHT – LOGIN CARD (keeps sketchy classes) ---------- */}
          <div className="order-1 md:order-2">
            <div className="relative">
              {/* Sketchy container – same classes as basic version */}
              <div className="sketchy-card bg-white/80 backdrop-blur-sm p-8 md:p-10 rounded-3xl border-4 border-dashed border-orange-300 shadow-xl hover:shadow-2xl transition-shadow duration-300 overflow-hidden">
                {/* Decorative dots */}
                <div className="absolute top-4 right-4 w-4 h-4 bg-orange-400 rounded-full opacity-50"></div>
                <div className="absolute top-8 right-8 w-3 h-3 bg-red-400 rounded-full opacity-40"></div>
                <div className="absolute bottom-6 left-6 w-3 h-3 bg-amber-400 rounded-full opacity-40"></div>
                <div className="absolute bottom-10 left-10 w-2 h-2 bg-orange-300 rounded-full opacity-30"></div>

                <div className="text-center space-y-6">
                  {/* Welcome badge */}
                  <div className="inline-block px-4 py-2 bg-gradient-to-r from-orange-100 to-red-100 rounded-full border-2 border-dashed border-orange-300">
                    <p className="font-handlee text-orange-700 text-sm font-bold">
                      Welcome Back!
                    </p>
                  </div>

                  <div>
                    <h2 className="font-sketch text-3xl font-bold text-gray-800 mb-2">
                      Get Started
                    </h2>
                    <p className="font-handlee text-gray-600 text-sm">
                      Sign in to access your workspace
                    </p>
                  </div>

                  {/* Google button – uses basic sketchy classes */}
                  <button
                    onClick={handleGoogleSignIn}
                    className="sketchy-button w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-2xl font-handlee text-lg font-bold shadow-lg hover:shadow-sketchy-hover transition-all duration-200 border-2 border-orange-600"
                  >
                    <FiLogIn size={24} />
                    <span>Sign in with Google</span>
                  </button>

                  {/* Benefits */}
                  <div className="pt-4 space-y-2">
                    {['No credit card required', 'Free to start', 'Cancel anytime'].map(
                      (b, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-center gap-2 text-sm font-handlee text-gray-600"
                        >
                          <FiCheck className="text-green-600" size={16} />
                          <span>{b}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Bottom gradient bar */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-400 via-red-400 to-amber-400 opacity-40 rounded-b-3xl"
                  style={{ transform: 'skewY(-1deg)' }}
                ></div>
              </div>

              {/* Floating badge */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
                <div className="px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full shadow-lg border-2 border-white">
                  <p className="font-handlee text-white font-bold text-sm whitespace-nowrap">
                    Join 10,000+ writers
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social proof */}
        <div className="mt-16 text-center">
          <p className="font-handlee text-gray-500 text-sm mb-4">Trusted by teams at</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-50">
            {['Startup', 'Agency', 'Enterprise', 'Freelance'].map((c, i) => (
              <div key={i} className="font-sketch text-2xl text-gray-600">
                {c}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------- */
      /*  Animation definitions – keep the ones used in the basic page   */
      /* --------------------------------------------------------------- */
      <style jsx>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in-left {
          animation: slideInLeft 0.6s ease-out forwards;
        }

        /* Sketchy hover – make sure your globals.css has these */
        .sketchy-card {
          /* any extra sketchy styles you already have */
        }
        .sketchy-button {
          /* any extra sketchy button styles */
        }
        .hover\\:shadow-sketchy-hover:hover {
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
                      0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
      `}</style>
}
    </div>
  );
}