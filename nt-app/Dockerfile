# TODO how to make this work?

FROM node:20-bookworm

RUN dpkg --add-architecture i386 && \
  apt-get update && \
  apt-get install -y dpkg fakeroot rpm wine mono-devel parallel zip && \
  apt-get clean

RUN ln -s /usr/bin/wine /usr/bin/wine32 && \
  ln -s /usr/bin/wine /usr/bin/wine64

ADD inner-build.sh /inner-build.sh
RUN chmod 0755 /inner-build.sh
WORKDIR /src

CMD ["/inner-build.sh"]