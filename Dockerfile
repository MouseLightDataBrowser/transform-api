FROM node:7

RUN cd /tmp; wget https://support.hdfgroup.org/ftp/HDF5/releases/hdf5-1.10/hdf5-1.10.0-patch1/src/hdf5-1.10.0-patch1.tar.gz
RUN cd /tmp; tar xvzf hdf5-1.10.0-patch1.tar.gz
RUN cd /tmp/hdf5-1.10.0-patch1; ./configure --prefix=/usr/local --enable-cxx
RUN cd /tmp/hdf5-1.10.0-patch1; make
RUN cd /tmp/hdf5-1.10.0-patch1; make check
RUN cd /tmp/hdf5-1.10.0-patch1; make install
RUN cd /tmp/hdf5-1.10.0-patch1; make check-install

# Bundle app source
COPY . /app

# Remove dockerdevelopment dependencies
RUN rm -rf /app/node_modules

# Install production app dependencies
RUN cd /app; npm install -g yarn
RUN cd /app; yarn

#EXPOSE  9654