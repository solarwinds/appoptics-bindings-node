const bindings = require('../../');
const expect = require('chai').expect;

//
// goodOptions are used in multiple tests so they're declared here
//
const goodOptions = {
  serviceKey: 'magical-service-key',
  trustedPath: 'secret-garden',
  hostnameAlias: 'incognito',
  logLevel: 3,
  reporter: 'udp',
  endpoint: 'localhost:9999',
  tokenBucketCapacity: 100,
  tokenBucketRate: 100,
  bufferSize: 100,
  //logFilePath: 'where-to-write',  // not supported by the node agent
  traceMetrics: true,
  histogramPrecision: 100,
  maxTransactions: 100,
  maxFlushWaitTime: 100,
  eventsFlushInterval: 100,
  eventsFlushBatchSize: 100,
  //oneFilePerEvent: 1,             // not supported by the node agent
  ec2MetadataTimeout: 3000,
  proxy: 'http://proxy-host:10101',
};

describe('bindings.oboeInit() memory check', function (done) {
  it('should init without losing memory', function (done) {
    // node 8, 10 completes in < 30 seconds but node 12 takes longer
    this.timeout(process.env.CI ? 100000 : 40000);
    const warmup = 1000000;
    const checkCount = 1000000;
    const options = Object.assign({}, goodOptions);

    // garbage collect if available
    const gc = typeof global.gc === 'function' ? global.gc : () => null;

    // allow the system to come to a steady state. garbage collection makes it
    // hard to isolate memory losses.
    const start1 = process.memoryUsage().rss; // eslint-disable-line no-unused-vars
    for (let i = warmup; i > 0; i--) {
      bindings.oboeInit(options);
    }

    gc();

    // now see if the code loses memory. if it's less than 1 byte per iteration
    // then it's not losing memory for all practical purposes.
    const start2 = process.memoryUsage().rss + checkCount;
    for (let i = checkCount; i > 0; i--) {
      bindings.oboeInit(options, {skipInit: true});
    }

    gc();

    const delay = process.env.CI ? 1000 : 250;

    // give garbage collection a window to kick in.
    setTimeout(function () {
      const finish = process.memoryUsage().rss;
      expect(finish).lte(start2, `should execute ${checkCount} metrics without memory growth`);
      //console.log('s1', start1, 's2', start2 - checkCount, 'fin', finish);
      done()
    }, delay);

    gc();
  })
})
