'use strict';

const bindings = require('../')
const expect = require('chai').expect;

describe('addon.config', function () {

  it('should get oboe\'s version as a string', function () {
    const version = bindings.Config.getVersionString()
    expect(version).to.be.a('string')
    expect(version).match(/\d+\.\d+\.\d+/)
  });

  it('should get oboe\'s settings', function () {
    const settings = bindings.Config.getSettings();
    expect(settings).property('tracing_mode', -1);
    expect(settings).property('sample_rate', -1);
    expect(settings).property('flag_sample_start', false);
    expect(settings).property('flag_through_always', false);
  });

  it('should get oboe\'s internal stats', function () {
    const stats = bindings.Config.getStats();
    expect(stats).property('reporterInitCount').oneOf([0, 1]);
    expect(stats).property('eventQueueFree', 0);
    expect(stats).property('collectorOk', 0);
    expect(stats).property('collectorTryLater', 0);
    expect(stats).property('collectorLimitExceeded', 0);
  });
})
