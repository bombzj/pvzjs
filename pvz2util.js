
// 画一个植物
function plant(i, x, y) {
    let a = new PlantSprite(plantList[i])
    a.pivot.set(195, 180)
    a.position.set(x, y)
    stage.addChild(a)
    newObjects.push(a)
    a.plantType = i
    a.scale.set(resScale)
    a.ztype = 'plant'
    return a
}

// 画一个僵尸
function zombie(i, x, y) {
    let a = new ZombieSprite(zombieList[i])
    a.pivot.set(195, 180)
    a.position.set(x, y)
    stage.addChild(a)
    newObjects.push(a)
    a.plantType = i
    a.scale.set(resScale)
    a.ztype = 'zombie'
    return a
}

var sunTotal = 50
// 画一个种子
function seed(i, x, y) {
    let planttype = plantList[i]
    let c = new PIXI.Container()

    let bgname = planttype.HomeWorld
    if (!bgname || bgname == 'tutorial') bgname = 'ready'
    let b = new PIXI.Sprite(texturesMap['IMAGE_UI_PACKETS_' + bgname.toUpperCase()])
    // b.position.set(x, y)
    let priceTab = new PIXI.Sprite(texturesMap.IMAGE_UI_PACKETS_PRICE_TAB)
    priceTab.position.set(70, 35)

    let price = new PIXI.Text(planttype.prop.Cost, { fontFamily: 'Arial', fontSize: 32, fill: 'white', align: 'center', fontWeight: '600', strokeThickness: 3 });
    price.position.set(115 - price.width, 40)

    
    let cover1 = new PIXI.Sprite(texturesMap.IMAGE_UI_PACKETS_COOLDOWN)
    cover1.tint = 0x0
    cover1.alpha = 0.5
    cover1.visible = false
    // cover1.position.set(0, 0)
    let cover2 = new PIXI.Sprite(texturesMap.IMAGE_UI_PACKETS_COOLDOWN)
    cover2.tint = 0x0
    cover2.alpha = 0.5
    cover2.visible = false
    // cover1.position.set(0, 0)

    let a = new PIXI.Sprite(texturesMap['IMAGE_UI_PACKETS_' + planttype.ename.toUpperCase()])
    a.position.set(10, 0)
    a.seedType = i

    c.addChild(b, a, priceTab, price, cover1, cover2)
    c.position.set(x, y)
    stage.addChild(c)
    newObjects.push(c)
    c.ztype = 'seed'
    c.planttype = planttype
    if(planttype.prop.StartingCooldown) {
        c.cd = planttype.prop.StartingCooldown * fps
    } else {
        c.cd = planttype.prop.PacketCooldown * fps
    }
    c.step = function() {
        if(this.cd == 0) {
            cover1.visible = this.planttype.prop.Cost > sunTotal
            cover2.visible = false
            return
        }
        this.cd--
        cover2.scale.y = this.cd / this.planttype.prop.PacketCooldown / fps
        cover1.visible = true
        cover2.visible = true
    }
    c.use = function() {
        this.cd = this.planttype.prop.PacketCooldown * 60
    }
    c.ready = function() {
        return this.cd == 0
    }
    return c
}

// 画选择种子框
function seedSel(x, y) {
    let a = new PIXI.Sprite(texturesMap.IMAGE_UI_PACKETS_SELECT)
    a.position.set(x, y)
    stage.addChild(a)
    newObjects.push(a)
    a.ztype = 'seedSel'
    a.step = function() {}
    return a
    
}

// 画背景
function back(x, y) {
    // let a = new PIXI.Sprite(textures.IMAGE_BACKGROUNDS_BACKGROUND_LOD_BIRTHDAY_TEXTURE_LEFT)
    // a.position.set(x, y)
    let b = new PIXI.Sprite(texturesMap.IMAGE_BACKGROUNDS_BACKGROUND_LOD_BIRTHDAY_TEXTURE)
    b.position.set(x, y)
    stage.addChild(b)
    return b
}

// 画太阳
function sun(x, y) {
    let pam = pams.POPANIM_EFFECTS_SUN
    let a = new PamSprite(pam, pam.main_sprite)
    a.position.set(x, y)
    stage.addChild(a)
    newObjects.push(a)
    a.pivot.set(100, 100)
    a.scale.set(resScale)
    a.ztype = 'sun'
    return a
}

