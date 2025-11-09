import { db } from '../utils/firebase'
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore'
import Toast from 'react-hot-toast'

// Generate a random 6-character code
const generateCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// Create a new document in Firestore
export const createNewDocument = async (userId, userEmail, displayName) => {
  try {
    const docCode = generateCode()
    
    const newDoc = await addDoc(collection(db, 'docs'), {
      title: `Untitled Document`,
      owner: userId,
      participants: {
        [userId]: {
          role: 'owner',
          email: userEmail,
          displayName: displayName,
          joinedAt: serverTimestamp(),
        },
      },
      code: docCode,
      createdAt: serverTimestamp(),
      lastEdited: serverTimestamp(),
      content: '',
    })

    return {
      id: newDoc.id,
      code: docCode,
    }
  } catch (error) {
    console.error('Error creating document:', error)
    Toast.error('Failed to create document')
    throw error
  }
}

// Fetch user's documents from Firestore
export const fetchUserDocuments = async (userId) => {
  try {
    const q = query(
      collection(db, 'docs'),
      where('participants', 'array-contains', userId)
    )
    
    const snapshot = await getDocs(q)
    const documents = []

    snapshot.forEach((doc) => {
      // Check if user is actually in participants (since array-contains can be fuzzy)
      if (doc.data().participants[userId]) {
        documents.push({
          id: doc.id,
          ...doc.data(),
        })
      }
    })

    // Sort by last edited, newest first
    return documents.sort((a, b) => {
      const aTime = a.lastEdited?.toMillis?.() || 0
      const bTime = b.lastEdited?.toMillis?.() || 0
      return bTime - aTime
    })
  } catch (error) {
    console.error('Error fetching documents:', error)
    Toast.error('Failed to fetch documents')
    throw error
  }
}

// Format timestamp for display
export const formatDate = (timestamp) => {
  if (!timestamp) return 'Never'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
}
