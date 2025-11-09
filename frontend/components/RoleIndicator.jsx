import { FiCrown, FiUser } from 'react-icons/fi'

export default function RoleIndicator({ role, size = 'md' }) {
  if (!role) return null

  const isOwner = role === 'owner'
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full ${
        isOwner
          ? 'bg-yellow-900 bg-opacity-40 text-yellow-300 border border-yellow-700'
          : 'bg-blue-900 bg-opacity-40 text-blue-300 border border-blue-700'
      } ${sizeClasses[size]}`}
      title={isOwner ? 'Document owner' : 'Collaborator'}
    >
      {isOwner ? <FiCrown size={14} /> : <FiUser size={14} />}
      <span className="font-medium">{isOwner ? 'Owner' : 'Collaborator'}</span>
    </div>
  )
}
