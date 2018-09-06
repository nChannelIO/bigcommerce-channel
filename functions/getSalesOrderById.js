'use strict';

module.exports = async function (flowContext, payload) {
  let orders = [];
  let out;
  let invalid = false;
  for (const remoteID of payload.remoteIDs) {
    await this.queryOrderInfo(`${this.baseUri}/v2/orders/${remoteID}`).then(async response => {
      await this.processOrder(response.body);
      orders.push(response.body);
    }).catch(response => {
      invalid = true;
      if (response.endpointStatusCode == 404) {
        out = {
          endpointStatusCode: response.endpointStatusCode,
          statusCode: 204,
          payload: []
        }
      } else {
        return Promise.reject(response);
      }
    });
  }

  if (!invalid) {
    return {
      endpointStatusCode: 200,
      statusCode: 200,
      payload: orders
    };
  } else {
    return out;
  }
};
