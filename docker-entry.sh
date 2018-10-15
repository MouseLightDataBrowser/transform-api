#!/usr/bin/env bash

./migrate.sh

wait

export LD_LIBRARY_PATH=${LD_LIBRARY_PATH}:/usr/local/lib

export DEBUG=mnb*

node --max-old-space-size=8192 --optimize-for-size app.js
