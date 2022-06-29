
const seedChooserSeedSize = {width: 180, height: 120, top: 0}
const seedChooserDemoPos = {x: 20, y: -280, width: 250, height: 250}

var PVZ2 = {}

var chillFilter = new PIXI.filters.ColorMatrixFilter()
chillFilter.tint(0x8888FF)
var hitFilter = new PIXI.filters.ColorMatrixFilter()
hitFilter.matrix = [
    1, 0, 0, 0, 0.2,
    0, 1, 0, 0, 0.2,
    0, 0, 1, 0, 0.2,
    0, 0, 0, 1, 0
]
const hitFilterDarkTime = 20
const hitFilterLightTime = 30
PVZ2.GameScenes = {
    Loading: 0,
    Menu: 1,
    LevelIntro: 2,
    Playing: 3,
    ZombiesWon: 4,
    Award: 5,
    Credit: 6,
    Challenge: 7,
    Leaderboard: 8
}

function drawCollisionBox(obj, rect) {
    let rec = new PIXI.Graphics()
    rec.lineStyle(3, 0x000000, 1)
    rec.drawRect(0, 0, rect.mWidth, rect.mHeight)
    rec.position.set(rect.mX + obj.pivot.x, -rect.mY + obj.pivot.y - rect.mHeight)
    obj.addChild(rec)
}

function withinDistance(obj1, obj2, dist) {
    return Math.sqrt((obj1.x - obj2.x)**2 + (obj1.y - obj2.y)**2) < dist
}


PVZ2.SeedChooser = class extends PIXI.Container {
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
        upButton.scale.set(upButton.scale.x * 1.3)
        downButton.scale.set(downButton.scale.x * 1.3)
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
        this.plant.position.set(15, 105 - this.plant.texture.height * resScaleV)
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
    zombieGrid(type, x = 9, y) {
        return zombie(type, field.x + (0.5 + x) * field.w, field.y + (0.5 + y) * field.h)
    }
    tileGrid(pam, act, x, y) {
        let tile = new PVZ2.Effect(pam, act, field.x + (0.5 + x) * field.w, field.y + (0.5 + y) * field.h, 0, scene, false)
        return tile
    }
    itemGrid(type, x, y) {
        return gridItem(type, field.x + (0.5 + x) * field.w, field.y + (0.5 + y) * field.h)
    }
    getWaterX() {
        if(this.waveLocation >= 0) {
            return field.x + (this.waveLocation - 2) * field.w
        } else {
            return 5000
        }
    }
    getLocation(column, row) {
        return {
            x: field.x + (0.5 + column) * field.w,
            y: field.y + (0.5 + row) * field.h
        }
    }
}



PVZ2.Object = class extends PIXI.Container {
    constructor() {
        super()
        this.age = 0
        this.y3 = this.z3 = 0
    }
    setPam(pam, sprite, frameStart = 0, param = {}) {
        param.onFinish = () => this.onFinish()
        this.pamSprite = new PamSprite(pam, sprite, frameStart, param)
        if(!param.topleft) {
            this.pamSprite.pivot.set(pam.size[0] / 2, pam.size[1] / 2)
        }
        this.addChild(this.pamSprite)
        this.pam = pam
        this.param = param
    }
    setImage(id) {
        let texture = texturesMap[id]
        this.image = new PIXI.Sprite(texture)
        this.image.pivot.set(texture.width / 2, texture.height / 2)
        this.image.scale.set(resScaleV)
        this.addChild(this.image)
    }
    changeAction(act) {
        this.actName = act
        this.pamSprite.changeAction(act)
    }
    getSprite(name) {
        return this.pamSprite.getSprite(name)
    }
    showSprite(name, visible) {
        this.pamSprite.showSprite(name, visible)
    }
    showSprites(names, visible = true) {
        this.pamSprite.showSprites(names, visible)
    }
    step() {
        if(this.pamSprite) {
            this.pamSprite.step()
            if(this.command) {
                let frame = this.pamSprite.getFrame()
                for(let command of frame.command) {
                    this.command(command.command, command.parameter)
                }
            }
        }
        this.age++
        this.y = this.y3 + this.z3
        let waterX = scene.getWaterX()
        if(this.shadow) {
            this.shadow.visible = this.x <= waterX
            this.shadow.x = this.x
            this.shadow.y = this.shadow.y3 = this.y3
        }
        if(this.ripple) {
            this.ripple.visible = this.x > waterX
            this.ripple.x = this.x
            this.ripple.y3 = this.y3
            this.ripple.y = this.ripple.y3 + this.ripple.z3
        }
        if(this.ztype != 'background') {
            this.zIndex = this.y3
        }
        if(this.ztype == 'zombie') {
            this.zIndex += 1
        } else if(this.ztype == 'sun') {
            this.zIndex = 5000
        } else if(this.ztype == 'projectile') {
            this.zIndex += 2
        } else if(this.ztype == 'effect') {
            this.zIndex += 3
        } else if(this.ztype == 'plant') {
            if(this.type.prop.MultiPlantLayer) {
                if(this.type.prop.MultiPlantLayer == 'armor') {
                    this.zIndex += 0.2
                } else if(this.type.prop.MultiPlantLayer == 'power') {
                    this.zIndex += 0.3
                }
            } else {
                this.zIndex += 0.1
            }
        }
        if(this.hitFilterCounter > 0) {
            this.hitFilterCounter--
            if(this.hitFilterCounter == hitFilterDarkTime) {
                removeFilter(this, hitFilter)
            }
        }
    }
    onFinish() {
        if(this.param && this.param.removeOnFinish) {
            rm(this)
        }
    }
}

