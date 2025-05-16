/**
 * Helper functions for authentication and login flow
 */

/**
 * Force a UI refresh when authentication completes
 * This helps with the common issue of the UI not updating after Google login
 */
export const forceAuthStateRefresh = () => {
  // Store a flag in sessionStorage to indicate a refresh is needed
  sessionStorage.setItem('auth_refresh_needed', 'true');
  
  // Force refresh the page
  window.location.reload();
};

/**
 * Check if authentication refresh is needed and handle it
 * Call this on app initialization
 */
export const checkAndHandleAuthRefresh = () => {
  const needsRefresh = sessionStorage.getItem('auth_refresh_needed');
  
  if (needsRefresh === 'true') {
    // Clear the flag
    sessionStorage.removeItem('auth_refresh_needed');
    console.log('Handled auth refresh');
  }
  
  return needsRefresh === 'true';
};

/**
 * Set a timeout to check for authentication completion
 * This helps when the popup window communication fails
 */
export const startAuthTimeoutCheck = () => {
  let authCheckAttempts = 0;
  const maxAttempts = 10;
  const checkInterval = 2000; // Check every 2 seconds
  
  // Set a flag that we're waiting for auth
  sessionStorage.setItem('auth_check_in_progress', 'true');
  
  const checkForAuth = () => {
    // Check if any auth tokens exist in localStorage
    const hasTokens = Object.keys(localStorage).some(key => 
      key.toLowerCase().includes('civic') || 
      key.toLowerCase().includes('jwt') || 
      key.toLowerCase().includes('token')
    );
    
    if (hasTokens) {
      console.log('Auth tokens detected, refreshing UI...');
      sessionStorage.removeItem('auth_check_in_progress');
      forceAuthStateRefresh();
      return;
    }
    
    authCheckAttempts++;
    if (authCheckAttempts < maxAttempts) {
      setTimeout(checkForAuth, checkInterval);
    } else {
      console.log('Auth check timeout reached');
      sessionStorage.removeItem('auth_check_in_progress');
    }
  };
  
  // Start checking
  setTimeout(checkForAuth, checkInterval);
};

/**
 * Initialize the auth flow monitors
 */
export const initAuthHelpers = () => {
  // Check if we need to handle a refresh
  const justRefreshed = checkAndHandleAuthRefresh();
  
  if (!justRefreshed) {
    // Set up event listener for auth completion messages from popup
    const handleAuthComplete = (event: MessageEvent) => {
      if (event.data && event.data.type === 'CIVIC_AUTH_COMPLETE') {
        console.log('Received auth complete message from popup');
        forceAuthStateRefresh();
      }
    };
    
    window.addEventListener('message', handleAuthComplete);
    
    // Clean up function
    return () => {
      window.removeEventListener('message', handleAuthComplete);
    };
  }
};
