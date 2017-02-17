#!/usr/bin/env bash

# First argument is location of the transform-datastore directory.  Not required if running from the root directory.

if [ $# -eq 0 ]; then
    SRCDIR=$(PWD)
else
    SRCDIR=$1
fi

echo $SRCDIR

docker inspect transform-datastore

if [ $? -ne 0 ]; then
  docker create --name transform-datastore postgres
fi

docker inspect transform-db

if [ $? -ne 0 ]; then
    echo "Running new transform-db container"
    docker run -v $SRCDIR/datastore:/docker-entrypoint-initdb.d --volumes-from transform-datastore -e POSTGRES_PASSWORD=pgsecret -p 5434:5432 -i --name transform-db postgres
else
    echo "Starting existing transform-db container"
    docker start transform-db -ai
fi