const squashingTime = 6
const squashingWaitTime = 12

PVZ2.Plant = class extends PVZ2.Object {
    constructor(type) {
        let pam = pams[type.PopAnim]
        let initAct = 'idle'
        if(type.TypeName == 'potatomine') {
            initAct = 'plant'
        }
        super()
        this.setPam(pam, undefined, initAct)
        this.actName = initAct
        this.type = type
        let layer = type.prop.MultiPlantLayer
        if(type.prop.Actions) {
            let action = this.action = type.prop.Actions[0]
            this.actionCooldownMax = action.CooldownTimeMin * fps
            this.actionCooldown = action.InitialMinCooldownTime * fps | action.CooldownTimeMin * fps
            if(type.TypeName == 'sunflower' || type.TypeName == 'twinsunflower') {
                this.actionCooldownMax /= 2
                this.actionCooldown /= 2
            }
        }
        // this.attacking = true   // for test
        this.hitpoints = type.prop.Hitpoints
        // this.pivot.set(pam.size[0] / 2, pam.size[1] / 2)
        if(PVZ2.collisionBox) {
            // drawCollisionBox(this, type.prop.HitRect)
        }
        this.showSprites(plantHideSprites, false)
        if(layer != 'ground' && layer != 'power') {
            // plant shadow
            this.shadow = drawPImageCentered(-85, 10, texturesMap.IMAGE_PLANTSHADOW)
            // shadow.zIndex = -1
            shadowLayer.addChild(this.shadow)
        }
    }
    init() {
        super.init()
    }
    step() {
        if(this.demo) {
            super.step()
            return
        }
        if(this.launchCounter != undefined) {
            this.launchCounter++
            if(this.launchCounter == 5) {
                if(this.type.TypeName == 'repeater') {
                    let projectileType = getByRTID(this.action.Projectile)
                    let target = this.findTarget()
                    launchProjectile(projectileType, this.x + this.action.SpawnOffset.x, this.y3, this.z3 + this.action.SpawnOffset.y, target)
                }
            }
        }
        if(this.launchCounter2 != undefined) {
            this.launchCounter2++
            if(this.launchCounter2 == 5) {
                if(this.type.TypeName == 'splitpea') {
                    if(this.attacking2) {
                        let projectileType = getByRTID(this.type.prop.Actions[1].Projectile)
                        let action = this.type.prop.Actions[1]
                        let a = launchProjectile(projectileType, this.x + action.SpawnOffset.x, this.y3, this.z3 + action.SpawnOffset.y)
                        a.velocity.x = -a.velocity.x
                    }
                }
            }
        }
        if(this.type.prop.IsInstant) {
            if(this.action.Type == 'explode' && this.actName != 'attack') {
                if(!this.action.CooldownTimeMin || this.age > this.action.CooldownTimeMin * 30) {
                    this.changeAction('attack')
                }
            }
        }
        if(this.type.TypeName == 'sunflower' || this.type.TypeName == 'twinsunflower') {
            if(this.actionCooldown <= 0) {
                this.changeAction('special')
                this.actionCooldown = this.actionCooldownMax
            }
        } else if(this.type.TypeName == 'splitpea') {
            if(this.attacking || this.attacking2) {
                if(this.actionCooldown <= 0) {
                    if(this.attacking) {
                        if(this.attacking2) {
                            this.changeAction('attack2')
                        } else {
                            this.changeAction('attack')
                        }
                    } else {
                        this.changeAction('attack3')
                    }
                    this.actionCooldown = this.actionCooldownMax
                }
            }
        } else {
            if(this.attacking) {
                if(this.actionCooldown <= 0) {
                    if(this.type.TypeName == 'kernelpult') {
                        if(Math.random() < 0.4) {
                            this.changeAction('attack')
                        } else {
                            this.changeAction('attack2')
                        }
                    } else if(this.type.TypeName == 'puffshroom') {
                        this.changeAction('special_stage1')
                    } else if(this.type.TypeName == 'fumeshroom') {
                        this.changeAction('special')
                    } else {
                        if(this.pam.actionFrame['attack']) {
                            this.changeAction('attack')
                        }
                    }
                    this.actionCooldown = this.actionCooldownMax
                }
            }
        }
        this.attacking = false
        this.attacking2 = false // splitpea
        for(let obj2 of objects) {
            if(obj2.ztype == 'zombie' && !obj2.dead) {
                if(this.type.TypeName == 'threepeater') {
                    if(obj2.x > this.x && Math.abs(obj2.y3 - this.y3) < 300) {
                        this.attacking = true
                        break
                    }
                } else if(this.type.TypeName == 'snapdragon') {
                    if(obj2.x > this.x && obj2.x < this.x + 350 && Math.abs(obj2.y3 - this.y3) < 300) {
                        this.attacking = true
                        break
                    }
                } else if(this.type.TypeName == 'potatomine') {
                    if(this.wake && this.actName != 'attack') {
                        if(Math.abs(obj2.x - this.x) < 100 && Math.abs(obj2.y3 - this.y3) < 20) {
                            this.changeAction('attack')
                            break
                        }
                    }
                } else if(this.type.TypeName == 'chomper') {
                    if(!this.chewing && this.actName == 'idle') {
                        if(obj2.x > this.x && obj2.x < this.x + 300 && Math.abs(obj2.y3 - this.y3) < 20) {
                            this.changeAction('bite')
                            break
                        }
                    }
                } else if(this.type.TypeName == 'splitpea') {
                    if(Math.abs(obj2.y3 - this.y3) < 20) {
                        if(obj2.x > this.x) {
                            this.attacking = true
                        } else {
                            this.attacking2 = true
                        }
                    }
                } else if(this.type.TypeName == 'starfruit') {
                    if(Math.abs(obj2.y3 - this.y3) < 20 && obj2.x < this.x ||
                        Math.abs(obj2.x - this.x) < 40 ||
                        obj2.x > this.x && Math.abs((obj2.x - this.x) / 1.732 - Math.abs(this.y3 - obj2.y3)) < 60) {
                        this.attacking = true
                        break
                    }
                } else if(this.type.TypeName == 'homingthistle') {
                    this.attacking = true
                    break
                } else if(this.type.TypeName == 'squash') {
                    if(this.actName == 'idle') {
                        if(Math.abs(obj2.x - this.x) < 200 && Math.abs(obj2.y3 - this.y3) < 20) {
                            if(obj2.x < this.x) {
                                this.changeAction('turn')
                            } else {
                                this.changeAction('jump_up_right')
                                this.squashing = squashingTime + squashingWaitTime
                            }
                            this.target = obj2
                            break
                        }
                    }
                } else {
                    if(obj2.x > this.x && Math.abs(obj2.y3 - this.y3) < 20) {
                        this.attacking = true
                        break
                    }
                }
            }
        }
        if(this.type.TypeName == 'potatomine') {
            if(!this.wake) {
                if(this.age > 150) {
                    this.wake = true
                    this.changeAction('recover')
                }
            }
        } else if(this.type.TypeName == 'chomper') {
            if(this.chewing > 0) {
                this.chewing--
                if(this.chewing == 0) {
                    this.changeAction('special_end')
                }
            }
        } else if(this.type.TypeName == 'squash') {
            if(this.squashing > 0) {
                this.squashing--
                if(this.squashing < squashingTime) {
                    if(this.squashing == 0) {
    
                    } else {
                        this.x += (this.target.x - this.x) / this.squashing
                        this.z3 -= 40
                    }
                }
            } else if(this.squashing2 > 0) {
                this.squashing2--
                if(this.squashing2 == 0) {
                    for(let obj2 of objects) {
                        if(obj2.ztype == 'zombie' && !obj2.dead && Math.abs(obj2.x - this.x) < 100 && Math.abs(obj2.y3 - this.y3) < 20) {
                            obj2.dead = true
                            rm(obj2)
                        }
                    }
                } else {
                    this.z3 += 40
                }
            }
        }
        super.step()
        this.actionCooldown--
    }
    hit(damage) {
        this.hitpoints -= damage
        if(this.hitpoints <= 0) {
            rm(this)
        } else {
            if(!this.hitFilterCounter) {
                this.hitFilterCounter = hitFilterLightTime
                addFilter(this, hitFilter)
            }
            if(this.type.TypeName == 'wallnut') {
                let ratio = this.hitpoints / this.type.prop.Hitpoints
                if(ratio < 0.25) {
                    if(this.actName != 'damage3') {
                        this.changeAction('damage3')
                    }
                } else if(ratio < 0.5) {
                    if(this.actName != 'damage2') {
                        this.changeAction('damage2')
                    }
                } else if(ratio < 0.75) {
                    if(this.actName != 'damage') {
                        this.changeAction('damage')
                    }
                }
            } else if(this.type.TypeName == 'tallnut') {
                let ratio = this.hitpoints / this.type.prop.Hitpoints
                if(ratio < 0.33) {
                    if(this.actName != 'damage2') {
                        this.changeAction('damage2')
                    }
                } else if(ratio < 0.66) {
                    if(this.actName != 'damage') {
                        this.changeAction('damage')
                    }
                }
            } else if(this.type.TypeName == 'pumpkin') {
                let ratio = this.hitpoints / this.type.prop.Hitpoints
                if(ratio < 0.33) {
                    if(this.actName != 'idle3') {
                        this.changeAction('idle3')
                    }
                } else if(ratio < 0.66) {
                    if(this.actName != 'idle2') {
                        this.changeAction('idle2')
                    }
                }
            }
        }
    }
    onFinish() {
        if(this.type.TypeName == 'potatomine') {
            if(this.actName == 'plant') {
                this.changeAction('plant_idle')
            } else if(this.actName == 'recover') {
                this.changeAction('idle')
            }

            if(this.actName == 'attack') {
                rm(this)
                let offsetX = 0, offsetY = 0
                new PVZ2.Effect(pams.POPANIM_EFFECTS_POTATOMINE_EXPLOSION, undefined,  this.x + offsetX, this.y3, this.z3 + offsetY)
                for(let obj2 of objects) {
                    if(obj2.ztype == 'zombie' && !obj2.dead && withinDistance(this, obj2, 100)) {
                        obj2.dead = true
                        rm(obj2)
                    }
                }
            }
        } else if(this.type.TypeName == 'chomper') {
            if(this.actName == 'special') {
                this.changeAction('special_idle')
                this.chewing = this.type.prop.ChewTimeSeconds * fps
            } else if(this.actName == 'bite_end') {
                this.changeAction('idle')
            } else if(this.actName == 'bite') {
                let ate = false
                for(let obj2 of objects) {
                    if(obj2.ztype == 'zombie' && !obj2.dead && obj2.x > this.x && obj2.x < this.x + 300 && Math.abs(obj2.y3 - this.y3) < 20) {
                        obj2.dead = true
                        rm(obj2)
                        ate = true
                        break
                    }
                }
                if(ate) {
                    this.changeAction('special')
                } else {
                    this.changeAction('bite_end')
                }
            } else if(this.actName == 'special_end') {
                this.changeAction('idle')
            }

        } else if(this.type.TypeName == 'squash') {
            if(this.actName == 'turn') {
                this.changeAction('jump_up_left')
                this.squashing = squashingTime + squashingWaitTime
            } else if(this.actName == 'jump_up_left') {
                this.changeAction('jump_down_left')
                this.squashing2 = squashingTime
            } else if(this.actName == 'jump_up_right') {
                this.changeAction('jump_down_right')
                this.squashing2 = squashingTime
            } else if(this.actName == 'jump_down_left' || this.actName == 'jump_down_right') {
                rm(this)
            }

        } else {
            if(this.actName) {
                if(this.actName != 'idle' && this.action) {
                    if(this.action.Type == 'explode' && this.actName == 'attack') {
                        rm(this)
                        if(this.type.TypeName == 'cherry_bomb') {
                            let offsetX = 0, offsetY = -140
                            new PVZ2.Effect(pams.POPANIM_EFFECTS_CHERRYBOMB_EXPLOSION_REAR, undefined,  this.x + offsetX, this.y + offsetY, 0, shadowLayer)
                            new PVZ2.Effect(pams.POPANIM_EFFECTS_CHERRYBOMB_EXPLOSION_TOP, undefined,  this.x + offsetX, this.y3, this.z3 + offsetY)
                            for(let obj2 of objects) {
                                if(obj2.ztype == 'zombie' && !obj2.dead && withinDistance(this, obj2, 200)) {
                                    obj2.dead = true
                                    rm(obj2)
                                    new PVZ2.Effect(pams.POPANIM_EFFECTS_ZOMBIE_ASH, undefined,  obj2.x, obj2.y3, obj2.z3)
                                }
                            }
                        } else if(this.type.TypeName == 'jalapeno') {
                            let offsetX = 0, offsetY = 0
                            for(let i = 0;i < 9;i++) {
                                new PVZ2.Effect(pams.POPANIM_EFFECTS_JALAPENO_FIRE, undefined,  PVZ2.field.x + offsetX + PVZ2.field.w * (i + 0.5), this.y + offsetY, 0)
                            }
                            for(let obj2 of objects) {
                                if(obj2.ztype == 'zombie' && !obj2.dead && Math.abs(obj2.y3 - this.y3) < 20) {
                                    obj2.dead = true
                                    rm(obj2)
                                    new PVZ2.Effect(pams.POPANIM_EFFECTS_ZOMBIE_ASH, undefined,  obj2.x, obj2.y3, obj2.z3)
                                }
                            }
                        }
                        return
                    }
                    if(this.type.TypeName == 'puffshroom') {
                        this.changeAction('idle_stage1')
                    } else {
                        this.changeAction('idle')
                    }
                } else {
                    // attack after finish last action
                    // this.changeAction('attack')
                }
            }
        }
    }
    command(command, parameter) {
        let action
        if(command == 'use_action') {
            action = this.action
        } else if(command == 'use_action2') {
            action = this.type.prop.Actions[1]
        } else {
            return
        }
        if(this.action.Type == 'projectile') {
            if(action.Projectile) {
                let projectileType = getByRTID(action.Projectile)
                if(this.type.TypeName == 'kernelpult' && this.actName == 'attack2') {
                    projectileType = getByRTID(this.type.prop.Actions[1].Projectile)
                }
                if(projectileType.ClassName == 'ThreepeaterProjectile') {
                    let a = launchProjectile(projectileType, this.x + this.action.SpawnOffset.x, this.y3, this.z3 + this.action.SpawnOffset.y, target)
                    let b = launchProjectile(projectileType, this.x + this.action.SpawnOffset.x, this.y3, this.z3 + this.action.SpawnOffset.y, target)
                    a.vy = - (b.vy = 15)
                    a.vt = b.vt = 10
                    let c = launchProjectile(projectileType, this.x + this.action.SpawnOffset.x, this.y3, this.z3 + this.action.SpawnOffset.y, target)
                    c.vt = 0
                } else if(this.type.TypeName == 'splitpea' && command == 'use_action2') {
                    let a = launchProjectile(projectileType, this.x + action.SpawnOffset.x, this.y3, this.z3 + action.SpawnOffset.y)
                    a.velocity.x = -a.velocity.x
                    this.launchCounter2= 0
                } else if(this.type.TypeName == 'splitpea' && command == 'use_action2') {
                    let a = launchProjectile(projectileType, this.x + action.SpawnOffset.x, this.y3, this.z3 + action.SpawnOffset.y)
                    a.velocity.x = -a.velocity.x
                    this.launchCounter2= 0
                } else if(this.type.TypeName == 'starfruit') {
                    let speed = projectileType.InitialVelocity[0].Min / 30
                    let a = launchProjectile(projectileType, this.x, this.y3, this.z3)
                    a.velocity.x = 0
                    a.velocity.y = speed
                    let b = launchProjectile(projectileType, this.x, this.y3, this.z3)
                    b.velocity.x = 0
                    b.velocity.y = -speed
                    let c = launchProjectile(projectileType, this.x, this.y3, this.z3)
                    c.velocity.x = -speed
                    c.velocity.y = 0
                    let d = launchProjectile(projectileType, this.x, this.y3, this.z3)
                    d.velocity.x = speed * 0.85
                    d.velocity.y = speed / 2
                    let e = launchProjectile(projectileType, this.x, this.y3, this.z3)
                    e.velocity.x = speed * 0.85
                    e.velocity.y = -speed / 2
                } else {
                    let target = this.findTarget2()
                    launchProjectile(projectileType, this.x + this.action.SpawnOffset.x, this.y3, this.z3 + this.action.SpawnOffset.y, target)
                    this.launchCounter = 0
                }

            } else {
                if(this.type.TypeName == 'snapdragon') {
                    new PVZ2.Effect(pams.POPANIM_EFFECTS_SNAPDRAGON_FIRE, 'animation', this.x, this.y3 - 150, this.z3)
                    new PVZ2.Effect(pams.POPANIM_EFFECTS_SNAPDRAGON_FIRE, 'animation', this.x, this.y3, this.z3)
                    new PVZ2.Effect(pams.POPANIM_EFFECTS_SNAPDRAGON_FIRE, 'animation', this.x, this.y3 + 150, this.z3)
                    for(let obj2 of objects) {
                        if(obj2.ztype == 'zombie' && !obj2.dead) {
                            if(obj2.x > this.x && obj2.x < this.x + 300 && Math.abs(obj2.y3 - this.y3) < 300) {
                                obj2.hit(30)
                            }
                        }
                    }
                } else if(this.type.TypeName == 'fumeshroom') {
                    // let offset = this.action.SpawnOffset
                    new PVZ2.Effect(pams.POPANIM_EFFECTS_FUMESHROOM_BUBBLES, 'animation', this.x + 130, this.y3, this.z3)
                    for(let obj2 of objects) {
                        if(obj2.ztype == 'zombie' && !obj2.dead) {
                            if(obj2.x > this.x && obj2.x < this.x + 600 && Math.abs(obj2.y3 - this.y3) < 20) {
                                obj2.hit(this.action.Damage)
                            }
                        }
                    }
                }
            }
        } else if(this.action.Type == 'sun') {
            new PVZ2.Sun(this.x + this.action.SpawnOffset.x, this.y + this.action.SpawnOffset.y, 50)
            if(this.type.TypeName == 'twinsunflower') {
                let action = this.type.prop.Actions[1]
                new PVZ2.Sun(this.x + action.SpawnOffset.x, this.y + action.SpawnOffset.y, 50)
            }
        }
    }
    findTarget() {
        let obj
        let nearX = 100000
        for(let obj2 of objects) {
            if(obj2.ztype == 'zombie' && !obj2.dead) {
                if(obj2.x > this.x && Math.abs(obj2.y3 - this.y3) < 20) {
                    if(obj2.x < nearX) {
                        obj = obj2
                        nearX = obj2.x
                    }
                }
            }
        }
        return obj
    }
    findTarget2() {
        let obj
        let nearX = 100000
        for(let obj2 of objects) {
            if(obj2.ztype == 'zombie' && !obj2.dead) {
                if(obj2.x < nearX) {
                    obj = obj2
                    nearX = obj2.x
                }
            }
        }
        return obj
    }
}


