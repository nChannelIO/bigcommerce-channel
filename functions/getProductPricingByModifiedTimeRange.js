'use strict';

module.exports = function (flowContext, payload) {
    let params = [];

    //Queried dates are exclusive so skew by 1 ms to create an equivalent inclusive range
    params.push("date_modified:min=" + new Date(Date.parse(payload.modifiedDateRange.startDateGMT) - 1).toISOString());
    params.push("date_modified:max=" + new Date(Date.parse(payload.modifiedDateRange.endDateGMT) + 1).toISOString());

    if (payload.page) {
      params.push("page=" + payload.page);
    }
    if (payload.pageSize) {
      params.push("limit=" + payload.pageSize);
    }

    params.push("include=variants");

    return this.queryProducts(`${this.baseUri}/v3/catalog/products?${params.join('&')}`, payload.pageSize);
};
