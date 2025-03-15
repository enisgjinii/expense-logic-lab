
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

  // Generate a new 2FA secret
  const generateTwoFactorSecret = async () => {
    if (!user) return;
    
    try {
      // In a real app, this would be a server-side call to generate a proper TOTP secret
      // For demo purposes, we'll simulate it
      const randomSecret = Array.from(window.crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      setTwoFactorSecret(randomSecret);
      
      // Generate a fake QR code URL (in a real app, this would be a proper otpauth URL)
      const fakeQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/FinanceApp:${user.email}?secret=${randomSecret}&issuer=FinanceApp`;
      setTwoFactorQRCode(fakeQrUrl);
      
      return { secret: randomSecret, qrCode: fakeQrUrl };
    } catch (error: any) {
      console.error('Error generating 2FA secret:', error);
      toast({ 
        title: "Error", 
        description: "Failed to generate 2FA secret", 
        variant: "destructive" 
      });
      throw error;
    }
  };

  // Enable 2FA for the user
  const enableTwoFactor = async (verificationCode: string) => {
    if (!user || !twoFactorSecret) return false;
    
    try {
      // In a real app, this would verify the code against the secret
      // For demo purposes, any 6-digit code will work
      if (verificationCode.length === 6 && /^\d+$/.test(verificationCode)) {
        setTwoFactorEnabled(true);
        
        // Store 2FA status in localStorage (in a real app, this would be in Firestore)
        localStorage.setItem(`2fa_enabled_${user.uid}`, 'true');
        localStorage.setItem(`2fa_secret_${user.uid}`, twoFactorSecret);
        
        toast({ 
          title: "2FA Enabled", 
          description: "Two-factor authentication has been enabled for your account" 
        });
        return true;
      } else {
        toast({ 
          title: "Invalid Code", 
          description: "Please enter a valid 6-digit verification code", 
          variant: "destructive" 
        });
        return false;
      }
    } catch (error: any) {
      console.error('Error enabling 2FA:', error);
      toast({ 
        title: "Error", 
        description: "Failed to enable 2FA: " + error.message, 
        variant: "destructive" 
      });
      return false;
    }
  };

  // Disable 2FA for the user
  const disableTwoFactor = async (verificationCode: string) => {
    if (!user) return false;
    
    try {
      // In a real app, this would verify the code against the secret
      // For demo purposes, any 6-digit code will work
      if (verificationCode.length === 6 && /^\d+$/.test(verificationCode)) {
        setTwoFactorEnabled(false);
        setTwoFactorSecret('');
        setTwoFactorQRCode('');
        
        // Remove 2FA status from localStorage
        localStorage.removeItem(`2fa_enabled_${user.uid}`);
        localStorage.removeItem(`2fa_secret_${user.uid}`);
        
        toast({ 
          title: "2FA Disabled", 
          description: "Two-factor authentication has been disabled for your account" 
        });
        return true;
      } else {
        toast({ 
          title: "Invalid Code", 
          description: "Please enter a valid 6-digit verification code", 
          variant: "destructive" 
        });
        return false;
      }
    } catch (error: any) {
      console.error('Error disabling 2FA:', error);
      toast({ 
        title: "Error", 
        description: "Failed to disable 2FA: " + error.message, 
        variant: "destructive" 
      });
      return false;
    }
  };

  // Verify a 2FA code (for sign-in)
  const verifyTwoFactorCode = async (code: string) => {
    if (!user || !twoFactorSecret) return false;
    
    try {
      // In a real app, this would verify the code against the secret
      // For demo purposes, any 6-digit code will work
      if (code.length === 6 && /^\d+$/.test(code)) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error verifying 2FA code:', error);
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
