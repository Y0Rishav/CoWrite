import { useState, useEffect } from 'react'
import { subscribeToPresence } from '../utils/presenceService'

export default function ParticipantPresence({ docId }) {
  const [activeUsers, setActiveUsers] = useState([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!docId) return

    const unsubscribe = subscribeToPresence(docId, (users) => {
      setActiveUsers(users)
    })

    return () => unsubscribe()
  }, [docId])

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="sketchy-badge px-3 py-2 flex items-center gap-2 hover:shadow-sketchy"
        title="Active users"
      >
        <div className="flex">
          {activeUsers.slice(0, 3).map((user, idx) => (
            <div
              key={user.id}
              className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-xs text-white font-bold font-sketch -ml-2 first:ml-0 border-2 border-yellow-50"
              style={{
                zIndex: 10 - idx,
              }}
              title={user.displayName}
            >
              {user.displayName?.charAt(0).toUpperCase() || '?'}
            </div>
          ))}
        </div>
        <span className="font-handlee text-sm text-gray-800">
          {activeUsers.length} {activeUsers.length === 1 ? 'user' : 'users'}
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 sketchy-card shadow-sketchy-lg z-50">
          <div className="p-3 border-b-2 border-dashed border-orange-300">
            <h3 className="font-sketch font-bold text-gray-800 text-lg">👥 Active Collaborators</h3>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {activeUsers.length === 0 ? (
              <div className="p-3 font-handlee text-gray-700">No active users</div>
            ) : (
              <div className="divide-y divide-dashed divide-orange-300">
                {activeUsers.map((user) => (
                  <div key={user.id} className="p-3 flex items-center gap-2 hover:bg-white hover:bg-opacity-50 transition-colors">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName}
                        className="w-8 h-8 rounded-full border-2 border-orange-300"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-xs text-white font-bold font-sketch border-2 border-orange-300">
                        {user.displayName?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-sketch font-bold text-gray-800 truncate">{user.displayName}</p>
                      <p className="font-handlee text-xs text-gray-600 truncate">{user.email}</p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Active now" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
