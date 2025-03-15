
import React from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Lock } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from '@/components/ui/use-toast';

export default function Profile() {
  const { user, logout } = useFinance();
  const [isUpdating, setIsUpdating] = React.useState(false);
  const isMobile = useIsMobile();

  // Since this is a demo, we're not actually updating the profile
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    
    // Simulate API request
    setTimeout(() => {
      setIsUpdating(false);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully!",
      });
    }, 1000);
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
      </Tabs>
    </div>
  );
}
