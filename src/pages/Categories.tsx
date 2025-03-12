
import React, { useState, useEffect } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tag, Plus, Save, Trash2, Edit, X, Check, Wallet, ChevronRight, Tag as TagIcon, CreditCard, Filter } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';

const Categories = () => {
  const { transactions } = useFinance();
  const [activeTab, setActiveTab] = useState('categories');
  
  // Extract unique categories and accounts from transactions
  const uniqueCategories = Array.from(new Set(transactions.map(t => t.category))).sort();
  const uniqueAccounts = Array.from(new Set(transactions.map(t => t.account))).sort();
  
  // States for new entries
  const [newCategory, setNewCategory] = useState('');
  const [newAccount, setNewAccount] = useState('');
  const [editingCategory, setEditingCategory] = useState<{id: number, name: string} | null>(null);
  const [editingAccount, setEditingAccount] = useState<{id: number, name: string} | null>(null);
  
  // Generate category/account usage statistics
  const categoryStats = uniqueCategories.map(category => {
    const count = transactions.filter(t => t.category === category).length;
    const totalAmount = transactions
      .filter(t => t.category === category)
      .reduce((sum, t) => sum + (t.type === 'Expense' ? t.amount : 0), 0);
    return { name: category, count, totalAmount };
  });
  
  const accountStats = uniqueAccounts.map(account => {
    const count = transactions.filter(t => t.account === account).length;
    const totalIncome = transactions
      .filter(t => t.account === account && t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
      .filter(t => t.account === account && t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;
    return { name: account, count, balance, totalIncome, totalExpense };
  });
  
  // Add new category
  const addCategory = () => {
    if (!newCategory.trim()) {
      toast({
        title: "Category name required",
        description: "Please enter a category name.",
        variant: "destructive",
      });
      return;
    }
    
    if (uniqueCategories.includes(newCategory.trim())) {
      toast({
        title: "Category already exists",
        description: `The category "${newCategory}" already exists.`,
        variant: "destructive",
      });
      return;
    }
    
    // In a real app, this would add to the database
    // For now, we'll just show a toast and update our local state
    toast({
      title: "Category added",
      description: `The category "${newCategory}" has been added.`,
    });
    
    setNewCategory('');
  };
  
  // Add new account
  const addAccount = () => {
    if (!newAccount.trim()) {
      toast({
        title: "Account name required",
        description: "Please enter an account name.",
        variant: "destructive",
      });
      return;
    }
    
    if (uniqueAccounts.includes(newAccount.trim())) {
      toast({
        title: "Account already exists",
        description: `The account "${newAccount}" already exists.`,
        variant: "destructive",
      });
      return;
    }
    
    // In a real app, this would add to the database
    // For now, we'll just show a toast and update our local state
    toast({
      title: "Account added",
      description: `The account "${newAccount}" has been added.`,
    });
    
    setNewAccount('');
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  // Update category name (placeholder for actual functionality)
  const updateCategory = (oldName: string, newName: string) => {
    if (!newName.trim()) {
      toast({
        title: "Category name required",
        description: "Please enter a category name.",
        variant: "destructive",
      });
      return;
    }
    
    if (oldName !== newName && uniqueCategories.includes(newName.trim())) {
      toast({
        title: "Category already exists",
        description: `The category "${newName}" already exists.`,
        variant: "destructive",
      });
      return;
    }
    
    // In a real app, this would update the database
    toast({
      title: "Category updated",
      description: `Category "${oldName}" has been renamed to "${newName}".`,
    });
    
    setEditingCategory(null);
  };
  
  // Update account name (placeholder for actual functionality)
  const updateAccount = (oldName: string, newName: string) => {
    if (!newName.trim()) {
      toast({
        title: "Account name required",
        description: "Please enter an account name.",
        variant: "destructive",
      });
      return;
    }
    
    if (oldName !== newName && uniqueAccounts.includes(newName.trim())) {
      toast({
        title: "Account already exists",
        description: `The account "${newName}" already exists.`,
        variant: "destructive",
      });
      return;
    }
    
    // In a real app, this would update the database
    toast({
      title: "Account updated",
      description: `Account "${oldName}" has been renamed to "${newName}".`,
    });
    
    setEditingAccount(null);
  };
  
  // Delete category (placeholder for actual functionality)
  const deleteCategory = (name: string) => {
    // In a real app, this would delete from the database or reassign transactions
    toast({
      title: "Category deleted",
      description: `The category "${name}" has been deleted.`,
    });
  };
  
  // Delete account (placeholder for actual functionality)
  const deleteAccount = (name: string) => {
    // In a real app, this would delete from the database or reassign transactions
    toast({
      title: "Account deleted",
      description: `The account "${name}" has been deleted.`,
    });
  };
  
  return (
    <div className="space-y-6 pb-8 animate-in">
      <div>
        <h1 className="text-2xl font-bold">Categories & Accounts</h1>
        <p className="text-muted-foreground">Manage your transaction categories and accounts</p>
      </div>
      
      <Tabs defaultValue="categories" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <TagIcon className="h-4 w-4" />
            <span>Categories</span>
          </TabsTrigger>
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span>Accounts</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="categories" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Add New Category</CardTitle>
              <CardDescription>Create a new category for your transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="new-category">Category Name</Label>
                  <Input 
                    id="new-category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Enter category name"
                  />
                </div>
                <Button 
                  className="mb-px"
                  onClick={addCategory}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>Manage existing transaction categories</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category Name</TableHead>
                    <TableHead>Usage Count</TableHead>
                    <TableHead className="text-right">Total Spent</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryStats.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        No categories found. Add your first category above.
                      </TableCell>
                    </TableRow>
                  ) : (
                    categoryStats.map((stat, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {editingCategory && editingCategory.id === index ? (
                            <div className="flex gap-2">
                              <Input 
                                value={editingCategory.name}
                                onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                                className="h-8"
                              />
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => setEditingCategory(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => updateCategory(stat.name, editingCategory.name)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <TagIcon className="h-4 w-4" />
                              {stat.name}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{stat.count}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(stat.totalAmount)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setEditingCategory({id: index, name: stat.name})}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Category</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete the "{stat.name}" category? This will affect all transactions using this category.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteCategory(stat.name)} className="bg-red-500 hover:bg-red-600">
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="accounts" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Add New Account</CardTitle>
              <CardDescription>Create a new account for tracking transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="new-account">Account Name</Label>
                  <Input 
                    id="new-account"
                    value={newAccount}
                    onChange={(e) => setNewAccount(e.target.value)}
                    placeholder="Enter account name"
                  />
                </div>
                <Button 
                  className="mb-px"
                  onClick={addAccount}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Account
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Accounts</CardTitle>
              <CardDescription>Manage your financial accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Usage Count</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accountStats.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        No accounts found. Add your first account above.
                      </TableCell>
                    </TableRow>
                  ) : (
                    accountStats.map((stat, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {editingAccount && editingAccount.id === index ? (
                            <div className="flex gap-2">
                              <Input 
                                value={editingAccount.name}
                                onChange={(e) => setEditingAccount({...editingAccount, name: e.target.value})}
                                className="h-8"
                              />
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => setEditingAccount(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => updateAccount(stat.name, editingAccount.name)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Wallet className="h-4 w-4" />
                              {stat.name}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{stat.count}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className={stat.balance >= 0 ? "text-green-600" : "text-red-600"}>
                            {formatCurrency(stat.balance)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setEditingAccount({id: index, name: stat.name})}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Account</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete the "{stat.name}" account? This will affect all transactions using this account.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteAccount(stat.name)} className="bg-red-500 hover:bg-red-600">
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Categories;
