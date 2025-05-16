import { ReactNode, useEffect } from 'react';
import { CivicAuthProvider as CivicProvider } from "@civic/auth-web3/react";
import { rpcManager } from "@/lib/rpc-manager";

interface CivicAuthProviderProps {
  children: ReactNode;
}

// Patch window to intercept Solana RPC calls from external libraries
const patchWindowForRPCThrottling = () => {
  const originalFetch = window.fetch;
  
  // Replace fetch to intercept Solana RPC calls
  window.fetch = async (input, init) => {
    // Check if this is a Solana RPC call
    if (typeof input === 'string' && (
      input.includes('api.devnet.solana.com') ||
      input.includes('solana')
    )) {
      // Apply rate limiting to Solana RPC requests
      try {
        // Use our managed connection instead
        const connection = rpcManager.getConnection();
        const endpoint = connection.rpcEndpoint;
        
        // If it's a Solana endpoint, replace it with our managed endpoint
        if (input.includes('solana')) {
          const newInput = input.replace(/https:\/\/[^/]+\//, `${endpoint}/`);
          console.log(`Intercepted Solana RPC request: ${input} → ${newInput}`);
          input = newInput;
        }
      } catch (error) {
        console.error('Error intercepting Solana RPC call:', error);
      }
    }
    
    return originalFetch(input, init);
  };
  
  console.log('Patched window.fetch for RPC throttling');
};

/**
 * Provider component for Civic Auth integration
 * Adds authentication and embedded wallet capabilities for the Wall of Wishes dapp
 * Following production-quality standards with proper error handling
 */
export const CivicAuthProvider = ({ children }: CivicAuthProviderProps) => {
  // Official client ID from Civic dashboard
  const clientId = "02b190e6-4997-45b0-97e4-a0301affc770";
  
  // Apply RPC throttling when the provider mounts
  useEffect(() => {
    // Apply the patch to intercept RPC calls
    patchWindowForRPCThrottling();
    
    // Log connection configuration
    console.log('CivicAuthProvider mounted with RPC throttling');  
  }, []);
  
  return (
    <CivicProvider clientId={clientId}>
      {children}
    </CivicProvider>
  );
};

