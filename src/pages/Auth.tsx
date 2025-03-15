import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useFinance } from '@/contexts/FinanceContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  CreditCard,
  Lock,
  Mail,
  UserPlus,
  LogIn,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronLeft,
  Shield
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/firebase';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useLanguage } from '@/contexts/LanguageContext';

const Auth: React.FC = () => {
  const { user, signIn, signUp, isAuthLoading, twoFactorEnabled, verifyTwoFactorCode } = useFinance();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTwoFactorVerification, setShowTwoFactorVerification] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');

  // Redirect to home if already logged in and auth is not loading
  if (user && !isAuthLoading && !showTwoFactorVerification) {
    return <Navigate to="/" />;
  }

  // Email/Password login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!loginEmail || !loginPassword) {
      setError(t('auth.fillAllFields'));
      return;
    }

    setIsLoading(true);
    try {
      await signIn(loginEmail, loginPassword);
      
      // Check if 2FA is enabled for this user
      if (twoFactorEnabled) {
        setShowTwoFactorVerification(true);
        toast({
          title: t('auth.twoFactorRequired'),
          description: t('auth.enterGACode'),
          variant: "default"
        });
      } else {
        toast({
          title: t('auth.success'),
          description: t('auth.welcomeBack'),
          variant: "default"
        });
        navigate('/');
      }
    } catch (error: any) {
      setError(error.message || t('auth.failedToSignIn'));
    } finally {
      setIsLoading(false);
    }
  };

  // Google Authenticator verification handler
  const handleVerifyTwoFactor = async () => {
    if (twoFactorCode.length !== 6) {
      setError(t('profile.enterValidCode'));
      return;
    }

    setIsLoading(true);
    try {
      const isValid = await verifyTwoFactorCode(twoFactorCode);
      if (isValid) {
        toast({
          title: t('auth.success'),
          description: t('auth.welcomeBack'),
          variant: "default"
        });
        setShowTwoFactorVerification(false);
        navigate('/');
      } else {
        setError(t('auth.invalidGACode'));
      }
    } catch (error: any) {
      setError(error.message || t('auth.failedToVerify'));
    } finally {
      setIsLoading(false);
    }
  };

  // Email/Password sign-up handler
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!signupEmail || !signupPassword || !signupConfirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Password strength validation
    if (signupPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);
    try {
      await signUp(signupEmail, signupPassword);
      toast({
        title: "Account created",
        description: "Welcome to Finance Tracker!",
        variant: "default"
      });
      navigate('/');
    } catch (error: any) {
      setError(error.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  // Google sign-in handler
  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({
        title: "Success",
        description: "Signed in with Google successfully",
        variant: "default"
      });
      navigate('/');
    } catch (error: any) {
      setError(error.message || "Google sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle password visibility
  const toggleLoginPasswordVisibility = () => setShowLoginPassword(!showLoginPassword);
  const toggleSignupPasswordVisibility = () => setShowSignupPassword(!showSignupPassword);
  const toggleSignupConfirmPasswordVisibility = () => setShowSignupConfirmPassword(!showSignupConfirmPassword);

  // Loading state UI with improved animation
  if (isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <CreditCard className="h-16 w-16 text-primary mb-4 animate-pulse" />
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-muted-foreground">{t('auth.loadingAccount')}</p>
      </div>
    );
  }

  // Show Google Authenticator verification if needed
  if (showTwoFactorVerification) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-secondary/10 p-4">
        <div className="w-full max-w-md">
          <Button 
            variant="ghost" 
            className="mb-6" 
            onClick={() => setShowTwoFactorVerification(false)}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
          
          <div className="flex flex-col items-center mb-8">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              {t('auth.twoFactorAuth')}
            </h1>
            <p className="text-muted-foreground mt-2 text-center">
              {t('auth.enterGACodeToLogin')}
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6 animate-shake">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl">{t('auth.googleAuthenticator')}</CardTitle>
              <CardDescription>
                {t('auth.enterGACode')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
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
            </CardContent>
            <CardFooter className="flex flex-col">
              <Button
                onClick={handleVerifyTwoFactor}
                className="w-full h-12 font-medium transition-all hover:scale-[1.01]"
                disabled={isLoading || twoFactorCode.length !== 6}
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : (
                  <Shield className="mr-2 h-5 w-5" />
                )}
                {t('auth.verify')}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-secondary/10 p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <CreditCard className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">Finance Tracker</h1>
          <p className="text-muted-foreground mt-2">Secure. Simple. Smart money management.</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 animate-shake">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 rounded-lg">
            <TabsTrigger value="login" className="rounded-l-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Login</TabsTrigger>
            <TabsTrigger value="signup" className="rounded-r-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Sign Up</TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login" className="animate-in fade-in-50 slide-in-from-left-5">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl">Welcome Back</CardTitle>
                <CardDescription>
                  Sign in to access your personalized financial dashboard
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm font-medium">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="name@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10 h-12 border-input/50 focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                      <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10 pr-10 h-12 border-input/50 focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={toggleLoginPasswordVisibility}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showLoginPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col">
                  <Button
                    type="submit"
                    className="w-full h-12 font-medium transition-all hover:scale-[1.01]"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : (
                      <LogIn className="mr-2 h-5 w-5" />
                    )}
                    Sign In
                  </Button>

                  <div className="flex items-center my-6 w-full">
                    <Separator className="flex-1" />
                    <span className="mx-4 text-xs text-muted-foreground">OR</span>
                    <Separator className="flex-1" />
                  </div>

                  <Button
                    onClick={handleGoogleSignIn}
                    variant="outline"
                    className="w-full h-12 font-medium border-input/50 hover:bg-accent hover:text-accent-foreground transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : (
                      <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21.8055 10.0415H21V10H12V14H17.6515C16.827 16.3285 14.6115 18 12 18C8.6865 18 6 15.3135 6 12C6 8.6865 8.6865 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C6.4775 2 2 6.4775 2 12C2 17.5225 6.4775 22 12 22C17.5225 22 22 17.5225 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" fill="#FFC107" />
                        <path d="M3.15295 7.3455L6.43845 9.755C7.32745 7.554 9.48045 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C8.15895 2 4.82795 4.1685 3.15295 7.3455Z" fill="#FF3D00" />
                        <path d="M12 22C14.583 22 16.93 21.0115 18.7045 19.404L15.6095 16.785C14.5718 17.5742 13.3038 18.001 12 18C9.39903 18 7.19053 16.3415 6.35853 14.027L3.09753 16.5395C4.75253 19.778 8.11353 22 12 22Z" fill="#4CAF50" />
                        <path d="M21.8055 10.0415H21V10H12V14H17.6515C17.2571 15.1082 16.5467 16.0766 15.608 16.7855L15.6095 16.7845L18.7045 19.4035C18.4855 19.6025 22 17 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" fill="#1976D2" />
                      </svg>)}
                    Continue with Google
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          {/* Sign Up Tab */}
          <TabsContent value="signup" className="animate-in fade-in-50 slide-in-from-right-5">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl">Create an Account</CardTitle>
                <CardDescription>
                  Join thousands of users managing their finances smarter
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSignup}>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm font-medium">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="name@example.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="pl-10 h-12 border-input/50 focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type={showSignupPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="pl-10 pr-10 h-12 border-input/50 focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={toggleSignupPasswordVisibility}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showSignupPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Password must be at least 8 characters long
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password" className="text-sm font-medium">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-confirm-password"
                        type={showSignupConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        className="pl-10 pr-10 h-12 border-input/50 focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={toggleSignupConfirmPasswordVisibility}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showSignupConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col">
                  <Button
                    type="submit"
                    className="w-full h-12 font-medium transition-all hover:scale-[1.01]"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : (
                      <UserPlus className="mr-2 h-5 w-5" />
                    )}
                    Create Account
                  </Button>

                  <div className="flex items-center my-6 w-full">
                    <Separator className="flex-1" />
                    <span className="mx-4 text-xs text-muted-foreground">OR</span>
                    <Separator className="flex-1" />
                  </div>

                  <Button
                    onClick={handleGoogleSignIn}
                    variant="outline"
                    className="w-full h-12 font-medium border-input/50 hover:bg-accent hover:text-accent-foreground transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : (
                      <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21.8055 10.0415H21V10H12V14H17.6515C16.827 16.3285 14.6115 18 12 18C8.6865 18 6 15.3135 6 12C6 8.6865 8.6865 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C6.4775 2 2 6.4775 2 12C2 17.5225 6.4775 22 12 22C17.5225 22 22 17.5225 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" fill="#FFC107" />
                        <path d="M3.15295 7.3455L6.43845 9.755C7.32745 7.554 9.48045 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C8.15895 2 4.82795 4.1685 3.15295 7.3455Z" fill="#FF3D00" />
                        <path d="M12 22C14.583 22 16.93 21.0115 18.7045 19.404L15.6095 16.785C14.5718 17.5742 13.3038 18.001 12 18C9.39903 18 7.19053 16.3415 6.35853 14.027L3.09753 16.5395C4.75253 19.778 8.11353 22 12 22Z" fill="#4CAF50" />
                        <path d="M21.8055 10.0415H21V10H12V14H17.6515C17.2571 15.1082 16.5467 16.0766 15.608 16.7855L15.6095 16.7845L18.7045 19.4035C18.4855 19.6025 22 17 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" fill="#1976D2" />
                      </svg>)}
                    Sign up with Google
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>By continuing, you agree to our</p>
          <div className="space-x-1 mt-1">
            <a href="#" className="text-primary hover:underline">Terms of Service</a>
            <span>and</span>
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
