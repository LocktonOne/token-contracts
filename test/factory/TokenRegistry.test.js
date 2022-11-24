const { accounts } = require("../../scripts/utils/utils");
const {
  CREATE_PERMISSION,
  TOKEN_REGISTRY_RESOURCE,
  TOKEN_REGISTRY_DEP,
  TOKEN_FACTORY_DEP,
} = require("../utils/constants");

const Reverter = require("../helpers/reverter");
const truffleAssert = require("truffle-assertions");
const { assert } = require("chai");

const MasterContractsRegistry = artifacts.require("MasterContractsRegistry");
const MasterAccessManagement = artifacts.require("MasterAccessManagement");
const TokenRegistry = artifacts.require("TokenRegistry");
const TERC20 = artifacts.require("TERC20");

describe("TokenRegistry", async () => {
  const reverter = new Reverter();

  let OWNER;
  let USER1;
  let FACTORY;

  const TokenRegistryRole = "TR";

  const TokenRegistryCreate = [TOKEN_REGISTRY_RESOURCE, [CREATE_PERMISSION]];

  let registry;
  let masterAccess;
  let tokenRegistry;
  let token;

  before("setup", async () => {
    OWNER = await accounts(0);
    USER1 = await accounts(1);
    FACTORY = await accounts(4);

    registry = await MasterContractsRegistry.new();
    const _masterAccess = await MasterAccessManagement.new();
    const _tokenRegistry = await TokenRegistry.new();
    token = await TERC20.new();

    await registry.__MasterContractsRegistry_init(_masterAccess.address);

    masterAccess = await MasterAccessManagement.at(await registry.getMasterAccessManagement());
    await masterAccess.__MasterAccessManagement_init(OWNER);

    await registry.addProxyContract(TOKEN_REGISTRY_DEP, _tokenRegistry.address);

    await registry.addContract(TOKEN_FACTORY_DEP, FACTORY);

    tokenRegistry = await TokenRegistry.at(await registry.getContract(TOKEN_REGISTRY_DEP));

    await registry.injectDependencies(TOKEN_REGISTRY_DEP);

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  describe("access", () => {
    it("only injector should set dependencies", async () => {
      await truffleAssert.reverts(tokenRegistry.setDependencies(registry.address), "Dependant: Not an injector");
    });
  });

  describe("setNewImplementations", () => {
    it("should set new implementations", async () => {
      const name = await tokenRegistry.TERC20_NAME();

      await masterAccess.addPermissionsToRole(TokenRegistryRole, [TokenRegistryCreate], true);
      await masterAccess.grantRoles(USER1, [TokenRegistryRole]);

      await truffleAssert.reverts(
        tokenRegistry.getImplementation(name),
        "PoolContractsRegistry: This mapping doesn't exist"
      );

      await tokenRegistry.setNewImplementations([name], [token.address], { from: USER1 });

      assert.equal(await tokenRegistry.getImplementation(name), token.address);
    });

    it("should not set new implementations due to permissions", async () => {
      const name = await tokenRegistry.TERC20_NAME();

      await truffleAssert.reverts(
        tokenRegistry.setNewImplementations([name], [token.address], { from: USER1 }),
        "TokenRegistry: access denied"
      );
    });
  });

  describe("addProxyPool", () => {
    it("should add proxy pool", async () => {
      const name = await tokenRegistry.TERC20_NAME();

      assert.deepEqual(await tokenRegistry.listPools(name, 0, 1), []);

      await tokenRegistry.addProxyPool(name, token.address, { from: FACTORY });

      assert.deepEqual(await tokenRegistry.listPools(name, 0, 1), [token.address]);
    });

    it("should not add proxy pool not from factory", async () => {
      const name = await tokenRegistry.TERC20_NAME();

      await truffleAssert.reverts(
        tokenRegistry.addProxyPool(name, token.address),
        "TokenRegistry: caller is not a factory"
      );
    });
  });

  describe("injectDependenciesToExistingPools", () => {
    it("should inject dependencies", async () => {
      const name = await tokenRegistry.TERC20_NAME();

      await masterAccess.addPermissionsToRole(TokenRegistryRole, [TokenRegistryCreate], true);
      await masterAccess.grantRoles(USER1, [TokenRegistryRole]);

      await tokenRegistry.addProxyPool(name, token.address, { from: FACTORY });

      await truffleAssert.passes(tokenRegistry.injectDependenciesToExistingPools(name, 0, 1, { from: USER1 }), "pass");
    });

    it("should not inject dependencies due to permissions", async () => {
      const name = await tokenRegistry.TERC20_NAME();

      await truffleAssert.reverts(
        tokenRegistry.injectDependenciesToExistingPools(name, 0, 1, { from: USER1 }),
        "TokenRegistry: access denied"
      );
    });
  });
});
