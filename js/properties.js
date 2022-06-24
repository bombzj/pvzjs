PVZ2.BaseProperties = class {
    constructor(prop) {
        if(prop instanceof PVZ2.BaseProperties) {
            this.prop = prop
        } else {
            Object.assign(this, prop)
        }
    }
    init() { }
    step() { }
    action() { }    // one time action without new instance
    click(x, y) {
        return false    // not handled
    }
    getResourceGroup() {
        return []
    }
    prepare(parent) {}
}
PVZ2.LevelDefinition = class extends PVZ2.BaseProperties {
    getResourceGroup() {
        let resourcesGroupNeeded = []
        if(this.StageModule) {
            resourcesGroupNeeded.push(...this.StageModule.getResourceGroup())
        }
        for(let module of this.Modules) {
            resourcesGroupNeeded.push(...module.getResourceGroup())
        }
        return resourcesGroupNeeded
    }
    prepare(parent) {
        this.StageModule = getByRTID(this.StageModule)
        for(let [index, module] of this.Modules.entries()) {
            this.Modules[index] = getByRTID(module, parent)
        }
    }
}
PVZ2.ZombieType = class extends PVZ2.BaseProperties {
    getResourceGroup() {
        return this.ResourceGroups
    }
    prepare() {
        zombieType[this.TypeName] = this
        this.prop = this.Properties = getByRTID(this.Properties)
        if(!this.prop) debugger
        this.armorProps = []
        if(this.prop.ZombieArmorProps) {
            for(let armor of this.prop.ZombieArmorProps) {
                this.armorProps.push(getByRTID(armor))
            }
        }
    }
}
PVZ2.PlantType = class extends PVZ2.BaseProperties {
    getResourceGroup() {
        return this.PlantResourceGroups
    }
    prepare() {
        plantType[this.TypeName] = this
        this.prop = this.Properties = getByRTID(this.Properties)
    }
}
PVZ2.PlantTypeGraveBuster = class extends PVZ2.PlantType {

}
PVZ2.PlantTypePeapod = class extends PVZ2.PlantType {

}
PVZ2.PlantTypePowerPlant = class extends PVZ2.PlantType {

}
PVZ2.PlantTypeLilyPad = class extends PVZ2.PlantType {

}
PVZ2.PlantTypeTangleKelp = class extends PVZ2.PlantType {

}
PVZ2.PlantTypeChardGuard = class extends PVZ2.PlantType {

}
PVZ2.PlantTypeHotPotato = class extends PVZ2.PlantType {

}
PVZ2.PlantTypeGoldLeaf = class extends PVZ2.PlantType {

}
PVZ2.PlantTypeCeleryStalker = class extends PVZ2.PlantType {

}
PVZ2.PlantTypeIntensiveCarrot = class extends PVZ2.PlantType {

}
PVZ2.PlantTypeHollyKnight = class extends PVZ2.PlantType {

}
PVZ2.PlantTypeUltomato = class extends PVZ2.PlantType {

}

