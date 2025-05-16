import { Connection, PublicKey } from '@solana/web3.js';
import { Program } from '@project-serum/anchor';
import { IDL, PROGRAM_ID } from './anchor/idl';
import { useCallback, useEffect, useState } from 'react';
import * as anchor from '@project-serum/anchor';
import { useCivicWallet } from '@/hooks/useCivicWallet';
import { toast } from 'sonner';
import { rpcManager, withRPC } from './rpc-manager';

// Local storage key for storing wishes (for mock implementation)
const WISHES_STORAGE_KEY = 'solana-wishes';

// Get a connection via the RPC manager to avoid rate limits
const getDevnetConnection = (): Connection => {
  return rpcManager.getConnection();
};

// Helper to find program derived address (PDA)
export const findWishPDA = async (
  userPubkey: PublicKey, 
  title: string
): Promise<[PublicKey, number]> => {
  return await PublicKey.findProgramAddress(
    [
      Buffer.from("wish"),
      userPubkey.toBuffer(),
      Buffer.from(title)
    ],
    new PublicKey(PROGRAM_ID)
  );
};

export interface WishAccount {
  publicKey: PublicKey;
  account: {
    user: PublicKey;
    title: string;
  };
}

/**
 * Custom hook to interact with the Solana program
 * Updated to use Civic Auth embedded wallets
 */
