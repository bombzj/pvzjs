
let pams = {}
let imageScale = 1200 / 768

function pamInit(name, dataRaw, textures) {
    let data = parsePam(dataRaw)
    pams[name] = data
    pams[name].name = name
    pams[name].textures = textures

    for(let image of data.image) {
        let s = image.name.split('|')
        image.texture = textures[s[1]]
        if(image.transform.length != 6 || image.transform[1] != 0 || image.transform[2] != 0) debugger
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
        this.doFrame()
    }

    changeAction(frameStart) {
        if(typeof frameStart === 'string') {
            frameStart = this.pam.actionFrame[frameStart]
            if(frameStart == undefined) debugger
        }
        this.frameStart = this.frame = frameStart
    }

    doFrame() {
        let frame = this.sprite.frame[this.frame]
        if(frame.stop || this.frame >= this.sprite.frame.length - 1) {
            this.frame = this.frameStart
            if(this.param.onFinish) {
                this.param.onFinish(this)
            }
            if(this.onFinish) this.onFinish()
            frame = this.sprite.frame[this.frame]
        }
        if(this.frame == this.frameStart) {  // first frame, remove any
            this.parts = {}
            this.removeChildren()
        }
        for(let remove of frame.remove) {
            let spr = this.parts[remove.index]
            if(spr) {
                this.removeChild(spr)
                delete this.parts[remove.index]
            }
        }
        for(let append of frame.append) {
            if(this.parts[append.index]) continue
            let resourceId = append.resource
            let spr
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
            }
        }
        this.frame++
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


class PlantSprite extends PamSprite {
    constructor(type) {
        let pam = pams[type.pamName]
        super(pam)
        this.actionCooldownMax = 2.5 * fps
        this.actionCooldown = 0
    }
    init() {
        super.init()
    }
    step() {
        if(true) {
            if(this.actionCooldown <= 0) {
                if(this.pam.name == 'SUNFLOWER') {
                    this.changeAction('special')
                } else if(this.pam.actionFrame['attack']) {
                    this.changeAction('attack')
                }
                this.actName = 'attack'
                this.actionCooldown = this.actionCooldownMax
            }
        }
        this.actionCooldown--
        super.step()
    }
    onFinish() {
        if(this.actName == 'attack') {
            this.changeAction('idle')
        }
    }
}

class ZombieSprite extends PamSprite {
    constructor(type) {
        let pam = pams[type.pamName]
        super(pam, null, 'walk')
    }
    init() {
        super.init()
    }
    step() {
        super.step()
    }
}

PIXI.Container.prototype.setTransformArray = function(transform) {
    if(transform.length == 2) {
        this.x = transform[0]
        this.y = transform[1]
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




class bytebuffer {
    constructor(arr, pos) {
        this.arr = new Uint8ClampedArray(arr);
        this.pos = pos ? pos : 0;
    }

    ReadByte() {
        return this.arr[this.pos++];
    }

    ReadUInt32() {
        return this.ReadInt32() >>> 0
    }
    ReadInt32() {
        let res = (this.arr[this.pos + 3] << 24) + (this.arr[this.pos + 2] << 16) + (this.arr[this.pos + 1] << 8) + this.arr[this.pos];
        this.pos += 4;
        return res;
    }

    ReadInt16() {
        let res = this.ReadUInt16();
        if (res >= 0x8000)
            res = res - 0x10000;
        return res;
    }

    ReadUInt16() { // unsigned
        let res = (this.arr[this.pos + 1] << 8) + this.arr[this.pos];
		this.pos += 2;
        return res;
    }

	ReadStringByInt16Head() {
		return this.ReadString(this.ReadInt16());
	}

    ReadBoolean() {
        let res = this.ReadByte()
        return res && 0x1
    }

	ReadString(len) {
		if(len < 0 || len > 1000) debugger
		let ary = this.ReadBytes(len);
		// if (endian == Endian.Small) ary.reverse();
		return String.fromCharCode(...ary);
	}

	ReadBytes(count) {
        let res = this.arr.slice(this.pos, this.pos + count);
        this.pos += count;
        return res;
	}
}

const Magic = 0xBAF01954;
const MaxVersion = 6;
const FrameFlags = {
    Removes: 1,
    Adds: 2,
    Moves: 4,
    FrameName: 8,
    Stop: 16,
    Commands: 32
}
const MoveFlags = {
    SrcRect: 32768,
    Rotate: 16384,
    Color: 8192,
    Matrix: 4096,
    LongCoords: 2048,
    AnimFrameNum: 1024
}


function parsePam(data) {
    let bs = new bytebuffer(data);
    let head = bs.ReadUInt32();
    if (head != Magic) return null;
    output = {};
    let version = output.version = bs.ReadInt32();
    if (version > MaxVersion) {
        return null;
    }
    output.frame_rate = bs.ReadByte();
    output.position = [bs.ReadInt16() / 20, bs.ReadInt16() / 20]
    output.size = [bs.ReadInt16() / 20, bs.ReadInt16() / 20]
    let imagesCount = bs.ReadInt16();
    output.image = [];
    for (let i = 0; i < imagesCount; i++) {
        output.image[i] = readImage(bs, version);
    }
    let spritesCount = bs.ReadInt16();
    output.sprite = [];
    for (let i = 0; i < spritesCount; i++) {
        output.sprite[i] = readSprite(bs, version);
        if (version < 4) {
            output.sprite[i].frame_rate = frame_rate;
        }
    }
    if (version <= 3 || bs.ReadBoolean()) {
        output.main_sprite = readSprite(bs, version)
        if (version < 4) {
            output.main_sprite.frame_rate = frame_rate;
        }
    }
    return output
}


function readImage(bs, version) {
    let image = {}
    image.name = bs.ReadStringByInt16Head();
    if (version >= 4) {
        image.size = [bs.ReadInt16(), bs.ReadInt16()];
    } else {
        image.size = [-1, -1]
    }
    let transform = image.transform = [];
    if (version == 1) {
        let num6 = bs.ReadInt16() / 1000;
        let num7 = Math.sin(num6);
        let num8 = Math.cos(num6);
        transform[0] = num8;
        transform[2] = -num7;
        transform[1] = num7;
        transform[3] = num8;
        transform[4] = bs.ReadInt16() / 20;
        transform[5] = bs.ReadInt16() / 20;
    } else {
        transform[0] = bs.ReadInt32() / 1310720;
        transform[2] = bs.ReadInt32() / 1310720;
        transform[1] = bs.ReadInt32() / 1310720;
        transform[3] = bs.ReadInt32() / 1310720;
        transform[4] = bs.ReadInt16() / 20;
        transform[5] = bs.ReadInt16() / 20;
    }
    return image;
}

function readSprite(bs, version) {
    let sprite = {}
    if (version >= 4) {
        sprite.name = bs.ReadStringByInt16Head();
        if (version >= 6) {
            sprite.description = bs.ReadStringByInt16Head();
        }
        sprite.frame_rate = bs.ReadInt32() / 65536;
    } else {
        sprite.name = null;
        sprite.frame_rate = -1;
    }
    let framesCount = bs.ReadInt16();
    if (version >= 5) {
        sprite.work_area = [bs.ReadInt16(), bs.ReadInt16()];
    } else {
        sprite.work_area = [0, framesCount - 1];
    }
    sprite.work_area[1] = framesCount;
    sprite.frame = [];
    for (let i = 0; i < framesCount; i++) {
        sprite.frame[i] = readFrame(bs, version);
    }
    return sprite;
}


function readFrame(bs, version) {
    let frame = {}
    let flags = bs.ReadByte();
    if ((flags & FrameFlags.Removes) != 0) {
        let count = bs.ReadByte();
        if (count == 255) {
            count = bs.ReadInt16();
        }
        frame.remove = [];
        for (let i = 0; i < count; i++) {
            frame.remove[i] = readRemoves(bs, version);
        }
    } else {
        frame.remove = [];
    }
    if ((flags & FrameFlags.Adds) != 0) {
        let count = bs.ReadByte();
        if (count == 255) {
            count = bs.ReadInt16();
        }
        frame.append = [];
        for (let i = 0; i < count; i++) {
            frame.append[i] = readAdds(bs, version);
        }
    } else {
        frame.append = [];
    }
    if ((flags & FrameFlags.Moves) != 0) {
        let count = bs.ReadByte();
        if (count == 255) {
            count = bs.ReadInt16();
        }
        frame.change = [];
        for (let i = 0; i < count; i++) {
            frame.change[i] = readMoves(bs, version);
        }
    } else {
        frame.change = [];
    }
    if ((flags & FrameFlags.FrameName) != 0) {
        frame.label = bs.ReadStringByInt16Head();
    }
    if ((flags & FrameFlags.Stop) != 0) {
        frame.stop = true;
    }
    if ((flags & FrameFlags.Commands) != 0) {
        let num12 = bs.ReadByte();
        frame.command = [];
        for (let m = 0; m < num12; m++) {
            frame.command[m] = readCommands(bs, version);
        }
    } else {
        frame.command = [];
    }
    return frame;
}


function readCommands(bs, version) {
    return {
        command: bs.ReadStringByInt16Head(),
        parameter: bs.ReadStringByInt16Head(),
    }
}

function readRemoves(bs, version) {
    index = bs.ReadInt16();
    if (index >= 2047) {
        index = bs.ReadInt32();
    }
    return { index: index };
}

function readAdds(bs, version) {
    let append = {}
    let num5 = bs.ReadUInt16();
    append.index = num5 & 2047;
    if (append.index == 2047) {
        append.index = bs.ReadInt32();
    }
    append.sprite = (num5 & 32768) != 0;
    append.additive = (num5 & 16384) != 0;
    append.resource = bs.ReadByte();
    if (version >= 6 && append.resource == 255) {
        append.resource = bs.ReadInt16();
    }
    if ((num5 & 8192) != 0) {
        append.preload_frames = bs.ReadInt16();
    } else {
        append.preload_frames = 0;
    }
    if ((num5 & 4096) != 0) {
        append.name = bs.ReadStringByInt16Head();
    }
    if ((num5 & 2048) != 0) {
        append.timescale = bs.ReadInt32() / 65536;
    } else {
        append.timescale = 1;
    }
    return append;
}


function readMoves(bs, version) {
    let change = {}
    let num7 = bs.ReadUInt16();
    let num8 = num7 & 1023;
    if (num8 == 1023) {
        num8 = bs.ReadInt32();
    }
    change.index = num8;
    let f7 = num7;
    let transform;
    if ((f7 & MoveFlags.Matrix) != 0) {
        transform = change.transform = [0, 0, 0, 0, 0, 0];
        transform[0] = bs.ReadInt32() / 65536;
        transform[2] = bs.ReadInt32() / 65536;
        transform[1] = bs.ReadInt32() / 65536;
        transform[3] = bs.ReadInt32() / 65536;
    } else if ((f7 & MoveFlags.Rotate) != 0) {
        transform = change.transform = [0, 0, 0, 0, 0, 0];
        let num9 = bs.ReadInt16() / 1000;
        let num10 = Math.sin(num9);
        let num11 = Math.cos(num9);
        if (version == 2) {
            num10 = -num10;
        }
        transform[0] = num11;
        transform[2] = -num10;
        transform[1] = num10;
        transform[3] = num11;
    } else {
        transform = change.transform = [0, 0];
    }
    if ((f7 & MoveFlags.LongCoords) != 0) {
        transform[transform.length - 2] = bs.ReadInt32() / 20;
        transform[transform.length - 1] = bs.ReadInt32() / 20;
    } else {
        transform[transform.length - 2] = bs.ReadInt16() / 20;
        transform[transform.length - 1] = bs.ReadInt16() / 20;
    }
    if ((f7 & MoveFlags.SrcRect) != 0) {
        let src_rect = change.src_rect = [];
        src_rect[0] = bs.ReadInt16() / 20;
        src_rect[1] = bs.ReadInt16() / 20;
        src_rect[2] = bs.ReadInt16() / 20;
        src_rect[3] = bs.ReadInt16() / 20;
    }
    if ((f7 & MoveFlags.Color) != 0) {
        let color = change.color = [];
        color[0] = bs.ReadByte() / 255;
        color[1] = bs.ReadByte() / 255;
        color[2] = bs.ReadByte() / 255;
        color[3] = bs.ReadByte() / 255;
        //color = (bs.ReadByte() << 16) | (bs.ReadByte() << 8) | bs.ReadByte() | (bs.ReadByte() << 24);
    }
    if ((f7 & MoveFlags.AnimFrameNum) != 0) {
        change.anim_frame_num = bs.ReadInt16();
    } else {
        change.anim_frame_num = 0;
    }
    return change;
}
