#!/usr/bin/env bash

set -e

docker build --rm=false -t coderdojo/cp-events-service:"$CIRCLE_SHA1" .
docker login -e "$DOCKER_EMAIL" -u "$DOCKER_USER" -p "$DOCKER_PASS"
docker push coderdojo/cp-event-service:"$CIRCLE_SHA1"
sudo chown -R ubuntu:ubuntu /home/ubuntu/.kube
kubectl config set-cluster default-cluster --server=https://"${STAGING_HOST}" --certificate-authority="${CA_CERT}"
kubectl config set-credentials default-admin --certificate-authority="${CA_CERT}" --client-key="${ADMIN_KEY}" --client-certificate="${ADMIN_CERT}"
kubectl config set-context default-system --cluster=default-cluster --user=default-admin
kubectl config use-context default-system
kubectl patch deployment events -p '{"spec":{"template":{"spec":{"containers":[{"name":"events","image":"coderdojo/cp-events-service:'"$CIRCLE_BUILD_SHA1"'"}]}}}}'
