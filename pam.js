
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
}

class PamSprite extends PIXI.Container {
    constructor(pam, sprite, frameStart = 0, param = {}) {
        super()
        this.pam = pam
        this.sprite = sprite || pam.main_sprite
        if(typeof frameStart === 'string') {
            frameStart = pam.actionFrame[frameStart]
        }
        this.frameStart = this.frame = frameStart
        this.param = param
        this.parts = {}
        this.doFrame()
    }

    changeAction(frameStart) {
        if(typeof frameStart === 'string') {
            this.actName = frameStart
            frameStart = this.pam.actionFrame[frameStart]
            if(frameStart == undefined) debugger
        }
        this.frameStart = this.frame = frameStart
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
                this.removeChild(spr)
                delete this.parts[remove.index]
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
                spr = new PamSprite(this.pam, spriteData, 0, this.param.custom)
                spr.data = spriteData
                if(this.param.walk && spriteData.name == this.param.walkGround) {
                    this.ground = undefined
                }
                if(spriteData.name.startsWith('custom') && spriteData.name != this.param.custom/* || hideSprite.has(spriteData.name)*/) {
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
    }
    showSprites(names, visible = true) {
        for(let part of Object.values(this.parts)) {
            if(part.sprite) {
                if(names.has(part.sprite.name)) {
                    part.visible = visible
                } else if(part.showSprite) {
                    part.showSprites(names, visible)
                }
            }
        }
    }
}

PVZ2.Object = class extends PamSprite {
    constructor() {
        super(...arguments)
        this.age = 0
    }
    step() {
        super.step()
        this.age++
    }
    onFinish() {
        if(this.param && this.param.removeOnFinish) {
            rm(this)
        }
    }
}
PVZ2.Plant = class extends PVZ2.Object {
    constructor(type) {
        let pam = pams[type.PopAnim]
        super(pam)
        this.type = type
        if(type.prop.Actions) {
            let action = this.action = type.prop.Actions[0]
            this.actionCooldownMax = action.CooldownTimeMin * fps
            this.actionCooldown = action.InitialMinCooldownTime * fps | action.CooldownTimeMin * fps
        }
        // this.attacking = true
        this.hitpoints = type.prop.Hitpoints
        let center = type.prop.ArtCenter
        this.pivot.set(center.x / resScale, center.y / resScale)
        if(PVZ2.collisionBox) {
            // drawCollisionBox(this, type.prop.HitRect)
        }
        this.showSprites(hideSprites, false)
    }
    init() {
        super.init()
    }
    step() {
        if(this.type.prop.IsInstant) {
            if(this.action.Type == 'explode' && this.actName != 'attack') {
                if(!this.action.CooldownTimeMin || this.age > this.action.CooldownTimeMin * 30) {
                    this.changeAction('attack')
                }
            }
        }
        if(this.attacking) {
            if(this.actionCooldown <= 0) {
                if(this.pam.name == 'SUNFLOWER') {
                    this.changeAction('special')
                } else if(this.pam.actionFrame['attack']) {
                    this.changeAction('attack')
                }
                this.actionCooldown = this.actionCooldownMax
            }
        }
        super.step()
        this.actionCooldown--
    }
    onFinish() {
        if(this.actName != 'idle') {
            if(this.action.Type == 'explode' && this.actName == 'attack') {
                rm(this)
                if(this.type.TypeName == 'cherry_bomb') {
                    let offsetX = 24, offsetY = -180
                    new PVZ2.Effect(pams.POPANIM_EFFECTS_CHERRYBOMB_EXPLOSION_REAR, undefined,  this.x + offsetX, this.y + offsetY)
                    new PVZ2.Effect(pams.POPANIM_EFFECTS_CHERRYBOMB_EXPLOSION_TOP, undefined,  this.x + offsetX, this.y + offsetY)
                }
                for(let obj2 of objects) {
                    if(obj2.ztype == 'zombie' && !obj2.dead) {
                        obj2.dead = true
                        rm(obj2)
                        new PVZ2.Effect(pams.POPANIM_EFFECTS_ZOMBIE_ASH, undefined,  obj2.x, obj2.y)
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
    useAction() {
        if(this.action.Type == 'projectile') {
            let projectileType = getByRTID(this.action.Projectile)
            let a = new ProjectileSprite(projectileType)
            a.position.set(this.x + this.action.SpawnOffset.x
                , this.y + this.action.SpawnOffset.y)
            stage.addChild(a)
            newObjects.push(a)
            a.scale.set(resScale)
            a.ztype = 'projectile'
        } else if(this.action.Type == 'sun') {
            sun(this.x + this.action.SpawnOffset.x, this.y + this.action.SpawnOffset.y)
        }
    }
}

var hideSprites = new Set([
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
        '_wallnut_armor_states'
    ])

PVZ2.ZombieBaseClass = class extends PVZ2.Object {
    constructor(type, initAct) {
        let pam = pams[type.PopAnim]
        super(pam, null, initAct, {walk: true, walkGround: 'ground_swatch'})
        this.type = type
        this.hitpoints = type.prop.Hitpoints
        
        let center = type.prop.ArtCenter
        this.pivot.set(center.x / resScale, center.y / resScale)
        if(PVZ2.collisionBox) {
            drawCollisionBox(this, type.prop.HitRect)
        }
        this.showSprites(hideSprites, false)
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
    }
    init() {
        super.init()
    }
    step() {
        if(this.chillCounter > 0) {
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

        if(this.actName != 'die') {
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
                    this.x -= this.groundMove * resScale
                }
            } else {
                this.x -= prop.Speed * resScale
            }
        }
        this.showArmor()
    }
    chill(n) {
        this.chillCounter = n * fps
        this.filters = [chillFilter];
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
            obj2.changeAction('die')
            obj2.dead = true
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
    constructor(pam, act, x, y) {
        super(pam, undefined, act, {removeOnFinish: true})
        this.position.set(x, y)
        stage.addChild(this)
        newObjects.push(this)
        this.scale.set(resScale)
        this.ztype = 'effect'
    }
    init() {
        super.init()
    }
    step() {
        super.step()
    }
}

class ProjectileSprite extends PVZ2.Object {
    constructor(type) {
        let pam = pams[type.AttachedPAM]
        super(pam, null, 'animation')
        this.type = type
        this.speedX = type.InitialVelocity[0].Min / 30
        this.pivot.set(-type.AttachedPAMOffset.x/resScale, -type.AttachedPAMOffset.y/resScale)
        if(PVZ2.collisionBox) {
            drawCollisionBox(this, type.CollisionRect)
        }
    }
    init() {
        super.init()
    }
    step() {
        super.step()
        this.x += this.speedX
        if(this.x > 1200) {
            rm(this)
        }
    }
    splat() {
        let pam = pams[this.type.ImpactPAM]
        new PVZ2.Effect(pam, this.type.ImpactPAMAnimationToPlay[0], 
            this.x + this.type.ImpactOffset[0].Min + this.type.AttachedPAMOffset.x,
            this.y + this.type.ImpactOffset[1].Min + this.type.AttachedPAMOffset.y)
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
    rec.position.set(rect.mX + obj.pivot.x, rect.mY + obj.pivot.y)
    obj.addChild(rec)
}