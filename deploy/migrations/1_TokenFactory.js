const { logTransaction } = require("../runners/logger/logger");
const { TOKEN_FACTORY_DEP } = require("./utils/constants");

const Registry = artifacts.require("MasterContractsRegistry");
const TokenFactory = artifacts.require("TokenFactory");

module.exports = async (deployer) => {
  const registry = await Registry.at(process.env.MASTER_CONTRACTS_REGISTRY);

  const tokenFactory = await deployer.deploy(TokenFactory);

  logTransaction(await registry.addProxyContract(TOKEN_FACTORY_DEP, tokenFactory.address), "Deploy TokenFactory");
};
