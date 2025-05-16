import { useState, useEffect, useRef } from "react";
import { UserButton as CivicUserButton, useUser } from "@civic/auth-web3/react";
import { useCivicWallet } from "@/hooks/useCivicWallet";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Key, Shield, UserCircle, User, Check, Sparkles, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * Enterprise-grade UserButton component
 * Provides a professional and consistent authentication experience
 * with visual feedback and seamless wallet integration
 */
export const UserButton = () => {
  const userContext = useUser();
  const { user } = userContext;
  const { hasWallet, createWallet } = useCivicWallet();
  const [showConnectingState, setShowConnectingState] = useState(false);
  const [animation, setAnimation] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const civicButtonRef = useRef<HTMLDivElement>(null);

  // Track if this is a popup window to handle window opener coordination
  const [isPopupWindow, setIsPopupWindow] = useState<boolean>(false);
  
  // Check if this is a popup window and notify the opener when authentication completes
  useEffect(() => {
    // Detect if we're in a popup window
    const isPopup = window.opener && window !== window.opener;
    setIsPopupWindow(isPopup);
    
    // If we're in a popup window and authentication is successful, notify the opener
    if (isPopup && user) {
      try {
        // Try to signal the main window that auth is complete
        window.opener.postMessage({ type: 'CIVIC_AUTH_COMPLETE', success: true }, '*');
        console.log('Auth complete message posted to opener window');
      } catch (error) {
        console.error('Error notifying parent window:', error);
      }
    }
  }, [user]);
  
  // Listen for auth complete messages from popup windows
  useEffect(() => {
    const handleAuthComplete = (event: MessageEvent) => {
      if (event.data && event.data.type === 'CIVIC_AUTH_COMPLETE') {
        console.log('Received auth complete message from popup');
        // Refresh the page to ensure state is in sync
        window.location.reload();
      }
    };
    
    window.addEventListener('message', handleAuthComplete);
    return () => window.removeEventListener('message', handleAuthComplete);
  }, []);
  
  // Handle authentication state changes with animations
  useEffect(() => {
    if (user) {
      setAnimation("animate-in fade-in-50 slide-in-from-top-5 duration-300");
      
      // If authenticated but no wallet, automatically create one
      if (!hasWallet) {
        const initWallet = async () => {
          setShowConnectingState(true);
          toast.loading("Creating your embedded wallet...", {
            id: "wallet-creation",
            duration: 3000
          });
          
          try {
            await createWallet();
            toast.success("Wallet created successfully", {
              id: "wallet-creation",
              description: "Your non-custodial Solana wallet is ready to use",
              duration: 4000
            });
          } catch (error) {
            console.error("Error creating wallet:", error);
            toast.error("Wallet creation failed", {
              id: "wallet-creation",
              description: "Please try again or contact support"
            });
          } finally {
            setShowConnectingState(false);
          }
        };
        initWallet();
      }
    }
  }, [user, hasWallet, createWallet]);

  // Handle sign in action
  const handleSignIn = () => {
    try {
      // Start auth timeout check to detect login completion
      if (typeof window !== 'undefined') {
        // Import dynamically to avoid SSR issues
        import('@/lib/auth-helpers').then(({ startAuthTimeoutCheck }) => {
          startAuthTimeoutCheck();
        }).catch(err => {
          console.error('Error importing auth helpers:', err);
        });
      }
      
      // Find the direct button element to click
      const buttonElement = civicButtonRef.current?.querySelector('button');
      
      if (buttonElement) {
        // Show loading toast to indicate sign-in is in progress
        toast.loading("Signing in...", { id: "auth-process" });
        
        // Direct programmatic click
        buttonElement.click();
        
        // Fallback: try dispatching a MouseEvent
        if (typeof MouseEvent === 'function') {
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
          });
          buttonElement.dispatchEvent(clickEvent);
        }
        
        // Let user know we're checking for auth completion
        setTimeout(() => {
          toast.loading("Waiting for Google authentication...", { id: "auth-process" });
        }, 3000);
      } else {
        console.error("Civic button not found");
        toast.info("Opening sign-in dialog");
        // Let users know they can click directly
        setTimeout(() => {
          toast.info("If the sign-in dialog doesn't appear, please try clicking again");
        }, 1500);
      }
    } catch (error) {
      console.error("Error triggering sign-in:", error);
      toast.error("Sign-in failed", {
        description: "Please try clicking directly on the sign-in button",
        id: "auth-process"
      });
    }
  };

  // Handle sign out action
  const handleSignOut = () => {
    try {
      // The Civic UserButton handles sign-out internally
      const buttonElement = civicButtonRef.current?.querySelector('button');
      if (buttonElement) {
        buttonElement.click();
      }
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Custom wrapper with enterprise styling
  return (
    <div className="relative">
      {/* Loading spinner for wallet creation */}
      {showConnectingState && (
        <div className="absolute -top-2 -right-2 z-10 flex items-center justify-center">
          <div className="w-5 h-5 rounded-full bg-primary/20 p-0.5 backdrop-blur-sm animate-pulse">
            <Wallet className="h-3 w-3 text-primary animate-spin" />
          </div>
        </div>
      )}
      
      <Tooltip>
        <TooltipTrigger
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {user ? (
            // Authenticated state
            <div 
              className={cn(
                "rounded-lg overflow-hidden transition-all duration-300 shadow-md",
                "bg-card border border-primary/20 backdrop-blur-sm cursor-pointer",
                isHovered ? "shadow-lg shadow-primary/10 scale-[1.03]" : "",
                animation
              )}
              onClick={handleSignOut}
            >
              <div className="flex items-center justify-between p-1.5 gap-2 group">
                {/* User avatar */}
                <div className="relative h-8 w-8 overflow-hidden rounded-md bg-muted">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-20 group-hover:opacity-30 transition-opacity" />
                  
                  <div className="h-full w-full flex items-center justify-center">
                    {user.image ? (
                      <img 
                        src={user.image} 
                        alt="User avatar" 
                        className="h-full w-full object-cover" 
                      />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
                
                {/* Status indicators */}
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className="bg-primary/5 border-primary/10 text-xs py-0 h-6 pl-1.5 pr-2 flex items-center gap-1"
                  >
                    <Check className="h-3 w-3 text-primary" />
                    <span>Signed in</span>
                  </Badge>
                  
                  {hasWallet && (
                    <Badge
                      variant="outline"
                      className="bg-green-500/5 border-green-500/10 text-green-500 text-xs py-0 h-6 pl-1.5 pr-2 flex items-center gap-1"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>Wallet</span>
                    </Badge>  
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Unauthenticated state - Sign in button
            <Button
              type="button"
              className={cn(
                "h-10 pr-4 pl-3 gap-2 bg-gradient-to-r from-primary/90 to-accent/90 hover:from-primary hover:to-accent",
                "border border-primary/20 shadow-md transition-all duration-300",
                isHovered ? "shadow-lg shadow-primary/10 scale-105" : "",
                animation
              )}
              onClick={handleSignIn}
            >
              <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-white" />
              </div>
              <span>Sign in</span>
            </Button>
          )}
        </TooltipTrigger>
        
        <TooltipContent side="bottom" className="p-3 max-w-[250px]">
          <div className="space-y-2">
            {user ? (
              <>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium">Authenticated with Civic</span>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  You're signed in with a secure non-custodial account. Click to sign out.
                </p>
                
                {hasWallet && (
                  <div className="flex items-center gap-2 pt-1">
                    <Key className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-500">Embedded wallet active</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium">Sign in with Civic Auth</span>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Authenticate using familiar providers like Google, GitHub, and more. No wallet extensions needed.
                </p>
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
      
      {/* Actual CivicUserButton for functionality - styled to be invisible but clickable */}
      <div className="absolute inset-0 opacity-0" ref={civicButtonRef}>
        <CivicUserButton />
      </div>
    </div>
  );
};

// Only export as a named export to match the import in WishForm.tsx
