const { accounts, wei } = require("../../scripts/utils/utils");
const {
  MINT_PERMISSION,
  BURN_PERMISSION,
  SPEND_PERMISSION,
  RECEIVE_PERMISSION,
  CHANGE_METADATA_PERMISSION,
  DefaultTERC20Params,
} = require("../utils/constants");

const Reverter = require("../helpers/reverter");
const truffleAssert = require("truffle-assertions");
const { assert } = require("chai");

const MasterContractsRegistry = artifacts.require("MasterContractsRegistry");
const MasterAccessManagement = artifacts.require("MasterAccessManagement");
const ReviewableRequests = artifacts.require("ReviewableRequests");
const TERC20 = artifacts.require("TERC20");

describe("TERC20", async () => {
  const reverter = new Reverter();

  let OWNER;
  let USER1;
  let USER2;
  let USER3;

  const TERC20Role = "TERC20";
  const TERC20Resource = "TERC20";

  const TERC20Mint = [TERC20Resource, [MINT_PERMISSION]];
  const TERC20Burn = [TERC20Resource, [BURN_PERMISSION]];
  const TERC20Spend = [TERC20Resource, [SPEND_PERMISSION]];
  const TERC20Receive = [TERC20Resource, [RECEIVE_PERMISSION]];
  const TERC20ChangeMetadata = [TERC20Resource, [CHANGE_METADATA_PERMISSION]];

  let registry;
  let masterAccess;
  let token;

  before("setup", async () => {
    OWNER = await accounts(0);
    USER1 = await accounts(1);
    USER2 = await accounts(2);
    USER3 = await accounts(3);

    registry = await MasterContractsRegistry.new();
    const _reviewableRequests = await ReviewableRequests.new();
    const _masterAccess = await MasterAccessManagement.new();

    await registry.__MasterContractsRegistry_init(_masterAccess.address);

    masterAccess = await MasterAccessManagement.at(await registry.getMasterAccessManagement());
    await masterAccess.__MasterAccessManagement_init(OWNER);

    await registry.addProxyContract(await registry.REVIEWABLE_REQUESTS_NAME(), _reviewableRequests.address);

    await registry.injectDependencies(await registry.REVIEWABLE_REQUESTS_NAME());

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  async function deployTERC20(params) {
    token = await TERC20.new();

    await token.__TERC20_init(params, TERC20Resource);

    await token.setDependencies(registry.address);
  }

  describe("access", () => {
    beforeEach("setup", async () => {
      await deployTERC20(DefaultTERC20Params);
    });

    it("should not initialize twice", async () => {
      await truffleAssert.reverts(
        token.__TERC20_init(DefaultTERC20Params, TERC20Resource),
        "Initializable: contract is already initialized"
      );
    });

    it("only injector should set dependencies", async () => {
      await truffleAssert.reverts(
        token.setDependencies(registry.address, { from: USER1 }),
        "Dependant: Not an injector"
      );
    });
  });

  describe("mintTo", () => {
    it("should be able to mint tokens", async () => {
      await deployTERC20(DefaultTERC20Params);

      await masterAccess.addPermissionsToRole(TERC20Role, [TERC20Mint, TERC20Receive], true);
      await masterAccess.grantRoles(USER1, [TERC20Role]);
      await masterAccess.grantRoles(USER2, [TERC20Role]);

      assert.equal(await token.balanceOf(USER2), "0");

      await token.mintTo(USER2, wei("100"), { from: USER1 });

      assert.equal(await token.balanceOf(USER2), wei("100"));
    });

    it("should be able to mint capped tokens", async () => {
      const tokenParams = {
        name: "name",
        symbol: "symbol",
        contractURI: "URI",
        decimals: 18,
        totalSupplyCap: wei("100"),
      };

      await deployTERC20(tokenParams);

      await masterAccess.addPermissionsToRole(TERC20Role, [TERC20Mint, TERC20Receive], true);
      await masterAccess.grantRoles(USER1, [TERC20Role]);
      await masterAccess.grantRoles(USER2, [TERC20Role]);

      assert.equal(await token.balanceOf(USER2), "0");

      await token.mintTo(USER2, wei("100"), { from: USER1 });

      assert.equal(await token.balanceOf(USER2), wei("100"));
    });

    it("should not exceed the cap", async () => {
      const tokenParams = {
        name: "name",
        symbol: "symbol",
        contractURI: "URI",
        decimals: 18,
        totalSupplyCap: wei("100"),
      };

      await deployTERC20(tokenParams);

      await masterAccess.addPermissionsToRole(TERC20Role, [TERC20Mint, TERC20Receive], true);
      await masterAccess.grantRoles(USER1, [TERC20Role]);
      await masterAccess.grantRoles(USER2, [TERC20Role]);

      await truffleAssert.reverts(token.mintTo(USER2, wei("1000"), { from: USER1 }), "TERC20: cap exceeded");
    });

    it("should not be able to mint tokens due to permissions (1)", async () => {
      await deployTERC20(DefaultTERC20Params);

      await masterAccess.addPermissionsToRole(TERC20Role, [TERC20Receive], true);
      await masterAccess.grantRoles(USER2, [TERC20Role]);

      await truffleAssert.reverts(token.mintTo(USER2, wei("100"), { from: USER1 }), "TERC20: access denied");
    });

    it("should not be able to mint tokens due to permissions (2)", async () => {
      await deployTERC20(DefaultTERC20Params);

      await masterAccess.addPermissionsToRole(TERC20Role, [TERC20Mint], true);
      await masterAccess.grantRoles(USER1, [TERC20Role]);

      await truffleAssert.reverts(token.mintTo(USER2, wei("100"), { from: USER1 }), "TERC20: access denied");
    });
  });

  describe("burnFrom", () => {
    it("should be able to burn tokens", async () => {
      await deployTERC20(DefaultTERC20Params);

      await masterAccess.addPermissionsToRole(TERC20Role, [TERC20Mint, TERC20Receive, TERC20Burn], true);
      await masterAccess.grantRoles(USER1, [TERC20Role]);
      await masterAccess.grantRoles(USER2, [TERC20Role]);

      await token.mintTo(USER2, wei("100"), { from: USER1 });
      await token.burnFrom(USER2, wei("100"), { from: USER2 });

      assert.equal(await token.balanceOf(USER2), "0");
    });

    it("should be able to burn approved tokens", async () => {
      await deployTERC20(DefaultTERC20Params);

      await masterAccess.addPermissionsToRole(TERC20Role, [TERC20Mint, TERC20Receive, TERC20Burn], true);
      await masterAccess.grantRoles(USER1, [TERC20Role]);
      await masterAccess.grantRoles(USER2, [TERC20Role]);

      await token.mintTo(USER2, wei("100"), { from: USER1 });

      await truffleAssert.reverts(token.burnFrom(USER2, wei("100"), { from: USER1 }), "ERC20: insufficient allowance");

      await token.approve(USER1, wei("100"), { from: USER2 });

      await token.burnFrom(USER2, wei("100"), { from: USER1 });

      assert.equal(await token.balanceOf(USER2), "0");
    });

    it("should not burn tokens due to the permissions (1)", async () => {
      await deployTERC20(DefaultTERC20Params);

      await masterAccess.addPermissionsToRole(TERC20Role, [TERC20Mint, TERC20Receive], true);
      await masterAccess.grantRoles(USER1, [TERC20Role]);
      await masterAccess.grantRoles(USER2, [TERC20Role]);

      await token.mintTo(USER2, wei("100"), { from: USER1 });

      await token.approve(USER1, wei("100"), { from: USER2 });

      await truffleAssert.reverts(token.burnFrom(USER2, wei("100"), { from: USER1 }), "TERC20: access denied");
      await truffleAssert.reverts(token.burnFrom(USER2, wei("100"), { from: USER2 }), "TERC20: access denied");
    });

    it("should not burn tokens due to the permissions (1)", async () => {
      await deployTERC20(DefaultTERC20Params);

      await masterAccess.addPermissionsToRole(TERC20Role, [TERC20Mint, TERC20Receive, TERC20Burn], true);
      await masterAccess.grantRoles(USER1, [TERC20Role]);
      await masterAccess.grantRoles(USER2, [TERC20Role]);

      await token.mintTo(USER2, wei("100"), { from: USER1 });

      await token.approve(USER1, wei("100"), { from: USER2 });

      await masterAccess.revokeRoles(USER2, [TERC20Role]);

      await truffleAssert.reverts(token.burnFrom(USER2, wei("100"), { from: USER1 }), "TERC20: access denied");
    });
  });

  describe("transfer", () => {
    it("should be able to transfer tokens", async () => {
      await deployTERC20(DefaultTERC20Params);

      await masterAccess.addPermissionsToRole(TERC20Role, [TERC20Mint, TERC20Receive, TERC20Spend], true);
      await masterAccess.grantRoles(USER1, [TERC20Role]);
      await masterAccess.grantRoles(USER2, [TERC20Role]);

      await token.mintTo(USER2, wei("100"), { from: USER1 });

      await token.transfer(USER1, wei("10"), { from: USER2 });

      assert.equal(await token.balanceOf(USER1), wei("10"));
    });

    it("should be able to transfer from tokens", async () => {
      await deployTERC20(DefaultTERC20Params);

      await masterAccess.addPermissionsToRole(TERC20Role, [TERC20Mint, TERC20Receive, TERC20Spend], true);
      await masterAccess.grantRoles(USER1, [TERC20Role]);
      await masterAccess.grantRoles(USER2, [TERC20Role]);

      await token.mintTo(USER2, wei("100"), { from: USER1 });

      await token.approve(USER3, wei("20"), { from: USER2 });

      await token.transferFrom(USER2, USER1, wei("20"), { from: USER3 });

      assert.equal(await token.balanceOf(USER1), wei("20"));
    });

    it("should not transfer tokens due to permissions", async () => {
      await deployTERC20(DefaultTERC20Params);

      await masterAccess.addPermissionsToRole(TERC20Role, [TERC20Mint, TERC20Receive, TERC20Spend], true);
      await masterAccess.grantRoles(USER1, [TERC20Role]);
      await masterAccess.grantRoles(USER2, [TERC20Role]);

      await token.mintTo(USER2, wei("100"), { from: USER1 });

      await masterAccess.revokeRoles(USER2, [TERC20Role]);

      await truffleAssert.reverts(token.transfer(USER1, wei("10"), { from: USER2 }), "TERC20: access denied");

      await masterAccess.revokeRoles(USER1, [TERC20Role]);
      await masterAccess.grantRoles(USER2, [TERC20Role]);

      await truffleAssert.reverts(token.transfer(USER1, wei("10"), { from: USER2 }), "TERC20: access denied");
    });

    it("should not transfer from due to permissions", async () => {
      await deployTERC20(DefaultTERC20Params);

      await masterAccess.addPermissionsToRole(TERC20Role, [TERC20Mint, TERC20Receive, TERC20Spend], true);
      await masterAccess.grantRoles(USER1, [TERC20Role]);
      await masterAccess.grantRoles(USER2, [TERC20Role]);

      await token.mintTo(USER2, wei("100"), { from: USER1 });

      await token.approve(USER3, wei("20"), { from: USER2 });

      await masterAccess.revokeRoles(USER2, [TERC20Role]);

      await truffleAssert.reverts(
        token.transferFrom(USER2, USER1, wei("20"), { from: USER3 }),
        "TERC20: access denied"
      );

      await masterAccess.revokeRoles(USER1, [TERC20Role]);
      await masterAccess.grantRoles(USER2, [TERC20Role]);

      await truffleAssert.reverts(
        token.transferFrom(USER2, USER1, wei("20"), { from: USER3 }),
        "TERC20: access denied"
      );
    });
  });

  describe("setContractMetadata", () => {
    it("should set new metadata", async () => {
      await deployTERC20(DefaultTERC20Params);

      await masterAccess.addPermissionsToRole(TERC20Role, [TERC20ChangeMetadata], true);
      await masterAccess.grantRoles(USER1, [TERC20Role]);

      assert.equal(await token.contractURI(), DefaultTERC20Params.contractURI);

      await token.setContractMetadata("NEW_URI", { from: USER1 });

      assert.equal(await token.contractURI(), "NEW_URI");
    });

    it("should not set metadata due to permissions", async () => {
      await deployTERC20(DefaultTERC20Params);

      await truffleAssert.reverts(token.setContractMetadata("NEW_URI", { from: USER1 }), "TERC20: access denied");
    });
  });
});
