#!/usr/bin/env node
import { config } from "dotenv";
import { hideBin } from "yargs/helpers";

config();

import yargs from "yargs";
import { processMintToken } from "./mint-token";

yargs(hideBin(process.argv))
  .command(
    "mint",
    false,
    (a) => {
      return a.options({
        network: {
          type: "string",
          requiresArg: false,

          choices: ["testnet", "mainnet"],
          default: "testnet",
          description: "type of networks to use",
        },
        count: {
          type: "number",
          requiresArg: false,
          default: 1,
          description: "Number of token to mint",
        },

        tokenName: {
          type: "string",
          requiresArg: false,
          default: "Test NFT",
          description: "Token name",
        },

        tokenSymbol: {
          type: "string",
          requiresArg: false,
          default: "test",
          description: "Number of token to mint",
        },
        output: {
          type: "string",
          requiresArg: false,
          default: "output.csv",
          description: "Number of token to mint",
        },
      });
    },
    async (args) => {
      await processMintToken(args);
    }
  )
  .command(
    "burn",
    false,
    (a) => {
      return a.demandOption("network", "network");
    },
    () => {
      console.log("burn");
    }
  )
  .parse();