// 画太阳数量
function numSun(x, y, num = 0) {
    let c = new PIXI.Container()
    let b = new PIXI.Sprite(texturesMap.IMAGE_UI_GENERIC_COUNTER_BG)
    b.position.set(35, 15)
    b.scale.x = 1.2
    b.alpha = 0.7
    let a = new PIXI.Sprite(texturesMap.IMAGE_UI_HUD_INGAME_SUN)

    let cnt = new PIXI.Text(num, { fontFamily: 'Arial', fontSize: 32, fill: 'white', align: 'center', fontWeight: '600', strokeThickness: 3 });
    cnt.position.set(75, 12)

    c.cnt = cnt
    sunTotal = num
    c._num = num
    c.addChild(b, a, cnt)
    newObjects.push(c)
    c.position.set(x, y)
    stage.addChild(c)

    c.step = function() {
        if(this._num != sunTotal) {
            this._num = sunTotal
            c.cnt.text = sunTotal
        }
    }
    c.ztype = 'numSun'
    return c
}

// 画小车
function car(x, y, act) {
    let pam = pams.POPANIM_MOWERS_MOWER_MODERN
    let a = new PamSprite(pam, pam.main_sprite, pam.actionFrame[act])
    a.position.set(x, y)
    stage.addChild(a)
    newObjects.push(a)
    a.scale.set(resScale)
    a.ztype = 'car'
    return a
}

function rm(obj) {
    obj.needRemove = true
}

const resScale = 768 / 1200
let texturesMap = {}

function setup(resources) {
    for(let resName of need2LoadGroup) {
        let res = resourcesMap[resName]
        if(!res) continue
        for(let image of res.images) {
            let baseTexture = resources[image.parent].texture
            texturesMap[image.id] = new PIXI.Texture(baseTexture, new PIXI.Rectangle(image.ax, image.ay, image.aw, image.ah))
            // Object.assign(texturesMap, resources[image.name].textures)
        }
    }
    for(let resName of need2LoadGroup) {
        let res = resourcesMap[resName]
        if(!res) continue
        for(let pam of res.pams) {
            pamInit(pam.name, resources[pam.name].data, texturesMap)
        }
    }

    app.stage.addChild(stage)
    init(resources)
    app.ticker.add(delta => loop2())
}

function loop2() {
    objects.forEach(a => {
        if (a.needRemove || a.pamParant && a.pamParent.needRemove) {
            stage.removeChild(a)
        }
    })
    objects = objects.filter(a => !a.needRemove && (!a.pamParent || !a.pamParent.needRemove))
    objects = objects.concat(newObjects)
    newObjects = []
    loop()
}

let need2LoadGroup = ['LevelCommon', 'SodRollGroup', 'ModernMowerGroup', 'UI_AlwaysLoaded', 'UI_SeedPackets'
    , 'DelayLoad_Background_FrontLawn_Birthday', 'DelayLoad_Background_FrontLawn', 'Grass_Transition']
var stage = new PIXI.Container()
var objects = [], newObjects = []
var plantType, zombieType
var fps = 30
var resourcesMap

function loadPams(callback) {
    for (let j of packageJsons) {
        loader.add(j, 'pam/packages/' + j + '.rton', {xhrType: PIXI.LoaderResource.XHR_RESPONSE_TYPE.BUFFER, loadType: 'rton'})
    }
    // loader.add('resourcesmap', 'pam/resourcesmap.json')
    loader.load((loader, resources) => setup2(resources, callback));
}

function setup2(resources, callback) {
    loadPackages(resources)
    loadPlantType(resources)
    loadZombieType(resources)
    for (let p of plantList) {
        let t = plantType[p.ename]
        Object.assign(p, t)
    }
    for (let z of zombieList) {
        let t = zombieType[z.ename]
        Object.assign(z, t)
    }
    loadResources()
    // resourcesMap = resources.resourcesmap.data

    loader.reset()
    console.log('concurrency =',  loader.concurrency)
    for(let type of plantList) {
        need2LoadGroup.push(...type.PlantResourceGroups)
    }
    for(let type of zombieList) {
        need2LoadGroup.push(...type.ResourceGroups)
    }
    for(let resName of need2LoadGroup) {
        let res = resourcesMap[resName]
        if(!res) continue
        for(let pam of res.pams) {
            try {
                loader.add(pam.name, 'pam/' + pam.path, {xhrType: PIXI.LoaderResource.XHR_RESPONSE_TYPE.BUFFER})
            } catch(e) { }
        }
        for(let image of res.atlases) {
            try {
                loader.add(image.name, 'pam/atlases/' + image.path + '.png')
            } catch(e) { }
        }
    }
    loader.load((loader, resources) => setup(resources, callback));
}


