const { TOKEN_REGISTRY_DEP } = require("./utils/constants");

const Registry = artifacts.require("MasterContractsRegistry");
const TokenRegistry = artifacts.require("TokenRegistry");

module.exports = async (deployer, logger) => {
  const registry = await Registry.at(deployer.masterContractsRegistry);

  const tokenRegistry = await deployer.deploy(TokenRegistry);

  logger.logTransaction(
    await registry.addProxyContract(TOKEN_REGISTRY_DEP, tokenRegistry.address),
    "Deploy TokenRegistry"
  );
};
