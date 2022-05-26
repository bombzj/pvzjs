const fs = require('fs')
class bytebuffer {
    constructor(arr, pos) {
        this.arr = arr;
        this.pos = pos ? pos : 0;
    }

    skip(n) {
        if (n >= 0)
            this.pos += n;
        else
            this.pos++;
    }

    position(p) {
        if (p >= 0)
            this.pos = p;

        return this.pos;
    }
    ReadByte(p) {
        if (p >= 0)
            return this.arr[p];
        else
            return this.arr[this.pos++];
    }

    gets(p) { // signed
        let res;
        if (p >= 0)
            res = this.arr[p];
        else
            res = this.arr[this.pos++];
        if (res >= 0x80)
            res -= 0x100;
        return res;
    }

    ReadUInt32() {
        return this.ReadInt32() >>> 0
    }
    ReadInt32() {
        return (this.arr[this.pos + 3] << 24) + (this.arr[this.pos + 2] << 16) + (this.arr[this.pos + 1] << 8) + this.arr[this.pos];
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

	ReadString(len) {
		if(len < 0 || len > 1000) debugger
		let ary = this.ReadBytes(count);
		// if (endian == Endian.Small) ary.reverse();
		return String.fromCharCode(...ary);
	}

	ReadBytes(count) {

	}

    getr(p) {
        return this.get(p + this.pos);
    }
    getrInt(p) {
        return this.getInt(p + this.pos);
    }
    getrShort(p) {
        return this.getShort(p + this.pos);
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

let data = fs.readFileSync('pam/banana.pam');
let obj = parsePam(data);
debugger

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
    output.position = [bs.ReadInt16(), bs.ReadInt16()]
    output.size = [bs.ReadInt16(), bs.ReadInt16()]
    let imagesCount = bs.ReadInt16();
    output.image = [];
    for (let i = 0; i < imagesCount; i++) {
        image[i] = readImage(bs, version);
    }
    let spritesCount = bs.ReadInt16();
    output.sprite = [];
    for (let i = 0; i < spritesCount; i++) {
        sprite[i] = readSprite(bs, version);
        if (version < 4) {
            sprite[i].frame_rate = frame_rate;
        }
    }
    if (version <= 3 || bs.ReadBoolean()) {
        output.main_sprite = readSprite(bs, version)
        if (version < 4) {
            main_sprite.frame_rate = frame_rate;
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
        let num7 = Math.Sin(num6);
        let num8 = Math.Cos(num6);
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
    return this;
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
            append[i] = readAdds(bs, version);
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
        frame.command = new CommandsInfo[num12];
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
    index = num5 & 2047;
    if (index == 2047) {
        append.index = bs.ReadInt32();
    }
    append.sprite = (num5 & 32768) != 0;
    append.additive = (num5 & 16384) != 0;
    append.resource = bs.ReadByte();
    if (version >= 6 && resource == 255) {
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
    if ((f7 & MoveFlags.Matrix) != 0) {
        let transform = change.transform = [0, 0, 0, 0, 0, 0];
        transform[0] = bs.ReadInt32() / 65536;
        transform[2] = bs.ReadInt32() / 65536;
        transform[1] = bs.ReadInt32() / 65536;
        transform[3] = bs.ReadInt32() / 65536;
    } else if ((f7 & MoveFlags.Rotate) != 0) {
        let transform = change.transform = [0, 0, 0, 0, 0, 0];
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
        change.transform = [0, 0];
    }
    if ((f7 & MoveFlags.LongCoords) != 0) {
        transform[3] = bs.ReadInt32() / 20;
        transform[4] = bs.ReadInt32() / 20;
    } else {
        transform[3] = bs.ReadInt16() / 20;
        transform[4] = bs.ReadInt16() / 20;
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
