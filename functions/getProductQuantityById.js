'use strict';

module.exports = async function (flowContext, payload) {
  let products = [];
  let calls = [];

  payload.remoteIDs.forEach(id => {
    calls.push(`${this.baseUri}/v3/catalog/products/${id}?include=variants`);
  });

  let hasMore = false;
  const currentPage = payload.page;
  const currentPageIndex = currentPage - 1;
  const pageSize = payload.pageSize;

  const queries = calls.slice(currentPageIndex * pageSize, currentPage * pageSize);

  for (const query of queries) {
    await this.queryProduct(query).then(async response => {
      products.push(response.body);
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

  this.info(`Found ${totalCount} total products.`);
  if (totalCount > 0) {
    this.info(`Returning ${products.length} products from page ${currentPage} of ${totalPages}.`);
  }

  return {
    endpointStatusCode: 200,
    statusCode: hasMore ? 206 : products.length > 0 ? 200 : 204,
    payload: products
  };
};
