# After 7.5 yarn is installed in the image, so global install below will fail
# 7.7.x also has issues with building native modules, so using anything tagged to 7.7.x will fail even if you remove
#   the mpn install yarn.  Forcing to 7.5 until native modules are functional on all platforms in the 7.7.x image.
FROM node:7.5

RUN cd /tmp; wget https://support.hdfgroup.org/ftp/HDF5/releases/hdf5-1.10/hdf5-1.10.0-patch1/src/hdf5-1.10.0-patch1.tar.gz
RUN cd /tmp; tar xvzf hdf5-1.10.0-patch1.tar.gz
RUN cd /tmp/hdf5-1.10.0-patch1; ./configure --prefix=/usr/local --enable-cxx
RUN cd /tmp/hdf5-1.10.0-patch1; make
RUN cd /tmp/hdf5-1.10.0-patch1; make install

WORKDIR /app

RUN npm install -g yarn typescript

COPY . .

RUN yarn install

RUN tsc

CMD ["./start.sh"]

EXPOSE  9661
