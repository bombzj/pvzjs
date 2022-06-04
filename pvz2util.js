
// draw a plant
function plant(i, x, y) {
    let type = typeof i !== 'number' ? i : plantList[i]
    let a = new PVZ2.Plant(type)
    a.position.set(x, y)
    stage.addChild(a)
    newObjects.push(a)
    a.plantType = i
    a.ztype = 'plant'
    return a
}

// draw a zombie
function zombie(i, x, y) {
    let a = new PVZ2[zombieList[i].ZombieClass](zombieList[i])
    a.position.set(x, y)
    stage.addChild(a)
    newObjects.push(a)
    a.plantType = i
    a.ztype = 'zombie'
    return a
}

var sunTotal = 50
// draw a seed
function seed(i, x, y) {
    let c = new PVZ2.Seed(plantList[i])
    c.position.set(x, y)
    stage.addChild(c)
    newObjects.push(c)
    return c
}

//draw seed selection
function seedSel(x, y) {
    let a = drawPImage(x, y, texturesMap.IMAGE_UI_PACKETS_SELECT, stage)
    newObjects.push(a)
    a.ztype = 'seedSel'
    a.step = function() {}
    return a
    
}

// draw shovel
function shovel(x, y) {
    let a = drawPImage(x, y, texturesMap.IMAGE_UI_HUD_INGAME_SHOVEL_BUTTON, stage)
    a.ztype = 'shovel'
    newObjects.push(a)
    a.step = function() {
        if(useShovel) {
            this.texture = texturesMap.IMAGE_UI_HUD_INGAME_SHOVEL_BUTTON_DOWN
        } else {
            this.texture = texturesMap.IMAGE_UI_HUD_INGAME_SHOVEL_BUTTON
        }
    }
    return a
}

// draw background
function back(x, y) {
    return drawPImage(x, y, texturesMap.IMAGE_BACKGROUNDS_BACKGROUND_LOD_BIRTHDAY_TEXTURE, stage)
}

// draw sun
function sun(x, y) {
    return new PVZ2.Sun(x, y)
}

// draw sun counter
function numSun(x, y, num = 0) {
    let c = new PIXI.Container()
    let b = drawPImage(55, 24, texturesMap.IMAGE_UI_GENERIC_COUNTER_BG)
    b.scale.x *= 1.2
    b.alpha = 0.7
    let a = drawPImage(0, 0, texturesMap.IMAGE_UI_HUD_INGAME_SUN)

    let cnt = new PIXI.Text(num, { fontFamily: 'Arial', fontSize: 56, fill: 'white', align: 'center', fontWeight: '600', strokeThickness: 3 });
    cnt.position.set(117, 19)

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

// draw mowner
function car(x, y) {
    return drawPam(x, y, pams.POPANIM_MOWERS_MOWER_MODERN, undefined, 'car', stage)
}

function drawPam(x, y, pam, act, ztype, parent) {
    let a = new PVZ2.Object(pam, null, pam.actionFrame[act])
    a.position.set(x, y)
    a.pivot.set(pam.size[0] / 2, pam.size[1] / 2)
    if(parent) {
        parent.addChild(a)
    }
    newObjects.push(a)
    if(ztype) {
        a.ztype = ztype
    }
    return a
}

function drawPImage(x = 0, y = 0, texture, parent) {
    let a = new PIXI.Sprite(texture)
    a.position.set(x, y)
    a.scale.set(resScaleV)
    if(parent) {
        parent.addChild(a)
    }
    return a
}

function rm(obj) {
    obj.needRemove = true
}


var resScale
var resScaleV
PVZ2.setResolution = function(res) {
    let res2 = 384  // 384 / 768 / 1536 supported
    if(res >= 1536) {
        res2 = 1536
    } else if(res >= 768) {
        res2 = 768
    }
    PVZ2.zoom = res / 1200
    PVZ2.resolution = res2
    resScale = res2 / 1200
    resScaleV = 1200 / res2
    PVZ2.screenWidth = res
    PVZ2.screenHeight = res * 4 / 3
}
PVZ2.setResolution(768)

let texturesMap = {}
let atlasMap = {}

function setup(resources) {
    for(let resName of need2LoadGroup) {
        let res = resourcesMap[resName]
        if(!res) continue
        for(let image of res.images) {
            let baseTexture = resources[image.parent].texture
            texturesMap[image.id] = new PIXI.Texture(baseTexture, new PIXI.Rectangle(image.ax, image.ay, image.aw, image.ah))
            
            let parent = atlasMap[image.parent]
            if(!parent) {
                parent = atlasMap[image.parent] = {baseTexture: baseTexture, children: []} 
            }
            parent.children.push({
                id: image.id,
                texture: texturesMap[image.id]
            })
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
    stage.scale.set(PVZ2.zoom)
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
var plantType = {}, zombieType = {}
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
        // let t = plantType[p.ename]
        let t = rtons.PlantTypes[p.ename]
        plantType[t.TypeName] = t
        plantType[t.TypeName].prop = getByRTID(t.Properties)
        Object.assign(p, t)
    }
    for (let z of zombieList) {
        // let t = zombieType[z.ename]
        let t = rtons.ZombieTypes[z.ename]
        zombieType[t.TypeName] = t
        let prop = getByRTID(t.Properties)
        if(!prop) debugger
        zombieType[t.TypeName].prop = prop
        if(prop.ZombieArmorProps) {
            zombieType[t.TypeName].armorProps = []
            for(let armor of prop.ZombieArmorProps) {
                zombieType[t.TypeName].armorProps.push(getByRTID(armor))
            }
        }
        Object.assign(z, t)
    }
    loadResources()
    // resourcesMap = resources.resourcesmap.data

    loader.reset()
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
                pkg[alias] = obj.objdata
                rtMap[alias + '@' + pkgName] = obj.objdata
                obj.objdata.objclass = obj.objclass
            }
        }
    }
}
function getByRTID(str) {
    str = str.replace('$', '')
    let id = str.substr(5, str.length - 6)
    return rtMap[id]
}

