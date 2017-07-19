FROM mhart/alpine-node:0.10.48
MAINTAINER butlerx <butlerx@notthe.cloud>
RUN apk add --update git build-base python postgresql-client
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
ENV DEP_VERSION=latest
ADD . /usr/src/app
RUN npm install && \
    npm install cp-translations@$DEP_VERSION && \
    rm -rf /root/.npm && \
    apk del build-base python && \
    rm -rf /tmp/* /root/.npm /root/.node-gyp
EXPOSE 10306
CMD ["node", "service.js"]
