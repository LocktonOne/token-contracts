// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@dlsl/dev-modules/pool-contracts-registry/pool-factory/AbstractPoolFactory.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "@tokene/core-contracts/core/MasterContractsRegistry.sol";
import "@tokene/core-contracts/core/ReviewableRequests.sol";

import "../tokens/TERC20.sol";
import "./TokenRegistry.sol";

contract TokenFactory is AbstractPoolFactory {
    using Strings for uint256;

    string public constant CREATE_PERMISSION = "CREATE";
    string public constant EXECUTE_PERMISSION = "EXECUTE";

    string public constant TOKEN_FACTORY_RESOURCE = "TOKEN_FACTORY_RESOURCE";

    string public constant TOKEN_REGISTRY_DEP = "TOKEN_REGISTRY";

    MasterAccessManagement internal _masterAccess;
    ReviewableRequests internal _reviewableRequests;
    TokenRegistry internal _tokenRegistry;

    event DeployedTERC20(address token);

    modifier onlyCreatePermission() {
        _requirePermission(CREATE_PERMISSION);
        _;
    }

    modifier onlyExecutePermission() {
        _requirePermission(EXECUTE_PERMISSION);
        _;
    }

    function setDependencies(address registryAddress_) public override {
        super.setDependencies(registryAddress_);

        MasterContractsRegistry registry_ = MasterContractsRegistry(registryAddress_);

        _masterAccess = MasterAccessManagement(registry_.getMasterAccessManagement());
        _reviewableRequests = ReviewableRequests(registry_.getReviewableRequests());
        _tokenRegistry = TokenRegistry(registry_.getContract(TOKEN_REGISTRY_DEP));
    }

    function requestERC20(
        ITERC20.ConstructorParams calldata params_,
        string calldata description_
    ) external onlyCreatePermission {
        bytes memory data_ = abi.encodeWithSelector(this.deployERC20.selector, params_);

        _reviewableRequests.createRequest(address(this), data_, "", description_);
    }

    function deployERC20(
        ITERC20.ConstructorParams calldata params_
    ) external onlyExecutePermission {
        string memory tokenType_ = _tokenRegistry.TERC20_NAME();

        address tokenProxy_ = _deploy(address(_tokenRegistry), tokenType_);

        string memory tokenResource_ = string.concat(
            "TERC20:",
            uint256(uint160(tokenProxy_)).toHexString(20)
        );

        TERC20(tokenProxy_).__TERC20_init(params_, tokenResource_);

        _register(address(_tokenRegistry), tokenType_, tokenProxy_);
        _injectDependencies(address(_tokenRegistry), tokenProxy_);

        emit DeployedTERC20(tokenProxy_);
    }

    function _requirePermission(string memory permission_) internal view {
        require(
            _masterAccess.hasPermission(msg.sender, TOKEN_FACTORY_RESOURCE, permission_),
            "TokenFactory: access denied"
        );
    }
}
