const fs = require('fs')

const path = 'D:/Users/ZJ/git/pvzjs/pam/pams/'
const findStr = 'TRANSITION_GRASSTILE'

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