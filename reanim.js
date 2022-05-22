class Reanim extends PIXI.Container {
    constructor(acts, ref, refname) {
        super()
        this.ref = ref
        this.refname = refname
        this.actionList = acts.actionList
        this.data = acts
        this.frame = 0
        this.parts = {}
        this.offsetX = this.offsetY = 0

        let list = this.actionList[this.frame]
        for(let actname in list) {
            let act = list[actname]
            if(!act.i) continue
            if(!loader.resources[act.i]) debugger
            let texture = loader.resources[act.i].texture
            let a = new PIXI.Sprite(texture)
            a.position.set(act.x, act.y)
            // a.pivot.set(-act.x + texture.width, -act.y + texture.height)
            // a.pivot.set(0, 0)
            a.scale.set(act.sx, act.sy)
            a.skew.set(-act.ky, act.kx)
            if(act.a) {
                a.alpha = act.a
            }
            this.parts[actname] = a
            this.addChild(a)
        }
    }

    step() {
        this.frame++
        if(this.frame >= this.actionList.length) {
            this.frame = 0
        }
        let list = this.actionList[this.frame]
        for(let actname in list) {
            let act = list[actname]
            if(!act.i) continue
            if(!this.parts[actname]) {
                let a = new PIXI.Sprite(loader.resources[act.i].texture)
                this.addChild(a)
                this.parts[actname] = a
            }
        }
        for(let actname in this.parts) {
            let part = this.parts[actname]
            let act = list[actname]
            if(act) {
                part.alpha =  1
                part.texture = loader.resources[act.i].texture
                if(this.ref) {
                    let refpos = this.ref.getref(this.refname)
                    part.position.set(act.x + refpos.x, act.y + refpos.y)
                } else {
                    part.position.set(act.x, act.y)
                }
                part.scale.set(act.sx, act.sy)
                part.skew.set(-act.ky, act.kx)
                part.alpha = act.a == undefined ? 1 : act.a
                if(act.i.indexOf('duck') != -1// || act.i.indexOf('cone') != -1
                 || act.i.indexOf('bucket') != -1
                 || act.i.indexOf('zombie_screendoor1') != -1
                 || act.i.indexOf('zombie_outerarm_screendoor') != -1
                 || act.i.indexOf('zombie_innerarm_screendoor_hand') != -1
                 || act.i.indexOf('zombie_innerarm_screendoor') != -1
                 || act.i.indexOf('mustache') != -1
                 || act.i.indexOf('_tie') != -1
                 || act.i.indexOf('flag') != -1) {
                    part.alpha = 0
                }
            } else {
                part.alpha =  0
            }
        }
    }

    getref(name) {
        let now = this.actionList[this.frame][name]
        let start = this.actionList[0][name]
        if(!now || !start) debugger
        return {
            x: now.x - start.x,
            y: now.y - start.y,
        }
    }
}