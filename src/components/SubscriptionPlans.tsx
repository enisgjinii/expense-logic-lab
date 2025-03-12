
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createCheckoutSession, getSubscriptionPlans } from '@/services/stripeService';
import { useFinance } from '@/contexts/FinanceContext';

const SubscriptionPlans = () => {
  const [plans, setPlans] = React.useState<any[]>([]);
  const [loadingPlan, setLoadingPlan] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();
  const { user } = useFinance();

  React.useEffect(() => {
    const fetchPlans = async () => {
      try {
        const subscriptionPlans = await getSubscriptionPlans();
        setPlans(subscriptionPlans);
      } catch (error) {
        console.error('Failed to fetch subscription plans:', error);
        toast({
          title: 'Error',
          description: 'Failed to load subscription plans. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, [toast]);

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to subscribe to a plan.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoadingPlan(priceId);
      const result = await createCheckoutSession(priceId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create checkout session');
      }

      // Success is handled by the redirect to Stripe Checkout
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: 'Subscription Error',
        description: error instanceof Error ? error.message : 'Failed to process subscription. Please try again.',
        variant: 'destructive',
      });
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
    <div className="grid gap-6 md:grid-cols-3">
      {plans.map((plan) => (
        <Card key={plan.id} className="flex flex-col">
          <CardHeader>
            <CardTitle>{plan.name}</CardTitle>
            <CardDescription>
              ${plan.price}/{plan.interval}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="space-y-2">
              {plan.features.map((feature: string, idx: number) => (
                <li key={idx} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => handleSubscribe(plan.id)}
              disabled={loadingPlan === plan.id}
            >
              {loadingPlan === plan.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Subscribe'
              )}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default SubscriptionPlans;
