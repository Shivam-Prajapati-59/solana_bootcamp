import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { TokenLottery } from '../target/types/token_lottery'
import { TOKEN_PROGRAM_ID } from '@coral-xyz/anchor/dist/cjs/utils/token'

describe('tokenLottery', () => {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  const wallet = provider.wallet as anchor.Wallet

  const program = anchor.workspace.TokenLottery as Program<TokenLottery>

  async function buyticket() {
    const buyticketsTx = await program.methods
      .buyTicket() // Fix: Changed from .buyticket() to .buyTicket() (camelCase)
      .accounts({
        tokenProgram: TOKEN_PROGRAM_ID, // Fix: Changed from token_programa to tokenProgram
      })
      .instruction()

    const computeTx = anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({
      units: 300000,
    })

    const priorityTx = anchor.web3.ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: 1,
    })

    const blockhashwithContext = await provider.connection.getLatestBlockhash()

    const tx = new anchor.web3.Transaction({
      feePayer: provider.wallet.publicKey,
      blockhash: blockhashwithContext.blockhash,
      lastValidBlockHeight: blockhashwithContext.lastValidBlockHeight,
    })
      .add(computeTx)
      .add(priorityTx)
      .add(buyticketsTx)

    const signature = await anchor.web3.sendAndConfirmTransaction(provider.connection, tx, [wallet.payer], {
      skipPreflight: false,
    })
    console.log('Buy Ticket Transaction Signature:', signature)
  }

  it('should test token Lottery', async () => {
    // Derive the PDA to check if it exists
    const [tokenLotteryPda] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from('lottery')], program.programId)

    // Check if the account already exists
    const accountInfo = await provider.connection.getAccountInfo(tokenLotteryPda)

    if (accountInfo) {
      console.log('Token lottery account already initialized at:', tokenLotteryPda.toBase58())
      console.log('Skipping initialization...')
      return
    }

    // Build the instruction - Anchor will auto-resolve the PDA accounts
    const initLotteryTx = await program.methods
      .initLottery(new anchor.BN(10000)) // Fix: Changed from initializeConfig to initLottery with ticket_price parameter
      .accounts({
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction()

    const BlockhashwithContext = await provider.connection.getLatestBlockhash()
    const tx = new anchor.web3.Transaction({
      feePayer: wallet.publicKey,
      blockhash: BlockhashwithContext.blockhash,
      lastValidBlockHeight: BlockhashwithContext.lastValidBlockHeight,
    }).add(initLotteryTx)

    try {
      // Send initialize lottery transaction
      const lotterySignature = await anchor.web3.sendAndConfirmTransaction(provider.connection, tx, [wallet.payer], {
        skipPreflight: false,
      })
      console.log('Initialize Lottery Transaction Signature:', lotterySignature)

      // Buy a ticket after initialization
      await buyticket()
    } catch (error: any) {
      console.error('Transaction failed!')
      if (error.logs) {
        console.error('Transaction logs:', error.logs)
      }
      throw error
    }
  })
})
