
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createCheckoutSession, getSubscriptionPlans, getCurrentSubscription } from '@/services/stripeService';
import { useFinance } from '@/contexts/FinanceContext';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const SubscriptionPlans = () => {
  const [plans, setPlans] = React.useState<any[]>([]);
  const [loadingPlan, setLoadingPlan] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentSubscription, setCurrentSubscription] = React.useState<any>(null);
  const { toast: toastHook } = useToast();
  const { user } = useFinance();

  React.useEffect(() => {
    const fetchPlans = async () => {
      try {
        const subscriptionPlans = await getSubscriptionPlans();
        setPlans(subscriptionPlans);
        setCurrentSubscription(getCurrentSubscription());
      } catch (error) {
        console.error('Failed to fetch subscription plans:', error);
        toastHook({
          title: 'Error',
          description: 'Failed to load subscription plans. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, [toastHook]);

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      toast.error('Please log in to subscribe to a plan.');
      return;
    }

    try {
      setLoadingPlan(priceId);
      const result = await createCheckoutSession(priceId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create checkout session');
      }

      // Update current subscription
      setCurrentSubscription(getCurrentSubscription());
      
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process subscription');
    } finally {
      setLoadingPlan(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      {currentSubscription && currentSubscription.status === 'active' && (
        <div className="mb-8 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <h3 className="text-lg font-medium text-green-800 dark:text-green-300">
            Current Subscription: {currentSubscription.name}
          </h3>
          <p className="mt-1 text-sm text-green-700 dark:text-green-400">
            Your subscription renews on {currentSubscription.renewalDate?.toLocaleDateString() || 'N/A'}
          </p>
        </div>
      )}
    
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`flex flex-col relative overflow-hidden ${plan.mostPopular ? 'border-primary shadow-lg' : ''}`}
          >
            {plan.mostPopular && (
              <div className="absolute top-0 right-0">
                <Badge className="rounded-bl-md rounded-tr-md rounded-br-none rounded-tl-none">
                  Most Popular
                </Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>
                <span className="text-2xl font-bold">${plan.price}</span>/{plan.interval}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-2">
                {plan.features.map((feature: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => handleSubscribe(plan.id)}
                disabled={loadingPlan === plan.id || (currentSubscription?.status === 'active' && currentSubscription?.name === plan.name)}
                variant={plan.mostPopular ? "default" : "outline"}
              >
                {loadingPlan === plan.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : currentSubscription?.status === 'active' && currentSubscription?.name === plan.name ? (
                  'Current Plan'
                ) : (
                  'Subscribe'
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionPlans;
