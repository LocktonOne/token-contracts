// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface ITokenRegistry {
    function setNewImplementations(
        string[] calldata names,
        address[] calldata newImplementations
    ) external;

    function injectDependenciesToExistingPools(
        string calldata name,
        uint256 offset,
        uint256 limit
    ) external;
}
