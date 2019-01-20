#!/usr/bin/env bash

logPrefix="transform-api"

logBase=/var/log/mnb

logName=$(date '+%Y-%m-%d_%H-%M-%S')

logFile=${logPrefix}-${logName}.log

logPath=${logBase}/${logFile}

mkdir -p ${logBase}

touch ${logPath}

chown mluser:mousebrainmicro ${logPath}

./migrate.sh &> ${logPath}

wait

export LD_LIBRARY_PATH=${LD_LIBRARY_PATH}:/usr/local/lib

export DEBUG=mnb*

node --max-old-space-size=8192 --optimize-for-size app.js >> ${logPath} 2>&1
