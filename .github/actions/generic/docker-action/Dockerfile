# Container image that runs your code
ARG os_version
FROM node:${os_version}

ARG branch
ARG token
ENV BRANCH=$branch \
    TOKEN=$token

# Copies your code file from your action repository to the filesystem path `/` of the container
COPY build-and-test-bindings.sh /build-and-test-bindings.sh
RUN chmod +x /build-and-test-bindings.sh

# Code file to execute when the docker container starts up (`entrypoint.sh`)
ENTRYPOINT /build-and-test-bindings.sh $BRANCH $TOKEN
