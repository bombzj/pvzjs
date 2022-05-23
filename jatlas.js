const fs = require('fs')
const resources = [
    {
        name: 'RESOURCES.RTON',
        atlases: [
        ]
    },
]

for(res of resources) {

    let datastr = fs.readFileSync('pam/' + res.name + '.json', 'utf-8')
    let data = JSON.parse(datastr)
    for(let d of data.groups) {
        data[d.id] = d  // make it easy to get
    }
    for(let atlas of data.groups) {
        if(!atlas.id.endsWith('_768')) continue
        let frames = {}
        let parents = {}
        for(res2 of atlas.resources) {
            if(res2.atlas) {
                parents[res2.id] = res2
                frames[res2.id] = {}
            } else {
                let frameName = res2.id
                frames[res2.parent][frameName] = {
                    frame: {
                        x: res2.ax,
                        y: res2.ay,
                        w: res2.aw,
                        h: res2.ah
                    }
                }
            }
        }
        for(let parentName in parents) {
            let parent = parents[parentName]
            let filename = parent.path[parent.path.length - 1]
            let output = { frames: frames[parentName] }
            output.meta = {
                image: '../atlases/' + filename + '.png',
                // format: "RGBA8888",
                size: {"w":parent.width,"h":parent.height},
                scale: "1"
            }
            fs.writeFileSync('pam/json/' + filename + '.json', JSON.stringify(output, null, 4), 'utf-8')
        }
    }
}
