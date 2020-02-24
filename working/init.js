'use strict';

// simple script that can be used in the repl.
const aob = require('./index.js');
aob.oboeInit({
  serviceKey: process.env.APPOPTICS_SERVICE_KEY,
  reporter: process.env.APPOPTICS_REPORTER,
  endpoint: process.env.APPOPTICS_COLLECTOR,
});
