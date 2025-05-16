# Wall of Wish Solana Program

A Solana program built with Anchor to store wishes on-chain using Program Derived Addresses (PDAs).

## Structure

- `programs/wall-of-wish/src/lib.rs`: The Rust code for the Solana program
- `tests/wall-of-wish.ts`: Test script for the program
- `Anchor.toml`: Configuration for Anchor
- `deploy.sh`: Bash script to quickly deploy the program

## Prerequisites

1. Install Rust and Cargo: https://www.rust-lang.org/tools/install
2. Install Solana CLI: https://docs.solana.com/cli/install-solana-cli-tools
3. Install Anchor: `npm install -g @project-serum/anchor-cli`
4. Configure Solana for devnet: `solana config set --url devnet`
5. Create a keypair (if you don't have one): `solana-keygen new`
6. Airdrop some SOL to your account: `solana airdrop 2`

## Building and Deploying

1. Build the program:
   ```
   anchor build
   ```

2. Get your program ID:
   ```
   solana address -k ./target/deploy/wall_of_wish-keypair.json
   ```

3. Update the program ID in:
   - `programs/wall-of-wish/src/lib.rs` (in the `declare_id!` macro)
   - `Anchor.toml` (in the `[programs.devnet]` section)
   - Frontend code: `src/lib/anchor/idl.ts` (in the `PROGRAM_ID` constant)

4. Deploy to devnet:
   ```
   anchor deploy --provider.cluster devnet
   ```

## Testing

Run the tests with:
```
anchor test
```

## Program Details

This program allows users to:

1. Submit wishes that are stored as Program Derived Addresses (PDAs) on Solana
2. Each wish is a unique PDA derived from:
   - The string "wish"
   - The user's public key
   - The wish title text

The PDA structure contains:
- The user's public key (who submitted the wish)
- The wish title (content of the wish) 