import { ctx } from './canvas.js';

export let shapes = [];  // Если переменная экспортируется, нужно быть уверенным, что используется один раз

export function drawShape(event, startPoint, shapeType, penSize, penColor, fillShape) {
    if (!startPoint) return;
    const endPoint = { x: event.clientX - canvas.offsetLeft, y: event.clientY - canvas.offsetTop };
    const width = endPoint.x - startPoint.x;
    const height = endPoint.y - startPoint.y;

    ctx.lineWidth = penSize;
    ctx.strokeStyle = penColor;
    ctx.fillStyle = penColor;

    switch (shapeType) {
        case 'circle':
            ctx.beginPath();
            ctx.arc(startPoint.x, startPoint.y, Math.sqrt(width * width + height * height), 0, Math.PI * 2);
            if (fillShape) {
                ctx.fill();
            } else {
                ctx.stroke();
            }
            break;
        case 'star':
            drawStar(ctx, startPoint.x, startPoint.y, 5, Math.sqrt(width * width + height * height) / 2, Math.sqrt(width * width + height * height) / 4);
            break;
        case 'square':
            ctx.beginPath();
            ctx.rect(startPoint.x, startPoint.y, width, height);
            if (fillShape) {
                ctx.fill();
            } else {
                ctx.stroke();
            }
            break;
        case 'triangle':
            ctx.beginPath();
            ctx.moveTo(startPoint.x, startPoint.y);
            ctx.lineTo(startPoint.x + width, startPoint.y + height);
            ctx.lineTo(startPoint.x - width, startPoint.y + height);
            ctx.closePath();
            if (fillShape) {
                ctx.fill();
            } else {
                ctx.stroke();
            }
            break;
    }
}


function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    if (fillShape) {
        ctx.fill();
    } else {
        ctx.stroke();
    }
}
