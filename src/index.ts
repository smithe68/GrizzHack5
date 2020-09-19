import $ from "jquery";

interface Point {
    x: number;
    y: number;
}

interface Color {
    r: number;
    g: number;
    b: number;
    a: number;
}

class Chunk {
    pos: Point;
    buffer: ImageData;

    constructor(newPos: Point) {
        this.pos = newPos;
        this.buffer = new ImageData(CHUNK_SIZE, CHUNK_SIZE);
        for (let i = 0; i < this.buffer.data.length; i++)
            this.buffer.data[i] = 255;
    }

    render(ctx: CanvasRenderingContext2D) {
        createImageBitmap(this.buffer)
            .then((frame) => {
                ctx.drawImage(
                    frame,
                    this.pos.x - camera.x,
                    this.pos.y - camera.y
                );
            })
            .catch(() => {});
    }

    draw(x: number, y: number, color: Color) {
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

const CHUNK_SIZE: number = 128;
const CANVAS_SCALE: number = 8;

let isMouseDown: boolean = false;

let mousePos: Point = { x: 0, y: 0 };
let brushPos: Point = { x: 0, y: 0 };

let camera: Point = { x: 0, y: 0 };
let cameraTarget: Point = { x: 0, y: 0 };

let chunks: Chunk[] = [];

function resizeCanvas(ctx: CanvasRenderingContext2D) {
    const parent = ctx.canvas.parentElement;
    if (parent !== null) {
        ctx.canvas.width = parent.clientWidth;
        ctx.canvas.height = parent.clientHeight;
    }
}

$(() => {
    const $canvas = $("canvas");
    const ctx = (<HTMLCanvasElement>$canvas[0]).getContext("2d");
    if (ctx === null) return;

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

    // Make sure there isn't any smoothing
    ctx.imageSmoothingEnabled = false;

    // Start rendering loop
    requestAnimationFrame(() => loop(ctx));
});

function loop(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    camera = {
        x: 0.9 * camera.x + 0.1 * cameraTarget.x,
        y: 0.9 * camera.y + 0.1 * cameraTarget.y,
    };

    if (isMouseDown) {
        const red: Color = { r: 255, g: 0, b: 0, a: 255 };

        for (let i = 0; i < 25; i++) {
            brushPos.x += (mousePos.x - brushPos.x) * 0.1;
            brushPos.y += (mousePos.y - brushPos.y) * 0.1;
            chunks[0].draw(
                brushPos.x / CANVAS_SCALE + camera.x,
                brushPos.y / CANVAS_SCALE + camera.y,
                red
            );
        }
    }

    chunks[0].render(ctx);

    requestAnimationFrame(() => loop(ctx));
}

// Get key input for moving the camera
$(document).on("keydown", (ev) => {
    switch (ev.keyCode) {
        case 87:
            cameraTarget.y -= 1;
            break;
        case 83:
            cameraTarget.y += 1;
            break;
        case 65:
            cameraTarget.x -= 1;
            break;
        case 68:
            cameraTarget.x += 1;
            break;
    }
});
