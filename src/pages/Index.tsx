import { useState, useEffect, useCallback } from "react";
import WishForm from "@/components/WishForm";
import Wishes from "@/components/Wishes";
import { useWishProgram } from "@/lib/solana";
import { useCivicWallet } from "@/hooks/useCivicWallet";
import { toast, Toaster } from "sonner";
import { UserButton } from "@/components/CustomUserButton";
import { WalletTools } from "@/components/WalletTools";
import { Sparkles, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@civic/auth-web3/react";
import { initializeAuthListeners, useAuthStateChange } from "@/lib/auth-helpers";

/**
 * Main Index component for the Wall of Wishes application
 * Integrates Civic Auth for user authentication and embedded wallets
 * Professional dark UI single-page layout
 */
export default function Index() {
  // Civic Auth integration
  const { publicKey, user, hasWallet, createWallet } = useCivicWallet();
  
  // Access user context for authentication state
  const userContext = useUser();
  
  // Wish program state
  const { wishes, fetchWishes, submitWish, loading } = useWishProgram();
  
  // UI state management
  const [refreshing, setRefreshing] = useState(false);
  const [authState, setAuthState] = useState<string>(user ? 'authenticated' : 'unauthenticated');
  
  // Initialize auth listener system when component mounts
  useEffect(() => {
    // Initialize professional auth listeners
    if (typeof window !== 'undefined') {
      initializeAuthListeners();
      console.log('Auth listeners initialized');
    }
    
    // No cleanup needed - listeners are managed globally
  }, []);
  
  // Monitor auth state changes from the user object
  useEffect(() => {
    // Track previous and current auth state
    const newAuthState = user ? 'authenticated' : 'unauthenticated';
    
    if (authState !== newAuthState) {
      console.log(`Auth state changed: ${authState} -> ${newAuthState}`);
      setAuthState(newAuthState);
      
      // Handle authentication success
      if (newAuthState === 'authenticated' && authState === 'unauthenticated') {
        toast.success("Successfully signed in");
        
        // Create wallet automatically if needed
        if (!hasWallet && createWallet) {
          setTimeout(() => {
            console.log("Attempting to create wallet automatically");
            createWallet().catch(err => console.error("Auto wallet creation error:", err));
          }, 1000);
        }
      }
    }
  }, [user, authState, hasWallet, createWallet]);
  
  // Subscribe to auth state change events (from our professional system)
  const handleAuthStateChange = useCallback(() => {
    console.log('Auth state change detected');
    // Force a re-render without page refresh
    setRefreshing(true);
    
    // Clear any pending auth toasts
    toast.dismiss('auth-process');
    
    // Small delay to ensure all auth state is updated
    setTimeout(() => {
      setRefreshing(false);
      
      // Auto-create wallet if needed
      if (user && !hasWallet && createWallet) {
        createWallet().catch(err => console.error("Auto wallet creation error:", err));
      }
    }, 500);
  }, [user, hasWallet, createWallet]);
  
  // Register the auth state change handler
  useAuthStateChange(handleAuthStateChange);
  
  // Handle user logout with manual clearing and page refresh
  const handleLogout = async () => {
    try {
      // Clear cookies and local storage related to auth
      document.cookie.split(';').forEach(cookie => {
        const name = cookie.split('=')[0].trim();
        if (name.includes('civic') || name.includes('auth')) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });
      
      // Attempt to clear local storage items related to auth
      try {
        localStorage.removeItem('civicJWT');
        localStorage.removeItem('gatewayToken');
      } catch (e) {
        console.warn('Could not access localStorage', e);
      }
      
      toast.success("Successfully logged out");
      
      // Refresh page after a brief delay to show the toast
      setTimeout(() => {
        window.location.href = window.location.pathname;
      }, 1000);
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error("Logout failed");
      
      // Force refresh as fallback
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };
  
  // Only get wishes when the user clicks refresh
  const handleRefresh = async () => {
    if (!publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }

    setRefreshing(true);
    try {
      await fetchWishes();
      toast.success("Wishes refreshed!");
    } catch (error) {
      console.error("Error fetching wishes:", error);
      toast.error("Failed to fetch wishes");
    } finally {
      setRefreshing(false);
    }
  };

  // Handle creating a new wish
  const handleSubmitWish = async (title: string): Promise<boolean> => {
    if (!user || !publicKey) {
      toast.error("Please sign in and connect your wallet");
      return false;
    }

    try {
      await submitWish(title);
      toast.success("Your wish has been stored on the blockchain!");
      await handleRefresh(); // Refresh the list after submitting
      return true;
    } catch (error: any) {
      console.error("Error submitting wish:", error);
      toast.error(`Failed to submit wish: ${error.message || 'Unknown error'}`);
      return false;
    }
  };
  
  // Format wallet address for display
  const formatWalletAddress = (addr: string | undefined): string => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-b from-gray-950 to-gray-900 text-white">
      {/* Notifications */}
      <Toaster position="top-right" richColors />
      
      {/* Header with professional styling */}
      <header className="border-b border-gray-800 py-3 px-4 sm:px-6 lg:px-8 bg-black/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center">
            <Sparkles className="h-5 w-5 text-purple-500 mr-2" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Wall of Wishes
            </h1>
          </div>
          
          <div className="flex gap-3 items-center">
            {user && publicKey && (
              <>
                <div className="hidden sm:flex items-center mr-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      navigator.clipboard.writeText(publicKey.toString());
                      toast.success("Wallet address copied to clipboard!");
                    }}
                    className="text-xs bg-gray-900/80 border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    {formatWalletAddress(publicKey.toString())}
                  </Button>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-white hover:bg-gray-800/70"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            )}
            <UserButton />
          </div>
        </div>
      </header>

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto w-full">
          {/* Welcome message for new users */}
          {!user && (
            <div className="mb-10 p-6 rounded-lg border border-gray-800 bg-gray-900/50 text-center">
              <h2 className="text-2xl font-semibold mb-3 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Welcome to Wall of Wishes
              </h2>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                Store your wishes eternally on the Solana blockchain. Sign in with Civic to get started.
              </p>
              <UserButton />
            </div>
          )}
          
          {/* User dashboard */}
          {user && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Sidebar with wallet tools */}
              <div className="lg:col-span-2">
                <div className="mb-6">
                  <WalletTools 
                    hasWallet={hasWallet} 
                    createWallet={createWallet} 
                    copyAddress={() => {
                      if (publicKey) {
                        navigator.clipboard.writeText(publicKey.toString());
                        toast.success("Wallet address copied to clipboard!");
                      }
                    }}
                    publicKey={publicKey}
                  />
                </div>
                
                <WishForm onSubmit={handleSubmitWish} />
              </div>
              
              {/* Wishes section */}
              <div className="lg:col-span-3">
                <Wishes 
                  wishes={wishes} 
                  isLoading={loading} 
                  onRefresh={handleRefresh} 
                  loadingRefresh={refreshing}
                />
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Simple footer */}
      <footer className="py-6 px-4 sm:px-6 lg:px-8 border-t border-gray-800 bg-black/30">
        <div className="max-w-7xl mx-auto w-full text-center text-gray-500 text-sm">
          <p>Wall of Wishes • Built on Solana • Powered by Civic</p>
        </div>
      </footer>
    </div>
  );
}
