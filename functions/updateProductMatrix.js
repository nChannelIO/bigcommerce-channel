'use strict';

let _ = require('lodash');

module.exports = function (flowContext, payload) {
  let options = {
    uri: `${this.baseUri}/v3/catalog/products/${payload.productRemoteID}`,
    method: "PUT",
    body: payload.doc,
    resolveWithFullResponse: true
  };

  return this.getMatrixProductVariants(payload).then(() => {
    return this.getCustomFields(payload).then(() => {
      this.info(`Requesting [${options.method} ${options.uri}]`);
      return this.request(options).then(response => {
        return Promise.all([
          // Insert metafields using the updated payload
          this.updateProductMetafields(payload),
          this.updateVariantMetafields(payload)
        ]).then(() => {
          return {
            endpointStatusCode: response.statusCode,
            statusCode: 200,
            payload: response.body.data
          };
        });
      });
    });
  }).catch(this.handleRejection.bind(this));
};
