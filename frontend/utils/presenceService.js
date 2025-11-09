import { db } from './firebase'
import { doc, setDoc, deleteDoc, collection, onSnapshot, query, where } from 'firebase/firestore'

/**
 * Updates user's presence in a document
 * @param {string} docId - Document ID
 * @param {string} userId - User ID
 * @param {Object} userData - User data {email, displayName, photoURL}
 */
export async function updateUserPresence(docId, userId, userData) {
  try {
    const presenceRef = doc(db, 'docs', docId, 'presence', userId)
    await setDoc(presenceRef, {
      userId,
      email: userData.email,
      displayName: userData.displayName || 'Anonymous',
      photoURL: userData.photoURL || null,
      lastSeen: new Date(),
      isActive: true,
    }, { merge: true })
  } catch (error) {
    console.error('Error updating presence:', error)
    throw error
  }
}

/**
 * Removes user from presence when they leave
 * @param {string} docId - Document ID
 * @param {string} userId - User ID
 */
export async function removeUserPresence(docId, userId) {
  try {
    const presenceRef = doc(db, 'docs', docId, 'presence', userId)
    await deleteDoc(presenceRef)
  } catch (error) {
    console.error('Error removing presence:', error)
    // Don't throw - this is a cleanup operation
  }
}

/**
 * Subscribes to active users in a document
 * @param {string} docId - Document ID
 * @param {Function} onUpdate - Callback with active users array
 * @returns {Function} Unsubscribe function
 */
export function subscribeToPresence(docId, onUpdate) {
  try {
    const presenceRef = collection(db, 'docs', docId, 'presence')
    
    const unsubscribe = onSnapshot(presenceRef, (snapshot) => {
      const activeUsers = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        // Consider user active if they updated presence within last 30 seconds
        const lastSeen = data.lastSeen?.toDate?.() || new Date(data.lastSeen)
        const isStale = new Date() - lastSeen > 30000
        
        if (!isStale && data.isActive) {
          activeUsers.push({
            id: doc.id,
            ...data,
          })
        }
      })
      
      onUpdate(activeUsers)
    })
    
    return unsubscribe
  } catch (error) {
    console.error('Error subscribing to presence:', error)
    return () => {} // Return dummy unsubscribe
  }
}

/**
 * Keep-alive function to maintain presence
 * Call this on a timer (e.g., every 10 seconds)
 * @param {string} docId - Document ID
 * @param {string} userId - User ID
 * @param {Object} userData - User data
 */
export async function keepPresenceAlive(docId, userId, userData) {
  try {
    const presenceRef = doc(db, 'docs', docId, 'presence', userId)
    await setDoc(presenceRef, {
      lastSeen: new Date(),
    }, { merge: true })
  } catch (error) {
    console.error('Error keeping presence alive:', error)
  }
}
