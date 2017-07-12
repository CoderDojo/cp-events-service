FROM mhart/alpine-node:0.10.38
MAINTAINER butlerx <butlerx@notthe.cloud>
RUN apk add --update git make gcc g++ python postgresql-client
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
ADD . /usr/src/app
RUN npm install --production \
      && rm -rf /root/.npm \
      && apk del make gcc g++ python \
      && rm -rf /tmp/* /root/.npm /root/.node-gyp
EXPOSE 10306
CMD ["node", "service.js"]
