/**
 * Code to draw a visualization of Timer1's fast PWM mode.
 */
(function () {
window.timer1_graph = function (ocr1a, top, com, not_implemented) {
  // Set up the Canvas and its dimensions

  var canvasEl = document.getElementById('timer-vis-plot');
  canvasEl.width = 600;
  canvasEl.height = 500;
  var ctx = canvasEl.getContext('2d');
  var leftMargin = 100;
  var bottomMargin = 200;
  var topMargin = 0;
  var rightMargin = 0;
  var originX = leftMargin;
  var originY = canvasEl.height - bottomMargin;

  if (not_implemented) {
    ctx.fillStyle = "#DDDDDD";
    ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);
    ctx.fillStyle = "black";
    ctx.fillText("Sorry, I haven't made a visualization for that mode yet", canvasEl.width / 2.0 - 120, canvasEl.height / 2.0);
    return;
  }

  // Draw axes

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);
  ctx.strokeStyle = 'black';
  ctx.fillStyle = "black";
  ctx.moveTo(leftMargin, originY);
  ctx.lineTo(leftMargin, topMargin);
  ctx.moveTo(leftMargin, originY);
  ctx.lineTo(canvasEl.width-rightMargin, originY);
  ctx.fillText("TCNT1", leftMargin - 40, topMargin + 20);
  ctx.fillText("Time (in clock cycles)", originX + (canvasEl.width - leftMargin - rightMargin)/2, canvasEl.height - bottomMargin+15);
  ctx.stroke();

  // Timer settings

  //  var top = 0xFF; // TOP as defined in the manual
  //  var ocr1a = 0x7F; // Output Compare Register

  // How wide is the smallest interval we draw on the graph?
  var dx = 1;

  // TCNT is the Timer Control/Counter Register
  var TCNT_at = function (x, top) { return x % top; };

  var x = 0;
  var highlow = 0;
  var scaler = (top+200)/(canvasEl.height - rightMargin - leftMargin);
  //  var scaleHeight = function (h) { return (h/scaler); };

  var draw_on = function () {
    ctx.fillStyle = '#AAAAAA'; // Colour of the HIGH portion of the graph

    // Draw the voltage below the graph

    ctx.moveTo(originX + x, originY + 40);
    ctx.lineTo(originX + x +dx, originY + 40);

    // Draw a vertical line if we're changing voltage

    if (highlow != 1) {
      ctx.moveTo(originX + x, originY + 80);
      ctx.lineTo(originX + x, originY + 40);
    }
    highlow = 1;
  };
  var draw_off = function () {
    ctx.fillStyle = '#888888'; // Colour of the LOW portion of the graph

    // Draw the voltage below the graph

    ctx.moveTo(originX + x, originY + 80);
    ctx.lineTo(originX + x +dx, originY + 80);

    // Draw a vertical line if we're changing voltage

    if (highlow != 0) {
      ctx.moveTo(originX + x, originY + 40);
      ctx.lineTo(originX + x, originY + 80);
    }
    highlow = 0;
  };

  for (x = 0; x < canvasEl.width-rightMargin-28-dx; x += dx) {
    var h = TCNT_at(x, top);
    ctx.strokeStyle = 'black';
    if (h > ocr1a) {
      if (com == 3) { draw_on(); } else { draw_off(); }
    }
    else {
      if (com == 3) { draw_off(); } else { draw_on(); }
    }

    // Plot the value on the graph
    ctx.fillRect(originX + x, originY, dx, -h);
    ctx.stroke();
  }
  ctx.stroke();

  // Draw lines for HIGH and LOW in the graph of OC1A below the plot
  
  ctx.beginPath();
  ctx.fillStyle = 'red';
  ctx.strokeStyle = 'red';
  ctx.moveTo(0, originY + 40);
  ctx.lineTo(canvasEl.width - rightMargin, originY + 40);
  ctx.fillText("HIGH", originX - 80, originY + 40);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.fillStyle = 'blue';
  ctx.strokeStyle = 'blue';
  ctx.moveTo(0, originY + 80);
  ctx.lineTo(canvasEl.width - rightMargin, originY + 80);
  ctx.fillText("LOW", originX - 80, originY + 80);
  ctx.stroke();

  // Draw a line denoting the TOP value

  ctx.beginPath();
  ctx.font = "bold 12px sans-serif";
  ctx.fillStyle = 'blue';
  ctx.strokeStyle = 'blue';
  ctx.moveTo(0, originY - top);
  ctx.lineTo(canvasEl.width - rightMargin, originY - top);
  ctx.fillText("TOP (" + top + ")", originX - 60, originY - top - 5);
  ctx.stroke();

  // Draw a line denoting the OCR1A value

  ctx.beginPath();
  ctx.fillStyle = 'green';
  ctx.strokeStyle = 'green';
  ctx.moveTo(0, originY - ocr1a);
  ctx.lineTo(canvasEl.width - rightMargin, originY - ocr1a);
  ctx.fillText("OCR1A (" + ocr1a + ")", originX - 80, originY - ocr1a - 5);
  ctx.stroke();
};
}());
