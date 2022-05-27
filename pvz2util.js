
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
function zombie(i, x, y, act) {
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

// 画一个种子
function seed(i, x, y) {
    let textures = loader.resources.UI_SeedPackets_768_00.textures
    let planttype = plantList[i]
    let c = new PIXI.Container()

    let bgname = planttype.world
    if (!bgname || bgname == 'tutorial') bgname = 'ready'
    let b = new PIXI.Sprite(textures['IMAGE_UI_PACKETS_' + bgname.toUpperCase()])
    // b.position.set(x, y)
    let priceTab = new PIXI.Sprite(textures.IMAGE_UI_PACKETS_PRICE_TAB)
    priceTab.position.set(70, 35)

    let price = new PIXI.Text(planttype.prop.Cost, { fontFamily: 'Arial', fontSize: 32, fill: 'white', align: 'center', fontWeight: '600', strokeThickness: 3 });
    price.position.set(115 - price.width, 40)

    
    let cover1 = new PIXI.Sprite(textures.IMAGE_UI_PACKETS_COOLDOWN)
    cover1.tint = 0x0
    cover1.alpha = 0.5
    cover1.visible = false
    // cover1.position.set(0, 0)
    let cover2 = new PIXI.Sprite(textures.IMAGE_UI_PACKETS_COOLDOWN)
    cover2.tint = 0x0
    cover2.alpha = 0.5
    cover2.visible = false
    // cover1.position.set(0, 0)

    let a = new PIXI.Sprite(textures['IMAGE_UI_PACKETS_' + planttype.ename.toUpperCase()])
    a.position.set(10, 0)
    a.seedType = i

    c.addChild(b, a, priceTab, price, cover1, cover2)
    c.position.set(x, y)
    stage.addChild(c)
    newObjects.push(c)
    c.ztype = 'seed'
    c.planttype = planttype
    c.cd = planttype.prop.StartingCooldown * fps
    c.step = function(sunTotal) {
        if(this.cd == 0) {
            cover1.visible = this.planttype.prop.Cost <= sunTotal
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


function seedSel(x, y) {
    let textures = loader.resources.UI_SeedPackets_768_00.textures
    let a = new PIXI.Sprite(textures['IMAGE_UI_PACKETS_SELECT'])
    a.position.set(x, y)
    stage.addChild(a)
    a.ztype = 'seed'
    return a
    
}

// 画背景
function back(x, y) {
    let textures = loader.resources.DelayLoad_Background_FrontLawn_Birthday_768_00.textures
    // let a = new PIXI.Sprite(textures.IMAGE_BACKGROUNDS_BACKGROUND_LOD_BIRTHDAY_TEXTURE_LEFT)
    // a.position.set(x, y)
    let b = new PIXI.Sprite(textures.IMAGE_BACKGROUNDS_BACKGROUND_LOD_BIRTHDAY_TEXTURE)
    b.position.set(x, y)
    stage.addChild(b)
    return b
}

// 画太阳
function sun(x, y) {
    let pam = pams.SUN
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
    let textures = loader.resources.UI_ALWAYSLOADED_768_00.textures
    let b = new PIXI.Sprite(textures.IMAGE_UI_GENERIC_COUNTER_BG)
    b.position.set(35, 15)
    b.scale.x = 1.2
    b.alpha = 0.7
    let a = new PIXI.Sprite(textures.IMAGE_UI_HUD_INGAME_SUN)

    let cnt = new PIXI.Text(num, { fontFamily: 'Arial', fontSize: 32, fill: 'white', align: 'center', fontWeight: '600', strokeThickness: 3 });
    cnt.position.set(75, 12)

    c.cnt = cnt
    c._num = num
    c.addChild(b, a, cnt)
    c.position.set(x, y)
    stage.addChild(c)

    Object.defineProperty(c, 'num', {
        set: function (x) {
            c.cnt.text = x
            this._num = x
        }, 
        get: function () {
            return this._num
        }
    });
    return c
}

// 画小车
function car(x, y, act) {
    let pam = pams.MOWER_MODERN
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

function setup(resources) {
    for (let p of pamList) {
        for (let name of p.name) {
            if (resources[name].data) {
                let textures = {}
                if (typeof p.image == 'string') {
                    textures = resources[p.image].textures
                } else {
                    for (let i of p.image) {
                        Object.assign(textures, resources[i].textures)
                    }
                }
                pamInit(name, resources[name].data, textures)
            }
        }
    }

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

const pamList = [
    {
        name: ['SUNFLOWER'],
        image: 'PlantSunflower_768_00'
    },
    {
        name: ['PEASHOOTER'],
        image: 'PLANTPEASHOOTER_768_00'
    },
    {
        name: ['SNOWPEA', 'SNOWPEA_PLANTFOOD', 'T_SNOW_PEA'],
        image: 'PLANTSNOWPEA_768_00'
    },
    {
        name: ['CHERRYBOMB', 'CHERRYBOMB_EXPLOSION_TOP', 'CHERRYBOMB_EXPLOSION_REAR'],
        image: 'PLANTCHERRYBOMB_768_00'
    },
    {
        name: ['SUNFLOWER_TWIN'],
        image: 'PLANTTWINSUNFLOWER_768_00'
    },
    {
        name: ['THREEPEATER'],
        image: 'PLANTTHREEPEATER_768_00'
    },
    {
        name: ['SQUASH'],
        image: 'PLANTSQUASH_768_00'
    },
    {
        name: ['ZOMBIE_MODERN_ALLSTAR'],
        image: 'ZOMBIEMODERNALLSTARGROUP_768_00'
    },
    {
        name: ['ZOMBIE_EGYPT_BASIC'],
        image: 'ZombieEgyptBasicGroup_768_00'
    },
    {
        name: ['COCONUTCANNON', 'T_COCONUT_PROJECTILE_EXPLOSION'],
        image: 'PlantCoconutCannon_768_00'
    },
    {
        name: ['FUMESHROOM', 'FUMESHROOM_BUBBLES', 'FUMESHROOM_BUBBLES_HIT'],
        image: 'PLANTFUMESHROOM_768_00'
    },
    {
        name: ['BLOOMERANG', 'T_BLOOMERANG_PROJECTILE'],
        image: 'PlantBloomerang_768_00'
    },
    {
        name: ['BONKCHOY'],
        image: 'PLANTBONKCHOY_768_00'
    },
    {
        name: ['WALLNUT'],
        image: 'PLANTWALLNUT_768_00'
    },
    {
        name: ['CHOMPER'],
        image: 'PLANTCHOMPER_768_00'
    },
    {
        name: ['REPEATER'],
        image: 'PLANTREPEATER_768_00'
    },
    {
        name: ['GARGANTUAR'],
        image: 'ZOMBIEFUTUREGARGANTUARGROUP_768_00'
    },
    {
        name: ['SNAPDRAGON', 'SNAPDRAGON_FIRE'],
        image: 'PlantSnapdragon_768_00'
    },
    {
        name: [],
        image: ['DelayLoad_Background_FrontLawn_768_00', 'Grass_Transition_768_00', 'UI_SeedPackets_768_00', 'DelayLoad_Background_FrontLawn_Birthday_768_00']
    },
    {
        name: [],
        image: ['UI_ALWAYSLOADED_768_00']
    },
    {
        name: ['T_PEA_PROJECTILE'],
        image: 'PEAEFFECTS_768_00'
    },
    {
        name: ['ZOMBIE_ASH', 'T_SPLAT_SNOW_PEA', 'SUN'],
        image: 'levelcommon_768_00'
    },
    {
        name: ['SODROLL'],
        image: 'SodRollGroup_768_00'
    },
    {
        name: ['MOWER_MODERN'],
        image: 'MODERNMOWERGROUP_768_00'
    }
]

const loadJsons = [/*'planttypes'*/]
var stage = new PIXI.Container()
var objects = [], newObjects = []
var plantType, zombieType
var fps = 30
function loadPams(callback) {
    for (let p of pamList) {
        for (let name of p.name) {
            loader.add(name, "pam/pams/" + name + ".pam", {xhrType: PIXI.LoaderResource.XHR_RESPONSE_TYPE.BUFFER})
        }
        if (typeof p.image == 'string') {
            loader.add(p.image, "pam/json/" + p.image + ".json")
        } else {
            for (let i of p.image) {
                loader.add(i, "pam/json/" + i + ".json")
            }
        }
    }
    for (let j of loadJsons) {
        loader.add(j, 'packages/' + j + '.rton.json')
    }
    // loader.add('planttype', 'pam/planttype.json')
    loader.add('planttypes', 'pam/packages/planttypes.rton.json')
    loader.add('plantproperties', 'pam/packages/plantproperties.rton.json')
    loader.add('zombietypes', 'pam/packages/zombietypes.rton.json')
    loader.add('zombieproperties', 'pam/packages/zombieproperties.rton.json')

    loader.load((loader, resources) => setup(resources, callback));
}

function getRTIDName(str) {
    return str.substr(5, str.indexOf('@') - 5)
}

function loadPlantType(resources) {
    types = resources.planttypes.data
    props = resources.plantproperties.data

    props.objMap = {}
    for(let obj of props.objects) {
        if(!obj.aliases) continue
        for(let alias of obj.aliases) {
            props.objMap[alias] = obj
        }
    }

    plantType = {}
    
    for(let obj of types.objects) {
        let od = obj.objdata
        let propName = getRTIDName(od.Properties)
        let prop = props.objMap[propName].objdata
        plantType[od.TypeName] = {
            pamName: od.PopAnim.replace('POPANIM_PLANT_', ''),
            backdrop: od.AlmanacBackdropName,
            world: od.HomeWorld,
            prop: prop
        }
    }
}

function loadZombieType(resources) {
    types = resources.zombietypes.data
    props = resources.zombieproperties.data

    props.objMap = {}
    for(let obj of props.objects) {
        if(!obj.aliases) continue
        for(let alias of obj.aliases) {
            props.objMap[alias] = obj
        }
    }

    zombieType = {}
    
    for(let obj of types.objects) {
        let od = obj.objdata
        if(!od) continue
        let propName = getRTIDName(od.Properties)
        let prop = props.objMap[propName].objdata
        zombieType[od.TypeName] = {
            pamName: od.PopAnim.replace('POPANIM_ZOMBIE_', ''),
            world: od.HomeWorld,
            prop: prop
        }
    }
}