#!/bin/bash

#
# run tests that can be run with one initialization of bindings.
#
mocha test/*.test.js

error=$?

#
# run tests that requires new invocations of bindings
#
mocha test/solo-tests/notifier.test.js

[ $? ] || [ $error ] && exit 1
