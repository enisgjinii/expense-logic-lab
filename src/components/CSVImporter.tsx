
import React, { useState, useRef, useEffect } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getExampleCSV, parseCSV, analyzeCSVFormat } from '@/utils/finance-utils';
import { toast } from '@/components/ui/use-toast';
import { 
  Loader2, 
  Upload, 
  Download, 
  FileText, 
  Copy, 
  AlertCircle, 
  Eye, 
  EyeOff,
  CheckCircle2,
  XCircle,
  FileWarning,
  Info
} from 'lucide-react';
import { Transaction } from '@/types/finance';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";

const CSVImporter: React.FC = () => {
  const { importCSV, isLoading } = useFinance();
  const [csvContent, setCsvContent] = useState<string>('');
  const [previewData, setPreviewData] = useState<Transaction[]>([]);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [formatAnalysis, setFormatAnalysis] = useState<any>(null);
  const [expandedErrors, setExpandedErrors] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [importStage, setImportStage] = useState<string>('');
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
      setWarnings([]);
      
      // Simulate import progress
      setImportProgress(0);
      setImportStage('Analyzing CSV format...');
      
      // Begin progress animation
      const progressInterval = simulateProgressAnimation(() => {
        // Once progress is done, do the actual import
        importCSV(csvContent);
        setCsvContent('');
        setPreviewData([]);
        setPreviewMode(false);
        setFormatAnalysis(null);
      });
      
      // Cleanup on component unmount
      return () => clearInterval(progressInterval);
    } catch (error) {
      setImportProgress(0);
      toast({
        title: "Import Failed",
        description: (error as Error).message || "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  // Simulate progress animation - returns interval ID for cleanup
  const simulateProgressAnimation = (onComplete: () => void): NodeJS.Timeout => {
    const stages = [
      'Analyzing CSV format...',
      'Validating data structure...',
      'Processing transactions...',
      'Checking for duplicates...',
      'Finalizing import...'
    ];
    
    let currentStage = 0;
    let progress = 0;
    
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setImportProgress(progress);
        setImportStage('Import complete!');
        onComplete();
      } else {
        // Update progress and occasionally change the stage message
        if (progress > (currentStage + 1) * 20 && currentStage < stages.length - 1) {
          currentStage++;
        }
        setImportProgress(progress);
        setImportStage(stages[currentStage]);
      }
    }, 200);
    
    return interval;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
      setErrors([]);
      setWarnings([]);
      
      try {
        // Analyze CSV format
        const analysis = analyzeCSVFormat(content);
        setFormatAnalysis(analysis);
        
        if (analysis.suggestedCorrections) {
          setWarnings([analysis.suggestedCorrections]);
        }
        
        // Generate preview data
        const previewTransactions = parseCSV(content);
        setPreviewData(previewTransactions.slice(0, 10)); // Show first 10 entries
        
        // Check for stored errors
        const storedErrors = sessionStorage.getItem('csvImportErrors');
        if (storedErrors) {
          setErrors(JSON.parse(storedErrors));
          sessionStorage.removeItem('csvImportErrors');
        }
        
        toast({
          title: "File Loaded",
          description: `CSV file loaded with ${previewTransactions.length} transactions${previewTransactions.length > 0 ? '. You can preview before importing.' : ''}`,
        });
        
        // Auto-switch to preview if we have data
        if (previewTransactions.length > 0) {
          setPreviewMode(true);
        }
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
      setWarnings([]);
      
      // Analyze CSV format
      const analysis = analyzeCSVFormat(csvContent);
      setFormatAnalysis(analysis);
      
      if (analysis.suggestedCorrections) {
        setWarnings([analysis.suggestedCorrections]);
      }
      
      const previewTransactions = parseCSV(csvContent);
      setPreviewData(previewTransactions.slice(0, 10)); // Show first 10 entries
      
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
    
    // Auto-generate preview for example data
    setTimeout(() => {
      generatePreview();
    }, 100);
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
                <div className="flex items-center gap-2">
                  {formatAnalysis && formatAnalysis.detectedFormat && (
                    <Badge variant="outline" className="text-green-500 gap-1 flex items-center">
                      <CheckCircle2 className="h-3 w-3" />
                      Format Detected
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">Format: account,category,amount,type,payment_type,note,date</span>
                </div>
              </div>
              <Textarea
                id="csv-content"
                value={csvContent}
                onChange={(e) => {
                  setCsvContent(e.target.value);
                  // Clear analysis and preview when CSV content changes
                  if (formatAnalysis) {
                    setFormatAnalysis(null);
                    setPreviewData([]);
                    setPreviewMode(false);
                  }
                }}
                placeholder="Paste your CSV data here..."
                className="min-h-[180px] font-mono text-sm resize-y"
              />
            </div>
            
            {warnings.length > 0 && (
              <Alert variant="default" className="mt-4 bg-yellow-50 border-yellow-200">
                <Info className="h-4 w-4 text-yellow-500" />
                <AlertTitle className="text-yellow-700">Import Suggestions</AlertTitle>
                <AlertDescription className="text-yellow-600">
                  <div className="text-sm mt-2">
                    {warnings.map((warning, index) => (
                      <div key={index} className="py-1">{warning}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {errors.length > 0 && (
              <Collapsible 
                open={expandedErrors} 
                onOpenChange={setExpandedErrors}
                className="w-full"
              >
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <div className="flex justify-between w-full items-center">
                    <AlertTitle>Import Warnings ({errors.length})</AlertTitle>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        {expandedErrors ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <AlertDescription>
                    <CollapsibleContent>
                      <div className="text-sm mt-2 max-h-56 overflow-y-auto rounded-md border p-2 bg-destructive/5">
                        {errors.map((error, index) => (
                          <div key={index} className="py-1 border-b border-destructive/10 last:border-0">
                            {error}
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </AlertDescription>
                </Alert>
              </Collapsible>
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
            
            <div className="flex gap-2">
              <Button 
                onClick={generatePreview} 
                disabled={isLoading || !csvContent.trim() || importProgress > 0}
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
                            <Badge variant={transaction.type === 'Income' ? 'success' : 'destructive'} className="capitalize">
                              {transaction.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">{transaction.payment_type.replace('_', ' ')}</TableCell>
                          <TableCell className="text-sm">{new Date(transaction.date).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {errors.length > 0 && (
                  <div className="flex items-center gap-2 p-2 rounded-md bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.length} error{errors.length > 1 ? 's' : ''} found during parsing. Click "Import Data" tab to see details.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-4 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-16 w-16 text-muted-foreground/30" />
                  <p>No preview data available. Generate a preview first.</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => document.querySelector('[value="import"]')?.dispatchEvent(new MouseEvent('click'))}
                  >
                    Go to Import
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleImport} 
          disabled={isLoading || !csvContent.trim() || importProgress > 0}
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

export default CSVImporter;

