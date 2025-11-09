import { db } from './firebase'
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import Toast from 'react-hot-toast'

export const createVersionSnapshot = async (docId, userId, displayName, content, title, reason = 'Auto-save') => {
  try {
    const docRef = doc(db, 'docs', docId)
    const docSnapshot = await getDoc(docRef)

    if (!docSnapshot.exists()) {
      throw new Error('Document not found')
    }

    // Create version record
    const versionRef = await addDoc(collection(db, 'docs', docId, 'versions'), {
      content,
      title,
      reason,
      createdBy: userId,
      createdByName: displayName,
      createdAt: serverTimestamp(),
      wordCount: content.split(/\s+/).filter(w => w.length > 0).length,
      characterCount: content.length,
    })

    return {
      id: versionRef.id,
      success: true,
    }
  } catch (error) {
    console.error('Error creating version snapshot:', error)
    throw error
  }
}

// Get all versions of a document
export const getDocumentVersions = async (docId) => {
  try {
    const versionsRef = collection(db, 'docs', docId, 'versions')
    const q = query(versionsRef, orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)

    const versions = []
    snapshot.forEach((doc) => {
      versions.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      })
    })

    return versions
  } catch (error) {
    console.error('Error fetching versions:', error)
    throw error
  }
}

// Get a specific version
export const getVersion = async (docId, versionId) => {
  try {
    const versionRef = doc(db, 'docs', docId, 'versions', versionId)
    const versionSnapshot = await getDoc(versionRef)

    if (!versionSnapshot.exists()) {
      throw new Error('Version not found')
    }

    return {
      id: versionSnapshot.id,
      ...versionSnapshot.data(),
      createdAt: versionSnapshot.data().createdAt?.toDate?.() || new Date(),
    }
  } catch (error) {
    console.error('Error fetching version:', error)
    throw error
  }
}

// Restore document to a specific version
export const restoreDocumentVersion = async (docId, versionId, userId, displayName) => {
  try {
    // Get the version to restore
    const version = await getVersion(docId, versionId)

    // Create a snapshot of current version before restoring
    const docRef = doc(db, 'docs', docId)
    const currentDoc = await getDoc(docRef)

    if (!currentDoc.exists()) {
      throw new Error('Document not found')
    }

    // Save current state as a backup
    await addDoc(collection(db, 'docs', docId, 'versions'), {
      content: currentDoc.data().content,
      title: currentDoc.data().title,
      reason: `Backup before restore to version ${versionId}`,
      createdBy: userId,
      createdByName: displayName,
      createdAt: serverTimestamp(),
      wordCount: currentDoc.data().content.split(/\s+/).filter(w => w.length > 0).length,
      characterCount: currentDoc.data().content.length,
      isBackup: true,
    })

    // Restore the version
    await updateDoc(docRef, {
      content: version.content,
      title: version.title,
      lastEdited: new Date(),
      restoredFrom: versionId,
      restoredBy: userId,
      restoredAt: serverTimestamp(),
    })

    // Create a restore record
    await addDoc(collection(db, 'docs', docId, 'versions'), {
      content: version.content,
      title: version.title,
      reason: `Restored from version ${versionId}`,
      createdBy: userId,
      createdByName: displayName,
      createdAt: serverTimestamp(),
      wordCount: version.content.split(/\s+/).filter(w => w.length > 0).length,
      characterCount: version.content.length,
      isRestore: true,
      restoredFromVersion: versionId,
    })

    return { success: true, message: 'Document restored successfully' }
  } catch (error) {
    console.error('Error restoring version:', error)
    throw error
  }
}

// Calculate diff between two versions
export const calculateVersionDiff = (oldContent, newContent) => {
  const oldLines = oldContent.split('\n')
  const newLines = newContent.split('\n')

  const diff = {
    added: 0,
    removed: 0,
    changed: 0,
    totalLines: Math.max(oldLines.length, newLines.length),
  }

  // Simple diff calculation
  const minLength = Math.min(oldLines.length, newLines.length)
  for (let i = 0; i < minLength; i++) {
    if (oldLines[i] !== newLines[i]) {
      diff.changed++
    }
  }

  if (newLines.length > oldLines.length) {
    diff.added = newLines.length - oldLines.length
  } else if (oldLines.length > newLines.length) {
    diff.removed = oldLines.length - newLines.length
  }

  return diff
}

