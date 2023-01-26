// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@dlsl/dev-modules/contracts-registry/pools/AbstractPoolContractsRegistry.sol";

import "@tokene/core-contracts/core/MasterAccessManagement.sol";
import "@tokene/core-contracts/core/MasterContractsRegistry.sol";

import "../interfaces/factory/ITokenRegistry.sol";

contract TokenRegistry is ITokenRegistry, AbstractPoolContractsRegistry {
    string public constant CREATE_PERMISSION = "CREATE";

    string public constant TOKEN_REGISTRY_RESOURCE = "TOKEN_REGISTRY_RESOURCE";

    string public constant TOKEN_FACTORY_DEP = "TOKEN_FACTORY";

    string public constant TERC20_NAME = "TERC20";
    string public constant TERC721_NAME = "TERC721";

    MasterAccessManagement internal _masterAccess;
    address internal _tokenFactory;

    modifier onlyCreatePermission() {
        _requirePermission(CREATE_PERMISSION);
        _;
    }

    modifier onlyTokenFactory() {
        require(_tokenFactory == msg.sender, "TokenRegistry: caller is not a factory");
        _;
    }

    function setDependencies(address registryAddress_, bytes calldata data_) public override {
        super.setDependencies(registryAddress_, data_);

        MasterContractsRegistry registry_ = MasterContractsRegistry(registryAddress_);

        _masterAccess = MasterAccessManagement(registry_.getMasterAccessManagement());
        _tokenFactory = registry_.getContract(TOKEN_FACTORY_DEP);
    }

    function setNewImplementations(
        string[] calldata names_,
        address[] calldata newImplementations_
    ) external override onlyCreatePermission {
        _setNewImplementations(names_, newImplementations_);
    }

    function injectDependenciesToExistingPools(
        string calldata name_,
        uint256 offset_,
        uint256 limit_
    ) external override onlyCreatePermission {
        _injectDependenciesToExistingPools(name_, offset_, limit_);
    }

    function injectDependenciesToExistingPoolsWithData(
        string calldata name_,
        bytes calldata data_,
        uint256 offset_,
        uint256 limit_
    ) external override onlyCreatePermission {
        _injectDependenciesToExistingPoolsWithData(name_, data_, offset_, limit_);
    }

    function addProxyPool(string calldata name_, address poolAddress_) external onlyTokenFactory {
        _addProxyPool(name_, poolAddress_);
    }

    function _requirePermission(string memory permission_) internal view {
        require(
            _masterAccess.hasPermission(msg.sender, TOKEN_REGISTRY_RESOURCE, permission_),
            "TokenRegistry: access denied"
        );
    }
}
