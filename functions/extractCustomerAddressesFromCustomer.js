
'use strict';

module.exports = function (flowContext, payload) {
  let out = {};

  if (payload.doc.addresses) {
    out.payload = payload.doc.addresses;
    out.statusCode = 200;
  } else {
    out.statusCode = 204;
  }

  return out;
};
