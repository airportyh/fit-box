type BoundingBox = {
    x: number;
    y: number;
    width: number;
    height: number;
};

type Box = TextBox | ContainerBox;

type TextBox = {
    type: "text"
    text: string
};

type ContainerBox = {
    type: "container",
    direction: "vertical" | "horizontal",
    children: Box[]
};

type Point = {
    y: number;
    x: number;
}

export function fitBox(
    box: Box,
    bbox: BoundingBox,
    fontFamily: string,
    fontWeight: string = "normal",
    ctx: CanvasRenderingContext2D
) {
    let lowerFontSize: null | number = null;
    let upperFontSize: null | number = null;
    let fontSize = 5;
    let height: number, width: number;
    let bboxMap;
    
    ctx.strokeRect(box.left, box.top, box.width, box.height);
    while (true) {
    
        ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        bboxMap = layout(box, { x: bbox.x, y: bbox.y }, fontSize, ctx);
        const myBBox = bboxMap.get(box);
        const allFit = myBBox.height <= bbox.height && myBBox.width <= bbox.width;
        
        if (allFit) {
            lowerFontSize = fontSize;
            if (upperFontSize) {
                const newFontSize = Math.floor((upperFontSize + fontSize) / 2);
                if (newFontSize === fontSize) {
                    break;
                }
                fontSize = newFontSize;
            } else {
                fontSize *= 2;
            }
        } else {
            upperFontSize = fontSize;
            if (lowerFontSize) {
                const newFontSize = Math.floor((lowerFontSize + fontSize) / 2);
                if (newFontSize === fontSize) {
                    break;
                }
                fontSize = newFontSize;
            } else {
                fontSize = Math.floor(fontSize / 2);
            }
        }
    }
    
    render(box, bboxMap, ctx);
}

function layout(
    box: Box, 
    offset: Point,
    fontSize: number,
    ctx: CanvasRenderingContext2D):
    Map<Box, BoundingBox> {
    if (box.type === "text") {
        const width = ctx.measureText(box.text).width;
        const height = fontSize;
        const bbox: BoundingBox = {
            ...offset,
            width,
            height
        };
        return new Map([[box, bbox]]);
    } else if (box.type === "container") {
        if (box.direction === "vertical") {
            const entries = [];
            let yOffset = offset.y;
            let myWidth = 0;
            let myHeight = 0;
            for (let child of box.children) {
                const bboxMap = layout(
                    child, 
                    { x: offset.x, y: yOffset }, 
                    fontSize, 
                    ctx);
                entries.push(...bboxMap);
                const childBBox = bboxMap.get(child);
                yOffset += childBBox.height;
                myHeight += childBBox.height;
                if (childBBox.width > myWidth) {
                    myWidth = childBBox.width;
                }
            }
            const containerBBox: BoundingBox = {
                ...offset,
                height: myHeight,
                width: myWidth
            };
            entries.push([box, containerBBox]);
            return new Map(entries);
        } else if (box.direction === "horizontal") {
            const entries = [];
            let xOffset = offset.x;
            let myWidth = 0;
            let myHeight = 0;
            for (let child of box.children) {
                const bboxMap = layout(
                    child, 
                    { x: xOffset, y: offset.y }, 
                    fontSize, 
                    ctx);
                entries.push(...bboxMap);
                const childBBox = bboxMap.get(child);
                xOffset += childBBox.width;
                myWidth += childBBox.width;
                if (childBBox.height > myHeight) {
                    myHeight = childBBox.height;
                }
            }
            const containerBBox: BoundingBox = {
                ...offset,
                height: myHeight,
                width: myWidth
            };
            entries.push([box, containerBBox]);
            return new Map(entries);
        } else {
            throw new Error("Not implemented");
        }
    } else {
        throw new Error("Not implemented");
    }
}

/*
Pre-condition: You set the font property on the canvas context.
*/
function render(
    box: Box,
    bBoxMap: Map<Box, BoundingBox>,
    ctx: CanvasRenderingContext2D): void
    {
    if (box.type === "text") {
        const bbox = bBoxMap.get(box);
        ctx.fillText(box.text, bbox.x, bbox.y);
        strokeBBox(bbox, ctx);
    } else if (box.type === "container") {
        for (let child of box.children) {
            render(child, bBoxMap, ctx);
        }
        const bbox = bBoxMap.get(box);
        strokeBBox(bbox, ctx);
    } else {
        throw new Error("Not implemented");
    }    
}

function strokeBBox(bbox: BoundingBox, ctx: CanvasRenderingContext2D) {
    ctx.strokeRect(
        bbox.x, 
        bbox.y,
        bbox.width,
        bbox.height
    );
}

async function main() {
    const canvas = document.createElement("canvas");
    canvas.width = 500;
    canvas.height = 500;
    canvas.style.border = "1px solid black";
    
    const ctx = canvas.getContext("2d");
    
    document.body.appendChild(canvas);
    const fontSize = 25;
    ctx.font = `normal ${fontSize}px Inconsolata`;
    ctx.textBaseline = "top";
    
    const bbox: BoundingBox = {
        x: 50,
        y: 50,
        width: 400,
        height: 200
    };
    
    strokeBBox(bbox, ctx);
    const box: Box = {
        type: "container",
        direction: "horizontal",
        children: [
            {
                type: "container",
                direction: "vertical",
                children: [
                    { type: "text", text: " 1" },
                    { type: "text", text: " 2" },
                    { type: "text", text: " 3" },
                    { type: "text", text: " 4" },
                    { type: "text", text: " 5" },
                    { type: "text", text: " 6" },
                    { type: "text", text: " 7" },
                    { type: "text", text: " 8" }
                ]
            },
            {
                type: "container",
                direction: "vertical",
                children: [
                    { type: "text", text: "def main() [" },
                    {
                        type: "container",
                        direction: "horizontal",
                        children: [
                            { type: "text", text: "  print(" },
                            { type: "text", text: "fib(7)" },
                            { type: "text", text: ")" }
                        ]
                    },
                    { type: "text", text: "]" },
                ]
            }
        ]
    };
    
    fitBox(box, bbox, "Inconsolata", "normal", ctx);
    /*
    const bboxMap = layout(
        box, 
        { x: 100, y: 100 },
        fontSize,
        ctx
    );
    console.log("bboxMap", bboxMap);
    
    render(box, bboxMap, ctx);
    */
    
}

main().catch(err => console.log(err.stack));