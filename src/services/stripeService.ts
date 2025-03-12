import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'sonner';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51R1naLL6VnbqNZjNTXhrZNUufpOtGljQdZFpVxYZhf4DcIvB47lnRpCcOeKzOv1g8ZEiJwHJ8MyXahBvp9eeCWlQ00LLHxLtLN');

// In a real app, this would be tracked in your database or via Stripe webhooks
// For now, we'll mock subscription status
let currentSubscription: {
  id: string;
  name: string;
  status: 'active' | 'canceled' | 'past_due' | null;
  renewalDate: Date | null;
} = {
  id: '',
  name: '',
  status: null,
  renewalDate: null
};

export const createCheckoutSession = async (priceId: string) => {
  try {
    const stripe = await stripePromise;
    
    if (!stripe) {
      throw new Error('Stripe failed to initialize');
    }

    // Call your backend API to create a checkout session
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        successUrl: `${window.location.origin}/settings?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/settings`,
      }),
    });

    const session = await response.json();

    if (!session || !session.sessionId) {
      throw new Error('Failed to create checkout session');
    }

    // Redirect to Stripe Checkout
    const { error } = await stripe.redirectToCheckout({
      sessionId: session.sessionId,
    });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  } catch (error) {
    console.error('Stripe checkout error:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to process subscription');
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    };
  }
};

export const getSubscriptionPlans = async () => {
  // In a real app, this would fetch plans from your backend
  return [
    {
      id: 'price_basic',
      name: 'Basic',
      price: 4.99,
      features: ['Up to 100 transactions', 'Basic reports', 'Email support'],
      interval: 'month',
      mostPopular: false
    },
    {
      id: 'price_premium',
      name: 'Premium',
      price: 9.99,
      features: ['Unlimited transactions', 'Advanced reports', 'Priority support', 'Data export'],
      interval: 'month',
      mostPopular: true
    },
    {
      id: 'price_business',
      name: 'Business',
      price: 19.99,
      features: ['Everything in Premium', 'Multiple users', 'API access', 'Dedicated support'],
      interval: 'month',
      mostPopular: false
    },
  ];
};

export const getCurrentSubscription = () => {
  return currentSubscription;
};

export const cancelSubscription = async () => {
  try {
    // In a real app, this would call your backend to cancel the subscription with Stripe
    console.log('Cancelling subscription:', currentSubscription.id);
    
    // Mock cancellation
    currentSubscription = {
      ...currentSubscription,
      status: 'canceled'
    };
    
    toast.success('Your subscription has been canceled');
    return { success: true };
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to cancel subscription');
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    };
  }
};

export const updatePaymentMethod = async () => {
  try {
    const stripe = await stripePromise;
    
    if (!stripe) {
      throw new Error('Stripe failed to initialize');
    }
    
    // In a real app, this would redirect to Stripe Billing Portal or a custom payment form
    console.log('Updating payment method');
    
    // Mock success
    toast.success('Payment method updated successfully');
    return { success: true };
  } catch (error) {
    console.error('Error updating payment:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to update payment method');
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    };
  }
};
