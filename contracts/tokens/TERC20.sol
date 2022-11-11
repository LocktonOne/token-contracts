// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

import "@dlsl/dev-modules/contracts-registry/AbstractDependant.sol";

import "@tokene/core-contracts/core/MasterAccessManagement.sol";
import "@tokene/core-contracts/core/MasterContractsRegistry.sol";

import "../interfaces/tokens/ITERC20.sol";

contract TERC20 is ITERC20, ERC20Upgradeable, AbstractDependant {
    string public constant MINT_PERMISSION = "MINT";
    string public constant BURN_PERMISSION = "BURN";
    string public constant SPEND_PERMISSION = "SPEND";
    string public constant RECEIVE_PERMISSION = "RECEIVE";
    string public constant CHANGE_METADATA_PERMISSION = "CHANGE_METADATA";

    string public TERC20_RESOURCE;

    MasterAccessManagement internal _masterAccess;

    uint8 internal _decimals;
    string internal _metadataURI;

    uint256 public totalSupplyCap;

    function __TERC20_init(
        ConstructorParams calldata params_,
        string calldata resource_
    ) external initializer {
        __ERC20_init(params_.name, params_.symbol);

        TERC20_RESOURCE = resource_;

        _decimals = params_.decimals;
        _metadataURI = params_.metadataURI;

        totalSupplyCap = params_.totalSupplyCap;
    }

    modifier onlyChangeMetadataPermission() {
        _requirePermission(msg.sender, CHANGE_METADATA_PERMISSION);
        _;
    }

    function setDependencies(address registryAddress_) external override dependant {
        MasterContractsRegistry registry_ = MasterContractsRegistry(registryAddress_);

        _masterAccess = MasterAccessManagement(registry_.getMasterAccessManagement());
    }

    function mintTo(address account_, uint256 amount_) external override {
        require(
            totalSupplyCap == 0 || totalSupply() + amount_ <= totalSupplyCap,
            "TERC20: cap exceeded"
        );

        _mint(account_, amount_);
    }

    function burnFrom(address account_, uint256 amount_) external override {
        if (account_ != msg.sender) {
            _spendAllowance(account_, msg.sender, amount_);
        }

        _burn(account_, amount_);
    }

    function setMetadata(
        string calldata metadataURI_
    ) external override onlyChangeMetadataPermission {
        _metadataURI = metadataURI_;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function uri() external view override returns (string memory) {
        return _metadataURI;
    }

    function _beforeTokenTransfer(address from, address to, uint256) internal view override {
        if (from == address(0)) {
            _requirePermission(msg.sender, MINT_PERMISSION);
            _requirePermission(to, RECEIVE_PERMISSION);
        } else if (to == address(0)) {
            _requirePermission(from, BURN_PERMISSION);
        } else {
            _requirePermission(from, SPEND_PERMISSION);
            _requirePermission(to, RECEIVE_PERMISSION);
        }
    }

    function _requirePermission(address account_, string memory permission_) internal view {
        require(
            _masterAccess.hasPermission(account_, TERC20_RESOURCE, permission_),
            "TERC20: access denied"
        );
    }
}
