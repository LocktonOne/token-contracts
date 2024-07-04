// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

import {AbstractDependant} from "@dlsl/dev-modules/contracts-registry/AbstractDependant.sol";

import {MasterAccessManagement} from "@tokene/core-contracts/core/MasterAccessManagement.sol";
import {MasterContractsRegistry} from "@tokene/core-contracts/core/MasterContractsRegistry.sol";

import {ContractMetadata} from "../metadata/ContractMetadata.sol";

import {ITERC20} from "../interfaces/tokens/ITERC20.sol";

/**
 * @notice The TERC20 contract, standard realization. Requires permissions for interaction.
 */
contract TERC20 is ITERC20, ERC20Upgradeable, ContractMetadata, AbstractDependant {
    string public constant MINT_PERMISSION = "MINT";
    string public constant BURN_PERMISSION = "BURN";
    string public constant SPEND_PERMISSION = "SPEND";
    string public constant RECEIVE_PERMISSION = "RECEIVE";

    string public TERC20_RESOURCE;

    MasterAccessManagement internal _masterAccess;

    uint8 internal _decimals;

    uint256 public totalSupplyCap;

    uint8 public tokenPermissions;
    mapping(uint8 => string) internal _tokenPermissionsMap;

    /**
     * @notice The initializer function
     * @param params_ the constructor params
     * @param resource_ the TERC20 resource to be used for RBAC
     */
    function __TERC20_init(
        ConstructorParams calldata params_,
        string calldata resource_
    ) external initializer {
        __ERC20_init(params_.name, params_.symbol);
        __ContractMetadata_init(params_.contractURI);

        TERC20_RESOURCE = resource_;

        _decimals = params_.decimals;

        totalSupplyCap = params_.totalSupplyCap;

        tokenPermissions = params_.permissions;

        _tokenPermissionsMap[0] = MINT_PERMISSION;
        _tokenPermissionsMap[1] = BURN_PERMISSION;
        _tokenPermissionsMap[2] = SPEND_PERMISSION;
        _tokenPermissionsMap[3] = RECEIVE_PERMISSION;
        _tokenPermissionsMap[4] = CHANGE_METADATA_PERMISSION;
    }

    modifier onlyChangeMetadataPermission() override {
        _requirePermission(msg.sender, CHANGE_METADATA_PERMISSION, 4);
        _;
    }

    /**
     * @notice The function to set dependencies
     * @dev Access: the injector address
     * @param registryAddress_ the ContractsRegistry address
     */
    function setDependencies(
        address registryAddress_,
        bytes calldata
    ) external override dependant {
        MasterContractsRegistry registry_ = MasterContractsRegistry(registryAddress_);

        _masterAccess = MasterAccessManagement(registry_.getMasterAccessManagement());
    }

    /**
     * @inheritdoc ITERC20
     */
    function mintTo(address account_, uint256 amount_) external override {
        require(
            totalSupplyCap == 0 || totalSupply() + amount_ <= totalSupplyCap,
            "TERC20: cap exceeded"
        );

        _mint(account_, amount_);
    }

    /**
     * @inheritdoc ITERC20
     */
    function burnFrom(address account_, uint256 amount_) external override {
        if (account_ != msg.sender) {
            _spendAllowance(account_, msg.sender, amount_);
        }

        _burn(account_, amount_);
    }

    /**
     * @notice The function to get the decimals of the token
     * @return token decimals
     */
    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    /**
     * @inheritdoc ITERC20
     */
    function getTokenPermissions() external view override returns (string[] memory) {
        string[] memory permissions_ = new string[](5);
        uint8 arrayIndex_ = 0;

        for (uint8 bitLocation_ = 0; bitLocation_ < 5; bitLocation_++) {
            if ((tokenPermissions >> bitLocation_) & 1 == 1) {
                permissions_[arrayIndex_] = _tokenPermissionsMap[bitLocation_];
                arrayIndex_++;
            }
        }
        return permissions_;
    }

    /**
     * @notice The internal function that checks permissions on mint, burn and transfer
     */
    function _beforeTokenTransfer(address from, address to, uint256) internal view override {
        if (from == address(0)) {
            _requirePermission(msg.sender, MINT_PERMISSION, 0);
            _requirePermission(to, RECEIVE_PERMISSION, 3);
        } else if (to == address(0)) {
            _requirePermission(from, BURN_PERMISSION, 1);
        } else {
            _requirePermission(from, SPEND_PERMISSION, 2);
            _requirePermission(to, RECEIVE_PERMISSION, 3);
        }
    }

    /**
     * @notice The internal function to optimize the bytecode for the permission check
     */
    function _requirePermission(
        address account_,
        string memory permission_,
        uint8 permissionNumber_
    ) internal view {
        require(
            _masterAccess.hasPermission(account_, TERC20_RESOURCE, permission_) ||
                (tokenPermissions >> permissionNumber_) & 1 == 1,
            "TERC20: access denied"
        );
    }
}
