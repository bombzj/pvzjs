
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

const hideSprite = new Set(['ground_swatch', 'ground_swatch_plane', '_zombie_egypt_armor2_statesxxx', 
        '_zombie_egypt_armor1_states', 'butter', 'ink', 'mc_cherrybomb_explosion_text', 'mc_cherrybomb_explosion_text_c'
        ,'brick_undamaged','brick_damaged1','brick_damaged2', '_wallnut_armor_states'])

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
                    part.visible = false
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
                spr.visible = true
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
                if(spriteData.name.startsWith('custom') && spriteData.name != this.param.custom || hideSprite.has(spriteData.name)) {
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
            if(this.param.walk && spr.data.frame) {
                if(spr.data.name == this.param.walkGround) {
                    if(!this.ground) {
                        this.groundMove = 0
                    } else {
                        this.groundMove = spr.x - this.ground
                    }
                    this.ground = spr.x
                }
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
        if(this.param.walk && this.groundMove) {
            if(this.groundMove > 0) {
                this.x -= this.groundMove
            }
        }
        for(let part of Object.values(this.parts)) {
            if(part.step) {
                part.step()
            }
        }
    }

    getSprite(name) {
        for(let part of this.parts) {
            if(part.sprite.name == name) {
                return part
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
        if(PVZ2.collisionBox) {
            // drawCollisionBox(this, type.prop.HitRect)
        }
    }
    init() {
        super.init()
    }
    step() {
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
            a.pivot.set(-projectileType.AttachedPAMOffset.x/resScale, -projectileType.AttachedPAMOffset.y/resScale)
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

PVZ2.ZombieBaseClass = class extends PVZ2.Object {
    constructor(type, initAct) {
        let pam = pams[type.PopAnim]
        super(pam, null, initAct, {walk: true, walkGround: 'ground_swatch'})
        this.type = type
        this.hitpoints = type.prop.Hitpoints
        if(PVZ2.collisionBox) {
            drawCollisionBox(this, type.prop.HitRect)
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
    }
    chill(n) {
        this.chillCounter = n * fps
        this.filters = [chillFilter];
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

class ProjectileSprite extends PVZ2.Object {
    constructor(type) {
        let pam = pams[type.AttachedPAM]
        super(pam, null, 'animation')
        this.type = type
        this.speedX = type.InitialVelocity[0].Min / 30
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
        let a = new PVZ2.Object(pam, null, this.type.ImpactPAMAnimationToPlay[0], {removeOnFinish: true})
        a.position.set(this.x + this.type.ImpactOffset[0].Min + this.type.AttachedPAMOffset.x
            , this.y + this.type.ImpactOffset[1].Min + this.type.AttachedPAMOffset.y)
        stage.addChild(a)
        newObjects.push(a)
        a.scale.set(resScale)
        a.ztype = 'splat'
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
    rec.position.set(rect.mX, rect.mY)
    obj.addChild(rec)
}