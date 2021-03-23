FROM node:8.12

RUN cd /tmp; wget https://support.hdfgroup.org/ftp/HDF5/releases/hdf5-1.10/hdf5-1.10.0-patch1/src/hdf5-1.10.0-patch1.tar.gz
RUN cd /tmp; tar xvzf hdf5-1.10.0-patch1.tar.gz
RUN cd /tmp/hdf5-1.10.0-patch1; ./configure --prefix=/usr/local --enable-cxx
RUN cd /tmp/hdf5-1.10.0-patch1; make
RUN cd /tmp/hdf5-1.10.0-patch1; make install

WORKDIR /app

COPY dist .

RUN yarn global add sequelize-cli@5 --ignore-engines

RUN yarn install --production=true --ignore-engines

RUN groupadd -g 1097 mousebrainmicro
RUN adduser -u 7700649 --disabled-password --gecos '' mluser
RUN usermod -a -G mousebrainmicro mluser

USER mluser

CMD ["./docker-entry.sh"]

EXPOSE  5000
