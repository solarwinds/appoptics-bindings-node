# container image that runs your code
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

# centos needs the user to be root; sudo doesn't work.
USER root
# yum returns non-zero exit code (100) if packages available for update
RUN yum -y check-update || echo "packages available for update"

# install software required for this OS
RUN yum -y install \
  gcc-c++ \
  python2 \
  make \
  git \
  curl \
  nano

RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.1/install.sh | bash

COPY build-and-test-bindings.sh /build-and-test-bindings.sh
RUN chmod +x /build-and-test-bindings.sh

# use the no brackets for so the env vars are interpreted
ENTRYPOINT /build-and-test-bindings.sh $BRANCH $TOKEN
