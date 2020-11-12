#!/bin/sh -l

cd /root || exit 1
git clone --depth=1 https://github.com/appoptics/appoptics-bindings-node aob
cd aob || exit 1
npm install -g mocha
npm install --production --unsafe-perm
