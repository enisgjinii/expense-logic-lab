import { useState, useEffect } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { toast } from '@/components/ui/use-toast';
import { 
  auth,
  signInWithEmail, 
  signUpWithEmail, 
  signOutUser 
} from './firebaseService';

export const useAuthManager = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState<string>('');
  const [twoFactorQRCode, setTwoFactorQRCode] = useState<string>('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
      
      // If user is authenticated, check if 2FA is enabled
      if (currentUser) {
        checkTwoFactorStatus(currentUser.uid);
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Function to check if 2FA is enabled for the user
  const checkTwoFactorStatus = async (userId: string) => {
    try {
      // In a real implementation, this would fetch 2FA status from Firestore
      // For demo purposes, we'll use localStorage
      const storedStatus = localStorage.getItem(`2fa_enabled_${userId}`);
      setTwoFactorEnabled(storedStatus === 'true');
      
      const storedSecret = localStorage.getItem(`2fa_secret_${userId}`);
      if (storedSecret) {
        setTwoFactorSecret(storedSecret);
      }
    } catch (error) {
      console.error('Error checking 2FA status:', error);
    }
  };

  // Generate a new 2FA secret for Google Authenticator
  const generateTwoFactorSecret = async (): Promise<{ secret: string; qrCode: string; } | undefined> => {
    if (!user) return undefined;
    
    try {
      // Generate a base32-encoded secret (what Google Authenticator expects)
      // This is a simple implementation for demo purposes
      // In a real app, you would use a library like 'otplib' to generate proper TOTP secrets
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      let secret = '';
      for (let i = 0; i < 16; i++) {
        secret += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      setTwoFactorSecret(secret);
      
      // Generate a proper Google Authenticator QR code URL
      const appName = 'FinanceApp';
      const encodedAppName = encodeURIComponent(appName);
      const encodedEmail = encodeURIComponent(user.email || 'user');
      const otpauthUrl = `otpauth://totp/${encodedAppName}:${encodedEmail}?secret=${secret}&issuer=${encodedAppName}&algorithm=SHA1&digits=6&period=30`;
      
      // Generate QR code using a public API
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`;
      setTwoFactorQRCode(qrCodeUrl);
      
      return { secret, qrCode: qrCodeUrl };
    } catch (error: any) {
      console.error('Error generating 2FA secret:', error);
      toast({ 
        title: "Error", 
        description: "Failed to generate Google Authenticator secret", 
        variant: "destructive" 
      });
      throw error;
    }
  };

  // Enable 2FA for the user with Google Authenticator
  const enableTwoFactor = async (verificationCode: string): Promise<boolean> => {
    if (!user || !twoFactorSecret) return false;
    
    try {
      // In a real app, this would verify the code against the secret using TOTP algorithm
      // For demo purposes, any 6-digit code will work
      if (verificationCode.length === 6 && /^\d+$/.test(verificationCode)) {
        setTwoFactorEnabled(true);
        
        // Store 2FA status in localStorage (in a real app, this would be in Firestore)
        localStorage.setItem(`2fa_enabled_${user.uid}`, 'true');
        localStorage.setItem(`2fa_secret_${user.uid}`, twoFactorSecret);
        
        toast({ 
          title: "Google Authenticator Enabled", 
          description: "Two-factor authentication with Google Authenticator has been enabled for your account" 
        });
        return true;
      } else {
        toast({ 
          title: "Invalid Code", 
          description: "Please enter a valid 6-digit verification code from Google Authenticator", 
          variant: "destructive" 
        });
        return false;
      }
    } catch (error: any) {
      console.error('Error enabling 2FA:', error);
      toast({ 
        title: "Error", 
        description: "Failed to enable Google Authenticator: " + error.message, 
        variant: "destructive" 
      });
      return false;
    }
  };

  // Disable 2FA for the user
  const disableTwoFactor = async (verificationCode: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // In a real app, this would verify the code against the secret using TOTP algorithm
      // For demo purposes, any 6-digit code will work
      if (verificationCode.length === 6 && /^\d+$/.test(verificationCode)) {
        setTwoFactorEnabled(false);
        setTwoFactorSecret('');
        setTwoFactorQRCode('');
        
        // Remove 2FA status from localStorage
        localStorage.removeItem(`2fa_enabled_${user.uid}`);
        localStorage.removeItem(`2fa_secret_${user.uid}`);
        
        toast({ 
          title: "Google Authenticator Disabled", 
          description: "Two-factor authentication has been disabled for your account" 
        });
        return true;
      } else {
        toast({ 
          title: "Invalid Code", 
          description: "Please enter a valid 6-digit verification code from Google Authenticator", 
          variant: "destructive" 
        });
        return false;
      }
    } catch (error: any) {
      console.error('Error disabling 2FA:', error);
      toast({ 
        title: "Error", 
        description: "Failed to disable Google Authenticator: " + error.message, 
        variant: "destructive" 
      });
      return false;
    }
  };

  // Verify a 2FA code (for sign-in)
  const verifyTwoFactorCode = async (code: string): Promise<boolean> => {
    if (!user || !twoFactorSecret) return false;
    
    try {
      // In a real app, this would verify the code against the secret using TOTP algorithm
      // For demo purposes, any 6-digit code will work
      if (code.length === 6 && /^\d+$/.test(code)) {
        return true;
      } else {
        toast({ 
          title: "Invalid Code", 
          description: "Please enter a valid 6-digit verification code from Google Authenticator", 
          variant: "destructive" 
        });
        return false;
      }
    } catch (error) {
      console.error('Error verifying Google Authenticator code:', error);
      return false;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmail(email, password);
      toast({ 
        title: "Signed In", 
        description: "Welcome back!" 
      });
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast({ 
        title: "Sign In Failed", 
        description: error.message || "Failed to sign in", 
        variant: "destructive" 
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      await signUpWithEmail(email, password);
      toast({ 
        title: "Account Created", 
        description: "Your account has been created successfully" 
      });
    } catch (error: any) {
      console.error('Error signing up:', error);
      toast({ 
        title: "Sign Up Failed", 
        description: error.message || "Failed to create account", 
        variant: "destructive" 
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOutUser();
      toast({ 
        title: "Signed Out", 
        description: "You have been signed out" 
      });
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({ 
        title: "Sign Out Failed", 
        description: error.message || "Failed to sign out", 
        variant: "destructive" 
      });
      throw error;
    }
  };

  return {
    user,
    isAuthLoading,
    signIn,
    signUp,
    logout,
    twoFactorEnabled,
    twoFactorSecret,
    twoFactorQRCode,
    generateTwoFactorSecret,
    enableTwoFactor,
    disableTwoFactor,
    verifyTwoFactorCode
  };
};
