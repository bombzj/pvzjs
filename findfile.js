const fs = require('fs')

const path = 'pam/packages/'
const findStr = 'COLOR'

console.log('looking for: ' + findStr)
let dir = fs.readdirSync(path, {withFileTypes: true});
dir.forEach(file => {
    // if(file.name.toLowerCase().indexOf(findStr) != -1) {
    //     console.log(file.name.toLowerCase())
    // }
    let data = fs.readFileSync(path + file.name, 'utf-8')
    if(data.indexOf(findStr) != -1) {
        console.log(file.name.toLowerCase())
    }
})