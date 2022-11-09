const { accounts } = require("../../scripts/utils/utils");
const {
  CREATE_PERMISSION,
  EXECUTE_PERMISSION,
  REVIEWABLE_REQUESTS_RESOURCE,
  TOKEN_FACTORY_RESOURCE,
  TOKEN_REGISTRY_DEP,
  TOKEN_FACTORY_DEP,
  DefaultTokenParams,
} = require("../utils/constants");

const Reverter = require("../helpers/reverter");
const truffleAssert = require("truffle-assertions");
const { assert } = require("chai");

const MasterContractsRegistry = artifacts.require("MasterContractsRegistry");
const MasterAccessManagement = artifacts.require("MasterAccessManagement");
const ReviewableRequests = artifacts.require("ReviewableRequests");
const TokenRegistry = artifacts.require("TokenRegistry");
const TokenFactory = artifacts.require("TokenFactory");
const TERC20 = artifacts.require("TERC20");

describe("TokenFactory", async () => {
  const reverter = new Reverter();

  let OWNER;
  let USER1;

  const ReviewableRequestsRole = "RR";
  const TokenFactoryRole = "TF";

  const ReviewableRequestsCreate = [REVIEWABLE_REQUESTS_RESOURCE, [CREATE_PERMISSION]];

  const TokenFactoryCreate = [TOKEN_FACTORY_RESOURCE, [CREATE_PERMISSION]];
  const TokenFactoryExecute = [TOKEN_FACTORY_RESOURCE, [EXECUTE_PERMISSION]];

  const description = "example.com";

  let registry;
  let masterAccess;
  let reviewableRequests;
  let tokenFactory;
  let tokenRegistry;

  before("setup", async () => {
    OWNER = await accounts(0);
    USER1 = await accounts(1);

    registry = await MasterContractsRegistry.new();
    const _masterAccess = await MasterAccessManagement.new();
    const _reviewableRequests = await ReviewableRequests.new();
    const _tokenRegistry = await TokenRegistry.new();
    const _tokenFactory = await TokenFactory.new();
    const _erc20 = await TERC20.new();

    await registry.__MasterContractsRegistry_init(_masterAccess.address);

    masterAccess = await MasterAccessManagement.at(await registry.getMasterAccessManagement());
    await masterAccess.__MasterAccessManagement_init(OWNER);

    await registry.addProxyContract(await registry.REVIEWABLE_REQUESTS_NAME(), _reviewableRequests.address);
    await registry.addProxyContract(TOKEN_REGISTRY_DEP, _tokenRegistry.address);
    await registry.addProxyContract(TOKEN_FACTORY_DEP, _tokenFactory.address);

    reviewableRequests = await ReviewableRequests.at(await registry.getReviewableRequests());
    tokenRegistry = await TokenRegistry.at(await registry.getContract(TOKEN_REGISTRY_DEP));
    tokenFactory = await TokenFactory.at(await registry.getContract(TOKEN_FACTORY_DEP));

    await registry.injectDependencies(await registry.REVIEWABLE_REQUESTS_NAME());
    await registry.injectDependencies(TOKEN_REGISTRY_DEP);
    await registry.injectDependencies(TOKEN_FACTORY_DEP);

    await masterAccess.addPermissionsToRole(TokenFactoryRole, [TokenFactoryExecute], true);
    await masterAccess.grantRoles(reviewableRequests.address, [TokenFactoryRole]);

    await masterAccess.addPermissionsToRole(ReviewableRequestsRole, [ReviewableRequestsCreate], true);
    await masterAccess.grantRoles(tokenFactory.address, [ReviewableRequestsRole]);

    await tokenRegistry.setNewImplementations([await tokenRegistry.TERC20_NAME()], [_erc20.address]);

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  describe("access", () => {
    it("only injector should set dependencies", async () => {
      await truffleAssert.reverts(tokenFactory.setDependencies(registry.address), "Dependant: Not an injector");
    });
  });

  describe("requestERC20", () => {
    it("should request ERC20 deployment", async () => {
      await masterAccess.addPermissionsToRole(TokenFactoryRole, [TokenFactoryCreate], true);
      await masterAccess.grantRoles(USER1, [TokenFactoryRole]);

      await tokenFactory.requestERC20(DefaultTokenParams, description, { from: USER1 });

      const request = await reviewableRequests.requests(0);

      assert.equal(request.creator, tokenFactory.address);
      assert.equal(request.executor, tokenFactory.address);
    });

    it("should not request ERC20 without permissions", async () => {
      await truffleAssert.reverts(
        tokenFactory.requestERC20(DefaultTokenParams, description, { from: USER1 }),
        "TokenFactory: access denied"
      );
    });
  });

  describe("deployERC20", () => {
    it("should deploy ERC20", async () => {
      await masterAccess.addPermissionsToRole(TokenFactoryRole, [TokenFactoryCreate], true);
      await masterAccess.grantRoles(USER1, [TokenFactoryRole]);

      await tokenFactory.requestERC20(DefaultTokenParams, description, { from: USER1 });

      await reviewableRequests.acceptRequest(0);

      const token = await TERC20.at((await tokenRegistry.listPools(await tokenRegistry.TERC20_NAME(), 0, 1))[0]);

      assert.equal(await token.decimals(), "18");
      assert.equal(await token.uri(), "URI");
      assert.equal(await token.TERC20_RESOURCE(), `TERC20:${token.address.toLowerCase()}`);

      await truffleAssert.reverts(token.mint(OWNER, 1, { from: USER1 }), "TERC20: access denied");
    });

    it("should deploy 2 ERC20", async () => {
      await masterAccess.addPermissionsToRole(TokenFactoryRole, [TokenFactoryCreate], true);
      await masterAccess.grantRoles(USER1, [TokenFactoryRole]);

      await tokenFactory.requestERC20(DefaultTokenParams, description, { from: USER1 });
      await tokenFactory.requestERC20(DefaultTokenParams, description, { from: USER1 });

      await reviewableRequests.acceptRequest(0);
      await reviewableRequests.acceptRequest(1);

      const token1 = await TERC20.at((await tokenRegistry.listPools(await tokenRegistry.TERC20_NAME(), 0, 1))[0]);
      const token2 = await TERC20.at((await tokenRegistry.listPools(await tokenRegistry.TERC20_NAME(), 1, 1))[0]);

      assert.equal(await token1.TERC20_RESOURCE(), `TERC20:${token1.address.toLowerCase()}`);
      assert.equal(await token2.TERC20_RESOURCE(), `TERC20:${token2.address.toLowerCase()}`);
    });

    it("should not deploy ERC20", async () => {
      await masterAccess.addPermissionsToRole(TokenFactoryRole, [TokenFactoryCreate], true);
      await masterAccess.grantRoles(USER1, [TokenFactoryRole]);

      await tokenFactory.requestERC20(DefaultTokenParams, description, { from: USER1 });

      await truffleAssert.passes(reviewableRequests.rejectRequest(0), "pass");
    });

    it("should not deploy ERC20 due to permissions", async () => {
      await truffleAssert.reverts(
        tokenFactory.deployERC20(DefaultTokenParams, { from: USER1 }),
        "TokenFactory: access denied"
      );
    });
  });
});
