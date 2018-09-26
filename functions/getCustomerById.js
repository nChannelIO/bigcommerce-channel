'use strict';

module.exports = async function (flowContext, payload) {
  let customers = [];
  let out;
  let invalid = false;
  for (const remoteID of payload.remoteIDs) {
    let customer = await this.queryCustomer(`${this.baseUri}/v2/customers/${remoteID}`);
    customers.push(customer.body);
  }

  return {
    endpointStatusCode: 200,
    statusCode: 200,
    payload: customers
  };
};
