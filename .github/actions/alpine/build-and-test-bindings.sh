#!/bin/sh -l

branch="$1"
# shellcheck disable=SC2034 # used by appoptics-bindings in tests
export AO_TOKEN_PROD="$2"

cd "$GITHUB_WORKSPACE" || exit 1
git clone --depth=1 https://github.com/appoptics/appoptics-bindings-node aob -b "$branch"
cd aob || exit 1

# make sure production install works
if ! npm install --production --unsafe-perm; then
  error=true
fi

rm -rf node_modules

# install so testing works
if ! npm install --unsafe-perm; then
  error=true
fi

# test
npm install -g mocha || error=true
npm test || error=true

if [ -n "$error" ]; then
  exit 1
fi

exit 0
