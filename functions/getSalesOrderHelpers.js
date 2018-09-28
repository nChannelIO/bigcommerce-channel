'use strict';

module.exports = {
  queryOrders,
  queryOrderInfo,
  processOrder
};

let options = {
  method: 'GET',
  resolveWithFullResponse: true
};

function queryOrders(uri, pageSize) {
  options.uri = uri;
  this.info(`Requesting [${options.method} ${options.uri}]`);

  return this.request(options).then(response => {
    let orders = response.body || [];
    return this.formatGetResponse(orders, pageSize, response.statusCode);
  }).catch(this.handleRejection.bind(this));
}

function queryOrderInfo(uri) {
  options.uri = uri;
  this.info(`Requesting [${options.method} ${options.uri}]`);

  return this.request(options).then(response => {
    return response;
  }).catch(this.handleRejection.bind(this));
}

function processOrder(order) {
  // Query Products on Order
  return this.queryOrderInfo(`${this.baseUri}/v2/orders/${order.id}/products?limit=250`).then(response => {
    let products = response.body;

    // Query each Product
    return Promise.all(products.map(product => {
      return this.queryOrderInfo(`${this.baseUri}/v3/catalog/products/${product.product_id}?include=variants&limit=250`).then(response => {
        product = response.body;
      });
    })).then(() => {
      order.products = products;
    });
  }).then(() => {
    return this.queryOrderInfo(`${this.baseUri}/v2/orders/${order.id}/shippingaddresses?limit=250`).then(response => {
      order.shipping_addresses = response.body;
    });
  }).then(() => {
    return this.queryOrderInfo(`${this.baseUri}/v2/orders/${order.id}/coupons?limit=250`).then(response => {
      order.coupons = response.body;
    });
  }).then(() => {
    return this.queryOrderInfo(`${this.baseUri}/v2/customers/${order.customer_id}`).then(response => {
      order.customer = response.body;
    });
  });
}
