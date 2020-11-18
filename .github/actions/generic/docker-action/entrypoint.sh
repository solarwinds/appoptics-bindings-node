#!/bin/sh -l
branch=$1
echo "::set-output name=all-args-2::$*"

version=$(cat /etc/alpine-release)

echo "::set-output name=version::${version}"
echo "::set-output name=branch-to-test::${branch}"
