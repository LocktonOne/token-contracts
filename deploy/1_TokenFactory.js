const { logTransaction } = require("@dlsl/hardhat-migrate");
const { getConfigJson } = require("./config/config-getter");
const { TOKEN_FACTORY_DEP } = require("./utils/constants");

const Registry = artifacts.require("MasterContractsRegistry");
const TokenFactory = artifacts.require("TokenFactory");

module.exports = async (deployer) => {
  const config = await getConfigJson();

  if (config.addresses == undefined || config.addresses.MasterContractsRegistry == undefined) {
    throw new Error(`invalid config fetched`);
  }

  deployer.masterContractsRegistry = config.addresses.MasterContractsRegistry;
  deployer.startMigrationsBlock = await web3.eth.getBlockNumber();

  const registry = await Registry.at(deployer.masterContractsRegistry);

  const tokenFactory = await deployer.deploy(TokenFactory);

  logTransaction(await registry.addProxyContract(TOKEN_FACTORY_DEP, tokenFactory.address), "Deploy TokenFactory");
};
