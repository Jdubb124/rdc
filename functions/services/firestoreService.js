// firestoreService.js
const { Firestore } = require('@google-cloud/firestore');

class FirestoreService {
  constructor() {
    this.db = new Firestore({
      projectId: process.env.GCP_PROJECT_ID
    });
  }

  // Cache user data
  async cacheUserData(userId, userData, ttlHours = 24) {
    const docRef = this.db.collection('users').doc(userId);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ttlHours);
    
    await docRef.set({
      ...userData,
      cached_at: Firestore.FieldValue.serverTimestamp(),
      expires_at: expiresAt
    });
  }

  // Get cached user data
  async getCachedUserData(userId) {
    const docRef = this.db.collection('users').doc(userId);
    const doc = await docRef.get();
    
    if (!doc.exists) return null;
    
    const data = doc.data();
    if (new Date(data.expires_at) < new Date()) {
      return null; // Cache expired
    }
    
    return data;
  }

  // Store matching results
  async storeMatchingResults(userId, matches) {
    const docRef = this.db.collection('matching_results').doc(userId);
    
    await docRef.set({
      user_id: userId,
      matches: matches,
      created_at: Firestore.FieldValue.serverTimestamp(),
      status: 'completed'
    });
  }

  // Store execution logs
  async logExecution(executionData) {
    const logsRef = this.db.collection('execution_logs');
    
    await logsRef.add({
      ...executionData,
      timestamp: Firestore.FieldValue.serverTimestamp()
    });
  }

  // Get last execution time
  async getLastExecutionTime() {
    const query = this.db.collection('execution_logs')
      .orderBy('timestamp', 'desc')
      .limit(1);
    
    const snapshot = await query.get();
    
    if (snapshot.empty) return null;
    
    return snapshot.docs[0].data().timestamp;
  }

  // Batch operations for performance
  async batchCache(items, collectionName) {
    const batch = this.db.batch();
    
    items.forEach(item => {
      const docRef = this.db.collection(collectionName).doc(item.id);
      batch.set(docRef, item);
    });
    
    await batch.commit();
  }
}

module.exports = FirestoreService;