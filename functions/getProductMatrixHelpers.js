'use strict';

module.exports = {
  queryProducts,
  queryProduct
};

function queryProducts(uri, pageSize) {
  let options = {
    method: 'GET',
    uri: uri,
    resolveWithFullResponse: true
  };

  this.info(`Requesting [${options.method} ${options.uri}]`);

  return this.request(options).then(response => {
    let products = response.body.data || [];

    return this.formatGetResponse(products, pageSize, response.statusCode);
  }).catch(this.handleRejection.bind(this));
}

function queryProduct(uri) {
  let options = {
    method: 'GET',
    uri: uri,
    resolveWithFullResponse: true
  };

  this.info(`Requesting [${options.method} ${options.uri}]`);

  return this.request(options).catch(this.handleRejection.bind(this));
}
