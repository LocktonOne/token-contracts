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

    string public constant TERC20_RESOURCE = "TERC20";

    enum Permissions {
        MINT,
        BURN,
        SPEND,
        RECEIVE,
        CHANGE_METADATA
    }

    MasterAccessManagement internal _masterAccess;

    uint8 internal _decimals;

    uint256 public totalSupplyCap;

    uint8 public tokenPermissions;

    /**
     * @notice The initializer function
     * @param params_ the constructor params
     */
    function __TERC20_init(
        ConstructorParams calldata params_,
        string calldata
    ) external initializer {
        __ERC20_init(params_.name, params_.symbol);
        __ContractMetadata_init(params_.contractURI);

        _decimals = params_.decimals;

        totalSupplyCap = params_.totalSupplyCap;

        tokenPermissions = params_.permissions;
    }

    modifier onlyChangeMetadataPermission() override {
        _requirePermission(msg.sender, Permissions.CHANGE_METADATA);
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
    function getTokenPermissions() external view override returns (string[] memory permissions_) {
        permissions_ = new string[](5);
        uint8 arrayIndex_ = 0;

        for (uint8 bitLocation_ = 0; bitLocation_ < 5; ++bitLocation_) {
            if ((tokenPermissions >> bitLocation_) & 1 == 1) {
                permissions_[arrayIndex_] = _getPermissionByNumber(Permissions(bitLocation_));
                arrayIndex_++;
            }
        }
    }

    /**
     * @notice The internal function that checks permissions on mint, burn and transfer
     */
    function _beforeTokenTransfer(address from, address to, uint256) internal view override {
        if (from == address(0)) {
            _requirePermission(msg.sender, Permissions.MINT);
            _requirePermission(to, Permissions.RECEIVE);
        } else if (to == address(0)) {
            _requirePermission(from, Permissions.BURN);
        } else {
            _requirePermission(from, Permissions.SPEND);
            _requirePermission(to, Permissions.RECEIVE);
        }
    }

    /**
     * @notice The internal function to optimize the bytecode for the permission check
     */
    function _requirePermission(address account_, Permissions permissionNumber_) internal view {
        require(
            _masterAccess.hasPermission(
                account_,
                TERC20_RESOURCE,
                _getPermissionByNumber(permissionNumber_)
            ) || (tokenPermissions >> uint8(permissionNumber_)) & 1 == 1,
            "TERC20: access denied"
        );
    }

    function _getPermissionByNumber(
        Permissions permissionNumber_
    ) private pure returns (string memory permission_) {
        if (permissionNumber_ == Permissions.MINT) {
            return MINT_PERMISSION;
        } else if (permissionNumber_ == Permissions.BURN) {
            return BURN_PERMISSION;
        } else if (permissionNumber_ == Permissions.SPEND) {
            return SPEND_PERMISSION;
        } else if (permissionNumber_ == Permissions.RECEIVE) {
            return RECEIVE_PERMISSION;
        }

        return CHANGE_METADATA_PERMISSION;
    }
}