const packageJsons = ['RESOURCES', 'PlantTypes', 'PlantProperties', 'ZombieTypes', 'ZombieProperties'
    , 'ArmorTypes', 'PropertySheets', 'ProjectileTypes']
var rtMap = {}
var rtons = {}

function loadPackages(resources) {
    for(let pkgName of packageJsons) {
        let pkg = parseRton(resources[pkgName].data)
        rtons[pkgName] = pkg
        if(!pkg.objects) continue
        for(let obj of pkg.objects) {
            if(!obj.aliases) continue
            for(let alias of obj.aliases) {
                rtMap[alias + '@' + pkgName] = obj.objdata
                obj.objdata.objclass = obj.objclass
            }
        }
    }
}
function getByRTID(str) {
    let id = str.substr(5, str.length - 6)
    return rtMap[id]
}

function loadPlantType(resources) {
    plantType = {}
    for(let obj of rtons.PlantTypes.objects) {
        let od = obj.objdata
        plantType[od.TypeName] = od
        plantType[od.TypeName].prop = getByRTID(od.Properties)
    }
}

function loadZombieType(resources) {
    zombieType = {}
    for(let obj of rtons.ZombieTypes.objects) {
        let od = obj.objdata
        if(!od) continue
        zombieType[od.TypeName] = od
        zombieType[od.TypeName].prop = getByRTID(od.Properties)
    }
}

function loadResources() {
    let resources = rtons.RESOURCES

    resourcesMap = {}
    for(let group of resources.groups) {
        if(group.type == 'composite') continue
        let sub = resourcesMap[group.parent]
        if(!sub) {
            sub = resourcesMap[group.parent] = {
                name: group.parent,
                pams: [],
                atlases: [],
                sounds: [],
                images: []
            }
        }
        
        if(group.res && group.res != 768) continue
        for(let res of group.resources) {
            if(res.type == 'Image') {
                if(res.atlas) {
                    sub.atlases.push({
                        name: res.id,
                        path: res.path[1]
                    })
                } else {
                    sub.images.push(res)
                }
            } else if(res.type == 'PopAnim') {
                sub.pams.push({
                    name: res.id,
                    path: res.path.join('/')
                })
            } else if(res.type == 'SoundBank') {
                sub.sounds.push({
                    name: res.id,
                    path: res.path.join('/')
                })
            }
        }
    
    }
    



    // for(let d of resources.groups) {
    //     resources[d.id] = d  // make it easy to get
    // }
    // for(let atlas of resources.groups) {
    //     if(!atlas.id.endsWith('_768')) continue
    //     let frames = {}
    //     let parents = {}
    //     for(res2 of atlas.resources) {
    //         if(res2.atlas) {
    //             parents[res2.id] = res2
    //             frames[res2.id] = {}
    //         } else {
    //             let frameName = res2.id
    //             frames[res2.parent][frameName] = {
    //                 frame: {
    //                     x: res2.ax,
    //                     y: res2.ay,
    //                     w: res2.aw,
    //                     h: res2.ah
    //                 }
    //             }
    //         }
    //     }
    //     for(let parentName in parents) {
    //         let parent = parents[parentName]
    //         let filename = parent.path[parent.path.length - 1]
    //         let output = { frames: frames[parentName] }
    //         output.meta = {
    //             image: '../atlases/' + filename + '.png',
    //             // format: "RGBA8888",
    //             size: {"w":parent.width,"h":parent.height},
    //             scale: "1"
    //         }
    //         fs.writeFileSync('pam/json/' + filename + '.json', JSON.stringify(output, null, 4), 'utf-8')
    //     }
    // }
}