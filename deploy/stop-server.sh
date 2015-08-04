#!/bin/bash
isExistApp=`pgrep cp-events-service`
if [[ -n $isExistApp ]]; then
  service cp-events-service stop
fi
