const zIndexHUD = 10000
const resourceRoot = 'pam/'
// draw a plant
function plant(i, x, y) {
    let type = typeof i !== 'number' ? i : plantList[i]
    let a = new PVZ2.Plant(type)
    a.position.set(x, y)
    a.y3 = y + 35
    a.z3 = -35
    scene.addChild(a)
    newObjects.push(a)
    a.plantType = i
    a.ztype = 'plant'
    return a
}

// draw a zombie
function zombie(i, x, y) {
    let type = typeof i !== 'number' ? i : zombieList[i]
    let a
    if(PVZ2[type.ZombieClass]) {
        a = new PVZ2[type.ZombieClass](type)
    } else {
        a = new PVZ2.ZombieBasic(type)
    }
    a.position.set(x, y)
    a.y3 = y + 35
    a.z3 = -35
    scene.addChild(a)
    newObjects.push(a)
    a.plantType = i
    a.ztype = 'zombie'
    return a
}

var sunTotal = 50
// draw a seed
function seed(i, x, y) {
    return newSeed(plantList[i], x, y)
}
function newSeed(type, x, y, noPrice = false, noCooldown = false) {
    let c = new PVZ2.Seed(type, noPrice, noCooldown)
    c.position.set(x, y)
    c.y3 = y
    stage.addChild(c)
    newObjects.push(c)
    c.zIndex = zIndexHUD
    return c
}

//draw seed selection
function seedSel(x, y) {
    let a = drawPImage(x, y, texturesMap.IMAGE_UI_PACKETS_SELECT, stage)
    newObjects.push(a)
    a.ztype = 'seedSel'
    a.step = function() {}
    a.zIndex = zIndexHUD + 1
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
    a.zIndex = zIndexHUD
    return a
}

var scene, shadowLayer
// draw background
function back(x, y) {
    scene.position.set(x, y)
    stage.addChild(scene)
    objects.push(scene)
    shadowLayer = new PIXI.Container()
    scene.addChild(shadowLayer)
    return scene
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
    c.zIndex = zIndexHUD
    return c
}

