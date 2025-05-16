/**
 * Professional auth state management for Web3 dApps
 * Follows industry standards used by major dApps
 */

import { useEffect } from 'react';
import { toast } from 'sonner';

// Track auth state to prevent redundant operations
let authInProgress = false;
let authListenersInitialized = false;

/**
 * Updates the application state without page refresh
 * Used by high-quality Web3 dApps to handle auth state changes
 */
export const updateAuthState = async () => {
  // Notify any auth state subscribers that auth state has changed
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('CIVIC_AUTH_STATE_CHANGED');
    window.dispatchEvent(event);
  }
};

/**
 * Subscribe to auth state changes (React component hook)
 * @param callback Function to call when auth state changes
 */
export const useAuthStateChange = (callback: () => void) => {
  useEffect(() => {
    const handleAuthStateChange = () => {
      callback();
    };
    
    window.addEventListener('CIVIC_AUTH_STATE_CHANGED', handleAuthStateChange);
    
    return () => {
      window.removeEventListener('CIVIC_AUTH_STATE_CHANGED', handleAuthStateChange);
    };
  }, [callback]);
};

/**
 * Set up auth state change listener for non-component contexts
 */
export const listenForAuthChanges = (callback: () => void) => {
  if (typeof window === 'undefined') return () => {};
  
  const handleAuthChange = () => callback();
  window.addEventListener('CIVIC_AUTH_STATE_CHANGED', handleAuthChange);
  
  return () => {
    window.removeEventListener('CIVIC_AUTH_STATE_CHANGED', handleAuthChange);
  };
};

/**
 * Process a Google sign-in attempt
 * Handles cross-window communication for popup flows
 */
export const processSignIn = () => {
  if (authInProgress) return;
  authInProgress = true;
  
  // Set up auth listeners if not already done
  if (!authListenersInitialized) {
    initializeAuthListeners();
  }
  
  console.log('Auth initiated, added listeners for completion');
  
  // Reset auth flag after a timeout (safety mechanism)
  setTimeout(() => {
    authInProgress = false;
  }, 30000); // 30 seconds timeout
};

/**
 * Initialize auth event listeners
 * This sets up message listeners for popup window authentication
 */
export const initializeAuthListeners = () => {
  if (typeof window === 'undefined' || authListenersInitialized) return;
  
  // Set up event listener for auth completion messages from popup
  const handleAuthComplete = (event: MessageEvent) => {
    if (event.data && event.data.type === 'CIVIC_AUTH_COMPLETE') {
      console.log('Received auth completion message');
      authInProgress = false;
      
      // Update UI state without refresh
      setTimeout(() => {
        updateAuthState();
        toast.success('Successfully signed in');
      }, 500);
    }
  };
  
  window.addEventListener('message', handleAuthComplete);
  authListenersInitialized = true;
  
  // Handle the case where this is a popup window that needs to notify the opener
  if (window.opener && window.opener !== window) {
    // This means we're in a popup window, check for auth state
    const checkForAuthInPopup = () => {
      // Check if we have tokens in any storage
      const hasTokens = checkForAuthTokens();
      
      if (hasTokens) {
        try {
          // Notify the opener window that auth is complete
          window.opener.postMessage({ type: 'CIVIC_AUTH_COMPLETE' }, '*');
          setTimeout(() => window.close(), 1000);
        } catch (error) {
          console.error('Error communicating with parent window:', error);
        }
      }
    };
    
    // Check for auth immediately and then every second
    checkForAuthInPopup();
    const intervalId = setInterval(checkForAuthInPopup, 1000);
    
    // Clear interval after 10 seconds as a safety measure
    setTimeout(() => clearInterval(intervalId), 10000);
  }
};

/**
 * Check if auth tokens exist in any storage type
 */
export const checkForAuthTokens = () => {
  // 1. Check localStorage
  const hasLocalTokens = Object.keys(localStorage).some(key => 
    key.toLowerCase().includes('civic') || 
    key.toLowerCase().includes('jwt') || 
    key.toLowerCase().includes('token')
  );
  
  // 2. Check sessionStorage
  const hasSessionTokens = Object.keys(sessionStorage).some(key => 
    key.toLowerCase().includes('civic') || 
    key.toLowerCase().includes('jwt') || 
    key.toLowerCase().includes('token')
  );
  
  // 3. Check cookies
  const hasCookieTokens = document.cookie.split(';').some(cookie => 
    cookie.toLowerCase().includes('civic') || 
    cookie.toLowerCase().includes('jwt') || 
    cookie.toLowerCase().includes('token')
  );
  
  return hasLocalTokens || hasSessionTokens || hasCookieTokens;
};
