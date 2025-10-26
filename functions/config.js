// config.js
module.exports = {
    bubble: {
      apiKey: process.env.BUBBLE_API_KEY,
      appName: process.env.BUBBLE_APP_NAME,
      apiVersion: '1.1',
      baseUrl: function() {
        return `https://${this.appName}.bubbleapps.io/api/${this.apiVersion}`;
      }
    },
    matching: {
      weights: {
        locationMatch: 0.25,
        cuisineMatch: 0.20,
        visitRecency: 0.15,
        visitFrequency: 0.10,
        similarUsers: 0.15,
        restaurantRating: 0.10,
        novelty: 0.05
      },
      maxRecommendations: 5,
      minScore: 0.3,
      daysBeforeRepeat: 30
    },
    batch: {
      userBatchSize: 50,
      restaurantBatchSize: 100
    }
  };