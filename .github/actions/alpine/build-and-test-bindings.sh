#!/bin/sh -l

succeeded=
failed=

branch="$1"
# shellcheck disable=SC2034 # used by appoptics-bindings in tests
export AO_TOKEN_PROD="$2"

cd "$GITHUB_WORKSPACE" || exit 1
git clone --depth=1 https://github.com/appoptics/appoptics-bindings-node aob -b "$branch"
cd aob || exit 1

# make sure production install works
if ! npm install --production --unsafe-perm; then
  echo "::set-output name=install-prod::fail"
  error=true
else
  echo "::set-output name=install-prod::pass"
fi

rm -rf node_modules

# install so testing works
if ! npm install --unsafe-perm; then
  echo "::set-output name=install-dev::fail"
  error=true
else
  echo "::set-output name=install-dev::pass"
fi

# test
npm install -g mocha || error=true

if ! npm test; then
  echo "::set-output name=install-dev::fail"
  error=true
else
  echo "::set-output name=install-dev::pass"
fi

echo "::set-output name=good-tests::nyi"
echo "::set-output name=bad-tests::nyi"

if [ -n "$error" ]; then
  exit 1
fi

exit 0
