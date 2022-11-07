import { count } from "console";
import {
  createAccount,
  createToken,
  getStateOfProofNft,
  mintToken,
} from "./create-token";
import fs from "fs";

export async function processMintToken({
  network,
  tokenName,
  tokenSymbol,
  count = 1,
  output,
}: {
  network: string;
  tokenName: string;
  tokenSymbol: string;
  count: number;
  output: string;
}) {
  const { privateKey, treasuryId } = await createAccount(network);
  if (treasuryId && privateKey) {
    const tokenId = await createToken(
      network,
      treasuryId,
      privateKey,
      tokenName,
      tokenSymbol
    );
    if (tokenId) {
      for await (const i of new Array(count).fill(count)) {
        await mintToken(network, tokenId, treasuryId, privateKey);
      }
      const data = await getStateOfProofNft(network, tokenId, treasuryId);
      const finalCSV = data.map(
        (x: any) =>
          `mint_token,Mint of token for Project ${process.env.PROJECT_NAME},${x.accountId},${x.tokenId},${x.serialNumber},${x.carbonValue},${x.createdDate},${process.env.PROJECT_NAME},${process.env.PROJECT_DESCRIPTION},${x.stateProof}`
      );
      fs.writeFileSync(
        output,
        [
          "stage,description,account_id,token_id,serial_number,carbon_value,creation_date,project_name,project_description,state_proof",
          ...finalCSV,
        ].join("\n")
      );
    }
  }

  process.exit(0);
}
