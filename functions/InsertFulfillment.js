'use strict'

let InsertFulfillment = function (ncUtil, channelProfile, flowContext, payload, callback) {
    const request = require('request-promise');
    const jsonata = require('jsonata');
    const nc = require('../util/common');
    const _ = require('lodash');

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
        .then(getSalesOrder)
        .then(processLineItems)
        .then(insertFulfillment)
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
        else if (!channelProfile.fulfillmentBusinessReferences)
            invalidMsg = "channelProfile.fulfillmentBusinessReferences was not provided";
        else if (!nc.isArray(channelProfile.fulfillmentBusinessReferences))
            invalidMsg = "channelProfile.fulfillmentBusinessReferences is not an array";
        else if (!nc.isNonEmptyArray(channelProfile.fulfillmentBusinessReferences))
            invalidMsg = "channelProfile.fulfillmentBusinessReferences is empty";
        else if (!payload)
            invalidMsg = "payload was not provided";
        else if (!payload.doc)
            invalidMsg = "payload.doc was not provided";
        else if (!payload.salesOrderRemoteID)
            invalidMsg = "payload.salesOrderRemoteID was not provided";

        if (invalidMsg) {
            logError(invalidMsg);
            out.ncStatusCode = 400;
            throw new Error(`Invalid request [${invalidMsg}]`);
        }
        logInfo("Function is valid.");
    }

    async function getSalesOrder(page = 1) {
        let pageSize = 250;
        headers = {
          "X-Auth-Client": channelProfile.channelAuthValues.client_id,
          "X-Auth-Token": channelProfile.channelAuthValues.access_token
        }

        // Lookup products for sales order
        logInfo(`Looking up Line Items with page of ${page} for Sales Order: ${payload.salesOrderRemoteID}`);
        let response = await request.get({ url: `${channelProfile.channelSettingsValues.api_uri}/stores/${channelProfile.channelAuthValues.store_hash}/v2/orders/${payload.salesOrderRemoteID}/products?page=${page}&limit=${pageSize}`, headers: headers, json: true, resolveWithFullResponse: true  })
          .catch((err) => { throw err; });

        if (response.body && response.body.length == pageSize) {
          let pagedOrders = await getSalesOrder(page+1);
          if (pagedOrders.body && pagedOrders.body.length > 0) {
            response.body = response.body.concat(pagedOrders.body);
            return response;
          }
        }

        return response;
    }

    // Pulling addresses doesn't seem necessary unless we have the address information coming in with the fulfillment doc

    // async function getShippingAddresses() {
    //     logInfo(`Looking up Shipping Addresses for Sales Order: ${payload.salesOrderRemoteID}`);
    //     let response = await request.get({ url: `${channelProfile.channelSettingsValues.api_uri}/stores/${channelProfile.channelAuthValues.store_hash}/v2/orders/${payload.salesOrderRemoteID}/shipping_addresses`, headers: headers, json: true, resolveWithFullResponse: true  })
    //       .catch((err) => { throw err; });
    //
    //     return response.body;
    // }

    async function processLineItems(response) {
        if (response.statusCode === 200 && response.body) {
            // Sort line items based on the address ID
            let lineItemsByAddress = _.groupBy(response.body, "order_address_id");
            let items = payload.doc.items;
            let matchProperty = 'sku';
            let shipments = [];
            // let shippingAddresses = await getShippingAddresses();

            // Loop through each order_address_id
            Object.keys(lineItemsByAddress).forEach((key) => {
              // Get line items by the current order_address_id
              let lineItems = lineItemsByAddress[key];
              let shipment = {
                order_address_id: key,
                items: []
              };

              // Loop through each item under the payload
              items.forEach((item) => {
                // Loop through each line item under the current order_address_id
                for (let i = 0; i < lineItems.length; i++) {
                  let itemFound = false;

                  // Match against the 'sku' property
                  if (item[matchProperty] === lineItems[i][matchProperty] && !itemFound) {
                    // If found, set the order_product_id on the payload item to the line item product id
                    item.order_product_id = lineItems[i].id;
                    itemFound = true;

                    // Check the quantity
                    if (item.quantity) {
                      if (item.quantity > lineItems[i].quantity) {
                        // If payload item quantity is greater than the line item quantity
                        // Create a copy and subtract the line item quantity from the payload quantity
                        let newLineItem = _.cloneDeep(item);
                        newLineItem.quantity = lineItems[i].quantity;
                        item.quantity -= lineItems[i].quantity;
                        lineItems[i].quantity = 0;

                        let processedItem = Object.assign({}, newLineItem);
                        delete processedItem.sku;

                        shipment.items.push(processedItem);
                      } else {
                        // Set the quantity
                        item.quantity = lineItems[i].quantity;
                        let processedItem = Object.assign({}, item);
                        delete processedItem.sku;

                        shipment.items.push(processedItem);
                        break;
                      }

                    } else {
                      // Fulfill all items
                      item.quantity = lineItems[i].quantity;
                      let processedItem = Object.assign({}, item);
                      delete processedItem.sku;

                      shipment.items.push(_.cloneDeep(processedItem));
                    }
                  }
                }
              });

              if (shipment.items.length > 0) {
                shipments.push(shipment);
              }
            });

            return shipments;
        } else {
            logError("Sales order was not successfully retrieved");
            throw new Error("Sales order was not successfully retrieved");
        }
    }

    async function insertFulfillment(fulfillments) {
        let response;
        logInfo(`Inserting Fulfillments for Sales Order: ${payload.salesOrderRemoteID}`);

        // Insert each fulfillment created for each address (defined by order_address_id)
        for (let i = 0; i < fulfillments.length; i++) {
          if (fulfillments[i].items && fulfillments[i].items.length > 0) {
            response = await request.post({ url: `${channelProfile.channelSettingsValues.api_uri}/stores/${channelProfile.channelAuthValues.store_hash}/v2/orders/${payload.salesOrderRemoteID}/shipments`, body: fulfillments[i], headers: headers, json: true, resolveWithFullResponse: true  })
              .catch((err) => { throw err; });

            // Return most recent response after all fulfillments are inserted
            if (i == fulfillments.length - 1) {
              return response;
            }
          } else {
            logInfo(`Fulfillment with order_address_id of ${fulfillments[i].order_address_id} has no items to be fulfilled`);
          }
        }

        // If no fulfillments were inserted, return an error
        if (!response) {
          logError('No fulfillments were inserted into Bigcommerce')
          throw new Error('No fulfillments were inserted into Bigcommerce');
        }
    }

    async function buildResponse(response) {
        out.response.endpointStatusCode = response.statusCode;
        out.response.endpointStatusMessage = response.statusMessage;

        if (response.statusCode === 201 && response.body) {
          out.payload = {
            doc: response.body,
            fulfillmentRemoteID: response.body.id,
            fulfillmentBusinessReference: nc.extractBusinessReference(channelProfile.fulfillmentBusinessReferences, response.body),
            salesOrderRemoteID: payload.salesOrderRemoteID
          };

          out.ncStatusCode = 201;
        } else if (response.statusCode === 429) {
          out.ncStatusCode = 429;
          out.payload.error = response.body;
        } else if (response.statusCode === 500) {
          out.ncStatusCode = 500;
          out.payload.error = response.body;
        } else {
          out.ncStatusCode = 400;
          out.payload.error = response.body;
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

module.exports.InsertFulfillment = InsertFulfillment;
