
import React, { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Subscription } from '@/types/finance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, AlertCircle, Check, PauseCircle, XCircle, CalendarDays } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import SubscriptionForm from './SubscriptionForm';
import { toast } from '@/components/ui/use-toast';
import { formatDistanceToNow, isPast, isBefore, addDays } from 'date-fns';

const SubscriptionList: React.FC = () => {
  const { subscriptions, deleteSubscription } = useFinance();
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const handleEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setSubscriptionToDelete(id);
    setConfirmDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (subscriptionToDelete) {
      try {
        await deleteSubscription(subscriptionToDelete);
        toast({
          title: "Subscription Deleted",
          description: "The subscription has been removed successfully"
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete subscription",
          variant: "destructive"
        });
      }
      setConfirmDialogOpen(false);
      setSubscriptionToDelete(null);
    }
  };

  const sortedSubscriptions = [...subscriptions].sort((a, b) => {
    // First by status (active first)
    if (a.status !== b.status) {
      if (a.status === 'active') return -1;
      if (b.status === 'active') return 1;
    }
    
    // Then by next billing date
    return new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime();
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500"><Check className="h-3 w-3 mr-1" /> Active</Badge>;
      case 'paused':
        return <Badge className="bg-amber-500"><PauseCircle className="h-3 w-3 mr-1" /> Paused</Badge>;
      case 'canceled':
        return <Badge className="bg-red-500"><XCircle className="h-3 w-3 mr-1" /> Canceled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getBillingInfo = (subscription: Subscription) => {
    const nextBillingDate = new Date(subscription.nextBillingDate);
    
    if (isPast(nextBillingDate)) {
      return (
        <div className="flex items-center text-red-500">
          <AlertCircle className="h-4 w-4 mr-1" />
          <span>Overdue</span>
        </div>
      );
    }
    
    // Check if billing is coming soon (based on notification days)
    if (subscription.notificationDays && 
        isBefore(new Date(), addDays(nextBillingDate, -subscription.notificationDays))) {
      return (
        <div className="flex items-center">
          <CalendarDays className="h-4 w-4 mr-1" />
          <span>{formatDistanceToNow(nextBillingDate, { addSuffix: true })}</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center text-amber-500">
        <AlertCircle className="h-4 w-4 mr-1" />
        <span>Due {formatDistanceToNow(nextBillingDate, { addSuffix: true })}</span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Active Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <div className="text-center p-6 text-muted-foreground">
              No subscriptions found. Add your first subscription to start tracking.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Billing Cycle</TableHead>
                    <TableHead>Next Billing</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell className="font-medium">
                        {subscription.name}
                        {subscription.provider && (
                          <div className="text-xs text-muted-foreground">
                            {subscription.provider}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{subscription.category}</TableCell>
                      <TableCell>
                        ${subscription.amount.toFixed(2)}
                        <div className="text-xs text-muted-foreground">
                          {subscription.billingCycle}
                        </div>
                      </TableCell>
                      <TableCell>{subscription.billingCycle}</TableCell>
                      <TableCell>
                        {new Date(subscription.nextBillingDate).toLocaleDateString()}
                        <div className="text-xs">
                          {getBillingInfo(subscription)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(subscription)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(subscription.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Subscription</DialogTitle>
            <DialogDescription>
              Update the details of your subscription.
            </DialogDescription>
          </DialogHeader>
          {editingSubscription && (
            <SubscriptionForm
              existingSubscription={editingSubscription}
              onSuccess={() => setIsDialogOpen(false)}
              onCancel={() => setIsDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this subscription? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionList;
