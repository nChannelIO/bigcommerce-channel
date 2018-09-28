'use strict';

module.exports = {
  queryCustomers,
  queryCustomer
};

function queryCustomers(uri, pageSize) {
  let options = {
    method: 'GET',
    uri: uri,
    resolveWithFullResponse: true
  };

  this.info(`Requesting [${options.method} ${options.uri}]`);

  return this.request(options).then(response => {
    let customers = response.body || [];

    return this.formatGetResponse(customers, pageSize, response.statusCode);
  }).catch(this.handleRejection.bind(this));
}

function queryCustomer(uri) {
  let options = {
    method: 'GET',
    uri: uri,
    resolveWithFullResponse: true
  };

  this.info(`Requesting [${options.method} ${options.uri}]`);

  return this.request(options).catch(this.handleRejection.bind(this));
}
