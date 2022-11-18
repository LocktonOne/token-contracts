// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";

import "@dlsl/dev-modules/contracts-registry/AbstractDependant.sol";

import "@tokene/core-contracts/core/MasterAccessManagement.sol";
import "@tokene/core-contracts/core/MasterContractsRegistry.sol";

import "../metadata/ContractMetadata.sol";

import "../interfaces/tokens/ITERC721.sol";

contract TERC721 is
    ITERC721,
    ERC721EnumerableUpgradeable,
    ERC721URIStorageUpgradeable,
    ContractMetadata,
    AbstractDependant
{
    string public constant MINT_PERMISSION = "MINT";
    string public constant BURN_PERMISSION = "BURN";
    string public constant SPEND_PERMISSION = "SPEND";
    string public constant RECEIVE_PERMISSION = "RECEIVE";

    string public TERC721_RESOURCE;

    MasterAccessManagement internal _masterAccess;

    string public baseURI;
    uint256 public totalSupplyCap;

    function __TERC721_init(
        ConstructorParams calldata params_,
        string calldata resource_
    ) external initializer {
        __ERC721_init(params_.name, params_.symbol);
        __ContractMetadata_init(params_.contractURI);

        TERC721_RESOURCE = resource_;

        baseURI = params_.baseURI;

        totalSupplyCap = params_.totalSupplyCap;
    }

    modifier onlyChangeMetadataPermission() override {
        _requirePermission(msg.sender, CHANGE_METADATA_PERMISSION);
        _;
    }

    function setDependencies(address registryAddress_) external override dependant {
        MasterContractsRegistry registry_ = MasterContractsRegistry(registryAddress_);

        _masterAccess = MasterAccessManagement(registry_.getMasterAccessManagement());
    }

    function mintTo(
        address receiver_,
        uint256 tokenId_,
        string calldata tokenURI_
    ) external override {
        require(
            totalSupplyCap == 0 || totalSupply() + 1 <= totalSupplyCap,
            "TERC721: cap exceeded"
        );

        _mint(receiver_, tokenId_);
        _setTokenURI(tokenId_, tokenURI_);
    }

    function burnFrom(address payer_, uint256 tokenId_) external override {
        require(
            ownerOf(tokenId_) == payer_ &&
                (getApproved(tokenId_) == msg.sender || isApprovedForAll(payer_, msg.sender)),
            "TERC721: not approved"
        );

        _burn(tokenId_);
    }

    function setBaseURI(string calldata baseURI_) external override onlyChangeMetadataPermission {
        baseURI = baseURI_;
    }

    function setTokenURI(
        uint256 tokenId_,
        string calldata tokenURI_
    ) external override onlyChangeMetadataPermission {
        _setTokenURI(tokenId_, tokenURI_);
    }

    function tokenURI(
        uint256 tokenId
    )
        public
        view
        override(ERC721URIStorageUpgradeable, ERC721Upgradeable)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721EnumerableUpgradeable, ERC721Upgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _burn(
        uint256 tokenId
    ) internal override(ERC721URIStorageUpgradeable, ERC721Upgradeable) {
        super._burn(tokenId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721EnumerableUpgradeable, ERC721Upgradeable) {
        super._beforeTokenTransfer(from, to, tokenId);

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
            _masterAccess.hasPermission(account_, TERC721_RESOURCE, permission_),
            "TERC721: access denied"
        );
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }
}
