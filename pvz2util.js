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
    let c = new PVZ2.Seed(plantList[i])
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
    // loader.add('resourcesmap', resourceRoot + 'resourcesmap.json')
    loader.load((loader, resources) => {
        loadPackagesPost(resources)
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

const packageJsons = ['RESOURCES', 'PlantTypes', 'PlantProperties', 'ZombieTypes', 'ZombieProperties'
    , 'ArmorTypes', 'PropertySheets', 'ProjectileTypes', 'LevelModules']
var rtMap = {}
var rtons = {}

function loadPackagesPost(resources, packageList = packageJsons) {
    for(let pkgName of packageList) {
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
        resourcesGroupNeeded.push(...type.PlantResourceGroups)
        if(!type.prop) {
            type.prop = getByRTID(type.Properties)
        }
    }
    return loadGroupResource(resourcesGroupNeeded)
}

async function loadZombieResource(typeNames) {
    let resourcesGroupNeeded = []
    for(let typeName of typeNames) {
        let type = rtons.ZombieTypes[typeName]
        resourcesGroupNeeded.push(...type.ResourceGroups)
        if(!type.prop) {
            type.prop = getByRTID(type.Properties)
        }
    }
    return loadGroupResource(resourcesGroupNeeded)
}


let seedChooserSeedSize = {width: 180, height: 120, top: 0}
let seedChooserDemoPos = {x: 20, y: -280, width: 250, height: 250}

class SeedChooser extends PIXI.Container {
    constructor(column, row) {
        super()
        this.column = column
        this.row = row
        this.seeds = []
        this.typeNames = rtons.PropertySheets.DefaultGameProps.PlantTypeOrder
        for(let y = 0;y < row;y++) {
            for(let x = 0;x < column;x++) {
                let seed = new PVZ2.Seed()
                this.seeds.push(seed)
                seed.position.set(x * seedChooserSeedSize.width, 
                    y * seedChooserSeedSize.height + seedChooserSeedSize.top)
                    this.addChild(seed)
            }
        }
        this.pickedTypes = new Set()
        this.turnPage(0)
        this.selspr = drawPImage(0, 0, texturesMap.IMAGE_UI_PACKETS_SELECT)
        this.demoSprite = new StretchingSprite(texturesMap.IMAGE_UI_GENERIC_GREENBUTTON_DOWN, seedChooserDemoPos.width, seedChooserDemoPos.height)
        this.demoSprite.position.set(seedChooserDemoPos.x, seedChooserDemoPos.y)
        this.addChild(this.selspr, this.demoSprite)
        let upButton = drawPImage(0, 0, texturesMap.IMAGE_UI_HUD_INGAME_PROGRESS_BAR_UPGRADE_ARROW_GREEN)
        let downButton = drawPImage(0, 0, texturesMap.IMAGE_UI_HUD_INGAME_PROGRESS_BAR_UPGRADE_ARROW_GREEN)
        downButton.angle = 180
        upButton.interactive = downButton.interactive = true
        upButton.scale.set(2)
        downButton.scale.set(2)
        upButton.position.set(320, -200)
        downButton.position.set(400, 0)
        upButton.click = x => {
            this.pageUp()
        }
        downButton.click = x => {
            this.pageDown()
        }
        this.addChild(upButton, downButton)
        this.zIndex = zIndexHUD
    }
    turnPage(page) {
        this.page = page
        for(let i = 0;i < this.column * this.row;i++) {
            let index = i + this.column * this.row * this.page
            if(index >= this.typeNames.length) {
                this.seeds[i].clearType()
                continue
            }
            let type = rtons.PlantTypes[this.typeNames[index]]
            if(!type || !type.prop) debugger

            this.seeds[i].setType(type)
            // this.seeds[i].chooserIndex = index
            this.seeds[i].setPicked(this.pickedTypes.has(type.TypeName))
        }
    }
    pageUp() {
        if(this.page > 0) {
            this.turnPage(this.page - 1)
        }
    }
    pageDown() {
        if(this.page < this.typeNames.length / this.row / this.column - 1) {
            this.turnPage(this.page + 1)
        }
    }
    click(x, y) {
        let dx = Math.floor(x / seedChooserSeedSize.width)
        let dy = Math.floor((y - seedChooserSeedSize.top) / seedChooserSeedSize.height)
        if(dx < this.column && dy >= 0) {
            this.click2(dx, dy)
        }
    }
    click2(dx, dy) {
        let seed = this.seeds[dy * this.column + dx]
        if(seed && seed.type) {
            this.selected = seed
            if(!seed.picked) {
                this.addSeed(seed)
            }
            this.selected = seed
            this.selspr.position.set(dx * PVZ2.seedBank.pos.width, dy * PVZ2.seedBank.pos.height)
            if(pams[seed.type.PopAnim]) {
                this.showPlant()
            } else {
                let current = this.selected.type.TypeName
                loadPlantResource([seed.type.TypeName]).then( () => {
                    if(current == this.selected.type.TypeName) {
                        this.showPlant()
                    }
                })
            }
        }
    }
    addSeedByName(name) {
        let next = PVZ2.seedBank.next()
        let type = rtons.PlantTypes[name]
        let seed = this.seeds.find(x => x.type.TypeName == name)
        if(seed) {
            seed.setPicked(true)
        }
        if(next) {
            next.setType(type)
            this.pickedTypes.add(name)
        }
    }
    addSeed(seed) {
        let next = PVZ2.seedBank.next()
        if(next) {
            next.setType(seed.type)
            seed.setPicked(true)
            this.pickedTypes.add(seed.type.TypeName)
        }
    }
    showPlant() {
        if(this.selected) {
            if(this.demo) this.removeChild(this.demo)
            this.demo = new PVZ2.Plant(this.selected.type)
            this.demo.demo = true
            this.demo.position.set(seedChooserDemoPos.x + seedChooserDemoPos.width / 2, seedChooserDemoPos.y + seedChooserDemoPos.height / 2 + 20)
            this.demo.y3 = this.demo.y
            this.addChild(this.demo)
            objects.push(this.demo)
        }
    }
    setPicked(typeName, picked) {
        let seed = this.seeds.find(x => x.type.TypeName == typeName)
        if(seed) {
            seed.setPicked(picked)
        }
        if(picked) {
            this.pickedTypes.add(typeName)
        } else {
            this.pickedTypes.delete(typeName)
        }
    }
}

PVZ2.Seed = class extends PIXI.Container {
    constructor(type) {
        super()
        this.bg = drawPImage()
        this.priceTab = drawPImage(115, 55, texturesMap.IMAGE_UI_PACKETS_PRICE_TAB)
        this.price = new PIXI.Text('', { fontFamily: 'Arial', fontSize: 56, fill: 'white', align: 'center', fontWeight: '600', strokeThickness: 3 });

        let cover1 = this.cover1 = drawPImage(0, 0, texturesMap.IMAGE_UI_PACKETS_COOLDOWN)
        cover1.tint = 0x0
        cover1.alpha = 0.5
        cover1.visible = false
        let cover2 = this.cover2 = drawPImage(0, 0, texturesMap.IMAGE_UI_PACKETS_COOLDOWN)
        cover2.tint = 0x0
        cover2.alpha = 0.5
        cover2.visible = false
        cover2.origScaleY = cover2.scale.y

        this.plant = drawPImage()

        this.addChild(this.bg, this.plant, this.priceTab, this.price, cover1, cover2)
        this.ztype = 'seed'
        if(type) {
            this.setType(type)
        } else {
            this.clearType()
        }
    }
    step() {
        if(!this.type || !PVZ2.gameStart) return
        if(PVZ2.debug) this.cd = 0
        if(this.cd == 0) {
            this.cover1.visible = this.type.prop.Cost > sunTotal
            this.cover2.visible = false
            return
        }
        this.cd--
        this.cover2.scale.y = this.cd / this.type.prop.PacketCooldown / fps * this.cover2.origScaleY
        this.cover1.visible = true
        this.cover2.visible = true
    }
    use() {
        this.cd = this.type.prop.PacketCooldown * fps
    }
    ready() {
        return this.cd == 0
    }
    refresh() {
        this.cd = 0
    }
    clearType() {
        this.type = undefined
        this.bg.texture = texturesMap.IMAGE_UI_PACKETS_EMPTY_PACKET
        this.bg.alpha = 0.5
        this.price.visible = false
        this.plant.visible = false
        this.priceTab.visible = false
    }
    setType(type) {
        if(!type.prop) debugger
        let bgname = type.HomeWorld
        if(type.Premium) bgname = 'ready_premium'
        else if(!bgname) bgname = 'homeless'
        else if (bgname == 'tutorial' || bgname == 'modern') bgname = 'ready'
        this.bg.texture = texturesMap['IMAGE_UI_PACKETS_' + bgname.toUpperCase()]
        this.bg.alpha = 1
        this.price.text = type.prop.Cost
        this.price.position.set(180 - this.price.width, 60)
        this.price.visible = true
        this.plant.texture = texturesMap['IMAGE_UI_PACKETS_' + type.TypeName.toUpperCase()]
        this.plant.position.set(15, 68 - this.plant.texture.height)
        this.plant.visible = true
        this.priceTab.visible = true
        this.type = type
        if(type.prop.StartingCooldown) {
            this.cd = type.prop.StartingCooldown * fps
        } else {
            this.cd = type.prop.PacketCooldown * fps
        }
    }
    setPicked(picked) {
        this.cover1.visible = picked
        this.picked = picked
    }
}

PVZ2.SeedConveyor = class extends PIXI.Container {
    constructor(prop) {
        super()
        this.prop = prop
        let top = drawPImage(0, 0, texturesMap.IMAGE_UI_CONVEYOR_CONVEYOR_TOP)
        let sideLeft = drawPImage(0, top.height, texturesMap.IMAGE_UI_CONVEYOR_CONVEYOR_SIDE)
        let belt = new PIXI.TilingSprite(texturesMap.IMAGE_UI_CONVEYOR_CONVEYOR_BELT, top.width / resScaleV, sideLeft.height / resScaleV)
        belt.position.set(sideLeft.width, top.height)
        belt.scale.set(resScaleV)
        let sideRight = drawPImage(sideLeft.width + belt.width, top.height, texturesMap.IMAGE_UI_CONVEYOR_CONVEYOR_SIDE)
        this.addChild(belt, sideLeft, sideRight)
    }
    step() {
    }
}

PVZ2.ZombiePacket = class extends PIXI.Container {
    constructor(type) {
        super()
        if(type) {
            this.setType(type)
        } else {
            this.clearType()
        }
    }
    clearType() {
    }
    setType(type) {

    }
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
    if(level.objects[0].objclass != 'LevelDefinition') debugger
    let main = level.objects[0].objdata
    let prop = getByRTID(main.StageModule, level)
    let resourcesGroupNeeded = []
    if(PVZ2[prop.objclass]) {
        resourcesGroupNeeded.push(...PVZ2[prop.objclass].getResourceGroup(prop))
    }
    for(let module of main.Modules) {
        let prop = getByRTID(module, level)
        if(PVZ2[prop.objclass]) {
            resourcesGroupNeeded.push(...PVZ2[prop.objclass].getResourceGroup(prop))
        }
    }
    await loadGroupResource(resourcesGroupNeeded)
    return level
}

function initLevel(level) {
    scene.removeChildren()
    if(PVZ2.seedBank) {
        stage.removeChild(PVZ2.seedBank.seedChooser)
    }
    if(PVZ2.conveyor) {
        stage.removeChild(PVZ2.conveyor)
    }
    if(!level) debugger
    PVZ2.modules = []
    objects = objects.filter((x) => {
        return x.ztype != 'zombie' && x.ztype != 'scene' && x.ztype != 'mower'
    })
    
    let main = level.objects[0].objdata
    let prop = getByRTID(main.StageModule, level)
    if(PVZ2[prop.objclass]) {
        PVZ2.stage = new PVZ2[prop.objclass](prop)
        PVZ2.stage.init()
        PVZ2.modules.push(PVZ2.stage)
    }

    for(let module of main.Modules) {
        let prop = getByRTID(module, level)
        if(PVZ2[prop.objclass]) {
            let m = new PVZ2[prop.objclass](prop)
            m.init()
            PVZ2.modules.push(m)
        }
    }
}

PVZ2.Scene = class extends PIXI.Container {
    static backPosition = {x: 600, y: 0}
    static moveSpeed = 20
    constructor(prefix = 'IMAGE_BACKGROUNDS_BACKGROUND_LOD_BIRTHDAY') {
        super()
        this.bg1 = drawPImage(0, 0, texturesMap[prefix + '_TEXTURE'])
        this.bg2 = drawPImage(this.bg1.width, 0, texturesMap[prefix + '_TEXTURE_RIGHT'])
        this.addChild(this.bg1, this.bg2)
        this.zIndex = -1
        this.ztype = 'scene'
    }
    step() {
        if(this.destX != undefined) {
            this.x = getCloser(this.x, this.destX, PVZ2.Scene.moveSpeed)
            if(this.x == this.destX) {
                this.destX = undefined
            }
        }
    }
    goFront() {
        this.destX = 0
    }
    goBack() {
        this.destX = -PVZ2.Scene.backPosition.x
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