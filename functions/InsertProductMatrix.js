'use strict'

let InsertProductMatrix = function (ncUtil, channelProfile, flowContext, payload, callback) {
    const request = require('request-promise');
    const jsonata = require('jsonata');
    const nc = require('../util/common');
    const _ = require('lodash');

    let out = {
        ncStatusCode: null,
        payload: {},
        response: {}
    };

    let headers = {};

    if (!callback) {
        throw new Error("A callback function was not provided");
    } else if (typeof callback !== 'function') {
        throw new TypeError("callback is not a function")
    }

    validateFunction()
        .then(insertProductMatrix)
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
        else if (!channelProfile.productBusinessReferences)
            invalidMsg = "channelProfile.productBusinessReferences was not provided";
        else if (!nc.isArray(channelProfile.productBusinessReferences))
            invalidMsg = "channelProfile.productBusinessReferences is not an array";
        else if (!nc.isNonEmptyArray(channelProfile.productBusinessReferences))
            invalidMsg = "channelProfile.productBusinessReferences is empty";
        else if (!payload)
            invalidMsg = "payload was not provided";
        else if (!payload.doc)
            invalidMsg = "payload.doc was not provided";

        if (invalidMsg) {
            logError(invalidMsg);
            out.ncStatusCode = 400;
            throw new Error(`Invalid request [${invalidMsg}]`);
        }
        logInfo("Function is valid.");
    }

    async function insertProductMatrix() {
        let updatedPayload;
        let response;
        headers = {
          "X-Auth-Client": channelProfile.channelAuthValues.client_id,
          "X-Auth-Token": channelProfile.channelAuthValues.access_token
        }

        logInfo(`Inserting Product Matrix`);

        await request.post({ url: `${channelProfile.channelSettingsValues.api_uri}/stores/${channelProfile.channelAuthValues.store_hash}/v3/catalog/products`, body: payload.doc, headers: headers, json: true, resolveWithFullResponse: true  })
          .then(result => {
            updatedPayload = _.cloneDeep(payload);
            updatedPayload.doc.variants.forEach(variant => {
              let match = result.body.data.variants.find(x => x.sku = variant.sku);
              if (match) {
                variant.id = match.id;
                variant.product_id = result.body.id;
              }
            });

            response = result;
          })
          .catch((err) => { throw err; });

        await Promise.all([
          insertProductMetafields(updatedPayload),
          insertVariantMetafields(updatedPayload)
        ]).catch((err) => {
          throw err;
        });

        return response;
    }

    async function insertProductMetafields(payload) {
      if (payload.doc.metafields && payload.doc.metafields.length > 0) {
        return Promise.all(payload.doc.metafields.map(async metafield => {
          let response = await request.post({ url: `${channelProfile.channelSettingsValues.api_uri}/stores/${channelProfile.channelAuthValues.store_hash}/v3/catalog/products/${payload.doc.id}/metafields`, body: metafield, headers: headers, json: true, resolveWithFullResponse: true  })
            .catch((err) => { throw err; });

          return response;
        }));
      } else {
        return Promise.resolve();
      }
    }

    async function insertVariantMetafields(payload) {
      return Promise.all(payload.doc.variants.map(variant => {
        if (variant.metafields && variant.metafields.length > 0) {
          return Promise.all(variant.metafields.map(async metafield => {
            let response = await request.post({ url: `${channelProfile.channelSettingsValues.api_uri}/stores/${channelProfile.channelAuthValues.store_hash}/v3/catalog/products/${payload.doc.id}/variants/${variant.id}/metafields`, body: metafield, headers: headers, json: true, resolveWithFullResponse: true  })
              .catch((err) => { throw err; });

            return response;
          }));
        } else {
          return Promise.resolve();
        }
      }));
    }

    async function buildResponse(response) {
        out.response.endpointStatusCode = response.statusCode;
        out.response.endpointStatusMessage = response.statusMessage;

        if (response.statusCode === 200 && response.body && response.body.data) {
          out.payload = {
            doc: response.body.data,
            productRemoteID: response.body.data.id,
            productBusinessReference: nc.extractBusinessReference(channelProfile.productBusinessReferences, response.body.data)
          }

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

module.exports.InsertProductMatrix = InsertProductMatrix;
