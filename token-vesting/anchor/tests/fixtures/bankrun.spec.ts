import { Keypair, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { BanksClient, Clock, ProgramTestContext, startAnchor } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import IDL from "../../target/idl/vesting.json";
import { Program, BN } from "@coral-xyz/anchor";
import { Vesting } from "../../target/types/vesting";
import { createMint, mintTo } from "spl-token-bankrun";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { TOKEN_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { describe, it } from "node:test";

describe("Vesting Smart Contract", () => {
  const companyName = "Coral";
  let beneficiary: Keypair;
  let context: ProgramTestContext;
  let provider: BankrunProvider;
  let program: Program<Vesting>;
  let banksClient: BanksClient;
  let employer: Keypair;
  let mint: PublicKey;
  let beneficiaryProvider: BankrunProvider;
  let program2: Program<Vesting>;
  let vestingAccountKey: PublicKey;
  let treasuryTokenAccount: PublicKey;
  let employeeAccount: PublicKey;

  beforeAll(async () => {
    beneficiary = new anchor.web3.Keypair();

    context = await startAnchor(
      "",
      [{ name: "vesting", programId: new PublicKey(IDL.address) }],
      [
        {
          address: beneficiary.publicKey,
          info: {
            lamports: 1000000000,
            owner: anchor.web3.SystemProgram.programId,
            data: Buffer.alloc(0),
            executable: false,
          },
        },
      ],
    );

    provider = new BankrunProvider(context);
    anchor.setProvider(provider);
    program = new Program<Vesting>(IDL as Vesting, provider);
    banksClient = context.banksClient;

    employer = provider.wallet.payer;

    mint = await createMint(banksClient, employer, employer.publicKey, null, 2);

    beneficiaryProvider = new BankrunProvider(context);

    beneficiaryProvider.wallet = new NodeWallet(beneficiary);

    program2 = new Program<Vesting>(IDL as Vesting, beneficiaryProvider);

    [vestingAccountKey] = PublicKey.findProgramAddressSync([Buffer.from(companyName)], program.programId);

    [treasuryTokenAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("vesting_treasury"), Buffer.from(companyName)],
      program.programId,
    );

    [employeeAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("employee_vesting"), beneficiary.publicKey.toBuffer(), vestingAccountKey.toBuffer()],
      program.programId,
    );
  });

  it("Should create a Vesting Account", async () => {
    const tx = await program.methods
      .createVestingAccount(companyName)
      .accounts({
        signer: employer.publicKey,
        mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc({ commitment: "confirmed" });

    console.log("Create Vesting Account Tx:", tx);
    const vestingAccountData = await program.account.vestingAccount.fetch(vestingAccountKey, "confirmed");

    console.log("Vesting Account Data:", vestingAccountData, null, 2);
    console.log("Created Vesting Account: ", tx);
  });

  it("Should fund the Treasury Token Account", async () => {
    const amount = 10_000 * 10 ** 9;
    // Mint Transaction
    const minttx = await mintTo(banksClient, employer, mint, treasuryTokenAccount, employer, amount);

    console.log("Mint Treasury Token Account:", minttx);
  });

  it("Should create an Employee Vesting Account", async () => {
    // Set vesting times
    const now = Math.floor(Date.now() / 1000);
    const startTime = new BN(now);
    const endTime = new BN(now + 60 * 60 * 24 * 30); // 30 days from now
    const totalAmount = new BN(100);
    const cliffTime = new BN(now + 60 * 60 * 24 * 7); // 7 days from now

    const tx2 = await program.methods
      .createEmployeeVesting(startTime, endTime, totalAmount, cliffTime)
      .accounts({
        beneficiary: beneficiary.publicKey,
        vestingAccount: vestingAccountKey,
      })
      .rpc({
        commitment: "confirmed",
        skipPreflight: true,
      });

    console.log("Created Employee Vesting Account Tx:", tx2);
    console.log("Employee Account: ", employeeAccount.toBase58());
  });

  it("Should Claim Employee Vested Tokens", async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const currentClock = await banksClient.getClock();
    context.setClock(
      new Clock(
        currentClock.slot,
        currentClock.epochStartTimestamp,
        currentClock.epoch,
        currentClock.leaderScheduleEpoch,
        currentClock.unixTimestamp,
      ),
    );

    const tx3 = await program2.methods
      .claimTokens(companyName)
      .accounts({
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc({ commitment: "confirmed" });
    console.log("Claimed Vested Tokens Tx:", tx3);
  });
});
function beforeAll(arg0: () => Promise<void>) {
  throw new Error("Function not implemented.");
}
