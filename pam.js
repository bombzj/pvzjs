
let pams = {}
let imageScale = 1200 / 768

var PVZ2 = {}

var chillFilter = new PIXI.filters.ColorMatrixFilter()
chillFilter.tint(0x8888FF)

function pamInit(name, dataRaw) {
    let data = parsePam(dataRaw)
    pams[name] = data
    pams[name].name = name

    for(let image of data.image) {
        let s = image.name.split('|')
        image.texture = texturesMap[s[1]]
        if(image.transform.length != 6 || image.transform[1] != 0
            || image.transform[2] != 0 || !image.texture) debugger
        image.transform[0] *= image.size[0] / image.texture.width
        image.transform[3] *= image.size[1] / image.texture.height
        // let scalex = image.size[0] / image.texture.width
        // let scaley = image.size[1] / image.texture.height
        // let ex = Math.abs(scalex/imageScale-1)
        // let ey = Math.abs(scaley/imageScale-1)
        // if(ex > 0.2 || ey > 0.2) debugger
    }
    data.spriteMap = {}
    for(let sprite of data.sprite) {
        data.spriteMap[sprite.name] = sprite
    }
    data.actionFrame = {}
    // for(let sp of data.sprite) {
    //     // if(sp.frame.length > 1) debugger
    // }
    for(let [index, frame] of data.main_sprite.frame.entries()) {
        if(frame.label != null) {
            data.actionFrame[frame.label] = index
        }
    }
    // refill all frames for beginning of each anim in main_sprite
    
    let appends = {}    // keep all current appends
    let changes = {}    // keep all current changes
    let firstFrame = true
    for(let frame of data.main_sprite.frame) {
        if(firstFrame) {
            for(let index in appends) {
                if(!frame.remove.find(x => x.index == index)) {
                    frame.append.push(appends[index])
                    frame.change.push(changes[index])
                }
            }
        }
        for(let remove of frame.remove) {
            delete appends[remove.index]
        }
        for(let append of frame.append) {
            appends[append.index] = append
        }
        for(let change of frame.change) {
            changes[change.index] = change
        }
        firstFrame = frame.stop
    }
}

class PamSprite extends PIXI.Container {
    constructor(pam, sprite, frameStart = 0, param = {}) {
        super()
        this.pam = pam
        this.sprite = sprite || pam.main_sprite
        if(typeof frameStart === 'string') {
            frameStart = pam.actionFrame[frameStart]
            if(frameStart == undefined) {
                frameStart = 0
            }
        }
        this.frameStart = this.frame = frameStart
        this.param = param
        this.parts = {}
        if(param.hideSprites) {
            this.hideSprites = param.hideSprites
        } else {
            this.hideSprites = new Set()    // TODO: unnecessary cost
        }
        this.doFrame()
        if(PVZ2.spriteBox && sprite == pam.main_sprite) {
            this.drawBoundingBox(0, 0, pam.size[0], pam.size[1])
        }
    }

    changeAction(frameStart) {
        if(typeof frameStart === 'string') {
            this.actName = frameStart
            frameStart = this.pam.actionFrame[frameStart]
            if(frameStart == undefined) debugger
        }
        this.frameStart = this.frame = frameStart
    }

    changeSprite(sprite, frameStart) {
        this.parts = {}  // remove is inefficient?
        this.removeChildren()
        this.sprite = sprite || this.pam.main_sprite
        if(frameStart == undefined) {
            frameStart = 0
        }
        this.changeAction(frameStart)
        this.doFrame()
    }

