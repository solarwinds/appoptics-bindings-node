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

# install software required for this OS
RUN apk update && apk add \
  g++ \
  python2 \
  make \
  git \
  curl \
  nano


COPY build-and-test-bindings.sh /build-and-test-bindings.sh
RUN chmod +x /build-and-test-bindings.sh

# use the no brackets for so the env vars are interpreted
ENTRYPOINT /build-and-test-bindings.sh $BRANCH $TOKEN
