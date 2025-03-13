import React, { useState, useEffect } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { 
  Database, 
  Bell, 
  Moon, 
  FileUp, 
  Download, 
  Trash2, 
  Save,
  Laptop,
  Info,
  RefreshCw,
  Sun,
  Palette,
  CreditCard
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import SubscriptionPlans from '@/components/SubscriptionPlans';

const Settings = () => {
  const { themeMode, setThemeMode, user, clearData, refreshData, exportData } = useFinance();
  const [activeTab, setActiveTab] = useState('appearance');
  
  // Firebase config state
  const [firebaseConfig, setFirebaseConfig] = useState({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
  });
  
  // Notification settings
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    pushNotifications: false,
    weeklyReport: true,
    budgetAlerts: true
  });
  
  // Appearance settings
  const [appearance, setAppearance] = useState({
    compactMode: false,
    animationsEnabled: true,
    highContrastMode: false,
    fontsize: 'medium'
  });
  
  // Import/Export settings
  const [importSettings, setImportSettings] = useState({
    defaultDateFormat: 'MM/DD/YYYY',
    skipHeaderRow: true,
    autoDetectColumns: true,
    defaultCategory: 'Uncategorized'
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('financeTrackerNotifications');
    const savedAppearance = localStorage.getItem('financeTrackerAppearance');
    const savedImportSettings = localStorage.getItem('financeTrackerImportSettings');
    
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
    
    if (savedAppearance) {
      setAppearance(JSON.parse(savedAppearance));
    }
    
    if (savedImportSettings) {
      setImportSettings(JSON.parse(savedImportSettings));
    }
  }, []);

  const handleSaveFirebaseConfig = () => {
    // In a real app, this would update environment variables
    // For this demo, we'll just show a success toast
    localStorage.setItem('financeTrackerFirebaseConfig', JSON.stringify(firebaseConfig));
    
    toast({
      title: "Firebase configuration saved",
      description: "Your Firebase configuration has been updated successfully."
    });
  };

  const handleResetSettings = () => {
    // Reset all settings to default
    setNotifications({
      emailAlerts: true,
      pushNotifications: false,
      weeklyReport: true,
      budgetAlerts: true
    });
    
    setAppearance({
      compactMode: false,
      animationsEnabled: true,
      highContrastMode: false,
      fontsize: 'medium'
    });
    
    setImportSettings({
      defaultDateFormat: 'MM/DD/YYYY',
      skipHeaderRow: true,
      autoDetectColumns: true,
      defaultCategory: 'Uncategorized'
    });
    
    // Clear from localStorage
    localStorage.removeItem('financeTrackerNotifications');
    localStorage.removeItem('financeTrackerAppearance');
    localStorage.removeItem('financeTrackerImportSettings');
    
    toast({
      title: "Settings reset",
      description: "All settings have been reset to their default values."
    });
  };

  const handleUpdateSettings = (type: string) => {
    switch (type) {
      case 'Appearance':
        localStorage.setItem('financeTrackerAppearance', JSON.stringify(appearance));
        // Apply appearance settings
        document.documentElement.classList.toggle('compact-mode', appearance.compactMode);
        document.documentElement.classList.toggle('high-contrast', appearance.highContrastMode);
        document.documentElement.style.setProperty('--animations-enabled', appearance.animationsEnabled ? '1' : '0');
        document.documentElement.setAttribute('data-font-size', appearance.fontsize);
        break;
      case 'Notification':
        localStorage.setItem('financeTrackerNotifications', JSON.stringify(notifications));
        break;
      case 'Import':
        localStorage.setItem('financeTrackerImportSettings', JSON.stringify(importSettings));
        break;
    }
    
    toast({
      title: `${type} settings updated`,
      description: `Your ${type.toLowerCase()} settings have been updated successfully.`
    });
  };
  
  const handleClearData = () => {
    if (confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      clearData();
    }
  };
  
  const handleRefreshData = () => {
    refreshData();
  };
  
  const handleExportData = () => {
    const dataStr = exportData();
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `finance-tracker-export-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Data Exported",
      description: "Your data has been successfully exported to a JSON file."
    });
  };
  
  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = event.target.files;
    
    if (!files || files.length === 0) {
      return;
    }
    
    fileReader.readAsText(files[0], "UTF-8");
    fileReader.onload = e => {
      try {
        if (e.target?.result) {
          const content = JSON.parse(e.target.result as string);
          
          // In a real implementation, you would use the context to import this data
          console.log("Importing data:", content);
          
          toast({
            title: "Data Imported",
            description: "Your data has been successfully imported."
          });
        }
      } catch (error) {
        console.error("Error importing data:", error);
        toast({
          title: "Import Failed",
          description: "Failed to import data. Please make sure the file is valid JSON.",
          variant: "destructive"
        });
      }
    };
    fileReader.onerror = () => {
      toast({
        title: "Import Failed",
        description: "An error occurred while reading the file.",
        variant: "destructive"
      });
    };
  };

  return (
    <div className="space-y-6 pb-10 animate-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>
        <Badge variant="outline" className="px-2 py-1">
          {user ? 'Personal account' : 'Not logged in'}
        </Badge>
      </div>

      <Tabs defaultValue="appearance" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span>Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="firebase" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span>Firebase</span>
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span>Subscription</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance Settings
              </CardTitle>
              <CardDescription>
                Customize how the app looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Theme</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className={`flex-col justify-center items-center gap-2 h-auto py-4 ${themeMode === 'light' ? 'border-primary bg-accent' : ''}`}
                    onClick={() => setThemeMode('light')}
                  >
                    <Sun className="h-6 w-6" />
                    <span>Light</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className={`flex-col justify-center items-center gap-2 h-auto py-4 ${themeMode === 'dark' ? 'border-primary bg-accent' : ''}`}
                    onClick={() => setThemeMode('dark')}
                  >
                    <Moon className="h-6 w-6" />
                    <span>Dark</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className={`flex-col justify-center items-center gap-2 h-auto py-4 ${themeMode === 'system' ? 'border-primary bg-accent' : ''}`}
                    onClick={() => setThemeMode('system')}
                  >
                    <Laptop className="h-6 w-6" />
                    <span>System</span>
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Display Options</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="compact-mode">Compact Mode</Label>
                      <p className="text-sm text-muted-foreground">Reduces spacing and sizes</p>
                    </div>
                    <Switch 
                      id="compact-mode" 
                      checked={appearance.compactMode}
                      onCheckedChange={(checked) => setAppearance({...appearance, compactMode: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="animations">Enable Animations</Label>
                      <p className="text-sm text-muted-foreground">Show animations throughout the app</p>
                    </div>
                    <Switch 
                      id="animations" 
                      checked={appearance.animationsEnabled}
                      onCheckedChange={(checked) => setAppearance({...appearance, animationsEnabled: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="contrast">High Contrast Mode</Label>
                      <p className="text-sm text-muted-foreground">Increases contrast for better visibility</p>
                    </div>
                    <Switch 
                      id="contrast" 
                      checked={appearance.highContrastMode}
                      onCheckedChange={(checked) => setAppearance({...appearance, highContrastMode: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="fontsize">Font Size</Label>
                      <p className="text-sm text-muted-foreground">Change the text size throughout the app</p>
                    </div>
                    <Select 
                      value={appearance.fontsize}
                      onValueChange={(value) => setAppearance({...appearance, fontsize: value})}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleResetSettings}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset to Defaults
                </Button>
                <Button onClick={() => handleUpdateSettings('Appearance')}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Firebase Settings */}
        <TabsContent value="firebase" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Firebase Configuration
              </CardTitle>
              <CardDescription>
                Set up your Firebase project for data storage and authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
                <Info className="h-5 w-5 text-amber-500" />
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  Your Firebase credentials are used to connect to your Firebase project. These settings are stored locally.
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <Input 
                    id="api-key" 
                    value={firebaseConfig.apiKey}
                    onChange={(e) => setFirebaseConfig({...firebaseConfig, apiKey: e.target.value})}
                    placeholder="Your Firebase API key"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="auth-domain">Auth Domain</Label>
                  <Input 
                    id="auth-domain" 
                    value={firebaseConfig.authDomain}
                    onChange={(e) => setFirebaseConfig({...firebaseConfig, authDomain: e.target.value})}
                    placeholder="yourproject.firebaseapp.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="project-id">Project ID</Label>
                  <Input 
                    id="project-id" 
                    value={firebaseConfig.projectId}
                    onChange={(e) => setFirebaseConfig({...firebaseConfig, projectId: e.target.value})}
                    placeholder="your-project-id"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="storage-bucket">Storage Bucket</Label>
                  <Input 
                    id="storage-bucket" 
                    value={firebaseConfig.storageBucket}
                    onChange={(e) => setFirebaseConfig({...firebaseConfig, storageBucket: e.target.value})}
                    placeholder="yourproject.appspot.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="messaging-sender-id">Messaging Sender ID</Label>
                  <Input 
                    id="messaging-sender-id" 
                    value={firebaseConfig.messagingSenderId}
                    onChange={(e) => setFirebaseConfig({...firebaseConfig, messagingSenderId: e.target.value})}
                    placeholder="123456789012"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="app-id">App ID</Label>
                  <Input 
                    id="app-id" 
                    value={firebaseConfig.appId}
                    onChange={(e) => setFirebaseConfig({...firebaseConfig, appId: e.target.value})}
                    placeholder="1:123456789012:web:abc123def456"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setFirebaseConfig({
                    apiKey: '',
                    authDomain: '',
                    projectId: '',
                    storageBucket: '',
                    messagingSenderId: '',
                    appId: ''
                  });
                }}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Clear All Fields
                </Button>
                <Button onClick={handleSaveFirebaseConfig}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
            <Info className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Need help setting up Firebase? <a href="https://firebase.google.com/docs/web/setup" target="_blank" rel="noopener noreferrer" className="text-primary underline">Check the documentation</a>.
            </p>
          </div>
        </TabsContent>

        {/* Subscription Settings */}
        <TabsContent value="subscription" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription Plans
              </CardTitle>
              <CardDescription>
                Upgrade your account to access premium features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubscriptionPlans />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
