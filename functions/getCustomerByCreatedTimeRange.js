'use strict';

module.exports = function (flowContext, payload) {
    let params = [];

    //Queried dates are exclusive so skew by 1 ms to create an equivalent inclusive range
    params.push("min_date_created=" + new Date(Date.parse(payload.createdDateRange.startDateGMT) - 1).toISOString());
    params.push("max_date_created=" + new Date(Date.parse(payload.createdDateRange.endDateGMT) + 1).toISOString());

    if (payload.page) {
      params.push("page=" + payload.page);
    }
    if (payload.pageSize) {
      params.push("limit=" + payload.pageSize);
    }

    return this.queryCustomers(`${this.baseUri}/v2/customers?${params.join('&')}`, payload.pageSize);
};
