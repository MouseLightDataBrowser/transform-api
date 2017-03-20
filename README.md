# Neuron Data Browser Transform API
Service to transform Janelia to Allen coordinates using registration files.

#####Full Swc Tracing Query
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