// draw mower
function car(x, y) {
    let car = new PVZ2.Mower(x, y, pams.POPANIM_MOWERS_MOWER_MODERN)
    return car
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

function drawPImage(x = 0, y = 0, texture, parent, centered = false) {
    let a = new PIXI.Sprite(texture)
    a.position.set(x, y)
    if(centered) {
        a.pivot.set(texture.width / 2, texture.height / 2)
    }
    a.scale.set(resScaleV)
    if(parent) {
        parent.addChild(a)
    }
    return a
}
function drawPImageCentered(x = 0, y = 0, texture, parent) {
    return drawPImage(x, y, texture, parent, true)
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
PVZ2.gameStart = true
PVZ2.field = {
    x: 406, y: 312,
    w: 128, h: 150
}
PVZ2.worlds = ['egypt', 'beach', 'cowboy', 'dark', 'dino', 'eighties', 'future', 'iceage', 'lostcity', 'modern', 'pirate']
PVZ2.modules = []


PVZ2.getGrids = function(obj) {
    let grids = PVZ2.grids
    if(obj.type.prop.MultiPlantLayer) {
        grids = PVZ2.gridsLayer[obj.type.prop.MultiPlantLayer]
    }
    return grids
}

let texturesMap = {}
let atlasTexturesMap = {}

function setup(resources) {
    for(let resName of need2LoadGroup) {
        loadGroupPost(resName, resources)
    }

    app.stage.addChild(stage)
    stage.scale.set(PVZ2.zoom)

    scene = new PVZ2.Scene()
    shadowLayer = new PIXI.Container()

    init(resources)
    app.ticker.add(delta => {
        objects.forEach(a => {
            if (a.needRemove || a.pamParant && a.pamParent.needRemove) {
                a.parent.removeChild(a)
                if(a.shadow) {
                    a.shadow.parent.removeChild(a.shadow)
                }
                if(a.gridX != undefined) {
                    let grids = PVZ2.getGrids(a)
                    grids[a.gridY][a.gridX] = undefined
                }
            }
        })
        objects = objects.filter(a => !a.needRemove && (!a.pamParent || !a.pamParent.needRemove))
        objects = objects.concat(newObjects)
        newObjects = []
        loop()
        stage.sortChildren()
        scene.sortChildren()
    })
}


let need2LoadGroup = ['LevelCommon', 'UI_AlwaysLoaded', 'UI_SeedPackets']
var stage = new PIXI.Container()
var objects = [], newObjects = []
var plantType = {}, zombieType = {}
var fps = 30
var resourcesMap

function loadPams(callback) {
    for (let j of packageJsons) {
        loader.add(j, resourceRoot + 'PACKAGES/' + j.toUpperCase() + '.RTON', {xhrType: PIXI.LoaderResource.XHR_RESPONSE_TYPE.BUFFER, loadType: 'rton'})
    }
    loader.load((loader, resources) => {
        loadPackagesPost(resources)
        for (let p of plantList) {
            let t = rtons.PlantTypes[p.ename]
            Object.assign(p, t)
        }
        for (let z of zombieList) {
            let t = rtons.ZombieTypes[z.ename]
            Object.assign(z, t)
        }
        loadResources()
    
        loader.reset()
        for(let type of plantList) {
            need2LoadGroup.push(...type.PlantResourceGroups)
        }
        for(let type of zombieList) {
            need2LoadGroup.push(...type.ResourceGroups)
        }
        for(let resName of need2LoadGroup) {
            loadGroupPre(resName)
        }
        loader.load((loader, resources) => setup(resources, callback));
    });
}

function loadGroupPre(resName) {
    let res = resourcesMap[resName]
    if(!res) return
    for(let pam of res.pams) {
        try {
            loader.add(pam.name, resourceRoot + pam.path.toUpperCase(), {xhrType: PIXI.LoaderResource.XHR_RESPONSE_TYPE.BUFFER})
        } catch(e) { }
    }
    for(let image of res.atlases) {
        try {
            loader.add(image.name, resourceRoot + 'ATLASES/' + image.path.toUpperCase() + '.PNG')
        } catch(e) { }
    }
}

function loadGroupPost(resName, resources) {
    let res = resourcesMap[resName]
    if(!res) return
    for(let image of res.images) {
        let baseTexture = resources[image.parent].texture
        atlasTexturesMap[image.parent] = baseTexture
        texturesMap[image.id] = new PIXI.Texture(baseTexture, new PIXI.Rectangle(image.ax, image.ay, image.aw, image.ah))
    }
    for(let pam of res.pams) {
        pamInit(pam.name, resources[pam.name].data)
    }
    res.loaded = true
}

const packageJsons = ['RESOURCES', 'ProjectileTypes', 'ArmorTypes', 'PlantProperties', 'ZombieProperties'
    , 'PlantTypes', 'ZombieTypes', 'PropertySheets', 'LevelModules']
var rtMap = {}
var rtons = {}

function loadPackagesPost(resources, packageList = packageJsons) {
    for(let pkgName of packageList) {
        let pkg = parseRton(resources[pkgName].data)
        rtons[pkgName] = pkg
        if(!pkg.objects) continue
        for(let [index, obj] of pkg.objects.entries()) {
            let propClass = PVZ2[obj.objclass]
            if(!propClass) {
                propClass = PVZ2.BaseProperties
            }
            let propObject = new propClass(obj.objdata)
            propObject.objclass = obj.objclass
            pkg.objects[index] = propObject
            if(!obj.aliases) continue
            for(let alias of obj.aliases) {
                pkg[alias] = propObject
                rtMap[alias + '@' + pkgName] = propObject
                // prepare data
                // if(PVZ2[obj.objclass]) {
                //     PVZ2[obj.objclass].prepareProp(obj.objdata, pkg)
                // }
            }
        }
        
        for(let obj of pkg.objects) {
            obj.prepare(pkg)
        }
    }
}
function getByRTID(str, current) {
    if(!str) debugger
    str = str.replace('$', '')
    let id = str.substr(5, str.length - 6)
    let split = id.split('@')
    if(split[1] == 'CurrentLevel' || split[1] == '.') {
        return current[split[0]]
    }
    return rtMap[id]
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

async function loadGroupResource(groupNames) {
    if(loader.loading) return
    groupNames = [...new Set(groupNames)].filter((x) => resourcesMap[x])
    if(groupNames.length == 0) {
        return
    }
    loader.reset()
    for(let resName of groupNames) {
        loadGroupPre(resName)
    }
    return new Promise( (resolve, reject) => {
        loader.load((loader, resources) => {
            for(let resName of groupNames) {
                loadGroupPost(resName, resources)
            }
            resolve()
        })
    })
}

async function loadPlantResource(typeNames) {
    let resourcesGroupNeeded = []
    for(let typeName of typeNames) {
        let type = rtons.PlantTypes[typeName]
        resourcesGroupNeeded.push(...type.getResourceGroup())
    }
    return loadGroupResource(resourcesGroupNeeded)
}

async function loadZombieResource(typeNames) {
    let resourcesGroupNeeded = []
    for(let typeName of typeNames) {
        let type = rtons.ZombieTypes[typeName]
        resourcesGroupNeeded.push(...type.getResourceGroup())
    }
    return loadGroupResource(resourcesGroupNeeded)
}



function initGrid(row, column) {
    PVZ2.row = row
    PVZ2.column = column
    PVZ2.grids = []
    PVZ2.gridsLayer = {
        core: PVZ2.grids,
        armor: [],   // like pumpkin
        ground: [],    // like lilypad
        power: [],    // like 
    }
    for(let grids of Object.values(PVZ2.gridsLayer)) {
        for(let i = 0;i < row;i++) {
            grids[i] = []
        }
    }
}

async function loadPackages(packageNames) {
    if(loader.loading) return
    loader.reset()
    for(let name of packageNames) {
        loader.add(name, resourceRoot + 'PACKAGES/LEVELS/' + name.toUpperCase() + '.RTON', {xhrType: PIXI.LoaderResource.XHR_RESPONSE_TYPE.BUFFER, loadType: 'rton'})
    }

    return new Promise( (resolve, reject) => {
        loader.load((loader, resources) => {
            loadPackagesPost(resources, packageNames)
            resolve()
        })
    })
}

async function loadLevel(levelName) {
    if(rtons[levelName]) {
        return rtons[levelName]
    }
    await loadPackages([levelName])
    let level = rtons[levelName]
    rtons.CurrentLevel = level
    let main = level.objects[0]
    if(main.objclass != 'LevelDefinition') debugger
    let resourcesGroupNeeded = main.getResourceGroup()
    await loadGroupResource(resourcesGroupNeeded)
    return level
}

function initLevel(level) {
    scene.removeChildren()
    if(PVZ2.seedBank) {
        stage.removeChild(PVZ2.seedBank.seedChooser)
    }
    if(PVZ2.seedConveyor) {
        stage.removeChild(PVZ2.seedConveyor.conveyor)
    }
    if(!level) debugger
    PVZ2.modules = []
    objects = objects.filter((x) => {
        return x.ztype != 'zombie' && x.ztype != 'scene' && x.ztype != 'mower'
    })
    
    let main = level.objects[0]
    let prop = main.StageModule
    if(PVZ2[prop.objclass]) {
        PVZ2.stage = new PVZ2[prop.objclass](prop)
        PVZ2.stage.init()
        PVZ2.modules.push(PVZ2.stage)
    }

    for(let module of main.Modules) {
        if(PVZ2[module.objclass]) {
            let m = new PVZ2[module.objclass](module)
            m.init()
            PVZ2.modules.push(m)
        }
    }
}


class StretchingSprite extends PIXI.Container {
    constructor(texture, width, height) {
        super()
        width *= resScale
        height *= resScale
        let oriRect = texture.orig
        let height3 = oriRect.height / 3
        let baseTexture = texture.baseTexture
        if(width <= texture.width) {
            if(height <= texture.height) {
                this.addChild(new PIXI.Sprite(texture))
            } else {
                let s1 = new PIXI.Sprite(new PIXI.Texture(baseTexture, new PIXI.Rectangle(oriRect.x, oriRect.y, oriRect.width, height3)))
                let s2 = new PIXI.Sprite(new PIXI.Texture(baseTexture, new PIXI.Rectangle(oriRect.x, oriRect.y + height3, oriRect.width, height3)))
                s2.position.set(0, height3)
                s2.scale.y = (height - height3 * 2) / height3
                let s3 = new PIXI.Sprite(new PIXI.Texture(baseTexture, new PIXI.Rectangle(oriRect.x, oriRect.y + height3 * 2, oriRect.width, height3)))
                s3.position.set(0, height - height3)
                this.addChild(s1, s2, s3)
            }
        } else {
            if(height <= texture.height) {
                this.drawStripe(baseTexture, oriRect, width, 0, oriRect.y, oriRect.height)
            } else {
                this.drawStripe(baseTexture, oriRect, width, 0, oriRect.y, height3)
                this.drawStripe(baseTexture, oriRect, width, height3, oriRect.y + height3, height3, (height - height3 * 2) / height3)
                this.drawStripe(baseTexture, oriRect, width, height - height3, oriRect.y + height3 * 2, height3)
            }
        }
        this.scale.set(resScaleV)
    }
    drawStripe(baseTexture, oriRect, width, y, oy, oheight, scaleY = 1) {
        let width3 = oriRect.width / 3
        let s1 = new PIXI.Sprite(new PIXI.Texture(baseTexture, new PIXI.Rectangle(oriRect.x, oy, width3, oheight)))
        s1.position.set(0, y)
        let s2 = new PIXI.Sprite(new PIXI.Texture(baseTexture, new PIXI.Rectangle(oriRect.x + width3, oy, width3, oheight)))
        s2.position.set(width3, y)
        s2.scale.x = (width - width3 * 2) / width3
        let s3 = new PIXI.Sprite(new PIXI.Texture(baseTexture, new PIXI.Rectangle(oriRect.x + width3 * 2, oy, width3, oheight)))
        s3.position.set(width - width3, y)
        s1.scale.y = s2.scale.y = s3.scale.y = scaleY
        this.addChild(s1, s2, s3)
    }
}

PVZ2.plantRect = {
    mX: 40,    mY: 0,
    mWidth: 40, mHeight: 100
}

const ObjectWidthY = 30
function ifCollide(obj1, obj2, rect1, rect2) {
    return obj1.x + rect1.mX < obj2.x + rect2.mX + rect2.mWidth
        && obj1.x + rect1.mX + rect1.mWidth > obj2.x + rect2.mX
        && obj1.y3 + ObjectWidthY > obj2.y3
        && obj1.y3 - ObjectWidthY < obj2.y3
        && obj1.z3 + rect1.mY > obj2.z3 + rect2.mY - rect2.mHeight
        && obj1.z3 + rect1.mY - rect1.mHeight < obj2.z3 + rect2.mY
}

function getCloser(from, to, speed) {
    if(from > to) {
        from -= speed
        if(from < to) {
            from = to
        }
    } else if(from < to) {
        from += speed
        if(from > to) {
            from = to
        }
    }
    return from
}

function randomMinMax(numbers) {
    let delta = numbers.Max - numbers.Min
    if(delta == 0) {
        return numbers.Min
    }
    return Math.random() * delta + numbers.Min
}
function randomInArray(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
}
function calcAngle(dx, dy) {
    let dist = Math.sqrt(dx**2 + dy**2)
    let angle = Math.asin(dy / dist)
    if(dx < 0) {
        angle = Math.PI - angle
    }
    return {
        angle: angle,
        vx: dx / dist,
        vy: dy / dist
    }
}

function addFilter(obj, add) {
    if(obj.filters) {
        obj.filters.push(add)
    } else {
        obj.filters = [add]
    }
}
function removeFilter(obj, add) {
    if(obj.filters) {
        obj.filters.remove(add)
        if(obj.filters.length == 0) {
            obj.filters = null
        }
    }
}

Array.prototype.remove = function (val) {
    var index = this.indexOf(val);
    if (index > -1) {
        this.splice(index, 1);
    }
}