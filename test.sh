#!/bin/sh

#
# run tests that can be run with one initialization of bindings.
#
if ! mocha test/*.test.js; then
  error=true
fi

#
# run tests that requires new invocations of bindings
#
if ! mocha test/solo-tests/notifier.test.js; then
  error=true
fi

if ! mocha --expose-gc  test/solo-tests/init-memory.test.js; then
  error=true
fi

[ -n "$error" ] && exit 1

exit 0
