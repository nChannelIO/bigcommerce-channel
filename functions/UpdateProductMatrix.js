'use strict'

let UpdateProductMatrix = function (ncUtil, channelProfile, flowContext, payload, callback) {
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
        .then(getMatrixProductVariants)
        .then(getCustomFields)
        .then(updateProductMatrix)
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
        else if (!payload.productRemoteID)
            invalidMsg = "payload.productRemoteID was not provided";

        if (invalidMsg) {
            logError(invalidMsg);
            out.ncStatusCode = 400;
            throw new Error(`Invalid request [${invalidMsg}]`);
        }
        logInfo("Function is valid.");
    }

    async function getMatrixProductVariants() {
        headers = {
          "X-Auth-Client": channelProfile.channelAuthValues.client_id,
          "X-Auth-Token": channelProfile.channelAuthValues.access_token
        }

        logInfo(`Getting Product Matrix`);

        let response = await request.get({ url: `${channelProfile.channelSettingsValues.api_uri}/stores/${channelProfile.channelAuthValues.store_hash}/v3/catalog/products/${payload.productRemoteID}/variants`, headers: headers, json: true, resolveWithFullResponse: true  })
          .then ((response) => {
<<<<<<< HEAD
            logInfo('Assinging Variant IDs');
            // Update product variant IDs
            payload.doc.variants.forEach(variant => {
              // Look for a match by sku - If found, set the ID for each variant
=======
            payload.doc.variants.forEach(variant => {
>>>>>>> 604b2637e86de1603829f02ddd308a92b29fba4a
              let match = response.body.data.find(x => x.sku = variant.sku);
              if (match) {
                variant.id = match.id;
                variant.product_id = payload.productRemoteID;
              }
            });
<<<<<<< HEAD

            // Set product ID
=======
>>>>>>> 604b2637e86de1603829f02ddd308a92b29fba4a
            payload.doc.id = payload.productRemoteID;
          })
          .catch((err) => { throw err; });
    }

    async function getCustomFields() {
<<<<<<< HEAD
        if (payload.doc.custom_fields) {
          logInfo(`Getting Custom Fields`);
          let response = await request.get({ url: `${channelProfile.channelSettingsValues.api_uri}/stores/${channelProfile.channelAuthValues.store_hash}/v3/catalog/products/${payload.productRemoteID}/custom-fields`, headers: headers, json: true, resolveWithFullResponse: true  })
            .then ((response) => {
              logInfo('Assinging Custom Field IDs');
              // Update custom field IDs
              payload.doc.custom_fields.forEach(custom_field => {
                // Look for a match by name - If found, set the ID for each custom field
=======
        logInfo(`Getting Custom Fields`);

        if (payload.doc.custom_fields) {
          let response = await request.get({ url: `${channelProfile.channelSettingsValues.api_uri}/stores/${channelProfile.channelAuthValues.store_hash}/v3/catalog/products/${payload.productRemoteID}/custom-fields`, headers: headers, json: true, resolveWithFullResponse: true  })
            .then ((response) => {
              payload.doc.custom_fields.forEach(custom_field => {
>>>>>>> 604b2637e86de1603829f02ddd308a92b29fba4a
                let match = response.body.data.find(x => x.name = custom_field.name);
                if (match) {
                  custom_field.id = match.id;
                }
              });
            })
            .catch((err) => { throw err; });
        }
    }

    async function updateProductMatrix() {
        logInfo(`Updating Product Matrix`);

<<<<<<< HEAD
        // Update Product
=======
>>>>>>> 604b2637e86de1603829f02ddd308a92b29fba4a
        let response = await request.put({ url: `${channelProfile.channelSettingsValues.api_uri}/stores/${channelProfile.channelAuthValues.store_hash}/v3/catalog/products/${payload.productRemoteID}`, body: payload.doc, headers: headers, json: true, resolveWithFullResponse: true  })
          .catch((err) => { throw err; });

        await Promise.all([
<<<<<<< HEAD
          // Update metafields
          updateProductMetafields(),
          updateVariantMetafields()
        ]).catch((err) => {
          throw err;
        });
=======
          updateProductMetafields(),
          updateVariantMetafields()
        ]);
>>>>>>> 604b2637e86de1603829f02ddd308a92b29fba4a

        return response;
    }

    async function getMetafieldsWithPaging(url, page = 1, result = []) {
      let pageSize = 250;
      logInfo(`Getting Metafields - Page ${page}`);
      let response = await request.get({ url: `${url}?page=${page}&limit=${pageSize}`, headers: headers, json: true, resolveWithFullResponse: true  })
        .catch((err) => { throw err; });

      result = result.concat(response.body.data);

      if (result.length === pageSize) {
        return getMetafieldsWithPaging(options, uri, ++page, result);
      } else {
        return result;
      }
    }

    async function updateProductMetafields() {
<<<<<<< HEAD
      logInfo('Processing Product Metafields');
=======

>>>>>>> 604b2637e86de1603829f02ddd308a92b29fba4a
      let url = `${channelProfile.channelSettingsValues.api_uri}/stores/${channelProfile.channelAuthValues.store_hash}/v3/catalog/products/${payload.productRemoteID}/metafields`;

      if (payload.doc.metafields && payload.doc.metafields.length > 0) {
        return getMetafieldsWithPaging(url).then(metafields => {
          // Determine which metafields need updated/inserted
          return payload.doc.metafields.reduce((metafieldsForUpdate, metafield) => {
            let match = false;

            // Loop through all existing metafields looking for a match
            for (let i = 0; i < metafields.length; i++) {
              let existingMetafield = metafields[i];
              if (metafield.namespace === existingMetafield.namespace && metafield.key === existingMetafield.key) {
                // It's a match
                match = true;
                // Remove it to speed up future iterations
                metafields.splice(i, 1);

<<<<<<< HEAD
                if (metafield.value !== existingMetafield.value || metafield.resource_type !== existingMetafield.resource_type || metafield.description !== existingMetafield.description) {
=======
                if (metafield.value !== existingMetafield.value || metafield.value_type !== existingMetafield.value_type || metafield.description !== existingMetafield.description) {
>>>>>>> 604b2637e86de1603829f02ddd308a92b29fba4a
                  // It needs updated
                  metafield.id = existingMetafield.id;
                  metafieldsForUpdate.push(metafield);
                }
                break;
              }
            }

            if (!match) {
              // It needs inserted
              metafieldsForUpdate.push(metafield);
            }

            return metafieldsForUpdate;
          }, []);
        }).then(metafields => {
          // Update the metafields
<<<<<<< HEAD
          logInfo(`Updating Product Metafields`);
=======
>>>>>>> 604b2637e86de1603829f02ddd308a92b29fba4a
          return Promise.all(metafields.map(async metafield => {
            if (metafield.id) {
              let response = await request.put({ url: `${channelProfile.channelSettingsValues.api_uri}/stores/${channelProfile.channelAuthValues.store_hash}/v3/catalog/products/${payload.productRemoteID}/metafields/${metafield.id}`, body: metafield, headers: headers, json: true, resolveWithFullResponse: true  })
                .catch((err) => { throw err; });

              return response;
            } else {
              let response = await request.post({ url: `${channelProfile.channelSettingsValues.api_uri}/stores/${channelProfile.channelAuthValues.store_hash}/v3/catalog/products/${payload.productRemoteID}/metafields`, body: metafield, headers: headers, json: true, resolveWithFullResponse: true  })
                .catch((err) => { throw err; });

              return response;
            }
          }));
        });
      } else {
        return Promise.resolve();
      }
    }

    async function updateVariantMetafields() {
      return Promise.all(payload.doc.variants.map(variant => {

        let url = `${channelProfile.channelSettingsValues.api_uri}/stores/${channelProfile.channelAuthValues.store_hash}/v3/catalog/products/${payload.productRemoteID}/variants/${variant.id}/metafields`;

        if (variant.metafields && variant.metafields.length > 0) {
<<<<<<< HEAD
          logInfo(`Processing Variant Metafields for Variant with ID: ${variant.id}`);
=======
>>>>>>> 604b2637e86de1603829f02ddd308a92b29fba4a
          return getMetafieldsWithPaging(url).then(metafields => {
            // Determine which metafields need updated/inserted
            return variant.metafields.reduce((metafieldsForUpdate, metafield) => {
              let match = false;

              // Loop through all existing metafields looking for a match
              for (let i = 0; i < metafields.length; i++) {
                let existingMetafield = metafields[i];
                if (metafield.namespace === existingMetafield.namespace && metafield.key === existingMetafield.key) {
                  // It's a match
                  match = true;
                  // Remove it to speed up future iterations
                  metafields.splice(i, 1);

<<<<<<< HEAD
                  if (metafield.value !== existingMetafield.value || metafield.resource_type !== existingMetafield.resource_type || metafield.description !== existingMetafield.description) {
=======
                  if (metafield.value !== existingMetafield.value || metafield.value_type !== existingMetafield.value_type || metafield.description !== existingMetafield.description) {
>>>>>>> 604b2637e86de1603829f02ddd308a92b29fba4a
                    // It needs updated
                    metafield.id = existingMetafield.id;
                    metafieldsForUpdate.push(metafield);
                  }
                  break;
                }
              }

              if (!match) {
                // It needs inserted
                metafieldsForUpdate.push(metafield);
              }

              return metafieldsForUpdate;
            }, []);
          }).then(metafields => {
            // Update the metafields
<<<<<<< HEAD
            logInfo(`Updating Variant Metafields`);
=======
>>>>>>> 604b2637e86de1603829f02ddd308a92b29fba4a
            return Promise.all(metafields.map(async metafield => {
              if (metafield.id) {
                let response = await request.put({ url: `${channelProfile.channelSettingsValues.api_uri}/stores/${channelProfile.channelAuthValues.store_hash}/v3/catalog/products/${payload.productRemoteID}/metafields/${metafield.id}`, body: metafield, headers: headers, json: true, resolveWithFullResponse: true  })
                  .catch((err) => { throw err; });

                return response;
              } else {
                let response = await request.post({ url: `${channelProfile.channelSettingsValues.api_uri}/stores/${channelProfile.channelAuthValues.store_hash}/v3/catalog/products/${payload.productRemoteID}/metafields`, body: metafield, headers: headers, json: true, resolveWithFullResponse: true  })
                  .catch((err) => { throw err; });

                return response;
              }
            }));
          });
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
            productBusinessReference: nc.extractBusinessReference(channelProfile.productBusinessReferences, response.body.data)
          }

          out.ncStatusCode = 200;
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

module.exports.UpdateProductMatrix = UpdateProductMatrix;
