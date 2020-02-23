'use strict';

const crypto = require('crypto');

class Metadata {
  // take a raw buffer and convert it into a metadata object
  // for easier formatting?
  constructor (opts = {}) {
    this.buffer = Buffer.allocUnsafe(30);
    this.xtrace = this.buffer;
    this.buffer[0] = 0x2b;
    //this.header = this.buffer.subarray(0, 1);
    this.traceId = this.buffer.subarray(1, 21);
    this.eventId = this.buffer.subarray(21, 29);
    //this.flags = this.buffer.subarray(29, 30);
    this.buffer[29] = 0x00;

    Object.defineProperties(this, {
      header: {
        enumerable: true,
        get () {return this.buffer[0]},
        set (value) {this.buffer[0] = value},
      },
      flags: {
        enumerable: true,
        get () {return this.buffer[29]},
        set (value) {this.buffer[29] = value},
      }
    });
  }
}

Metadata.make = function (buffer) {
  const md = Buffer.allocUnsafe(30);
  md[0] = 0x2b;
  md[29] = 0x00;
  return md;
}

class MetadataFactory {
  constructor (opts = {}) {
    this.outstanding = 0;        // number async random fills requested but not filled

    this.max = 10;               // maximum prebuilt metadata
    if ('max' in opts) this.max = opts.max;
    this.available = [];         // prebuilt metadata
    this.maxLength = 0;          // high water mark of prebuilt metadata

    this.asyncCount = 0;         // number of metadata filled asynchronously
    this.syncCount = 0;          // number of metadata filled synchronously (available was empty)

    this.runTraceIdFactory();
  }

  getTraceId () {
    // make metadata (2b)(task/trace id)(event/op id)(flags) - all random.
    // takes from queue of background generated or generates sync.
    // relatively small pool of these - one per trace
    // fetches using runTraceIdFactory() below
  }

  getEventId () {
    // return an unused event/op id.
    // takes from queue of background generated ids or generates one sync.
    // relatively large pool of these - 10s to 100s per trace
    // uses runEventIdFactory(), similar to runTraceIdFactory() below
  }

  runTraceIdFactory () {
    // don't exceed the maximum number of prebuilt metadata.
    if (this.available.length + this.outstanding >= this.max) {
      return;
    }
    const md = {buffer: Metadata.make()};
    //const md = new Metadata();

    this.outstanding += 1;
    crypto.randomFill(md.buffer, 1, 28, (err, buf) => {
      this.outstanding -= 1;
      // this is very serious - not sure what to do. probably don't throw
      // just make up something and hope.
      if (err) {
        throw err;
      }
      this.available.push(md);

      if (this.available.length > this.maxLength) {
        this.maxLength = this.available.length;
      }
      this.asyncCount += 1;
      if (this.available.length + this.outstanding < this.max) {
        this.runTraceIdFactory();
      }
    });
  }

  getRandom (sampleBit) {
    let md;
    // if there is a prebuilt metadata around use. otherwise grab one synchronously.
    if (this.available.length) {
      // make this an MRU cache so hopefully GC can pick up pieces in the
      // short-lived heap.
      md = this.available.pop();
      this.runTraceIdFactory();
    } else {
      //md = new Metadata();
      md = {buffer: Metadata.make()};
      crypto.randomFillSync(md.buffer, 1, 28);
      this.syncCount += 1;
    }

    if (sampleBit) {
      md.flags = 1;
    }
    return md;
  }
}

if (module.parent) {
  module.exports = {
    Metadata,
    MetadataFactory,
  };
  return;
}

const r = new MetadataFactory();

/* eslint-disable no-console */
const formatted = [];
let n = 0;
const id = setInterval(function () {
  const md = r.getRandom(n++ & 1);
  formatted.push(md.buffer.toString('hex'));

  if (n > 10) {
    clearInterval(id);
    const text = [
      `async: ${r.asyncCount}`,
      `sync: ${r.syncCount}`,
      `available: ${r.available.length}`,
      `retrieved: ${formatted.length}`,
      `available max: ${r.maxLength}`,
    ].join('\n');
    console.log(text);
  }
}, 1);

setTimeout(function () {
  console.log(`final available: ${r.available.length}`);
}, 5 * 1000)

