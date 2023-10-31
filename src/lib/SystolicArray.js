/**
 * Implements a systolic array.
 * Create the array using SystolicArray.create and passing a descriptor of the cell
 *
 * {
 *    rowsCount: 1,
 *    colsCount: 4,
 *    registers: [{
 *      name: 'a',
 *      init: ({col, row}) => coefficients[3 - col],  // It could be also a value. If missing, 0 will be used
 *      fx: ({a, x, p}, {row, col}) => a  // Transition function. It could be missing if there is no change in the value
 *    }],
 *    wires: [{
 *      name: 'p',
 *      direction: LEFT_RIGHT, // Default is LEFT_RIGHT
 *      delays: 1,  // Default value is 1,
 *      fx: ({a, x, p}, {row, col}) => p * x + a  // Transition function. It could be missing if there is no change in the value
 *    }, {
 *      name: 'x',
 *    }]
 * }
 */

export const LEFT_RIGHT = 0;
export const RIGHT_LEFT = 1;
export const TOP_DOWN = 2;
export const BOTTOM_UP = 3;

const CELL_MIN_WIDTH = 80;
const CELL_MIN_HEIGHT = 100;
const CELL_TITLE_HEIGHT = 40;

const REGISTER_HEIGHT = 20;

const DELAY_WIDTH = 10;

const WIRES_HGAP = 50;
const WIRES_VGAP = 50;

const drawText = (ctx, s, x, y, { fontSize = 15, textAlign = 'center', baseAlign = 'middle' }) => {
  ctx.font = `${fontSize}px serif`;
  ctx.textAlign = textAlign;
  ctx.textBaseline = baseAlign;
  ctx.fillText(s, x, y);
};

const drawLine = (ctx, x1, y1, x2, y2) => {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
};

const normalize = descriptor => {
  const { rowsCount = 1, colsCount = 1, registers, wires, startIndex = 0 } = descriptor;
  if (rowsCount < 1) throw new Error('Invalid rows count');
  if (colsCount < 1) throw new Error('Invalid columns count');
  const nd = { rowsCount, colsCount, startIndex };
  nd.registers = registers.map(({ name, init, fx }, index) => {
    if (name?.length < 1) throw new Error('Invalid name "' + name + '" for register ' + index);
    return {
      name,
      init: typeof init === 'function' ? init : () => init ?? 0,
      fx: typeof fx === 'function' ? fx : values => values[name],
    };
  });
  nd.wires = wires.map(({ name, direction = LEFT_RIGHT, delays = 1, fx }, index) => {
    if (name?.length < 1) throw new Error('Invalid name "' + name + '" for wire ' + index);
    return {
      name,
      direction,
      delays,
      fx: typeof fx === 'function' ? fx : values => values[name],
    };
  });
  return nd;
};

export default class SystolicArray {
  static create(descriptor) {
    descriptor = normalize(descriptor);
    if (descriptor === null) throw new Error('Invalid descriptor');
    for (const w of descriptor.wires) {
      if (w.delays < 1) throw new Error('Rippling/Broadcast not supported yet');
    }
    const { rowsCount, colsCount, registers, wires } = descriptor;

    const cells = new Array(rowsCount);
    for (let row = 0; row < rowsCount; row++) {
      cells[row] = new Array(colsCount);
      for (let col = 0; col < colsCount; col++) {
        const cell = {};
        for (const r of registers) {
          cell[r.name] = r.init({ row, col });
        }
        for (const w of wires) {
          cell[w.name] = { in: 0, out: new Array(Math.max(1, w.delays)).fill(0) };
        }
        cells[row][col] = cell;
      }
    }

    return new SystolicArray(descriptor, 0, cells);
  }

  constructor(descriptor, step, cells) {
    this.descriptor = descriptor;
    this.step = step;
    this.cells = cells;

    console.log('Systolic array is', this.toString());
  }

