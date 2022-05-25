const fs = require('fs')

let properties = JSON.parse(fs.readFileSync('pam/packages/plantproperties.rton.json', 'utf-8'))
properties.objMap = {}
for(let obj of properties.objects) {
    for(let alias of obj.aliases) {
        properties.objMap[alias] = obj
    }
}

let types = JSON.parse(fs.readFileSync('pam/packages/planttypes.rton.json', 'utf-8'))
let output = {}
for(let obj of types.objects) {
    let od = obj.objdata
    let propName = getRTIDName(od.Properties)
    let prop = properties.objMap[propName]
    output[od.TypeName] = {
        pamName: od.PopAnim.replace('POPANIM_PLANT_', ''),
        cost: prop.objdata.Cost,
        hitpoint: prop.objdata.Hitpoints,
        cooldown: prop.objdata.PacketCooldown,
        center: prop.objdata.ArtCenter,
        backdrop: od.AlmanacBackdropName,
        world: od.HomeWorld
    }
}



fs.writeFileSync('pam/planttype.json', JSON.stringify(output, null, 4), 'utf-8')


function getRTIDName(str) {
    return str.substr(5, str.indexOf('@') - 5)
}