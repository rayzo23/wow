import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ExternalLink, Copy, CheckCircle2, Star, Lightbulb, ArrowRight, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWishProgram } from "@/lib/solana";
import { useCivicWallet } from "@/hooks/useCivicWallet";
import { toast } from "sonner";

interface WishCardProps {
  wish: {
    user: string;
    title: string;
    tx: string;
  };
}

/**
 * Enhanced WishCard component with enterprise-grade UI
 * Displays wish information with visual appeal and interactive elements
 */
const WishCard = ({ wish }: WishCardProps) => {
  // State management
  const [copied, setCopied] = useState(false);
  const [highlighted, setHighlighted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Hooks for functionality
  const { publicKey } = useCivicWallet();
  const { deleteWish } = useWishProgram();

  // Handle deleting a wish (only available to the creator)
  const handleDelete = async (): Promise<void> => {
    if (!publicKey) return;

    try {
      setIsDeleting(true);
      toast.loading("Deleting wish...", { id: "delete-wish" });

      await deleteWish(wish.tx);
      toast.success("Wish deleted successfully!", { id: "delete-wish" });
    } catch (error) {
      console.error("Error deleting wish:", error);
      toast.error("Failed to delete wish", { id: "delete-wish" });
    } finally {
      setIsDeleting(false);
    }
  };

  // Format addresses for display
  const shortenAddress = (address: string): string => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Handle viewing the transaction on Solana Explorer
  const viewOnExplorer = (): void => {
    const url = `https://explorer.solana.com/address/${wish.tx}?cluster=devnet`;
    window.open(url, "_blank");
  };

  // Copy transaction address to clipboard
  const copyAddress = (): void => {
    navigator.clipboard.writeText(wish.tx);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle highlighting a wish card
  const toggleHighlight = (): void => {
    setHighlighted(!highlighted);
  };

  // Check if current user is the creator of this wish
  const isCreator = publicKey?.toString() === wish.user;

  return (
    <Card
      className={cn(
        "backdrop-blur-sm bg-card/70 border-muted/20 overflow-hidden transition-all duration-300 hover:shadow-lg",
        highlighted && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
    >
      {/* Visual indicator for highlighted wishes */}
      {highlighted && (
        <div className="h-1 w-full bg-gradient-to-r from-primary to-accent" />
      )}
      
      <CardContent className="pt-6 relative">
        {/* Animated wish indicator */}
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge 
            variant="outline" 
            className="bg-primary/10 text-primary border-primary/20 flex items-center gap-1 px-3 py-1 text-xs animate-in fade-in-50"
          >
            <Star className="h-3 w-3 text-primary" />
            <span>Wish</span>
          </Badge>
        </div>
        
        {/* Wish content with enhanced typography */}
        <div className="space-y-4">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 text-primary">
              <Lightbulb className="h-4 w-4" />
            </div>
            <div>
              <p className="text-md text-white break-words font-medium leading-relaxed">
                {wish.title.charAt(0).toUpperCase() + wish.title.slice(1)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Wish metadata */}
        <div className="mt-4 pt-3 border-t border-muted/30 flex justify-between items-center text-xs">
          <Tooltip>
            <TooltipTrigger>
              <div className="text-muted-foreground hover:text-white transition-colors cursor-help flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-accent/70" />
                <span>By {shortenAddress(wish.user)}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p>Full address: {wish.user}</p>
            </TooltipContent>
          </Tooltip>
          
          {/* Transaction actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
              onClick={copyAddress}
            >
              {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
              onClick={viewOnExplorer}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
            
            {isCreator && (
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full text-destructive hover:bg-destructive/10"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Delete your wish</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-3 border-t border-muted/10">
        <div className="w-full flex justify-between items-center">
          <div className="text-[10px] text-muted-foreground opacity-70">
            TX: {shortenAddress(wish.tx)}
          </div>
          
          <Button
            variant="ghost" 
            size="sm" 
            className="h-6 rounded-full px-2 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 flex items-center gap-1"
            onClick={toggleHighlight}
          >
            {highlighted ? "Unmark" : "Highlight"}
            <ArrowRight className="h-3 w-3 ml-0.5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default WishCard;
