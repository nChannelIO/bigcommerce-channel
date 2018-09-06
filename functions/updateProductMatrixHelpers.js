'use strict';

module.exports = {
  getMatrixProductVariants,
  getCustomFields,
  updateProductMetafields,
  updateVariantMetafields,
  getMetafieldsWithPaging
};

function getMatrixProductVariants(payload) {
  let options = {
    uri: `${this.baseUri}/v3/catalog/products/${payload.productRemoteID}/variants?limit=250`,
    method: 'GET',
    resolveWithFullResponse: true
  };
  this.info(`Requesting [${options.method} ${options.uri}]`);
  return this.request(options).then(response => {
    this.info('Assinging Variant IDs');
    // Update product variant IDs
    payload.doc.variants.forEach(variant => {
      // Look for a match by sku - If found, set the ID for each variant
      let match = response.body.data.find(x => x.sku == variant.sku);
      if (match) {
        variant.id = match.id;
        variant.product_id = parseInt(payload.productRemoteID);
      }
    });

    // Set product ID
    payload.doc.id = parseInt(payload.productRemoteID);
  }).catch(this.handleRejection.bind(this));
}

function getCustomFields(payload) {
  if (payload.doc.custom_fields) {
    let options = {
      uri: `${this.baseUri}/v3/catalog/products/${payload.productRemoteID}/custom-fields?limit=250`,
      method: 'GET',
      resolveWithFullResponse: true
    };
    this.info(`Requesting [${options.method} ${options.uri}]`);
    return this.request(options).then(response => {
      this.info('Assinging Custom Field IDs');
      // Update product variant IDs
      payload.doc.custom_fields.forEach(custom_field => {
        // Look for a match by name - If found, set the ID for each custom field
        let match = response.body.data.find(x => x.name = custom_field.name);
        if (match) {
          custom_field.id = match.id;
        }
      });
    }).catch(this.handleRejection.bind(this));
  } else {
    return Promise.resolve();
  }
}

function updateProductMetafields(payload) {
  let options = {
    uri: `${this.baseUri}/v3/catalog/products/${payload.productRemoteID}/metafields`,
    method: 'PUT',
    resolveWithFullResponse: true
  };

  // Check for product metafields
  if (payload.doc.metafields && payload.doc.metafields.length > 0) {
    return this.getMetafieldsWithPaging(options.uri).then(metafields => {
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

            if (metafield.value !== existingMetafield.value || metafield.resource_type !== existingMetafield.resource_type || metafield.description !== existingMetafield.description) {
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
      return Promise.all(metafields.map(async metafield => {
        if (metafield.id) {
          options.uri = `${this.baseUri}/v3/catalog/products/${payload.productRemoteID}/metafields/${metafield.id}`;
          return this.request(options).then(response => {
            return response;
          });
        } else {
          return this.request(options).then(response => {
            return response;
          });
        }
      }));
    });
  } else {
    // Return if there are no metafields
    return Promise.resolve();
  }
}

function updateVariantMetafields(payload) {
  return Promise.all(payload.doc.variants.map(variant => {
    if (variant.metafields && variant.metafields.length > 0) {
      let options = {
        uri: `${this.baseUri}/v3/catalog/products/${payload.productRemoteID}/variants/${variant.id}/metafields`,
        method: 'PUT',
        resolveWithFullResponse: true
      };
      return this.getMetafieldsWithPaging(options.uri).then(metafields => {
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

              if (metafield.value !== existingMetafield.value || metafield.resource_type !== existingMetafield.resource_type || metafield.description !== existingMetafield.description) {
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
        return Promise.all(metafields.map(async metafield => {
          if (metafield.id) {
            options.uri = `${this.baseUri}/v3/catalog/products/${payload.productRemoteID}/variants/${variant.id}/metafields/${metafield.id}`;
            return this.request(options).then(response => {
              return response;
            });
          } else {
            return this.request(options).then(response => {
              return response;
            });
          }
        }));
      });
    } else {
      return Promise.resolve();
    }
  }));
}

function getMetafieldsWithPaging(uri, page = 1, result = []) {
  let metafieldOptions = {
    uri: `${uri}?page=${page}&limit=250`,
    method: 'GET',
    resolveWithFullResponse: true
  };

  return this.request(metafieldOptions).then(response => {
    result = result.concat(response.body.data);

    if (result.length === 250) {
      return this.getMetafieldsWithPaging(uri, ++page, result);
    } else {
      return result;
    }
  }).catch(this.handleRejection.bind(this));
}
