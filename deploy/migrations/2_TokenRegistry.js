const { logTransaction } = require("../runners/logger/logger");
const { TOKEN_REGISTRY_DEP } = require("./utils/constants");

const Registry = artifacts.require("MasterContractsRegistry");
const TokenRegistry = artifacts.require("TokenRegistry");

module.exports = async (deployer) => {
  const registry = await Registry.at(process.env.MASTER_CONTRACTS_REGISTRY);

  const tokenRegistry = await deployer.deploy(TokenRegistry);

  logTransaction(await registry.addProxyContract(TOKEN_REGISTRY_DEP, tokenRegistry.address), "Deploy TokenRegistry");
};
