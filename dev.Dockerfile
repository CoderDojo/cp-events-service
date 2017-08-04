FROM mhart/alpine-node:0.10.48
MAINTAINER butlerx <butlerx@notthe.cloud>
RUN apk add --update git build-base python postgresql-client && \
    npm install -g nodemon && \
    mkdir -p /usr/src/app /usr/src/cp-translations
ADD  docker-entrypoint.sh /usr/src
EXPOSE 10306
VOLUME /usr/src/app /usr/src/cp-translations
CMD ["/usr/src/docker-entrypoint.sh"]
