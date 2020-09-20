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

    async render(ctx: CanvasRenderingContext2D): Promise<void> {
        const frame = await createImageBitmap(this.buffer);
        ctx.drawImage(
            frame,
            this.pos.x * CHUNK_SIZE - camera.x,
            this.pos.y * CHUNK_SIZE - camera.y
        );
    }

    draw(x: number, y: number, color: Color) {
        if (x >= 0 && x < this.buffer.width && y >= 0 && this.buffer.height) {
            let xFloor = Math.floor(x);
            let yFloor = Math.floor(y);

            let pos = (yFloor * this.buffer.width + xFloor) * 4;

            this.buffer.data[pos] =  color.r;
            this.buffer.data[pos + 1] = color.g;
            this.buffer.data[pos + 2] = color.b;
            this.buffer.data[pos + 3] = color.a;
        }
    }
}

const CHUNK_SIZE: number = 64;
const CANVAS_SCALE: number = 8;
const MAP_SIZE: number = 16;

let isMouseDown: boolean = false;

let mousePos: Point = { x: 0, y: 0 };
let brushPos: Point = { x: 0, y: 0 };

let camera: Point = { x: 0, y: 0 };
let cameraTarget: Point = { x: 0, y: 0 };

let currentTool: number = 1;

let chunks: Chunk[] = [];

function selectTool(tool: number) {
    const $buttons = $("#tools button");
    $buttons.each((i, el) => el.classList.remove("selected"));
    $buttons[tool].classList.add("selected");
    currentTool = tool;
}

function resizeCanvas(ctx: CanvasRenderingContext2D) {
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;

    // Scale canvas to make it easier to see
    ctx.scale(CANVAS_SCALE, CANVAS_SCALE);

    // I want to see the pixels
    ctx.imageSmoothingEnabled = false;
}

function pick(ctx: CanvasRenderingContext2D ){

    let chunkNumX = Math.floor(mousePos.x / (CHUNK_SIZE * CANVAS_SCALE));
    let chunkNumY = Math.floor(mousePos.y / (CHUNK_SIZE * CANVAS_SCALE));

    let chunk = chunks[chunkNumX * MAP_SIZE + chunkNumY];

    let posX = (mousePos.x - chunkNumX * CHUNK_SIZE * CANVAS_SCALE) /
    CANVAS_SCALE;

    let posY = (mousePos.y - chunkNumY * CHUNK_SIZE * CANVAS_SCALE) /
    CANVAS_SCALE;


    let xFloor = Math.floor(posX);
    let yFloor = Math.floor(posY);

    let pos = (yFloor * chunk.buffer.width + xFloor) * 4;

    let r = chunk.buffer.data[pos];
    let g = chunk.buffer.data[pos+1];
    let b = chunk.buffer.data[pos+2];

    let colorString = "#";
    colorString+=r.toString(16);
    console.log(colorString);
    colorString+=g.toString(16);
    console.log(colorString);
    colorString+=b.toString(16);
    console.log(colorString);
    $("#picker").val(colorString);
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
    $("#tools button").each((i, el) => {
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

async function loop(ctx: CanvasRenderingContext2D) {
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    camera = {
        x: 0.9 * camera.x + 0.1 * cameraTarget.x,
        y: 0.9 * camera.y + 0.1 * cameraTarget.y,
    };

    if (isMouseDown) {
        if(currentTool === 2){
            currentTool = 1;
            pick(ctx);
            console.log(<string>$("#picker").val());
        }


        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
            <string>$("#picker").val()
        );
        

        let color;
        if (result !== null) {
            
            color = {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16),
                a: 255
            };
        } else {
            color = {
                r: 0,
                g: 0,
                b: 255,
                a: 1,
            };
        }

        for (let i = 0; i < 25; i++) {
            brushPos.x +=
                (mousePos.x + camera.x * CANVAS_SCALE - brushPos.x) * 0.1;
            brushPos.y +=
                (mousePos.y + camera.y * CANVAS_SCALE - brushPos.y) * 0.1;
            // Select the correct chunk
            let chunkNumX = Math.floor(
                brushPos.x / (CHUNK_SIZE * CANVAS_SCALE)
            );
            let chunkNumY = Math.floor(
                brushPos.y / (CHUNK_SIZE * CANVAS_SCALE)
            );

            let chunk = chunks[chunkNumX * MAP_SIZE + chunkNumY];
            if (
                chunkNumX >= 0 &&
                chunkNumX < MAP_SIZE &&
                chunkNumY >= 0 &&
                chunkNumY < MAP_SIZE
            ) {
                if (chunk !== undefined) {
                    chunk.draw(
                        (brushPos.x - chunkNumX * CHUNK_SIZE * CANVAS_SCALE) /
                            CANVAS_SCALE,
                        (brushPos.y - chunkNumY * CHUNK_SIZE * CANVAS_SCALE) /
                            CANVAS_SCALE,
                        color
                    );
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

        if (
            lowerX >= camera.x * CANVAS_SCALE - size &&
            upperX <= camera.x * CANVAS_SCALE + ctx.canvas.clientWidth + size &&
            lowerY >= camera.y * CANVAS_SCALE - size &&
            upperY <= camera.y * CANVAS_SCALE + ctx.canvas.clientHeight + size
        ) {
            await chunks[i].render(ctx);
        }
    }

    // Draw Cursor
    ctx.fillStyle = "black";
    ctx.fillRect(mousePos.x / CANVAS_SCALE, mousePos.y / CANVAS_SCALE, 1, 1);

    requestAnimationFrame(() => loop(ctx));
}

// Get key input for moving the camera
$(document).on("keydown", (ev) => {
    const event = ev.originalEvent;
    if (event === undefined) return;

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
