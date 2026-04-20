import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  throw new Error("STRIPE_SECRET_KEY is required.");
}

// Let Stripe use the account/default API version instead of pinning a version
// that may not exist in the current test or sandbox environment.
export const stripe = new Stripe(secretKey);
