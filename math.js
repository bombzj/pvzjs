let n = 0
let n2 = []
for(let i = 1;i <= 25;i++) {
    for(let i2 = i+1;i2 <= 25;i2++) {
        for(let i3 = i2+1;i3 <= 25;i3++) {
            for(let i4 = i3+1;i4 <= 25;i4++) {
                for(let i5 = i4+1;i5 <= 25;i5++) {
                    if(i+i2+i3+i4+i5 == 65) {
                        n++
                        let bin = (1 << (i-1)) | (1 << (i2-1)) | (1 << (i3-1)) | (1 << (i4-1)) | (1 << (i5-1))
                        n2.push(bin)
                    }
                }
            }
        }
    }
}
let nres = 0
let res = []
for(let i = 0;i < n2.length;i++) {
    let ii = n2[i]
    for(let i2 = i+1;i2 < n2.length;i2++) {
        let ii2 = n2[i2]
        if((ii & ii2) != 0) continue
        let iii2 = ii | ii2
        for(let i3 = i2+1;i3 < n2.length;i3++) {
            let ii3 = n2[i3]
            if((iii2 & ii3) != 0) continue
            let iii3 = iii2 | ii3
            for(let i4 = i3+1;i4 < n2.length;i4++) {
                let ii4 = n2[i4]
                if((iii3 & ii4) != 0) continue
                let iii4 = iii3 | ii4
                for(let i5 = i4+1;i5 < n2.length;i5++) {
                    let ii5 = n2[i5]
                    if((iii4 | ii5) == 0x1ffffff) {
                        // res.push([ii, ii2, ii3, ii4, ii5])
                        nres++
                        if(nres % 1000 == 0) console.log(nres)
                    }
                }
            }
        }
    }
    
}




console.log(res.length)
