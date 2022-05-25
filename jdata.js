const fs = require('fs')

let datastr = fs.readFileSync('pam/packages/planttypes.rton.json', 'utf-8')
let data = JSON.parse(datastr)
let output = {}
for(let obj of data.objects) {
    let od = obj.objdata
    output[od.TypeName] = {
        pamName: od.PopAnim.replace('POPANIM_PLANT_', '')
    }
}

fs.writeFileSync('pam/planttype.json', JSON.stringify(output, null, 4), 'utf-8')