function launchProjectile(type, x, y, z, target) {
    let a
    if(PVZ2[type.ClassName]) {
        a = new PVZ2[type.ClassName](type, target)
    } else {
        a = new PVZ2.Projectile(type, target)
    }
    if(target) {
        if(type.InitialAcceleration) {    // catapult
            let deltaX = target.x - x
            a.velocity.x = (deltaX / 3.5 / a.velocity.z)
        }
    }
    a.position.set(x, y + z)
    a.y3 = y
    a.z3 = z
    scene.addChild(a)
    newObjects.push(a)
    a.ztype = 'projectile'
    return a
}

var zombieHideSprites = [
        'ground_swatch', 'ground_swatch_plane',
        'zombie_armor_cone_norm',
        'zombie_armor_cone_damage_01',
        'zombie_armor_cone_damage_02',
        'zombie_armor_bucket_norm',
        'zombie_armor_bucket_damage_01',
        'zombie_armor_bucket_damage_02',
        'zombie_armor_brick_norm',
        'zombie_armor_brick_damage_01',
        'zombie_armor_brick_damage_02',
        'zombie_armor_iceblock_norm',
        'zombie_armor_iceblock_damage1',
        'zombie_armor_iceblock_damage2',
        'zombie_armor_crown_norm',
        'zombie_armor_crown_damage_01',
        'zombie_armor_crown_damage_02',
        'zombie_armor_skull_norm',
        'zombie_armor_skull_damage_01',
        'zombie_armor_skull_damage_02',
        'zombie_poncho_armor1_norm',
        'zombie_poncho_armor1_damage1',
        'zombie_poncho_armor1_damage2',
        'butter', 'ink',
        'zombie_seaweed1', 'knight_feather', 'flag_stick', 'flag_01', 'cowboy_hat',
    ]
