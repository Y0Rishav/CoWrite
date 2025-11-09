import * as Y from 'yjs'
import { db } from './firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import Toast from 'react-hot-toast'

// Initialize Y.js document with Firestore persistence
export const initializeYDoc = async (docId, userId) => {
  try {
    const ydoc = new Y.Doc()
    
    // Get existing content from Firestore
    const docRef = doc(db, 'docs', docId)
    const snapshot = await getDoc(docRef)
    
    if (!snapshot.exists()) {
      throw new Error('Document not found')
    }

    // Create a Y.Text for the document content
    const ytext = ydoc.getText('shared-text')
    
    // Initialize with existing content if any
    const existingContent = snapshot.data().content || ''
    if (existingContent && ytext.length === 0) {
      ytext.insert(0, existingContent)
    }

    return ydoc
  } catch (error) {
    console.error('Error initializing Y.doc:', error)
    Toast.error('Failed to load document')
    throw error
  }
}

// Persist Y.js changes to Firestore
export const persistYDocToFirestore = async (docId, ydoc) => {
  try {
    const ytext = ydoc.getText('shared-text')
    const content = ytext.toString()
    
    const docRef = doc(db, 'docs', docId)
    await updateDoc(docRef, {
      content: content,
      lastEdited: new Date(),
    })
  } catch (error) {
    console.error('Error persisting to Firestore:', error)
  }
}

// Update last edited timestamp
export const updateLastEdited = async (docId) => {
  try {
    const docRef = doc(db, 'docs', docId)
    await updateDoc(docRef, {
      lastEdited: new Date(),
    })
  } catch (error) {
    console.error('Error updating lastEdited:', error)
  }
}