PVZ2.SeedBankProperties = class extends PVZ2.BaseProperties {
    init() {
        this.pos = this.constructor.pos
        for(let i = 0;i < 8;i++){
            this.seeds.push(seed(-1, 0, 0))
        }
        this.resetSeedsPosition()
        // seed chooser & bank
        this.seedChooser = new SeedChooser(5, 5)
        stage.addChild(this.seedChooser)
        this.selspr = seedSel(0, 100)
        this.selspr.visible = false 
        PVZ2.seedBank = this
        
        this.seedChooser.position.set(this.pos.width + 20, 440)
        if(this.prop.PresetPlantList) {
            for(let plant of this.prop.PresetPlantList) {
                this.seedChooser.addSeedByName(plant.PlantType)
            }
        }
        if(this.prop.SelectionMethod == 'chooser') {
            for(let name of this.constructor.initSeeds) {
                this.seedChooser.addSeedByName(name)
            }
            this.seedChooser.visible = true
            this.seedChooser.click2(0, 0)
        } else if(this.prop.SelectionMethod == 'preset') {
            this.seedChooser.visible = false
        }
        PVZ2.numSun = numSun(0, 0, PVZ2.debug ? 5000 : 50)
    }
    static initSeeds = ['sunflower', 'peashooter', 'wallnut', 'snowpea', 'homingthistle']
    seeds = []
    static pos = {
        x: 0, y: 150, height: 120, width: 180
    }
    next() {    // return the next available empty seed, or undefined if full
        for(let seed of this.seeds) {
            if(!seed.type) {
                return seed
            }
        }
    }
    step() {
        this.selspr.visible = (selPlant != -1)
        this.selspr.y = selPlant * this.pos.height + this.pos.y
    }
    resetSeedsPosition() {
        for(let i = 0;i < this.seeds.length;i++) {
            this.seeds[i].position.set(0, this.pos.height * i + this.pos.y)
        }
    }
    click(x, y) {
        let pos = this.constructor.pos
        if(!PVZ2.gameStart) {
            if(this.prop.SelectionMethod == 'preset') {
                return
            }
            if(x >= this.seedChooser.x && y >this. seedChooser.y) {
                this.seedChooser.click(x - this.seedChooser.x, y - this.seedChooser.y)
            }
            // click seedbank to cancel
            if(x < pos.width) {
                let dy = (y - pos.y) / pos.height
                let dy2 = Math.floor(dy)
                if(dy2 >= 0 && dy2 < 8) {
                    let seed = this.seeds[dy2]
                    if(seed.type) {
                        this.seedChooser.setPicked(seed.type.TypeName, false)
                        seed.clearType()
                        // move empty seed to the last
                        this.seeds.splice(dy2, 1)
                        this.seeds.push(seed)
                        this.resetSeedsPosition()
                    }
                }
            }
            return
        }
        // pick plant
        if(x < pos.width) {
            let dy = (y - pos.y) / pos.height
            let dy2 = Math.floor(dy)
            if(dy2 >= 0 && dy2 < 8) {
                if(dy2 == selPlant){
                    selPlant = -1
                } else {
                    let seed = this.seeds[dy2]
                    if(seed.type) {
                        let cost = seed.type.prop.Cost
                        if(sunTotal >= cost && seed.ready()) {
                            selPlant = dy2
                            useShovel = false
                            return true
                        }
                    }
                }
            }
        }
    }
    getResourceGroup() {
        let resourcesGroupNeeded = []
        if(this.PresetPlantList) {
            if(this.PresetPlantList) {
                for(let plant of this.PresetPlantList) {
                    let type = rtons.PlantTypes[plant.PlantType]
                    resourcesGroupNeeded.push(...type.getResourceGroup())
                }
            }
        }
        if(this.SelectionMethod == 'chooser') {
            for(let typeName of this.constructor.initSeeds) {
                let type = rtons.PlantTypes[typeName]
                resourcesGroupNeeded.push(...type.getResourceGroup())
            }
        }
        return resourcesGroupNeeded
    }
}
PVZ2.ConveyorSeedBankProperties = class extends PVZ2.BaseProperties {
    seeds = []
    static pos = {
        x: 0, y: 150, height: 120, width: 180
    }
    init() {
        PVZ2.seedConveyor = this
        this.conveyor = new PVZ2.SeedConveyor()
        this.conveyor.position.set(0, 0)
        stage.addChild(this.conveyor)
        this.selspr = seedSel(10, 100)
        this.selspr.visible = false 
        stage.addChild(this.selspr)
    }
    seedCounter = 0
    step() {
        if(PVZ2.gameStart) {
            this.conveyor.step()
            let stickY = 10
            let height = this.constructor.pos.height
            for(let seed of this.seeds) {
                if(seed.y > stickY) {
                    seed.y -= 4
                    if(seed.y < stickY) {
                        seed.y = stickY
                    }
                }
                stickY = seed.y + height
            }
            this.seedCounter--
            if(this.seedCounter <= 0 && this.seeds.length < 9) {
                let type = plantType[this.getRandomPlant()]
                if(type) {
                    this.seeds.push(newSeed(type, 10, 1300, true, true))
                    this.seedCounter = 150
                }
            }

            this.selspr.visible = (selPlant != -1)
            if(this.selspr.visible) {
                let seed = this.seeds[selPlant]
                this.selspr.y = seed.y
            }
        }
    }
    use(index) {
        let rm = this.seeds.splice(index, 1)
        stage.removeChild(rm[0])
    }
    click(x, y) {
        let pos = this.constructor.pos
        for(let i = 0;i < this.seeds.length;i++) {
            let seed = this.seeds[i]
            let dx = x - seed.x
            let dy = y - seed.y
            if(dx > 0 && dy > 0 && dx < pos.width && dy < pos.height) {
                if(selPlant == i) {
                    selPlant = -1
                } else {
                    selPlant = i
                }
                break
            }
        }
    }
    getRandomPlant() {
        let plant = rndObj(this.prop.InitialPlantList)
        return plant.PlantType
    }
    getResourceGroup() {    
        let resourcesGroupNeeded = []
        for(let plant of this.InitialPlantList) {
            let type = rtons.PlantTypes[plant.PlantType]
            if(!type) continue  // ? tool_powertile_alpha in future16
            resourcesGroupNeeded.push(...type.getResourceGroup())
        }
        return resourcesGroupNeeded
    }
}
PVZ2.SunDropperProperties = class extends PVZ2.BaseProperties {
    sunCnt = 0
    step() {
        // a new sun every 20 sec
        this.sunCnt++
        if(this.sunCnt == 300) {
            this.sunCnt = 0
            sun(PVZ2.field.x + rnd(0, 800), 0)
        }
    }
}

