const RTID0 = 'RTID(0)'
var R0x90List, R0x92List;

function ReadBinary(bs) {
    bs.ReadByte();
    let s = bs.ReadStringByVarInt32Head();
    let i = bs.ReadVarInt32();
    return '$BINARY("' + s + '", ' + i + ')'    //string.Format(Str_Binary, s, i);
}

function ReadRTID(bs) {
    let temp = bs.ReadByte();
    switch (temp) {
        case 0x00:
            return RTID0;
        case 0x01: //Not sure
            let value_1_2 = bs.ReadVarInt32();
            let value_1_1 = bs.ReadVarInt32();
            let x16_1 = bs.ReadUInt32();
            return 'RTID({0}.{1}.{2:x8}@{3})' //string.Format(Str_RTID_2, value_1_1, value_1_2, x16_1, string.Empty);
        case 0x02:
            bs.ReadVarInt32();
            let str = bs.ReadStringByVarInt32Head();
            let value_2_2 = bs.ReadVarInt32();
            let value_2_1 = bs.ReadVarInt32();
            let x16_2 = bs.ReadUInt32();
            return 'RTID({0}.{1}.{2:x8}@{3})' //string.Format(Str_RTID_2, value_2_1, value_2_2, x16_2, str);
        case 0x03:
            bs.ReadVarInt32();
            let str2 = bs.ReadStringByVarInt32Head();
            bs.ReadVarInt32();
            let str1 = bs.ReadStringByVarInt32Head();
            return 'RTID('+str1+'@'+str2+')' //string.Format(Str_RTID_3, str1, str2);
        default:
            throw "No such type in 0x83: {temp}";
    }
}

function ReadJArray(bs) {
    let ret = []
    if(bs.ReadByte() != 0xFD) debugger
    let number = bs.ReadVarInt32();
    for (let i = 0; i < number; i++) {
        ret.push(ReadValue(bs))
    }
    if(bs.ReadByte() != 0xFE) debugger
    return ret
}

function ReadValue(bs) {
    let tempstring;
    let type = bs.ReadByte();
    switch (type)
    {
        case 0x0:
            return(false);
            break;
        case 0x1:
            return(true);
            break;
        case 0x2:
            sw.WriteStringValue(NULL);
            break;
        case 0x8:
            return(bs.ReadSByte());
            break;
        case 0x9:
            return(0);
            break;
        case 0xA:
            return(bs.ReadByte());
            break;
        case 0xB:
            return(0);
            break;
        case 0x10:
            return(bs.ReadInt16());
            break;
        case 0x11:
            return(0);
            break;
        case 0x12:
            return(bs.ReadUInt16());
            break;
        case 0x13:
            return(0);
            break;
        case 0x20:
            return(bs.ReadInt32());
            break;
        case 0x21:
            return(0);
            break;
        case 0x22:
            return(bs.ReadFloat32());
            break;
        case 0x23:
            return(0);
            break;
        case 0x24:
            return(bs.ReadVarInt32());
            break;
        case 0x25:
            return(bs.ReadZigZag32());
            break;
        case 0x26:
            return(bs.ReadUInt32());
            break;
        case 0x27:
            return(0);
            break;
        case 0x28:
            return(bs.ReadUVarInt32());
            break;
        case 0x40:
            return(bs.ReadInt64());
            break;
        case 0x41:
            return(0);
            break;
        case 0x42:
            return(bs.ReadFloat64());
            break;
        case 0x43:
            return(0);
            break;
        case 0x44:
            return(bs.ReadVarInt64());
            break;
        case 0x45:
            return(bs.ReadZigZag64());
            break;
        case 0x46:
            return(bs.ReadUInt64());
            break;
        case 0x47:
            return(0);
            break;
        case 0x48:
            return(bs.ReadUVarInt64());
            break;
        case 0x81:
            return(bs.ReadBytes(bs.ReadVarInt32()));
            break;
        case 0x82:
            bs.ReadVarInt32();
            return(bs.ReadBytes(bs.ReadVarInt32()));
            break;
        case 0x83:
            return(ReadRTID(bs));
            break;
        case 0x84:
            return(RTID0);
            break;
        case 0x85:
            return(ReadJObject(bs));
            break;
        case 0x86:
            return(ReadJArray(bs));
            break;
        case 0x87:
            return(ReadBinary(bs));
            break;
        case 0x90:
            tempstring = String.fromCharCode(...bs.ReadBytes(bs.ReadVarInt32()));
            R0x90List.push(tempstring);
            return(tempstring);
            break;
        case 0x91:
            return(R0x90List[bs.ReadVarInt32()]);
            break;
        case 0x92:
            bs.ReadVarInt32();
            tempstring = String.fromCharCode(...bs.ReadBytes(bs.ReadVarInt32()));
            R0x92List.push(tempstring);
            return(tempstring);
            break;
        case 0x93:
            return(R0x92List[bs.ReadVarInt32()]);
            break;
        case 0xB0:
        case 0xB1:
        case 0xB2:
        case 0xB3:
        case 0xB4:
        case 0xB5:
        case 0xB6:
        case 0xB7:
        case 0xB8:
        //about object
        case 0xB9:
        //about array
        case 0xBA:
        //about string
        case 0xBB:
            //about binary
            throw "0xb0-0xbb is not supported!";
        case 0xBC:
            return(bs.ReadByte() != 0);
            break;
        default:
            debugger
    }
}

function ReadJObject(bs) {
    let ret = {}
    let tempstring;
    while (true)
    {
        //key
        let key
        let type = bs.ReadByte();
        if (type == 0xFF) {
            break;
        }
        switch (type) {
            case 0x2:
                key = NULL;
                break;
            case 0x81:
                key = (bs.ReadBytes(bs.ReadVarInt32()));
                break;
            case 0x82:
                bs.ReadVarInt32();
                key = (bs.ReadBytes(bs.ReadVarInt32()));
                break;
            case 0x83:
                key = (ReadRTID(bs));
                break;
            case 0x84:
                key = (RTID0);
                break;
            case 0x87:
                key = (ReadBinary(bs));
                break;
            case 0x90:
                tempstring = String.fromCharCode(...bs.ReadBytes(bs.ReadVarInt32()));
                R0x90List.push(tempstring);
                key = (tempstring);
                break;
            case 0x91:
                key = (R0x90List[bs.ReadVarInt32()]);
                break;
            case 0x92:
                bs.ReadVarInt32();
                tempstring = String.fromCharCode(...bs.ReadBytes(bs.ReadVarInt32()));
                R0x92List.push(tempstring);
                key = (tempstring);
                break;
            case 0x93:
                key = (R0x92List[bs.ReadVarInt32()]);
                break;
            default:
                debugger
        }
        //value
        let value = ReadValue(bs);
        if(!key.startsWith('#')) {
            ret[key] = value;
        }
    }
    return ret
}

function parseRton(data) {
    R0x90List = R0x92List = []
    let bs = new bytebuffer(data);
    if(bs.ReadString(4) != 'RTON') debugger
    if(bs.ReadInt32() != 0x1) debugger
    let ret = ReadJObject(bs);
    if(bs.ReadString(4) != 'DONE') debugger
    return ret
}

// let path = 'pvz/pkg/'
// let dir = fs.readdirSync(path, {withFileTypes: true});
// dir.forEach(file => {
//     if(!file.isFile()) return
//     let d = fs.readFileSync(path + file.name)
//     let data = parseRton(d)  // incorrect, d should be ArrayBuffer, not nodejs.Buffer
//     console.log(1)
// })







