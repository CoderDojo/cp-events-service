FROM node:boron-alpine
MAINTAINER butlerx <butlerx@notthe.cloud>

RUN apk add --update git make gcc g++ python postgresql-client && \
    mkdir -p /usr/src/app
WORKDIR /usr/src/app
ADD . /usr/src/app/
RUN yarn --production &&\
    apk del make gcc g++ python &&\
    rm -rf /tmp/* /root/.npm /root/.node-gyp
EXPOSE 10306
CMD ["yarn", "start"]
