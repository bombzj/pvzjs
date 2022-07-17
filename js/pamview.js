const loader = PIXI.Loader.shared;
var groupNames = ['PlantChomper', 'PlantPeashooter', 'SodRollGroup', 'ZombieEgyptBasicGroup']
var atlas = 0
var atlasSprite
var textureId
var fileMapAtlas = {}
var atlasMap = {}
var atlasData
var scene = new PIXI.Container()
var spr, pam, sprName
var highlightFilter
var center
var app
var loadingSprite

function jsInit() {
    app = new PIXI.Application({ view: myCanvas })
    // canvasParent.appendChild(app.view)
    jsResize()

    app.renderer.backgroundColor = 0x0FFFFFF

    PVZ2.resolution = 1536
    need2LoadGroup = []
    loadPams()

    loadingSprite = new PIXI.Text('Loading...', { fontFamily: 'Arial', fontSize: 50, fill: 'green', align: 'center', fontWeight: '400', strokeThickness: 3 })
    app.stage.addChild(loadingSprite)
    loadingSprite.pivot.set(loadingSprite.width / 2, loadingSprite.height / 2)
    loadingSprite.position.set(app.view.width / 2, app.view.height / 2)        
    app.ticker.add(delta => {
        if(loadingSprite) {
            loadingSprite.angle += 3
        }
    })

    for(let world of PVZ2.worlds) {
        let li = document.createElement('li')
        let a = document.createElement('a')
        a.classList.add('dropdown-item')
        a.innerText = capitalizeFirstLetter(world) + ' World'
        a.href = "#"
        a.addEventListener("click", (e) => {
            searchGroupPreset(world, e.target)
            e.preventDefault()
        })
        presetSearch.appendChild(li)
        li.appendChild(a)
    }

    window.onkeydown = pamKeydown
    // app.view.onclick = onclick
    window.onresize = jsResize
    app.view.onpointerdown = onPointerDown
    app.view.onpointermove = onPointerMove
    app.view.onpointerup = onPointerUp
    app.view.ontouchstart = onTouchStart
}

function jsResize() {
    let canvasWidth = canvasParent.clientWidth
    let canvasHeight = canvasWidth < 400 ? canvasWidth : 400
    app.view.width = canvasWidth
    app.view.height = canvasHeight
    canvasParent.style.height = canvasHeight + 'px'
    if(spr) {
        adjustPosition()
    }
}


function init() {
    highlightFilter = new PIXI.filters.ColorMatrixFilter()
    highlightFilter.negative()
    // atlas = atlasMap.ATLASIMAGE_ATLAS_UI_SEEDPACKETS_768_00
    for (let group of rtons.RESOURCES.groups) {
        if (group.type == 'composite') continue
        if (group.res != PVZ2.resolution) continue

        let sub = resourcesMap[group.parent]
        for (let res of group.resources) {
            if (res.type == 'Image') {
                if (res.atlas) {
                    fileMapAtlas[res.path[1].toUpperCase()] = atlasMap[res.id] = { baseTextureName: res.id, children: [], group: group.parent }
                } else {
                    let parent = atlasMap[res.parent]
                    parent.children.push(res.id)
                }
            }
        }
    }

    loadingSpan.style.display = 'none'
    loadingSprite.visible = false
    showGroupList()
    center = new PIXI.Graphics()
    center.lineStyle(2, 0xFF0000, 1)
    const lineLength = 20
    center.moveTo(-lineLength, 0)
    center.lineTo(lineLength, 0)
    center.moveTo(0, -lineLength)
    center.lineTo(0, lineLength)
    center.zIndex = 10
    center.visible = false
    app.stage.addChild(center)
}


function drawAtlas(name) {
    atlasData = fileMapAtlas[name]
    atlasSprite.texture = atlasTexturesMap[atlasData.baseTextureName]
}

function drawAtlasByIndex() {
    atlasData = fileMapAtlas[atlasNames[atlas] + '_' + PVZ2.resolution + '_00']
    atlasSprite.texture = atlasTexturesMap[atlasData.baseTextureName]
}

var cnt = 0
var speed = 2
function loop() {
    if (stepMode) return
    if (++cnt < speed) return
    cnt = 0

    step()
}

function step() {
    if (spr) {
        spr.step()
        showInfo()
    }
}

function showInfo() {
    let frame = spr.sprite.frame[spr.frame]
    for (let command of frame.command) {
        // console.log(command.command + '(' + command.parameter + ')')
    }

    if (stepMode) {
        removeButtons(tableListPart)
        // let row = tableListPart.insertRow()
        // row.insertCell().innerText = spr.frame
        // row.insertCell().innerText = 'anim-' + sprName
        // addButton('anim-' + sprName, tableListPart, (e) => {
        //     e.preventDefault()
        // })
        listParts(spr.parts)
    }
}