PVZ2.InitialGridItemProperties = class extends PVZ2.BaseProperties {
    init() {
        if(this.prop.InitialGridItemPlacements) {
            for(let placement of this.prop.InitialGridItemPlacements) {
                scene.itemGrid(gridType[placement.TypeName], placement.GridX - 1, placement.GridY)
            }
        }
    }
    getResourceGroup() {
        if(!this.InitialGridItemPlacements) {
            return []
        }
        let types = new Set()
        for(let placement of this.InitialGridItemPlacements) {
            types.add(placement.TypeName)
        }
        
        let resourcesGroupNeeded = []
        for(let type of types) {
            resourcesGroupNeeded.push(...gridType[type].getResourceGroup())
        }
        return resourcesGroupNeeded
    }
}

PVZ2.ProtectThePlantChallengeProperties = class extends PVZ2.BaseProperties {
    init() {
        if(this.prop.Plants) {
            for(let plant of this.prop.Plants) {
                scene.plantGrid(rtons.PlantTypes[plant.PlantType], plant.GridX - 1, plant.GridY)
                scene.tileGrid(pams.POPANIM_BACKGROUNDS_PROTECT_TILE, 'animation', plant.GridX - 1, plant.GridY)
            }
        }
    }
    getResourceGroup() {
        if(!this.Plants) {
            return []
        }
        let types = new Set()
        for(let plant of this.Plants) {
            types.add(plant.PlantType)
        }
        
        let resourcesGroupNeeded = ['ProtectThePlantChallengeModule']
        for(let type of types) {
            resourcesGroupNeeded.push(...rtons.PlantTypes[type].getResourceGroup())
        }
        return resourcesGroupNeeded
    }
}

