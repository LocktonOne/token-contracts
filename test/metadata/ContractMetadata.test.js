const Reverter = require("../helpers/reverter");
const truffleAssert = require("truffle-assertions");
const { assert } = require("chai");

const ContractMetadata = artifacts.require("ContractMetadataMock");

describe("ContractMetadata", () => {
  const reverter = new Reverter();

  let contractMetadata;

  before("setup", async () => {
    contractMetadata = await ContractMetadata.new();

    await reverter.snapshot();
  });

  afterEach("revert", reverter.revert);

  describe("access", () => {
    it("should not initialize", async () => {
      await truffleAssert.reverts(contractMetadata.init(""), "Initializable: contract is not initializing");
    });
  });

  describe("setContractMetadata", () => {
    it("should set contract metadata", async () => {
      await contractMetadata.setContractMetadata("METADATA");

      assert.equal(await contractMetadata.contractURI(), "METADATA");
    });
  });
});
