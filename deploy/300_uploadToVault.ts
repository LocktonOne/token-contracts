import { Deployer } from "@solarity/hardhat-migrate";

import { ApiResponseError } from "node-vault";

import { getConfigJsonFromVault } from "./config/config-getter";

import { TOKEN_FACTORY_DEP } from "./utils/constants";

import { MasterContractsRegistry__factory } from "@ethers-v6";

const vault = require("node-vault")({
  apiVersion: "v1",
  endpoint: process.env.VAULT_ENDPOINT,
  token: process.env.VAULT_TOKEN,
});

export = async (deployer: Deployer) => {
  let config = await getConfigJsonFromVault();

  const registry = await deployer.deployed(MasterContractsRegistry__factory, config.addresses.MasterContractsRegistry);

  const tokenFactory = await registry.getContract(TOKEN_FACTORY_DEP);

  const projectName = config.projectName;

  if (projectName == undefined) {
    throw new Error("uploadToVault: projectName is undefined");
  }

  config = {
    projectName: projectName,
    addresses: {
      TokenFactory: tokenFactory,
    },
  };

  try {
    await vault.write(process.env.VAULT_UPLOAD_CONFIG_PATH, { data: config });
  } catch (error) {
    if ((error as ApiResponseError).response) {
      console.log((error as ApiResponseError).response.body.errors);
    } else {
      console.log(error);
    }
  }
};
