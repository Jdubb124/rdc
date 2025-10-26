// matchingEngine.js
const config = require('../config');

class MatchingEngine {
  constructor() {
    this.weights = config.matching.weights;
  }

  // Main scoring function
  calculateScore(user, restaurant, visitHistory) {
    let score = 0;
    
    // 1. Location Match (0-1)
    score += this.locationScore(user, restaurant) * this.weights.locationMatch;
    
    // 2. Cuisine Match (0-1)
    score += this.cuisineScore(user, restaurant) * this.weights.cuisineMatch;
    
    // 3. Visit Recency (0-1)
    score += this.recencyScore(visitHistory, restaurant) * this.weights.visitRecency;
    
    // 4. Visit Frequency (0-1)
    score += this.frequencyScore(user) * this.weights.visitFrequency;
    
    // 5. Restaurant Rating (0-1)
    score += this.ratingScore(restaurant) * this.weights.restaurantRating;
    
    // 6. Novelty Score (0-1)
    score += this.noveltyScore(visitHistory, restaurant) * this.weights.novelty;
    
    return Math.min(1, Math.max(0, score)); // Clamp between 0 and 1
  }

  // Location scoring
  locationScore(user, restaurant) {
    if (!user.neighborhood || !restaurant.neighborhood) return 0;
    
    // Same neighborhood = 1.0
    if (user.neighborhood === restaurant.neighborhood) return 1.0;
    
    // Same city = 0.5
    if (user.city === restaurant.city) return 0.5;
    
    // Nearby neighborhoods (you can expand this logic)
    const nearbyNeighborhoods = this.getNearbyNeighborhoods(user.neighborhood);
    if (nearbyNeighborhoods.includes(restaurant.neighborhood)) return 0.7;
    
    return 0;
  }

  // Cuisine preference scoring
  cuisineScore(user, restaurant) {
    if (!user.preferred_cuisines || !restaurant.cuisines) return 0;
    
    const userCuisines = new Set(user.preferred_cuisines);
    const restaurantCuisines = new Set(restaurant.cuisines);
    
    const intersection = [...userCuisines].filter(c => restaurantCuisines.has(c));
    
    return intersection.length / Math.max(userCuisines.size, 1);
  }

  // Visit recency scoring (decay function)
  recencyScore(visitHistory, restaurant) {
    const lastVisit = visitHistory.find(v => v.restaurant_id === restaurant._id);
    
    if (!lastVisit) return 1.0; // Never visited = high novelty score
    
    const daysSinceVisit = this.daysBetween(new Date(lastVisit.visit_date), new Date());
    
    // Decay function: score decreases as days increase
    // Full score after 30+ days, no score if visited today
    if (daysSinceVisit >= config.matching.daysBeforeRepeat) return 1.0;
    if (daysSinceVisit === 0) return 0;
    
    return daysSinceVisit / config.matching.daysBeforeRepeat;
  }

  // Frequency scoring
  frequencyScore(user) {
    if (!user.dining_frequency) return 0.5;
    
    const frequencyScores = {
      'daily': 1.0,
      'several_times_week': 0.8,
      'weekly': 0.6,
      'biweekly': 0.4,
      'monthly': 0.2,
      'rarely': 0.1
    };
    
    return frequencyScores[user.dining_frequency] || 0.5;
  }

  // Restaurant rating scoring
  ratingScore(restaurant) {
    if (!restaurant.average_rating) return 0.5;
    
    // Convert 5-star rating to 0-1 scale
    return restaurant.average_rating / 5;
  }

  // Novelty scoring (prefer new places)
  noveltyScore(visitHistory, restaurant) {
    const visited = visitHistory.some(v => v.restaurant_id === restaurant._id);
    return visited ? 0 : 1;
  }

  // Helper functions
  daysBetween(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((date2 - date1) / oneDay));
  }

  getNearbyNeighborhoods(neighborhood) {
    // Define neighborhood proximity (customize for your city)
    const proximityMap = {
      'downtown': ['midtown', 'old_town'],
      'midtown': ['downtown', 'uptown'],
      'uptown': ['midtown', 'suburbs'],
      // Add your neighborhood mappings
    };
    
    return proximityMap[neighborhood] || [];
  }

  // Get top matches for a user
  async getTopMatches(user, restaurants, visitHistory, limit = 5) {
    const scores = [];
    
    for (const restaurant of restaurants) {
      const score = this.calculateScore(user, restaurant, visitHistory);
      
      if (score >= config.matching.minScore) {
        scores.push({
          restaurant: restaurant,
          score: score,
          breakdown: this.getScoreBreakdown(user, restaurant, visitHistory)
        });
      }
    }
    
    // Sort by score descending and return top N
    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Get detailed score breakdown for debugging
  getScoreBreakdown(user, restaurant, visitHistory) {
    return {
      location: this.locationScore(user, restaurant),
      cuisine: this.cuisineScore(user, restaurant),
      recency: this.recencyScore(visitHistory, restaurant),
      frequency: this.frequencyScore(user),
      rating: this.ratingScore(restaurant),
      novelty: this.noveltyScore(visitHistory, restaurant)
    };
  }
}

module.exports = MatchingEngine;