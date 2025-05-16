
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InfoIcon, Sparkles, Lock, Clock, Send, Lightbulb, LogIn } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useCivicWallet } from "@/hooks/useCivicWallet";

interface WishFormProps {
  onSubmit: (title: string) => Promise<boolean>;
}

const WishForm = ({ onSubmit }: WishFormProps) => {
  const { user, hasWallet, createWallet } = useCivicWallet();
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [wishesCreated, setWishesCreated] = useState<number>(0);
  const maxLength = 100;
  
  // Animation states
  const [showSuccessEffect, setShowSuccessEffect] = useState(false);

  // Update character count when title changes
  useEffect(() => {
    setCharCount(title.length);
  }, [title]);
  
  // Handle successful wish submission with animation
  const handleSuccessAnimation = () => {
    setShowSuccessEffect(true);
    setWishesCreated(prev => prev + 1);
    
    // Reset animation after delay
    setTimeout(() => {
      setShowSuccessEffect(false);
    }, 2000);
  };

  /**
   * Handles the submission of a new wish to the blockchain
   * Includes comprehensive error handling and user feedback
   */
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    // Input validation
    if (!title.trim()) {
      toast.error("Please enter your wish");
      return;
    }
    
    if (!user) {
      toast.error("Please sign in with Civic Auth to submit a wish", {
        description: "Click the user button in the top right corner",
        action: {
          label: "Learn More",
          onClick: () => window.open("https://www.civic.com/", "_blank")
        }
      });
      return;
    }
    
    if (!hasWallet) {
      try {
        toast.info("Creating your Solana wallet...");
        await createWallet();
      } catch (error) {
        console.error("Error creating wallet:", error);
        toast.error("Failed to create wallet", { 
          description: "Please try again or contact support if the issue persists"
        });
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      // Attempt to submit the wish to the blockchain
      const success = await onSubmit(title);
      
      if (success) {
        handleSuccessAnimation();
        toast.success("Wish submitted successfully!", {
          description: "Your wish has been permanently stored on the Solana blockchain",
        });
        setTitle("");
      }
    } catch (error) {
      console.error("Error submitting wish:", error);
      // Enhanced error messaging based on error type
      if (error instanceof Error) {
        if (error.message.includes("insufficient funds")) {
          toast.error("Insufficient SOL balance", { 
            description: "Your wallet needs SOL to pay for the transaction fee"
          });
        } else if (error.message.includes("User rejected")) {
          toast.error("Transaction cancelled", { 
            description: "You cancelled the transaction"
          });
        } else {
          toast.error("Failed to submit wish", { 
            description: error.message || "Please try again"
          });
        }
      } else {
        toast.error("Failed to submit wish", { 
          description: "An unexpected error occurred. Please try again."
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`relative ${showSuccessEffect ? 'wish-success-animation' : ''}`}>
      {/* Success animation overlay */}
      {showSuccessEffect && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="sparkle-animation">
            <Sparkles className="h-16 w-16 text-purple-500 animate-pulse" />
          </div>
        </div>
      )}
      
      {/* Status indicators (subtle, modern design) */}
      {(user || hasWallet) && (
        <div className="flex items-center gap-2 mb-3">
          {user && (
            <Badge variant="outline" className="bg-gray-800/70 text-purple-400 border-gray-700 flex items-center gap-1 py-1">
              <Lock className="h-3 w-3" /> Authenticated
            </Badge>
          )}
          
          {hasWallet && (
            <Badge variant="outline" className="bg-gray-800/70 text-green-400 border-gray-700 flex items-center gap-1 py-1 animate-in fade-in">
              <Sparkles className="h-3 w-3" /> Wallet Ready
            </Badge>
          )}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="w-full">
        <div className="space-y-4">
          <div>
            <div className="relative">
              <Input
                placeholder="Enter your wish..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:ring-purple-500 focus:border-purple-500 pr-10"
                maxLength={maxLength}
                disabled={isSubmitting || !user}
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Lightbulb size={16} className="text-purple-400/70" />
              </span>
            </div>
            
            <div className="mt-2">
              <div className="flex justify-between items-center text-xs">
                <div className="text-gray-400 flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon size={12} className="text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-gray-800 border-gray-700">
                      <p>Your wish will be immutably stored on the Solana blockchain</p>
                    </TooltipContent>
                  </Tooltip>
                  <span>Onchain Data</span>
                </div>
                <div className="text-gray-400">
                  {title.length}/{maxLength} characters
                </div>
              </div>
              
              {/* Character progress bar */}
              <Progress
                value={(charCount / maxLength) * 100}
                className="h-1 mt-1 bg-gray-700"
                indicatorClassName={charCount > maxLength * 0.8 ? "bg-amber-500" : "bg-purple-500"}
              />
            </div>
          </div>
          
          {/* Transaction information hint (subtle) */}
          {user && (
            <div className="rounded-md bg-gray-800/80 p-3 border border-gray-700">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-purple-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-300 font-medium">Transaction Details</p>
                  <p className="text-xs text-gray-400 mt-1">Your wish will be permanently stored on the Solana blockchain.</p>
                  
                  {wishesCreated > 0 && (
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-purple-400" />
                      <span>You've created {wishesCreated} {wishesCreated === 1 ? "wish" : "wishes"} in this session</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div>
            {!user ? (
              <Button 
                type="button"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white flex items-center justify-center gap-2 shadow-lg"
                onClick={() => toast.info("Please sign in via the top navigation bar")}
              >
                <LogIn className="h-4 w-4" />
                <span>Sign in to Create Wishes</span>
              </Button>
            ) : (
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white flex items-center justify-center gap-2 shadow-lg"
                disabled={isSubmitting || !title.trim()}
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
                    <span>Storing on blockchain...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Submit Wish</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default WishForm;
