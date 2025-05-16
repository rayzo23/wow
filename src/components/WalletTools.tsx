import React, { useState } from 'react';
import { useCivicWallet } from '@/hooks/useCivicWallet';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Wallet, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  Info, 
  Loader2,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { clusterApiUrl } from '@solana/web3.js';

interface WalletToolsProps {
  hasWallet: boolean;
  createWallet: () => Promise<any>;
  copyAddress: () => void;
  publicKey?: any;
}

/**
 * Component that provides wallet management tools for users
 * - Creating wallets
 * - Copying wallet address
 * - Viewing wallet information
 */
export const WalletTools: React.FC<WalletToolsProps> = ({ 
  hasWallet,
  createWallet,
  copyAddress,
  publicKey
}) => {
  // Still get some values from the hook
  const { 
    user, 
    isCreatingWallet,
    address: hookAddress,
    walletCreationAttempted,
    connection
  } = useCivicWallet();
  
  // Use the address from props or hook
  const address = publicKey?.toString() || hookAddress;
  
  const [copied, setCopied] = useState(false);
  const [viewingInfo, setViewingInfo] = useState(false);
  
  // Handle copying the wallet address
  const handleCopyAddress = () => {
    try {
      copyAddress(); // Use the prop function
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch (error) {
      console.error("Error copying address:", error);
      toast.error("Could not copy address");
      return false;
    }
  };
  
  // Handle creating a wallet
  const handleCreateWallet = async () => {
    try {
      if (!user) {
        toast.error("Please sign in first");
        return;
      }
      
      toast.loading("Creating your wallet...", { id: "wallet-creation" });
      const success = await createWallet();
      
      if (success) {
        toast.success("Wallet created! You can now receive SOL.", { id: "wallet-creation" });
      } else {
        toast.error("Wallet creation failed. Please try again.", { id: "wallet-creation" });
      }
    } catch (error) {
      console.error("Error creating wallet:", error);
      toast.error("Error creating wallet", { id: "wallet-creation" });
    }
  };
  
  // Handle manually retrying wallet creation
  const handleRetryWalletCreation = async () => {
    try {
      toast.loading("Retrying wallet creation...", { id: "wallet-retry" });
      // Use the provided createWallet function from props
      const success = await createWallet();
      
      if (success) {
        toast.success("Wallet created successfully!", { id: "wallet-retry" });
      } else {
        toast.error("Still unable to create wallet. Please try again.", { id: "wallet-retry" });
      }
    } catch (error) {
      console.error("Error retrying wallet creation:", error);
      toast.error("Failed to retry wallet creation", { id: "wallet-retry" });
    }
  };
  
  // Format the wallet address for display
  const formatAddress = (addr: string): string => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };
  
  // Handle viewing wallet information
  const handleViewWalletInfo = () => {
    if (address) {
      setViewingInfo(true);
    } else {
      toast.error("No wallet information available");
    }
  };
  
  // Get Solana Explorer URL for the address
  const getExplorerUrl = (addr: string): string => {
    return `https://explorer.solana.com/address/${addr}?cluster=devnet`;
  };
  
  // Determine wallet status message
  const getWalletStatus = (): string => {
    if (!user) return "Please sign in first";
    if (hasWallet) return "Wallet ready";
    if (isCreatingWallet) return "Creating wallet...";
    if (walletCreationAttempted) return "Wallet creation failed";
    return "No wallet available";
  };
  
  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          <span>Wallet Tools</span>
        </CardTitle>
        <CardDescription>
          Manage your Civic Auth wallet for Solana transactions
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Wallet Status Section */}
        <div className="rounded-md bg-muted p-3">
          <div className="flex justify-between items-center">
            <div className="text-sm font-medium">Status:</div>
            <div className="flex items-center gap-1.5">
              <div className={`h-2 w-2 rounded-full ${hasWallet ? 'bg-green-500' : 'bg-amber-500'}`} />
              <span className="text-sm">{getWalletStatus()}</span>
            </div>
          </div>
          
          {address && (
            <div className="mt-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Address:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono">{formatAddress(address)}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 rounded-full"
                    onClick={handleCopyAddress}
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Network:</span>
                <span className="text-sm">Solana Devnet</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Getting Devnet SOL Instructions */}
        <div className="bg-primary/10 rounded-md p-3">
          <h4 className="text-sm font-medium text-primary mb-2 flex items-center gap-1.5">
            <Info className="h-4 w-4" />
            <span>Need Devnet SOL?</span>
          </h4>
          <ol className="text-xs space-y-1.5 text-muted-foreground">
            <li>1. Copy your wallet address above</li>
            <li>2. Visit <a href="https://solfaucet.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">solfaucet.com</a></li>
            <li>3. Select "Devnet" network and paste your address</li>
            <li>4. Request SOL from the faucet</li>
          </ol>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col gap-3">
        {!hasWallet ? (
          <Button 
            className="w-full" 
            onClick={walletCreationAttempted ? handleRetryWalletCreation : handleCreateWallet}
            disabled={isCreatingWallet || !user}
          >
            {isCreatingWallet ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Creating Wallet...</span>
              </>
            ) : walletCreationAttempted ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                <span>Retry Wallet Creation</span>
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4 mr-2" />
                <span>Create Wallet</span>
              </>
            )}
          </Button>
        ) : (
          <div className="flex gap-2 w-full">
            <Button 
              className="flex-1" 
              variant="outline" 
              onClick={handleCopyAddress}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  <span>Copy Address</span>
                </>
              )}
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  className="flex-1" 
                  variant="outline" 
                  onClick={handleViewWalletInfo}
                >
                  <Info className="h-4 w-4 mr-2" />
                  <span>Wallet Info</span>
                </Button>
              </DialogTrigger>
              
              {address && (
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Your Wallet Details</DialogTitle>
                    <DialogDescription>
                      Use these details to fund your wallet or manage your account
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Wallet Address</h4>
                      <div className="p-2 bg-muted rounded-md">
                        <div className="font-mono text-xs break-all">{address}</div>
                        <div className="flex justify-end mt-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-6 flex gap-1 text-xs"
                            onClick={handleCopyAddress}
                          >
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Network</h4>
                      <div className="text-sm">
                        Solana Devnet (<code>{clusterApiUrl('devnet')}</code>)
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Explorer Link</h4>
                      <a 
                        href={getExplorerUrl(address)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1.5 text-sm"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>View on Solana Explorer</span>
                      </a>
                    </div>
                    
                    <div className="pt-3 border-t">
                      <p className="text-xs text-muted-foreground">
                        Your wallet is securely managed by Civic Auth. The private key is 
                        never exposed to this application.
                      </p>
                    </div>
                  </div>
                </DialogContent>
              )}
            </Dialog>
          </div>
        )}
        
        {hasWallet && (
          <a 
            href={address ? getExplorerUrl(address) : '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center justify-center gap-1.5 w-full"
          >
            <ExternalLink className="h-3 w-3" />
            <span>View on Solana Explorer</span>
          </a>
        )}
      </CardFooter>
    </Card>
  );
};

export default WalletTools;
