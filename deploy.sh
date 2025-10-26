#!/bin/bash

# Deploy script for Google Cloud Functions

echo "🚀 Deploying Restaurant Matcher to Google Cloud..."

# Set environment variables
export BUBBLE_API_KEY=$(cat .env | grep BUBBLE_API_KEY | cut -d '=' -f2)
export BUBBLE_APP_NAME=$(cat .env | grep BUBBLE_APP_NAME | cut -d '=' -f2)
export GCP_PROJECT_ID=$(cat .env | grep GCP_PROJECT_ID | cut -d '=' -f2)

# Deploy the main matching function
gcloud functions deploy runMonthlyMatching \
  --runtime nodejs18 \
  --trigger-http \
  --entry-point runMonthlyMatching \
  --source ./functions \
  --memory 512MB \
  --timeout 540s \
  --set-env-vars BUBBLE_API_KEY=$BUBBLE_API_KEY,BUBBLE_APP_NAME=$BUBBLE_APP_NAME,GCP_PROJECT_ID=$GCP_PROJECT_ID \
  --allow-unauthenticated

# Deploy the individual user processor
gcloud functions deploy processUser \
  --runtime nodejs18 \
  --trigger-topic user-matching \
  --entry-point processUser \
  --source ./functions \
  --memory 256MB \
  --timeout 60s \
  --set-env-vars BUBBLE_API_KEY=$BUBBLE_API_KEY,BUBBLE_APP_NAME=$BUBBLE_APP_NAME,GCP_PROJECT_ID=$GCP_PROJECT_ID

# Deploy health check
gcloud functions deploy healthCheck \
  --runtime nodejs18 \
  --trigger-http \
  --entry-point healthCheck \
  --source ./functions \
  --memory 128MB \
  --timeout 10s \
  --allow-unauthenticated

echo "✅ Deployment complete!"