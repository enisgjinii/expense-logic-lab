
import React, { useState, useRef } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getExampleCSV } from '@/utils/finance-utils';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Upload, Download, FileText, Copy } from 'lucide-react';

const CSVImporter: React.FC = () => {
  const { importCSV, isLoading } = useFinance();
  const [csvContent, setCsvContent] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = () => {
    if (!csvContent.trim()) {
      toast({
        title: "Empty Input",
        description: "Please provide CSV data to import",
        variant: "destructive",
      });
      return;
    }
    importCSV(csvContent);
    setCsvContent('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
      toast({
        title: "File Loaded",
        description: "CSV file loaded successfully. Click Import to process.",
      });
    };
    reader.readAsText(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const loadExampleData = () => {
    setCsvContent(getExampleCSV());
    toast({
      title: "Example Data Loaded",
      description: "Example CSV data has been loaded. Click Import to process.",
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
        <div className="space-y-4">
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
        </div>
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
