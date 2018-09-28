'use strict';

module.exports = function (flowContext, payload) {
  let options = {
    uri: `${this.baseUri}/v2/customers`,
    method: "POST",
    body: payload.doc,
    resolveWithFullResponse: true
  };

  this.info(`Requesting [${options.method} ${options.uri}]`);

  // Store addresses - They cannot be inserted with the customer
  let cacheAddresses = payload.doc.addresses;
  delete payload.doc.addresses;

  return this.request(options).then(response => {
    // Restore addresses
    response.body.addresses = cacheAddresses;
    return {
      endpointStatusCode: response.statusCode,
      statusCode: 201,
      payload: response.body
    };
  }).catch(this.handleRejection.bind(this));
};
