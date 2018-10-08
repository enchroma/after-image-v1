window.BASE_PATH = '';
if (process.env.NODE_ENV === 'production') {
  window.BASE_PATH = '/after-image-v1/';
}
var helpers = require('./helpers');
var loop = require('raf-loop');

//get output div by its class
var outputDumpEl = document.querySelector('#output');
outputDumpEl.style.display = 'none';
var outputSlidersEl = document.querySelector('.output-sliders');
var outputEl = document.querySelector('.output');
var c = document.getElementById('myCanvas');
c.width = window.innerWidth;
c.height = window.innerHeight;
console.log(window.innerHeight);
console.log(window.innerWidth);
var ColorLibrary = net.brehaut.Color;
var ctx = c.getContext('2d');

var testsEl = document.querySelector('.tests');
testsEl.style.visibility = 'hidden';

var testBtn = document.querySelector('.test-btn');
testBtn.addEventListener('click', e => {
  testsEl.style.visibility = testsEl.style.visibility === 'visible' ? 'hidden' : 'visible';
});

const createTestButton = name => {
  const el = document.createElement('button');
  el.setAttribute('value', name);
  el.innerText = name;
  testsEl.appendChild(el);
  return el;
};

//**************
/// MATCHING COLOR
//**************

var HIDE_SLIDERS = true;
var USE_HSL = false;
var SLIDER_START_VALUES = [
  USE_HSL ? 180 : Math.round(0.999 * 255),
  USE_HSL ? 0.5 : Math.round(0.999 * 255),
  USE_HSL ? 0.5 : Math.round(0.999 * 255),
];

var UserColor = ColorLibrary([SLIDER_START_VALUES[0], SLIDER_START_VALUES[1], SLIDER_START_VALUES[2]]);
if (USE_HSL) {
  UserColor = UserColor.toHSL();
}

if (HIDE_SLIDERS) {
  outputSlidersEl.style.display = 'none';
}

//**************
/// HELPER FUNCTIONS
//**************

if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = (function() {
    return (
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
        window.setTimeout(callback, 1000 / 60);
      }
    );
  })();
}

if (!window.perfomance || !window.perfomance.now) {
  Date.now ||
    (Date.now = function() {
      return new this().getTime();
    });

  (window.perfomance || (window.perfomance = {})).now = function() {
    return Date.now() - offset;
  };

  var offset =
    (window.perfomance.timing || (window.perfomance.timing = {})).navigatorStart || (window.perfomance.timing.navigatorStart = Date.now());
}

function userColorRGB() {
  var r = UserColor.getRed();
  var g = UserColor.getGreen();
  var b = UserColor.getBlue();
  if (USE_HSL) {
    var rgb = UserColor.toRGB();
    r = Math.round(rgb.red * 255);
    g = Math.round(rgb.green * 255);
    b = Math.round(rgb.blue * 255);
  }
  return 'rgb(' + r + ', ' + g + ', ' + b + ')';
}

function rgbToHSL(r, g, b, css) {
  (r /= 255), (g /= 255), (b /= 255);

  var max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  var h,
    s,
    l = (max + min) / 2;

  if (max == min) {
    h = s = 0; // achromatic
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }
  if (!css) {
    return [parseFloat((h * 100).toFixed(1)), parseFloat((s * 100).toFixed(1)), parseFloat(l.toFixed(1))];
  }
  return 'hsl(' + (h * 100).toFixed(1) + '% , ' + (s * 100).toFixed(1) + '% , ' + l.toFixed(1) + ')';
}

var RGBToHex = function(r, g, b) {
  var bin = (r << 16) | (g << 8) | b;
  return (function(h) {
    return new Array(7 - h.length).join('0') + h;
  })(bin.toString(16).toUpperCase());
};

