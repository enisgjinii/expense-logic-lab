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
import { useLanguage } from '@/contexts/LanguageContext';

export default function Profile() {
  const { user, logout, twoFactorEnabled, generateTwoFactorSecret, enableTwoFactor, disableTwoFactor } = useFinance();
  const { t } = useLanguage();
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
        title: t('profile.updateSuccess'),
        description: t('profile.updateSuccessMessage'),
      });
    }, 1000);
  };
  
  const handleSetupTwoFactor = async () => {
    try {
      const result = await generateTwoFactorSecret();
      if (result) {
        setQrCodeUrl(result.qrCode);
        setTwoFactorSecret(result.secret);
        setShowTwoFactorSetup(true);
      }
    } catch (error) {
      console.error("Error setting up Google Authenticator:", error);
    }
  };
  
  const handleVerifyAndEnable = async () => {
    if (twoFactorCode.length !== 6) {
      toast({
        title: t('profile.invalidCode'),
        description: t('profile.enterValidCode'),
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
        title: t('profile.invalidCode'),
        description: t('profile.enterValidCode'),
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
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{t('profile.accountSettings')}</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          {t('profile.manageAccount')}
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="profile" className="flex items-center gap-2 w-full sm:w-auto">
            <User className="h-4 w-4" />
            <span>{t('profile.profile')}</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2 w-full sm:w-auto">
            <Lock className="h-4 w-4" />
            <span>{t('profile.security')}</span>
          </TabsTrigger>
          <TabsTrigger value="2fa" className="flex items-center gap-2 w-full sm:w-auto">
            <Shield className="h-4 w-4" />
            <span>{t('profile.twoFactorAuth')}</span>
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
              <CardTitle className="text-lg sm:text-xl">{t('profile.googleAuthenticator')}</CardTitle>
              <CardDescription>
                {t('profile.enhanceSecurityWithGA')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-4 sm:px-6">
              {!twoFactorEnabled && !showTwoFactorSetup && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="font-medium">{t('profile.googleAuthenticator')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t('profile.addExtraLayerGA')}
                      </p>
                    </div>
                    <Switch checked={false} disabled />
                  </div>
                  <Alert>
                    <AlertTitle>{t('common.recommended')}</AlertTitle>
                    <AlertDescription>
                      {t('profile.gaDescription')}
                    </AlertDescription>
                  </Alert>
                  <Button className="w-full sm:w-auto" onClick={handleSetupTwoFactor}>
                    {t('profile.setupGA')}
                  </Button>
                </>
              )}
              
              {!twoFactorEnabled && showTwoFactorSetup && (
                <div className="space-y-6">
                  <h3 className="font-medium text-lg">{t('profile.setupGA')}</h3>
                  
                  <div className="space-y-4">
                    <ol className="list-decimal list-inside space-y-4">
                      <li className="text-sm">
                        {t('profile.downloadGA')}
                        <div className="flex gap-4 justify-center mt-2">
                          <a 
                            href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <img 
                              src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" 
                              alt="Get it on Google Play" 
                              className="h-10" 
                            />
                          </a>
                          <a 
                            href="https://apps.apple.com/us/app/google-authenticator/id388497605" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <img 
                              src="https://developer.apple.com/app-store/marketing/guidelines/images/badge-download-on-the-app-store.svg" 
                              alt="Download on the App Store" 
                              className="h-10" 
                            />
                          </a>
                        </div>
                      </li>
                      
                      <li className="text-sm">
                        {t('profile.scanQRCode')}
                        <div className="flex justify-center my-4">
                          <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 border rounded" />
                        </div>
                      </li>
                      
                      <li className="text-sm">
                        {t('profile.orEnterManually')}
                        <div className="p-2 bg-muted rounded font-mono text-center break-all mt-2">
                          {twoFactorSecret}
                        </div>
                      </li>
                      
                      <li className="text-sm">
                        {t('profile.enterCode')}
                        <div className="flex justify-center py-4">
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
                      </li>
                    </ol>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      className="sm:flex-1" 
                      onClick={() => setShowTwoFactorSetup(false)}
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button 
                      className="sm:flex-1" 
                      onClick={handleVerifyAndEnable}
                      disabled={twoFactorCode.length !== 6}
                    >
                      {t('profile.verifyAndEnable')}
                    </Button>
                  </div>
                </div>
              )}
              
              {twoFactorEnabled && !verifyingDisable && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="font-medium">{t('profile.googleAuthenticator')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t('profile.gaEnabledMessage')}
                      </p>
                    </div>
                    <Switch checked={true} disabled />
                  </div>
                  
                  <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900/30">
                    <AlertTitle className="text-green-800 dark:text-green-300">{t('common.enabled')}</AlertTitle>
                    <AlertDescription className="text-green-700 dark:text-green-400">
                      {t('profile.gaProtectedMessage')}
                    </AlertDescription>
                  </Alert>
                  
                  <Button 
                    variant="destructive" 
                    className="w-full sm:w-auto"
                    onClick={handleDisableTwoFactor}
                  >
                    {t('profile.disableGA')}
                  </Button>
                </>
              )}
              
              {twoFactorEnabled && verifyingDisable && (
                <div className="space-y-6">
                  <h3 className="font-medium text-lg">{t('profile.disableGA')}</h3>
                  
                  <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-900/30">
                    <AlertTitle className="text-amber-800 dark:text-amber-300">{t('common.warning')}</AlertTitle>
                    <AlertDescription className="text-amber-700 dark:text-amber-400">
                      {t('profile.disableGAWarning')}
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <p className="text-sm">{t('profile.enterGACodeToConfirm')}</p>
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
                      {t('common.cancel')}
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="sm:flex-1" 
                      onClick={handleConfirmDisable}
                      disabled={disableCode.length !== 6}
                    >
                      {t('profile.disable2FA')}
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
