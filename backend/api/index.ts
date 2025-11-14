// Vercel serverless function entry point
// This file exports the Express app for Vercel's serverless environment

import { app } from '../src/app';

// Export the Express app as a Vercel serverless function
export default app;
