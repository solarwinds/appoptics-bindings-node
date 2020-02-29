'use strict';

const v8 = require('v8');
const aob = require('../');
const expect = require('chai').expect;

const env = process.env;

let test;
if (env.APPOPTICS_REPORTER !== 'udp') {
  test = it.skip;
} else {
  test = it;
}

const reporter = env.APPOPTICS_REPORTER;
const endpoint = env.APPOPTICS_COLLECTOR;

const logDetails = false;
function output (...args) {
  if (logDetails) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
}


const commas = n => n.toLocaleString();
const deltas = (m1, m2) => `r ${commas(m2.rss - m1.rss)}; `
  + `x ${commas(m2.external - m1.external)}; `
  + `m ${commas(m2.malloced - m1.malloced)}}`;
const totals = m1 => `r ${commas(m1.rss)}; x ${commas(m1.external)}; m ${commas(m1.malloced)}`;

const singleBuf = makeMetabuf();

describe('reporter-metrics-memory', function () {
  const serviceKey = `${env.AO_TOKEN_PROD}:node-bindings-test`;

  before(function () {
    const status = aob.oboeInit({serviceKey, endpoint, reporter});
    // oboeInit can return -1 for already initialized or 0 if succeeded.
    // depending on whether this is run as part of a suite or standalone
    // either result is valid.
    if (status !== -1 && status !== 0) {
      throw new Error('oboeInit() failed');
    }

    const ready = aob.Reporter.isReadyToSample(5000);
    expect(ready).equal(1, `should connected to ${env.APPOPTICS_COLLECTOR} and ready`);

  });

  test('should send events without losing memory', function () {
    this.timeout(20000);

    let totalBytesSent = 0;
    const startM = mem();

    for (let i = 0; i < 1000000; i++) {
      const event = makeEvent();
      const result = aob.Event.send(event);
      if (!result.status) {
        output(result);
      }
      totalBytesSent += result.bsonSize;
    }

    const lastM = mem();
    output('before wait totals', totals(lastM));
    output('before wait delta', deltas(startM, lastM));

    return wait(1000)
      .then(() => {
        const nowM = mem();
        output('totals:', totals(nowM));
        output('deltas: start', deltas(nowM, startM), 'last', deltas(nowM, lastM));
        output('total bytes sent', commas(totalBytesSent));
        expect(nowM.rss - lastM.rss).lessThan(1500000, 'lose less than 1.5 byte per send after 1 delay');
      })
      .then(() => wait(1000))
      .then(() => {
        const nowM = mem();
        output('totals:', totals(nowM));
        output('deltas: start', deltas(nowM, startM), 'last', deltas(nowM, lastM));
        output('total bytes sent', commas(totalBytesSent));
        expect(nowM.rss - lastM.rss).lessThan(1000000, 'lose less than 1 byte per send after 2 delays');
      })
  });
})

function wait (ms = 100) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

function mem () {
  const mem = {};
  const pmem = process.memoryUsage();
  mem.rss = pmem.rss;
  mem.external = pmem.external;
  const v8mem = v8.getHeapStatistics();
  mem.malloced = v8mem.malloced_memory;

  return mem;
}

function makeEvent () {
  return {
    Layer: 'fake',
    Label: 'entry',
    _edges: [],
    kv: {
      Timestamp_u: Date.now()
    },
    mb: singleBuf, //makeMetabuf(),
  };
}

function makeMetabuf () {
  const b = Buffer.allocUnsafe(30);
  b[0] = 0x2B;
  b[29] = 0x01;
  return {buf: b};
}

