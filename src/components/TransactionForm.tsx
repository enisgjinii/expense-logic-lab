
import React, { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Transaction } from '@/types/finance';
import { v4 as uuidv4 } from 'uuid';
import { Loader2, Plus, Save } from 'lucide-react';
import { Textarea } from './ui/textarea';

interface TransactionFormProps {
  onSuccess?: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onSuccess }) => {
  const { transactions } = useFinance();
  const [submitting, setSubmitting] = useState(false);
  
  // Derive unique categories and accounts from existing transactions
  const uniqueCategories = Array.from(new Set(transactions.map(t => t.category))).sort();
  const uniqueAccounts = Array.from(new Set(transactions.map(t => t.account))).sort();
  
  const [formData, setFormData] = useState<Omit<Transaction, 'id'>>({
    account: uniqueAccounts[0] || '',
    category: uniqueCategories[0] || '',
    amount: 0,
    type: 'Expense',
    payment_type: 'TRANSFER',
    note: '',
    date: new Date().toISOString().slice(0, 16)
  });
  
  const [newAccount, setNewAccount] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    if (value === 'add_new_account') {
      setShowNewAccount(true);
      return;
    }
    
    if (value === 'add_new_category') {
      setShowNewCategory(true);
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const { addTransaction } = useFinance();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Create final transaction data
      const finalAccount = showNewAccount && newAccount ? newAccount : formData.account;
      const finalCategory = showNewCategory && newCategory ? newCategory : formData.category;
      
      if (!finalAccount) {
        throw new Error('Account is required');
      }
      
      if (!finalCategory) {
        throw new Error('Category is required');
      }
      
      if (formData.amount <= 0) {
        throw new Error('Amount must be greater than zero');
      }
      
      const newTransaction: Transaction = {
        id: uuidv4(),
        account: finalAccount,
        category: finalCategory,
        amount: formData.amount,
        type: formData.type,
        payment_type: formData.payment_type,
        note: formData.note,
        date: new Date(formData.date).toISOString().slice(0, 19).replace('T', ' ')
      };
      
      await addTransaction(newTransaction);
      
      toast({
        title: "Transaction Created",
        description: "Your transaction has been successfully added.",
      });
      
      // Reset form
      setFormData({
        account: finalAccount,
        category: finalCategory,
        amount: 0,
        type: 'Expense',
        payment_type: 'TRANSFER',
        note: '',
        date: new Date().toISOString().slice(0, 16)
      });
      
      setNewAccount('');
      setNewCategory('');
      setShowNewAccount(false);
      setShowNewCategory(false);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Failed to Create Transaction",
        description: (error as Error).message || "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Card className="w-full shadow-sm bg-card/60 backdrop-blur-sm border animate-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Add New Transaction</CardTitle>
        <CardDescription>
          Create a new transaction manually
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Transaction Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleSelectChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Income">Income</SelectItem>
                  <SelectItem value="Expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={formData.amount || ''}
                onChange={handleChange}
                placeholder="0.00"
                required
              />
            </div>
            
            <div className="space-y-2">
              {showNewAccount ? (
                <div className="space-y-2">
                  <Label htmlFor="newAccount">New Account</Label>
                  <div className="flex gap-2">
                    <Input
                      id="newAccount"
                      value={newAccount}
                      onChange={(e) => setNewAccount(e.target.value)}
                      placeholder="Enter new account name"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewAccount(false)}
                      className="px-2"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="account">Account</Label>
                  <Select
                    value={formData.account}
                    onValueChange={(value) => handleSelectChange('account', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueAccounts.map(account => (
                        <SelectItem key={account} value={account}>
                          {account}
                        </SelectItem>
                      ))}
                      <SelectItem value="add_new_account" className="text-primary font-medium">
                        + Add New Account
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              {showNewCategory ? (
                <div className="space-y-2">
                  <Label htmlFor="newCategory">New Category</Label>
                  <div className="flex gap-2">
                    <Input
                      id="newCategory"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Enter new category name"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewCategory(false)}
                      className="px-2"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleSelectChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueCategories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                      <SelectItem value="add_new_category" className="text-primary font-medium">
                        + Add New Category
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment_type">Payment Method</Label>
              <Select
                value={formData.payment_type}
                onValueChange={(value) => handleSelectChange('payment_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRANSFER">Transfer</SelectItem>
                  <SelectItem value="DEBIT_CARD">Debit Card</SelectItem>
                  <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="datetime-local"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="note">Note (Optional)</Label>
              <Textarea
                id="note"
                name="note"
                value={formData.note}
                onChange={handleChange}
                placeholder="Add details about this transaction..."
                className="resize-none"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            disabled={submitting}
            className="w-full transition-all hover:scale-[1.01]"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Transaction
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default TransactionForm;