function convertArrayOfObjectsToCSV(args) {
  var result, ctr, keys, columnDelimiter, lineDelimiter, data;

  data = args.data || null;
  if (data == null || !data.length) {
    return null;
  }

  columnDelimiter = args.columnDelimiter || ',';
  lineDelimiter = args.lineDelimiter || '\n';

  keys = Object.keys(data[0]);

  result = '';
  result += keys.join(columnDelimiter);
  result += lineDelimiter;

  data.forEach(function(item) {
    ctr = 0;
    keys.forEach(function(key) {
      if (ctr > 0) result += columnDelimiter;

      result += item[key];
      ctr++;
    });
    result += lineDelimiter;
  });

  return result;
}

function downloadCSV(obj) {
  var data, filename, link;
  var csv = convertArrayOfObjectsToCSV({
    data: obj.data,
  });
  if (csv == null) return;
  var date = new Date();
  date.toLocaleString('en-us', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  outputDumpEl.style.display = 'block';
  outputDumpEl.innerHTML = csv;

  filename = obj.filename || date + '.csv';

  if (!csv.match(/^data:text\/csv/i)) {
    csv = 'data:text/csv;charset=utf-8,' + csv;
  }
  data = encodeURI(csv);

  link = document.createElement('a');
  link.setAttribute('href', data);
  link.setAttribute('download', filename);
  // link.click();
}

//**************
/// RESIZE HELPER FUNCTIONS
//**************

var radius;
var leftCIrcleX;
/*
  !!!!
  Control size of circle,
  smaller = bigger
  */
var CIRCLE_RADIUS_DEVISOR = 3;

function getScreenSize() {
  radius = Math.min(Math.min(window.innerWidth, window.innerHeight) / CIRCLE_RADIUS_DEVISOR, 300); // value to scale the circles, max radius of 300
  leftCIrcleX = Math.max(window.innerWidth / (HIDE_SLIDERS ? 2 : 4), radius + 20); //20 pixels minimum from the side
  console.log(window.innerHeight);
  console.log(window.innerWidth);
  c.width = window.innerWidth;
  c.height = window.innerHeight;
  outputEl.style.width = window.innerWidth - leftCIrcleX * 2 - 70 + 'px';
}

/*
  CREATE A SLIDER
  */
function createSlider(element, color, min, max) {
  noUiSlider.create(element, {
    start: [color],
    direction: 'rtl',
    orientation: 'vertical',
    connect: true,
    range: {
      min: min,
      max: max,
    },
  });
}

var HIDE_SLIDERS_DURING_TEST = false;

var hexEl = document.getElementById('hex');
var rgbEl = document.getElementById('rgb');
var hslEl = document.getElementById('hsl');
var sliderLabelEls = document.querySelectorAll('.slider-label');
var rSliderEl = document.querySelector('.slider--red');
var gSliderEl = document.querySelector('.slider--green');
var bSliderEl = document.querySelector('.slider--blue');
var outputItemsEl = document.querySelector('.output-items');
var downloadEl = document.querySelector('.download');
var testCompleteEl = document.querySelector('.test--complete');
/*HIDE ELEMENTS*/
outputItemsEl.style.display = 'none';

/*EXPORT CSV*/
downloadEl.addEventListener('click', function() {
  downloadCSV({ data: OUTPUT_DATA });
});

//boom,boom,boom
createSlider(rSliderEl, SLIDER_START_VALUES[0], 0, USE_HSL ? 360 : 255);
createSlider(gSliderEl, SLIDER_START_VALUES[1], 0, USE_HSL ? 1 : 255);
createSlider(bSliderEl, SLIDER_START_VALUES[2], 0, USE_HSL ? 1 : 255);

//!!!!!!!!!!! we hide this in the .CSS
function updateOutput() {
  hexEl.innerText = '#' + RGBToHex(UserColor.getRed(), UserColor.getGreen(), UserColor.getBlue()); //UserColor.toCSS(1)
  rgbEl.innerText = userColorRGB();
  hslEl.innerText = rgbToHSL(UserColor.getRed(), UserColor.getGreen(), UserColor.getBlue());
}

/*
  TEST LOOP BELOW !!!
  */

//***********
// SETUP FROM CONFIG.JSON
//***********
let tests = [];
let testNumber = 0;
let activeTest;
let _timeElapsed = performance.now();

let OUTPUT_DATA = [];

//***********
// internal variables
//***********
let _paused = false;
let _engine = false;
let _testIndex = 0;
let _testSequence = [];

function resetTest() {
  outputDumpEl.style.display = 'none';
  outputItemsEl.style.display = 'none';
  _testSequence.length = 0;
  _timeElapsed = 0;
  _testIndex = 0;
}

function beginTest() {
  setTestTimings();
  getScreenSize();
  _timeElapsed = 0;
  console.log(_testSequence);
  _paused = false;
}

function completeTest() {
  _paused = true;
  outputItemsEl.style.display = 'block';
}

function pauseTest() {
  _paused = true;
}

//***********
// internal setup function
//***********
function setTestTimings() {
  var _time = 0;

  activeTest.RGB_TEST_VALUES.forEach(function(_, i) {
    _time += activeTest.STARE_DURATION;
    /*
      Testing testObject
      */
    _testSequence.push({
      endTime: _time,
      leftCircleRGB: activeTest.RGB_TEST_VALUES[i],
      leftCircleHSL: rgbToHSL(...activeTest.RGB_TEST_VALUES[i]),
      rightCircleRGB: activeTest.BACKGROUND_GREY,
      isMatchingMode: false,
    });

    _time += activeTest.MATCH_DURATION;
    /*
      Matching testObject
      */
    _testSequence.push({
      endTime: _time,
      leftCircleRGB: activeTest.WHITE,
      rightCircleRGB: activeTest.WHITE, // will be overwritten by UserColor
      isMatchingMode: true,
    });

    _time += activeTest.RESET_DURATION;

    if (activeTest.RESET_DURATION) {
      /*
      RESET
      reset testObject
      */
      _testSequence.push({
        endTime: _time,
        leftCircleRGB: activeTest.BACKGROUND_GREY,
        rightCircleRGB: activeTest.BACKGROUND_GREY,
        isResetingMode: true,
        isMatchingMode: false,
      });
    }
  });
}

//***********
// DRAWING!!!
/*
    This is a loop at 60fps
    we measure elapsed time at the end to step through the timings
  */
//***********
_engine = loop(function(dt) {
  var now = performance.now();
  if (_paused) return;
  //check to see if completed, anc cancek out if so
  if (_testIndex > _testSequence.length - 1) {
    resetTest();
    pauseTest();
    return;
  }

  //pick the testObject out
  var testObject = _testSequence[_testIndex];
  //short hand access
  var isMatchingMode = testObject.isMatchingMode;
  var isResetingMode = testObject.isResetingMode;

  // console.log(testObject);
  /*
    Wipe the canvas
    */
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  /*
    Backgrround color
    */

  ctx.fillStyle = 'rgb(' + activeTest.BACKGROUND_GREY.join(',') + ')';
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  if (!isResetingMode) {
    ctx.strokeStyle = 'rgb(0,0,0)';
    ctx.lineWidth = 1;

    /*
      Left circle
      */
    ctx.beginPath();
    ctx.arc(leftCIrcleX, window.innerHeight / 2, radius, 0.5 * Math.PI, 1.5 * Math.PI, false);
    ctx.closePath();
    ctx.fillStyle = 'rgb(' + testObject.leftCircleRGB.join(',') + ')';
    ctx.fill();
    ctx.stroke();

    /*
      Right circle
      */
    ctx.beginPath();
    ctx.arc(leftCIrcleX, window.innerHeight / 2, radius, 0.5 * Math.PI, 1.5 * Math.PI, true);
    ctx.closePath();
    if (isMatchingMode) {
      ctx.fillStyle = userColorRGB();
    } else {
      ctx.fillStyle = 'rgb(' + testObject.rightCircleRGB.join(',') + ')';
    }
    ctx.fill();
    ctx.stroke();

    /*
    Focus circle
    */
    var remappedTime = now * 0.002;
    ctx.setLineDash([]);
    ctx.beginPath();
    var _cos = Math.abs(Math.cos(remappedTime));
    var _sin = Math.abs(Math.sin(remappedTime));
    var _tan = Math.atan(_sin / _cos);
    if (ctx.ellipse) {
      ctx.ellipse(
        leftCIrcleX, //x
        window.innerHeight / 2, //y
        _cos * 2.5 + 2.5, //radiusX
        _sin * 2.5 + 2.5, //radiusY
        45 * Math.PI / 180,
        0,
        2 * Math.PI,
      );
    } else {
      ctx.arc(
        leftCIrcleX, //x
        window.innerHeight / 2, //y
        _cos * 0.5 + 4.5,
        0,
        2 * Math.PI,
        true,
      );
    }
    ctx.fillStyle = 'rgb(0,0,0)';
    ctx.fill();
  }

  /*
    Check timings
    */
  //console.log('_timeElapsed', now);
  _timeElapsed += dt;
  if (_timeElapsed > testObject.endTime) {
    //write the data out
    if (isMatchingMode) {
      captureData(_testSequence[_testIndex - 1]);
    }
    if (_testSequence.length - 1 === _testIndex) {
      completeTest();
    }

    _testIndex++;
  }
});

function captureData(testObject) {
  var date = new Date();
  date.toLocaleString('en-us', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  OUTPUT_DATA.push({
    Test_Type: 'AF',
    R: testObject.leftCircleRGB[0],
    G: testObject.leftCircleRGB[1],
    B: testObject.leftCircleRGB[2],

    H: testObject.leftCircleHSL[0],
    S: testObject.leftCircleHSL[1],
    L: testObject.leftCircleHSL[2],
    timestamp: date,
  });
  var _hsl = rgbToHSL(...[UserColor.getRed(), UserColor.getGreen(), UserColor.getBlue()]);
  OUTPUT_DATA.push({
    Test_Type: 'MF',
    R: UserColor.getRed(),
    G: UserColor.getGreen(),
    B: UserColor.getBlue(),
    H: _hsl[0],
    S: _hsl[1],
    L: _hsl[2],
    timestamp: date,
  });

  // console.log(OUTPUT_DATA);
}

window.addEventListener('resize', function(e) {
  // getScreenSize();
});

rSliderEl.noUiSlider.on('update', function(values) {
  if (USE_HSL) {
    UserColor = UserColor.setHue(Math.round(values[0]));
    sliderLabelEls[0].innerText = UserColor.getHue();
  } else {
    UserColor = UserColor.setRed(Math.round(values[0]));
    sliderLabelEls[0].innerText = UserColor.getRed();
  }
  updateOutput();
});
gSliderEl.noUiSlider.on('update', function(values) {
  if (USE_HSL) {
    UserColor = UserColor.setSaturation(values[0]);
    sliderLabelEls[1].innerText = UserColor.getSaturation();
  } else {
    UserColor = UserColor.setGreen(Math.round(values[0]));
    sliderLabelEls[1].innerText = UserColor.getGreen();
  }
  updateOutput();
});
bSliderEl.noUiSlider.on('update', function(values) {
  if (USE_HSL) {
    UserColor = UserColor.setLightness(values[0]);
    sliderLabelEls[2].innerText = UserColor.getLightness();
  } else {
    UserColor = UserColor.setBlue(Math.round(values[0]));
    sliderLabelEls[2].innerText = UserColor.getBlue();
  }
  updateOutput();
});

window.loadConfig((err, res) => {
  tests = [...res];
  activeTest = tests[testNumber];
  const btns = tests.map((test, i) => createTestButton(test.TEST_NAME));
  btns.forEach((btn, i) =>
    btn.addEventListener('click', function(e) {
      pauseTest();
      testNumber = i;
      activeTest = tests[testNumber];
      resetTest();
      beginTest();
    }),
  );
  beginTest();
  _engine.start();
});
