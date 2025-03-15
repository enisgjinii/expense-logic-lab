
import React, { useState, useRef } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Transaction } from '@/types/finance';
import { v4 as uuidv4 } from 'uuid';
import { Loader2, Plus, Save, Image, StickyNote, Users } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ExpenseSplitter from './expense-splitting/ExpenseSplitter';

interface TransactionFormEnhancedProps {
  onSuccess?: () => void;
}

const TransactionFormEnhanced: React.FC<TransactionFormEnhancedProps> = ({ onSuccess }) => {
  const { transactions, addTransaction } = useFinance();
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive unique categories and accounts
  const uniqueCategories = Array.from(new Set(transactions.map(t => t.category))).sort();
  const uniqueAccounts = Array.from(new Set(transactions.map(t => t.account))).sort();

  const [formData, setFormData] = useState<Omit<Transaction, 'id'>>({
    account: uniqueAccounts[0] || '',
    category: uniqueCategories[0] || '',
    amount: 0,
    type: 'Expense',
    payment_type: 'TRANSFER',
    notes: '',
    notes_detailed: '',
    date: new Date().toISOString().slice(0, 16),
    description: '',
    currency: 'USD',
    imageAttachments: [],
    splitWith: []
  });

  const [newAccount, setNewAccount] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImagePreviewUrls: string[] = [...imagePreviewUrls];
    const newImageAttachments: string[] = [...(formData.imageAttachments || [])];

    Array.from(files).forEach(file => {
      // For now, we'll just create object URLs for preview
      // In a real app, you'd upload these to storage and get back URLs
      const objectUrl = URL.createObjectURL(file);
      newImagePreviewUrls.push(objectUrl);
      
      // In a real app, you'd set this to the uploaded file URL from your storage
      // For this demo, we'll just use the object URL
      newImageAttachments.push(objectUrl);
    });

    setImagePreviewUrls(newImagePreviewUrls);
    setFormData(prev => ({
      ...prev,
      imageAttachments: newImageAttachments
    }));

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImagePreviewUrls = [...imagePreviewUrls];
    const newImageAttachments = [...(formData.imageAttachments || [])];
    
    // Release the object URL to avoid memory leaks
    URL.revokeObjectURL(newImagePreviewUrls[index]);
    
    newImagePreviewUrls.splice(index, 1);
    newImageAttachments.splice(index, 1);
    
    setImagePreviewUrls(newImagePreviewUrls);
    setFormData(prev => ({
      ...prev,
      imageAttachments: newImageAttachments
    }));
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      notes_detailed: e.target.value
    }));
  };

  const handleSplitUpdate = (updatedTransaction: Transaction) => {
    setFormData(prev => ({
      ...prev,
      splitWith: updatedTransaction.splitWith
    }));
  };

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
        notes: formData.notes,
        notes_detailed: formData.notes_detailed,
        date: new Date(formData.date).toISOString().slice(0, 19).replace('T', ' '),
        description: formData.description,
        currency: formData.currency,
        imageAttachments: formData.imageAttachments,
        splitWith: formData.splitWith
      };

      await addTransaction(newTransaction);

      toast({
        title: "Transaction Created",
        description: "Your transaction has been successfully added.",
      });

      // Clean up object URLs to prevent memory leaks
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));

      // Reset the form
      setFormData({
        account: finalAccount,
        category: finalCategory,
        amount: 0,
        type: 'Expense',
        payment_type: 'TRANSFER',
        notes: '',
        notes_detailed: '',
        date: new Date().toISOString().slice(0, 16),
        description: '',
        currency: 'USD',
        imageAttachments: [],
        splitWith: []
      });
      setNewAccount('');
      setNewCategory('');
      setShowNewAccount(false);
      setShowNewCategory(false);
      setImagePreviewUrls([]);

      // If parent gave an onSuccess callback, call it
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
    <Card className="w-full shadow-sm bg-card/60 backdrop-blur-sm border">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Add New Transaction</CardTitle>
        <CardDescription>
          Create a new transaction with attachments and expense splitting
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="mx-6">
          <TabsList className="mb-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="attachments">
              <Image className="h-4 w-4 mr-1" />
              Attachments
            </TabsTrigger>
            <TabsTrigger value="notes">
              <StickyNote className="h-4 w-4 mr-1" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="split">
              <Users className="h-4 w-4 mr-1" />
              Split
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic">
            <CardContent className="space-y-4 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Transaction Type */}
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

                {/* Amount */}
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

                {/* Account (or add new) */}
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
                          {uniqueAccounts.map((acc) => (
                            <SelectItem key={acc} value={acc}>
                              {acc}
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

                {/* Category (or add new) */}
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
                          {uniqueCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
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

                {/* Payment Method */}
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

                {/* Date */}
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

                {/* Description */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Brief description of the transaction"
                  />
                </div>

                {/* Basic Notes */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Quick Note</Label>
                  <Input
                    id="notes"
                    name="notes"
                    value={formData.notes || ''}
                    onChange={handleChange}
                    placeholder="Brief note"
                  />
                </div>
              </div>
            </CardContent>
          </TabsContent>
          
          <TabsContent value="attachments">
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-2">
                <Label htmlFor="imageUpload">Upload Images</Label>
                <Input
                  id="imageUpload"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="cursor-pointer"
                />
              </div>
              
              {imagePreviewUrls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {imagePreviewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        className="rounded-md object-cover w-full h-24 border"
                        alt={`Attachment ${index + 1}`}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </TabsContent>
          
          <TabsContent value="notes">
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-2">
                <Label htmlFor="notes_detailed">Detailed Notes</Label>
                <Textarea
                  id="notes_detailed"
                  value={formData.notes_detailed || ''}
                  onChange={handleNotesChange}
                  placeholder="Add detailed notes about this transaction..."
                  className="min-h-[200px] resize-none"
                />
              </div>
            </CardContent>
          </TabsContent>
          
          <TabsContent value="split">
            <CardContent className="pt-0">
              <ExpenseSplitter 
                transaction={{
                  id: 'temp',
                  ...formData as any
                }}
                onChange={handleSplitUpdate}
              />
            </CardContent>
          </TabsContent>

          <CardFooter className="mt-4">
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
        </Tabs>
      </form>
    </Card>
  );
};

export default TransactionFormEnhanced;
