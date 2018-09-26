'use strict';

module.exports = async function (flowContext, payload) {
  let products = [];
  let out;
  let invalid = false;
  for (const remoteID of payload.remoteIDs) {
    let product = await this.queryProduct(`${this.baseUri}/v3/catalog/products/${remoteID}?include=variants`);
    products.push(product.body.data);
  }

  return {
    endpointStatusCode: 200,
    statusCode: 200,
    payload: products
  };
};
