# Bubble.io API Connector Setup Guide

## ✅ Correct Configuration for Your Cloud Function

Your Cloud Function accepts the `userId` parameter in two ways:
- **POST**: In the request body as JSON
- **GET**: As a URL query parameter

## 📋 Step-by-Step Setup

### Method 1: POST Request (Recommended)

#### In Bubble.io API Connector:

1. **Create a new API call**
   - Go to **Plugins** → **API Connector**
   - Click **Add a new API call**

2. **Basic Settings**
   - **Name**: `ProcessUserMatches`
   - **Method**: `POST` ⚠️
   - **URL**: `https://us-central1-rdcpartnermatch.cloudfunctions.net/processUser`

3. **Headers** (leave empty or skip this section)

4. **Body** 
   - Click **"Initialize call's data"**
   - Select **"Use custom JSON"**
   - Enter:
   ```json
   {
     "userId": "REPLACE_WITH_CURRENT_USER"
   }
   ```
   
5. **Dynamic Data Setup**
   - Click on `"REPLACE_WITH_CURRENT_USER"` in your JSON
   - Select: **"Dynamic data" → "Current user's _id"**
   
   This tells Bubble to use the logged-in user's ID automatically.

#### In Your Workflow:

```
Trigger: User clicks "Get Matches" button
  ↓
Action: Call API - ProcessUserMatches
  ↓
Success: Show results in repeating group
Error: Show error message to user
```

### Method 2: GET Request (Alternative)

#### In Bubble.io API Connector:

1. **Create a new API call**
   - **Name**: `ProcessUserMatches`
   - **Method**: `GET`
   - **URL**: `https://us-central1-rdcpartnermatch.cloudfunctions.net/processUser?userId=[REPLACE_WITH_USER_ID]`

2. **Dynamic Data Setup**
   - Click on `[REPLACE_WITH_USER_ID]` in the URL
   - Select: **"Dynamic data" → "Current user's _id"**

## 🧪 Testing Your Setup

1. **Save your API call**

2. **Test it manually**:
   - In Bubble, go to your workflow
   - Add a button "Test API"
   - Connect it to your API call
   - Run it while logged in as a user

3. **Check for errors**:
   - If you see `"Missing userId parameter"`, the dynamic data isn't connected
   - Make sure you're using **Current user's _id** (not email or name)

## 🔍 Common Mistakes

### ❌ Wrong: Not using dynamic data
```json
{
  "userId": "test123"
}
```

### ✅ Correct: Using dynamic data
```json
{
  "userId": "[[Current User's _id]]"
}
```

### ❌ Wrong: Wrong field name
```json
{
  "user": "[[Current User's _id]]"  
}
```

### ✅ Correct: Exact field name
```json
{
  "userId": "[[Current User's _id]]"
}
```

## 📊 What the Response Should Look Like

If successful, you'll get:
```json
{
  "success": true,
  "userId": "1234567890",
  "matches": 5,
  "offers": 5,
  "data": [/* array of offers */]
}
```

If there's an error:
```json
{
  "success": false,
  "error": "Missing userId parameter"
}
```

## 🎯 Quick Checklist

- [ ] Method is set to **POST** or **GET**
- [ ] URL is correct: `https://us-central1-rdcpartnermatch.cloudfunctions.net/processUser`
- [ ] Body contains `"userId": "[[Current User's _id]]"`
- [ ] Dynamic data is properly connected
- [ ] You're testing while logged in as a user
- [ ] User ID field in your database is correctly named

## 🆘 Still Getting "Missing userId"?

Try this test URL in your browser (replace `USER_ID_HERE` with an actual user ID from your database):
```
https://us-central1-rdcpartnermatch.cloudfunctions.net/processUser?userId=USER_ID_HERE
```

If this works, the issue is in your Bubble setup. If it doesn't work, there may be an issue with the userId in your database.

