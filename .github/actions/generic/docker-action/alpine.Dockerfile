# Container image that runs your code
ARG image
FROM $image

ARG branch
ARG token
ARG workspace
ENV BRANCH=$branch \
    TOKEN=$token \
    GITHUB_ACTIONS=true \
    CI=true \
    GITHUB_WORKSPACE=$workspace

RUN apk update && apk add \
  g++ \
  python2 \
  make \
  git \
  curl \
  nano

# Copies your code file from your action repository to the filesystem path `/` of the container
COPY build-and-test-bindings.sh /build-and-test-bindings.sh
RUN chmod +x /build-and-test-bindings.sh

# Code file to execute when the docker container starts up (`entrypoint.sh`)
ENTRYPOINT /build-and-test-bindings.sh $BRANCH $TOKEN
