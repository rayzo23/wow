// This file helps with Solana dApp deployment on Vercel
window.process = window.process || {};
window.process.env = window.process.env || {};
window.process.env.NODE_ENV = window.process.env.NODE_ENV || 'production';

// Check if wallet adapters are loaded
console.log('Vercel deployment helper loaded for Solana dApp');

// Workaround for browser compatibility
if (typeof window.Buffer === 'undefined') {
  window.Buffer = require('buffer/').Buffer;
}
