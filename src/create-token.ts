import {
  AccountCreateTransaction,
  Hbar,
  TokenCreateTransaction,
  PrivateKey,
  AccountId,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
  TokenId,
} from "@hashgraph/sdk";
import { getClient, queryApi } from "./utils";
import fs from "fs";

export async function createAccount(network: string) {
  const client = getClient(network);
  const privateKey = await PrivateKey.generateED25519Async();
  const publicKey = privateKey.publicKey;

  console.log("Account Private Key", privateKey.toStringRaw());
  const response = await new AccountCreateTransaction()
    .setInitialBalance(new Hbar(100))
    .setKey(publicKey)
    .execute(client);

  const receipt = await response.getReceipt(client);

  const treasuryId = receipt.accountId;
  console.log("Account ID: ", treasuryId?.toString());
  return { privateKey, treasuryId };
}

export async function createToken(
  network: string,
  treasuryAccount: AccountId,
  pk: PrivateKey,
  tokenName: string,
  tokenSymbol: string
) {
  const operatorKey = PrivateKey.fromString(process.env.PRIVATE_KEY || "");

  //     //Create the transaction and freeze for manual signing
  const client = getClient(
    network,
    treasuryAccount.toString(),
    pk.toStringRaw()
  );
  const transaction = await new TokenCreateTransaction()
    .setTokenName(tokenName)
    .setTokenSymbol(tokenSymbol)
    .setTokenType(TokenType.NonFungibleUnique)
    .setSupplyType(TokenSupplyType.Finite)
    .setMaxSupply(100000)
    .setTreasuryAccountId(treasuryAccount)
    .setInitialSupply(0)
    .setDecimals(0)
    .setAutoRenewAccountId(treasuryAccount)
    .setAutoRenewPeriod(7000000)
    .setSupplyKey(pk)
    .setAdminKey(pk)
    .setKycKey(pk)
    .setWipeKey(pk)
    .setFreezeKey(pk)
    .setMaxTransactionFee(new Hbar(30)) //Change the default max transaction fee
    .freezeWith(client);

  //Sign the transaction with the token treasury account private key
  const signTx = await transaction.sign(pk);

  //Sign the transaction with the client operator private key and submit it to a Hedera network
  const txResponse = await signTx.execute(client);

  const receipt = await txResponse.getReceipt(client);

  //Get the token ID from the receipt
  const tokenId = receipt.tokenId;
  console.log("tokenId", tokenId?.toString());
  return tokenId;
}

export async function mintToken(
  network: string,
  tokenId: TokenId,
  treasuryAccount: AccountId,
  pk: PrivateKey
) {
  const client = getClient(
    network,
    treasuryAccount.toString(),
    pk.toStringRaw()
  );

  const supplyKey = pk || PrivateKey.fromString(process.env.PRIVATE_KEY || "");

  const cid = new Date().toISOString();

  // Mint new NFT
  let mintTx = await new TokenMintTransaction()
    .setTokenId(tokenId)
    .setTransactionMemo(cid)
    .setMetadata([Buffer.from(JSON.stringify({ carbon_value: 1, cid }))])
    .freezeWith(client);

  //Sign the transaction with the supply key
  let mintTxSign = await mintTx.sign(supplyKey);

  //Submit the transaction to a Hedera network
  let mintTxSubmit = await mintTxSign.execute(client);

  //Get the transaction receipt
  let mintRx = await mintTxSubmit.getReceipt(client);
  //Log the serial number
  console.log(
    `- Created NFT ${tokenId} with serial: ${mintRx.serials[0].low} \n`
  );
}

export async function getStateOfProofNft(
  network: string,
  tokenId: TokenId,
  treasuryId: AccountId
) {
  await new Promise((r) => setTimeout(r, 10000));
  //const client = getClient(network);
  const { nfts } = await queryApi(
    network,
    `api/v1/tokens/${tokenId.toString()}/nfts`
  );
  nfts.forEach((item: any) => {
    item.metadata = JSON.parse(Buffer.from(item.metadata, "base64").toString());
  });

  // console.log("NFT ", nfts);

  //   const nftInfos = await new TokenNftInfoQuery()
  //     .setNftId(new NftId(tokenId, 1))
  //     .execute(client);

  //   console.log(nftInfos);

  const data = await queryApi(network, "api/v1/transactions", {
    "account.id": treasuryId.toString(),
  });

  const finalData = [];

  for await (const tx of data.transactions.filter(
    (x: any) => x.name === "TOKENMINT"
  )) {
    const cid = Buffer.from(tx.memo_base64, "base64").toString();

    const nft = nfts.find((x: any) => x.metadata.cid === cid);

    const stateProof = await queryApi(
      network,
      `api/v1/transactions/${tx.transaction_id}/stateproof`
    );
    finalData.push({
      createdDate: nft.created_timestamp,
      accountId: nft.account_id,
      tokenId: nft.token_id,
      serialNumber: nft.serial_number,
      stateProof: Buffer.from(JSON.stringify(stateProof)).toString("base64"),
      carbonValue: nft.metadata.carbon_value,
    });
  }

  return finalData;
}
