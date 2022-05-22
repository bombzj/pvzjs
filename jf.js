const fs = require('fs')
const files = ['SnowPea', 'GloomShroom', 'CherryBomb', 'Hypnoshroom', 
        'TwinSunflower', 'WallNut', 'GraveBuster', 'PeaShooterSingle',
        'SunFlower', 'Chomper', 'SplitPea', 'Squash', 'ScaredyShroom', 
        'Puffshroom', 'Fumeshroom', 'PeaShooter', 'ThreePeater', 'Sun', 'FirePea',
        'Zombie_football', 'Zombie_FlagPole', 'Zombie_jackbox', 'Zombie_Jackson',
        'CrazyDave',
        'Zombie_ladder', 'Zombie_paper', 'Zombie_polevaulter', 'Zombie_disco', 'Zombie_base']

for(let file of files) {
    let datastr = fs.readFileSync('animjson/' + file + '.reanim.compiled.json', 'utf-8')
    let data = JSON.parse(datastr)
    let data2 = {}

    for(let track of data.tracks) {
        let last = track.transforms[0]
        for(let t of track.transforms) {
            if(t.i) {
                t.i = t.i.substr(13).toLowerCase()
            }
        }
    }
    for(let track of data.tracks) {
        let last = track.transforms[0]
        let f = true
        for(let t of track.transforms) {
            if(t.f == 0) {
                f = true
            } else if(t.f == -1) {
                f = false
            }
            if(f) {
                if(t.x == undefined && last.x != undefined) t.x = last.x
                if(t.y == undefined && last.y != undefined) t.y = last.y
                if(t.sx == undefined && last.sx != undefined) t.sx = last.sx
                if(t.sy == undefined && last.sy != undefined) t.sy = last.sy
                if(t.kx == undefined && last.kx != undefined) t.kx = last.kx
                if(t.ky == undefined && last.ky != undefined) t.ky = last.ky
                if(t.a == undefined && last.a != undefined) t.a = last.a
                //if(t.i != undefined && last.i != undefined && t.i != last.i) console.log(file + '-' + track.name)
                if(t.i == undefined && last.i != undefined) t.i = last.i
                // t.name = track.name
                last = t
            }
        }
    }



    for(let track of data.tracks) {
        console.log(track.name + ' ' + track.transforms.length)
        if(track.name.substr(0, 5) == 'anim_') {
            let act = data2[track.name.substr(5)] = {}
            act.actionList = []
            let f = true
            for(let i = 0;i < track.transforms.length;i++) {
                let t = track.transforms[i]
                if(t.f == 0) {
                    f = true
                } else if(t.f == -1) {
                    f = false
                }
                if(f) {
                    let a = {}
                    for(let track2 of data.tracks) {
                        let t2 = track2.transforms[i]
                        if(t2.x != undefined || t2.y != undefined) {
                            a[track2.name] = t2
                            // a.push(track2.name)
                        }
                    }
                    act.actionList.push(a)
                }
            }
        } else {
            // data2[track.name.substr(5)] = {}
        }
    }

    if(file.substr(0, 7) == 'Zombie_') {
        file = 'zombie/' + file.substr(7) + 'Zombie'
    } else {
        file = 'plant/' + file
    }
    fs.writeFileSync(file + '.json', JSON.stringify(data2, null, 4), 'utf-8')
}