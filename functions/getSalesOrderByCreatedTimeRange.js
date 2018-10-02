'use strict';

module.exports = function (flowContext, payload) {
  return this.queryOrderInfo(`${this.baseUri}/v2/order_statuses`).then(statuses => {
    let params = [];

    if (flowContext && flowContext.orderStatus && statuses.statusCode == 200) {
      let orderStatuses = statuses.body;
      for (let i = 0; i < orderStatuses.length; i++) {
        if (orderStatuses[i].custom_label === flowContext.orderStatus) {
          params.push(`status_id=${orderStatuses[i].id}`);
          break;
        }
      }
    }

    //Queried dates are exclusive so skew by 1 ms to create an equivalent inclusive range
    params.push("min_date_created=" + new Date(Date.parse(payload.createdDateRange.startDateGMT) - 1).toISOString());
    params.push("max_date_created=" + new Date(Date.parse(payload.createdDateRange.endDateGMT) + 1).toISOString());

    if (payload.page) {
      params.push("page=" + payload.page);
    }
    if (payload.pageSize) {
      params.push("limit=" + payload.pageSize);
    }

    return this.queryOrders(`${this.baseUri}/v2/orders?${params.join('&')}`, payload.pageSize).then(async result => {
      if (result.endpointStatusCode == 204) {
        return result;
      } else {
        for (const order of result.payload) {
          await this.processOrder(order);
        }

        return result;
      }
    });
  });
};
