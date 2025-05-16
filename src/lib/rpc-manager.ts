import { Connection, ConnectionConfig } from '@solana/web3.js';
import { toast } from 'sonner';

/**
 * RPC Manager to distribute Solana requests across multiple endpoints
 * with rate limit handling and fallback mechanisms.
 */
class RPCManager {
  // Available RPC endpoints with different providers
  private endpoints = [
    // Primary endpoints
    'https://api.devnet.solana.com',
    'https://devnet.genesysgo.net',
    'https://devnet.helius-rpc.com/?api-key=15319106-2924-418a-b5c7-1b57f75a86ae',
    // Additional backup endpoints
    'https://solana-devnet-rpc.publicnode.com',
    'https://devnet.solana-api.com'
  ];
  
  // Keep track of endpoint health and request counts
  private endpointStatus: {
    [key: string]: {
      consecutiveFailures: number;
      lastUsed: number;
      rateLimited: boolean;
      cooldownUntil: number;
    }
  } = {};
  
  // RPC request throttling state
  private lastRequestTime: number = 0;
  private requestQueue: number = 0;
  private MIN_REQUEST_INTERVAL = 100; // Min time between requests in ms
  
  // Connection objects cache
  private connections: Map<string, Connection> = new Map();
  
  constructor() {
    // Initialize endpoint status
    this.endpoints.forEach(endpoint => {
      this.endpointStatus[endpoint] = {
        consecutiveFailures: 0,
        lastUsed: 0,
        rateLimited: false,
        cooldownUntil: 0
      };
    });
    
    // Log the initialization
    console.log(`RPC Manager initialized with ${this.endpoints.length} endpoints`);
  }
  
  /**
   * Gets the best available RPC endpoint based on health and load
   */
  private getBestEndpoint(): string {
    const now = Date.now();
    
    // Filter out endpoints in cooldown
    const availableEndpoints = this.endpoints.filter(endpoint => {
      const status = this.endpointStatus[endpoint];
      return !status.rateLimited || status.cooldownUntil < now;
    });
    
    if (availableEndpoints.length === 0) {
      // If all endpoints are in cooldown, pick the one with the soonest cooldown end
      const nextAvailable = this.endpoints.sort((a, b) => 
        this.endpointStatus[a].cooldownUntil - this.endpointStatus[b].cooldownUntil
      )[0];
      
      // Reset its status so we can use it
      this.endpointStatus[nextAvailable].rateLimited = false;
      return nextAvailable;
    }
    
    // Sort by least recently used and lowest failure count
    const bestEndpoint = availableEndpoints.sort((a, b) => {
      // Prioritize endpoints with fewer failures
      const failureDiff = this.endpointStatus[a].consecutiveFailures - 
                          this.endpointStatus[b].consecutiveFailures;
      
      if (failureDiff !== 0) return failureDiff;
      
      // If failures are equal, use the least recently used
      return this.endpointStatus[a].lastUsed - this.endpointStatus[b].lastUsed;
    })[0];
    
    return bestEndpoint;
  }
  
  /**
   * Mark an endpoint as rate limited
   */
  private markRateLimited(endpoint: string): void {
    const status = this.endpointStatus[endpoint];
    status.rateLimited = true;
    status.consecutiveFailures++;
    
    // Exponential backoff for the cooldown period
    const cooldownTime = Math.min(30000, Math.pow(2, status.consecutiveFailures) * 1000);
    status.cooldownUntil = Date.now() + cooldownTime;
    
    console.warn(`Endpoint ${endpoint} rate limited. Cooling down for ${cooldownTime}ms`);
    
    // If all endpoints are rate limited, show a warning to the user
    if (this.endpoints.every(e => this.endpointStatus[e].rateLimited)) {
      toast.error("Network congestion detected", { 
        description: "All Solana endpoints are currently rate limited. Please try again later."
      });
    }
  }
  
  /**
   * Mark an endpoint as healthy after successful use
   */
  private markSuccess(endpoint: string): void {
    const status = this.endpointStatus[endpoint];
    status.consecutiveFailures = 0;
    status.lastUsed = Date.now();
    status.rateLimited = false;
  }
  
  /**
   * Gets a Solana Connection using the best available endpoint
   */
  public getConnection(config: ConnectionConfig = { commitment: 'confirmed' }): Connection {
    const endpoint = this.getBestEndpoint();
    this.endpointStatus[endpoint].lastUsed = Date.now();
    
    // Cache the connection objects to avoid creating too many
    const cacheKey = `${endpoint}-${config.commitment}`;
    if (!this.connections.has(cacheKey)) {
      this.connections.set(cacheKey, new Connection(endpoint, config));
    }
    
    return this.connections.get(cacheKey)!;
  }
  
  /**
   * Executes an RPC call with retry logic and rate limit handling
   */
  public async executeRpc<T>(
    operation: (connection: Connection) => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: any;
    let currentEndpoint: string = '';
    
    // Apply request throttling
    this.requestQueue++;
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL && this.requestQueue > 1) {
      // Delay to avoid hammering the RPC endpoint
      await new Promise(resolve => setTimeout(
        resolve, 
        this.MIN_REQUEST_INTERVAL - timeSinceLastRequest + (this.requestQueue * 50)
      ));
    }
    
    try {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        // Get the best endpoint for this attempt
        const connection = this.getConnection();
        currentEndpoint = connection.rpcEndpoint;
        
        try {
          this.lastRequestTime = Date.now();
          const result = await operation(connection);
          
          // Mark this endpoint as successful
          this.markSuccess(currentEndpoint);
          
          return result;
        } catch (error: any) {
          lastError = error;
          console.error(`RPC error (attempt ${attempt + 1}/${maxRetries}):`, error);
          
          // Handle rate limit errors
          if (error.message && (
              error.message.includes('429') || 
              error.message.includes('Too many requests') ||
              error.message.includes('rate limit') ||
              error.message.includes('block height based transactions') // Special case for some RPC providers
          )) {
            this.markRateLimited(currentEndpoint);
            
            // Add a delay between retries with exponential backoff
            const delay = Math.pow(2, attempt) * 500;
            await new Promise(resolve => setTimeout(resolve, delay));
            console.log(`Retrying after ${delay}ms delay...`);
            
            continue; // Try again with a different endpoint
          }
          
          // For other errors, just throw them
          throw error;
        }
      }
      
      throw lastError; // All retries failed
    } finally {
      this.requestQueue--;
    }
  }
}

// Create a singleton instance
export const rpcManager = new RPCManager();

// A helper function to execute an operation with our RPC manager
export const withRPC = async <T>(
  operation: (connection: Connection) => Promise<T>,
  maxRetries: number = 3
): Promise<T> => {
  return rpcManager.executeRpc(operation, maxRetries);
};

export default rpcManager;
