
import { loadStripe } from '@stripe/stripe-js';
import { toast } from '@/components/ui/use-toast';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export const createCheckoutSession = async (priceId: string) => {
  try {
    const stripe = await stripePromise;
    if (!stripe) {
      throw new Error('Stripe failed to initialize');
    }

    // In a real app, this would be an API call to your backend
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
      }),
    });

    const session = await response.json();

    const result = await stripe.redirectToCheckout({
      sessionId: session.id,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return { success: true };
  } catch (error) {
    console.error('Stripe checkout error:', error);
    toast({
      title: "Subscription Error",
      description: error instanceof Error ? error.message : 'An unknown error occurred',
      variant: "destructive",
    });
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
};

export const getSubscriptionPlans = async () => {
  try {
    // In a real app, fetch from your backend
    const plans = [
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
    return plans;
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    toast({
      title: "Error",
      description: "Failed to fetch subscription plans",
      variant: "destructive",
    });
    return [];
  }
};

export const getCurrentSubscription = async () => {
  try {
    // In a real app, fetch from your backend
    return {
      planId: 'price_basic',
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
  } catch (error) {
    console.error('Error fetching current subscription:', error);
    return null;
  }
};
