
import React, { useState } from 'react';
import CSVImporter from '@/components/CSVImporter';
import TransactionForm from '@/components/TransactionForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinance } from '@/contexts/FinanceContext';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash, Plus } from 'lucide-react';
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

const Import: React.FC = () => {
  const { transactions, clearData } = useFinance();
  const [activeTab, setActiveTab] = useState<string>("import");
  
  return (
    <div className="space-y-8 pb-10 animate-in">
      <Tabs defaultValue="import" onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList className="grid w-[400px] grid-cols-2">
            <TabsTrigger value="import">Import CSV</TabsTrigger>
            <TabsTrigger value="create">Add Transaction</TabsTrigger>
          </TabsList>
          
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
      
        <TabsContent value="import" className="mt-0">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            <div className="md:col-span-1">
              <CSVImporter />
            </div>
            
            <div className="md:col-span-1">
              <Card className="h-full shadow-sm bg-card/60 backdrop-blur-sm border">
                <CardHeader>
                  <CardTitle className="text-xl">Instructions</CardTitle>
                  <CardDescription>
                    How to import your financial data
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
                      <li><strong>amount</strong>: Transaction amount (e.g., "125.45")</li>
                      <li><strong>type</strong>: Must be "Income" or "Expense"</li>
                      <li><strong>payment_type</strong>: "TRANSFER", "DEBIT_CARD", "CREDIT_CARD", or "CASH"</li>
                      <li><strong>note</strong>: Optional notes about the transaction</li>
                      <li><strong>date</strong>: Date in format "YYYY-MM-DD HH:MM:SS"</li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Note:</strong> Values with commas should be enclosed in quotes, e.g., <code>"Groceries, Food"</code>
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
        
        <TabsContent value="create" className="mt-0">
          <div className="grid gap-6 grid-cols-1">
            <TransactionForm onSuccess={() => {
              // Optional callback after successful transaction creation
            }} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Import;
