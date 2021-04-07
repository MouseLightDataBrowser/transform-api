# Neuron Data Browser Transform API
Service to transform Janelia to Allen coordinates using registration files.

### Build Notes
This references a forked version of hdf5.node that is customized to
* allow getting the dimensions and contents of 4-D datasets
* perform multiple reads from a single file open

This was forked when nodejs 8.12 was the latest stable release. `yarn install` will fail with newer versions of nodejs.  

Reading HDF5 files will need to be updated (e.g., reapply above additions to the latest hdf5.node) to build or run with a newer nodejs version.

### Tools
Reapply all transforms (using registration used for previous transform).
```
docker run -it --rm --network mnb_back_tier -e DATABASE_PW=${DATABASE_PW} -v ${TRANSFORM_VOL_EXT}:${TRANSFORM_VOL_INT}  mouselightdatabrowser/transform-api:1.6 /bin/bash

export DEBUG=mnb:*
export export LD_LIBRARY_PATH=${LD_LIBRARY_PATH}:/usr/local/lib
```

### API Usage

##### Full Swc Tracing Query
````
{
  swcTracings {
    id
    filename
    annotator
    fileComments
    offsetX
    offsetY
    offsetZ
    firstNode {
      id
      sampleNumber
      parentNumber
      x
      y
      z
      radius
      structureIdentifier {
        id
        name
        value
        mutable
        createdAt
        updatedAt
      }
    }
    tracingStructure {
      id
      name
      value
      createdAt
      updatedAt
    }
    createdAt
    updatedAt
  }
}
````
#####Full Tracing Query
````
{
  tracings {
    id
    nodeCount
    transformedAt
    createdAt
    updatedAt
    transformStatus {
      startedAt
      inputNodeCount
      outputNodeCount
    }
    firstNode {
      id
      sampleNumber
      parentNumber
      x
      y
      z
      radius
      structureIdentifier {
        id
        name
        value
        mutable
        createdAt
        updatedAt
      }
    }
    swcTracing {
      id
      filename
      annotator
      fileComments
      offsetX
      offsetY
      offsetZ
      firstNode {
        id
        sampleNumber
        parentNumber
        x
        y
        z
        radius
        structureIdentifier {
          id
          name
          value
          mutable
          createdAt
          updatedAt
        }
      }
      tracingStructure {
        id
        name
        value
        createdAt
        updatedAt
      }
      createdAt
      updatedAt
    }
    registrationTransform {
      id
      name
      location
      notes
      createdAt
      updatedAt
    }
    tracingStructure {
      id
      name
      value
      createdAt
      updatedAt
    }
  }
}

````

#####Apply Transform
````
mutation {
  applyTransform(swcId: "7d4af5fd-e121-4425-9143-a166d8c94fa6") {
    id
    transformedAt
    nodeCount
    firstNode {
      id
    }
    swcTracing {
      id
    }
    registrationTransform {
      id
      name
      location
      notes
    }
    tracingStructure {
      id
      name
      value
    }
    transformStatus {
      startedAt
      inputNodeCount
      outputNodeCount
    }
    createdAt
    updatedAt
  }
}
````
