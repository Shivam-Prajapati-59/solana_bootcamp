use anchor_lang::prelude::*;

declare_id!("5hLo9VzZ4uwDLm4ydjBdbFiMAuPE6hdPu6MjMbRGb1NA");

#[program]
pub mod anchor {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
