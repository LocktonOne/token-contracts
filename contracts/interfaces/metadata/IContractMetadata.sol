// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IContractMetadata {
    function setContractMetadata(string calldata contractURI_) external;

    function contractURI() external view returns (string memory);
}
