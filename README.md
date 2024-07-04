# The Lacton One Token Factory

This repository represents the token factory module for TERC20.

## What 

This is a token factory module to enable deployment of `TERC20` tokens. The module integrates with the TokenE core through NPM. The module provides special reviewable requests that deploy tokens if accepted and uses `MasterAccessManagement` contract to control access.

Additionally, there are permissions that apply to every token when it is deployed. These permissions are `MINT`, `BURN`, `SPEND`, `RECEIVE` and `CHANGE_METADATA`.

### Content

The module consists of 3 main contract:

1. `TokenFactory`
1. `TokenRegistry`
1. `TERC20`

The `TokenFactory` and `TokenRegistry` work in pair as a beacon proxy factory & registry. More about this pattern can be found [here](https://github.com/dl-solidity-library/dev-modules/tree/master/contracts/contracts-registry/pools).

The `TERC20` token is a custom `ERC20` token with permissioned access to mint, burn, receive, and spend tokens.

## How to find tokenPermissions variable

When `tokenPermissions` is set to `0` (`00000` in binary), it means all token permissions are off. Only permissions granted by the role are applied.

When `tokenPermissions` is set to `31` (`11111` in binary), all token permissions are on, and the user can mint, burn, transfer or change metadata regardless of their role.

Specific permissions can be selected by defining a binary number, where each bit corresponds to a certain permission. For example:

- `00001` - only mint;
- `00010` - only burn;
- `00100` - only spend;
- `01000` - only receive;
- `10000` - only change metadata.

> To get a binary representation of needed permissions, you can use the `encodePermissionsInBinary` function.

Then convert that binary number to a decimal to get tokenPermissions.

> For example, if you need mint, spend, and receive permissions, that's `01101` in binary, so tokenPermissions will be `13`.

## Integration

This module is currently not supposed to be integrated with.

## License 

The TokenE core is released under the custom License. Please take a look to understand the limitations.
