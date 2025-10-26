// testMatching.js
const axios = require('axios');

async function testMatching() {
  try {
    console.log('Testing restaurant matching...');
    
    // Call your deployed function
    const response = await axios.post(
      'https://us-central1-restaurant-matcher-001.cloudfunctions.net/runMonthlyMatching'
    );
    
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Test with a single user
async function testSingleUser(userId) {
  const { PubSub } = require('@google-cloud/pubsub');
  const pubsub = new PubSub();
  
  const message = {
    userId: userId
  };
  
  const dataBuffer = Buffer.from(JSON.stringify(message));
  
  await pubsub.topic('user-matching').publish(dataBuffer);
  console.log(`Published message for user: ${userId}`);
}

// Run tests
testMatching();
// testSingleUser('user_id_from_bubble');