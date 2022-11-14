import { Client } from "@hashgraph/sdk";
import axios from "axios";
export function getNetwork(network: string) {
  return network === "testnet"
    ? "https://testnet.mirrornode.hedera.com"
    : "https://mainnet-public.mirrornode.hedera.com";
}
export function getClient(
  network: string,
  accountId?: string,
  accountPk?: string
) {
  const operatorAccount = accountId || process.env.ACCOUNT_ID;

  const operatorPrivateKey = accountPk || process.env.PRIVATE_KEY;

  // Configure a testnet client with our Account ID & private key
  if (!operatorAccount || !operatorPrivateKey) {
    throw new Error(
      "Missing operatorAccount or OperatorPrivatekey, please update them in .env file"
    );
  }
  let client: Client | undefined = undefined;

  if (network === "testnet") {
    client = Client.forTestnet();
  }
  if (network === "mainnet") {
    client = Client.forTestnet();
  }
  if (client === undefined) {
    throw new Error("No network specified");
  }

  client.setOperator(operatorAccount, operatorPrivateKey);
  return client;
}

export async function queryApi(network: string, path: string, query: any = {}) {
  console.log("Query data", path, query);
  const host = getNetwork(network);
  const url = `${host}/${path}`;
  const { data } = await axios.get(url, { params: query });
  return data;
}
