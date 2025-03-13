import React, { useState, useRef, useEffect } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Upload, Download, FileText, AlertCircle, FileWarning } from 'lucide-react';
import { Transaction } from '@/types/finance';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { parseXLS } from '@/utils/finance-utils';
import { Timestamp } from 'firebase/firestore'; // For Firestore date fields

// Helper to convert Excel serial dates (e.g. 45468.0833) to JS Dates
const excelDateToJSDate = (serial: number): Date => {
  const utcDays = Math.floor(serial - 25569);
  const fractionalDay = serial - Math.floor(serial);
  const totalSeconds = utcDays * 86400 + Math.round(fractionalDay * 86400);
  return new Date(totalSeconds * 1000);
};

const XLSImporter: React.FC = () => {
  const { importXLS, isLoading } = useFinance();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<Transaction[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [importStage, setImportStage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check for import errors stored by parseXLS in sessionStorage
  useEffect(() => {
    const storedErrors = sessionStorage.getItem('xlsImportErrors');
    if (storedErrors) {
      const parsedErrors = JSON.parse(storedErrors);
      if (parsedErrors.length > 0) {
        setErrors(parsedErrors);
        toast({
          title: "Import Completed with Warnings",
          description: `${parsedErrors.length} issues were found. Check details.`,
          variant: "destructive",
        });
      }
      sessionStorage.removeItem('xlsImportErrors');
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setErrors([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        if (!data) {
          toast({
            title: "File Error",
            description: "No data found in file",
            variant: "destructive",
          });
          return;
        }
        // Parse XLS data to generate preview transactions
        const previewTransactions = parseXLS(data as ArrayBuffer);

        // Convert Excel serial dates to ISO strings (if it's a number)
        const convertedTransactions = previewTransactions.map((t) => {
          if (typeof t.date === 'number') {
            return {
              ...t,
              date: excelDateToJSDate(t.date).toISOString(),
            };
          }
          return t;
        });

        setPreviewData(convertedTransactions.slice(0, 2000));
        toast({
          title: "File Loaded",
          description: `XLS file loaded with ${previewTransactions.length} transactions. You can preview before importing.`,
        });
      } catch (error: any) {
        toast({
          title: "Preview Failed",
          description: error.message || "Could not generate preview",
          variant: "destructive",
        });
      }
    };
    reader.onerror = () => {
      toast({
        title: "File Read Error",
        description: "Failed to read the file",
        variant: "destructive",
      });
    };
    // Read file as ArrayBuffer for XLSX parsing
    reader.readAsArrayBuffer(file);
  };

  // Simulate progress animation – returns interval ID for cleanup
  const simulateProgressAnimation = (onComplete: () => void): NodeJS.Timeout => {
    const stages = [
      'Processing XLS data...',
      'Validating transactions...',
      'Checking for duplicates...',
      'Finalizing import...'
    ];
    let currentStage = 0;
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setImportProgress(progress);
        setImportStage('Import complete!');
        onComplete();
      } else {
        if (progress > (currentStage + 1) * 25 && currentStage < stages.length - 1) {
          currentStage++;
        }
        setImportProgress(progress);
        setImportStage(stages[currentStage]);
      }
    }, 200);
    return interval;
  };

  const handleImport = () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select an XLS file to import",
        variant: "destructive",
      });
      return;
    }
    try {
      setErrors([]);
      setImportProgress(0);
      // Simulate progress
      const progressInterval = simulateProgressAnimation(async () => {
        // Convert each preview item’s date to Firestore Timestamp
        const transactionsReadyForImport = previewData.map((t) => {
          return {
            ...t,
            date: t.date,
          };
        });

        // Now call your import function with the updated array
        // The first argument is still the File, second is the transactions array
        await importXLS(selectedFile, transactionsReadyForImport);

        setSelectedFile(null);
        setPreviewData([]);
      });
      return () => clearInterval(progressInterval);
    } catch (error: any) {
      setImportProgress(0);
      toast({
        title: "Import Failed",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="w-full shadow-sm bg-card/60 backdrop-blur-sm border animate-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Import Transactions</CardTitle>
        <CardDescription>
          Upload an XLS or XLSX file with your transactions data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="import" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">Import File</TabsTrigger>
            <TabsTrigger value="preview" disabled={previewData.length === 0}>
              Preview
              {previewData.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {previewData.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={triggerFileInput}
                className="w-full flex items-center gap-2 transition-all hover:scale-[1.01]"
              >
                <Upload className="h-4 w-4" />
                Select XLS File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xls,.xlsx"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {errors.length > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.length} error{errors.length > 1 ? 's' : ''} found during parsing. Check details.</span>
              </div>
            )}

            {importProgress > 0 && importProgress < 100 && (
              <div className="space-y-2 py-2 animate-in fade-in">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{importStage}</span>
                  <span>{Math.round(importProgress)}%</span>
                </div>
                <Progress value={importProgress} className="h-2" />
              </div>
            )}
          </TabsContent>

          <TabsContent value="preview">
            {previewData.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileWarning className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Data Preview</span>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    Showing {previewData.length > 10 ? '10 of ' : ''}{previewData.length} transactions
                  </Badge>
                </div>
                <div className="rounded-md border overflow-x-auto">
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
                          <TableCell className="font-medium">{transaction.account}</TableCell>
                          <TableCell>{transaction.category}</TableCell>
                          <TableCell className="font-mono">${transaction.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={transaction.type === 'Income' ? 'success' : 'destructive'}
                              className="capitalize"
                            >
                              {transaction.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {(transaction.payment_type || 'TRANSFER').replace('_', ' ')}
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(transaction.date).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {errors.length > 0 && (
                  <div className="flex items-center gap-2 p-2 rounded-md bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.length} error{errors.length > 1 ? 's' : ''} found during parsing. Check details.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-4 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-16 w-16 text-muted-foreground/30" />
                  <p>No preview data available. Select a file to generate a preview.</p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleImport}
          disabled={isLoading || !selectedFile || importProgress > 0}
          className="w-full transition-all hover:scale-[1.01]"
        >
          {isLoading || importProgress > 0 ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {importProgress > 0 ? `Importing... ${Math.round(importProgress)}%` : 'Importing...'}
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

export default XLSImporter;
