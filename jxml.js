const xml2js = require('xml2js')
const fs = require('fs') 
const files = []

const parser = new xml2js.Parser({ attrkey: "ATTR" });
const arrayName = new Set(['Emitter', 'Field'])

const path = 'particles/'
let dir = fs.readdirSync(path, {withFileTypes: true});
dir.forEach(file => {
    if(file.isFile()) {
        if(file.name.endsWith('.xml')) {
            let datastr = '<?xml version="1.0" encoding="UTF-8" ?><root>' + fs.readFileSync(path + file.name, 'utf-8') + '</root>'
            parser.parseString(datastr, (err, result) => {
                if(!err) {
                    replaceArray(result.root)
                    fs.writeFileSync(path + file.name.replace('.xml', '.json'), JSON.stringify(result.root, null, 4), 'utf-8')
                }
            })
            
        }
    }
})


function replaceArray(d) {
    for(let i in d) {
        let d2 = d[i]
        if(typeof d2 ==='object') {
            if(Array.isArray(d2)) {
                for(let ai of d2) {
                    if(typeof ai ==='object') {
                        replaceArray(ai)
                    }
                }
                if(!arrayName.has(i)) {
                    if(d2.length != 1) debugger
                    d[i] = d2[0]
                }
            } else {
                replaceArray(d2)
            }
        }
    }
}