function listParts(parts, tab = 0) {
    for (let index in parts) {
        let part = parts[index]
        if (part.data.frame) {   // is sprite, not image
            // let row = tableListPart.insertRow()
            // let cell = row.insertCell()
            // var o=document.createElement("input"); 
            // o.type = "button" ; 
            // o.value = name;
            // o.addEventListener("click", callback);   
            // cell.appendChild(o);

            // row.insertCell().innerText = ">".repeat(tab) + index
            // let cell = row.insertCell()
            // cell.innerText = part.data.name
            // cell.addEventListener('click', () => {
            //     highlightPart(part)
            // })
            // row.insertCell().innerText = part.renderable
            let btn = addButton("-".repeat(tab) + part.data.name, tableListPart, (e) => {
                highlightPart(part)
                e.preventDefault()
            })
            
            btn.classList.add('d-flex', 'flex-items-center')
            if(part.renderable) {
                let label = document.createElement('span')
                label.innerText = 'v'
                label.classList.add('Label')
                btn.appendChild(label)
            }
            let label = document.createElement('span')
            label.innerText = index
            label.classList.add('Label')
            btn.appendChild(label)

            if (part.parts) {
                listParts(part.parts, tab + 1)
            }
        }
    }
}

function highlightPart(part) {
    if (part.filters) {
        delete part.filters
    } else {
        part.filters = [highlightFilter]
        // console.log(part)
    }
}

function onclick(e) {
    let x = e.offsetX, y = e.offsetY
    // console.log('click: ', x, y)

    // for(let child of atlasData.children) {
    //     let texture = texturesMap[child]
    //     let rect = texture.orig
    //     if(y >= rect.top && y < rect.bottom && x >= rect.left && x < rect.right) {
    //         console.log(child, atlasData.group)
    //     }
    // }
}

const evCache = []
var beginDiff = -1
var beginScale
var beginPos
function onPointerDown(e) {
    // console.log(e)
    evCache.push(e)
    if(!e.target.hasPointerCapture(e.pointerId)) {
        e.target.setPointerCapture(e.pointerId)
    }
    if(!spr) return
    if(evCache.length == 2) {
        beginDiff = Math.sqrt((evCache[1].clientX-evCache[0].clientX)**2 + (evCache[1].clientY-evCache[0].clientY)**2)
        beginScale = spr.scale.x
    }
    if(!beginPos) {
        beginPos = {
            x: spr.x - e.clientX,
            y: spr.y - e.clientY,
            pointerId: e.pointerId,
            scale: 1
        }
    }
}
function onPointerMove(e) {
    // console.log(e)
    for (let i = 0; i < evCache.length; i++) {
        if (e.pointerId == evCache[i].pointerId) {
            evCache[i] = e;
            break;
        }
    } 
    if(!spr) return
    if (evCache.length == 2) {
        // Calculate the distance between the two pointers
        const curDiff = Math.sqrt((evCache[1].clientX-evCache[0].clientX)**2 + (evCache[1].clientY-evCache[0].clientY)**2)
        beginPos.scale = curDiff / beginDiff
        spr.scale.set(beginScale * beginPos.scale)
        spr.x = evCache[0].clientX + beginPos.x * beginPos.scale
        spr.y = evCache[0].clientY + beginPos.y * beginPos.scale
    } else {
        if(beginPos && e.pointerId == beginPos.pointerId) {
            spr.x = e.clientX + beginPos.x * beginPos.scale
            spr.y = e.clientY + beginPos.y * beginPos.scale
        }
    }
}
function onPointerUp(e) {
    // console.log(e)
    e.target.releasePointerCapture(e.pointerId)
    for (let i = 0; i < evCache.length; i++) {
        if (evCache[i].pointerId == e.pointerId) {
            evCache.splice(i, 1)
            break
        }
    }
    if(!spr) return
    // Remove this event from the target's cache
    if(beginPos && e.pointerId == beginPos.pointerId) {
        beginPos = undefined
    }
    if (evCache.length < 2) {
        prevDiff = -1
        beginScale = -1
    }
}
function onTouchStart(e) {
    if(e.touches.length != evCache.length) {
        // something is wrong
        beginPos = undefined
        beginScale = undefined
        while(evCache.length > 0) {
            evCache.pop()
        }
    }
}