PVZ2.WaveManagerModuleProperties = class extends PVZ2.BaseProperties {
    prepare(parent) {
        if(this.DynamicZombies) {
            for(let dyn of this.DynamicZombies) {
                if(!dyn.ZombiePool) continue
                for(let [index, zombie] of dyn.ZombiePool.entries()) {
                    dyn.ZombiePool[index] = getByRTID(zombie, parent)
                }
            }
        }
        if(this.WaveManagerProps) {
            this.WaveManagerProps = getByRTID(this.WaveManagerProps, parent)
        }
    }
    getResourceGroup() {
        let zombies = this.getZombies()
        console.log(zombies.length)
        let resourcesGroupNeeded = []
        for(let zombie of zombies) {
            resourcesGroupNeeded.push(...zombie.getResourceGroup())
        }
        resourcesGroupNeeded.push(this.WaveManagerProps.getResourceGroup())  // included in the zombie resource above
        return resourcesGroupNeeded
    }
    static meterPos = {
        x: 570, y: 30, width: 400, height: 20
    }
    static waveInterval = 10
    init() {
        PVZ2.waveManager = this
        this.packets = this.prop.getZombies()

        this.progressMeter = new PIXI.Container()
        this.progressMeter.position.set(this.constructor.meterPos.x, this.constructor.meterPos.y)
        stage.addChild(this.progressMeter)

        let props = this.prop.WaveManagerProps
        this.flagCount = props.WaveCount / props.FlagWaveInterval
        this.meter = drawPImage(0, 0, texturesMap.IMAGE_UI_HUD_INGAME_PROGRESS_METER)
        this.meterFill = drawPImage(this.constructor.meterPos.width + 20, 10, texturesMap.IMAGE_UI_HUD_INGAME_PROGRESS_METER_FILL)
        this.meterFill.pivot.x = 22
        this.meterFill.scale.x = 0
        this.zombieHead = drawPImage(this.constructor.meterPos.width, 0, texturesMap.IMAGE_UI_HUD_INGAME_PROGRESS_METER_ZOMBIEHEAD)
        this.progressMeter.addChild(this.meter, this.meterFill)
        this.meterFlags = []
        let width = this.constructor.meterPos.width
        for(let i = 0;i < this.flagCount;i++) {
            let x = width - width * (i + 1) / this.flagCount
            let flag = drawPImage(x, 0, texturesMap.IMAGE_UI_HUD_INGAME_PROGRESS_METER_FLAG_DEFAULT)
            let pole = drawPImage(x - 5, 0, texturesMap.IMAGE_UI_HUD_INGAME_PROGRESS_METER_FLAG_POLE)
            this.meterFlags[i] = {
                flag: flag,
                pole: pole
            }
            this.progressMeter.addChild(pole, flag)
        }
        this.progressMeter.addChild(this.zombieHead)
        this.currentWave = 0
        this.waveCounter = 1 * this.constructor.waveInterval
        this.zombieSpawnCounter = 0
        this.zombieSpawnList = []
    }
    step() {
        let props = this.prop.WaveManagerProps
        this.waveCounter--
        if(this.waveCounter <= 0 && this.currentWave < props.WaveCount) {
            for(let wave of props.Waves[this.currentWave]) {
                wave.action()
            }
            this.currentWave++
            this.waveCounter = this.constructor.waveInterval *  30
        }
        this.zombieSpawnCounter--
        if(this.zombieSpawnCounter <= 0 && this.zombieSpawnList.length > 0) {
            this.zombieSpawnCounter = 40
            let zombie = this.zombieSpawnList.shift()
            if(zombie.Row) {
                scene.zombieGrid(zombie.Type, 10, parseInt(zombie.Row) - 1)
            } else {
                scene.zombieGrid(zombie.Type, 10, rnd(0, 4))
            }
        }
        for(let i = 0;i < this.flagCount;i++) {
            let mf = this.meterFlags[i]
            if(this.currentWave < (i + 1) * props.FlagWaveInterval) {
                mf.flag.y = mf.pole.y = 0
            } else {
                mf.flag.y = mf.pole.y = -this.constructor.meterPos.height
            }
        }
        let meterX = this.currentWave * this.constructor.meterPos.width / props.WaveCount
        this.zombieHead.x = this.constructor.meterPos.width - meterX
        this.meterFill.scale.x = meterX / 20
    }
    packets = []
    static pos = {
        x: 1800, y: 400, height: 600, width: 280
    }
    showDemo() {
        for(let i = 0;i < 1;i++) {
            for(let type of this.packets) {
                // let type = getByRTID(p)
                let demo = new PVZ2.ZombieBaseClass(type, 'idle')
                let pos = PVZ2.WaveManagerModuleProperties.pos
                demo.position.set(pos.x + rnd(0, pos.width), pos.y + rnd(0, pos.height))
                demo.y3 = demo.y
                scene.addChild(demo)
                demo.zIndex = demo.y
                objects.push(demo)
            }
        }
    }
    getZombies() {
        let zombies = new Set()
        if(this.DynamicZombies) {
            for(let dyn of this.DynamicZombies) {
                if(!dyn.ZombiePool) continue
                for(let zombie of dyn.ZombiePool) {
                    zombies.add(zombie)
                }
            }
        }
        if(this.WaveManagerProps) {
            this.WaveManagerProps.getZombies(zombies)
        }
        return [...zombies]
    }
}
PVZ2.WaveManagerProperties = class extends PVZ2.BaseProperties {
    prepare(parent) {
        if(this.Waves) {
            for(let wave of this.Waves) {
                for(let [index, w] of wave.entries()) {
                    wave[index] = getByRTID(w, parent)
                }
            }
        }
    }
    getResourceGroup() {
        let resourcesGroupNeeded = []
        for(let wave of this.Waves) {
            for(let w of wave) {
                resourcesGroupNeeded.push(...w.getResourceGroup())
            }
        }
        return resourcesGroupNeeded
    }
    getZombies(zombies) {
        for(let wave of this.Waves) {
            for(let w of wave) {
                if(w.getZombies) {
                    w.getZombies(zombies)
                }
            }
        }
    }
}
PVZ2.SpawnZombiesJitteredWaveActionProps = class extends PVZ2.BaseProperties {
    prepare() {
        for(let zombie of this.Zombies) {
            zombie.Type = getByRTID(zombie.Type)
        }
    }
    // getResourceGroup() {
    //     let resourcesGroupNeeded = []
    //     for(let zombie of this.Zombies) {
    //         resourcesGroupNeeded.push(...zombie.Type.getResourceGroup())
    //     }
    //     return resourcesGroupNeeded
    // }
    getZombies(zombies) {
        for(let zombie of this.Zombies) {
            zombies.add(zombie.Type)
        }
    }
    action() {
        PVZ2.waveManager.zombieSpawnList.push(...this.Zombies)
    }
}
PVZ2.LawnMowerProperties = class extends PVZ2.BaseProperties {
    init() {
        for(let i = 0;i < 5;i++) {
            new PVZ2.Mower(field.x - 90, field.y + (0.5 + i) * field.h, pams[this.prop.MowerPopAnim])
        }
    }
    getResourceGroup() {
        return this.ResourceGroupNames
    }
}
PVZ2.StageModuleProperties = class extends PVZ2.BaseProperties {
    init() {
        initGrid(5, 9)
        scene = new PVZ2.Scene(this.prop.BackgroundImagePrefix)
        back(0, 0)
        scene.goBack()
    }
    getResourceGroup() {
        return this.ResourceGroupNames
    }
}
PVZ2.BeachStageProperties = class extends PVZ2.StageModuleProperties {
    init() {
        super.init()
        this.rocks = drawPImage(310, 10, texturesMap[this.prop.BackgroundImagePrefix + '_ROCKS'])
        this.broadwalk = drawPImage(-80, 810, texturesMap[this.prop.BackgroundImagePrefix + '_BOARDWALK'])
        scene.addChild(this.rocks, this.broadwalk)
        this.rocks.zIndex = this.broadwalk.zIndex = -5
        
        PVZ2.hasWater = true
    }
}
PVZ2.LostCityStageProperties = class extends PVZ2.StageModuleProperties {

}
PVZ2.IceAgeStageProperties = class extends PVZ2.StageModuleProperties {

}
PVZ2.DinoStageProperties = class extends PVZ2.StageModuleProperties {

}
PVZ2.ModernStageProperties = class extends PVZ2.StageModuleProperties {

}
PVZ2.PirateStageProperties = class extends PVZ2.StageModuleProperties {

}
PVZ2.EgyptStageProperties = class extends PVZ2.StageModuleProperties {

}
PVZ2.WestStageProperties = class extends PVZ2.StageModuleProperties {

}
PVZ2.FutureStageProperties = class extends PVZ2.StageModuleProperties {

}
PVZ2.DarkStageProperties = class extends PVZ2.StageModuleProperties {

}
PVZ2.EightiesStageProperties = class extends PVZ2.StageModuleProperties {

}

