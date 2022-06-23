
const seedChooserSeedSize = {width: 180, height: 120, top: 0}
const seedChooserDemoPos = {x: 20, y: -280, width: 250, height: 250}

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
    constructor(type, noPrice = false, noCooldown = false) {
        super()
        this.noCooldown = noCooldown
        this.bg = drawPImage()
        if(!noPrice) {
            this.priceTab = drawPImage(115, 55, texturesMap.IMAGE_UI_PACKETS_PRICE_TAB)
            this.price = new PIXI.Text('', { fontFamily: 'Arial', fontSize: 56, fill: 'white', align: 'center', fontWeight: '600', strokeThickness: 3 });
        }

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

        this.addChild(this.bg, this.plant)
        if(!noPrice) {
            this.addChild(this.priceTab, this.price)
            this.addChild(cover1, cover2)
        }
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
        if(this.price) {
            this.price.text = type.prop.Cost
            this.price.position.set(180 - this.price.width, 60)
            this.price.visible = true
            this.priceTab.visible = true
        }
        this.plant.texture = texturesMap['IMAGE_UI_PACKETS_' + type.TypeName.toUpperCase()]
        this.plant.position.set(15, 68 - this.plant.texture.height)
        this.plant.visible = true
        this.type = type
        if(!this.noCooldown) {
            if(type.prop.StartingCooldown) {
                this.cd = type.prop.StartingCooldown * fps
            } else {
                this.cd = type.prop.PacketCooldown * fps
            }
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
        let belt = new PIXI.TilingSprite(texturesMap.IMAGE_UI_CONVEYOR_CONVEYOR_BELT, 180, 1200)
        this.belt = belt
        belt.position.set(10, 10)
        belt.tileScale.set(resScaleV)
        let top = drawPImage(0, 0, texturesMap.IMAGE_UI_CONVEYOR_CONVEYOR_TOP)
        let sideLeft = drawPImage(0, 10, texturesMap.IMAGE_UI_CONVEYOR_CONVEYOR_SIDE)
        let sideRight = drawPImage(190, 10, texturesMap.IMAGE_UI_CONVEYOR_CONVEYOR_SIDE)
        this.addChild(belt, sideLeft, sideRight, top)
    }
    step() {
        this.belt.tilePosition.y -= 4
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


PVZ2.Scene = class extends PIXI.Container {
    static backPosition = {x: 600, y: 0}
    static moveSpeed = 20
    constructor(prefix = 'IMAGE_BACKGROUNDS_BACKGROUND_LOD_BIRTHDAY') {
        super()
        this.bg1 = drawPImage(0, 0, texturesMap[prefix + '_TEXTURE'])
        this.bg2 = drawPImage(this.bg1.width, 0, texturesMap[prefix + '_TEXTURE_RIGHT'])
        this.addChild(this.bg1, this.bg2)
        this.bg1.zIndex = this.bg2.zIndex = -100
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
    plantGrid(type, x, y) {
        return plant(type, field.x + (0.5 + x) * field.w, field.y + (0.5 + y) * field.h)
    }
    zombieGrid(type, x = 9, y = rnd(0, 4)) {
        return zombie(type, field.x + (0.5 + x) * field.w, field.y + (0.5 + y) * field.h)
    }
}