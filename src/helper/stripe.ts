import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  // We allow it to be missing during build time or if not provided yet, 
  // but it will throw when used if missing.
  console.warn('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-01-27' as any,
});
