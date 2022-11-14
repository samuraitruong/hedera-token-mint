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
  const projectNames = process.env.PROJECT_NAME?.split(",") || [];
  const projectDescription = process.env.PROJECT_DESCRIPTION?.split(",") || [];
  if (treasuryId && privateKey) {
    const lines: string[] = [];
    let index = 0;
    for await (const projectName of projectNames) {
      const tokenId = await createToken(
        network,
        treasuryId,
        privateKey,
        tokenName,
        tokenSymbol
      );
      if (tokenId) {
        for await (const i of new Array(count).fill(count)) {
          await mintToken(network, tokenId, treasuryId, privateKey, {
            project: projectName,
          });
        }
        const data = await getStateOfProofNft(
          network,
          tokenId,
          treasuryId,
          count
        );
        data.forEach((x: any) =>
          lines.push(
            `mint_token,Mint of token for Project ${projectName},${x.accountId},${x.tokenId},${x.serialNumber},${x.carbonValue},${x.timestamp},${x.createdDate},${projectName},${projectDescription[index]},${process.env.EXTERNAL_URL}${x.transactionId},${x.stateProofUrl}`
          )
        );
      }
      index++;
    }
    fs.writeFileSync(
      output,
      [
        "stage,description,account_id,token_id,serial_number,carbon_value,consensus_timestamp,iso_timestamp,project_name,project_description,hyperlink,state_proof",
        ...lines,
      ].join("\n")
    );
  }

  process.exit(0);
}
