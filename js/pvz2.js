PVZ2.gameStart = false
PVZ2.debug = false
var shovelPos = { x: 1060, y: 1060, width: 125, height: 125 }
var app, loader
document.addEventListener('DOMContentLoaded', () => {
    // PVZ2.setResolution(1536)
    app = new PIXI.Application({ view: myCanvas, backgroundColor: 0x0ffffff })
    jsResize()
    // document.body.appendChild(app.view)
    // PVZ2.collisionBox = true

    // app.renderer.backgroundColor = 0x0ffffff

    showLoading()
    loader = PIXI.Loader.shared
    loadPams()
    app.view.addEventListener('pointerdown', onclick)
})

window.onresize = jsResize
function jsResize() {
    let res = window.innerHeight
    let res2 = window.innerWidth * 3 / 4
    res = res <= res2 ? res : res2

    PVZ2.zoom = res / 1200
    PVZ2.screenHeight = res
    PVZ2.screenWidth = res * 4 / 3
    app.renderer.resize(PVZ2.screenWidth, PVZ2.screenHeight)
    if(stage) {
        stage.scale.set(PVZ2.zoom)
    }
}

function init() {
    // if (loadingSprite) {
    //     app.stage.removeChild(loadingSprite)
    //     loadingSprite = undefined
    // }

    randomLevel()
}

async function randomLevel() {
    let world = randomInArray(PVZ2.worlds)
    let levelName = world + rnd(1, 20)
    await loadLevel(levelName).then((level) => {
        loadingSprite.visible = false
        if (!level) {
            console.log('error loading: ' + levelName)
        }
        initLevel(level)
        PVZ2.waveManager.showDemo()
    })
}

t = 0
var speed = 2
var zombieCnt = 0

function loop() {
    if (t++ % speed == 0) {
        for (let obj of objects) {
            if (obj.ztype == 'sun') {

            } else if (obj.ztype == 'seed') {

            } else if (obj.ztype == 'plant') {

            } else if (obj.ztype == 'zombie') {

            } else if (obj.ztype == 'effect') {

            } else if (obj.ztype == 'projectile') {
            }
            obj.step()
        }
        if (!PVZ2.gameStart) return
        for (let md of PVZ2.modules) {
            md.step()
        }
    }
}

let selPlant = -1
let useShovel = false
let field = {
    x: 406, y: 312,
    w: 128, h: 150
}

function onclick(e) {
    let x = e.offsetX / PVZ2.zoom, y = e.offsetY / PVZ2.zoom
    // console.log('click: ', x, y)

    // collect sun
    for (let obj of objects) {
        if (obj.ztype == 'sun') {
            let dis = Math.sqrt((obj.x - x) ** 2 + (obj.y - y) ** 2)
            if (dis <= 50) {
                rm(obj)
                sunTotal += 25
                return
            }
        }
    }
    // plant plant
    dx = x - field.x
    dy = y - field.y
    dx2 = Math.floor(dx / field.w)
    dy2 = Math.floor(dy / field.h)
    if (dx2 >= 0 && dx2 < 9 && dy2 >= 0 && dy2 < 5) {
        if (useShovel) {
            for (let grids of Object.values(PVZ2.gridsLayer)) {
                if (grids[dy2][dx2]) {
                    rm(grids[dy2][dx2])
                    grids[dy2][dx2] = 0
                    useShovel = false
                    break
                }
            }
        } else if (selPlant != -1) {
            let seed = PVZ2.seedBank ? PVZ2.seedBank.seeds[selPlant] : PVZ2.seedConveyor.seeds[selPlant]
            let grids = PVZ2.getGrids(seed)
            if (!grids[dy2][dx2]) {
                let p = grids[dy2][dx2] = scene.plantGrid(seed.type, dx2, dy2)
                p.gridX = dx2
                p.gridY = dy2

                let cost = seed.type.prop.Cost
                sunTotal -= cost
                if (PVZ2.seedBank) {
                    seed.use()    // cooldown
                } else {
                    PVZ2.seedConveyor.use(selPlant)
                }
                selPlant = -1
            }
        }
    }

    for (let md of PVZ2.modules) {
        if (md.click(x, y)) break
    }
    // toggle shovel
    if (x <= shovelPos.x + shovelPos.width && x >= shovelPos.x && y <= shovelPos.y + shovelPos.height && y >= shovelPos.y) {
        useShovel = !useShovel
        selPlant = -1
    }
}

window.onkeydown = function (e) {
    if (e.code == 'KeyA') {
        speed = 60
    }
    if (e.code == 'KeyR') {
        speed = 2
    }
    if (e.code == 'KeyU') {
        seedChooser.pageUp()
    }
    if (e.code == 'KeyD') {
        seedChooser.pageDown()
    }
}


var plantList = []

var zombieList = []

function rnd(x, y) {
    return Math.floor(Math.random() * (y - x + 1)) + x
}
function rndObj(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
}

var loadingSprite
function showLoading() {
    loadingSprite = new PIXI.Text('Loading...', { fontFamily: 'Arial', fontSize: 56, fill: 'green', align: 'center', fontWeight: '600', strokeThickness: 3 })
    app.stage.addChild(loadingSprite)
    loadingSprite.pivot.set(loadingSprite.width / 2, loadingSprite.height / 2)
    loadingSprite.position.set(app.view.width / 2, app.view.height / 2)

    app.ticker.add(delta => {
        if (loadingSprite) {
            loadingSprite.angle += 4
        }
    })
}