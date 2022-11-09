// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@dlsl/dev-modules/pool-contracts-registry/AbstractPoolContractsRegistry.sol";

import "@tokene/core-contracts/core/MasterAccessManagement.sol";
import "@tokene/core-contracts/core/MasterContractsRegistry.sol";

import "../interfaces/factory/ITokenRegistry.sol";

contract TokenRegistry is ITokenRegistry, AbstractPoolContractsRegistry {
    string public constant CREATE_PERMISSION = "CREATE";

    string public constant TOKEN_REGISTRY_RESOURCE = "TOKEN_REGISTRY_RESOURCE";

    string public constant TOKEN_FACTORY_DEP = "TOKEN_FACTORY";

    string public constant TERC20_NAME = "TERC20";

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

    function setDependencies(address registryAddress_) public override {
        super.setDependencies(registryAddress_);

        MasterContractsRegistry registry_ = MasterContractsRegistry(registryAddress_);

        _masterAccess = MasterAccessManagement(registry_.getMasterAccessManagement());
        _tokenFactory = registry_.getContract(TOKEN_FACTORY_DEP);
    }

    function setNewImplementations(
        string[] calldata names,
        address[] calldata newImplementations
    ) external override onlyCreatePermission {
        _setNewImplementations(names, newImplementations);
    }

    function injectDependenciesToExistingPools(
        string calldata name,
        uint256 offset,
        uint256 limit
    ) external override onlyCreatePermission {
        _injectDependenciesToExistingPools(name, offset, limit);
    }

    function addProxyPool(string calldata name, address poolAddress) external onlyTokenFactory {
        _addProxyPool(name, poolAddress);
    }

    function _requirePermission(string memory permission_) internal view {
        require(
            _masterAccess.hasPermission(msg.sender, TOKEN_REGISTRY_RESOURCE, permission_),
            "TokenRegistry: access denied"
        );
    }
}