PVZ2.TideProperties = class extends PVZ2.BaseProperties {
    init() {
        scene.waveLocation = this.prop.StartingWaveLocation
        let lineX = scene.getWaterX()
        let lineY = field.y
        this.under = new PVZ2.BackgroundEffect(pams.POPANIM_BACKGROUNDS_WATER_UNDERLAYER, 'idle', lineX + 230, lineY + 380, 0)
        this.under.scale.set(this.under.scale.x * 0.75)
        this.tideLine = new PVZ2.BackgroundEffect(pams.POPANIM_BACKGROUNDS_WATER_TIDE_LINE, 'idle', lineX + 50, lineY + 330, 0)
        this.tideLine.scale.set(this.tideLine.scale.x * 0.83)
        this.upper = new PVZ2.BackgroundEffect(pams.POPANIM_BACKGROUNDS_WAVE_UPPERLAYER, 'idle', lineX + 400, lineY + 380, 0)
        this.upper.scale.set(this.upper.scale.x * 0.75)
        this.tideLine.zIndex = -40
        this.under.zIndex = -50
        // this.upper.visible = false
        this.upper.zIndex = -30
        this.waterSign = drawPImageCentered(lineX, field.y - 100, texturesMap.IMAGE_BACKGROUNDS_BEACH_WATERSIGN, scene)
        this.waterSign.scale.set(this.waterSign.scale.x * 0.5)
        this.waterSign.zIndex = -1
        for(let i = this.prop.StartingWaveLocation - 1; i < 9;i++) {
            for(let j = 0;j < 5;j++) {
                if((i + j) % 2 == 1) continue
                let square = new PVZ2.BackgroundEffect(pams.POPANIM_BACKGROUNDS_WATER_SQUARE, 'idle', field.x + field.w * (i + 0.5) , field.y + field.h * (j + 0.5), 0)
                square.scale.set(square.scale.x * 0.7)
                square.zIndex = -40
            }
        }
    }
}

