import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  // Active provider: 'simulation' | 'real' (or 'mock' | 'authorized_linkedin')
  dataProvider: (process.env.DATA_PROVIDER || process.env.DEFAULT_PROVIDER || 'simulation').toLowerCase(),
  linkedIn: {
    baseUrl: process.env.LINKEDIN_API_BASE_URL || 'https://api.linkedin.com/v2',
    apiKey: process.env.LINKEDIN_API_KEY || process.env.LINKEDIN_API_TOKEN || '',
    clientId: process.env.LINKEDIN_CLIENT_ID || '',
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
    redirectUri: process.env.LINKEDIN_REDIRECT_URI || '',
  }
};
