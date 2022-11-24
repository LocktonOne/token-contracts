const { logTransaction } = require("../runners/logger/logger");
const { TOKEN_FACTORY_DEP, TOKEN_REGISTRY_DEP } = require("./utils/constants");

const Registry = artifacts.require("MasterContractsRegistry");

module.exports = async (deployer) => {
  const registry = await Registry.at(deployer.masterContractsRegistry);

  logTransaction(await registry.injectDependencies(TOKEN_FACTORY_DEP), "Set dependencies at TokenFactory");
  logTransaction(await registry.injectDependencies(TOKEN_REGISTRY_DEP), "Set dependencies at TokenRegistry");
};
