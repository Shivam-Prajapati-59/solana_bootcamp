import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { TokenLottery } from '../target/types/token_lottery'

describe('tokenLottery', () => {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  const wallet = provider.wallet as anchor.Wallet

  const program = anchor.workspace.TokenLottery as Program<TokenLottery>

  it('should init config', async () => {
    // Derive the PDA to check if it exists
    const [tokenLotteryPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('token_lottery')],
      program.programId,
    )

    // Check if the account already exists
    const accountInfo = await provider.connection.getAccountInfo(tokenLotteryPda)

    if (accountInfo) {
      console.log('Token lottery account already initialized at:', tokenLotteryPda.toBase58())
      console.log('Skipping initialization...')
      return
    }

    // Build the instruction - Anchor will auto-resolve the PDA accounts
    const initConfigTx = await program.methods
      .initializeConfig(
        new anchor.BN(0), // start time
        new anchor.BN(1861206985), // end time
        new anchor.BN(10000), // ticket price
      )
      .instruction()

    const BlockhashwithContext = await provider.connection.getLatestBlockhash()
    const tx = new anchor.web3.Transaction({
      feePayer: wallet.publicKey,
      blockhash: BlockhashwithContext.blockhash,
      lastValidBlockHeight: BlockhashwithContext.lastValidBlockHeight,
    }).add(initConfigTx)

    console.log('Your Transaction Signature', tx)

    try {
      const Signature = await anchor.web3.sendAndConfirmTransaction(provider.connection, tx, [wallet.payer], {
        skipPreflight: false, // Changed to false to see errors
      })
      console.log('Your Transaction Signature', Signature)
    } catch (error: any) {
      console.error('Transaction failed!')
      if (error.logs) {
        console.error('Transaction logs:', error.logs)
      }
      throw error
    }
  })
})