function loadPlantType() {
    for(let obj of rtons.PlantTypes.objects) {
        let od = obj.objdata
        plantType[od.TypeName] = od
        plantType[od.TypeName].prop = getByRTID(od.Properties)
    }
}

function loadZombieType() {
    for(let obj of rtons.ZombieTypes.objects) {
        let od = obj.objdata
        if(!od) continue
        zombieType[od.TypeName] = od
        let prop = getByRTID(od.Properties)
        if(!prop) debugger
        zombieType[od.TypeName].prop = prop
        zombieType[od.TypeName].armorProps = []
        if(prop.ZombieArmorProps) {
            for(let armor of prop.ZombieArmorProps) {
                zombieType[od.TypeName].armorProps.push(getByRTID(armor))
            }
        }
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
        
        if(group.res && group.res != PVZ2.resolution) continue
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
}

function loadPlantResource(type) {
    loader.reset()
    for(let resName of type.PlantResourceGroups) {
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
    type.prop = getByRTID(type.Properties)
    loader.loadPlant = [type]
    loader.load((loader, resources) => initSinglePlant(loader, resources))
}

function initSinglePlant(loader, resources) {
    for(let plant of loader.loadPlant) {
        for(let resName of plant.PlantResourceGroups) {
            let res = resourcesMap[resName]
            if(!res) continue
            for(let image of res.images) {
                let baseTexture = resources[image.parent].texture
                texturesMap[image.id] = new PIXI.Texture(baseTexture, new PIXI.Rectangle(image.ax, image.ay, image.aw, image.ah))
            }
            for(let pam of res.pams) {
                pamInit(pam.name, resources[pam.name].data, texturesMap)
            }
        }
    }
    seedChooser.showPlant()
}

let seedChooserSeedSize = {width: 180, height: 120, top: 0}

class SeedChooser extends PIXI.Container {
    constructor(column, row) {
        super()
        this.column = column
        this.row = row
        this.seeds = []
        for(let y = 0;y < row;y++) {
            for(let x = 0;x < column;x++) {
                let seed = new PVZ2.Seed()
                this.seeds.push(seed)
                seed.position.set(x * seedChooserSeedSize.width, 
                    y * seedChooserSeedSize.height + seedChooserSeedSize.top)
                    this.addChild(seed)
            }
        }
        this.selectedTypes = new Set()
        this.turnPage(0)
        this.selspr = drawPImage(0, 0, texturesMap.IMAGE_UI_PACKETS_SELECT)
        this.addChild(this.selspr)
    }
    turnPage(page) {
        let types = rtons.PlantTypes.objects
        this.page = page
        for(let i = 0;i < this.column * this.row;i++) {
            let index = i + this.column * this.row * this.page
            if(index >= types.length) {
                this.seeds[i].clearType()
                continue
            }
            let type = types[index].objdata
            if(!type || !type.prop) debugger

            this.seeds[i].setType(type)
            // this.seeds[i].chooserIndex = index
            this.seeds[i].setSelected(this.selectedTypes.has(type))
        }
    }
    pageUp() {
        if(this.page > 0) {
            this.turnPage(this.page - 1)
        }
    }
    pageDown() {
        this.turnPage(this.page + 1)
    }
    click(x, y) {
        let dx = Math.floor(x / seedChooserSeedSize.width)
        let dy = Math.floor((y - seedChooserSeedSize.top) / seedChooserSeedSize.height)
        if(dx < this.column && dy >= 0) {
            let seed = this.seeds[dy * this.column + dx]
            if(seed && seed.type) {
                this.selected = seed
                if(!seed.selected) {
                    let next = seedBank.next()
                    if(next) {
                        next.setType(seed.type)
                        next.chooserIndex = seed.chooserIndex
                        seed.setSelected(true)
                        this.selectedTypes.add(seed.type)
                    }
                }
                this.selected = seed
                this.selspr.position.set(dx * seedBank.pos.width, dy * seedBank.pos.height)
                if(pams[seed.type.PopAnim]) {
                    this.showPlant()
                } else {
                    loadPlantResource(seed.type)
                }
            }
        }
    }
    showPlant() {
        if(this.selected) {
            if(this.demo) this.removeChild(this.demo)
            this.demo = new PVZ2.Plant(this.selected.type)
            this.demo.demo = true
            this.demo.position.set(1050, 500)
            this.addChild(this.demo)
            objects.push(this.demo)
        }
    }
    setSelected(type, selected) {
        let seed = this.seeds.find(x => x.type == type)
        if(seed) {
            seed.setSelected(selected)
        }
        if(selected) {
            this.selectedTypes.add(type)
        } else {
            this.selectedTypes.delete(type)
        }
    }
}

function ifCollide(obj1, obj2, rect1, rect2) {
    return obj1.x + rect1.mX < obj2.x + rect2.mX + rect2.mWidth
        && obj1.x + rect1.mX + rect1.mWidth > obj2.x + rect2.mX
        && obj1.y + rect1.mY < obj2.y + rect2.mY + rect2.mHeight
        && obj1.y + rect1.mY + rect1.mHeight > obj2.y + rect2.mY
}