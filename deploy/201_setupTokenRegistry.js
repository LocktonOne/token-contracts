const { logTransaction } = require("@dlsl/hardhat-migrate");
const { TOKEN_REGISTRY_DEP } = require("./utils/constants");

const Registry = artifacts.require("MasterContractsRegistry");
const TokenRegistry = artifacts.require("TokenRegistry");
const TERC20 = artifacts.require("TERC20");
const TERC721 = artifacts.require("TERC721");

module.exports = async (deployer) => {
  const registry = await Registry.at(deployer.masterContractsRegistry);

  const tokenRegistry = await TokenRegistry.at(await registry.getContract(TOKEN_REGISTRY_DEP));

  const terc20 = await deployer.deploy(TERC20);
  const terc721 = await deployer.deploy(TERC721);

  logTransaction(
    await tokenRegistry.setNewImplementations(
      [await tokenRegistry.TERC20_NAME(), await tokenRegistry.TERC721_NAME()],
      [terc20.address, terc721.address]
    ),
    `Set token implementations`
  );
};