var plantHideSprites = [
    '_wallnut_armor_states',
    '_tallnut_plantfood_armor',
    'Magnet_Item'
]

PVZ2.ZombieBaseClass = class extends PVZ2.Object {
    constructor(type, initAct) {
        let pam = pams[type.PopAnim]
        super()
        this.setPam(pam, undefined, initAct, {walk: true, walkGround: 'ground_swatch'})
        this.actName = initAct
        this.type = type
        let prop = type.prop
        this.hitpoints = prop.Hitpoints
        this.initAct = initAct
        
        // this.pivot.set(pam.size[0] / 2, pam.size[1] / 2)
        if(PVZ2.collisionBox) {
            drawCollisionBox(this, prop.HitRect)
        }
        this.showSprites(zombieHideSprites, false)
        if(type.armorProps) {
            this.armors = []
            for(let armor of type.armorProps) {
                this.armors.push({
                    type: armor,
                    health: armor.BaseHealth
                })
            }
            this.showArmor()
        }
        // zombie shadow
        this.shadow = drawPImageCentered(-80, 10, texturesMap.IMAGE_PLANTSHADOW)
        // shadow.zIndex = -1
        shadowLayer.addChild(this.shadow)
        if(PVZ2.hasWater) {
            this.ripple = new PVZ2.Effect(pams.POPANIM_BACKGROUNDS_WATER_ZOMBIE_RIPPLE, 'ripple', this.x, this.y3, this.z3 + 50, scene, false)

            let inWaterMask = this.inWaterMask = new PIXI.Graphics()
            inWaterMask.beginFill(0xFFFFFF)
            inWaterMask.drawRect(-500, -500, 1000, 560)
            inWaterMask.endFill()
            this.addChild(inWaterMask)
            this.mask = inWaterMask
        }
    }
    init() {
        super.init()
    }
    step() {
        if(this.butterCounter > 0) {
            this.butterCounter--
            if(this.butterCounter == 0) {
                this.showSprite('butter', false)
            }
        } else if(this.chillCounter > 0) {
            this.chillCounter--
            if(this.age % 2 == 0) {
                super.step()
            } else {
                this.age++
            }
            if(this.chillCounter == 0) {
                this.filters = null
            }
        } else {
            super.step()
        }
        if(this.dead) {
            return
        }
        let eating = false
        for(let obj2 of objects) {
            if(obj2.ztype == 'plant') {
                if(ifCollide(this, obj2, this.type.prop.AttackRect, PVZ2.plantRect)) {
                    obj2.hit(this.type.prop.EatDPS / 30)
                    eating = true
                    break
                }
            }
        }
        if(eating && this.actName != 'eat') {
            this.changeAction('eat')
        } else if(!eating && this.actName == 'eat') {
            this.changeAction(this.initAct)
        }

        if(this.actName != 'die' && this.actName != 'idle' && this.actName != 'eat') {
            let prop = this.type.prop
            let ground = prop.GroundTrackName && this.getSprite(prop.GroundTrackName)
            if(ground) {
                if(!this.groundX) {
                    this.groundMove = 0
                } else {
                    this.groundMove = ground.x - this.groundX
                }
                this.groundX = ground.x
                if(this.groundMove > 0) {
                    if(prop.RunningSpeedScale) {
                        this.groundMove *= prop.RunningSpeedScale
                    }
                    this.x -= this.groundMove
                }
            } else {
                this.x -= prop.Speed
            }
        }
        this.showArmor()
        let inWaterDepth = 50
        // ripple
        if(PVZ2.hasWater) {
            let dx = this.x - scene.getWaterX()
            if(dx <= 0) {
                this.pamSprite.y = 0
                // this.inWaterMask.y = 0
            } else if(dx > inWaterDepth) {
                this.pamSprite.y = inWaterDepth
                // this.inWaterMask.y = -inWaterDepth
            } else {
                this.pamSprite.y = dx
                // this.inWaterMask.y = -dx
            }
        }
    }
    chill(n) {
        this.chillCounter = n * fps
        this.filters = [chillFilter]
    }
    butter(n) {
        this.butterCounter = n * fps
        this.showSprite('butter', true)
    }
    hit(damage) {
        if(!this.hitFilterCounter) {
            this.hitFilterCounter = hitFilterLightTime
            addFilter(this, hitFilter)
        }
        if(this.armors) {
            for(let armor of this.armors) {
                if(armor.health > 0) {
                    armor.health -= damage
                    return
                }
            }
        }
        this.hitpoints -= damage
        if(this.hitpoints <= 0) {
            this.changeAction('die')
            this.dead = true
            removeFilter(this, hitFilter)
        }
    }
    addArmor(armorType) {
        if(!this.armors) {
            this.armors = []
        }
        this.armors.push({
            type: armorType,
            health: armorType.BaseHealth
        })
    }
    showArmor() {
        if(!this.armors) return
        for(let armor of this.armors) {
            for(let spr of armor.type.ArmorLayers) {
                this.showSprite(spr, false)
            }
            if(armor.health <= 0) continue
            let percent = armor.health / armor.type.BaseHealth
            let i = 0
            for(;i < armor.type.ArmorLayerHealth.length;i++) {
                let layer = armor.type.ArmorLayerHealth[i]
                if(layer < percent) {
                    this.showSprite(armor.type.ArmorLayers[i], true)
                    return
                }
            }
            this.showSprite(armor.type.ArmorLayers[i], true)
        }
    }
    onFinish() {
        if(this.dead) {
            rm(this)
        }
    }
}
PVZ2.ZombieBasic = class extends PVZ2.ZombieBaseClass {
    constructor(type) {
        super(type, 'walk')
    }
    init() {
        super.init()
    }
    step() {
        super.step()
    }
}
PVZ2.ZombiePoncho = class extends PVZ2.ZombieBaseClass {
    constructor(type) {
        super(type, 'walk')
        if(!PVZ2.ZombiePoncho.ponchoArmor) {
            PVZ2.ZombiePoncho.ponchoArmor = getByRTID('RTID(PonchoDefault@ArmorTypes)')
        }
        if(!PVZ2.ZombiePoncho.plateArmor) {
            PVZ2.ZombiePoncho.plateArmor = getByRTID('RTID(PonchoPlateDefault@ArmorTypes)')
        }
        this.addArmor(PVZ2.ZombiePoncho.ponchoArmor)
        if(this.type.prop.PlateProbability > 0) {
            if(Math.random() < this.type.prop.PlateProbability) {
                this.addArmor(PVZ2.ZombiePoncho.plateArmor)
            }
        }
    }
    static ponchoArmor
    static plateArmor
    init() {
        super.init()
    }
    step() {
        super.step()
    }
}
PVZ2.ZombieModernAllStar = class extends PVZ2.ZombieBaseClass {
    constructor(type) {
        super(type, 'run')
    }
    init() {
        super.init()
    }
    step() {
        super.step()
    }
}
PVZ2.GridItem = class extends PVZ2.Object {
    constructor(type) {
        super()
        this.type = type
        let pam = pams[type.prop.PopAnim]        // PopAnimRenderOffset

        let initAct = undefined
        if(type.TypeName == 'goldtile') {
            initAct = 'inactive_used'
        }
        this.setPam(pam, undefined, initAct)
    }
    init() {
        super.init()
    }
    step() {
        super.step()
    }
}
PVZ2.Effect = class extends PVZ2.Object {
    constructor(pam, act, x, y, z = 0, parent = scene, removeOnFinish = true) {
        super()
        this.setPam(pam, undefined, act, {removeOnFinish: removeOnFinish})
        this.position.set(x, y + z)
        this.y3 = y
        this.z3 = z
        parent.addChild(this)
        newObjects.push(this)
        // this.pivot.set(pam.size[0] / 2, pam.size[1] / 2)
        this.ztype = 'effect'
    }
    init() {
        super.init()
    }
    step() {
        super.step()
    }
}
PVZ2.BackgroundEffect = class extends PVZ2.Object {
    constructor(pam, act, x, y, z = 0, parent = scene) {
        super()
        this.setPam(pam, undefined, act, {topleft: false})
        this.position.set(x, y + z)
        this.y3 = y
        this.z3 = z
        parent.addChild(this)
        newObjects.push(this)
        // this.pivot.set(pam.size[0] / 2, pam.size[1] / 2)
        this.ztype = 'background'
    }
    init() {
        super.init()
    }
    step() {
        super.step()
    }
}
PVZ2.Sun = class extends PVZ2.Object {
    constructor(x, y, fall = 500) {
        let pam = pams.POPANIM_EFFECTS_SUN
        super()
        this.setPam(pam)
        this.position.set(x, y)
        this.y3 = y
        scene.addChild(this)
        newObjects.push(this)
        // this.pivot.set(pam.size[0] / 2, pam.size[1] / 2)
        this.ztype = 'sun'
        this.fall = fall
        this.zIndex = zIndexHUD + 2
    }
    init() {
        super.init()
    }
    step() {
        super.step()
        if(this.age < this.fall) {
            this.y3 += 2
        }
        if(this.age > 600) {
            rm(this)
        }
    }
}

