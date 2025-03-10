
import React, { useState } from 'react';
import CSVImporter from '@/components/CSVImporter';
import TransactionForm from '@/components/TransactionForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinance } from '@/contexts/FinanceContext';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash, Plus, FileUp, FileSpreadsheet, Info } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";

const Import: React.FC = () => {
  const { transactions, clearData } = useFinance();
  const [activeTab, setActiveTab] = useState<string>("import");
  
  const handleImportSuccess = () => {
    toast({
      title: "Import Complete",
      description: "Your data has been successfully imported",
    });
  };
  
  const handleAddSuccess = () => {
    toast({
      title: "Transaction Added",
      description: "New transaction has been saved successfully",
    });
  };
  
  return (
    <div className="space-y-8 pb-10 animate-in">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Transaction Management</h1>
          
          {transactions.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-1">
                  <Trash className="h-4 w-4" />
                  Clear Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Clear All Financial Data
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. All your imported transactions and financial data will be permanently removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={clearData} className="bg-destructive text-destructive-foreground">
                    Clear Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        
        <p className="text-muted-foreground">
          Import transactions from CSV or add them manually to keep track of your finances.
        </p>
      </div>
      
      <Tabs defaultValue="import" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="import" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Import CSV
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Transaction
          </TabsTrigger>
        </TabsList>
      
        <TabsContent value="import" className="mt-6">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            <div className="md:col-span-1">
              <CSVImporter />
            </div>
            
            <div className="md:col-span-1">
              <Card className="h-full shadow-sm bg-card/60 backdrop-blur-sm border">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Info className="h-5 w-5 text-muted-foreground" />
                    CSV Import Guide
                  </CardTitle>
                  <CardDescription>
                    How to properly format your CSV file
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Import your financial transactions by uploading a CSV file or pasting CSV data in the correct format.
                  </p>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">CSV Format:</h3>
                    <div className="bg-muted p-3 rounded-md text-xs font-mono">
                      account,category,amount,type,payment_type,note,date
                    </div>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li><strong>account</strong>: The account name (e.g., "Bank of America")</li>
                      <li><strong>category</strong>: Transaction category (e.g., "Groceries")</li>
                      <li><strong>amount</strong>: Transaction amount (e.g., "125.45" or "-125.45")</li>
                      <li><strong>type</strong>: Must be "Income" or "Expense"</li>
                      <li><strong>payment_type</strong>: "TRANSFER", "DEBIT_CARD", "CREDIT_CARD", or "CASH"</li>
                      <li><strong>note</strong>: Optional notes about the transaction</li>
                      <li><strong>date</strong>: Date in format "YYYY-MM-DD HH:MM:SS"</li>
                    </ul>
                    <div className="bg-muted/50 p-3 rounded-md text-xs mt-4">
                      <p className="font-medium mb-2">Example Row:</p>
                      <code className="text-xs break-all">Bank Account,Groceries,125.45,Expense,DEBIT_CARD,Weekly shopping,2023-05-10 14:30:00</code>
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                      <strong>Note:</strong> Values with commas must be enclosed in quotes, e.g., <code>"Groceries, Food"</code>
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4">
                    <div className="text-sm text-muted-foreground">
                      {transactions.length > 0 ? (
                        <span>You have <strong>{transactions.length}</strong> imported transactions</span>
                      ) : (
                        <span>No transactions imported yet</span>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => setActiveTab("create")}
                    >
                      <Plus className="h-4 w-4" />
                      Add Manually
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="create" className="mt-6">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            <div className="md:col-span-1">
              <TransactionForm onSuccess={handleAddSuccess} />
            </div>
            
            <div className="md:col-span-1">
              <Card className="h-full shadow-sm bg-card/60 backdrop-blur-sm border">
                <CardHeader>
                  <CardTitle className="text-xl">Quick Tips</CardTitle>
                  <CardDescription>
                    Guidelines for adding transactions manually
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Add transactions directly using the form. Here are some helpful tips:
                  </p>
                  
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                    <li>Use categories consistently to improve reporting accuracy</li>
                    <li>Negative amounts will automatically be treated as expenses</li>
                    <li>Enter the full date and time for proper sorting and reporting</li>
                    <li>Include descriptive notes to help identify transactions later</li>
                    <li>Choose the correct payment type for better categorization</li>
                  </ul>
                  
                  <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700 mt-4">
                    <div className="flex items-start gap-2">
                      <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Data Syncing</p>
                        <p className="text-blue-600 mt-1">
                          Transactions are stored locally in your browser. Create an account and sign in to sync your data across devices.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4">
                    <div className="text-sm text-muted-foreground">
                      {transactions.length > 0 ? (
                        <span>You have <strong>{transactions.length}</strong> total transactions</span>
                      ) : (
                        <span>No transactions added yet</span>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => setActiveTab("import")}
                    >
                      <FileUp className="h-4 w-4" />
                      Import CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Import;

