// index.js
const { PubSub } = require('@google-cloud/pubsub');
const BubbleService = require('./services/bubbleService');
const MatchingEngine = require('./services/matchingEngine');
const FirestoreService = require('./services/firestoreService');

// Initialize services
const bubbleService = new BubbleService();
const matchingEngine = new MatchingEngine();
const firestoreService = new FirestoreService();
const pubsub = new PubSub();

// Main matching function (triggered monthly by Cloud Scheduler)
exports.runMonthlyMatching = async (req, res) => {
  console.log('Starting monthly matching process...');
  
  const startTime = Date.now();
  const stats = {
    totalUsers: 0,
    totalMatches: 0,
    totalOffers: 0,
    errors: []
  };

  try {
    // 1. Fetch all active users
    console.log('Fetching users from Bubble...');
    const users = await fetchAllUsers();
    stats.totalUsers = users.length;
    
    // 2. Fetch all restaurants (cache this)
    console.log('Fetching restaurants from Bubble...');
    const restaurants = await bubbleService.fetchRestaurants();
    
    // 3. Process users in batches
    const userBatches = chunkArray(users, 10);
    
    for (const batch of userBatches) {
      await processUserBatch(batch, restaurants, stats);
    }
    
    // 4. Log execution
    await firestoreService.logExecution({
      type: 'monthly_matching',
      stats: stats,
      duration: Date.now() - startTime,
      success: true
    });
    
    console.log('Matching completed:', stats);
    res.status(200).json({ success: true, stats });
    
  } catch (error) {
    console.error('Matching failed:', error);
    stats.errors.push(error.message);
    
    await firestoreService.logExecution({
      type: 'monthly_matching',
      stats: stats,
      duration: Date.now() - startTime,
      success: false,
      error: error.message
    });
    
    res.status(500).json({ success: false, error: error.message });
  }
};

// Process individual user (HTTP endpoint for Bubble.io API Connector)
exports.processUser = async (req, res) => {
  console.log('processUser endpoint called');
  
  let userId;
  
  // Support both GET and POST requests
  if (req.method === 'POST') {
    userId = req.body?.userId;
  } else if (req.method === 'GET') {
    userId = req.query?.userId;
  }
  
  if (!userId) {
    res.status(400).json({ 
      success: false, 
      error: 'Missing userId parameter' 
    });
    return;
  }
  
  console.log(`Processing user: ${userId}`);
  
  try {
    // Fetch user data by ID (FIXED!)
    const user = await bubbleService.fetchUserById(userId);
    
    // Fetch user's neighborhood restaurants
    const restaurants = await bubbleService.fetchRestaurants(user.neighborhood);
    
    // Fetch visit history
    const visitHistory = await bubbleService.fetchUserVisits(userId);
    
    // Calculate matches
    const matches = await matchingEngine.getTopMatches(
      user, 
      restaurants, 
      visitHistory
    );
    
    // Create offers
    const offers = await createOffers(userId, matches);
    
    // Store results
    await firestoreService.storeMatchingResults(userId, offers);
    
    console.log(`Processed user ${userId}: ${offers.length} offers created`);
    
    // Return success response for Bubble.io
    res.status(200).json({ 
      success: true,
      userId: userId,
      matches: matches.length,
      offers: offers.length,
      data: offers
    });
    
  } catch (error) {
    console.error(`Error processing user ${userId}:`, error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      userId: userId
    });
  }
};
// Process user via Pub/Sub (legacy trigger)
exports.processUserPubSub = async (message, context) => {
  const userId = message.data 
    ? JSON.parse(Buffer.from(message.data, 'base64').toString()).userId 
    : null;
    
  if (!userId) {
    console.error('No userId provided');
    return;
  }
  
  console.log(`Processing user via Pub/Sub: ${userId}`);
  
  try {
    // Fetch user data
    const userResponse = await bubbleService.fetchUsers(0, 1);
    const user = userResponse.results[0];
    
    // Fetch user's neighborhood restaurants
    const restaurants = await bubbleService.fetchRestaurants(user.neighborhood);
    
    // Fetch visit history
    const visitHistory = await bubbleService.fetchUserVisits(userId);
    
    // Calculate matches
    const matches = await matchingEngine.getTopMatches(
      user, 
      restaurants, 
      visitHistory
    );
    
    // Create offers
    const offers = await createOffers(userId, matches);
    
    // Store results
    await firestoreService.storeMatchingResults(userId, offers);
    
    console.log(`Processed user ${userId}: ${offers.length} offers created`);
    
  } catch (error) {
    console.error(`Error processing user ${userId}:`, error);
    throw error;
  }
};

// Helper functions
async function fetchAllUsers() {
  const allUsers = [];
  let cursor = 0;
  let hasMore = true;
  
  while (hasMore) {
    const response = await bubbleService.fetchUsers(cursor, 100);
    allUsers.push(...response.results);
    
    if (response.remaining === 0) {
      hasMore = false;
    } else {
      cursor += response.results.length;
    }
  }
  
  return allUsers;
}

async function processUserBatch(users, restaurants, stats) {
  const promises = users.map(async (user) => {
    try {
      // Get visit history
      const visitHistory = await bubbleService.fetchUserVisits(user._id);
      
      // Filter restaurants by user's location
      const localRestaurants = restaurants.filter(r => 
        r.neighborhood === user.neighborhood || 
        r.city === user.city
      );
      
      // Get matches
      const matches = await matchingEngine.getTopMatches(
        user,
        localRestaurants,
        visitHistory,
        5
      );
      
      stats.totalMatches += matches.length;
      
      // Create offers
      const offers = await createOffers(user._id, matches);
      stats.totalOffers += offers.length;
      
      return offers;
      
    } catch (error) {
      console.error(`Error processing user ${user._id}:`, error);
      stats.errors.push({ userId: user._id, error: error.message });
      return [];
    }
  });
  
  await Promise.allSettled(promises);
}

async function createOffers(userId, matches) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30); // 30-day expiry
  
  const offers = matches.map(match => ({
    userId: userId,
    restaurantId: match.restaurant._id,
    score: match.score,
    expiryDate: expiryDate.toISOString()
  }));
  
  const results = await bubbleService.batchCreateOffers(offers);
  
  return results.filter(r => r.status === 'fulfilled').map(r => r.value);
}

function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Health check endpoint
exports.healthCheck = async (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'restaurant-matcher' });
};