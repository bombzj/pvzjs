
let pams = {}
let imageScale = 1200 / 768

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
        for(let remove of frame.remove) {
            delete appends[remove.index]
        }
        for(let append of frame.append) {
            appends[append.index] = append
        }
        for(let change of frame.change) {
            changes[change.index] = change
        }
        if(firstFrame) {
            if(Object.keys(appends).length != frame.append.length) {
                frame.remove = []
                frame.append = []
                frame.change = []
                for(let index in appends) {
                    frame.append.push(appends[index])
                    frame.change.push(changes[index])
                }
            }
        }
        firstFrame = frame.stop
    }
}

class PamSprite extends PIXI.Container {
    constructor(pam, sprite, frameStart = 0, param = {}) {
        super()
        if(!pam) debugger
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
    getFrame() {
        return this.sprite.frame[this.frame]
    }
    doFrame() {
        let frame = this.getFrame()
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
                spr.alpha = 1
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
                if(this.hideSprites.has(spriteData.name) /*|| spriteData.name.startsWith('custom') && spriteData.name != this.param.custom || hideSprite.has(spriteData.name)*/) {
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
                if(this.param.useAction) {
                    this.param.useAction(this)
                }
            }
        }
        this.frame++
        if(frame.stop || this.frame >= this.sprite.frame.length - 1) {
            this.frame = this.frameStart
            if(this.param.onFinish) {
                this.param.onFinish(this)
            }
            // if(this.onFinish) this.onFinish()
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
