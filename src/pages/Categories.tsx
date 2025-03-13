
import React, { useState, useEffect } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tag, Plus, Save, Trash2, Edit, X, Check, Wallet, ChevronRight, Tag as TagIcon, CreditCard, Filter, Loader2 } from 'lucide-react';
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
import {
  fetchCategories,
  saveCategory,
  updateCategoryDoc,
  deleteCategoryDoc,
  fetchAccounts,
  saveAccount,
  updateAccountDoc,
  deleteAccountDoc
} from '@/contexts/firebaseService';

const Categories = () => {
  const { transactions, user } = useFinance();
  const [activeTab, setActiveTab] = useState('categories');
  const [loading, setLoading] = useState(true);
  
  // States for categories and accounts
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [accounts, setAccounts] = useState<{id: string, name: string}[]>([]);
  
  // States for new entries
  const [newCategory, setNewCategory] = useState('');
  const [newAccount, setNewAccount] = useState('');
  const [editingCategory, setEditingCategory] = useState<{id: string, name: string} | null>(null);
  const [editingAccount, setEditingAccount] = useState<{id: string, name: string} | null>(null);
  
  // Load categories and accounts from Firebase
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      if (user) {
        try {
          const fetchedCategories = await fetchCategories(user.uid);
          const fetchedAccounts = await fetchAccounts(user.uid);
          
          setCategories(fetchedCategories);
          setAccounts(fetchedAccounts);
        } catch (error) {
          console.error("Error loading categories/accounts:", error);
          toast({
            title: "Error",
            description: "Failed to load data from Firebase",
            variant: "destructive"
          });
        }
      } else {
        // When not logged in, use categories and accounts from transactions
        const uniqueCategories = Array.from(new Set(transactions.map(t => t.category)))
          .filter(Boolean)
          .map(name => ({
            id: uuidv4(),
            name: name || ''
          }));
        
        const uniqueAccounts = Array.from(new Set(transactions.map(t => t.account)))
          .filter(Boolean)
          .map(name => ({
            id: uuidv4(),
            name: name || ''
          }));
        
        setCategories(uniqueCategories);
        setAccounts(uniqueAccounts);
      }
      setLoading(false);
    };
    
    loadData();
  }, [user, transactions]);
  
  // Generate category/account usage statistics
  const categoryStats = categories.map(category => {
    const count = transactions.filter(t => t.category === category.name).length;
    const totalAmount = transactions
      .filter(t => t.category === category.name)
      .reduce((sum, t) => sum + (t.type === 'Expense' ? t.amount : 0), 0);
    return { ...category, count, totalAmount };
  });
  
  const accountStats = accounts.map(account => {
    const count = transactions.filter(t => t.account === account.name).length;
    const totalIncome = transactions
      .filter(t => t.account === account.name && t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
      .filter(t => t.account === account.name && t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;
    return { ...account, count, balance, totalIncome, totalExpense };
  });
  
  // Add new category
  const addCategory = async () => {
    if (!newCategory.trim()) {
      toast({
        title: "Category name required",
        description: "Please enter a category name.",
        variant: "destructive",
      });
      return;
    }
    
    if (categories.some(cat => cat.name.toLowerCase() === newCategory.trim().toLowerCase())) {
      toast({
        title: "Category already exists",
        description: `The category "${newCategory}" already exists.`,
        variant: "destructive",
      });
      return;
    }
    
    const newCategoryObj = {
      id: uuidv4(),
      name: newCategory.trim()
    };
    
    try {
      if (user) {
        await saveCategory(user.uid, newCategoryObj);
        // Refresh categories from Firebase
        const updatedCategories = await fetchCategories(user.uid);
        setCategories(updatedCategories);
      } else {
        // Local update when not signed in
        setCategories(prev => [...prev, newCategoryObj]);
      }
      
      toast({
        title: "Category added",
        description: `The category "${newCategory}" has been added.`,
      });
      
      setNewCategory('');
    } catch (error) {
      console.error("Error adding category:", error);
      toast({
        title: "Error",
        description: "Failed to add category",
        variant: "destructive"
      });
    }
  };
  
  // Add new account
  const addAccount = async () => {
    if (!newAccount.trim()) {
      toast({
        title: "Account name required",
        description: "Please enter an account name.",
        variant: "destructive",
      });
      return;
    }
    
    if (accounts.some(acc => acc.name.toLowerCase() === newAccount.trim().toLowerCase())) {
      toast({
        title: "Account already exists",
        description: `The account "${newAccount}" already exists.`,
        variant: "destructive",
      });
      return;
    }
    
    const newAccountObj = {
      id: uuidv4(),
      name: newAccount.trim()
    };
    
    try {
      if (user) {
        await saveAccount(user.uid, newAccountObj);
        // Refresh accounts from Firebase
        const updatedAccounts = await fetchAccounts(user.uid);
        setAccounts(updatedAccounts);
      } else {
        // Local update when not signed in
        setAccounts(prev => [...prev, newAccountObj]);
      }
      
      toast({
        title: "Account added",
        description: `The account "${newAccount}" has been added.`,
      });
      
      setNewAccount('');
    } catch (error) {
      console.error("Error adding account:", error);
      toast({
        title: "Error",
        description: "Failed to add account",
        variant: "destructive"
      });
    }
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  // Update category name
  const updateCategory = async (category: { id: string, name: string }, newName: string) => {
    if (!newName.trim()) {
      toast({
        title: "Category name required",
        description: "Please enter a category name.",
        variant: "destructive",
      });
      return;
    }
    
    if (category.name !== newName && categories.some(cat => cat.name.toLowerCase() === newName.trim().toLowerCase())) {
      toast({
        title: "Category already exists",
        description: `The category "${newName}" already exists.`,
        variant: "destructive",
      });
      return;
    }
    
    try {
      const updatedCategory = {
        id: category.id,
        name: newName.trim()
      };
      
      if (user) {
        await updateCategoryDoc(user.uid, updatedCategory);
        // Refresh categories from Firebase
        const updatedCategories = await fetchCategories(user.uid);
        setCategories(updatedCategories);
      } else {
        // Local update when not signed in
        setCategories(prev => prev.map(c => c.id === category.id ? updatedCategory : c));
      }
      
      toast({
        title: "Category updated",
        description: `Category "${category.name}" has been renamed to "${newName}".`,
      });
      
      setEditingCategory(null);
    } catch (error) {
      console.error("Error updating category:", error);
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive"
      });
    }
  };
  
  // Update account name
  const updateAccount = async (account: { id: string, name: string }, newName: string) => {
    if (!newName.trim()) {
      toast({
        title: "Account name required",
        description: "Please enter an account name.",
        variant: "destructive",
      });
      return;
    }
    
    if (account.name !== newName && accounts.some(acc => acc.name.toLowerCase() === newName.trim().toLowerCase())) {
      toast({
        title: "Account already exists",
        description: `The account "${newName}" already exists.`,
        variant: "destructive",
      });
      return;
    }
    
    try {
      const updatedAccount = {
        id: account.id,
        name: newName.trim()
      };
      
      if (user) {
        await updateAccountDoc(user.uid, updatedAccount);
        // Refresh accounts from Firebase
        const updatedAccounts = await fetchAccounts(user.uid);
        setAccounts(updatedAccounts);
      } else {
        // Local update when not signed in
        setAccounts(prev => prev.map(a => a.id === account.id ? updatedAccount : a));
      }
      
      toast({
        title: "Account updated",
        description: `Account "${account.name}" has been renamed to "${newName}".`,
      });
      
      setEditingAccount(null);
    } catch (error) {
      console.error("Error updating account:", error);
      toast({
        title: "Error",
        description: "Failed to update account",
        variant: "destructive"
      });
    }
  };
  
  // Delete category
  const deleteCategory = async (category: { id: string, name: string }) => {
    try {
      if (user) {
        await deleteCategoryDoc(user.uid, category.id);
        // Refresh categories from Firebase
        const updatedCategories = await fetchCategories(user.uid);
        setCategories(updatedCategories);
      } else {
        // Local update when not signed in
        setCategories(prev => prev.filter(c => c.id !== category.id));
      }
      
      toast({
        title: "Category deleted",
        description: `The category "${category.name}" has been deleted.`,
      });
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive"
      });
    }
  };
  
  // Delete account
  const deleteAccount = async (account: { id: string, name: string }) => {
    try {
      if (user) {
        await deleteAccountDoc(user.uid, account.id);
        // Refresh accounts from Firebase
        const updatedAccounts = await fetchAccounts(user.uid);
        setAccounts(updatedAccounts);
      } else {
        // Local update when not signed in
        setAccounts(prev => prev.filter(a => a.id !== account.id));
      }
      
      toast({
        title: "Account deleted",
        description: `The account "${account.name}" has been deleted.`,
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive"
      });
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
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
                    categoryStats.map((stat) => (
                      <TableRow key={stat.id}>
                        <TableCell>
                          {editingCategory && editingCategory.id === stat.id ? (
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
                                onClick={() => updateCategory(stat, editingCategory.name)}
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
                              onClick={() => setEditingCategory({id: stat.id, name: stat.name})}
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
                                  <AlertDialogAction onClick={() => deleteCategory(stat)} className="bg-red-500 hover:bg-red-600">
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
                    accountStats.map((stat) => (
                      <TableRow key={stat.id}>
                        <TableCell>
                          {editingAccount && editingAccount.id === stat.id ? (
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
                                onClick={() => updateAccount(stat, editingAccount.name)}
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
                              onClick={() => setEditingAccount({id: stat.id, name: stat.name})}
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
                                  <AlertDialogAction onClick={() => deleteAccount(stat)} className="bg-red-500 hover:bg-red-600">
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
