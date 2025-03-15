
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useFinance } from '@/contexts/FinanceContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Subscription } from '@/types/finance';
import { Loader2, Save } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface SubscriptionFormProps {
  existingSubscription?: Subscription;
  onSuccess?: (subscription: Subscription) => void;
  onCancel?: () => void;
}

const SubscriptionForm: React.FC<SubscriptionFormProps> = ({ 
  existingSubscription, 
  onSuccess, 
  onCancel 
}) => {
  const { addSubscription, updateSubscription } = useFinance();
  const [submitting, setSubmitting] = useState(false);
  
  const [subscription, setSubscription] = useState<Subscription>(
    existingSubscription || {
      id: uuidv4(),
      name: '',
      description: '',
      amount: 0,
      currency: 'USD',
      category: 'Subscription',
      billingCycle: 'monthly',
      nextBillingDate: new Date().toISOString().split('T')[0],
      autoRenew: true,
      status: 'active',
      provider: '',
      notificationDays: 5
    }
  );

  const handleChange = (field: keyof Subscription, value: any) => {
    setSubscription(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (subscription.name.trim() === '') {
        throw new Error('Subscription name is required');
      }

      if (subscription.amount <= 0) {
        throw new Error('Amount must be greater than zero');
      }

      if (existingSubscription) {
        await updateSubscription(subscription);
        toast({
          title: "Subscription Updated",
          description: "Your subscription has been updated successfully"
        });
      } else {
        await addSubscription(subscription);
        toast({
          title: "Subscription Added",
          description: "Your subscription has been added successfully"
        });
      }

      if (onSuccess) {
        onSuccess(subscription);
      }
    } catch (error) {
      console.error('Error saving subscription:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save subscription",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{existingSubscription ? 'Edit Subscription' : 'Add New Subscription'}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Subscription Name</Label>
              <Input
                id="name"
                value={subscription.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Netflix, Spotify, etc."
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Input
                id="provider"
                value={subscription.provider}
                onChange={(e) => handleChange('provider', e.target.value)}
                placeholder="Company providing the service"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={subscription.amount}
                onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="billingCycle">Billing Cycle</Label>
              <Select
                value={subscription.billingCycle}
                onValueChange={(value) => handleChange('billingCycle', value)}
              >
                <SelectTrigger id="billingCycle">
                  <SelectValue placeholder="Select billing cycle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={subscription.category}
                onChange={(e) => handleChange('category', e.target.value)}
                placeholder="Entertainment, Utilities, etc."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nextBillingDate">Next Billing Date</Label>
              <Input
                id="nextBillingDate"
                type="date"
                value={subscription.nextBillingDate}
                onChange={(e) => handleChange('nextBillingDate', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={subscription.status}
                onValueChange={(value) => handleChange('status', value as 'active' | 'paused' | 'canceled')}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notificationDays">Notification Days Before</Label>
              <Input
                id="notificationDays"
                type="number"
                min="0"
                value={subscription.notificationDays}
                onChange={(e) => handleChange('notificationDays', parseInt(e.target.value) || 0)}
                placeholder="Days before to notify"
              />
            </div>
            
            <div className="space-y-4 flex items-center justify-between">
              <Label htmlFor="autoRenew">Auto-Renew</Label>
              <Switch
                id="autoRenew"
                checked={subscription.autoRenew}
                onCheckedChange={(checked) => handleChange('autoRenew', checked)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={subscription.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Additional details about this subscription"
              className="resize-none"
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {existingSubscription ? 'Update' : 'Save'} Subscription
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default SubscriptionForm;
