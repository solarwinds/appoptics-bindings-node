FROM centos:8

RUN yum -y check-update && yum -y install \
  gcc-c++ \
  python2 \
  make \
  git \
  curl \
  nano

COPY ./build-and-test-bindings.sh /root/build-and-test-bindings.sh
RUN chmod +x /root/build-and-test-bindings.sh

ENTRYPOINT ["/root/build-and-test-bindings.sh"]



