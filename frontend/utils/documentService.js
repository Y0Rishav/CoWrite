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

// Find document by join code
export const findDocumentByCode = async (code) => {
  try {
    const q = query(collection(db, 'docs'), where('code', '==', code.toUpperCase()))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      return null
    }

    const doc = snapshot.docs[0]
    return {
      id: doc.id,
      ...doc.data(),
    }
  } catch (error) {
    console.error('Error finding document:', error)
    throw error
  }
}

// Add user to document participants
export const joinDocument = async (docId, userId, userEmail, displayName) => {
  try {
    const { doc, updateDoc, arrayUnion, serverTimestamp } = await import('firebase/firestore')
    const { db } = await import('./firebase')

    const docRef = doc(db, 'docs', docId)
    
    // Check if user is already a participant
    const docSnapshot = await (await import('firebase/firestore')).getDoc(docRef)
    if (docSnapshot.exists() && docSnapshot.data().participants[userId]) {
      return {
        success: true,
        message: 'You are already a participant in this document',
      }
    }

    // Add user as collaborator
    await updateDoc(docRef, {
      [`participants.${userId}`]: {
        role: 'collaborator',
        email: userEmail,
        displayName: displayName,
        joinedAt: serverTimestamp(),
      },
    })

    return {
      success: true,
      message: 'Successfully joined document',
    }
  } catch (error) {
    console.error('Error joining document:', error)
    throw error
  }
}

// Get user's role in a document
export const getUserRole = async (docId, userId) => {
  try {
    const { doc, getDoc } = await import('firebase/firestore')
    const { db } = await import('./firebase')
    
    const docRef = doc(db, 'docs', docId)
    const docSnapshot = await getDoc(docRef)
    
    if (!docSnapshot.exists()) {
      return null
    }
    
    const participants = docSnapshot.data().participants
    return participants[userId]?.role || null
  } catch (error) {
    console.error('Error getting user role:', error)
    return null
  }
}

// Check if user can edit document
export const canUserEdit = async (docId, userId) => {
  const role = await getUserRole(docId, userId)
  return role === 'owner' || role === 'collaborator'
}

// Check if user can delete document
export const canUserDelete = async (docId, userId) => {
  const role = await getUserRole(docId, userId)
  return role === 'owner'
}

// Change a participant's role (owner only)
export const changeUserRole = async (docId, userId, targetUserId, newRole) => {
  try {
    const { doc, updateDoc } = await import('firebase/firestore')
    const { db } = await import('./firebase')
    
    // Only owner can change roles
    const role = await getUserRole(docId, userId)
    if (role !== 'owner') {
      throw new Error('Only owners can change user roles')
    }
    
    const docRef = doc(db, 'docs', docId)
    await updateDoc(docRef, {
      [`participants.${targetUserId}.role`]: newRole,
    })
    
    return { success: true }
  } catch (error) {
    console.error('Error changing user role:', error)
    throw error
  }
}

// Remove a participant (owner only)
export const removeParticipant = async (docId, userId, targetUserId) => {
  try {
    const { doc, updateDoc } = await import('firebase/firestore')
    const { db } = await import('./firebase')
    
    // Only owner can remove participants
    const role = await getUserRole(docId, userId)
    if (role !== 'owner') {
      throw new Error('Only owners can remove participants')
    }
    
    const docRef = doc(db, 'docs', docId)
    // Use a trick to delete a field: set it to FieldValue.delete()
    const { deleteField } = await import('firebase/firestore')
    await updateDoc(docRef, {
      [`participants.${targetUserId}`]: deleteField(),
    })
    
    return { success: true }
  } catch (error) {
    console.error('Error removing participant:', error)
    throw error
  }
}

// Delete entire document (owner only)
export const deleteDocument = async (docId, userId) => {
  try {
    const { doc, deleteDoc } = await import('firebase/firestore')
    const { db } = await import('./firebase')
    
    // Only owner can delete document
    const role = await getUserRole(docId, userId)
    if (role !== 'owner') {
      throw new Error('Only document owner can delete')
    }
    
    const docRef = doc(db, 'docs', docId)
    await deleteDoc(docRef)
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting document:', error)
    throw error
  }
}
