# Restaurant Matching Algorithm

A serverless restaurant recommendation system built with Google Cloud Functions and Bubble.io.

## Architecture

- **Frontend**: Bubble.io
- **Backend**: Google Cloud Functions (Node.js)
- **Database**: Firestore (caching) + Bubble (primary)
- **Scheduler**: Google Cloud Scheduler
- **Language**: JavaScript/Node.js

## Features

- Monthly automated restaurant recommendations
- Weighted scoring algorithm based on:
  - Location preferences
  - Cuisine preferences
  - Visit history
  - Restaurant ratings
  - Dining frequency
- Real-time processing for individual users
- Batch processing for scalability

## Prerequisites

- Google Cloud Project with billing enabled
- Bubble.io application with API enabled
- Node.js 18+ installed locally
- Google Cloud CLI installed

## Installation

1. **Clone the repository**
```bash
   git clone https://github.com/YOUR_USERNAME/rdcroot.git
   cd rdcroot
```

2. **Install dependencies**
```bash
   cd functions
   npm install
```

3. **Configure environment**
```bash
   cp .env.example .env
   # Edit .env with your actual values
```

4. **Set up Google Cloud**
```bash
   # Login to Google Cloud
   gcloud auth login
   
   # Set project
   gcloud config set project YOUR_PROJECT_ID
   
   # Enable required APIs
   gcloud services enable cloudfunctions.googleapis.com
   gcloud services enable cloudscheduler.googleapis.com
   gcloud services enable firestore.googleapis.com
```

## Deployment

### Automatic Deployment
```bash
chmod +x deploy.sh
./deploy.sh
```

### Manual Deployment
```bash
# Deploy main function
gcloud functions deploy runMonthlyMatching \
  --runtime nodejs18 \
  --trigger-http \
  --entry-point runMonthlyMatching \
  --source ./functions \
  --set-env-vars BUBBLE_API_KEY=$BUBBLE_API_KEY,BUBBLE_APP_NAME=$BUBBLE_APP_NAME
```

## Testing
```bash
# Run local tests
npm test

# Test deployed function
node test/testMatching.js
```

## API Endpoints

- `POST /runMonthlyMatching` - Trigger monthly matching for all users
- `POST /processUser` - Process single user (Pub/Sub triggered)
- `GET /healthCheck` - System health check

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `BUBBLE_API_KEY` | Bubble.io API key | Yes |
| `BUBBLE_APP_NAME` | Bubble app name | Yes |
| `GCP_PROJECT_ID` | Google Cloud project ID | Yes |

## Project Structure
```
rdcroot/
├── functions/
│   ├── index.js           # Main cloud functions
│   ├── config.js           # Configuration
│   ├── services/
│   │   ├── bubbleService.js     # Bubble API integration
│   │   ├── matchingEngine.js    # Matching algorithm
│   │   └── firestoreService.js  # Caching layer
│   └── package.json
├── test/
│   └── testMatching.js
├── .env.example
├── .gitignore
├── deploy.sh
└── README.md
```

## Monitoring

View logs:
```bash
gcloud functions logs read runMonthlyMatching --limit=50
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Contact

Your Name - your.email@example.com