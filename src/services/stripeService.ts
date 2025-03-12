
import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'sonner';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51OFvSJDjgPy7qIYwcKHDEYTg4fh3p6v5vEARkGRgICExs3KCbS3LqITUEsVyBdVlnrgURZBXkRzQZI3uIBeFUXq500fSRNiA1s');

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
    
    // In a real app, this would call your backend API
    // which would create a Stripe Checkout session
    console.log(`Creating checkout session for price: ${priceId}`);
    
    // Mock response - in a real implementation, this would come from your server
    const session = {
      id: `cs_test_${Math.random().toString(36).substring(2, 15)}`,
    };
    
    // Simulate successful checkout for demo purposes
    // In a real app, this would redirect to Stripe Checkout
    if (priceId === 'price_basic') {
      currentSubscription = {
        id: `sub_${Math.random().toString(36).substring(2, 10)}`,
        name: 'Basic',
        status: 'active',
        renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      };
      toast.success('Successfully subscribed to Basic plan!');
    } else if (priceId === 'price_premium') {
      currentSubscription = {
        id: `sub_${Math.random().toString(36).substring(2, 10)}`,
        name: 'Premium',
        status: 'active',
        renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };
      toast.success('Successfully subscribed to Premium plan!');
    } else if (priceId === 'price_business') {
      currentSubscription = {
        id: `sub_${Math.random().toString(36).substring(2, 10)}`,
        name: 'Business',
        status: 'active',
        renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };
      toast.success('Successfully subscribed to Business plan!');
    }
    
    return { 
      success: true,
      subscription: currentSubscription
    };
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
