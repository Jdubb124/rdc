# Complete Deployment Guide

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    BUBBLE.IO (Frontend)                     │
│  - User registration & login                                │
│  - Browse restaurants & offers                              │
│  - Check-in/visit tracking                                  │
└──────────────────────┬──────────────────────────────────────┘
                       │ API Calls
                       ↓
┌─────────────────────────────────────────────────────────────┐
│          GOOGLE CLOUD FUNCTIONS (Backend API)               │
│                                                             │
│  1. processUser endpoint                                    │
│     → Fetches user data from Bubble                         │
│     → Runs matching algorithm                               │
│     → Creates offers in Bubble                              │
│                                                             │
│  2. runMonthlyMatching endpoint                             │
│     → Batch processes all users                             │
│     → Creates monthly offers                                │
│                                                             │
│  3. healthCheck endpoint                                    │
│     → Status monitoring                                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                     FIRESTORE (Cache)                        │
│  - Store execution logs                                     │
│  - Cache expensive queries                                  │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Deployment Options

### Option 1: GitHub Actions (Recommended)

This is what you set up. **No Dockerfile needed!**

**Why no Dockerfile?**
- Google Cloud Functions uses a **managed build environment**
- You just provide source code and dependencies
- Google handles the containerization automatically

**Setup Steps:**

1. **Prepare Google Cloud Service Account** (one-time setup)
   ```bash
   # Download and run this locally
   gcloud iam service-accounts create github-actions \
     --display-name="GitHub Actions Deployer"
   
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/cloudfunctions.developer"
   
   gcloud iam service-accounts keys create github-actions-key.json \
     --iam-account=github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com
   ```

2. **Add GitHub Secrets**
   - Go to: Settings → Secrets and variables → Actions
   - Add:
     - `GCP_SA_KEY`: (Contents of `github-actions-key.json`)
     - `GCP_PROJECT_ID`: Your project ID
     - `BUBBLE_API_KEY`: From your Bubble.io settings
     - `BUBBLE_APP_NAME`: Your app name (the part before `.bubbleapps.io`)

3. **Push to main branch** - GitHub will auto-deploy!

### Option 2: Local Deployment (Manual)

```bash
# Make sure you have .env file with your credentials
chmod +x deploy.sh
./deploy.sh
```

## 🔗 Connecting to Your Bubble App

### Step 1: Get Your Function URLs

After deployment, find your function URLs:
```bash
gcloud functions list --region us-central1
```

Or via the console: https://console.cloud.google.com/functions

You'll get URLs like:
```
https://us-central1-YOUR_PROJECT.cloudfunctions.net/processUser
https://us-central1-YOUR_PROJECT.cloudfunctions.net/healthCheck
```

### Step 2: Add to Bubble

In your Bubble.io app:

1. **Go to Plugins → API Connector**

2. **Create new call: "Process User Matches"**
   - Method: POST
   - URL: `https://us-central1-YOUR_PROJECT.cloudfunctions.net/processUser`
   - Headers: (optional, Cloud Functions are public)
   - Parameters:
     - `userId` (type: text)

3. **Use in your workflow:**
   ```
   When: User clicks "Get Matches"
   Action: API Connector → "Process User Matches"
   - Pass: Current User's ID as userId parameter
   - Then: Display offers in a repeating group
   ```

### Step 3: Schedule Monthly Matching

Set up Cloud Scheduler for monthly batch runs:
```bash
gcloud scheduler jobs create http monthly-matching \
  --schedule="0 0 1 * *" \
  --uri="https://us-central1-YOUR_PROJECT.cloudfunctions.net/runMonthlyMatching" \
  --http-method=GET \
  --time-zone="America/Los_Angeles"
```

Or use Bubble's built-in scheduler to call the endpoint.

## 📊 Monitoring

View logs:
```bash
# Watch logs in real-time
gcloud functions logs read processUser --limit 50 --follow

# Check a specific execution
gcloud functions logs read runMonthlyMatching --limit 100
```

View in console: https://console.cloud.google.com/logs

## 🧪 Testing Endpoints

Test your endpoints after deployment:

```bash
# Health check
curl https://us-central1-YOUR_PROJECT.cloudfunctions.net/healthCheck

# Process a user (replace YOUR_USER_ID)
curl -X POST https://us-central1-YOUR_PROJECT.cloudfunctions.net/processUser \
  -H "Content-Type: application/json" \
  -d '{"userId": "YOUR_USER_ID"}'
```

## 🔑 Key Differences: Cloud Functions vs Cloud Run

| Feature | Cloud Functions (Your App) | Cloud Run |
|---------|---------------------------|-----------|
| **Dockerfile** | ❌ Not needed | ✅ Required |
| **Build Process** | Automatic | You provide Dockerfile |
| **Scaling** | Automatic | Automatic |
| **Best For** | APIs, Event triggers | Full containers |
| **Deployment** | Source code | Container image |

**Your app uses Cloud Functions** - hence no Dockerfile needed!

## 🎯 What Your App Does

1. **Bubble App** collects user preferences (location, cuisine, etc.)
2. **Cloud Function** (`processUser`) runs matching algorithm
3. **Cloud Function** creates `Vendor_Offers` in Bubble
4. **Bubble App** displays offers to users

The Cloud Functions are your **backend API** that Bubble calls!

