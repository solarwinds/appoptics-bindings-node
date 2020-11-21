#!/bin/sh -l
branch=$1
echo "::set-output name=all-args-2::$*"

# make os-release one line and get rid of the garbage that confuses github actions. the
# parens and ANSI removal are for centos but no harm here.
details=$(tr -d '()' < /etc/os-release | tr '\n' ',' | sed 's/ANSI_COLOR="0;31",//')
echo "::set-output name=os-details::$details"

echo "::set-output name=branch-to-test::${branch}"