PVZ2.TidalChangeWaveActionProps = class extends PVZ2.BaseProperties {
    init() {
        let newLocation
        if(this.prop.TidalChange.ChangeType == 'absolute') {
            newLocation = this.prop.TidalChange.ChangeAmount
        } else {
            newLocation = scene.waveLocation + this.prop.TidalChange.ChangeAmount
        }

        scene.waveLocation = newLocation
    }
}

PVZ2.RailcartProperties = class extends PVZ2.BaseProperties {
    init() {
        for(let rail of this.prop.Rails) {
            this.addRail(rail.Column, rail.RowStart, rail.RowEnd)
        }
        this.carts = []
        for(let cart of this.prop.Railcarts) {
            this.carts.push(this.addCart(cart.Column, cart.Row))
        }
    }
    click(x, y) {

    }
    addRail(column, rowStart, rowEnd) {
        let posStart = scene.getLocation(column, rowStart)
        drawPImage(posStart.x, posStart.y, texturesMap.IMAGE_RAILCART_COWBOY_TOP, scene, true)
        let posEnd = scene.getLocation(column, rowEnd)
        drawPImage(posEnd.x, posEnd.y, texturesMap.IMAGE_RAILCART_COWBOY_BOTTOM, scene, true)
        for(let i = rowStart + 1;i < rowEnd;i++) {
            let pos = scene.getLocation(column, i)
            drawPImage(pos.x, pos.y, texturesMap.IMAGE_RAILCART_COWBOY_MID, scene, true)
        }
    }
    addCart(column, row) {
        let pos = scene.getLocation(column, row)
        return drawPImage(pos.x, pos.y, texturesMap.IMAGE_RAILCART_COWBOY_MINING_CART, scene, true)
    }
    getResourceGroup() {
        return ['Railcart_Cowboy_Group']
    }
}


PVZ2.GridItemType = class extends PVZ2.BaseProperties {
    getResourceGroup() {
        return this.ResourceGroups
    }
    prepare() {
        gridType[this.TypeName] = this
        this.prop = this.Properties = getByRTID(this.Properties)
    }
}

PVZ2.GravestoneProperties = class extends PVZ2.BaseProperties {
    getResourceGroup() {
        return ['Egypt_Gravestone']
    }
    init() {
        if(this.prop.ForceSpawnData) {
            let type = gridType.gravestone_egypt
            for(let grave of this.prop.ForceSpawnData) {
                scene.itemGrid(type, grave.GridX, grave.GridY)
            }
        }
    }
}

PVZ2.InitialPlantProperties = class extends PVZ2.BaseProperties {
    init() {
        if(this.prop.InitialPlantPlacements) {
            for(let placement of this.prop.InitialPlantPlacements) {
                scene.plantGrid(plantType[placement.TypeName], placement.GridX - 1, placement.GridY)
            }
        }
    }
    getResourceGroup() {
        if(!this.InitialPlantPlacements) {
            return []
        }
        let types = new Set()
        for(let placement of this.InitialPlantPlacements) {
            types.add(placement.TypeName)
        }
        
        let resourcesGroupNeeded = []
        for(let type of types) {
            resourcesGroupNeeded.push(...plantType[type].getResourceGroup())
        }
        return resourcesGroupNeeded
    }
}

PVZ2.PiratePlankProperties = class extends PVZ2.BaseProperties {
    init() {
        if(this.prop.PlankRows) {
            for(let row of this.prop.PlankRows) {
                let texture = (row % 2 == 1) ? texturesMap.IMAGE_BACKGROUNDS_PIRATE_PLANK : texturesMap.IMAGE_BACKGROUNDS_PIRATE_PLANK_02
                let pos = scene.getLocation(6, row)
                let plank = drawPImage(pos.x + 50, pos.y + 40, texture, scene, true)
                
            }
        }
    }
    getResourceGroup() {
        return []
    }
}