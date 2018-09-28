'use strict';

let requestErrors = require('request-promise/errors');
let Channel = require('@nchannel/endpoint-sdk').PromiseChannel;
let nc = require('./util/common');

class bigcommerce_channel extends Channel {
  constructor(...args) {
    super(...args);

    this.validateChannelProfile();
    this.nc = nc;

    let headers = {
      "X-Auth-Client": this.channelProfile.channelAuthValues.client_id,
      "X-Auth-Token": this.channelProfile.channelAuthValues.access_token
    }

    this.request = this.request.defaults({headers: headers, json: true});

    this.baseUri = `${this.channelProfile.channelSettingsValues.api_uri}/stores/${this.channelProfile.channelAuthValues.store_hash}`;
  }

  async extractCustomerAddressesFromCustomer(...args) {
    return require('./functions/extractCustomerAddressesFromCustomer').bind(this)(...args);
  }

  async getSalesOrderById(...args) {
    return require('./functions/getSalesOrderById').bind(this)(...args);
  }

  async getSalesOrderByCreatedTimeRange(...args) {
    return require('./functions/getSalesOrderByCreatedTimeRange').bind(this)(...args);
  }

  async getSalesOrderByModifiedTimeRange(...args) {
    return require('./functions/getSalesOrderByModifiedTimeRange').bind(this)(...args);
  }

  async getCustomerById(...args) {
    return require('./functions/getCustomerById').bind(this)(...args);
  }

  async getCustomerByCreatedTimeRange(...args) {
    return require('./functions/getCustomerByCreatedTimeRange').bind(this)(...args);
  }

  async getCustomerByModifiedTimeRange(...args) {
    return require('./functions/getCustomerByModifiedTimeRange').bind(this)(...args);
  }

  async getProductMatrixById(...args) {
    return require('./functions/getProductMatrixById').bind(this)(...args);
  }

  async getProductMatrixByCreatedTimeRange(...args) {
    return require('./functions/getProductMatrixByCreatedTimeRange').bind(this)(...args);
  }

  async getProductMatrixByModifiedTimeRange(...args) {
    return require('./functions/getProductMatrixByModifiedTimeRange').bind(this)(...args);
  }

  async getProductPricingById(...args) {
    return require('./functions/getProductPricingById').bind(this)(...args);
  }

  async getProductPricingByCreatedTimeRange(...args) {
    return require('./functions/getProductPricingByCreatedTimeRange').bind(this)(...args);
  }

  async getProductPricingByModifiedTimeRange(...args) {
    return require('./functions/getProductPricingByModifiedTimeRange').bind(this)(...args);
  }

  async getProductQuantityById(...args) {
    return require('./functions/getProductQuantityById').bind(this)(...args);
  }

  async getProductQuantityByCreatedTimeRange(...args) {
    return require('./functions/getProductQuantityByCreatedTimeRange').bind(this)(...args);
  }

  async getProductQuantityByModifiedTimeRange(...args) {
    return require('./functions/getProductQuantityByModifiedTimeRange').bind(this)(...args);
  }

  async insertCustomer(...args) {
    return require('./functions/insertCustomer').bind(this)(...args);
  }

  async insertCustomerAddress(...args) {
    return require('./functions/insertCustomerAddress').bind(this)(...args);
  }

  async insertFulfillment(...args) {
    return require('./functions/insertFulfillment').bind(this)(...args);
  }

  async insertProductMatrix(...args) {
    return require('./functions/insertProductMatrix').bind(this)(...args);
  }

  async updateCustomer(...args) {
    return require('./functions/updateCustomer').bind(this)(...args);
  }

  async updateCustomerAddress(...args) {
    return require('./functions/updateCustomerAddress').bind(this)(...args);
  }

  async updateProductMatrix(...args) {
    return require('./functions/updateProductMatrix').bind(this)(...args);
  }

  async updateProductPricing(...args) {
    return require('./functions/updateProductPricing').bind(this)(...args);
  }

  async updateProductQuantity(...args) {
    return require('./functions/updateProductQuantity').bind(this)(...args);
  }

  validateChannelProfile() {
    let errors = [];
    if (!this.channelProfile)
        errors.push("channelProfile was not provided");
    if (!this.channelProfile.channelSettingsValues)
        errors.push("channelProfile.channelSettingsValues was not provided");
    if (!this.channelProfile.channelSettingsValues.api_uri)
        errors.push("channelProfile.channelSettingsValues.api_uri was not provided");
    if (!this.channelProfile.channelAuthValues)
        errors.push("channelProfile.channelAuthValues was not provided");
    if (!this.channelProfile.channelAuthValues.store_hash)
        errors.push("channelProfile.channelAuthValues.store_hash was not provided");
    if (!this.channelProfile.channelAuthValues.access_token)
        errors.push("channelProfile.channelAuthValues.access_token was not provided");
    if (!this.channelProfile.channelAuthValues.client_id)
        errors.push("channelProfile.channelAuthValues.client_id was not provided");
    if (errors.length > 0)
        throw new Error(`Channel profile validation failed: ${errors}`);
  }

