const path = require('path');
const fs = require('fs');

const fixturePathVolumes = path.normalize(path.join(__dirname , "mouse-brain-area-volumes.json"));

export function loadAllenBrainAreaVolumes() {
    const fileData = fs.readFileSync(fixturePathVolumes, {encoding: 'UTF-8'});

    const data = JSON.parse(fileData);

    return data.map(obj => {
        return {
            structureId: parseInt(obj.id),
            geometryFile: obj.filename,
            geometryColor: obj.color,
            geometryEnable: !obj.state.disabled
        };
    });
}
