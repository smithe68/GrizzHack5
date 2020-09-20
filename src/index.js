"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jquery_1 = __importDefault(require("jquery"));
class Chunk {
    constructor(newPos) {
        this.pos = newPos;
        this.buffer = new ImageData(CHUNK_SIZE, CHUNK_SIZE);
        for (let i = 0; i < this.buffer.data.length; i++)
            this.buffer.data[i] = 255;
    }
    render(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            const frame = yield createImageBitmap(this.buffer);
            ctx.drawImage(frame, this.pos.x * CHUNK_SIZE - camera.x, this.pos.y * CHUNK_SIZE - camera.y);
        });
    }
    draw(x, y, color) {
        if (x >= 0 && x < this.buffer.width && y >= 0 && this.buffer.height) {
            let xFloor = Math.floor(x);
            let yFloor = Math.floor(y);
            let pos = (yFloor * this.buffer.width + xFloor) * 4;
            this.buffer.data[pos] = color.r;
            this.buffer.data[pos + 1] = color.g;
            this.buffer.data[pos + 2] = color.b;
            this.buffer.data[pos + 3] = color.a;
        }
    }
}
// Variable declerations ------------------------------------------------
const CHUNK_SIZE = 64;
const CANVAS_SCALE = 8;
const MAP_SIZE = 16;
let isMouseDown = false;
let mousePos = { x: 0, y: 0 };
let brushPos = { x: 0, y: 0 };
let camera = { x: 0, y: 0 };
let cameraTarget = { x: 0, y: 0 };
let lastClicked = { x: 0, y: 0 };
let currentTool = 1;
let chunks = [];
// Function declerations -----------------------------------
function selectTool(tool) {
    const $buttons = jquery_1.default("#tools button");
    $buttons.each((i, el) => el.classList.remove("selected"));
    $buttons[tool].classList.add("selected");
    currentTool = tool;
}
function resizeCanvas(ctx) {
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;
    // Scale canvas to make it easier to see
    ctx.scale(CANVAS_SCALE, CANVAS_SCALE);
    // I want to see the pixels
    ctx.imageSmoothingEnabled = false;
}
function pick(ctx) {
    let chunk = getChunk(mousePos.x, mousePos.y);
    let posX = (mousePos.x - chunk.pos.x * CHUNK_SIZE * CANVAS_SCALE) /
        CANVAS_SCALE;
    let posY = (mousePos.y - chunk.pos.y * CHUNK_SIZE * CANVAS_SCALE) /
        CANVAS_SCALE;
    let xFloor = Math.floor(posX);
    let yFloor = Math.floor(posY);
    let pos = (yFloor * chunk.buffer.width + xFloor) * 4;
    console.log(pos);
    let r = chunk.buffer.data[pos];
    let g = chunk.buffer.data[pos + 1];
    let b = chunk.buffer.data[pos + 2];
    let colorString = "#";
    colorString += decimalToHex(r, 2);
    colorString += decimalToHex(g, 2);
    colorString += decimalToHex(b, 2);
    jquery_1.default("#picker").val(colorString);
}
function decimalToHex(d, padding) {
    var hex = Number(d).toString(16);
    padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;
    while (hex.length < padding) {
        hex = "0" + hex;
    }
    return hex;
}
function initializeChunks() {
    for (let i = 0; i < MAP_SIZE; i++) {
        for (let j = 0; j < MAP_SIZE; j++) {
            chunks.push(new Chunk({ x: i, y: j }));
        }
    }
}
function setColor(ctx) {
    let color;
    if (currentTool === 2) {
        currentTool = 1;
        pick(ctx);
    }
    if (currentTool === 3) {
        currentTool = 1;
        jquery_1.default("#picker").val("#ffffff");
        return { r: 0, g: 0, b: 0, a: 0 };
    }
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(jquery_1.default("#picker").val());
    if (result !== null) {
        color = {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
            a: 255
        };
    }
    else {
        color = { r: 0, g: 0, b: 255, a: 1, };
    }
    return color;
}
function incrimentBrush() {
    brushPos.x +=
        (mousePos.x + camera.x * CANVAS_SCALE - brushPos.x) * 0.1;
    brushPos.y +=
        (mousePos.y + camera.y * CANVAS_SCALE - brushPos.y) * 0.1;
}
function setCamera() {
    let cameraSpeed = -.19;
    if (currentTool === 4 && isMouseDown) {
        if (lastClicked.x < mousePos.x) {
            camera.x += cameraSpeed;
            cameraTarget.x += cameraSpeed;
        }
        else {
            camera.x -= cameraSpeed;
            cameraTarget.x -= cameraSpeed;
        }
        if (lastClicked.y < mousePos.y) {
            camera.y += cameraSpeed;
            cameraTarget.y += cameraSpeed;
        }
        else {
            camera.y -= cameraSpeed;
            cameraTarget.y -= cameraSpeed;
        }
    }
    if (cameraTarget.x <= 0) {
        cameraTarget.x = 0;
    }
    if (cameraTarget.y <= 0) {
        cameraTarget.y = 0;
    }
    if (camera.x <= 0) {
        camera.x = 0;
    }
    if (camera.y <= 0) {
        camera.y = 0;
    }
    camera = {
        x: 0.9 * camera.x + 0.1 * cameraTarget.x,
        y: 0.9 * camera.y + 0.1 * cameraTarget.y,
    };
}
function getChunk(x, y) {
    let chunkNumX = Math.floor(x / (CHUNK_SIZE * CANVAS_SCALE));
    let chunkNumY = Math.floor(y / (CHUNK_SIZE * CANVAS_SCALE));
    return chunks[chunkNumX * MAP_SIZE + chunkNumY];
}
function isVisableChunk(pos, size, ctx) {
    let lowerX = pos.x * size;
    let upperX = pos.x * size + size;
    let lowerY = pos.y * size;
    let upperY = pos.y * size + size;
    return lowerX >= camera.x * CANVAS_SCALE - size &&
        upperX <= camera.x * CANVAS_SCALE + ctx.canvas.clientWidth + size &&
        lowerY >= camera.y * CANVAS_SCALE - size &&
        upperY <= camera.y * CANVAS_SCALE + ctx.canvas.clientHeight + size;
}
function checkChunkBounds(chunk) {
    return chunk.pos.x >= 0 && chunk.pos.x < MAP_SIZE &&
        chunk.pos.y >= 0 && chunk.pos.y < MAP_SIZE;
}
function draw(color) {
    if (currentTool != 1) {
        return;
    }
    for (let i = 0; i < 25; i++) {
        incrimentBrush();
        let chunk = getChunk(brushPos.x, brushPos.y);
        if (checkChunkBounds(chunk) && chunk !== undefined) {
            let scaledX = (brushPos.x - chunk.pos.x * CHUNK_SIZE * CANVAS_SCALE) / CANVAS_SCALE;
            let scaledY = (brushPos.y - chunk.pos.y * CHUNK_SIZE * CANVAS_SCALE) / CANVAS_SCALE;
            chunk.draw(scaledX, scaledY, color);
        }
    }
}
jquery_1.default(() => {
    const $canvas = jquery_1.default("canvas");
    const ctx = $canvas[0].getContext("2d");
    if (ctx === null)
        return;
    $canvas.on("mousemove", (ev) => {
        const rect = ctx.canvas.getBoundingClientRect();
        mousePos.x = ev.clientX - rect.left;
        mousePos.y = ev.clientY - rect.top;
    });
    $canvas.on("mousedown", () => {
        lastClicked = {
            x: mousePos.x + camera.x * CANVAS_SCALE,
            y: mousePos.y + camera.y * CANVAS_SCALE,
        };
        brushPos = {
            x: mousePos.x + camera.x * CANVAS_SCALE,
            y: mousePos.y + camera.y * CANVAS_SCALE,
        };
        isMouseDown = true;
    });
    $canvas.on("mouseup", () => {
        isMouseDown = false;
    });
    window.addEventListener("resize", () => {
        resizeCanvas(ctx);
    });
    selectTool(currentTool);
    jquery_1.default("#tools button").each((i, el) => {
        el.addEventListener("mousedown", () => {
            selectTool(i);
        });
    });
    // Make chunks here
    initializeChunks();
    // Set size of the canvas to fit the draw space
    resizeCanvas(ctx);
    // Start rendering loop
    requestAnimationFrame(() => loop(ctx));
});
function loop(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        setCamera();
        if (isMouseDown) {
            let color = setColor(ctx);
            draw(color);
        }
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const pos = chunk.pos;
            const size = CHUNK_SIZE * CANVAS_SCALE;
            if (isVisableChunk(pos, size, ctx)) {
                yield chunks[i].render(ctx);
            }
        }
        // Draw Cursor
        ctx.fillStyle = "black";
        ctx.fillRect(mousePos.x / CANVAS_SCALE, mousePos.y / CANVAS_SCALE, 1, 1);
        requestAnimationFrame(() => loop(ctx));
    });
}
// Get key input for moving the camera
jquery_1.default(document).on("keydown", (ev) => {
    const event = ev.originalEvent;
    if (event === undefined)
        return;
    switch (event.code) {
        case "KeyW":
            cameraTarget.y -= 1;
            break;
        case "KeyS":
            cameraTarget.y += 1;
            break;
        case "KeyA":
            cameraTarget.x -= 1;
            break;
        case "KeyD":
            cameraTarget.x += 1;
            break;
    }
});
