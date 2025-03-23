# WhiskeyLazy Finance - Netlify/Vercel Deployment

This is a serverless version of the WhiskeyLazy Finance application, designed for deployment on Netlify or Vercel.

## Project Structure

- `frontend/` - React frontend application
- `api/` - Serverless API functions
  - `functions/` - Individual API endpoints
  - `index.js` - Root API endpoint

## Local Development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### API

```bash
cd api
npm install
npm start
```

## Deployment

### Netlify Deployment

1. Push this repository to GitHub
2. Log in to Netlify
3. Click "New site from Git"
4. Connect to your GitHub repository
5. Configure build settings:
   - Build command: `cd frontend && npm install && npm run build`
   - Publish directory: `frontend/dist`
6. Add environment variables:
   - `PLAID_CLIENT_ID` - Your Plaid client ID
   - `PLAID_SECRET` - Your Plaid secret
   - `PLAID_ENV` - Plaid environment (sandbox, development, or production)
   - `JWT_SECRET` - Secret for JWT tokens
7. Deploy the site

### Vercel Deployment

1. Push this repository to GitHub
2. Log in to Vercel
3. Click "New Project"
4. Import your GitHub repository
5. Configure project settings:
   - Framework Preset: Other
   - Root Directory: ./
   - Build Command: cd frontend && npm install && npm run build
   - Output Directory: frontend/dist
6. Add environment variables:
   - `PLAID_CLIENT_ID` - Your Plaid client ID
   - `PLAID_SECRET` - Your Plaid secret
   - `PLAID_ENV` - Plaid environment (sandbox, development, or production)
   - `JWT_SECRET` - Secret for JWT tokens
7. Deploy the project

## Features

- React frontend with modern UI
- Serverless API functions
- Plaid integration for connecting bank accounts
- Responsive design
- Authentication system

## Plaid Integration

This application uses Plaid to connect to bank accounts and retrieve financial data. The Plaid integration is handled by the following components:

- Frontend:
  - `src/components/PlaidLink.jsx` - Plaid Link button component
  - `src/services/plaidService.js` - Service for Plaid API calls

- Backend:
  - `api/functions/plaid/create-link-token.js` - Creates a Plaid Link token
  - `api/functions/plaid/exchange-public-token.js` - Exchanges a public token for an access token

## Environment Variables

Create a `.env` file in both the frontend and api directories with the following variables:

### Frontend (.env):
```
REACT_APP_API_URL=http://localhost:3001/api
```

### API (.env):
```
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox
JWT_SECRET=your_jwt_secret
``` 