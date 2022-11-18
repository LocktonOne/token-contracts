// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "../interfaces/metadata/IContractMetadata.sol";

abstract contract ContractMetadata is IContractMetadata, Initializable {
    string public constant CHANGE_METADATA_PERMISSION = "CHANGE_METADATA";

    string private _contractURI;

    function __ContractMetadata_init(string memory contractURI_) internal onlyInitializing {
        _contractURI = contractURI_;
    }

    modifier onlyChangeMetadataPermission() virtual {
        _;
    }

    function setContractMetadata(
        string calldata contractURI_
    ) external override onlyChangeMetadataPermission {
        _contractURI = contractURI_;
    }

    function contractURI() external view override returns (string memory) {
        return _contractURI;
    }
}
