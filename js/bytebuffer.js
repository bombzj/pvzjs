class bytebuffer {
    constructor(arr, pos) {
        this.dataview = new DataView(arr)
        this.arr = new Uint8ClampedArray(arr);
        this.pos = pos ? pos : 0;
    }

    ReadByte() {
        return this.arr[this.pos++];
    }

    ReadSByte() {
        let res = this.ReadByte()
        return res > 127 ? res - 256 : res;
    }

    ReadUInt8() {
        return this.ReadByte()
    }

    ReadUInt32() {
        let res = this.dataview.getUint32(this.pos, true)
        this.pos += 4
        return res
    }
    ReadInt32() {
        let res = this.dataview.getInt32(this.pos, true)
        this.pos += 4
        return res
    }

    ReadInt16() {
        let res = this.dataview.getInt16(this.pos, true)
        this.pos += 2
        return res
    }

    ReadUInt16() {
        let res = this.dataview.getUint16(this.pos, true)
        this.pos += 2
        return res
    }

	ReadStringByInt16Head() {
		return this.ReadString(this.ReadInt16());
	}

    ReadStringByVarInt32Head() {
        return this.ReadString(this.ReadVarInt32())
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

    ReadVarInt32(){
        let num = 0;
        let num2 = 0;
        let b;
        do {
            if (num2 == 35) {
                throw 'VarIntTooBig';
            }
            b = this.ReadUInt8();
            num |= (b & 0x7F) << num2;
            num2 += 7;
        }
        while ((b & 0x80) != 0);
        return num;
    }

    ReadUVarInt32() {
        return this.ReadVarInt32() >>> 0;
    }

    ReadZigZag32() {
        let n = this.ReadVarInt32();
        return ((n << 31) >> 31) ^ (n >> 1)
    }

    ReadInt64() {
        let res = this.dataview.getBigInt64(this.pos, true)
        this.pos += 8
        return res
    }

    ReadUInt64() {
        let res = this.dataview.getBigUint64(this.pos, true)
        this.pos += 8
        return res
    }

    ReadVarInt64() {
        let num = 0;
        let num2 = 0;
        let b;
        do {
            if (num2 == 70) {
                throw "VarIntTooBig";
            }
            b = ReadUInt8();
            num |= ((b & 0x7F)) << num2;
            num2 += 7;
        }
        while ((b & 0x80) != 0);
        return num;
    }

    ReadUVarInt64() {
        let res = ReadVarInt64();
        return res < 0 ? res + 4294967296n : res
    }

    ReadZigZag64() {
        let n = ReadVarInt64();
        return (n >> 1n) ^ (-(n & 1n));
    }

    ReadFloat64() {
        let res = this.dataview.getFloat64(this.pos, true)
        this.pos += 8
        return res
    }

    ReadFloat32() {
        let res = this.dataview.getFloat32(this.pos, true)
        this.pos += 4
        return res
    }
}