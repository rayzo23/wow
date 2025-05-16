#!/bin/bash

# Build and deploy the Anchor program to Solana devnet

echo "Building the Anchor program..."
anchor build

echo "Deploying to Solana devnet..."
anchor deploy --provider.cluster devnet

echo "Deployment complete!"
echo "Make sure to update the program ID in your frontend code if it has changed."
echo "Check src/lib/anchor/idl.ts and update the PROGRAM_ID constant." 