    doFrame() {
        let frame = this.sprite.frame[this.frame]
        if(this.sprite.frame.length > 1) {
            if(this.frame == this.frameStart) {  // first frame, remove any
                // this.parts = {}  // remove is inefficient?
                // this.removeChildren()
                for(let part of Object.values(this.parts)) {
                    part.renderable = false
                }
                // for(let child of this.children) {
                //     child.visible = false
                // }
            }
        }
        for(let remove of frame.remove) {
            let spr = this.parts[remove.index]
            if(spr) {
                spr.renderable = false
                // this.removeChild(spr)
                // delete this.parts[remove.index]
            }
        }
        for(let append of frame.append) {
            let spr = this.parts[append.index]
            if(spr) {
                spr.renderable = true
                if(spr.frame) {
                    spr.frame = 0    // restart sub animation
                }
                continue
            }
            let resourceId = append.resource
            if(append.sprite) {
                let spriteData = this.pam.sprite[resourceId]
                spr = new PamSprite(this.pam, spriteData, 0, {hideSprites: this.hideSprites})
                spr.data = spriteData
                if(this.param.walk && spriteData.name == this.param.walkGround) {
                    this.ground = undefined
                }
                if(this.hideSprites.has(spriteData.name) || spriteData.name.startsWith('custom') && spriteData.name != this.param.custom/* || hideSprite.has(spriteData.name)*/) {
                    spr.visible = false
                }
            } else {
                let image = this.pam.image[resourceId]
                if(!image) debugger
                let texture = image.texture
                spr = new PIXI.Sprite(texture)
                spr.data = image
            }
            spr.zIndex = append.index
            this.parts[append.index] = spr
            this.addChild(spr)
        
        }
        this.sortChildren()
        for(let change of frame.change) {
            let spr = this.parts[change.index]  // image or container
            if(!spr) continue
            if(!change.transform) continue
            if(spr.data.frame) {
                spr.setTransformArray(change.transform)
            } else {
                spr.setTransformArray2(change.transform, spr.data.transform)
            }
            if(change.color) {
                if(change.color[0] != 1 || change.color[1] != 1 || change.color[2] != 1) {
                    let r = change.color[0] * 256 << 0
                    let g = change.color[1] * 256 << 0
                    let b = change.color[2] * 256 << 0
                    if(r == 256) r = 255
                    if(g == 256) g = 255
                    if(b == 256) b = 255
                    spr.tint = r << 16 | g << 8 | b
                    for(let c of spr.children) {
                        c.tint = spr.tint
                    }
                }
                spr.alpha = change.color[3]
            }
        }

        for(let command of frame.command) {
            if(command.command == 'use_action') {
                if(this.param.userAction) {
                    this.param.userAction(this)
                }
                if(this.useAction) {
                    this.useAction()
                }
            }
        }
        this.frame++
        if(frame.stop || this.frame >= this.sprite.frame.length - 1) {
            this.frame = this.frameStart
            if(this.param.onFinish) {
                this.param.onFinish(this)
            }
            if(this.onFinish) this.onFinish()
            // frame = this.sprite.frame[this.frame]
        }
    }

    step() {
        if(this.sprite.frame.length > 1) {
            this.doFrame()
        }
        for(let part of Object.values(this.parts)) {
            if(part.step) {
                part.step()
            }
        }
    }

    getSprite(name) {
        for(let part of Object.values(this.parts)) {
            if(part.sprite) {
                if(part.sprite.name == name) {
                    return part
                } else if(part.getSprite) {
                    let ret = part.getSprite(name)
                    if(ret) return ret
                }
            }
        }
    }

    showSprite(name, visible) {
        for(let part of Object.values(this.parts)) {
            if(part.sprite) {
                if(part.sprite.name == name) {
                    part.visible = visible
                } else if(part.showSprite) {
                    part.showSprite(name, visible)
                }
            }
        }
        if(visible) {
            this.hideSprites.delete(name)
        } else {
            this.hideSprites.add(name)
        }
    }
    showSprites(names, visible = true) {
        if(visible) {
            for(let n of names) {
                this.hideSprites.delete(n)
            }
        } else {
            for(let n of names) {
                this.hideSprites.add(n)
            }
        }
        for(let part of Object.values(this.parts)) {
            if(part.sprite) {
                if(this.hideSprites.has(part.sprite.name)) {
                    part.visible = visible
                } else if(part.showSprite) {
                    part.showSprites(names, visible)
                }
            }
        }
    }
    drawBoundingBox(x, y, w, h, color = 0x00FF00) {
        let rec = new PIXI.Graphics()
        rec.lineStyle(3, color, 1)
        rec.drawRect(0, 0, w, h)
        rec.position.set(-x, -y)
        this.addChild(rec)
    }
}

