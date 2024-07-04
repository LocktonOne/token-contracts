export function encodePermissionsInBinary(
  isMintPermissionNeeded: boolean,
  isBurnPermissionNeeded: boolean,
  isSpendPermissionNeeded: boolean,
  isReceivePermissionNeeded: boolean,
  isMetadataPermissionNeeded: boolean,
): string {
  let result = "";

  result = result.concat(isMetadataPermissionNeeded ? "1" : "0");
  result = result.concat(isReceivePermissionNeeded ? "1" : "0");
  result = result.concat(isSpendPermissionNeeded ? "1" : "0");
  result = result.concat(isBurnPermissionNeeded ? "1" : "0");
  result = result.concat(isMintPermissionNeeded ? "1" : "0");

  return result;
}
