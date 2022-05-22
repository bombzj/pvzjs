const fs = require('fs')
const resources = [
    {
        name: 'RESOURCESPLANT1.RTON',
        atlases: [
            'PlantPeashooter_1200', 'PlantSunflower_1200',
            'PlantCherryBomb_1200', 'PlantSnowPea_1200', 'PlantTwinSunflower_1200',
            'PlantThreepeater_1200', 'PlantSquash_1200'
        ]
    },
    {
        name: 'RESOURCESPLANT2.RTON',
        atlases: [
            ''
        ]
    },
    {
        name: 'RESOURCESPLANT3.RTON',
        atlases: [
            ''
        ]
    },
    {
        name: 'RESOURCESZOMBIE1.RTON',
        atlases: [
            ''
        ]
    },
    {
        name: 'RESOURCESZOMBIE2.RTON',
        atlases: [
            ''
        ]
    },
    {
        name: 'RESOURCESZOMBIE3.RTON',
        atlases: [
            ''
        ]
    },
    {
        name: 'RESOURCESINIT.RTON',
    }
]

for(res of resources) {

    let datastr = fs.readFileSync('pam/' + res.name + '.json', 'utf-8')
    let data = JSON.parse(datastr)
    for(let d of data.groups) {
        data[d.id] = d  // make it easy to get
    }
    for(let atlas of data.groups) {
        if(!atlas.id.endsWith('_1200')) continue
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
                app: "http://www.codeandweb.com/texturepacker",
                version: "1.0",
                image: filename + '.png',
                // format: "RGBA8888",
                size: {"w":parent.width,"h":parent.height},
                scale: "1",
                smartupdate: "$TexturePacker:SmartUpdate:7151f20e5899d535a161be22ab70847d:19f33e5cfc654c9205a948d5bb755f49:892be25da4e113d4a02392b9e8ca5f32$"
            }
            fs.writeFileSync('pam/' + filename + '.json', JSON.stringify(output, null, 4), 'utf-8')
        }
    }
}
