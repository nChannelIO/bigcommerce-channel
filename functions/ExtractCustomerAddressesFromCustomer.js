'use strict'

let ExtractCustomerAddressesFromCustomer = function (ncUtil, channelProfile, flowContext, payload, callback) {
    const nc = require('../util/common');

    let out = {
        ncStatusCode: null,
        payload: {}
    };

    if (!callback) {
        throw new Error("A callback function was not provided");
    } else if (typeof callback !== 'function') {
        throw new TypeError("callback is not a function")
    }

    validateFunction()
        .then(extractCustomerAddresses)
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
        else if (!channelProfile.customerBusinessReferences)
            invalidMsg = "channelProfile.customerBusinessReferences was not provided";
        else if (!nc.isArray(channelProfile.customerBusinessReferences))
            invalidMsg = "channelProfile.customerBusinessReferences is not an array";
        else if (!nc.isNonEmptyArray(channelProfile.customerBusinessReferences))
            invalidMsg = "channelProfile.customerBusinessReferences is empty";
        else if (!payload)
            invalidMsg = "payload was not provided";
        else if (!payload.doc)
            invalidMsg = "payload.doc was not provided";
        else if (!payload.customerRemoteID)
            invalidMsg = "payload.customerRemoteID was not provided";
        else if (!payload.doc.addresses)
            invalidMsg = "Addresses Not Found: The customer has no addresses (payload.doc.addresses)";

        if (invalidMsg) {
            logError(invalidMsg);
            out.ncStatusCode = 400;
            throw new Error(`Invalid request [${invalidMsg}]`);
        }
        logInfo("Function is valid.");
    }

    async function extractCustomerAddresses() {
        let data = payload.doc.addresses;

        if (data.length > 0) {
          out.payload = [];

          data.forEach((address) => {
              let payloadElement = {
                doc: address,
                customerRemoteID: payload.customerRemoteID,
                customerBusinessReference: payload.customerBusinessReference
              };
              out.payload.push(payloadElement);
          });
          out.ncStatusCode = 200;
        } else {
          logInfo("No customer addresses found");
          out.ncStatusCode = 204;
        }
    }

    async function handleError(error) {
        logError(error);
        out.payload.error = error;
        out.ncStatusCode = out.ncStatusCode || 500;
    }
}
module.exports.ExtractCustomerAddressesFromCustomer = ExtractCustomerAddressesFromCustomer;
