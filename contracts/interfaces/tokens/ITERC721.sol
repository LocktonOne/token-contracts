// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/IERC721EnumerableUpgradeable.sol";

interface ITERC721 is IERC721EnumerableUpgradeable {
    struct ConstructorParams {
        string name;
        string symbol;
        string contractURI;
        string baseURI;
        uint256 totalSupplyCap;
    }

    function mintTo(address receiver_, uint256 tokenId_, string calldata tokenURI_) external;

    function burnFrom(address payer_, uint256 tokenId_) external;

    function setBaseURI(string calldata baseURI_) external;

    function setTokenURI(uint256 tokenId_, string calldata tokenURI_) external;
}
