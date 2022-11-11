const { logTransaction } = require("../runners/logger/logger");
const { TOKEN_REGISTRY_DEP } = require("./utils/constants");

const Registry = artifacts.require("MasterContractsRegistry");
const TokenRegistry = artifacts.require("TokenRegistry");
const TERC20 = artifacts.require("TERC20");

module.exports = async (deployer) => {
  const registry = await Registry.at(process.env.MASTER_CONTRACTS_REGISTRY);

  const tokenRegistry = await TokenRegistry.at(await registry.getContract(TOKEN_REGISTRY_DEP));

  const terc20 = await deployer.deploy(TERC20);

  logTransaction(
    await tokenRegistry.setNewImplementations([await tokenRegistry.TERC20_NAME()], [terc20.address]),
    `Set TERC20 implementation`
  );
};