const moveSpeed = 50
function pamKeydown(e) {
    // console.log('key: ' + e.code)
    if (!spr) return
    if (e.code == 'KeyS') {
        if (stepMode) {
            step()
        }
    }
    if (e.code == 'ArrowUp') {
        spr.y -= moveSpeed
        e.preventDefault()
    }
    if (e.code == 'ArrowDown') {
        spr.y += moveSpeed
        e.preventDefault()
    }
    if (e.code == 'ArrowLeft') {
        spr.x -= moveSpeed
        e.preventDefault()
    }
    if (e.code == 'ArrowRight') {
        spr.x += moveSpeed
        e.preventDefault()
    }
    if (e.code == 'Minus') {
        spr.scale.set(spr.scale.x / 2)
        e.preventDefault()
    }
    if (e.code == 'Equal') {
        spr.scale.set(spr.scale.x * 2)
        e.preventDefault()
    }
    // if(e.code == 'KeyD'){
    //     if(atlas < atlasNames.length - 1) atlas++
    //     drawAtlasByIndex()
    // }
    coord.innerText = Math.floor(spr.x) + ',' + Math.floor(spr.y) + ',' + Math.floor(spr.scale.x * 100) + '%'
}

function searchGroup(name) {
    if(name.length < 2) return
    name = name.toUpperCase()
    groupNames = []
    for (let groupName in resourcesMap) {
        if (groupName.toUpperCase().indexOf(name) != -1) {
            groupNames.push(groupName)
        }
    }
    showGroupList()
}

function searchGroupPreset(name, target) {
    target.parentElement.parentElement.parentElement.removeAttribute('open')
    pamName.value = name
    searchGroup(name)
}

function removeButtons(parent) {
    while (parent.lastElementChild) {
        parent.removeChild(parent.lastElementChild);
    }
}

function addButton(name, parent, callback) {
    var o = document.createElement('a')
    o.innerText = name
    if(callback) {
        o.href = '#'
        o.addEventListener('click', callback)
    }
    o.classList.add('menu-item')
    parent.appendChild(o)
    return o
}
function addText(name, parent) {
    let cell = parent.insertRow().insertCell()
    cell.innerText = name
}

var selectedGroupIndex
function showGroupList() {
    removeButtons(choosePam)
    navPam.style.display = 'none'
    removeButtons(chooseSprite)
    navSprite.style.display = 'none'
    removeButtons(tableListPart)
    navPart.style.display = 'none'
    removeButtons(chooseGroup)
    selectedGroupIndex = -1
    for (let [index, groupName] of groupNames.entries()) {
        let len = resourcesMap[groupName].pams.length
        // if(len == 0) continue
        let name = groupName
        if (len > 1) {
            name = name + ' (' + len + ')'
        }
        addButton(name, chooseGroup, (e) => {
            showPamList(groupName)
            if(selectedGroupIndex != -1) {
                chooseGroup.children[selectedGroupIndex].removeAttribute('aria-current')
            }
            chooseGroup.children[index].setAttribute('aria-current', 'page')
            selectedGroupIndex = index
            toPam()
            e.preventDefault()
        })
    }
    toGroup()
}

var selectedPamIndex
function showPamList(groupName) {
    removeButtons(chooseSprite)
    removeButtons(tableListPart)
    let group = resourcesMap[groupName]
    selectedPamIndex = -1
    removeButtons(choosePam)
    navPam.style.display = ''
    for (let [index, pam] of group.pams.entries()) {
        addButton(pam.name, choosePam, (e) => {
            changePam(groupName, pam.name)
            if(selectedPamIndex != -1) {
                choosePam.children[selectedPamIndex].removeAttribute('aria-current')
            }
            choosePam.children[index].setAttribute('aria-current', 'page')
            selectedPamIndex = index
            toSprite()
            e.preventDefault()
        })
    }
    for (let atlas of group.atlases) {
        let name = atlas.name.replace('ATLASIMAGE_ATLAS_', '').replace('_768_00', '')
        addButton('atlas: ' + name, choosePam)
        // addText(atlas.name, choosePam)
    }
}

var selectedSpriteIndex
function changePam(groupName, name) {
    btnStep.disabled = false
    if(spr) {
        app.stage.removeChild(spr)
        spr = undefined
    }

    if (!resourcesMap[groupName].loaded) {
        loader.reset()
        loadGroupPre(groupName)
        loadingSprite.visible = true
        loader.load((loader, resources) => {
            loadGroupPost(groupName, resources)
            loadingSprite.visible = false
            changePam(groupName, name)
        })
        return
    }

    pam = pams[name]
    checkPam(pam)
    spr = new PamSprite(pam)
    app.stage.addChild(spr)
    adjustPosition()
    app.stage.sortChildren()

    removeButtons(chooseSprite)
    navSprite.style.display = ''
    if(stepMode) {
        navPart.style.display = ''
        showInfo()
    }
    let index = 0
    for (let frame in pam.actionFrame) {
        let frameIndex = pam.actionFrame[frame]
        const index2 = index
        addButton('main-' + frame, chooseSprite, (e) => {
            sprName = frame
            spr.changeSprite(undefined, frameIndex)
            adjustPosition()
            showInfo()
            if(selectedSpriteIndex != -1) {
                chooseSprite.children[selectedSpriteIndex].removeAttribute('aria-current')
            }
            chooseSprite.children[index2].setAttribute('aria-current', 'page')
            selectedSpriteIndex = index2
            e.preventDefault()
        })
        index++
    }
    for (let sprite of pam.sprite) {
        let name = sprite.name
        if (sprite.frame.length > 1) {
            name = name + ' (' + sprite.frame.length + ')'
        }
        const index2 = index
        addButton(name, chooseSprite, (e) => {
            sprName = 'default'
            spr.changeSprite(sprite)
            adjustPosition()
            showInfo()
            if(selectedSpriteIndex != -1) {
                chooseSprite.children[selectedSpriteIndex].removeAttribute('aria-current')
            }
            chooseSprite.children[index2].setAttribute('aria-current', 'page')
            selectedSpriteIndex = index2
            e.preventDefault()
        })
        index++
    }
    selectedSpriteIndex = -1
    if(chooseSprite.children.length > 0) {
        selectedSpriteIndex = 0
        chooseSprite.children[0].setAttribute('aria-current', 'page')
    }
}

