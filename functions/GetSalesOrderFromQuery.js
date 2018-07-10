'use strict'

let GetSalesOrderFromQuery = function (ncUtil, channelProfile, flowContext, payload, callback) {
    const request = require('request-promise');
    const jsonata = require('jsonata');
    const nc = require('../util/common');

    let out = {
        ncStatusCode: null,
        payload: {},
        response: {}
    };

    let headers = {}

    if (!callback) {
        throw new Error("A callback function was not provided");
    } else if (typeof callback !== 'function') {
        throw new TypeError("callback is not a function")
    }

    validateFunction()
        .then(getOrderStatuses)
        .then(queryOrders)
        .then(checkResponse)
        .then(getOrderProducts)
        .then(getShippingAddresses)
        .then(getCoupons)
        .then(getCustomers)
        .then(buildResponse)
        .catch(handleError)
        .then(() => callback(out))
        .catch(error => {
            logError(`The callback function threw an exception: ${error}`);
            setTimeout(() => {
                throw error;
            });
        });

    function logInfo(msg) {
        nc.log(msg, "info");
    }

    function logWarn(msg) {
        nc.log(msg, "warn");
    }

    function logError(msg) {
        nc.log(msg, "error");
    }

    async function validateFunction() {
        let invalidMsg;

        if (!ncUtil)
            invalidMsg = "ncUtil was not provided";
        else if (!channelProfile)
            invalidMsg = "channelProfile was not provided";
        else if (!channelProfile.channelSettingsValues)
            invalidMsg = "channelProfile.channelSettingsValues was not provided";
        else if (!channelProfile.channelAuthValues)
            invalidMsg = "channelProfile.channelAuthValues was not provided";
        else if (!channelProfile.channelSettingsValues.api_uri)
            invalidMsg = "channelProfile.channelSettingsValues.api_uri was not provided";
        else if (!channelProfile.channelAuthValues.store_hash)
            invalidMsg = "channelProfile.channelAuthValues.store_hash was not provided";
        else if (!channelProfile.channelAuthValues.access_token)
            invalidMsg = "channelProfile.channelAuthValues.access_token was not provided";
        else if (!channelProfile.channelAuthValues.client_id)
            invalidMsg = "channelProfile.channelAuthValues.client_id was not provided";
        else if (!channelProfile.salesOrderBusinessReferences)
            invalidMsg = "channelProfile.salesOrderBusinessReferences was not provided";
        else if (!nc.isArray(channelProfile.salesOrderBusinessReferences))
            invalidMsg = "channelProfile.salesOrderBusinessReferences is not an array";
        else if (!nc.isNonEmptyArray(channelProfile.salesOrderBusinessReferences))
            invalidMsg = "channelProfile.salesOrderBusinessReferences is empty";
        else if (!payload)
            invalidMsg = "payload was not provided";
        else if (!payload.doc)
            invalidMsg = "payload.doc was not provided";
        else if (!payload.doc.remoteIDs && !payload.doc.searchFields && !payload.doc.modifiedDateRange)
            invalidMsg = "either payload.doc.remoteIDs or payload.doc.searchFields or payload.doc.modifiedDateRange must be provided";
        else if (payload.doc.remoteIDs && (payload.doc.searchFields || payload.doc.modifiedDateRange))
            invalidMsg = "only one of payload.doc.remoteIDs or payload.doc.searchFields or payload.doc.modifiedDateRange may be provided";
        else if (payload.doc.remoteIDs && (!Array.isArray(payload.doc.remoteIDs) || payload.doc.remoteIDs.length === 0))
            invalidMsg = "payload.doc.remoteIDs must be an Array with at least 1 remoteID";
        else if (payload.doc.searchFields && (!Array.isArray(payload.doc.searchFields) || payload.doc.searchFields.length === 0))
            invalidMsg = "payload.doc.searchFields must be an Array with at least 1 key value pair: {searchField: 'key', searchValues: ['value_1']}";
        else if (payload.doc.searchFields) {
          for (let i = 0; i < payload.doc.searchFields.length; i++) {
            if (!payload.doc.searchFields[i].searchField || !Array.isArray(payload.doc.searchFields[i].searchValues) || payload.doc.searchFields[i].searchValues.length === 0)
              invalidMsg = "payload.doc.searchFields[" + i + "] must be a key value pair: {searchField: 'key', searchValues: ['value_1']}";
              break;
            }
          }
        else if (payload.doc.modifiedDateRange && !(payload.doc.modifiedDateRange.startDateGMT || payload.doc.modifiedDateRange.endDateGMT))
            invalidMsg = "at least one of payload.doc.modifiedDateRange.startDateGMT or payload.doc.modifiedDateRange.endDateGMT must be provided";
        else if (payload.doc.modifiedDateRange && payload.doc.modifiedDateRange.startDateGMT && payload.doc.modifiedDateRange.endDateGMT && (payload.doc.modifiedDateRange.startDateGMT > payload.doc.modifiedDateRange.endDateGMT))
            invalidMsg = "startDateGMT must have a date before endDateGMT";

        if (invalidMsg) {
            logError(invalidMsg);
            out.ncStatusCode = 400;
            throw new Error(`Invalid request [${invalidMsg}]`);
        }
        logInfo("Function is valid.");
    }

    async function getOrderStatuses() {
        logInfo("Querying Order Statuses...");
        headers = {
          "X-Auth-Client": channelProfile.channelAuthValues.client_id,
          "X-Auth-Token": channelProfile.channelAuthValues.access_token
        }
        let response = await request.get({ url: `${channelProfile.channelSettingsValues.api_uri}/stores/${channelProfile.channelAuthValues.store_hash}/v2/order_statuses`, headers: headers, json: true, resolveWithFullResponse: true })
          .catch((err) => { throw err; });

        return response;
    }

    async function queryOrders(statusResponse) {
        logInfo("Querying Orders...");

        let filters = {};

        if (payload.doc.searchFields) {

          payload.doc.searchFields.forEach(function (searchField) {
            filters[searchField.searchField] = searchField.searchValues.join(',');
          });

        } else if (payload.doc.remoteIDs) {

          filters["min_id"] = payload.doc.remoteIDs[0];

        } else if (payload.doc.modifiedDateRange) {
          if (payload.doc.modifiedDateRange.startDateGMT && !payload.doc.modifiedDateRange.endDateGMT) {
            filters["min_date_modified"] = payload.doc.modifiedDateRange.startDateGMT;
          } else if (payload.doc.modifiedDateRange.endDateGMT && !payload.doc.modifiedDateRange.startDateGMT) {
            filters["max_date_modified"] = payload.doc.modifiedDateRange.endDateGMT;
          } else if (payload.doc.modifiedDateRange.startDateGMT && payload.doc.modifiedDateRange.endDateGMT) {
            filters["min_date_modified"] = payload.doc.modifiedDateRange.startDateGMT;
            filters["max_date_modified"] = payload.doc.modifiedDateRange.endDateGMT;
          }
        }

        if (payload.doc.page) {
          filters["page"] = payload.doc.page;
        }

        if (payload.doc.pageSize) {
          filters["limit"] = payload.doc.pageSize;
        }

        if (flowContext && flowContext.orderStatus && statusResponse.statusCode == 200) {
          let orderStatuses = statusResponse.body;
          for (let i = 0; i < orderStatuses.length; i++) {
            if (orderStatuses[i].custom_label === flowContext.orderStatus) {
              filters["status_id"] = orderStatuses[i].id;
              break;
            }
          }
        }

        let response = await request.get({ url: `${channelProfile.channelSettingsValues.api_uri}/stores/${channelProfile.channelAuthValues.store_hash}/v2/orders`, qs: filters, headers: headers, json: true, resolveWithFullResponse: true })
          .catch((err) => { throw err; });

        return response;
    }

    async function checkResponse(response) {
        let orders = [];
        out.response.endpointStatusCode = response.statusCode;
        out.response.endpointStatusMessage = response.statusMessage;

        if (response.statusCode == 200) {
          orders = response.body;
        }

        return orders;
    }

    async function getOrderProducts(orders) {
        return await Promise.all(orders.map(getOrderProductDetails))
          .catch((err) => { throw err; });
    }

    async function getShippingAddresses(orders) {
        return await Promise.all(orders.map(getShippingAddress))
          .catch((err) => { throw err; });
    }

    async function getCoupons(orders) {
        return await Promise.all(orders.map(getCoupon))
          .catch((err) => { throw err; });
    }

    async function getCustomers(orders) {
        return await Promise.all(orders.map(getCustomer))
          .catch((err) => { throw err; });
    }

    async function getOrderProductDetails(order) {
        logInfo(`Getting Products for Order: ${order.id}`);
        let response = await request.get({ url: `${channelProfile.channelSettingsValues.api_uri}/stores/${channelProfile.channelAuthValues.store_hash}/v2/orders/${order.id}/products`, headers: headers, json: true, resolveWithFullResponse: true  })
          .catch((err) => { throw err; });
        let products = response.body;
        let enrichedProducts = await Promise.all(products.map(getProduct));
        order.products = enrichedProducts;
        return order;
    }

    async function getProduct(product) {
        let response = await request.get({ url: `${channelProfile.channelSettingsValues.api_uri}/stores/${channelProfile.channelAuthValues.store_hash}/v3/catalog/products/${product.product_id}?include=variants`, headers: headers, json: true, resolveWithFullResponse: true  })
          .catch((err) => { throw err; });
        return response.body;
    }

    async function getShippingAddress(order) {
        logInfo(`Getting Shipping Addresses for Order: ${order.id}`);
        let response = await request.get({ url: `${channelProfile.channelSettingsValues.api_uri}/stores/${channelProfile.channelAuthValues.store_hash}/v2/orders/${order.id}/shippingaddresses`, headers: headers, json: true, resolveWithFullResponse: true  })
          .catch((err) => { throw err; });
        order.shipping_addresses = response.body;
        return order;
    }

    async function getCoupon(order) {
        logInfo(`Getting Coupons for Order: ${order.id}`);
        let response = await request.get({ url: `${channelProfile.channelSettingsValues.api_uri}/stores/${channelProfile.channelAuthValues.store_hash}/v2/orders/${order.id}/coupons`, headers: headers, json: true, resolveWithFullResponse: true  })
          .catch((err) => { throw err; });
        order.coupons = response.body;
        return order;
    }

    async function getCustomer(order) {
        logInfo(`Getting Customer for Order: ${order.id}`);
        let response = await request.get({ url: `${channelProfile.channelSettingsValues.api_uri}/stores/${channelProfile.channelAuthValues.store_hash}/v2/customers/${order.customer_id}`, headers: headers, json: true, resolveWithFullResponse: true  })
          .catch((err) => { throw err; });
        order.customer = response.body;
        return order;
    }

    async function buildResponse(orders) {
        let docs = [];

        if (orders.length === 0) {
            logInfo("No new orders found");
            out.ncStatusCode = 204;
        } else {
            for (let i = 0; i < orders.length; i++) {
              docs.push({
                doc: orders[i],
                salesOrderRemoteID: orders[i].id,
                salesOrderBusinessReferences: nc.extractBusinessReference(channelProfile.salesOrderBusinessReferences, orders[i])
              })
            }

            out.payload = docs;

            if (orders.length === payload.doc.pageSize) {
              out.ncStatusCode = 206;
            } else {
              out.ncStatusCode = 200;
            }
        }
    }

    async function handleError(error) {
        logError(error);
        if (error.name === "StatusCodeError") {
            out.response.endpointStatusCode = error.statusCode;
            out.response.endpointStatusMessage = error.message;
            if (error.statusCode >= 500) {
                out.ncStatusCode = 500;
            } else if (error.statusCode === 429) {
                logWarn("Request was throttled.");
                out.ncStatusCode = 429;
            } else {
                out.ncStatusCode = 400;
            }
        }
        out.payload.error = error;
        out.ncStatusCode = out.ncStatusCode || 500;
    }
}

module.exports.GetSalesOrderFromQuery = GetSalesOrderFromQuery;
