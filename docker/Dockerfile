from mhart/alpine-node:10

RUN apk update && apk add \
    g++ \
    python \
    make \
    git \
    curl \
    nano

ADD ./build-and-test.sh /root/build-and-test.sh
RUN chmod +x /root/build-and-test.sh

ENTRYPOINT ["/root/build-and-test.sh"]
