#!/usr/bin/env bash

logName=$(date '+%Y-%m-%d_%H-%M-%S');

mkdir -p /var/log/mnb

./migrate.sh &> /var/log/mnb/transform-api-${logName}.log

wait

export LD_LIBRARY_PATH=${LD_LIBRARY_PATH}:/usr/local/lib

export DEBUG=mnb*

node --max-old-space-size=8192 --optimize-for-size app.js >> /var/log/mnb/transform-api-${logName}.log 2>&1
