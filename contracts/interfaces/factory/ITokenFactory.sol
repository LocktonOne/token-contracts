// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "../tokens/ITERC20.sol";
import "../tokens/ITERC721.sol";

interface ITokenFactory {
    function requestERC20(
        ITERC20.ConstructorParams calldata params_,
        string calldata description_
    ) external;

    function deployERC20(ITERC20.ConstructorParams calldata params_) external;

    function requestERC721(
        ITERC721.ConstructorParams calldata params_,
        string calldata description_
    ) external;

    function deployERC721(ITERC721.ConstructorParams calldata params_) external;
}
