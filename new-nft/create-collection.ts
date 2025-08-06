import {
  createNft,
  fetchDigitalAsset,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";

import {
  airdropIfRequired,
  getExplorerLink,
  getKeypairFromFile,
} from "@solana-developers/helpers";

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";

import { Connection, LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js";
import {
  generateSigner,
  keypairIdentity,
  percentAmount,
} from "@metaplex-foundation/umi";

// Step 1: Setup connection and keypair
const connection = new Connection(clusterApiUrl("devnet"));
const user = await getKeypairFromFile();

await airdropIfRequired(
  connection,
  user.publicKey,
  1 * LAMPORTS_PER_SOL,
  0.5 * LAMPORTS_PER_SOL
);

console.log("✅ Loaded user", user.publicKey.toBase58());

// Step 2: Initialize Umi and identity
const umi = createUmi(connection.rpcEndpoint);
umi.use(mplTokenMetadata());

const umiUser = umi.eddsa.createKeypairFromSecretKey(user.secretKey);
umi.use(keypairIdentity(umiUser));

console.log("✅ Set up Umi instance for user");

// Step 3: Create NFT collection
const collectionMint = generateSigner(umi);
console.log(
  "🧾 Creating NFT collection with mint:",
  collectionMint.publicKey.toString()
);

try {
  const { signature } = await createNft(umi, {
    mint: collectionMint,
    name: "My Collection",
    symbol: "MC",
    uri: "https://raw.githubusercontent.com/solana-developers/professional-education/main/labs/sample-nft-collection-offchain-data.json",
    sellerFeeBasisPoints: percentAmount(0),
    isCollection: true,
  }).sendAndConfirm(umi);

  console.log("✅ Transaction confirmed with signature:", signature);

  // Optional: Verify mint account exists
  // Optional: Log mint account address
  console.log(
    "✅ Mint account created at:",
    collectionMint.publicKey.toString()
  );
  // Step 4: Fetch the created NFT metadata
  const createdCollectionNft = await fetchDigitalAsset(
    umi,
    collectionMint.publicKey
  );

  console.log(
    `🎉 Created Collection NFT! View on Explorer: ${getExplorerLink(
      "address",
      createdCollectionNft.mint.publicKey,
      "devnet"
    )}`
  );
} catch (error) {
  console.error("❌ Error creating NFT collection:", error);
}
