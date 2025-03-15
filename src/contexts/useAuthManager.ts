
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

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
    logout
  };
};
