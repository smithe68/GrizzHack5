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
const CHUNK_SIZE = 64;
const CANVAS_SCALE = 8;
const MAP_SIZE = 16;
let isMouseDown = false;
let mousePos = { x: 0, y: 0 };
let brushPos = { x: 0, y: 0 };
let camera = { x: 0, y: 0 };
let cameraTarget = { x: 0, y: 0 };
let currentTool = 1;
let chunks = [];
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
    for (let i = 0; i < MAP_SIZE; i++) {
        for (let j = 0; j < MAP_SIZE; j++) {
            chunks.push(new Chunk({ x: i, y: j }));
        }
    }
    // Set size of the canvas to fit the draw space
    resizeCanvas(ctx);
    // Start rendering loop
    requestAnimationFrame(() => loop(ctx));
});
function loop(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        camera = {
            x: 0.9 * camera.x + 0.1 * cameraTarget.x,
            y: 0.9 * camera.y + 0.1 * cameraTarget.y,
        };
        if (isMouseDown) {
            let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(jquery_1.default("#color").val());
            let color;
            if (result != null) {
                color = {
                    r: parseInt(result[1], 16),
                    g: parseInt(result[2], 16),
                    b: parseInt(result[3], 16),
                    a: 1,
                };
            }
            else {
                color = {
                    r: 0,
                    g: 0,
                    b: 0,
                    a: 1,
                };
            }
            for (let i = 0; i < 25; i++) {
                brushPos.x +=
                    (mousePos.x + camera.x * CANVAS_SCALE - brushPos.x) * 0.1;
                brushPos.y +=
                    (mousePos.y + camera.y * CANVAS_SCALE - brushPos.y) * 0.1;
                // Select the correct chunk
                let chunkNumX = Math.floor(brushPos.x / (CHUNK_SIZE * CANVAS_SCALE));
                let chunkNumY = Math.floor(brushPos.y / (CHUNK_SIZE * CANVAS_SCALE));
                let chunk = chunks[chunkNumX * MAP_SIZE + chunkNumY];
                if (chunkNumX >= 0 &&
                    chunkNumX < MAP_SIZE &&
                    chunkNumY >= 0 &&
                    chunkNumY < MAP_SIZE) {
                    if (chunk !== undefined) {
                        chunk.draw((brushPos.x - chunkNumX * CHUNK_SIZE * CANVAS_SCALE) /
                            CANVAS_SCALE, (brushPos.y - chunkNumY * CHUNK_SIZE * CANVAS_SCALE) /
                            CANVAS_SCALE, color);
                    }
                }
            }
        }
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const pos = chunk.pos;
            const size = CHUNK_SIZE * CANVAS_SCALE;
            let lowerX = pos.x * size;
            let upperX = pos.x * size + size;
            let lowerY = pos.y * size;
            let upperY = pos.y * size + size;
            if (lowerX >= camera.x * CANVAS_SCALE - size &&
                upperX <= camera.x * CANVAS_SCALE + ctx.canvas.clientWidth + size &&
                lowerY >= camera.y * CANVAS_SCALE - size &&
                upperY <= camera.y * CANVAS_SCALE + ctx.canvas.clientHeight + size) {
                yield chunks[i].render(ctx);
            }
        }
        // Draw Cursor
        ctx.fillStyle = "black";
        ctx.fillRect(mousePos.x / CANVAS_SCALE, mousePos.y / CANVAS_SCALE, 1, 1);
        requestAnimationFrame(() => loop(ctx));
    });
}
jquery_1.default("#color").on("click", (_) => {
    jquery_1.default("#popout").toggle();
});
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
