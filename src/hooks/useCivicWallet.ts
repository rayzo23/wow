import { useState, useCallback, useEffect } from 'react';
import { useUser } from '@civic/auth-web3/react';
import { userHasWallet } from '@civic/auth-web3';
import { toast } from 'sonner';
import { PublicKey, Connection, clusterApiUrl } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';

/**
 * Custom hook to manage Civic wallet functionality
 * Provides methods for wallet creation and transaction signing
 */
export const useCivicWallet = () => {
  const userContext = useUser();
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [walletCreationAttempted, setWalletCreationAttempted] = useState(false);
  
  // Ensure we have a connection even if civic auth connection isn't ready
  const fallbackConnection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  
  // Check if user has a wallet with more reliable detection
  const hasWallet = userContext.user && userContext.solana && userContext.solana.address ? true : userHasWallet(userContext);
  
  // Create wallet for new users with improved error handling
  const createWallet = useCallback(async (): Promise<boolean> => {
    if (!userContext.user) {
      toast.error("Please sign in first to create a wallet");
      return false;
    }
    
    if (hasWallet) {
      return true;
    }
    
    if (isCreatingWallet) {
      return false;
    }
    
    try {
      setIsCreatingWallet(true);
      console.log("Creating wallet for user:", userContext.user);
      
      // Ensure createWallet method exists
      if (typeof userContext.createWallet !== 'function') {
        throw new Error("createWallet method not available");
      }
      
      await userContext.createWallet();
      
      // Verify wallet was created
      setTimeout(() => {
        if (userContext.solana && userContext.solana.address) {
          toast.success("Wallet created successfully!");
          console.log("Wallet created with address:", userContext.solana.address);
        } else {
          toast.error("Wallet creation might have failed. Please try again.");
          console.error("Wallet creation verification failed");
        }
      }, 2000);
      
      return true;
    } catch (error) {
      console.error("Error creating wallet:", error);
      toast.error("Unable to create wallet. Please try again.");
      return false;
    } finally {
      setIsCreatingWallet(false);
      setWalletCreationAttempted(true);
    }
  }, [userContext, hasWallet, isCreatingWallet]);
  
  // Auto-create wallet when user logs in (if needed)
  useEffect(() => {
    if (userContext.user && !hasWallet && !isCreatingWallet && !walletCreationAttempted) {
      console.log("Attempting automatic wallet creation");
      createWallet();
    }
  }, [userContext.user, hasWallet, isCreatingWallet, createWallet, walletCreationAttempted]);
  
  // Manually retry wallet creation
  const retryWalletCreation = useCallback(async (): Promise<boolean> => {
    setWalletCreationAttempted(false);
    return await createWallet();
  }, [createWallet]);
  
  // Get provider for Anchor transactions with fallback
  const getAnchorProvider = useCallback(() => {
    if (!userContext.user) {
      throw new Error("Please sign in first");
    }
    
    if (!hasWallet || !userContext.solana) {
      throw new Error("Wallet not available. Please create a wallet first.");
    }
    
    try {
      return new anchor.AnchorProvider(
        userContext.solana.connection || fallbackConnection,
        userContext.solana.wallet,
        { 
          commitment: 'confirmed',
          preflightCommitment: 'confirmed',
          skipPreflight: false
        }
      );
    } catch (error) {
      console.error("Error creating AnchorProvider:", error);
      throw new Error("Failed to create transaction provider");
    }
  }, [hasWallet, userContext.solana, userContext.user, fallbackConnection]);
  
  // Copy wallet address to clipboard
  const copyWalletAddress = useCallback((): boolean => {
    if (!hasWallet || !userContext.solana || !userContext.solana.address) {
      toast.error("No wallet address available to copy");
      return false;
    }
    
    try {
      navigator.clipboard.writeText(userContext.solana.address);
      toast.success("Wallet address copied to clipboard!");
      return true;
    } catch (error) {
      console.error("Error copying address:", error);
      toast.error("Failed to copy address");
      return false;
    }
  }, [hasWallet, userContext.solana]);
  
  // Export wallet key (display relevant information)
  const exportWalletInfo = useCallback((): { address: string; network: string } | null => {
    if (!hasWallet || !userContext.solana || !userContext.solana.address) {
      toast.error("No wallet available to export");
      return null;
    }
    
    return {
      address: userContext.solana.address,
      network: 'devnet'
    };
  }, [hasWallet, userContext.solana]);
  
  return {
    user: userContext.user,
    hasWallet,
    isCreatingWallet,
    walletCreationAttempted,
    createWallet,
    retryWalletCreation,
    getAnchorProvider,
    copyWalletAddress,
    exportWalletInfo,
    wallet: hasWallet && userContext.solana ? userContext.solana.wallet : undefined,
    address: hasWallet && userContext.solana ? userContext.solana.address : undefined,
    publicKey: hasWallet && userContext.solana && userContext.solana.address ? 
      new PublicKey(userContext.solana.address) : undefined,
    connection: userContext.solana && userContext.solana.connection ? 
      userContext.solana.connection : fallbackConnection,
  };
};
