class bytebuffer {
    constructor(arr, pos) {
        this.arr = new Uint8ClampedArray(arr);
        this.pos = pos ? pos : 0;
    }

    ReadByte() {
        return this.arr[this.pos++];
    }

    ReadSByte() {

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

    ReadVarInt32(){
        let num = 0;
        let num2 = 0;
        let b;
        do {
            if (num2 == 35) {
                throw 'VarIntTooBig';
            }
            b = ReadUInt8();
            num |= (b & 0x7F) << num2;
            num2 += 7;
        }
        while ((b & 0x80) != 0);
        return num;
    }

    ReadUVarInt32() {

    }

    ReadZigZag32() {

    }

    ReadInt64() {
        if (endian == Endian.Null) endian = Endian;
        FillBuffer(8);
        if (endian == Endian.Big)
        {
            return (long)((((ulong)(uint)(m_buffer[3] | (m_buffer[2] << 8) | (m_buffer[1] << 16) | (m_buffer[0] << 24))) << 32) | ((uint)(m_buffer[7] | (m_buffer[6] << 8) | (m_buffer[5] << 16) | (m_buffer[4] << 24))));
        }
        return (long)((((ulong)(uint)(m_buffer[4] | (m_buffer[5] << 8) | (m_buffer[6] << 16) | (m_buffer[7] << 24))) << 32) | ((uint)(m_buffer[0] | (m_buffer[1] << 8) | (m_buffer[2] << 16) | (m_buffer[3] << 24))));
    }

    ReadUInt64() {

    }

    ReadVarInt64() {

    }

    ReadUVarInt64() {

    }

    ReadZigZag64() {

    }

    ReadFloat64() {

    }

    ReadFloat32() {

    }

    ReadBinary() {

    }
}