'use strict';

module.exports = function (flowContext, payload) {
  let options = {
    uri: `${this.baseUri}/v3/catalog/products/${payload.productQuantityRemoteID}`,
    method: "PUT",
    body: payload.doc,
    resolveWithFullResponse: true
  };

  return this.getMatrixProductVariants(payload).then(() => {
    this.info(`Requesting [${options.method} ${options.uri}]`);
    return this.request(options).then(response => {
      return {
        endpointStatusCode: response.statusCode,
        statusCode: 200,
        payload: response.body
      }
    });
  }).catch(this.handleRejection.bind(this));
};
