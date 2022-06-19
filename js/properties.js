PVZ2.BaseProperties = class {
    constructor(prop) {
        this.prop = prop
    }
    init() { }
    step() { }
    click(x, y) {
        return false    // not handled
    }
    static getResourceGroup(prop) {
        if(prop.ResourceGroupNames) {
            return prop.ResourceGroupNames
        }
        if(prop.ResourceGroups) {
            return prop.ResourceGroups
        }
        return []
    }
    
    static prepareProp() {}
}
PVZ2.ZombieType = class extends PVZ2.BaseProperties {
    static prepareProp() {}
}
PVZ2.PlantType = class extends PVZ2.BaseProperties {
    static prepareProp() {}
}
PVZ2.SeedBankProperties = class extends PVZ2.BaseProperties {
    init() {
        this.pos = this.constructor.pos
        for(let i = 0;i < 8;i++){
            this.seeds.push(seed(-1, 0, this.pos.height * i + this.pos.y))
        }
        // seed chooser & bank
        this.seedChooser = new SeedChooser(5, 5)
        stage.addChild(this.seedChooser)
        this.selspr = seedSel(0, 100)
        this.selspr.visible = false 
        PVZ2.seedBank = this
        
        this.seedChooser.position.set(this.pos.width + 20, 440)
        for(let name of this.constructor.initSeeds) {
            this.seedChooser.addSeedByName(name)
        }
        this.seedChooser.click2(0, 0)
        PVZ2.numSun = numSun(0, 0, 50)
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
    click(x, y) {
        let pos = this.constructor.pos
        if(!PVZ2.gameStart) {
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
    static getResourceGroup(prop) {    
        let resourcesGroupNeeded = []
        for(let typeName of this.initSeeds) {
            let type = rtons.PlantTypes[typeName]
            resourcesGroupNeeded.push(...type.PlantResourceGroups)
            if(!type.prop) {
                type.prop = getByRTID(type.Properties)
            }
        }
        return resourcesGroupNeeded
    }
}
PVZ2.ConveyorSeedBankProperties = class extends PVZ2.BaseProperties {
    static initSeeds = ['sunflower', 'peashooter', 'wallnut', 'snowpea', 'homingthistle']
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
                this.seeds.push(newSeed(plantType[rndObj(this.constructor.initSeeds)], 10, 1300, true, true))
                this.seedCounter = 150
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
    static getResourceGroup(prop) {    
        let resourcesGroupNeeded = []
        for(let typeName of this.initSeeds) {
            let type = rtons.PlantTypes[typeName]
            resourcesGroupNeeded.push(...type.PlantResourceGroups)
            if(!type.prop) {
                type.prop = getByRTID(type.Properties)
            }
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
PVZ2.WaveManagerModuleProperties = class extends PVZ2.BaseProperties {
    static getResourceGroup(prop) {
        let zombies = this.getZombies(prop)
        let resourcesGroupNeeded = []
        for(let zombie of zombies) {
            let type = getByRTID(zombie)
            resourcesGroupNeeded.push(...type.ResourceGroups)
            if(!type.prop) {
                type.prop = getByRTID(type.Properties)
            }
        }
        return resourcesGroupNeeded
    }
    init() {
        PVZ2.waveManager = this
        this.packets = PVZ2.WaveManagerModuleProperties.getZombies(this.prop)
    }
    packets = []
    static pos = {
        x: 1800, y: 400, height: 600, width: 280
    }
    showDemo() {
        for(let i = 0;i < 2;i++) {
            for(let p of this.packets) {
                let type = getByRTID(p)
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
    static getZombies(prop) {
        let zombies = new Set()
        if(!prop.DynamicZombies) return []
        for(let dyn of prop.DynamicZombies) {
            if(!dyn.ZombiePool) continue
            for(let zombie of dyn.ZombiePool) {
                zombies.add(zombie)
            }
        }
        return [...zombies]
    }
}
PVZ2.LawnMowerProperties = class extends PVZ2.BaseProperties {
    init() {
        for(let i = 0;i < 5;i++) {
            new PVZ2.Mower(field.x - 90, field.y + (0.5 + i) * field.h, pams[this.prop.MowerPopAnim])
        }
    }
}
PVZ2.StageModuleProperties = class extends PVZ2.BaseProperties {
    init() {
        initGrid(5, 9)
        scene = new PVZ2.Scene(this.prop.BackgroundImagePrefix)
        back(0, 0)
        scene.goBack()
    }
}
PVZ2.BeachStageProperties = class extends PVZ2.StageModuleProperties {

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