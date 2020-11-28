#!/bin/sh -l

# this is the entrypoint of generic.Dockerfile. It will build an os/node
# specific container that will run the tests.

OS_VERSION=$1     # this is os:image:tag where the os selects the dockerfile to use
BRANCH=$2         # the branch to test
TOKEN=$3          # the AO_SWOKEN to use for the tests

echo "::set-output name=all-args::$*"

# get the base image and version. if "base" is "node" then "version" specifies then OS,
# the version, and the node_version. if "base" is not "node" then "version" only specifies
# the OS's version and an additional ":node_version" tag will be applied.
IFS=: read -r os image << EOS
$OS_VERSION
EOS
clean=$(echo "$image" | tr ':' '-')

cd /docker-action || exit 1
echo "creating $os image from: $image"
echo "make a change"

# here we can make the construction of the image as customizable as we need
# and if we need parameterizable values it is a matter of sending them as inputs
docker build . -f "$os.Dockerfile" -t "docker-$os-$clean" \
    --build-arg workspace="$GITHUB_WORKSPACE" \
    --build-arg image="$image" \
    --build-arg branch="$BRANCH" \
    --build-arg token="$TOKEN" \
    && docker run -v /github/workspace:/github/workspace "docker-$os-$clean"
