#!/bin/bash

#
# run tests that can be run with one initialization of bindings.
#
mocha --expose-gc test/*.test.js

[ $? ] && error=true

#
# run tests that requires new invocations of bindings
#
mocha test/solo-tests/notifier.test.js

[ $? ] && error=true

[ -n "$error" ] && exit 1

exit 0
