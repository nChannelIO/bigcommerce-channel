'use strict';

let _ = require('lodash');

module.exports = function (flowContext, payload) {
  let queryPayload = {
    remoteIDs: [payload.salesOrderRemoteID],
    page: 1,
    pageSize: 2
  };

  let invalid;
  let invalidMsg;
  let fulfillment = _.cloneDeep(payload.doc);

  return this.getSalesOrderById(flowContext, queryPayload).then(getSalesOrderResponse => {
    if (getSalesOrderResponse.statusCode === 200) {
      // Sort line items based on the address ID
      let lineItemsByAddress = _.groupBy(getSalesOrderResponse.payload[0].products, "order_address_id");
      let items = fulfillment.items;
      let matchProperty = 'sku';
      let shipments = [];

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
              delete item.sku;
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

      if (shipments.length > 1) {
        return {
          endpointStatusCode: 'N/A',
          statusCode: 400,
          errors: ['Multiple shipments were created, only one shipment can be inserted at at time.']
        };
      } else {
        fulfillment.order_address_id = shipments[0].order_address_id;
        fulfillment.items = items;

        let options = {
          uri: `${this.baseUri}/v2/orders/${payload.salesOrderRemoteID}/shipments`,
          method: "POST",
          body: fulfillment,
          resolveWithFullResponse: true
        };
        return this.request(options).then(response => {
          return {
            endpointStatusCode: 201,
            statusCode: 201,
            payload: response.body
          };
        }).catch(this.handleRejection.bind(this));
      }
    } else {
      if (getSalesOrderResponse.statusCode === 204) {
        getSalesOrderResponse.statusCode = 400;
        getSalesOrderResponse.errors = ["Unable to retrieve the corresponding sales order"];
      } else if (getSalesOrderResponse.statusCode === 206) {
        getSalesOrderResponse.statusCode = 400;
        getSalesOrderResponse.errors = ["salesOrderRemoteID does not map to a unique sales order -- more than one found"];
      }
      return getSalesOrderResponse;
    }
  }).catch(this.handleRejection.bind(this));
};
