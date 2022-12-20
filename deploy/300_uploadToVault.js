const { getConfigJson } = require("./config/config-parser");
const { TOKEN_FACTORY_DEP } = require("./utils/constants");

const vault = require("node-vault")({
  apiVersion: "v1",
  endpoint: process.env.VAULT_ENDPOINT,
  token: process.env.VAULT_TOKEN,
});

const Registry = artifacts.require("MasterContractsRegistry");

module.exports = async (deployer) => {
  const registry = await Registry.at(deployer.masterContractsRegistry);
  const tokenFactory = await registry.getContract(TOKEN_FACTORY_DEP);

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

  await vault.write(process.env.VAULT_UPLOAD_CONFIG_PATH, { data: config });
};
