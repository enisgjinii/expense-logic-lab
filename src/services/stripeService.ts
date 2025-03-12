
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with your publishable key
// Replace with your actual publishable key when in production
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51OFvSJDjgPy7qIYwcKHDEYTg4fh3p6v5vEARkGRgICExs3KCbS3LqITUEsVyBdVlnrgURZBXkRzQZI3uIBeFUXq500fSRNiA1s');

export const createCheckoutSession = async (priceId: string) => {
  try {
    const stripe = await stripePromise;
    
    if (!stripe) {
      throw new Error('Stripe failed to initialize');
    }
    
    // This would typically be a server-side endpoint that creates a Stripe Checkout session
    // For demo purposes, we're mocking this behavior
    // In a real app, this would make a request to your backend which would create a Checkout Session
    
    console.log(`Creating checkout session for price: ${priceId}`);
    
    // Mock response - in a real implementation, this would come from your server
    const session = {
      id: `cs_test_${Math.random().toString(36).substring(2, 15)}`,
    };
    
    // Redirect to Checkout
    const result = await stripe.redirectToCheckout({
      sessionId: session.id,
    });
    
    if (result.error) {
      throw new Error(result.error.message);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    };
  }
};

export const getSubscriptionPlans = async () => {
  // In a real app, this would fetch plans from your backend
  // For now, return mock subscription plans
  return [
    {
      id: 'price_basic',
      name: 'Basic',
      price: 4.99,
      features: ['Up to 100 transactions', 'Basic reports', 'Email support'],
      interval: 'month',
    },
    {
      id: 'price_premium',
      name: 'Premium',
      price: 9.99,
      features: ['Unlimited transactions', 'Advanced reports', 'Priority support', 'Data export'],
      interval: 'month',
    },
    {
      id: 'price_business',
      name: 'Business',
      price: 19.99,
      features: ['Everything in Premium', 'Multiple users', 'API access', 'Dedicated support'],
      interval: 'month',
    },
  ];
};
