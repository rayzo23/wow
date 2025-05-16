import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { WallOfWish } from "../target/types/wall_of_wish";
import { expect } from "chai";

describe("wall-of-wish", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.WallOfWish as Program<WallOfWish>;
  const user = provider.wallet;

  it("Can submit a wish", async () => {
    // Data for our test
    const wishTitle = "I wish to learn Solana";
    
    // Find the PDA for this wish
    const [wishPDA, _] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("wish"),
        user.publicKey.toBuffer(),
        Buffer.from(wishTitle),
      ],
      program.programId
    );

    // Submit the wish
    await program.methods
      .submitWish(wishTitle)
      .accounts({
        wish: wishPDA,
        user: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Fetch the created wish account
    const wishAccount = await program.account.wish.fetch(wishPDA);
    
    // Verify the account data
    expect(wishAccount.title).to.equal(wishTitle);
    expect(wishAccount.user.toString()).to.equal(user.publicKey.toString());
  });
}); 