  handleRejection(reason) {
    if (reason instanceof requestErrors.StatusCodeError) {
      return this.handleStatusCodeError(reason);
    } else if (reason instanceof requestErrors.RequestError) {
      return this.handleRequestError(reason);
    } else {
      return this.handleOtherError(reason);
    }
  }

  handleStatusCodeError(reason) {
    this.error(`The endpoint returned an error status code: ${reason.statusCode} error: ${reason.message}`);

    let out = {
      endpointStatusCode: reason.statusCode,
      errors: [JSON.stringify(reason.message)]
    };

    if (reason.statusCode === 429) {
      out.statusCode = 429;
    } else if (reason.statusCode >= 500) {
      out.statusCode = 500;
    } else if (reason.statusCode === 404) {
      out.statusCode = 404;
    } else if (reason.statusCode === 422) {
      out.statusCode = 400;
    } else {
      out.statusCode = 400;
    }

    return Promise.reject(out);
  }

  handleRequestError(reason) {
    this.error(`The request failed: ${reason.error}`);

    let out = {
      endpointStatusCode: 'N/A',
      statusCode: 500,
      errors: [reason.error]
    };

    return Promise.reject(out);
  }

  handleOtherError(reason) {
    if (!reason || !reason.statusCode || !reason.errors) {
      let out = {
        statusCode: 500,
        errors: [reason  || 'Rejection without reason']
      };
      return Promise.reject(out);
    } else {
      return Promise.reject(reason);
    }
  }

  formatGetResponse(items, pageSize, endpointStatusCode = 'N/A') {
    return {
      endpointStatusCode: endpointStatusCode,
      statusCode: items.length === pageSize ? 206 : (items.length > 0 ? 200 : 204),
      payload: items
    };
  }

  queryOrders(...args) {
    return require('./functions/getSalesOrderHelpers').queryOrders.bind(this)(...args);
  }

  queryOrderInfo(...args) {
    return require('./functions/getSalesOrderHelpers').queryOrderInfo.bind(this)(...args);
  }

  async processOrder(...args) {
    return require('./functions/getSalesOrderHelpers').processOrder.bind(this)(...args);
  }

  queryCustomer(...args) {
    return require('./functions/getCustomerHelpers').queryCustomer.bind(this)(...args);
  }

  queryCustomers(...args) {
    return require('./functions/getCustomerHelpers').queryCustomers.bind(this)(...args);
  }

  queryProduct(...args) {
    return require('./functions/getProductMatrixHelpers').queryProduct.bind(this)(...args);
  }

  queryProducts(...args) {
    return require('./functions/getProductMatrixHelpers').queryProducts.bind(this)(...args);
  }

  queryProductPricings(...args) {
    return require('./functions/getProductPricingHelpers').queryProductPricings.bind(this)(...args);
  }

  queryProductPricing(...args) {
    return require('./functions/getProductPricingHelpers').queryProductPricing.bind(this)(...args);
  }

  queryProductQuantities(...args) {
    return require('./functions/getProductQuantityHelpers').queryProductQuantities.bind(this)(...args);
  }

  queryProductQuantity(...args) {
    return require('./functions/getProductQuantityHelpers').queryProductQuantity.bind(this)(...args);
  }

  insertProductMetafields(...args) {
    return require('./functions/insertProductMatrixHelpers').insertProductMetafields.bind(this)(...args);
  }

  insertVariantMetafields(...args) {
    return require('./functions/insertProductMatrixHelpers').insertVariantMetafields.bind(this)(...args);
  }

  getMatrixProductVariants(...args) {
    return require('./functions/updateProductMatrixHelpers').getMatrixProductVariants.bind(this)(...args);
  }

  getCustomFields(...args) {
    return require('./functions/updateProductMatrixHelpers').getCustomFields.bind(this)(...args);
  }

  updateProductMetafields(...args) {
    return require('./functions/updateProductMatrixHelpers').updateProductMetafields.bind(this)(...args);
  }

  updateVariantMetafields(...args) {
    return require('./functions/updateProductMatrixHelpers').updateVariantMetafields.bind(this)(...args);
  }

  getMetafieldsWithPaging(...args) {
    return require('./functions/updateProductMatrixHelpers').getMetafieldsWithPaging.bind(this)(...args);
  }
}

module.exports = bigcommerce_channel;
