const { accounts } = require("../../scripts/utils/utils");
const {
  MINT_PERMISSION,
  BURN_PERMISSION,
  SPEND_PERMISSION,
  RECEIVE_PERMISSION,
  CHANGE_METADATA_PERMISSION,
  DefaultTERC721Params,
} = require("../utils/constants");

const Reverter = require("../helpers/reverter");
const truffleAssert = require("truffle-assertions");
const { assert } = require("chai");

const MasterContractsRegistry = artifacts.require("MasterContractsRegistry");
const MasterAccessManagement = artifacts.require("MasterAccessManagement");
const ReviewableRequests = artifacts.require("ReviewableRequests");
const TERC721 = artifacts.require("TERC721");

describe("TERC721", async () => {
  const reverter = new Reverter();

  let OWNER;
  let USER1;
  let USER2;
  let USER3;

  const TERC721Role = "TERC721";
  const TERC721Resource = "TERC721";

  const TERC721Mint = [TERC721Resource, [MINT_PERMISSION]];
  const TERC721Burn = [TERC721Resource, [BURN_PERMISSION]];
  const TERC721Spend = [TERC721Resource, [SPEND_PERMISSION]];
  const TERC721Receive = [TERC721Resource, [RECEIVE_PERMISSION]];
  const TERC721ChangeMetadata = [TERC721Resource, [CHANGE_METADATA_PERMISSION]];

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

  async function deployTERC721(params) {
    token = await TERC721.new();

    await token.__TERC721_init(params, TERC721Resource);

    await token.setDependencies(registry.address, "0x");
  }

  describe("access", () => {
    beforeEach("setup", async () => {
      await deployTERC721(DefaultTERC721Params);
    });

    it("should not initialize twice", async () => {
      await truffleAssert.reverts(
        token.__TERC721_init(DefaultTERC721Params, TERC721Resource),
        "Initializable: contract is already initialized"
      );
    });

    it("only injector should set dependencies", async () => {
      await truffleAssert.reverts(
        token.setDependencies(registry.address, "0x", { from: USER1 }),
        "Dependant: not an injector"
      );
    });
  });

  describe("mintTo", () => {
    it("should be able to mint tokens", async () => {
      await deployTERC721(DefaultTERC721Params);

      await masterAccess.addPermissionsToRole(TERC721Role, [TERC721Mint, TERC721Receive], true);
      await masterAccess.grantRoles(USER1, [TERC721Role]);
      await masterAccess.grantRoles(USER2, [TERC721Role]);

      assert.equal(await token.balanceOf(USER2), "0");

      await token.mintTo(USER2, 1, "_1", { from: USER1 });

      assert.equal(await token.balanceOf(USER2), "1");
      assert.equal(await token.tokenOfOwnerByIndex(USER2, 0), "1");

      assert.equal(await token.tokenURI(1), "BASE_URI_1");
    });

    it("should be able to mint capped tokens", async () => {
      const tokenParams = {
        name: "name",
        symbol: "symbol",
        contractURI: "URI",
        baseURI: "",
        totalSupplyCap: 2,
      };

      await deployTERC721(tokenParams);

      await masterAccess.addPermissionsToRole(TERC721Role, [TERC721Mint, TERC721Receive], true);
      await masterAccess.grantRoles(USER1, [TERC721Role]);
      await masterAccess.grantRoles(USER2, [TERC721Role]);

      assert.equal(await token.balanceOf(USER2), "0");

      await token.mintTo(USER2, 1, "1", { from: USER1 });
      await token.mintTo(USER2, 3, "3", { from: USER1 });

      assert.equal(await token.balanceOf(USER2), 2);
      assert.equal(await token.tokenOfOwnerByIndex(USER2, 0), "1");
      assert.equal(await token.tokenOfOwnerByIndex(USER2, 1), "3");

      assert.equal(await token.tokenURI(1), "1");
      assert.equal(await token.tokenURI(3), "3");
    });

    it("should not exceed the cap", async () => {
      const tokenParams = {
        name: "name",
        symbol: "symbol",
        contractURI: "URI",
        baseURI: "",
        totalSupplyCap: 1,
      };

      await deployTERC721(tokenParams);

      await masterAccess.addPermissionsToRole(TERC721Role, [TERC721Mint, TERC721Receive], true);
      await masterAccess.grantRoles(USER1, [TERC721Role]);
      await masterAccess.grantRoles(USER2, [TERC721Role]);

      await token.mintTo(USER2, 2, "2", { from: USER1 });
      await truffleAssert.reverts(token.mintTo(USER2, 3, "3", { from: USER1 }), "TERC721: cap exceeded");
    });

    it("should not be able to mint tokens due to permissions (1)", async () => {
      await deployTERC721(DefaultTERC721Params);

      await masterAccess.addPermissionsToRole(TERC721Role, [TERC721Receive], true);
      await masterAccess.grantRoles(USER2, [TERC721Role]);

      await truffleAssert.reverts(token.mintTo(USER2, 1, "1", { from: USER1 }), "TERC721: access denied");
    });

    it("should not be able to mint tokens due to permissions (2)", async () => {
      await deployTERC721(DefaultTERC721Params);

      await masterAccess.addPermissionsToRole(TERC721Role, [TERC721Mint], true);
      await masterAccess.grantRoles(USER1, [TERC721Role]);

      await truffleAssert.reverts(token.mintTo(USER2, 1, "1", { from: USER1 }), "TERC721: access denied");
    });
  });

  describe("burnFrom", () => {
    it("should be able to burn tokens", async () => {
      await deployTERC721(DefaultTERC721Params);

      await masterAccess.addPermissionsToRole(TERC721Role, [TERC721Mint, TERC721Receive, TERC721Burn], true);
      await masterAccess.grantRoles(USER1, [TERC721Role]);
      await masterAccess.grantRoles(USER2, [TERC721Role]);

      await token.mintTo(USER2, 1, "1", { from: USER1 });
      await token.burnFrom(USER2, 1, { from: USER2 });

      assert.equal(await token.balanceOf(USER2), "0");

      await truffleAssert.reverts(token.tokenURI(1), "ERC721: invalid token ID");
    });

    it("should be able to burn approved token", async () => {
      await deployTERC721(DefaultTERC721Params);

      await masterAccess.addPermissionsToRole(TERC721Role, [TERC721Mint, TERC721Receive, TERC721Burn], true);
      await masterAccess.grantRoles(USER1, [TERC721Role]);
      await masterAccess.grantRoles(USER2, [TERC721Role]);

      await token.mintTo(USER2, 1, "1", { from: USER1 });

      await truffleAssert.reverts(token.burnFrom(USER2, 1, { from: USER1 }), "TERC721: not approved");

      await token.approve(USER1, 1, { from: USER2 });

      await token.burnFrom(USER2, 1, { from: USER1 });

      assert.equal(await token.balanceOf(USER2), "0");
    });

    it("should be able to burn approvedAll tokens", async () => {
      await deployTERC721(DefaultTERC721Params);

      await masterAccess.addPermissionsToRole(TERC721Role, [TERC721Mint, TERC721Receive, TERC721Burn], true);
      await masterAccess.grantRoles(USER1, [TERC721Role]);
      await masterAccess.grantRoles(USER2, [TERC721Role]);

      await token.mintTo(USER2, 1, "1", { from: USER1 });

      await truffleAssert.reverts(token.burnFrom(USER2, 1, { from: USER1 }), "TERC721: not approved");

      await token.setApprovalForAll(USER1, true, { from: USER2 });

      await token.burnFrom(USER2, 1, { from: USER1 });

      assert.equal(await token.balanceOf(USER2), "0");
    });

    it("should not burn tokens due to the permissions (1)", async () => {
      await deployTERC721(DefaultTERC721Params);

      await masterAccess.addPermissionsToRole(TERC721Role, [TERC721Mint, TERC721Receive], true);
      await masterAccess.grantRoles(USER1, [TERC721Role]);
      await masterAccess.grantRoles(USER2, [TERC721Role]);

      await token.mintTo(USER2, 1, "1", { from: USER1 });

      await token.approve(USER1, 1, { from: USER2 });

      await truffleAssert.reverts(token.burnFrom(USER2, 1, { from: USER1 }), "TERC721: access denied");
      await truffleAssert.reverts(token.burnFrom(USER2, 1, { from: USER2 }), "TERC721: access denied");
    });

    it("should not burn tokens due to the permissions (2)", async () => {
      await deployTERC721(DefaultTERC721Params);

      await masterAccess.addPermissionsToRole(TERC721Role, [TERC721Mint, TERC721Receive, TERC721Burn], true);
      await masterAccess.grantRoles(USER1, [TERC721Role]);
      await masterAccess.grantRoles(USER2, [TERC721Role]);

      await token.mintTo(USER2, 1, "1", { from: USER1 });

      await token.setApprovalForAll(USER1, true, { from: USER2 });

      await masterAccess.revokeRoles(USER2, [TERC721Role]);

      await truffleAssert.reverts(token.burnFrom(USER2, 1, { from: USER1 }), "TERC721: access denied");
    });
  });

  describe("transfer", () => {
    it("should be able to transfer tokens", async () => {
      await deployTERC721(DefaultTERC721Params);

      await masterAccess.addPermissionsToRole(TERC721Role, [TERC721Mint, TERC721Receive, TERC721Spend], true);
      await masterAccess.grantRoles(USER1, [TERC721Role]);
      await masterAccess.grantRoles(USER2, [TERC721Role]);

      await token.mintTo(USER2, 1, "1", { from: USER1 });

      await token.transferFrom(USER2, USER1, 1, { from: USER2 });

      assert.equal(await token.balanceOf(USER1), 1);
      assert.equal(await token.tokenOfOwnerByIndex(USER1, 0), "1");
    });

    it("should be able to transfer from tokens", async () => {
      await deployTERC721(DefaultTERC721Params);

      await masterAccess.addPermissionsToRole(TERC721Role, [TERC721Mint, TERC721Receive, TERC721Spend], true);
      await masterAccess.grantRoles(USER1, [TERC721Role]);
      await masterAccess.grantRoles(USER2, [TERC721Role]);

      await token.mintTo(USER2, 1, "1", { from: USER1 });

      await token.approve(USER3, 1, { from: USER2 });

      await token.transferFrom(USER2, USER1, 1, { from: USER3 });

      assert.equal(await token.balanceOf(USER1), 1);
      assert.equal(await token.tokenOfOwnerByIndex(USER1, 0), "1");
    });

    it("should not transfer tokens due to permissions (1)", async () => {
      await deployTERC721(DefaultTERC721Params);

      await masterAccess.addPermissionsToRole(TERC721Role, [TERC721Mint, TERC721Receive, TERC721Spend], true);
      await masterAccess.grantRoles(USER1, [TERC721Role]);
      await masterAccess.grantRoles(USER2, [TERC721Role]);

      await token.mintTo(USER2, 1, "1", { from: USER1 });

      await masterAccess.revokeRoles(USER2, [TERC721Role]);

      await truffleAssert.reverts(token.transferFrom(USER2, USER1, 1, { from: USER2 }), "TERC721: access denied");

      await masterAccess.revokeRoles(USER1, [TERC721Role]);
      await masterAccess.grantRoles(USER2, [TERC721Role]);

      await truffleAssert.reverts(token.transferFrom(USER2, USER1, 1, { from: USER2 }), "TERC721: access denied");
    });

    it("should not transfer from due to permissions (2)", async () => {
      await deployTERC721(DefaultTERC721Params);

      await masterAccess.addPermissionsToRole(TERC721Role, [TERC721Mint, TERC721Receive, TERC721Spend], true);
      await masterAccess.grantRoles(USER1, [TERC721Role]);
      await masterAccess.grantRoles(USER2, [TERC721Role]);

      await token.mintTo(USER2, 1, "1", { from: USER1 });

      await token.setApprovalForAll(USER3, true, { from: USER2 });

      await masterAccess.revokeRoles(USER2, [TERC721Role]);

      await truffleAssert.reverts(token.transferFrom(USER2, USER1, 1, { from: USER3 }), "TERC721: access denied");

      await masterAccess.revokeRoles(USER1, [TERC721Role]);
      await masterAccess.grantRoles(USER2, [TERC721Role]);

      await truffleAssert.reverts(token.transferFrom(USER2, USER1, 1, { from: USER3 }), "TERC721: access denied");
    });
  });

  describe("setContractMetadata", () => {
    it("should set new contract metadata", async () => {
      await deployTERC721(DefaultTERC721Params);

      await masterAccess.addPermissionsToRole(TERC721Role, [TERC721ChangeMetadata], true);
      await masterAccess.grantRoles(USER1, [TERC721Role]);

      assert.equal(await token.contractURI(), DefaultTERC721Params.contractURI);

      await token.setContractMetadata("NEW_URI", { from: USER1 });

      assert.equal(await token.contractURI(), "NEW_URI");
    });

    it("should not set contract metadata due to permissions", async () => {
      await deployTERC721(DefaultTERC721Params);

      await truffleAssert.reverts(token.setContractMetadata("NEW_URI", { from: USER1 }), "TERC721: access denied");
    });
  });

  describe("setBaseURI", () => {
    it("should set new base uri", async () => {
      await deployTERC721(DefaultTERC721Params);

      await masterAccess.addPermissionsToRole(TERC721Role, [TERC721ChangeMetadata], true);
      await masterAccess.grantRoles(USER1, [TERC721Role]);

      assert.equal(await token.baseURI(), DefaultTERC721Params.baseURI);

      await token.setBaseURI("NEW_BASE_URI", { from: USER1 });

      assert.equal(await token.baseURI(), "NEW_BASE_URI");
    });

    it("should not set base uri due to permissions", async () => {
      await deployTERC721(DefaultTERC721Params);

      await truffleAssert.reverts(token.setBaseURI("NEW_BASE_URI", { from: USER1 }), "TERC721: access denied");
    });
  });

  describe("setTokenURI", () => {
    beforeEach("setup", async () => {
      await deployTERC721(DefaultTERC721Params);

      await masterAccess.addPermissionsToRole(TERC721Role, [TERC721Mint, TERC721Receive], true);
      await masterAccess.grantRoles(USER1, [TERC721Role]);

      await token.mintTo(USER1, 1, "1", { from: USER1 });
    });

    it("should set new token uri", async () => {
      assert.equal(await token.tokenURI(1), "BASE_URI1");

      await masterAccess.addPermissionsToRole(TERC721Role, [TERC721ChangeMetadata], true);

      await token.setTokenURI(1, "_1", { from: USER1 });

      assert.equal(await token.tokenURI(1), "BASE_URI_1");
    });

    it("should not set token uri due to permissions", async () => {
      await truffleAssert.reverts(token.setTokenURI(1, "_1", { from: USER1 }), "TERC721: access denied");
    });
  });

  describe("supportsInterface", () => {
    it("should support interfaces", async () => {
      await deployTERC721(DefaultTERC721Params);

      assert.isTrue(await token.supportsInterface("0xa57a25b8"));
      assert.isTrue(await token.supportsInterface("0x780e9d63"));
    });
  });
});