// Get version statistics
export const getVersionStats = (versions) => {
  if (!versions || versions.length === 0) {
    return {
      totalVersions: 0,
      oldestVersion: null,
      newestVersion: null,
      contributors: new Set(),
    }
  }

  const contributors = new Set()
  versions.forEach(v => {
    if (v.createdByName) {
      contributors.add(v.createdByName)
    }
  })

  return {
    totalVersions: versions.length,
    oldestVersion: versions[versions.length - 1],
    newestVersion: versions[0],
    contributors: Array.from(contributors),
    totalBackups: versions.filter(v => v.isBackup).length,
    totalRestores: versions.filter(v => v.isRestore).length,
  }
}

// Delete old versions (keep last N versions)
export const pruneVersionHistory = async (docId, keepVersions = 50) => {
  try {
    const versions = await getDocumentVersions(docId)

    if (versions.length <= keepVersions) {
      return { deleted: 0 }
    }

    const batch = writeBatch(db)
    const versionsToDelete = versions.slice(keepVersions)

    versionsToDelete.forEach(version => {
      const versionRef = doc(db, 'docs', docId, 'versions', version.id)
      batch.delete(versionRef)
    })

    await batch.commit()

    return { deleted: versionsToDelete.length }
  } catch (error) {
    console.error('Error pruning versions:', error)
    throw error
  }
}

// Get version timeline data
export const getVersionTimeline = async (docId) => {
  try {
    const versions = await getDocumentVersions(docId)

    const timeline = versions.map((version, index) => {
      const previousVersion = versions[index + 1] || null

      return {
        id: version.id,
        time: version.createdAt,
        author: version.createdByName,
        reason: version.reason,
        type: version.isRestore ? 'restore' : version.isBackup ? 'backup' : 'manual',
        wordCount: version.wordCount,
        characterCount: version.characterCount,
        diff: previousVersion
          ? calculateVersionDiff(previousVersion.content, version.content)
          : null,
      }
    })

    return timeline
  } catch (error) {
    console.error('Error getting version timeline:', error)
    throw error
  }
}

// Format version metadata for display
export const formatVersionMetadata = (version) => {
  return {
    id: version.id,
    createdAt: version.createdAt,
    author: version.createdByName || 'Unknown',
    reason: version.reason || 'Manual save',
    wordCount: version.wordCount || 0,
    characterCount: version.characterCount || 0,
    type: version.isRestore ? 'Restore' : version.isBackup ? 'Backup' : 'Version',
  }
}

// Compare two versions side-by-side
export const compareVersions = async (docId, versionId1, versionId2) => {
  try {
    const version1 = await getVersion(docId, versionId1)
    const version2 = await getVersion(docId, versionId2)

    const diff = calculateVersionDiff(version1.content, version2.content)

    return {
      version1: formatVersionMetadata(version1),
      version2: formatVersionMetadata(version2),
      content1: version1.content,
      content2: version2.content,
      diff,
      timestamp: new Date(),
    }
  } catch (error) {
    console.error('Error comparing versions:', error)
    throw error
  }
}

// Export version as file
export const exportVersion = (version, format = 'md') => {
  try {
    let content = version.content
    let mimeType = 'text/markdown'
    let fileName = `${version.title || 'document'}_v${version.id}.md`

    if (format === 'txt') {
      mimeType = 'text/plain'
      fileName = `${version.title || 'document'}_v${version.id}.txt`
    } else if (format === 'html') {
      // Basic markdown to HTML conversion
      content = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${version.title || 'Document'}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 900px; margin: 40px; line-height: 1.6; }
    pre { background: #f4f4f4; padding: 10px; overflow-x: auto; }
    code { background: #f4f4f4; padding: 2px 4px; }
    h1, h2, h3 { color: #333; }
  </style>
</head>
<body>
  <h1>${version.title || 'Document'}</h1>
  <p><em>Created: ${version.createdAt.toLocaleString()}</em></p>
  <hr>
  <pre>${content}</pre>
</body>
</html>
      `
      mimeType = 'text/html'
      fileName = `${version.title || 'document'}_v${version.id}.html`
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)

    return { success: true }
  } catch (error) {
    console.error('Error exporting version:', error)
    throw error
  }
}
