"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jquery_1 = __importDefault(require("jquery"));
class Chunk {
    constructor(newPos) {
        this.pos = newPos;
        this.buffer = new ImageData(CHUNK_SIZE, CHUNK_SIZE);
        for (let i = 0; i < this.buffer.data.length; i++) {
            this.buffer.data[i] = 255;
        }
    }
    render(ctx) {
        createImageBitmap(this.buffer)
            .then((frame) => {
            ctx.drawImage(frame, this.pos.x - camera.x, this.pos.y - camera.y);
        })
            .catch(() => { });
    }
    draw(x, y, color) {
        if (x >= 0 && x < this.buffer.width && y >= 0 && this.buffer.height) {
            const xFloor = Math.floor(x);
            const yFloor = Math.floor(y);
            const pos = (yFloor * this.buffer.width + xFloor) * 4;
            this.buffer.data[pos] = color.r;
            this.buffer.data[pos + 1] = color.g;
            this.buffer.data[pos + 2] = color.b;
            this.buffer.data[pos + 3] = color.a;
        }
    }
}
const CHUNK_SIZE = 128;
const CANVAS_SCALE = 8;
let isMouseDown = false;
let mousePos = { x: 0, y: 0 };
let brushPos = { x: 0, y: 0 };
let camera = { x: 0, y: 0 };
let cameraTargetPos = { x: 0, y: 0 };
let chunks = [];
function resizeCanvas(ctx) {
    const parent = ctx.canvas.parentElement;
    if (parent !== null) {
        ctx.canvas.width = parent.clientWidth;
        ctx.canvas.height = parent.clientHeight;
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
        brushPos = {
            x: mousePos.x,
            y: mousePos.y,
        };
        isMouseDown = true;
    });
    $canvas.on("mouseup", () => {
        isMouseDown = false;
    });
    // Make chunks here
    chunks.push(new Chunk({ x: 0, y: 0 }));
    // Set size of the canvas to fit the draw space
    resizeCanvas(ctx);
    // Scale canvas to make it easier to see
    ctx.scale(CANVAS_SCALE, CANVAS_SCALE);
    // Clear the screen to a blank white
    ctx.imageSmoothingEnabled = false;
    // Start rendering loop
    requestAnimationFrame(() => loop(ctx));
});
function loop(ctx) {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    camera = {
        x: 0.9 * camera.x + 0.1 * cameraTargetPos.x,
        y: 0.9 * camera.y + 0.1 * cameraTargetPos.y,
    };
    if (isMouseDown) {
        const red = { r: 255, g: 0, b: 0, a: 255 };
        for (let i = 0; i < 25; i++) {
            brushPos.x += (mousePos.x - brushPos.x) * 0.1;
            brushPos.y += (mousePos.y - brushPos.y) * 0.1;
            chunks[0].draw(brushPos.x / CANVAS_SCALE + camera.x, brushPos.y / CANVAS_SCALE + camera.y, red);
        }
    }
    chunks[0].render(ctx);
    requestAnimationFrame(() => loop(ctx));
}
jquery_1.default(document).on("keydown", (ev) => {
    switch (ev.keyCode) {
        case 87:
            cameraTargetPos.y -= 1;
            break;
        case 83:
            cameraTargetPos.y += 1;
            break;
        case 65:
            cameraTargetPos.x -= 1;
            break;
        case 68:
            cameraTargetPos.x += 1;
            break;
    }
});
