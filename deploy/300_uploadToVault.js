const { getConfigJson } = require("./config/config-getter");

const vault = require("node-vault")({
  apiVersion: "v1",
  endpoint: process.env.VAULT_ENDPOINT,
  token: process.env.VAULT_TOKEN,
});

const Registry = artifacts.require("MasterContractsRegistry");
const ERC1967Proxy = artifacts.require("ERC1967Proxy");

module.exports = async (deployer) => {
  const registry = await Registry.at((await ERC1967Proxy.deployed()).address);
  const tokenFactory = await registry.getTokenFactory();

  const projectName = getConfigJson().projectName;

  if (projectName == undefined) {
    throw new Error("uploadToVault: projectName is undefined");
  }

  const config = {
    projectName: projectName,
    addresses: {
      TokenFactory: tokenFactory,
    },
    startBlock: deployer.startMigrationsBlock,
  };

  await vault.write(process.env.VAULT_CONFIG_PATH, { data: config });
};
