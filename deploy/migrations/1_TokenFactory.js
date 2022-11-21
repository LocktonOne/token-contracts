const { getConfigJson } = require("../config/config-getter");
const { logTransaction } = require("../runners/logger/logger");
const { TOKEN_FACTORY_DEP } = require("./utils/constants");

const Registry = artifacts.require("MasterContractsRegistry");
const TokenFactory = artifacts.require("TokenFactory");

module.exports = async (deployer) => {
  const config = await getConfigJson();

  if (config.MasterContractsRegistry == undefined) {
    throw new Error(`invalid config fetched`);
  }

  deployer.masterContractsRegistry = config.MasterContractsRegistry;

  const registry = await Registry.at(deployer.masterContractsRegistry);

  const tokenFactory = await deployer.deploy(TokenFactory);

  logTransaction(await registry.addProxyContract(TOKEN_FACTORY_DEP, tokenFactory.address), "Deploy TokenFactory");
};