  toString() {
    let s = `Step ${this.step}`;
    for (const row of this.cells) {
      s += '\n';
      for (const cell of row) {
        s += '\t' + JSON.stringify(cell);
      }
    }
    return s;
  }

  *rows(direction) {
    if (direction === BOTTOM_UP) {
      for (let i = this.descriptor.rowsCount; --i >= 0; ) yield i;
    } else {
      for (let i = 0; i < this.descriptor.rowsCount; i++) yield i;
    }
  }

  *columns(direction) {
    if (direction === RIGHT_LEFT) {
      for (let i = this.descriptor.colsCount; --i >= 0; ) yield i;
    } else {
      for (let i = 0; i < this.descriptor.colsCount; i++) yield i;
    }
  }

  horizontal(wire) {
    return wire.direction === LEFT_RIGHT || wire.direction === RIGHT_LEFT;
  }

  vertical(wire) {
    return wire.direction === TOP_DOWN || wire.direction === BOTTOM_UP;
  }

  cellValues(cell) {
    const values = {};
    for (const key in cell) {
      values[key] = cell[key]?.in ?? cell[key] ?? 0;
    }
  }

  prevPos(row, col, direction) {
    switch (direction) {
      case LEFT_RIGHT:
      default:
        return col > 0 ? { row, col: col - 1 } : null;
      case RIGHT_LEFT:
        return col < this.descriptor.colsCount - 1 ? { row, col: col + 1 } : null;
      case TOP_DOWN:
        return row > 0 ? { row: row - 1, col } : null;
      case BOTTOM_UP:
        return row < this.descriptor.rowsCount - 1 ? { row: row + 1, col } : null;
    }
  }

  moveNext(input) {
    const { rowsCount, colsCount, registers, wires } = this.descriptor;

    // Clone the cells first
    const cells = new Array(rowsCount);
    for (let row = 0; row < rowsCount; row++) {
      cells[row] = new Array(colsCount);
      for (let col = 0; col < colsCount; col++) {
        cells[row][col] = {};
        for (const r of registers) {
          cells[row][col][r.name] = this.cells[row][col][r.name];
        }
      }
    }

    // First propagate the systolic input
    for (let row = 0; row < rowsCount; row++) {
      for (let col = 0; col < colsCount; col++) {
        for (const w of wires) {
          if (w.delays) {
            const prev = this.prevPos(row, col, w.direction);
            let prevValue;
            if (prev) {
              const out = this.cells[prev.row][prev.col][w.name].out;
              prevValue = out[out.length - 1];
            } else {
              prevValue = input[w.name][this.horizontal(w) ? row : col];
            }
            const cell = cells[row][col];
            cell[w.name] = { in: prevValue };
          }
        }
      }
    }

    // Update systolic output
    for (let row = 0; row < rowsCount; row++) {
      for (let col = 0; col < colsCount; col++) {
        const cell = cells[row][col];
        // Prepare the in values of the cell
        const values = {};
        for (const r of registers) {
          values[r.name] = cell[r.name];
        }
        for (const w of wires) {
          values[w.name] = cell[w.name].in;
        }
        // Call the transitions
        for (const r of registers) {
          cell[r.name] = r.fx(values, { row, col });
        }
        for (const w of wires) {
          cell[w.name].out = [
            w.fx(values, { row, col }),
            ...this.cells[row][col][w.name].out.slice(0, -1),
          ];
        }
      }
    }

    return new SystolicArray(this.descriptor, this.step + 1, cells);
  }