export const useWishProgram = () => {
  const { 
    publicKey, 
    connection, 
    hasWallet, 
    getAnchorProvider, 
    createWallet,
    retryWalletCreation
  } = useCivicWallet();
  
  // Ensure we always have a connection
  const devnetConnection = getDevnetConnection();
  const [wishes, setWishes] = useState<WishAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Use local storage for demo when blockchain isn't available
  const getMockWishes = (): WishAccount[] => {
    try {
      const storedWishes = localStorage.getItem(WISHES_STORAGE_KEY);
      if (storedWishes) {
        return JSON.parse(storedWishes).map((w: any) => ({
          ...w,
          publicKey: new PublicKey(w.publicKey),
          account: {
            ...w.account,
            user: new PublicKey(w.account.user)
          }
        }));
      }
      return [];
    } catch (e) {
      console.error('Error parsing stored wishes:', e);
      return [];
    }
  };

  const saveMockWishes = (wishList: WishAccount[]) => {
    try {
      const serialized = JSON.stringify(wishList.map(w => ({
        publicKey: w.publicKey.toString(),
        account: {
          user: w.account.user.toString(),
          title: w.account.title
        }
      })));
      localStorage.setItem(WISHES_STORAGE_KEY, serialized);
    } catch (e) {
      console.error('Error saving wishes:', e);
    }
  };

  // Function to fetch all wishes with retry logic
  const fetchWishes = useCallback(async () => {
    setLoading(true);
    
    try {
      // Set a timeout to prevent infinite loading state
      const loadingTimeout = setTimeout(() => {
        setLoading(false);
        console.warn("Fetch timeout reached, ending loading state");
      }, 15000); // 15 seconds max loading time
      
      // Try with retry logic for blockchain fetch
      try {
        await withRPC(async (connection) => {
          // Use the provided connection from the RPC manager
          
          // Create appropriate provider based on wallet status
          const provider = hasWallet && getAnchorProvider 
            ? getAnchorProvider()
            : new anchor.AnchorProvider(
                connection,
                // Mock wallet for read-only operations
                {
                  publicKey: PublicKey.default,
                  signTransaction: async () => { throw new Error('Wallet not connected'); },
                  signAllTransactions: async () => { throw new Error('Wallet not connected'); },
                },
                { commitment: 'processed' }
              );
          
          const program = new Program(IDL, new PublicKey(PROGRAM_ID), provider);
          
          // Use a more efficient query approach with filters when possible
          let wishAccounts;
          
          if (publicKey) {
            // When user is logged in, only fetch their wishes using a filter
            // This drastically reduces the amount of data requested
            console.log("Using filtered fetch for user:", publicKey.toString());
            
            wishAccounts = await program.account.aWish.all([
              {
                memcmp: {
                  offset: 8, // Skip the account discriminator
                  bytes: publicKey.toBase58()
                }
              }
            ]);
          } else {
            // Fallback to getting all wishes if no user is logged in
            // but limit the results to avoid excessive data transfer
            wishAccounts = await program.account.aWish.all();
          }
          
          // Map the returned accounts
          const formattedWishes = wishAccounts.map(item => ({
            publicKey: item.publicKey,
            account: {
              user: item.account.user,
              title: item.account.title
            }
          }));
          
          // Filter to only show wishes belonging to the current user
          const userWishes = publicKey 
            ? formattedWishes.filter(wish => 
                wish.account.user.toString() === publicKey.toString()
              )
            : formattedWishes;
            
          // Sort by publicKey to have a consistent order
          userWishes.sort((a, b) => 
            a.publicKey.toBase58().localeCompare(b.publicKey.toBase58())
          );
          
          console.log("Successfully fetched", userWishes.length, "wishes for current user");
          setWishes(userWishes);
          saveMockWishes(userWishes); // Cache for offline demo
          return userWishes;
        }, 3); // Try up to 3 times
      } catch (error) {
        console.warn("Blockchain fetch failed, falling back to mock data:", error);
        
        // Fallback to mock data when blockchain fails
        const mockWishes = getMockWishes();
        setWishes(mockWishes);
        
        if (mockWishes.length === 0) {
          // Create a friendly message if no wishes exist at all
          console.log("No wishes found in local storage");
        }
      }
      
      // Clear the timeout since we're done
      clearTimeout(loadingTimeout);
    } catch (error) {
      console.error("Error in fetchWishes:", error);
      toast.error("Failed to load wishes");
    } finally {
      // Ensure loading always gets set to false
      setLoading(false);
    }
  }, [connection, hasWallet, getAnchorProvider]);

  // Function to submit a wish with retry logic for rate limit handling
  const submitWish = useCallback(
    async (title: string): Promise<string> => {
      if (!hasWallet) {
        // Try to create a wallet if not available
        const created = await createWallet();
        if (!created) {
          throw new Error("Please connect your wallet to submit a wish");
        }
      }

      if (!publicKey) {
        throw new Error("Wallet public key not available");
      }

      try {
        // Get the provider for transaction signing
        const provider = getAnchorProvider();
        const program = new Program(IDL, new PublicKey(PROGRAM_ID), provider);
        
        // Use retry logic to handle rate limiting
        return await withRPC(async (connection) => {
          // Get PDA for the wish
          const [wishPDA] = await findWishPDA(publicKey, title);
          
          console.log("Submitting wish to program:", PROGRAM_ID);
          console.log("Using wallet:", publicKey.toString());
          console.log("PDA:", wishPDA.toString());
          
          // Force a small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Set up the transaction with explicit signers and confirmation strategy
          const tx = await program.methods
            .submitWish(title)
            .accounts({
              wish: wishPDA,
              user: publicKey,
              systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc({ 
              skipPreflight: false,
              commitment: 'confirmed'
            });
          
          console.log("Transaction submitted successfully:", tx);
          toast.success("Wish stored on the blockchain!");
          
          // Refresh wishes after submission with a small delay
          setTimeout(() => {
            fetchWishes().catch(e => console.error("Error refreshing wishes:", e));
          }, 2000);
          
          return tx;
        }, 3); // Try up to 3 times with our retry logic
      } catch (error) {
        console.error("Error submitting wish:", error);
        
        // Provide user-friendly error messages based on error type
        if (error instanceof Error) {
          console.error("Error details:", error.message);
          
          // Check for rate limit errors
          if (error.message.includes('429') || error.message.includes('Too many requests')) {
            toast.error("Rate limit exceeded", { 
              description: "The Solana network is busy right now. Please try again in a moment."
            });
          } else if (error.message.includes('blockhash')) {
            toast.error("Network timing error", { 
              description: "Failed to get a valid blockhash. Please try again."
            });
          } else {
            toast.error("Failed to submit wish", { 
              description: error.message || "An unknown error occurred"
            });
          }
          
          // Log transaction error details if available
          // @ts-ignore
          if (error.logs) {
            // @ts-ignore
            console.error("Transaction logs:", error.logs);
          }
        } else {
          toast.error("Failed to submit wish", { 
            description: "An unexpected error occurred"
          });
        }
        
        throw error;
      }
    },
    [connection, publicKey, hasWallet, createWallet, getAnchorProvider, fetchWishes]
  );

  // Function to delete a wish
  const deleteWish = useCallback(
    async (title: string, wishPublicKey: PublicKey): Promise<string> => {
      if (!hasWallet) {
        throw new Error("Wallet not connected");
      }

      if (!publicKey) {
        throw new Error("Wallet public key not available");
      }

      // Get the provider for transaction signing
      const provider = getAnchorProvider();
      
      const program = new Program(IDL, new PublicKey(PROGRAM_ID), provider);
      
      try {
        // Get PDA for the wish
        const [wishPDA] = await findWishPDA(publicKey, title);
        
        console.log("Deleting wish from program:", PROGRAM_ID);
        console.log("Using wallet:", publicKey.toString());
        console.log("PDA to delete:", wishPDA.toString());
        
        // Verify this wish belongs to the current user
        const wishData = wishes.find(w => w.publicKey.toString() === wishPublicKey.toString());
        if (!wishData || wishData.account.user.toString() !== publicKey.toString()) {
          throw new Error("You can only delete your own wishes");
        }
        
        // Set up the delete transaction
        const tx = await program.methods
          .deleteWish(title)
          .accounts({
            wish: wishPDA,
            user: publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc({ skipPreflight: false });
        
        console.log("Delete transaction submitted successfully:", tx);
        
        // Refresh wishes after deletion
        await fetchWishes();
        return tx;
      } catch (error) {
        console.error("Error deleting wish:", error);
        // More detailed error logging for debugging
        if (error instanceof Error) {
          console.error("Error details:", error.message);
          // @ts-ignore
          if (error.logs) {
            // @ts-ignore
            console.error("Transaction logs:", error.logs);
          }
        }
        throw error;
      }
    },
    [connection, publicKey, hasWallet, wishes, getAnchorProvider, fetchWishes]
  );

  // No automatic fetching - only fetch when the refresh button is clicked
  // This is intentionally left empty to prevent any automatic requests

  return { 
    submitWish, 
    deleteWish, 
    wishes, 
    loading, 
    fetchWishes,
    retryWalletCreation,
    connection: connection || getDevnetConnection()
  };
};
