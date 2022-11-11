// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface ITERC20 {
    struct ConstructorParams {
        string name;
        string symbol;
        string metadataURI;
        uint8 decimals;
        uint256 totalSupplyCap;
    }

    function mintTo(address account_, uint256 amount_) external;

    function burnFrom(address account_, uint256 amount_) external;

    function setMetadata(string calldata metadataURI_) external;

    function uri() external view returns (string memory);
}
