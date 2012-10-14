/**
 * Code to draw a visualization of Timer1's fast PWM mode.
 */
(function () {
function TimerGraph(canvasEl, wgm, cs, com, ocra, icr) {
  this.canvasEl = canvasEl;
  this.ocr1a = ocra;
  this.wgm = wgm;
  this.icr1 = icr;
  this.cs = cs;
  this.com = com;
  this.not_implemented = false;
  switch (this.wgm) {
  case 1: this.top = 0xFF; break;
  case 2: this.top = 0x1FF; break;
  case 3: this.top = 0x3FF; break;
  case 5: this.top = 0xFF; break;
  case 6: this.top = 0x1FF; break;
  case 7: this.top = 0x3FF; break;
  case 14: this.top = this.icr1; break;
  case 15: this.top = this.ocr1a; break;
  default: this.not_implemented = true; break;
  }
  if ([0,2,3].indexOf(this.com) === -1) {
    this.not_implemented = true;
  }
  if (typeof this.getPrescaler() === 'undefined') {
    this.not_implemented = true;
  }

  this.width = 400;
  this.height = 400;
  this.leftMargin = 100;
  this.bottomMargin = 200;
  this.topMargin = 0;
  this.rightMargin = 0;
  this.originX = this.leftMargin;
  this.originY = this.canvasEl.height - this.bottomMargin;

  this.procFreq = 16000000.0;
}
TimerGraph.prototype.isImplemented = function () {
  return !this.not_implemented;
};
TimerGraph.prototype.resetCanvas = function () {
  this.canvasEl.width = this.width;
  this.canvasEl.height = this.height;
  this.ctx = this.canvasEl.getContext('2d');
};
TimerGraph.prototype.drawAxes = function () {
  this.ctx.beginPath();
  this.ctx.fillStyle = "#FFFFFF";
  this.ctx.fillRect(0, 0, this.canvasEl.width, this.canvasEl.height);
  this.ctx.strokeStyle = 'black';
  this.ctx.fillStyle = "black";
  this.ctx.moveTo(this.leftMargin, this.originY);
  this.ctx.lineTo(this.leftMargin, this.topMargin);
  this.ctx.moveTo(this.leftMargin, this.originY);
  this.ctx.lineTo(this.canvasEl.width-this.rightMargin, this.originY);
  this.ctx.fillText("TCNT1", this.leftMargin - 40, this.topMargin + 20);
//  this.ctx.fillText("Time (in clock cycles)", this.originX + (this.canvasEl.width - this.leftMargin - this.rightMargin)/2, this.canvasEl.height - this.bottomMargin+15);
  this.ctx.stroke();
};

TimerGraph.prototype.drawLabeledLine = function (label, color, fromX, posY, toX) {
  var xoffset = 10, yoffset = -10, x;
  this.ctx.beginPath();
  this.ctx.fillStyle = color;
  this.ctx.strokeStyle = color;

  // dashed line.
  for (x = fromX; x < toX; x += 10) {
    this.ctx.moveTo(x, posY);
    this.ctx.lineTo(x + 7, posY);
  }
  this.ctx.fillText(label, fromX + xoffset, posY + yoffset);
  this.ctx.stroke();
};

TimerGraph.prototype.drawSpecialLines = function () {
  this.drawLabeledLine("OCR1A (" + this.ocr1a +")", 'green', 0, this.originY - this.scale(this.ocr1a), this.canvasEl.width - this.rightMargin);
  this.drawLabeledLine("TOP (" + this.top + ")", 'blue', 0, this.originY - this.scale(this.top), this.canvasEl.width - this.rightMargin);

  this.drawLabeledLine("HIGH", 'red', this.originX - 40, this.originY + 40, this.canvasEl.width - this.rightMargin);
  this.drawLabeledLine("LOW", 'blue', this.originX - 40, this.originY + 80, this.canvasEl.width - this.rightMargin);
};

TimerGraph.prototype.scale = function (v) {
  var max, scale;
  max = this.top;
  scale = 3*max/255.0;
  return v/scale;
};

TimerGraph.prototype.iscale = function (v) {
  return v/this.scale(1);
};

TimerGraph.prototype.TCNT_at = function (x, top) {
    if ([5, 6, 7, 14, 15].indexOf(this.wgm) !== -1) {
      return x % top;
    }
    else if ([1, 2, 3].indexOf(this.wgm) !== -1) {
      var v = x % (2*top);
      if (v > top) {
        return 2*top - v;
      }
      else {
        return v;
      }
    }
    else {
    }
};

TimerGraph.prototype.isOn = function (tcnt) {
  var com3 = this.com === 3;
  if (this.com === 0) {
    return false;
  }
  else if (this.ocr1a > this.top) {
    return com3;
  }
  else if (tcnt > this.ocr1a) {
    return !com3;
  }
  else {
    return com3;
  }
};

TimerGraph.prototype.barColor = function (tcnt) {
  var offColor, compAColor;
  offColor = '#AAAAAA';
  compAColor = '#888888';
  if (this.isOn(tcnt)) {
    return compAColor;
  }
  else {
    return offColor;
  }
};

TimerGraph.prototype.drawGraph = function () {
  var x, plotWidth, dx, tcnt, barHeight, barColor, lastScaledX;
  dx = 1;
  plotWidth = this.canvasEl.width-this.rightMargin-28;
  for (x = 0; x < plotWidth; x += 1) {
    var ix = this.iscale(x);
    tcnt = this.TCNT_at(ix, this.top);
    barHeight = this.scale(tcnt);
    barColor = this.barColor(tcnt);
    this.ctx.strokeStyle = barColor;
    this.ctx.fillStyle = barColor;
    this.ctx.fillRect(this.originX + x, this.originY, dx, -barHeight);
    this.ctx.stroke();
  }

  var duty = Math.min(5, Math.max(((this.com == 3) ? (this.ocr1a/this.top) : (1 - this.ocr1a/this.top)) * 5.0, 0));
  this.ctx.beginPath();
  this.ctx.fillStyle = 'black';
  this.ctx.fillText("v = " + sprintf("%.2f V", duty), this.originX - 90, this.originY + 55);
  this.ctx.stroke();
};

// Draw the voltage output graph.
TimerGraph.prototype.drawOutput = function () {
  var lastOnVal, on, x, y, plotWidth, dx, tcnt, highY, lowY;
  dx = 1;
  highY = this.originY + 40;
  lowY = this.originY + 80;
  plotWidth = this.canvasEl.width-this.rightMargin-28;
  this.ctx.beginPath();
  this.ctx.strokeStyle = "black";
  this.ctx.fillStyle = "black";
  lastOnVal = this.isOn(0);
  for (x = 0; x < plotWidth; x += 1) {
    var ix = this.iscale(x);
    tcnt = this.TCNT_at(ix, this.top);
    on = this.isOn(tcnt);
    if (on !== lastOnVal) {
      // Voltage change needs a vertical line.
      this.ctx.moveTo(this.originX + x, lowY);
      this.ctx.lineTo(this.originX + x, highY);
    }
    else {
      if (on) {
        y = highY;
      }
      else {
        y = lowY;
      }
      this.ctx.moveTo(this.originX + x, y);
      this.ctx.lineTo(this.originX + x + dx, y);
    }
    lastOnVal = on;
  }
  this.ctx.stroke();
};

TimerGraph.prototype.getPrescaler = function () {
  return {
    1: 1,
    2: 8,
    3: 64,
    4: 256,
    5: 1024,
  }[this.cs];
};

TimerGraph.prototype.calculateFrequency = function () {
  if ([5, 6, 7, 14, 15].indexOf(this.wgm) !== -1) {
    return this.procFreq / (this.getPrescaler() * (1 + this.top));
  }
  else {
    return this.procFreq / (2 * this.getPrescaler() * (1 + this.top));
  }
};

TimerGraph.prototype.drawScaleTicks = function () {
  var freq = this.calculateFrequency();
  var xoffset;
  if ([5, 6, 7, 14, 15].indexOf(this.wgm) !== -1) {
    xoffset = this.scale(this.top);
  }
  else {
    xoffset = this.scale(this.top*2);
  }
  this.ctx.beginPath();
  this.ctx.fillStyle = 'black';
  this.ctx.strokeStyle = 'black';
  this.ctx.moveTo(this.originX + xoffset, this.originY);
  this.ctx.lineTo(this.originX + xoffset, this.originY + 7);
  this.ctx.fillText(sprintf("F = %.2f Hz", freq), this.originX + xoffset, this.originY + 20);
  this.ctx.stroke();
};

TimerGraph.prototype.plot = function () {
  this.resetCanvas();
  if (!this.isImplemented()) {
    this.ctx.fillStyle = "#DDDDDD";
    this.ctx.fillRect(0, 0, this.canvasEl.width, this.canvasEl.height);
    this.ctx.fillStyle = "black";
    this.ctx.fillText("Sorry, I haven't made a visualization for that mode yet", this.canvasEl.width / 2.0 - 120, this.canvasEl.height / 2.0);
    return;
  }
  else {
    this.drawAxes();
    this.drawScaleTicks();
    this.drawGraph();
    this.drawSpecialLines(); // OCR, TOP
    this.drawOutput();
  }
};
window.TimerGraph = TimerGraph;
}());
