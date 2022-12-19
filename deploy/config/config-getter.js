async function getConfigJson() {
  const vault = require("node-vault")({
    apiVersion: "v1",
    endpoint: process.env.VAULT_ENDPOINT,
    token: process.env.VAULT_TOKEN,
  });

  const responseBody = (await vault.read(process.env.VAULT_FETCH_CONFIG_PATH)).data;

  return responseBody.data;
}

module.exports = {
  getConfigJson,
};
