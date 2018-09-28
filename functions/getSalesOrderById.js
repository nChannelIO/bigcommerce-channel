'use strict';

module.exports = async function (flowContext, payload) {
  let orders = [];
  let calls = [];

  payload.remoteIDs.forEach(id => {
    calls.push(`${this.baseUri}/v2/orders/${id}`);
  });

  let hasMore = false;
  const currentPage = payload.page;
  const currentPageIndex = currentPage - 1;
  const pageSize = payload.pageSize;

  const queries = calls.slice(currentPageIndex * pageSize, currentPage * pageSize);

  for (const query of queries) {
    await this.queryOrderInfo(query).then(async response => {
      await this.processOrder(response.body);
      orders.push(response.body);
    }).catch(response => {
      if (response.endpointStatusCode == 404) {
        this.error(`Call to endpoint ${query} returned a 404 error`);
      } else {
        return Promise.reject(response);
      }
    });
  }

  const totalCount = calls.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  hasMore = currentPage < totalPages;

  this.info(`Found ${totalCount} total orders.`);
  if (totalCount > 0) {
    this.info(`Returning ${orders.length} orders from page ${currentPage} of ${totalPages}.`);
  }

  return {
    endpointStatusCode: 200,
    statusCode: hasMore ? 206 : orders.length > 0 ? 200 : 204,
    payload: orders
  };
};
