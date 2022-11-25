const { logTransaction } = require("@dlsl/hardhat-migrate");
const {
  REVIEWABLE_REQUESTS_CREATOR,
  TOKEN_FACTORY_EXECUTOR,
  REVIEWABLE_REQUESTS_RESOURCE,
  TOKEN_FACTORY_RESOURCE,
  CREATE_PERMISSION,
  EXECUTE_PERMISSION,
  TOKEN_FACTORY_DEP,
} = require("./utils/constants");

const Registry = artifacts.require("MasterContractsRegistry");
const MasterAccessManagement = artifacts.require("MasterAccessManagement");

module.exports = async (deployer) => {
  const registry = await Registry.at(deployer.masterContractsRegistry);
  const masterAccess = await MasterAccessManagement.at(await registry.getMasterAccessManagement());

  const reviewableRequestsAddress = await registry.getReviewableRequests();
  const tokenFactoryAddress = await registry.getContract(TOKEN_FACTORY_DEP);

  const TokenFactoryExecute = [TOKEN_FACTORY_RESOURCE, [EXECUTE_PERMISSION]];
  const ReviewableRequestsCreate = [REVIEWABLE_REQUESTS_RESOURCE, [CREATE_PERMISSION]];

  logTransaction(
    await masterAccess.addPermissionsToRole(TOKEN_FACTORY_EXECUTOR, [TokenFactoryExecute], true),
    `Added ${EXECUTE_PERMISSION} permission to ${TOKEN_FACTORY_EXECUTOR} role`
  );
  logTransaction(
    await masterAccess.addPermissionsToRole(REVIEWABLE_REQUESTS_CREATOR, [ReviewableRequestsCreate], true),
    `Added ${CREATE_PERMISSION} permission to ${REVIEWABLE_REQUESTS_CREATOR} role`
  );

  logTransaction(
    await masterAccess.grantRoles(reviewableRequestsAddress, [TOKEN_FACTORY_EXECUTOR]),
    `Granted ${TOKEN_FACTORY_EXECUTOR} role to ReviewableRequests contract`
  );
  logTransaction(
    await masterAccess.grantRoles(tokenFactoryAddress, [REVIEWABLE_REQUESTS_CREATOR]),
    `Granted ${REVIEWABLE_REQUESTS_CREATOR} role to TokenFactory contract`
  );
};
