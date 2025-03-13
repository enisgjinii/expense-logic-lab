
import React, { useState, useEffect } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Mail, 
  Lock, 
  Save, 
  Upload, 
  Edit,
  Shield,
  RefreshCcw,
  LogOut,
  CreditCard,
  Building,
  Check,
  Loader2
} from 'lucide-react';
import { getFirestore, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { getAuth, updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const Profile = () => {
  const { user, logout, transactions } = useFinance();
  const db = getFirestore();
  const auth = getAuth();
  const storage = getStorage();
  
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    currency: 'USD',
    language: 'en',
    occupation: '',
    company: '',
    avatarUrl: '', // Leave empty to use initials
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [accountActivity, setAccountActivity] = useState([
    { action: 'Login', device: 'Chrome on Windows', location: 'New York, US', date: new Date().toISOString() },
  ]);
  
  useEffect(() => {
    fetchUserProfile();
  }, [user]);
  
  const fetchUserProfile = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setProfileData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: user.email || '',
          phone: userData.phone || '',
          currency: userData.currency || 'USD',
          language: userData.language || 'en',
          occupation: userData.occupation || '',
          company: userData.company || '',
          avatarUrl: userData.avatarUrl || '',
        });
        
        // Fetch activity if available
        if (userData.activity && Array.isArray(userData.activity)) {
          setAccountActivity(userData.activity);
        }
      } else {
        // Create a new profile document if it doesn't exist
        const initialProfile = {
          firstName: 'New',
          lastName: 'User',
          phone: '',
          currency: 'USD',
          language: 'en',
          occupation: '',
          company: '',
          avatarUrl: '',
          activity: [{
            action: 'Account Created',
            device: getBrowserInfo(),
            location: 'Unknown',
            date: new Date().toISOString()
          }]
        };
        
        await setDoc(userDocRef, initialProfile);
        setProfileData({
          ...initialProfile,
          email: user.email || '',
        });
        setAccountActivity(initialProfile.activity);
      }
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getBrowserInfo = () => {
    const userAgent = navigator.userAgent;
    let browserName;
    
    if (userAgent.match(/chrome|chromium|crios/i)) {
      browserName = "Chrome";
    } else if (userAgent.match(/firefox|fxios/i)) {
      browserName = "Firefox";
    } else if (userAgent.match(/safari/i)) {
      browserName = "Safari";
    } else if (userAgent.match(/opr\//i)) {
      browserName = "Opera";
    } else if (userAgent.match(/edg/i)) {
      browserName = "Edge";
    } else {
      browserName = "Unknown";
    }
    
    const platform = navigator.platform;
    
    return `${browserName} on ${platform}`;
  };
  
  const handleUpdateProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      
      // Update Firestore
      await updateDoc(userDocRef, {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
        currency: profileData.currency,
        language: profileData.language,
        occupation: profileData.occupation,
        company: profileData.company,
        avatarUrl: profileData.avatarUrl,
        updatedAt: new Date().toISOString()
      });
      
      // Log this activity
      const newActivity = {
        action: 'Profile Updated',
        device: getBrowserInfo(),
        location: 'Unknown',
        date: new Date().toISOString()
      };
      
      const updatedActivity = [newActivity, ...accountActivity.slice(0, 9)];
      await updateDoc(userDocRef, { activity: updatedActivity });
      setAccountActivity(updatedActivity);
      
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully."
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleChangePassword = async () => {
    if (!user || !user.email) return;
    
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New password and confirmation don't match.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    try {
      // Re-authenticate the user
      const credential = EmailAuthProvider.credential(
        user.email,
        passwordData.currentPassword
      );
      
      await reauthenticateWithCredential(user, credential);
      
      // Change password
      await updatePassword(user, passwordData.newPassword);
      
      // Log this activity
      const userDocRef = doc(db, 'users', user.uid);
      const newActivity = {
        action: 'Password Changed',
        device: getBrowserInfo(),
        location: 'Unknown',
        date: new Date().toISOString()
      };
      
      const updatedActivity = [newActivity, ...accountActivity.slice(0, 9)];
      await updateDoc(userDocRef, { activity: updatedActivity });
      setAccountActivity(updatedActivity);
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      toast({
        title: "Password changed",
        description: "Your password has been updated successfully."
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({
        title: "Password change failed",
        description: error.message || "Failed to change password",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsSaving(true);
    try {
      // Upload to Firebase Storage
      const storageRef = ref(storage, `users/${user.uid}/avatar`);
      await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update profile data
      setProfileData({...profileData, avatarUrl: downloadURL});
      
      // Update Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { avatarUrl: downloadURL });
      
      // Log this activity
      const newActivity = {
        action: 'Avatar Updated',
        device: getBrowserInfo(),
        location: 'Unknown',
        date: new Date().toISOString()
      };
      
      const updatedActivity = [newActivity, ...accountActivity.slice(0, 9)];
      await updateDoc(userDocRef, { activity: updatedActivity });
      setAccountActivity(updatedActivity);
      
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully."
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload avatar",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Get user initials for avatar fallback
  const getInitials = () => {
    return `${profileData.firstName.charAt(0)}${profileData.lastName.charAt(0)}`;
  };
  
  // Get account stats
  const getAccountStats = () => {
    if (!transactions) return { accounts: 0, transactions: 0, categories: 0 };
    
    const uniqueAccounts = new Set(transactions.map(t => t.account));
    const uniqueCategories = new Set(transactions.map(t => t.category));
    
    return {
      accounts: uniqueAccounts.size,
      transactions: transactions.length,
      categories: uniqueCategories.size
    };
  };
  
  const stats = getAccountStats();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 pb-10 animate-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <Badge variant="outline" className="px-2 py-1">
          {user ? 'Verified Account' : 'Not Logged In'}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Summary Card */}
        <Card className="col-span-1">
          <CardHeader className="relative pb-8">
            <div className="absolute right-4 top-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsEditing(!isEditing)}
                disabled={isSaving}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profileData.avatarUrl} />
                  <AvatarFallback className="text-xl font-semibold bg-primary text-primary-foreground">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0">
                  <label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="bg-primary text-primary-foreground p-1 rounded-full shadow-sm hover:bg-primary/90 transition-colors">
                      <Upload className="h-4 w-4" />
                    </div>
                    <input 
                      id="avatar-upload" 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleAvatarUpload}
                      disabled={isSaving}
                    />
                  </label>
                </div>
              </div>
              <CardTitle className="text-center">
                {profileData.firstName} {profileData.lastName}
              </CardTitle>
              <CardDescription className="text-center mt-1">
                {profileData.email}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{profileData.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Currency</p>
                <p className="text-sm text-muted-foreground">{profileData.currency}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Company</p>
                <p className="text-sm text-muted-foreground">{profileData.company || 'Not specified'}</p>
              </div>
            </div>
            
            <Separator className="my-2" />
            
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="space-y-1">
                <p className="text-2xl font-bold">{stats.accounts}</p>
                <p className="text-xs text-muted-foreground">Accounts</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{stats.transactions}</p>
                <p className="text-xs text-muted-foreground">Transactions</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{stats.categories}</p>
                <p className="text-xs text-muted-foreground">Categories</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center pt-2">
            <Button 
              variant="destructive" 
              onClick={logout}
              className="w-full"
              disabled={isSaving}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </CardFooter>
        </Card>
        
        {/* Main Profile Content */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="details" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Details</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Security</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <RefreshCcw className="h-4 w-4" />
                <span>Activity</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Personal Details Tab */}
            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    View and update your personal details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input 
                        id="firstName" 
                        value={profileData.firstName} 
                        onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                        disabled={!isEditing || isSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input 
                        id="lastName" 
                        value={profileData.lastName} 
                        onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                        disabled={!isEditing || isSaving}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input 
                        id="email" 
                        type="email"
                        value={profileData.email} 
                        disabled={true} // Email can only be changed via auth flow
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input 
                        id="phone" 
                        value={profileData.phone} 
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        disabled={!isEditing || isSaving}
                      />
                    </div>
                  </div>
                  
                  <Separator className="my-2" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="occupation">Occupation</Label>
                      <Input 
                        id="occupation" 
                        value={profileData.occupation} 
                        onChange={(e) => setProfileData({...profileData, occupation: e.target.value})}
                        disabled={!isEditing || isSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input 
                        id="company" 
                        value={profileData.company} 
                        onChange={(e) => setProfileData({...profileData, company: e.target.value})}
                        disabled={!isEditing || isSaving}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currency">Preferred Currency</Label>
                      <Select 
                        value={profileData.currency}
                        onValueChange={(value) => setProfileData({...profileData, currency: value})}
                        disabled={!isEditing || isSaving}
                      >
                        <SelectTrigger id="currency" className="w-full">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">$ USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">€ EUR - Euro</SelectItem>
                          <SelectItem value="GBP">£ GBP - British Pound</SelectItem>
                          <SelectItem value="JPY">¥ JPY - Japanese Yen</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="language">Preferred Language</Label>
                      <Select 
                        value={profileData.language}
                        onValueChange={(value) => setProfileData({...profileData, language: value})}
                        disabled={!isEditing || isSaving}
                      >
                        <SelectTrigger id="language" className="w-full">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  {isEditing ? (
                    <>
                      <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                        Cancel
                      </Button>
                      <Button onClick={handleUpdateProfile} disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsEditing(true)} disabled={isSaving}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Security Tab */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Manage your account security and password
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h3 className="text-lg font-medium">Change Password</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input 
                        id="current-password" 
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        disabled={isSaving}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input 
                          id="new-password" 
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                          disabled={isSaving}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <Input 
                          id="confirm-password" 
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                          disabled={isSaving}
                        />
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleChangePassword}
                      disabled={
                        isSaving ||
                        !passwordData.currentPassword || 
                        !passwordData.newPassword || 
                        !passwordData.confirmPassword
                      }
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Lock className="mr-2 h-4 w-4" />
                          Update Password
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center">
                        <h4 className="font-medium">Two-factor authentication</h4>
                        <Badge className="ml-2" variant="outline">Recommended</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Button variant="outline">Enable</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Activity Tab */}
            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Account Activity</CardTitle>
                  <CardDescription>
                    Recent sign-ins and security events
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {accountActivity.map((activity, index) => (
                      <div key={index} className="flex justify-between items-start border-b pb-4 last:border-0">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{activity.action}</span>
                            {index === 0 && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                                <Check className="mr-1 h-3 w-3" />
                                Latest
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{activity.device}</p>
                          <p className="text-sm text-muted-foreground">{activity.location}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(activity.date).toLocaleString()}
                        </p>
                      </div>
                    ))}
                    
                    {accountActivity.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        No activity recorded yet
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile;
