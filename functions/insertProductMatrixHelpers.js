'use strict';

module.exports = {
  insertProductMetafields,
  insertVariantMetafields
};

let options = {
  method: 'POST',
  resolveWithFullResponse: true
};

function insertProductMetafields(payload) {
  options.uri = `${this.baseUri}/v3/catalog/products/${payload.doc.id}/metafields`;

  // Check for product metafields
  if (payload.doc.metafields && payload.doc.metafields.length > 0) {
    this.info(`Requesting [${options.method} ${options.uri}]`);

    // Insert each product metafield
    return Promise.all(payload.doc.metafields.map(metafield => {
      options.body = metafield;
      return this.request(options).catch(this.handleRejection.bind(this));
    }));
  } else {
    // Return if there are no metafields
    return Promise.resolve();
  }
}

function insertVariantMetafields(payload) {
  return Promise.all(payload.doc.variants.map(variant => {
    options.uri = `${this.baseUri}/v3/catalog/products/${payload.doc.id}/variants/${variant.id}/metafields`;
    if (variant.metafields && variant.metafields.length > 0) {
      this.info(`Requesting [${options.method} ${options.uri}]`);

      // Insert each product metafield
      return Promise.all(variant.metafields.map(metafield => {
        options.body = metafield;
        return this.request(options).catch(this.handleRejection.bind(this));
      }));
    } else {
      // Return if there are no metafields
      return Promise.resolve();
    }
  }));
}
