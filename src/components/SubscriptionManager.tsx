
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { 
  getCurrentSubscription, 
  cancelSubscription, 
  updatePaymentMethod 
} from '@/services/stripeService';

const SubscriptionManager = () => {
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);

  useEffect(() => {
    // Get current subscription
    const current = getCurrentSubscription();
    setSubscription(current);
    setIsLoading(false);
  }, []);

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    try {
      const result = await cancelSubscription();
      if (result.success) {
        setSubscription(getCurrentSubscription());
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleUpdatePayment = async () => {
    setIsUpdatingPayment(true);
    try {
      const result = await updatePaymentMethod();
      if (result.success) {
        toast.success('Payment information updated successfully');
      }
    } catch (error) {
      console.error('Error updating payment method:', error);
      toast.error('Failed to update payment method');
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!subscription || !subscription.status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>
            You don't have an active subscription
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Subscribe to a plan to get access to premium features.
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => window.location.href = '/settings?tab=subscription'}>
            View Plans
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Subscription</CardTitle>
        <CardDescription>
          Manage your {subscription.name} plan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Status</span>
            <span className={`font-medium ${
              subscription.status === 'active' 
                ? 'text-green-500' 
                : 'text-red-500'
            }`}>
              {subscription.status === 'active' ? 'Active' : 'Canceled'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Plan</span>
            <span className="font-medium">{subscription.name}</span>
          </div>
          
          {subscription.renewalDate && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Renewal Date</span>
              <span className="font-medium">
                {subscription.renewalDate.toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 sm:flex-row">
        {subscription.status === 'active' && (
          <>
            <Button 
              variant="outline" 
              className="w-full sm:w-auto flex gap-2 items-center"
              onClick={handleUpdatePayment}
              disabled={isUpdatingPayment}
            >
              {isUpdatingPayment ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              Update Payment
            </Button>
            
            <Button 
              variant="destructive" 
              className="w-full sm:w-auto"
              onClick={handleCancelSubscription}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Subscription'
              )}
            </Button>
          </>
        )}
        
        {subscription.status === 'canceled' && (
          <Button 
            variant="default" 
            className="w-full sm:w-auto"
            onClick={() => window.location.href = '/settings?tab=subscription'}
          >
            Resubscribe
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default SubscriptionManager;
