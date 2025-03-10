
import React, { useState, useRef, useEffect } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getExampleCSV, parseCSV } from '@/utils/finance-utils';
import { toast } from '@/components/ui/use-toast';
import { 
  Loader2, 
  Upload, 
  Download, 
  FileText, 
  Copy, 
  AlertCircle, 
  Eye, 
  EyeOff 
} from 'lucide-react';
import { Transaction } from '@/types/finance';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CSVImporter: React.FC = () => {
  const { importCSV, isLoading } = useFinance();
  const [csvContent, setCsvContent] = useState<string>('');
  const [previewData, setPreviewData] = useState<Transaction[]>([]);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check for import errors from sessionStorage
  useEffect(() => {
    const storedErrors = sessionStorage.getItem('csvImportErrors');
    if (storedErrors) {
      const parsedErrors = JSON.parse(storedErrors);
      if (parsedErrors.length > 0) {
        setErrors(parsedErrors);
        toast({
          title: "Import Completed with Warnings",
          description: `${parsedErrors.length} issues were found. See details below.`,
          variant: "destructive",
        });
      }
      sessionStorage.removeItem('csvImportErrors');
    }
  }, []);

  const handleImport = () => {
    if (!csvContent.trim()) {
      toast({
        title: "Empty Input",
        description: "Please provide CSV data to import",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Clear previous errors
      setErrors([]);
      importCSV(csvContent);
      setCsvContent('');
      setPreviewData([]);
      setPreviewMode(false);
    } catch (error) {
      toast({
        title: "Import Failed",
        description: (error as Error).message || "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
      setErrors([]);
      
      try {
        // Generate preview data
        const previewTransactions = parseCSV(content);
        setPreviewData(previewTransactions.slice(0, 5)); // Show first 5 entries
        
        // Check for stored errors
        const storedErrors = sessionStorage.getItem('csvImportErrors');
        if (storedErrors) {
          setErrors(JSON.parse(storedErrors));
          sessionStorage.removeItem('csvImportErrors');
        }
        
        toast({
          title: "File Loaded",
          description: "CSV file loaded successfully. You can preview the data before importing.",
        });
      } catch (error) {
        toast({
          title: "Preview Failed",
          description: (error as Error).message || "Could not generate preview",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const generatePreview = () => {
    if (!csvContent.trim()) {
      toast({
        title: "Empty Input",
        description: "Please provide CSV data to preview",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setErrors([]);
      const previewTransactions = parseCSV(csvContent);
      setPreviewData(previewTransactions.slice(0, 5)); // Show first 5 entries
      
      // Check for stored errors from the parser
      const storedErrors = sessionStorage.getItem('csvImportErrors');
      if (storedErrors) {
        setErrors(JSON.parse(storedErrors));
        sessionStorage.removeItem('csvImportErrors');
      }
      
      setPreviewMode(true);
    } catch (error) {
      toast({
        title: "Preview Failed",
        description: (error as Error).message || "Failed to parse CSV data",
        variant: "destructive",
      });
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const loadExampleData = () => {
    setCsvContent(getExampleCSV());
    toast({
      title: "Example Data Loaded",
      description: "Example CSV data has been loaded. You can preview before importing.",
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getExampleCSV());
    toast({
      title: "Copied to Clipboard",
      description: "Example CSV format copied to clipboard",
    });
  };

  return (
    <Card className="w-full shadow-sm bg-card/60 backdrop-blur-sm border animate-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Import Transactions</CardTitle>
        <CardDescription>
          Upload a CSV file or paste CSV data in the correct format
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="import" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">Import Data</TabsTrigger>
            <TabsTrigger value="preview" disabled={previewData.length === 0}>Preview Data</TabsTrigger>
          </TabsList>
          
          <TabsContent value="import" className="space-y-4">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={triggerFileInput}
                className="w-full flex items-center gap-2 transition-all hover:scale-[1.01]"
              >
                <Upload className="h-4 w-4" />
                Select CSV File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button 
                variant="outline" 
                onClick={loadExampleData}
                className="flex items-center gap-2 transition-all hover:scale-[1.01]"
              >
                <FileText className="h-4 w-4" />
                Load Example
              </Button>
              <Button 
                variant="outline" 
                onClick={copyToClipboard}
                className="w-12 transition-all hover:scale-[1.01]"
                title="Copy example CSV format"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="csv-content">CSV Content</Label>
                <span className="text-xs text-muted-foreground">Format: account,category,amount,type,payment_type,note,date</span>
              </div>
              <Textarea
                id="csv-content"
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder="Paste your CSV data here..."
                className="min-h-[180px] font-mono text-sm resize-y"
              />
            </div>
            
            {errors.length > 0 && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Import Warnings</AlertTitle>
                <AlertDescription>
                  <div className="text-sm mt-2 max-h-24 overflow-y-auto">
                    {errors.map((error, index) => (
                      <div key={index} className="py-1">{error}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex gap-2">
              <Button 
                onClick={generatePreview} 
                disabled={isLoading || !csvContent.trim()}
                variant="outline"
                className="w-full transition-all hover:scale-[1.01]"
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview Data
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="preview">
            {previewData.length > 0 ? (
              <div className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Payment Type</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((transaction, index) => (
                        <TableRow key={index}>
                          <TableCell>{transaction.account}</TableCell>
                          <TableCell>{transaction.category}</TableCell>
                          <TableCell>${transaction.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <span className={transaction.type === 'Income' ? 'text-green-500' : 'text-red-500'}>
                              {transaction.type}
                            </span>
                          </TableCell>
                          <TableCell>{transaction.payment_type}</TableCell>
                          <TableCell>{transaction.date}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {previewData.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Showing {previewData.length} of {previewData.length} transactions. 
                    {previewData.length === 5 && " (Only first 5 entries are shown in preview)"}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-4 text-muted-foreground">
                No preview data available. Generate a preview first.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleImport} 
          disabled={isLoading || !csvContent.trim()}
          className="w-full transition-all hover:scale-[1.01]"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Import Data
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CSVImporter;
