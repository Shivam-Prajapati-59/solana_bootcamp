declare module "spl-token-bankrun" {
  import { PublicKey, Keypair } from "@solana/web3.js";
  import { BanksClient } from "solana-bankrun";

  /**
   * Creates a new mint account
   * @param banksClient - The BanksClient instance
   * @param payer - The keypair that will pay for the transaction
   * @param mintAuthority - The public key that will have mint authority
   * @param freezeAuthority - The public key that will have freeze authority (or null)
   * @param decimals - The number of decimals for the token
   * @returns The public key of the created mint
   */
  export function createMint(
    banksClient: BanksClient,
    payer: Keypair,
    mintAuthority: PublicKey,
    freezeAuthority: PublicKey | null,
    decimals: number,
  ): Promise<PublicKey>;

  /**
   * Mints tokens to a destination account
   * @param banksClient - The BanksClient instance
   * @param payer - The keypair that will pay for the transaction
   * @param mint - The mint public key
   * @param destination - The destination token account public key
   * @param authority - The mint authority keypair
   * @param amount - The amount of tokens to mint
   * @returns The transaction signature
   */
  export function mintTo(
    banksClient: BanksClient,
    payer: Keypair,
    mint: PublicKey,
    destination: PublicKey,
    authority: Keypair,
    amount: number | bigint,
  ): Promise<string>;
}
