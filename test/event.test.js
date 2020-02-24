'use strict';


const bindings = require('../')
const expect = require('chai').expect

describe('addon.event', function () {

  it('should have the correct properties', function () {
    const Event = bindings.Event;
    expect(Event).property('send');
    expect(typeof Event.send).equal('function');
    expect(Event).property('xtraceIdVersion', 2);
    expect(Event).property('taskIdLength', 20);
    expect(Event).property('opIdLength', 8);
  });
})
