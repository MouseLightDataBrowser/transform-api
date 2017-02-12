const hdf5 = require("hdf5").hdf5;
const h5lt = require("hdf5").h5lt;
const Access = require("hdf5/lib/globals").Access;
const file = new hdf5.File("/Volumes/Spare/Projects/Neuron Data Browser/transform.h5", Access.ACC_RDONLY);
const readAsBuffer = h5lt.readDataset(file.id, "DisplacementField", {
    start: [0, 1, 1, 1],
    stride: [1, 1, 1, 1],
    count: [3, 1, 1, 1]
});
console.log(readAsBuffer.data[0][0][0]);
const attrs = file.getDatasetAttributes("DisplacementField");
console.log(attrs["Transformation_Matrix"]);
file.close();
//# sourceMappingURL=temp-sample.js.map