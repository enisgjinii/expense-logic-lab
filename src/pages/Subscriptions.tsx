
import React, { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, PlusCircle, CreditCard, CalendarDays, RefreshCw } from 'lucide-react';
import SubscriptionList from '@/components/subscriptions/SubscriptionList';
import SubscriptionForm from '@/components/subscriptions/SubscriptionForm';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const Subscriptions: React.FC = () => {
  const { subscriptions } = useFinance();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Calculate subscription statistics
  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
  const totalMonthly = activeSubscriptions
    .filter(sub => sub.billingCycle === 'monthly')
    .reduce((sum, sub) => sum + sub.amount, 0);
  
  const totalYearly = activeSubscriptions
    .filter(sub => sub.billingCycle === 'yearly')
    .reduce((sum, sub) => sum + sub.amount, 0) / 12; // Convert to monthly equivalent
  
  const totalQuarterly = activeSubscriptions
    .filter(sub => sub.billingCycle === 'quarterly')
    .reduce((sum, sub) => sum + sub.amount, 0) / 3; // Convert to monthly equivalent
  
  const totalWeekly = activeSubscriptions
    .filter(sub => sub.billingCycle === 'weekly')
    .reduce((sum, sub) => sum + sub.amount, 0) * 4.33; // Convert to monthly equivalent (average weeks in a month)
  
  const totalMonthlyEquivalent = totalMonthly + totalYearly + totalQuarterly + totalWeekly;
  
  // Get upcoming renewals in the next 30 days
  const today = new Date();
  const in30Days = new Date(today);
  in30Days.setDate(today.getDate() + 30);
  
  const upcomingRenewals = activeSubscriptions.filter(sub => {
    const renewalDate = new Date(sub.nextBillingDate);
    return renewalDate >= today && renewalDate <= in30Days;
  });

  return (
    <div className="space-y-8 animate-in px-2 sm:px-4 md:px-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Subscription Tracker</h1>
          <p className="text-muted-foreground">Manage and monitor all your recurring subscriptions</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Subscription
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Cost
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalMonthlyEquivalent.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Total equivalent monthly cost
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Subscriptions
            </CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscriptions.length}</div>
            <p className="text-xs text-muted-foreground">
              Total active recurring subscriptions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Renewals
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingRenewals.length}</div>
            <p className="text-xs text-muted-foreground">
              Renewals in the next 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Subscriptions</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Renewals</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          <SubscriptionList />
        </TabsContent>
        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Subscriptions</CardTitle>
              <CardDescription>
                Only showing currently active subscriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Active subscriptions would be shown here */}
              <p>Active subscriptions component</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Renewals</CardTitle>
              <CardDescription>
                Subscriptions renewing in the next 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Upcoming renewals would be shown here */}
              <p>Upcoming renewals component</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Subscription</DialogTitle>
            <DialogDescription>
              Add details of your subscription to keep track of it.
            </DialogDescription>
          </DialogHeader>
          <SubscriptionForm 
            onSuccess={() => setIsAddDialogOpen(false)} 
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Subscriptions;
