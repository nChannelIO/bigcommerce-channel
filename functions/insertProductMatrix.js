'use strict';

let _ = require('lodash');

module.exports = function (flowContext, payload) {
  let options = {
    uri: `${this.baseUri}/v3/catalog/products`,
    method: "POST",
    body: payload.doc,
    resolveWithFullResponse: true
  };

  this.info(`Requesting [${options.method} ${options.uri}]`);

  return this.request(options).then(response => {
    // Create a copy of the payload
    let updatedPayload = _.cloneDeep(payload);

    // Set ID of created product
    updatedPayload.doc.id = response.body.data.id;

    // Update the copied payload with the variant IDs
    updatedPayload.doc.variants.forEach(variant => {
      // Look for a match by sku - If found, set the ID for each variant
      let match = response.body.data.variants.find(x => x.sku == variant.sku);
      if (match) {
        variant.id = match.id;
        variant.product_id = response.body.data.id;
      }
    });

    return Promise.all([
      // Insert metafields using the updated payload
      this.insertProductMetafields(updatedPayload),
      this.insertVariantMetafields(updatedPayload)
    ]).then(() => {
      return {
        endpointStatusCode: response.statusCode,
        statusCode: 201,
        payload: response.body
      };
    });
  }).catch(this.handleRejection.bind(this));
};
