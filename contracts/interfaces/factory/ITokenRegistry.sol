// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface ITokenRegistry {
    function setNewImplementations(
        string[] calldata names_,
        address[] calldata newImplementations_
    ) external;

    function injectDependenciesToExistingPools(
        string calldata name_,
        uint256 offset_,
        uint256 limit_
    ) external;

    function injectDependenciesToExistingPoolsWithData(
        string calldata name_,
        bytes calldata data_,
        uint256 offset_,
        uint256 limit_
    ) external;
}
