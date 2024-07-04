// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {ITERC20} from "../tokens/ITERC20.sol";

interface ITokenFactory {
    /**
     * @notice The event that gets emitted when new TERC20 token is deployed
     * @param token the address of the token
     * @param params the token constructor params
     */
    event DeployedTERC20(address token, ITERC20.ConstructorParams params);

    /**
     * @notice The function to request the deployment of TERC20 token
     * @dev Access: CREATE permission
     * @param params_ the constructor params of the TERC20 token
     * @param description_ the description of the reviewable request
     */
    function requestTERC20(
        ITERC20.ConstructorParams calldata params_,
        string calldata description_
    ) external;

    /**
     * @notice The function to deploy the requested TERC20 token. Will be called by a ReviewableRequests contract
     * @dev Access: EXECUTE permission
     * @param params_ the specified constructor params of the TERC20 token
     */
    function deployTERC20(ITERC20.ConstructorParams calldata params_) external;

    /**
     * @notice The function to return the list of all tokens deployed
     * @dev This operation will copy the entire storage to memory, which can be quite expensive
     * @return tokens_ the array of token addresses
     */
    function getDeployedTokens() external view returns (address[] memory tokens_);

    /**
     * @notice The function to count deployed tokens
     * @return the number of deployed tokens
     */
    function countTokens() external view returns (uint256);

    /**
     * @notice The function to check if a such token was deployed
     * @param token_ the address of token to check
     */
    function isTokenExist(address token_) external view returns (bool);

    /**
     * @notice The paginated function to list token adresses
     * @param offset_ the starting index in the tokens array
     * @param limit_ the number of tokens
     * @return tokens_ the array of token addresses
     */
    function listTokens(
        uint256 offset_,
        uint256 limit_
    ) external view returns (address[] memory tokens_);
}
