const CFG = {
    field_size: 5000, // cells in a row
    bg_color: "black",
    cell_color: "green",
    fps: 10,

    controls: {
        right: 70,
        bottom: 50,

        button: {
            text: {
                onstart: "LAUNCH",
                onpause: "CONTINUE",
                onresume: "PAUSE",
            },
            padding: "10px",
            fontsize: "14pt",
            border: "none",
            color: "blue",
            textcolor: "white"
        },
    },
}

const fsize = CFG.field_size

const cell_count = fsize * fsize
var cell_size;

const canvas = document.createElement("canvas")
const ctx = canvas.getContext("2d")

canvas.style.position = "absolute"
canvas.style.top = 0
canvas.style.left = 0

document.body.innerHTML = ""
document.body.appendChild(canvas)

var canvas_window_resizer = () => {
    let w = window.innerWidth
    let h = window.innerHeight
    let sz = w < h ? w : h
    canvas.width = w
    canvas.height = h
    cell_size = Math.floor(sz / fsize)
}

canvas_window_resizer();
window.addEventListener("resize",canvas_window_resizer);
ctx.fillStyle = CFG.bg_color
ctx.fillRect(0,0,canvas.width,canvas.height)

const pixels2idx = (x,y,csize) => Math.floor(x / csize)  + fsize * Math.floor(y / csize)
const coord2idx = (x,y) => pixels2idx(x,y,1)

var onclick_listener = ev => {
    let x = ev.clientX
    let y = ev.clientY
    let idx = pixels2idx(x,y,cell_size)
    cellz[idx] = 1
    draw()
    console.log('x: ',x,'y: ',y,'idx: ',idx,'added.')
}

window.addEventListener("click",onclick_listener)

var controls = document.createElement("div")
var cst = controls.style
cst.position = "absolute"
cst.right = CFG.controls.right
cst.bottom = CFG.controls.bottom
document.body.appendChild(controls)

var bt = document.createElement("button")
var cb = CFG.controls.button
bt.innerHTML = cb.text.onstart
bt.style.position = "absolute"
bt.style.right = 0
bt.style.bottom = 0
bt.style.border = cb.border
bt.style.padding = cb.padding
bt.style.fontSize = cb.fontsize
bt.style.backgroundColor = cb.color
bt.style.color = cb.textcolor
controls.appendChild(bt)

var no_focus = ev => ev.target.blur()
var bt_listener = ev => {
    ev.stopPropagation()
    ev.target.innerHTML = evloop() === false ? cb.text.onpause : cb.text.onresume
}
bt.addEventListener("click",bt_listener)
bt.addEventListener("focus",no_focus)

const infps = document.createElement("input")
var ist = infps.style
ist.position = "absolute"
ist.right = 0
ist.bottom = bt.clientHeight + 5
ist.width = 40
infps.addEventListener("click",ev => ev.stopPropagation())
controls.appendChild(infps)
infps.value = CFG.fps

var btfps = document.createElement("button")
btfps.innerHTML = "FPS: "
var fs = btfps.style
fs.position = "absolute"
fs.bottom = ist.bottom
fs.right = infps.clientWidth + 10

var btfps_listener = ev => {
    ev.stopPropagation()
    CFG.fps = infps.value || CFG.fps
    evloop(1000/CFG.fps)
}
btfps.addEventListener("focus",no_focus)
controls.appendChild(btfps)


var cellz = new Array(cell_count).fill(0)
var cellz_mirror = new Array(cell_count).fill(0)

const setalive = (x,y) => y == undefined ? cellz[x] = 1 : cellz[coord2idx(x,y)] = 1

const draw = () => {
    ctx.fillStyle = CFG.bg_color
    ctx.fillRect(0,0,canvas.width,canvas.height)
    ctx.fillStyle = CFG.cell_color
    cellz.forEach((c,idx) => c ? draw_cell(idx) : false)
}

const update = () => {
    let refcount = Object.create(null)
    let addcount = idx => {
        let rc = refcount[idx]
        refcount[idx] = rc == undefined ? 1 : rc + 1
    }
    cellz.forEach((c,idx) => {
        if(!c) return;
        addcount(idx)
        addcount(idx - 1)
        addcount(idx + 1)
        addcount(idx - fsize - 1)
        addcount(idx - fsize)
        addcount(idx - fsize + 1)
        addcount(idx + fsize - 1)
        addcount(idx + fsize)
        addcount(idx + fsize + 1)
    })
    for (let c in refcount) {
        let state = cellz[c]
        if (state == undefined) continue
        let adj = refcount[c] - state
        cellz_mirror[c] = adj == 3 ? 1 : adj == 2 ? state : 0
    }
    let buble = cellz
    cellz = cellz_mirror
    cellz_mirror = buble
    cellz_mirror.fill(0)
}

const tick = () => {
    draw()
    update()
}

const draw_cell = cell =>
    ctx.fillRect(
        cell_size * (cell % fsize),
        cell_size * Math.floor(cell / fsize),
        cell_size,cell_size
    )

const eventloop = (fx,timeout) => {
    let flag = false
    let time_prev = performance.now()
    let lo_op = time_now => {
        if (flag) requestAnimationFrame(lo_op)
        let elapsed = time_now - time_prev
        if(timeout > elapsed) return;
        time_prev = time_now
        fx(time_now)
    }
    return new_timeout =>
        new_timeout != undefined ? timeout = new_timeout :
        flag ? flag = false :
        (flag = true) && lo_op(performance.now())
}

const evloop = eventloop(tick,1000/CFG.fps)
