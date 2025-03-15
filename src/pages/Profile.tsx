import React, { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Lock, Shield } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { 
  InputOTP,
  InputOTPGroup,
  InputOTPSlot 
} from '@/components/ui/input-otp';

export default function Profile() {
  const { user, logout, twoFactorEnabled, generateTwoFactorSecret, enableTwoFactor, disableTwoFactor } = useFinance();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [verifyingDisable, setVerifyingDisable] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const isMobile = useIsMobile();

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    
    setTimeout(() => {
      setIsUpdating(false);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully!",
      });
    }, 1000);
  };
  
  const handleSetupTwoFactor = async () => {
    try {
      const result = await generateTwoFactorSecret();
      if (result && result.qrCode) {
        setQrCodeUrl(result.qrCode);
        setTwoFactorSecret(result.secret);
        setShowTwoFactorSetup(true);
      }
    } catch (error) {
      console.error("Error setting up 2FA:", error);
    }
  };
  
  const handleVerifyAndEnable = async () => {
    if (twoFactorCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid 6-digit verification code",
        variant: "destructive"
      });
      return;
    }
    
    const success = await enableTwoFactor(twoFactorCode);
    if (success) {
      setShowTwoFactorSetup(false);
      setTwoFactorCode('');
    }
  };
  
  const handleDisableTwoFactor = async () => {
    setVerifyingDisable(true);
  };
  
  const handleConfirmDisable = async () => {
    if (disableCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid 6-digit verification code",
        variant: "destructive"
      });
      return;
    }
    
    const success = await disableTwoFactor(disableCode);
    if (success) {
      setVerifyingDisable(false);
      setDisableCode('');
    }
  };
  
  const handleCancelDisable = () => {
    setVerifyingDisable(false);
    setDisableCode('');
  };
  
  return (
    <div className="container max-w-6xl py-4 sm:py-6 space-y-4 sm:space-y-6 px-2 sm:px-4">
      <div className="space-y-0.5">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Account Settings</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage your account settings
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="profile" className="flex items-center gap-2 w-full sm:w-auto">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2 w-full sm:w-auto">
            <Lock className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger value="2fa" className="flex items-center gap-2 w-full sm:w-auto">
            <Shield className="h-4 w-4" />
            <span>Two-Factor Auth</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
              <CardTitle className="text-lg sm:text-xl">Profile</CardTitle>
              <CardDescription>
                Manage your profile information
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdateProfile}>
              <CardContent className="space-y-4 px-4 sm:px-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input 
                    id="name"
                    placeholder="Your name"
                    defaultValue={user?.displayName || ''}
                    className="text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    defaultValue={user?.email || ''}
                    disabled
                    className="text-sm sm:text-base"
                  />
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Your email address is used for authentication and cannot be changed here.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-3 sm:justify-between px-4 sm:px-6 py-4 sm:py-6">
                <Button
                  variant="outline"
                  onClick={() => logout()}
                  type="button"
                  className="w-full sm:w-auto"
                >
                  Sign Out
                </Button>
                <Button type="submit" disabled={isUpdating} className="w-full sm:w-auto">
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
              <CardTitle className="text-lg sm:text-xl">Security</CardTitle>
              <CardDescription>
                Manage your password and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" className="text-sm sm:text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" className="text-sm sm:text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" className="text-sm sm:text-base" />
              </div>
            </CardContent>
            <CardFooter className="px-4 sm:px-6 py-4 sm:py-6">
              <Button className="w-full sm:w-auto">Change Password</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="2fa" className="space-y-4">
          <Card>
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
              <CardTitle className="text-lg sm:text-xl">Two-Factor Authentication</CardTitle>
              <CardDescription>
                Enhance your account security with two-factor authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-4 sm:px-6">
              {!twoFactorEnabled && !showTwoFactorSetup && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="font-medium">Two-Factor Authentication</h4>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account with two-factor authentication
                      </p>
                    </div>
                    <Switch checked={false} disabled />
                  </div>
                  <Alert>
                    <AlertTitle>Recommended</AlertTitle>
                    <AlertDescription>
                      Two-factor authentication adds an additional layer of security to your account by requiring 
                      a verification code from your mobile device when you sign in.
                    </AlertDescription>
                  </Alert>
                  <Button className="w-full sm:w-auto" onClick={handleSetupTwoFactor}>
                    Set up two-factor authentication
                  </Button>
                </>
              )}
              
              {!twoFactorEnabled && showTwoFactorSetup && (
                <div className="space-y-6">
                  <h3 className="font-medium text-lg">Set up Two-Factor Authentication</h3>
                  
                  <div className="space-y-2">
                    <p className="text-sm">1. Scan this QR code with your authenticator app:</p>
                    <div className="flex justify-center my-4">
                      <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 border rounded" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm">2. Or enter this code manually in your app:</p>
                    <div className="p-2 bg-muted rounded font-mono text-center break-all">
                      {twoFactorSecret}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm">3. Enter the 6-digit verification code from your authenticator app:</p>
                    <div className="flex justify-center py-2">
                      <InputOTP maxLength={6} value={twoFactorCode} onChange={setTwoFactorCode}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      className="sm:flex-1" 
                      onClick={() => setShowTwoFactorSetup(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="sm:flex-1" 
                      onClick={handleVerifyAndEnable}
                      disabled={twoFactorCode.length !== 6}
                    >
                      Verify and Enable
                    </Button>
                  </div>
                </div>
              )}
              
              {twoFactorEnabled && !verifyingDisable && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="font-medium">Two-Factor Authentication</h4>
                      <p className="text-sm text-muted-foreground">
                        Two-factor authentication is currently enabled for your account
                      </p>
                    </div>
                    <Switch checked={true} disabled />
                  </div>
                  
                  <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900/30">
                    <AlertTitle className="text-green-800 dark:text-green-300">Enabled</AlertTitle>
                    <AlertDescription className="text-green-700 dark:text-green-400">
                      Your account is protected with two-factor authentication. You will need to enter a verification 
                      code when signing in.
                    </AlertDescription>
                  </Alert>
                  
                  <Button 
                    variant="destructive" 
                    className="w-full sm:w-auto"
                    onClick={handleDisableTwoFactor}
                  >
                    Disable two-factor authentication
                  </Button>
                </>
              )}
              
              {twoFactorEnabled && verifyingDisable && (
                <div className="space-y-6">
                  <h3 className="font-medium text-lg">Disable Two-Factor Authentication</h3>
                  
                  <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-900/30">
                    <AlertTitle className="text-amber-800 dark:text-amber-300">Warning</AlertTitle>
                    <AlertDescription className="text-amber-700 dark:text-amber-400">
                      Disabling two-factor authentication will make your account less secure. Are you sure you want to continue?
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <p className="text-sm">Enter the 6-digit verification code from your authenticator app to confirm:</p>
                    <div className="flex justify-center py-2">
                      <InputOTP maxLength={6} value={disableCode} onChange={setDisableCode}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      className="sm:flex-1" 
                      onClick={handleCancelDisable}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="sm:flex-1" 
                      onClick={handleConfirmDisable}
                      disabled={disableCode.length !== 6}
                    >
                      Disable 2FA
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