  draw(ctx, frame) {
    const { rowsCount, colsCount, startIndex } = this.descriptor;

    const { width, height } = this.preferredSize();
    const left = (ctx.canvas.width - width) / 2;
    const top = (ctx.canvas.height - height) / 2;

    const cellSize = this.cellSize();
    let horzWiresCount = 0;
    let horzMaxDelays = 0;
    let vertWiresCount = 0;
    let vertMaxDelays = 0;
    for (const w of this.descriptor.wires) {
      if (this.horizontal(w)) {
        horzWiresCount++;
        horzMaxDelays = Math.max(horzMaxDelays, w.delays);
      } else {
        vertWiresCount++;
        vertMaxDelays = Math.max(vertMaxDelays, w.delays);
      }
    }

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    for (let row = 0; row < rowsCount; row++) {
      const y = top + WIRES_VGAP + row * (cellSize.height + (vertMaxDelays + 1) * WIRES_VGAP);
      for (let col = 0; col < colsCount; col++) {
        const cell = this.cells[row][col];
        const x = left + WIRES_HGAP + col * (cellSize.width + (horzMaxDelays + 1) * WIRES_HGAP);

        // Cell border
        ctx.fillStyle = '#000000';
        ctx.strokeRect(x, y, cellSize.width, cellSize.height);

        // Cell title
        drawText(
          ctx,
          rowsCount === 1
            ? `P${startIndex + col}`
            : colsCount === 1
            ? `P${startIndex + row}`
            : `P${startIndex + row},${startIndex + col}`,
          x + cellSize.width / 2,
          y + CELL_TITLE_HEIGHT / 2,
          { fontSize: 20 },
        );

        // Registers
        this.descriptor.registers.forEach((r, index) => {
          drawText(
            ctx,
            `${r.name}:${cell[r.name]}`,
            x + cellSize.width / 2,
            y + CELL_TITLE_HEIGHT + ((2 * index + 1) * REGISTER_HEIGHT) / 2,
            { fontSize: 16 },
          );
        });

        // Wires
        let horzIndex = 0;
        let vertIndex = 0;
        this.descriptor.wires.forEach((w, index) => {
          const wireX =
            x + (cellSize.width - (vertWiresCount - 1) * WIRES_HGAP) / 2 + vertIndex * WIRES_HGAP;
          const wireY =
            y + (cellSize.height - (horzWiresCount - 1) * WIRES_VGAP) / 2 + horzIndex * WIRES_VGAP;

          switch (w.direction) {
            case LEFT_RIGHT:
            default:
              drawLine(ctx, x - WIRES_HGAP, wireY, x, wireY);
              drawLine(
                ctx,
                x + cellSize.width,
                wireY,
                x + cellSize.width + (horzIndex < colsCount - 1 ? horzMaxDelays : 1) * WIRES_HGAP,
                wireY,
              );
              if (col === 0) {
                drawText(ctx, w.name, x - WIRES_HGAP, wireY, {
                  fontSize: 16,
                  textAlign: 'left',
                  baseAlign: 'bottom',
                });
                ctx.beginPath();
                ctx.moveTo(x - WIRES_HGAP / 2, wireY);
                ctx.lineTo(x - WIRES_HGAP / 2 - 15, wireY + 10);
                ctx.lineTo(x - WIRES_HGAP / 2 - 15, wireY);
                ctx.fill();
              }
              drawText(ctx, `${cell[w.name].in} `, x, wireY, {
                fontSize: 14,
                textAlign: 'right',
                baseAlign: 'bottom',
              });
              drawText(ctx, ` ${cell[w.name].out[0]}`, x + cellSize.width, wireY, {
                fontSize: 14,
                textAlign: 'left',
                baseAlign: 'bottom',
              });
              if (col < colsCount - 1) {
                const segment = ((horzMaxDelays + 1) * WIRES_HGAP) / (w.delays + 1);
                for (let idx = 0; idx < w.delays; idx++) {
                  ctx.fillRect(
                    x + cellSize.width + (idx + 1) * segment - DELAY_WIDTH / 2,
                    wireY - DELAY_WIDTH,
                    DELAY_WIDTH,
                    2 * DELAY_WIDTH,
                  );
                  if (idx > 0) {
                    drawText(
                      ctx,
                      `${cell[w.name].out[idx]}`,
                      x + cellSize.width + ((2 * idx + 1) * segment) / 2,
                      wireY,
                      {
                        fontSize: 14,
                        baseAlign: 'bottom',
                      },
                    );
                  }
                }
              }
              horzIndex++;
              break;
            case RIGHT_LEFT:
              drawLine(ctx, x - (horzIndex ? horzMaxDelays : 1) * WIRES_HGAP, wireY, x, wireY);
              drawLine(ctx, x + cellSize.width, wireY, x + cellSize.width + WIRES_HGAP, wireY);
              if (col === colsCount - 1) {
                drawText(ctx, w.name, x + cellSize.width + WIRES_HGAP, wireY, {
                  fontSize: 16,
                  textAlign: 'right',
                  baseAlign: 'bottom',
                });
                ctx.beginPath();
                ctx.moveTo(x + cellSize.width + WIRES_HGAP / 2, wireY);
                ctx.lineTo(x + cellSize.width + WIRES_HGAP / 2 + 15, wireY + 10);
                ctx.lineTo(x + cellSize.width + WIRES_HGAP / 2 + 15, wireY);
                ctx.fill();
              }
              drawText(ctx, ` ${cell[w.name].in}`, x + cellSize.width, wireY, {
                fontSize: 14,
                textAlign: 'left',
                baseAlign: 'bottom',
              });
              drawText(ctx, `${cell[w.name].out[0]} `, x, wireY, {
                fontSize: 14,
                textAlign: 'right',
                baseAlign: 'bottom',
              });
              if (col > 0) {
                const segment = ((horzMaxDelays + 1) * WIRES_HGAP) / (w.delays + 1);
                for (let idx = 0; idx < w.delays; idx++) {
                  ctx.fillRect(
                    x - (idx + 1) * segment - DELAY_WIDTH / 2,
                    wireY - DELAY_WIDTH,
                    DELAY_WIDTH,
                    2 * DELAY_WIDTH,
                  );
                  if (idx > 0) {
                    drawText(
                      ctx,
                      `${cell[w.name].out[idx]}`,
                      x - ((2 * idx + 1) * segment) / 2,
                      wireY,
                      {
                        fontSize: 14,
                        baseAlign: 'bottom',
                      },
                    );
                  }
                }
              }
              horzIndex++;
              break;
            case TOP_DOWN:
              drawLine(ctx, wireX, y - WIRES_VGAP, wireX, y);
              drawLine(
                ctx,
                wireX,
                y + cellSize.height,
                wireX,
                y + cellSize.height + (vertIndex < rowsCount - 1 ? vertMaxDelays : 1) * WIRES_VGAP,
              );
              if (row === 0) {
                drawText(ctx, ` ${w.name}`, wireX, y - WIRES_VGAP, {
                  fontSize: 16,
                  textAlign: 'left',
                  baseAlign: 'top',
                });
                ctx.beginPath();
                ctx.moveTo(wireX, y - WIRES_VGAP / 2);
                ctx.lineTo(wireX - 10, y - WIRES_VGAP / 2 - 15);
                ctx.lineTo(wireX, y - WIRES_VGAP / 2 - 15);
                ctx.fill();
              }
              drawText(ctx, ` ${cell[w.name].in} `, wireX, y, {
                fontSize: 14,
                textAlign: 'left',
                baseAlign: 'bottom',
              });
              drawText(ctx, ` ${cell[w.name].out[0]}`, wireX, y + cellSize.height, {
                fontSize: 14,
                textAlign: 'left',
                baseAlign: 'top',
              });
              if (row < rowsCount - 1) {
                const segment = ((vertMaxDelays + 1) * WIRES_VGAP) / (w.delays + 1);
                for (let idx = 0; idx < w.delays; idx++) {
                  ctx.fillRect(
                    wireX - DELAY_WIDTH,
                    y + cellSize.height + (idx + 1) * segment - DELAY_WIDTH / 2,
                    2 * DELAY_WIDTH,
                    DELAY_WIDTH,
                  );
                  if (idx > 0) {
                    drawText(
                      ctx,
                      ` ${cell[w.name].out[idx]}`,
                      wireX,
                      y + cellSize.height + ((2 * idx + 1) * segment) / 2,
                      {
                        fontSize: 14,
                        textAlign: 'left',
                      },
                    );
                  }
                }
              }
              vertIndex++;
              break;
            case BOTTOM_UP:
              drawLine(ctx, wireX, y - (vertIndex ? vertMaxDelays : 1) * WIRES_VGAP, wireX, y);
              drawLine(ctx, wireX, y + cellSize.height, wireX, y + cellSize.height + WIRES_VGAP);
              if (row === rowsCount - 1) {
                drawText(ctx, ` ${w.name}`, wireX, y + cellSize.height + WIRES_VGAP, {
                  fontSize: 16,
                  textAlign: 'left',
                  baseAlign: 'bottom',
                });
                ctx.beginPath();
                ctx.moveTo(wireX, y + cellSize.height + WIRES_VGAP / 2);
                ctx.lineTo(wireX - 10, y + cellSize.height + WIRES_VGAP / 2 + 15);
                ctx.lineTo(wireX, y + cellSize.height + WIRES_VGAP / 2 + 15);
                ctx.fill();
              }
              drawText(ctx, ` ${cell[w.name].in} `, wireX, y + cellSize.height, {
                fontSize: 14,
                textAlign: 'left',
                baseAlign: 'top',
              });
              drawText(ctx, ` ${cell[w.name].out[0]}`, wireX, y, {
                fontSize: 14,
                textAlign: 'left',
                baseAlign: 'bottom',
              });
              if (row > 0) {
                const segment = ((vertMaxDelays + 1) * WIRES_VGAP) / (w.delays + 1);
                for (let idx = 0; idx < w.delays; idx++) {
                  ctx.fillRect(
                    wireX - DELAY_WIDTH,
                    y - (idx + 1) * segment - DELAY_WIDTH / 2,
                    2 * DELAY_WIDTH,
                    DELAY_WIDTH,
                  );
                  if (idx > 0) {
                    drawText(
                      ctx,
                      ` ${cell[w.name].out[idx]}`,
                      wireX,
                      y - ((2 * idx + 1) * segment) / 2,
                      {
                        fontSize: 14,
                        textAlign: 'left',
                      },
                    );
                  }
                }
              }
              vertIndex++;
              break;
          }
        });
      }
    }
  }

