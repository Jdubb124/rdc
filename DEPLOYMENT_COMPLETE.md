# 🎉 Deployment Complete!

## ✅ Deployed Functions

All three Cloud Functions are now live and ready to use:

### 1. **processUser** - Individual User Processing
- **URL**: `https://us-central1-rdcpartnermatch.cloudfunctions.net/processUser`
- **Method**: POST
- **Parameters**: `{ "userId": "USER_ID" }`
- **Use Case**: Process individual user matches (call from Bubble.io)

### 2. **runMonthlyMatching** - Batch Processing
- **URL**: `https://us-central1-rdcpartnermatch.cloudfunctions.net/runMonthlyMatching`
- **Method**: GET or POST
- **Use Case**: Run monthly batch matching for all users

### 3. **healthCheck** - System Status
- **URL**: `https://us-central1-rdcpartnermatch.cloudfunctions.net/healthCheck`
- **Method**: GET
- **Response**: `{"status":"healthy","service":"restaurant-matcher"}`
- **Use Case**: Check if the system is running

---

## 🔗 Connecting to Your Bubble.io App

### Step 1: Add API Connector in Bubble

1. Go to **Plugins** → **API Connector** in your Bubble app
2. Add a new API call

### Step 2: Configure "Process User" Endpoint

**Call Name**: Process User Matches

```
Method: POST
URL: https://us-central1-rdcpartnermatch.cloudfunctions.net/processUser
Headers: (leave empty)
Body: 
  - Parameter: userId
  - Type: text
  - Value: [Current User's ID]
```

### Step 3: Use in Your Workflow

**Trigger**: When user clicks "Get Matches" button

**Action**: API Connector → "Process User Matches"

**Parameters**:
- `userId`: Use Bubble's dynamic data → `Current User's ID`

**After success**:
- Store response in a data field
- Display offers in a repeating group

---

## 🧪 Testing Your Functions

### Test Health Check
```bash
curl https://us-central1-rdcpartnermatch.cloudfunctions.net/healthCheck
```

### Test Process User (replace YOUR_USER_ID)
```bash
curl -X POST https://us-central1-rdcpartnermatch.cloudfunctions.net/processUser \
  -H "Content-Type: application/json" \
  -d '{"userId": "YOUR_USER_ID"}'
```

---

## 📊 Monitoring

### View Logs
```bash
# Individual function logs
gcloud functions logs read processUser --limit 50

# Real-time monitoring
gcloud functions logs read processUser --follow
```

### Dashboard
Visit: https://console.cloud.google.com/functions/list?project=rdcpartnermatch

---

## 🔄 Future Updates

When you push changes to GitHub, the GitHub Actions workflow will auto-deploy!

To manually redeploy:
```bash
./deploy.sh
```

---

## 🎯 What Happens When You Call processUser

1. **Fetches user data** from Bubble API using the `userId`
2. **Gets restaurants** in the user's neighborhood
3. **Calculates match scores** using:
   - Location preferences
   - Cuisine preferences
   - Visit history
   - Dining frequency
   - Restaurant ratings
4. **Creates offers** in your Bubble `Vendor_Offers` data type
5. **Returns results** to your Bubble app

The Cloud Function creates entries in your Bubble database with offers that expire in 30 days.

---

## 🎊 You're All Set!

Your Cloud Functions are deployed and ready to power your restaurant matching system!