PVZ2.Projectile = class extends PVZ2.Object {
    constructor(type) {
        super()
        if(type.AttachedPAM) {
            let pam = pams[type.AttachedPAM]
            this.setPam(pam, null, 'animation')
        }
        if(type.RenderImage) {
            this.setImage(type.RenderImage)
        }
        this.type = type
        this.velocity = {
            x: randomMinMax(type.InitialVelocity[0]) / 30,
            y: randomMinMax(type.InitialVelocity[1]) / 30,
            z: randomMinMax(type.InitialVelocity[2]) / 30,
        }
        if(type.InitialAcceleration) {
            this.acceleration = {
                x: randomMinMax(type.InitialAcceleration[0]) / 15,
                y: randomMinMax(type.InitialAcceleration[1]) / 15,
                z: randomMinMax(type.InitialAcceleration[2]) / 15,
            }
        }
        if(type.InitialAngularVelocity) {
            this.angularVelocity = randomMinMax(type.InitialAngularVelocity) / 30
        }
        // this.pivot.set(pam.size[0] / 2, pam.size[1] / 2)
        if(PVZ2.collisionBox) {
            drawCollisionBox(this, type.CollisionRect)
        }
        if(type.HasShadow == undefined || type.HasShadow) {
            this.shadow = drawPImageCentered(-80, 10, texturesMap.IMAGE_PLANTSHADOW)
            this.shadow.scale.x *= 0.3
            this.shadow.scale.y *= 0.3
            // shadow.zIndex = -1
            shadowLayer.addChild(this.shadow)
        }
    }
    init() {
        super.init()
    }
    step() {
        for(let obj2 of objects) {
            if(obj2.ztype == 'zombie' && !obj2.dead) {
                if(ifCollide(this, obj2, this.type.CollisionRect, obj2.type.prop.HitRect)) {
                    obj2.hit(this.type.BaseDamage)
                    if(obj2.hitpoints > 0) {
                        if(this.type.Conditions) {
                            for(let cond of this.type.Conditions) {
                                if(cond.Condition == 'chill') {
                                    obj2.chill(cond.Duration.Min)
                                } else if(cond.Condition == 'butter') {
                                    obj2.butter(cond.Duration.Min)
                                }
                            }
                        }
                    }
                    this.splat()
                    rm(this)
                    break
                }
            }
        }
        super.step()
        this.x += this.velocity.x
        this.y3 += -this.velocity.y
        this.z3 += -this.velocity.z
        if(this.acceleration) {
            this.velocity.x += this.acceleration.x
            this.velocity.y += this.acceleration.y
            this.velocity.z += this.acceleration.z
        }
        if(this.angularVelocity) {
            this.rotation += this.angularVelocity
        }
        if(this.x > 1600 || this.z3 > 0 || this.y3 < 0 || this.y3 > 1300 || this.x < 50) {
            rm(this)
        }
    }
    splat() {
        if(!this.type.ImpactPAM) return
        let pam = pams[this.type.ImpactPAM]
        let x2 = 0
        let y2 = 0
        if(this.type.ImpactOffset) {
            x2 = this.type.ImpactOffset[0].Min
            y2 = this.type.ImpactOffset[1].Min
        }
        let sp = new PVZ2.Effect(pam, this.type.ImpactPAMAnimationToPlay[0], this.x + x2, this.y3, this.z3 + y2)
        sp.y3 = this.y3
        sp.z3 = this.z3 + y2
        if(this.velocity && this.velocity.x < 0) {
            sp.angle = 180
        }
    }
}