PVZ2.Object = class extends PamSprite {
    constructor() {
        super(...arguments)
        this.age = 0
        this.y3 = this.z3 = 0
    }
    step() {
        super.step()
        this.age++
        this.y = this.y3 + this.z3
        if(this.shadow) {
            this.shadow.x = this.x
            this.shadow.y = this.y3
        }
        this.zIndex = this.y3
        if(this.ztype == 'zombie') {
            this.zIndex += 0.1
        } else if(this.ztype == 'sun') {
            this.zIndex = 5000
        } else if(this.ztype == 'projectile') {
            this.zIndex += 0.2
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
        super(pam, undefined, initAct)
        this.actName = initAct
        this.type = type
        if(type.prop.Actions) {
            let action = this.action = type.prop.Actions[0]
            this.actionCooldownMax = action.CooldownTimeMin * fps
            this.actionCooldown = action.InitialMinCooldownTime * fps | action.CooldownTimeMin * fps
            if(type.TypeName == 'sunflower') {
                this.actionCooldownMax /= 2
                this.actionCooldown /= 2
            }
        }
        // this.attacking = true   // for test
        this.hitpoints = type.prop.Hitpoints
        this.pivot.set(pam.size[0] / 2, pam.size[1] / 2)
        if(PVZ2.collisionBox) {
            // drawCollisionBox(this, type.prop.HitRect)
        }
        this.showSprites(plantHideSprites, false)

        // plant shadow
        this.shadow = drawPImageCentered(-85, 10, texturesMap.IMAGE_PLANTSHADOW)
        // shadow.zIndex = -1
        shadowLayer.addChild(this.shadow)
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
            if(this.launchCounter == 5 && this.type.TypeName == 'repeater') {
                this.launch()
            }
        }
        if(this.type.prop.IsInstant) {
            if(this.action.Type == 'explode' && this.actName != 'attack') {
                if(!this.action.CooldownTimeMin || this.age > this.action.CooldownTimeMin * 30) {
                    this.changeAction('attack')
                }
            }
        }
        if(this.pam.name == 'POPANIM_PLANT_SUNFLOWER') {
            if(this.actionCooldown <= 0) {
                this.changeAction('special')
                this.actionCooldown = this.actionCooldownMax
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
        for(let obj2 of objects) {
            if(obj2.ztype == 'zombie' && !obj2.dead) {
                if(this.type.TypeName == 'threepeater') {
                    if(obj2.x > this.x && Math.abs(obj2.y3 - this.y3) < 300) {
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
                        this.z3 -= 25
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
                    this.z3 += 25
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
                new PVZ2.Effect(pams.POPANIM_EFFECTS_POTATOMINE_EXPLOSION, undefined,  this.x + offsetX, this.y + offsetY)
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
                            new PVZ2.Effect(pams.POPANIM_EFFECTS_CHERRYBOMB_EXPLOSION_REAR, undefined,  this.x + offsetX, this.y + offsetY, shadowLayer)
                            new PVZ2.Effect(pams.POPANIM_EFFECTS_CHERRYBOMB_EXPLOSION_TOP, undefined,  this.x + offsetX, this.y + offsetY)
                            for(let obj2 of objects) {
                                if(obj2.ztype == 'zombie' && !obj2.dead && withinDistance(this, obj2, 200)) {
                                    obj2.dead = true
                                    rm(obj2)
                                    new PVZ2.Effect(pams.POPANIM_EFFECTS_ZOMBIE_ASH, undefined,  obj2.x, obj2.y)
                                }
                            }
                        }
                        return
                    }
        
                    this.changeAction('idle')
                } else {
                    // attack after finish last action
                    // this.changeAction('attack')
                }
            }
        }
    }
    useAction() {
        if(this.action.Type == 'projectile') {
            if(this.action.Projectile) {
                let projectileType = getByRTID(this.action.Projectile)
                if(this.type.TypeName == 'kernelpult' && this.actName == 'attack2') {
                    projectileType = getByRTID(this.type.prop.Actions[1].Projectile)
                }
                this.launch(projectileType)
                this.launchCounter = 0
            }
        } else if(this.action.Type == 'sun') {
            new PVZ2.Sun(this.x + this.action.SpawnOffset.x, this.y + this.action.SpawnOffset.y, 50)
        }
    }
    launch(projectileType) {
        let target = this.findTarget()
        if(projectileType.ClassName == 'ThreepeaterProjectile') {
            let a = launchProjectile(projectileType, this.x + this.action.SpawnOffset.x, this.y3, this.z3 + this.action.SpawnOffset.y, target)
            let b = launchProjectile(projectileType, this.x + this.action.SpawnOffset.x, this.y3, this.z3 + this.action.SpawnOffset.y, target)
            a.vy = - (b.vy = 15)
            a.vt = b.vt = 10
            let c = launchProjectile(projectileType, this.x + this.action.SpawnOffset.x, this.y3, this.z3 + this.action.SpawnOffset.y, target)
            c.vt = 0
        } else {
            launchProjectile(projectileType, this.x + this.action.SpawnOffset.x, this.y3, this.z3 + this.action.SpawnOffset.y, target)
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
        "zombie_armor_cone_norm",
        "zombie_armor_cone_damage_01",
        "zombie_armor_cone_damage_02",
        "zombie_armor_bucket_norm",
        "zombie_armor_bucket_damage_01",
        "zombie_armor_bucket_damage_02",
        "zombie_armor_brick_norm",
        "zombie_armor_brick_damage_01",
        "zombie_armor_brick_damage_02",
        'butter', 'ink',
    ]
var plantHideSprites = [
    '_wallnut_armor_states',
    '_tallnut_plantfood_armor',
    'Magnet_Item'
]

PVZ2.ZombieBaseClass = class extends PVZ2.Object {
    constructor(type, initAct) {
        let pam = pams[type.PopAnim]
        super(pam, undefined, initAct, {walk: true, walkGround: 'ground_swatch'})
        this.actName = initAct
        this.type = type
        let prop = type.prop
        this.hitpoints = prop.Hitpoints
        this.initAct = initAct
        
        this.pivot.set(pam.size[0] / 2, pam.size[1] / 2)
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
                this.filters = []
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
        if(this.armors) {
            for(let armor of this.armors) {
                if(armor.health > 0) {
                    armor.health -= damage
                    return
                }
            }
        }
        this.hitpoints -= damage
        if(this.hitpoints < 0) {
            this.changeAction('die')
            this.dead = true
        }
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
PVZ2.Effect = class extends PVZ2.Object {
    constructor(pam, act, x, y, parent = scene) {
        super(pam, undefined, act, {removeOnFinish: true})
        this.position.set(x, y)
        this.y3 = y
        parent.addChild(this)
        newObjects.push(this)
        this.pivot.set(pam.size[0] / 2, pam.size[1] / 2)
        this.ztype = 'effect'
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
        super(pam)
        this.position.set(x, y)
        scene.addChild(this)
        newObjects.push(this)
        this.pivot.set(pam.size[0] / 2, pam.size[1] / 2)
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
        if(!type.AttachedPAM) {
            type.AttachedPAM = "POPANIM_EFFECTS_T_KERNALPULT_PROJECTILE"
        }
        let pam = pams[type.AttachedPAM]
        super(pam, null, 'animation')
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
        this.pivot.set(pam.size[0] / 2, pam.size[1] / 2)
        if(PVZ2.collisionBox) {
            drawCollisionBox(this, type.CollisionRect)
        }
        this.shadow = drawPImageCentered(-80, 10, texturesMap.IMAGE_PLANTSHADOW)
        this.shadow.scale.x *= 0.3
        this.shadow.scale.y *= 0.3
        // shadow.zIndex = -1
        shadowLayer.addChild(this.shadow)
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
        if(this.x > 1600 || this.z3 > 0) {
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
        let sp = new PVZ2.Effect(pam, this.type.ImpactPAMAnimationToPlay[0], this.x + x2, this.y + y2)
        sp.y3 = this.y3
        sp.z3 = this.z3 + y2
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

PVZ2.mowerRect = {
    mX: -15,
    mY: -15,
    mWidth: 30,
    mHeight: 30
}

PVZ2.Mower = class extends PVZ2.Object {
    constructor(x, y, pam) {
        super(pam, pam.main_sprite, pam.actionFrame['idle'])

        this.position.set(x, y)
        this.y3 = y + 35
        this.z3 = -35
        this.pivot.set(pam.size[0] / 2, pam.size[1] / 2)
        scene.addChild(this)
        newObjects.push(this)
        
        this.ztype = 'car'
        this.triggered = false
        // this.shadow = drawPImageCentered(-10, 10, texturesMap.IMAGE_PLANTSHADOW)
        // shadowLayer.addChild(this.shadow)
    }
    step() {
        if(this.triggered) {
            this.x += 15
            if(this.x > 1600) {
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


PIXI.Container.prototype.setTransformArray = function(transform) {
    if(transform.length == 2) {
        this.transform.setFromMatrix(new PIXI.Matrix(1, 0, 0, 1, ...transform))
    } else if(transform.length == 6) {
        this.transform.setFromMatrix(new PIXI.Matrix(...transform))
    } else {
        debugger
    }
}

PIXI.Container.prototype.setTransformArray2 = function(transform, transform2) {
    let mat = transform.length == 6 ? new PIXI.Matrix(...transform) : new PIXI.Matrix(1, 0, 0, 1, ...transform)
    let mat2 = transform2.length == 6 ? new PIXI.Matrix(...transform2) : new PIXI.Matrix(1, 0, 0, 1, ...transform2)
    this.transform.setFromMatrix(mat.append(mat2))
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