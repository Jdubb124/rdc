# GitHub Actions Deployment Guide

## Setup Instructions

### 1. Create a Google Cloud Service Account

```bash
# Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Deployer"

# Grant necessary permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudfunctions.developer"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Create and download key
gcloud iam service-accounts keys create ~/github-actions-key.json \
  --iam-account=github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### 2. Add GitHub Secrets

Go to your GitHub repo → Settings → Secrets and variables → Actions

Add these secrets:
- `GCP_SA_KEY`: Contents of the `github-actions-key.json` file
- `GCP_PROJECT_ID`: Your Google Cloud project ID
- `BUBBLE_API_KEY`: Your Bubble.io API key
- `BUBBLE_APP_NAME`: Your Bubble app name (without `.bubbleapps.io`)

### 3. Enable Required APIs

```bash
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudscheduler.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable pubsub.googleapis.com
```

### 4. Deploy

Push to `main` branch or run the workflow manually from Actions tab.

## What Gets Deployed

- `runMonthlyMatching`: Main monthly batch processing function
- `processUser`: Individual user processing endpoint
- `healthCheck`: Health check endpoint

## Endpoints

After deployment, you'll get HTTPS URLs like:
```
https://us-central1-YOUR_PROJECT.cloudfunctions.net/runMonthlyMatching
https://us-central1-YOUR_PROJECT.cloudfunctions.net/processUser
https://us-central1-YOUR_PROJECT.cloudfunctions.net/healthCheck
```

Use these URLs in your Bubble.io app!