function adjustPosition() {
    if(!spr) return
    let rect = spr.getLocalBounds()
    let rectCenterX = rect.x + rect.width / 2
    let rectCenterY = rect.y + rect.height / 2
    let ratio = rect.width / app.view.width
    let ratio2 = rect.height / app.view.height
    if(ratio < ratio2) {
        ratio = ratio2
    }
    if(ratio > 0.9) {
        ratio = 0.9 / ratio
        spr.scale.set(ratio)
        spr.position.set(app.view.width / 2 - rectCenterX * ratio, app.view.height / 2 - rectCenterY * ratio)
    } else {
        spr.scale.set(1)
        spr.position.set(app.view.width / 2 - rectCenterX, app.view.height / 2 - rectCenterY)    
    }
    
    center.position.set(spr.x + pam.size[0] / 2 * spr.scale.x, spr.y + pam.size[1] / 2 * spr.scale.y)
}

function toGroup() {
    chooseGroup.style.display = ''
    choosePam.style.display = 'none'
    chooseSprite.style.display = 'none'
    tableListPart.style.display = 'none'
    modeNav.children[0].setAttribute('aria-current', 'page')
    modeNav.children[1].removeAttribute('aria-current')
    modeNav.children[2].removeAttribute('aria-current')
    modeNav.children[3].removeAttribute('aria-current')
}
function toPam() {
    chooseGroup.style.display = 'none'
    choosePam.style.display = ''
    chooseSprite.style.display = 'none'
    tableListPart.style.display = 'none'
    modeNav.children[0].removeAttribute('aria-current')
    modeNav.children[1].setAttribute('aria-current', 'page')
    modeNav.children[2].removeAttribute('aria-current')
    modeNav.children[3].removeAttribute('aria-current')
}
function toSprite() {
    chooseGroup.style.display = 'none'
    choosePam.style.display = 'none'
    chooseSprite.style.display = ''
    tableListPart.style.display = 'none'
    modeNav.children[0].removeAttribute('aria-current')
    modeNav.children[1].removeAttribute('aria-current')
    modeNav.children[2].setAttribute('aria-current', 'page')
    modeNav.children[3].removeAttribute('aria-current')
}
function toPart() {
    chooseGroup.style.display = 'none'
    choosePam.style.display = 'none'
    chooseSprite.style.display = 'none'
    tableListPart.style.display = ''
    modeNav.children[0].removeAttribute('aria-current')
    modeNav.children[1].removeAttribute('aria-current')
    modeNav.children[2].removeAttribute('aria-current')
    modeNav.children[3].setAttribute('aria-current', 'page')
}

function checkPam(pam) {
    let ms = pam.main_sprite
    let parts = {}
    let oldparts = {}
    for (let frame of ms.frame) {
        for (let remove of frame.remove) {
            // if(!parts[remove.index]) debugger
            delete parts[remove.index]
        }
        for (let append of frame.append) {
            // if(parts[append.index]) debugger
            if (oldparts[append.index]) {
                if (oldparts[append.index].resource != append.resource || oldparts[append.index].sprite != append.sprite) debugger
            }
            parts[append.index] = append
            oldparts[append.index] = append
        }
        for (let change of frame.change) {
            // if(!parts[change.index]) debugger
        }
    }
}

var stepMode = false
function goStep() {
    if(!stepMode) {
        navPart.style.display = ''
        toPart()
        btnPlay.disabled = false
    }
    stepMode = true
    step()
}
function goPlay() {
    btnPlay.disabled = true
    stepMode = false
    toSprite()
    removeButtons(tableListPart)
    navPart.style.display = 'none'
}
function goCenter() {
    adjustPosition()
    center.visible = !center.visible
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

var plantList = [
]

var zombieList = [
]
