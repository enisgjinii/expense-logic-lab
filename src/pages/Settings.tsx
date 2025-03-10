
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useToast } from '@/hooks/use-toast';
import { useFinance } from '@/contexts/FinanceContext';
import { Loader2, Save, AlertTriangle, Info, Shield, Database, Lock, Key, Trash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const Settings: React.FC = () => {
  const { toast } = useToast();
  const { user, isAuthLoading, clearData, logout, updateFirebaseConfig } = useFinance();
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseConfig>({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [csvDelimiter, setCsvDelimiter] = useState(',');
  const [csvDateFormat, setCsvDateFormat] = useState('YYYY-MM-DD HH:MM:SS');
  
  // Load saved Firebase config from localStorage on component mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('firebaseConfig');
    if (savedConfig) {
      try {
        setFirebaseConfig(JSON.parse(savedConfig));
      } catch (error) {
        console.error('Error parsing saved Firebase config:', error);
      }
    }
    
    // Check if dark mode is enabled
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDarkMode);
    
    // Load CSV settings
    const savedDelimiter = localStorage.getItem('csvDelimiter');
    if (savedDelimiter) setCsvDelimiter(savedDelimiter);
    
    const savedDateFormat = localStorage.getItem('csvDateFormat');
    if (savedDateFormat) setCsvDateFormat(savedDateFormat);
  }, []);
  
  // Handle dark mode toggle
  useEffect(() => {
    // Update HTML element class based on dark mode
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFirebaseConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveFirebaseConfig = async () => {
    // Basic validation
    for (const [key, value] of Object.entries(firebaseConfig)) {
      if (!value.trim()) {
        toast({
          title: "Validation Error",
          description: `${key} cannot be empty`,
          variant: "destructive"
        });
        return;
      }
    }
    
    try {
      setIsLoading(true);
      
      // Save config to localStorage
      localStorage.setItem('firebaseConfig', JSON.stringify(firebaseConfig));
      
      // Try to update Firebase configuration in the context
      if (updateFirebaseConfig) {
        await updateFirebaseConfig(firebaseConfig);
      }
      
      toast({
        title: "Settings Saved",
        description: "Firebase configuration has been updated successfully",
      });
      
      // Suggest refreshing the page to apply new Firebase config
      if (user) {
        toast({
          title: "Action Required",
          description: "Please log out and log back in to apply the new Firebase configuration",
        });
      }
    } catch (error) {
      console.error('Error saving Firebase config:', error);
      toast({
        title: "Error",
        description: "Failed to update Firebase configuration",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCsvSettings = () => {
    localStorage.setItem('csvDelimiter', csvDelimiter);
    localStorage.setItem('csvDateFormat', csvDateFormat);
    
    toast({
      title: "CSV Settings Saved",
      description: "Your CSV import/export settings have been updated",
    });
  };

  return (
    <div className="space-y-8 pb-10 animate-in">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your application settings and preferences
        </p>
      </div>
      
      <Tabs defaultValue="firebase" className="w-full">
        <TabsList className="grid grid-cols-3 max-w-md">
          <TabsTrigger value="firebase" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Firebase
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Import/Export
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="firebase" className="mt-6">
          <Card className="bg-card/60 backdrop-blur-sm shadow-sm border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Firebase Configuration
              </CardTitle>
              <CardDescription>
                Configure your Firebase project settings for authentication and data storage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey" className="flex items-center justify-between">
                    API Key
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="h-6 px-2"
                    >
                      {showApiKey ? 'Hide' : 'Show'}
                    </Button>
                  </Label>
                  <Input
                    id="apiKey"
                    name="apiKey"
                    type={showApiKey ? "text" : "password"}
                    value={firebaseConfig.apiKey}
                    onChange={handleChange}
                    placeholder="AIzaSyB1..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="authDomain">Auth Domain</Label>
                  <Input
                    id="authDomain"
                    name="authDomain"
                    value={firebaseConfig.authDomain}
                    onChange={handleChange}
                    placeholder="your-project-id.firebaseapp.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectId">Project ID</Label>
                  <Input
                    id="projectId"
                    name="projectId"
                    value={firebaseConfig.projectId}
                    onChange={handleChange}
                    placeholder="your-project-id"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storageBucket">Storage Bucket</Label>
                  <Input
                    id="storageBucket"
                    name="storageBucket"
                    value={firebaseConfig.storageBucket}
                    onChange={handleChange}
                    placeholder="your-project-id.appspot.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="messagingSenderId">Messaging Sender ID</Label>
                  <Input
                    id="messagingSenderId"
                    name="messagingSenderId"
                    value={firebaseConfig.messagingSenderId}
                    onChange={handleChange}
                    placeholder="123456789"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appId">App ID</Label>
                  <Input
                    id="appId"
                    name="appId"
                    value={firebaseConfig.appId}
                    onChange={handleChange}
                    placeholder="1:123456:web:abcdef"
                  />
                </div>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 text-sm mt-4">
                <h4 className="font-medium flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4" />
                  How to find your Firebase configuration
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Go to the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Firebase Console</a></li>
                  <li>Select your project (or create a new one)</li>
                  <li>Click on the gear icon next to "Project Overview" and select "Project settings"</li>
                  <li>Scroll down to "Your apps" section and select your web app (or create one)</li>
                  <li>Under "SDK setup and configuration", select "Config" to view your Firebase configuration</li>
                  <li>Copy the configuration values into the fields above</li>
                </ol>
                <p className="mt-2 text-muted-foreground">
                  <strong>Note:</strong> These settings are stored locally in your browser. For security, make sure you're on a trusted device.
                </p>
              </div>
              
              <div className="flex items-center space-x-2 mt-4">
                <div className="flex-1">
                  <h4 className="font-medium">Authentication Status</h4>
                  <p className="text-sm text-muted-foreground">
                    {isAuthLoading ? 'Checking authentication status...' : (
                      user ? `Signed in as ${user.email}` : 'Not signed in'
                    )}
                  </p>
                </div>
                <Badge variant={user ? "success" : "outline"}>
                  {isAuthLoading ? 'Loading...' : (user ? 'Authenticated' : 'Not Authenticated')}
                </Badge>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-4">
              <div className="flex items-center gap-2">
                {user && (
                  <Button variant="outline" onClick={logout}>
                    Sign Out
                  </Button>
                )}
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash className="h-4 w-4 mr-2" />
                      Clear All Data
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
              </div>
              
              <Button onClick={handleSaveFirebaseConfig} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Configuration
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance" className="mt-6">
          <Card className="bg-card/60 backdrop-blur-sm shadow-sm border">
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize the look and feel of your application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable dark mode for a more comfortable viewing experience in low light conditions
                  </p>
                </div>
                <Switch 
                  checked={darkMode} 
                  onCheckedChange={setDarkMode} 
                />
              </div>
              
              {/* Additional appearance settings can be added here */}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="import" className="mt-6">
          <Card className="bg-card/60 backdrop-blur-sm shadow-sm border">
            <CardHeader>
              <CardTitle>Import and Export Settings</CardTitle>
              <CardDescription>
                Configure how CSV files are processed when importing and exporting data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="csvDelimiter">CSV Delimiter</Label>
                  <Input
                    id="csvDelimiter"
                    value={csvDelimiter}
                    onChange={(e) => setCsvDelimiter(e.target.value)}
                    placeholder=","
                    maxLength={1}
                  />
                  <p className="text-xs text-muted-foreground">
                    Character used to separate values in CSV files (usually comma)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="csvDateFormat">Date Format</Label>
                  <Input
                    id="csvDateFormat"
                    value={csvDateFormat}
                    onChange={(e) => setCsvDateFormat(e.target.value)}
                    placeholder="YYYY-MM-DD HH:MM:SS"
                  />
                  <p className="text-xs text-muted-foreground">
                    Format used for dates when importing/exporting CSV files
                  </p>
                </div>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 mt-4">
                <h4 className="font-medium mb-2">CSV Format Guidelines</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  For best results, your CSV file should contain the following columns:
                </p>
                <div className="bg-muted p-2 rounded text-xs font-mono mb-2 overflow-x-auto">
                  account,category,amount,type,payment_type,note,date
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Values containing commas should be enclosed in double quotes.
                </p>
              </div>
            </CardContent>
            <CardFooter className="justify-end border-t p-4">
              <Button onClick={handleSaveCsvSettings}>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