  cellSize() {
    let horzWiresCount = 0;
    let vertWiresCount = 0;
    for (const w of this.descriptor.wires) {
      if (this.horizontal(w)) horzWiresCount++;
      else vertWiresCount++;
    }
    const regsCount = this.descriptor.registers.length;
    const width = Math.max(CELL_MIN_WIDTH, horzWiresCount * WIRES_HGAP);
    const height = Math.max(
      CELL_MIN_HEIGHT,
      CELL_TITLE_HEIGHT + regsCount * REGISTER_HEIGHT,
      vertWiresCount * WIRES_VGAP,
    );
    return { width, height };
  }

  preferredSize() {
    const cellSize = this.cellSize();
    let horzMaxDelays = 0;
    let vertMaxDelays = 0;
    for (const w of this.descriptor.wires) {
      if (this.horizontal(w)) horzMaxDelays = Math.max(horzMaxDelays, w.delays);
      else vertMaxDelays = Math.max(vertMaxDelays, w.delays);
    }
    const { rowsCount, colsCount } = this.descriptor;
    const width =
      colsCount * cellSize.width +
      (horzMaxDelays + 1) * WIRES_HGAP * (colsCount - 1) +
      2 * WIRES_HGAP;
    const height =
      rowsCount * cellSize.height +
      (vertMaxDelays + 1) * WIRES_VGAP * (rowsCount - 1) +
      2 * WIRES_VGAP;
    return { width, height };
  }
}
