use anchor_lang::prelude::*;

declare_id!("HZSqkqsgtJkFLwgyFMQHHbFEsU9jPdGZgBTpbrVRwJ8U"); // Replace with your actual program ID

#[program]
pub mod wall_of_wish {
    use super::*;

    // Submit a wish (stored in a PDA)
    pub fn submit_wish(ctx: Context<SubmitWish>, title: String) -> Result<()> {
        let wish = &mut ctx.accounts.wish;
        wish.user = *ctx.accounts.user.key;
        wish.title = title;
        Ok(())
    }
    
    // Delete a wish from the blockchain
    pub fn delete_wish(ctx: Context<DeleteWish>, title: String) -> Result<()> {
        // No additional logic needed - the close constraint will handle account closing
        Ok(())
    }
}

// PDA Structure for individual wishes
#[derive(Accounts)]
#[instruction(title: String)]
pub struct SubmitWish<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 4 + title.len(), // 8 (discriminator) + 32 (user pubkey) + 4 (string length) + title bytes
        seeds = [b"wish", user.key().as_ref(), title.as_bytes()], // Unique PDA per wish
        bump
    )]
    pub wish: Account<'info, AWish>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[account]
pub struct AWish {
    pub user: Pubkey,  // User who submitted the wish
    pub title: String, // Wish content
} 

// Account structure for deleting wishes
#[derive(Accounts)]
#[instruction(title: String)]
pub struct DeleteWish<'info> {
    #[account(
        mut,
        seeds = [b"wish", user.key().as_ref(), title.as_bytes()],
        bump,
        close = user,  // This will close the account and return the rent to the user
        constraint = wish.user == *user.key @ ErrorCode::UnauthorizedDeletion
    )]
    pub wish: Account<'info, AWish>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

// Custom error codes for the program
#[error_code]
pub enum ErrorCode {
    #[msg("Only the wish creator can delete it")]
    UnauthorizedDeletion,
}