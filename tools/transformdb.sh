#!/usr/bin/env bash

IMAGE="postgres:9"

PG_PORT=5434

# Can match volume used in Docker Compose for deployment to share data.
DATA_VOLUME="ndb_transform_data"

# Can NOT match container name in Docker Compose - Compose wants full control of container.
CONTAINER_NAME="ndb_transform_db_dev"

# First argument is location of the transform-datastore directory.  Not required if running from the root directory.

if [ $# -eq 0 ]; then
    SRC_DIR=$(PWD)
else
    SRC_DIR=$1
fi

docker volume inspect ${DATA_VOLUME}

if [ $? -ne 0 ]; then
  echo "creating t ${DATA_VOLUME} volume"
  docker volume create ${DATA_VOLUME}
fi

docker inspect ${CONTAINER_NAME}

if [ $? -ne 0 ]; then
    echo "creating ${CONTAINER_NAME} container"
    docker run -v ${SRC_DIR}/datastore:/docker-entrypoint-initdb.d -v ${DATA_VOLUME}:/var/lib/postgresql/data -e POSTGRES_PASSWORD=pgsecret -e PGDATA=/var/lib/postgresql/data/pgdata -p ${PG_PORT}:5432 -i --name ${CONTAINER_NAME} ${IMAGE}
else
    echo "starting ${CONTAINER_NAME} container"
    docker start ${CONTAINER_NAME} -ai
fi
