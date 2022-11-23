// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "../tokens/ITERC20.sol";
import "../tokens/ITERC721.sol";

interface ITokenFactory {
    function requestTERC20(
        ITERC20.ConstructorParams calldata params_,
        string calldata description_
    ) external;

    function deployTERC20(ITERC20.ConstructorParams calldata params_) external;

    function requestTERC721(
        ITERC721.ConstructorParams calldata params_,
        string calldata description_
    ) external;

    function deployTERC721(ITERC721.ConstructorParams calldata params_) external;
}
