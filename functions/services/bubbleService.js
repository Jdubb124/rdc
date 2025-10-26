// bubbleService.js
const axios = require('axios');
const config = require('../config');

class BubbleService {
  constructor() {
    this.baseUrl = config.bubble.baseUrl();
    this.headers = {
      'Authorization': `Bearer ${config.bubble.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  // Fetch all users with pagination
  async fetchUsers(cursor = 0, limit = 100) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/obj/User`, 
        {
          headers: this.headers,
          params: {
            cursor: cursor,
            limit: limit,
            constraints: JSON.stringify([
              { key: 'active', constraint_type: 'equals', value: true }
            ])
          }
        }
      );
      
      return {
        results: response.data.response.results,
        remaining: response.data.response.remaining,
        count: response.data.response.count
      };
    } catch (error) {
      console.error('Error fetching users:', error.message);
      throw error;
    }
  }

  // Fetch restaurants by neighborhood
  async fetchRestaurants(neighborhood = null) {
    try {
      const constraints = neighborhood 
        ? [{ key: 'neighborhood', constraint_type: 'equals', value: neighborhood }]
        : [];
      
      const response = await axios.get(
        `${this.baseUrl}/obj/Restaurant`,
        {
          headers: this.headers,
          params: {
            limit: 200,
            constraints: JSON.stringify(constraints)
          }
        }
      );
      
      return response.data.response.results;
    } catch (error) {
      console.error('Error fetching restaurants:', error.message);
      throw error;
    }
  }

  // Fetch user's visit history
  async fetchUserVisits(userId, daysBack = 90) {
    try {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - daysBack);
      
      const response = await axios.get(
        `${this.baseUrl}/obj/Visit`,
        {
          headers: this.headers,
          params: {
            constraints: JSON.stringify([
              { key: 'user_id', constraint_type: 'equals', value: userId },
              { key: 'visit_date', constraint_type: 'greater than', value: dateThreshold.toISOString() }
            ])
          }
        }
      );
      
      return response.data.response.results;
    } catch (error) {
      console.error(`Error fetching visits for user ${userId}:`, error.message);
      return [];
    }
  }

  // Create Vendor_Offer in Bubble
  async createVendorOffer(userId, restaurantId, score, expiryDate) {
    try {
      const offerData = {
        user_id: userId,
        restaurant_id: restaurantId,
        match_score: score,
        created_date: new Date().toISOString(),
        expiry_date: expiryDate,
        status: 'active',
        claimed: false
      };
      
      const response = await axios.post(
        `${this.baseUrl}/obj/Vendor_Offers`,
        offerData,
        { headers: this.headers }
      );
      
      return response.data.response;
    } catch (error) {
      console.error('Error creating vendor offer:', error.message);
      throw error;
    }
  }

  // Batch create offers for better performance
  async batchCreateOffers(offers) {
    const results = [];
    const chunks = this.chunkArray(offers, 10); // Process 10 at a time
    
    for (const chunk of chunks) {
      const promises = chunk.map(offer => 
        this.createVendorOffer(
          offer.userId,
          offer.restaurantId,
          offer.score,
          offer.expiryDate
        )
      );
      
      const chunkResults = await Promise.allSettled(promises);
      results.push(...chunkResults);
    }
    
    return results;
  }

  // Helper function to chunk arrays
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

module.exports = BubbleService;