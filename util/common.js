'use strict';

const jsonata = require('jsonata');

function log(msg, level = "info") {
    let prefix = `${new Date().toISOString()} [${level}]`;
    console.log(`${prefix} | ${msg}`);
};

function extractBusinessReference(businessReferences, doc) {
  const _get = require("lodash.get");

  if (!businessReferences || !Array.isArray(businessReferences)) {
    throw new Error('Error: businessReferences must be an Array');
  } else if (!doc || typeof doc !== 'object') {
    throw new Error('Error: doc must be an object');
  }

  let values = [];

  // Get the businessReference
  businessReferences.forEach(function(businessReference) {
      values.push(_get(doc, businessReference));
  });

  return values.join(".");
};

function isFunction(func) {
    return typeof func === "function";
}

function isString(str) {
    return typeof str === "string";
}

function isObject(obj) {
    return typeof obj === "object" && obj != null && !isArray(obj) && !isFunction(obj);
}

function isNonEmptyObject(obj) {
    return isObject(obj) && Object.keys(obj).length > 0;
}

function isArray(arr) {
    return Array.isArray(arr);
}

function isNonEmptyArray(arr) {
    return isArray(arr) && arr.length > 0;
}

function isNumber(num) {
    return parseInt(num, 10) && !isNaN(num);
}

function isInteger(int) {
    return isNumber(int) && int % 1 === 0;
}

module.exports = { log, extractBusinessReference, isFunction, isString, isObject, isNonEmptyObject, isArray, isNonEmptyArray, isNumber, isInteger };
