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
        className="flex items-center gap-2 px-3 py-2 bg-dark-700 hover:bg-dark-600 rounded transition-colors"
        title="Active users"
      >
        <div className="flex">
          {activeUsers.slice(0, 3).map((user, idx) => (
            <div
              key={user.id}
              className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xs text-white font-bold -ml-2 first:ml-0 border border-dark-900"
              style={{
                zIndex: 10 - idx,
              }}
              title={user.displayName}
            >
              {user.displayName?.charAt(0).toUpperCase() || '?'}
            </div>
          ))}
        </div>
        <span className="text-xs text-gray-400">
          {activeUsers.length} {activeUsers.length === 1 ? 'user' : 'users'}
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-dark-800 border border-dark-700 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-dark-700">
            <h3 className="text-sm font-semibold text-white">Active Collaborators</h3>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {activeUsers.length === 0 ? (
              <div className="p-3 text-xs text-gray-400">No active users</div>
            ) : (
              <div className="divide-y divide-dark-700">
                {activeUsers.map((user) => (
                  <div key={user.id} className="p-3 flex items-center gap-2 hover:bg-dark-700 transition-colors">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xs text-white font-bold">
                        {user.displayName?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{user.displayName}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-green-500" title="Active now" />
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
