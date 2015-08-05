#!/bin/bash
isExistApp=`ps -eaf |grep cp-events-service |grep -v grep| awk '{ print $2; }'`
if [[ -n $isExistApp ]]; then
    service cp-events-service stop
fi

service cp-events-service start