PVZ2.ThreepeaterProjectile = class extends PVZ2.Projectile {
    constructor(type) {
        super(type)
    }
    step() {
        if(this.age < this.vt) {
            this.y3 += this.vy
        }
        super.step()
    }
}
PVZ2.HomingThistleLeaf = class extends PVZ2.Projectile {
    constructor(type, target) {
        super(type)
        this.target = target
    }
    step() {
        let speed = this.type.InitialVelocity[0].Min / 30
        if(this.target) {
            if(this.target.dead) {
                delete this.target
            } else {
                let angle = calcAngle(this.target.x - this.x, this.target.y3 - this.y3)
                if(angle) {
                    this.rotation = angle.angle
                    this.velocity.x = angle.vx * speed
                    this.velocity.y = -angle.vy * speed
                }
            }
        }
        super.step()
    }
}

PVZ2.mowerRect = {
    mX: -15,
    mY: -15,
    mWidth: 30,
    mHeight: 30
}

PVZ2.Mower = class extends PVZ2.Object {
    constructor(x, y, pam) {
        super()
        this.setPam(pam, pam.main_sprite, pam.actionFrame['idle'])

        this.position.set(x, y)
        this.y3 = y + 35
        this.z3 = -35
        // this.pivot.set(pam.size[0] / 2, pam.size[1] / 2)
        scene.addChild(this)
        newObjects.push(this)
        
        this.ztype = 'mower'
        this.triggered = false
        // this.shadow = drawPImageCentered(-10, 10, texturesMap.IMAGE_PLANTSHADOW)
        // shadowLayer.addChild(this.shadow)
    }
    step() {
        if(this.triggered) {
            this.x += 15
            if(this.x > 1700) {
                rm(this)
            }
        }
        for(let obj of objects) {
            if(obj.ztype == 'zombie' && !obj.dead) {
                if(ifCollide(this, obj, PVZ2.mowerRect, obj.type.prop.HitRect)) {
                    obj.hit(100000)
                    if(!this.triggered) {
                        this.triggered = true
                        this.changeAction('transition')
                    }
                }
            }
        }
        super.step()
    }
    onFinish() {
        if(this.actName == 'transition') {
            this.changeAction('attack')
        }
    }
}
