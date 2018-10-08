(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

var xhr = require('xhr-request');
//**************
/// HELPER FUNCTIONS
//**************

if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = function () {
    return window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function ( /* function FrameRequestCallback */callback, /* DOMElement Element */element) {
      window.setTimeout(callback, 1000 / 60);
    };
  }();
}

if (!window.perfomance || !window.perfomance.now) {
  Date.now || (Date.now = function () {
    return new this().getTime();
  });
  (window.perfomance || (window.perfomance = {})).now = function () {
    return Date.now() - offset;
  };

  var offset = (window.perfomance.timing || (window.perfomance.timing = {})).navigatorStart || (window.perfomance.timing.navigatorStart = Date.now());
}

//**************
/// MATCHING COLOR
//**************

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
  r /= 255, g /= 255, b /= 255;

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

var RGBToHex = function RGBToHex(r, g, b) {
  var bin = r << 16 | g << 8 | b;
  return function (h) {
    return new Array(7 - h.length).join('0') + h;
  }(bin.toString(16).toUpperCase());
};

window.convertArrayOfObjectsToCSV = function (args) {
  var result, ctr, keys, columnDelimiter, lineDelimiter, data;

  data = args.data || null;
  if (data == null || !data.length) {
    return null;
  }

  columnDelimiter = args.columnDelimiter || ',';
  lineDelimiter = args.lineDelimiter || '&#013;&#010;';

  keys = Object.keys(data[0]);

  result = '';
  result += keys.join(columnDelimiter);
  result += lineDelimiter;

  data.forEach(function (item) {
    ctr = 0;
    keys.forEach(function (key) {
      if (ctr > 0) result += columnDelimiter;

      result += item[key];
      ctr++;
    });
    result += lineDelimiter;
  });

  return result;
};

window.downloadCSV = function (obj) {
  var data, filename, link;
  var csv = convertArrayOfObjectsToCSV({
    data: obj.data
  });
  if (csv == null) return;
  var date = new Date();
  date.toLocaleString('en-us', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  filename = obj.filename || date + '.csv';

  if (!csv.match(/^data:text\/csv/i)) {
    csv = 'data:text/csv;charset=utf-8,' + csv;
    data = encodeURI(csv);
  }

  link = document.createElement('a');
  link.setAttribute('href', data);
  link.setAttribute('download', filename);
  link.click();

  return csv;
};

window.loadConfig = function (cb) {
  xhr(window.BASE_PATH + 'config.json', { json: true }, cb);
};

},{"xhr-request":14}],2:[function(require,module,exports){
'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

window.BASE_PATH = '';
if ("production" === 'production') {
  window.BASE_PATH = '/after-image-v1/';
}
var helpers = require('./helpers');

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
testBtn.addEventListener('click', function (e) {
  testsEl.style.visibility = testsEl.style.visibility === 'visible' ? 'hidden' : 'visible';
});

var createTestButton = function createTestButton(name) {
  var el = document.createElement('button');
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
var SLIDER_START_VALUES = [USE_HSL ? 180 : Math.round(0.999 * 255), USE_HSL ? 0.5 : Math.round(0.999 * 255), USE_HSL ? 0.5 : Math.round(0.999 * 255)];

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
  window.requestAnimationFrame = function () {
    return window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function ( /* function FrameRequestCallback */callback, /* DOMElement Element */element) {
      window.setTimeout(callback, 1000 / 60);
    };
  }();
}

if (!window.perfomance || !window.perfomance.now) {
  Date.now || (Date.now = function () {
    return new this().getTime();
  });

  (window.perfomance || (window.perfomance = {})).now = function () {
    return Date.now() - offset;
  };

  var offset = (window.perfomance.timing || (window.perfomance.timing = {})).navigatorStart || (window.perfomance.timing.navigatorStart = Date.now());
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
  r /= 255, g /= 255, b /= 255;

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

var RGBToHex = function RGBToHex(r, g, b) {
  var bin = r << 16 | g << 8 | b;
  return function (h) {
    return new Array(7 - h.length).join('0') + h;
  }(bin.toString(16).toUpperCase());
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

  data.forEach(function (item) {
    ctr = 0;
    keys.forEach(function (key) {
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
    data: obj.data
  });
  if (csv == null) return;
  var date = new Date();
  date.toLocaleString('en-us', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
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
      max: max
    }
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
downloadEl.addEventListener('click', function () {
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
var tests = [];
var testNumber = 0;
var activeTest = void 0;
var _timeElapsed = performance.now();

var OUTPUT_DATA = [];

//***********
// internal variables
//***********
var _paused = false;
var _testIndex = 0;
var _testSequence = [];

function resetTest() {
  outputDumpEl.style.display = 'none';
  outputItemsEl.style.display = 'none';
  _testSequence.length = 0;
  _testIndex = 0;
}

function beginTest() {
  _timeElapsed = performance.now();
  _paused = false;
  setTestTimings();
  getScreenSize();
  drawCanvas();
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

  activeTest.RGB_TEST_VALUES.forEach(function (_, i) {
    _time += activeTest.STARE_DURATION;
    /*
      Testing testObject
      */
    _testSequence.push({
      endTime: _time,
      leftCircleRGB: activeTest.RGB_TEST_VALUES[i],
      leftCircleHSL: rgbToHSL.apply(undefined, _toConsumableArray(activeTest.RGB_TEST_VALUES[i])),
      rightCircleRGB: activeTest.BACKGROUND_GREY,
      isMatchingMode: false
    });

    _time += activeTest.MATCH_DURATION;
    /*
      Matching testObject
      */
    _testSequence.push({
      endTime: _time,
      leftCircleRGB: activeTest.WHITE,
      rightCircleRGB: activeTest.WHITE, // will be overwritten by UserColor
      isMatchingMode: true
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
        isMatchingMode: false
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
var _cc = 0;
function drawCanvas() {
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
      ctx.ellipse(leftCIrcleX, //x
      window.innerHeight / 2, //y
      _cos * 2.5 + 2.5, //radiusX
      _sin * 2.5 + 2.5, //radiusY
      45 * Math.PI / 180, 0, 2 * Math.PI);
    } else {
      ctx.arc(leftCIrcleX, //x
      window.innerHeight / 2, //y
      _cos * 0.5 + 4.5, 0, 2 * Math.PI, true);
    }
    ctx.fillStyle = 'rgb(0,0,0)';
    ctx.fill();
  }

  /*
    Check timings
    */
  _timeElapsed = now - _timeElapsed;
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
  _cc++;
  if (_cc < 300) {}
  //  requestAnimationFrame(drawCanvas);


  //loop!!
  requestAnimationFrame(drawCanvas);
}

function captureData(testObject) {
  var date = new Date();
  date.toLocaleString('en-us', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  OUTPUT_DATA.push({
    Test_Type: 'AF',
    R: testObject.leftCircleRGB[0],
    G: testObject.leftCircleRGB[1],
    B: testObject.leftCircleRGB[2],

    H: testObject.leftCircleHSL[0],
    S: testObject.leftCircleHSL[1],
    L: testObject.leftCircleHSL[2],
    timestamp: date
  });
  var _hsl = rgbToHSL.apply(undefined, [UserColor.getRed(), UserColor.getGreen(), UserColor.getBlue()]);
  OUTPUT_DATA.push({
    Test_Type: 'MF',
    R: UserColor.getRed(),
    G: UserColor.getGreen(),
    B: UserColor.getBlue(),
    H: _hsl[0],
    S: _hsl[1],
    L: _hsl[2],
    timestamp: date
  });

  // console.log(OUTPUT_DATA);
}

window.addEventListener('resize', function (e) {
  // getScreenSize();
});

rSliderEl.noUiSlider.on('update', function (values) {
  if (USE_HSL) {
    UserColor = UserColor.setHue(Math.round(values[0]));
    sliderLabelEls[0].innerText = UserColor.getHue();
  } else {
    UserColor = UserColor.setRed(Math.round(values[0]));
    sliderLabelEls[0].innerText = UserColor.getRed();
  }
  updateOutput();
});
gSliderEl.noUiSlider.on('update', function (values) {
  if (USE_HSL) {
    UserColor = UserColor.setSaturation(values[0]);
    sliderLabelEls[1].innerText = UserColor.getSaturation();
  } else {
    UserColor = UserColor.setGreen(Math.round(values[0]));
    sliderLabelEls[1].innerText = UserColor.getGreen();
  }
  updateOutput();
});
bSliderEl.noUiSlider.on('update', function (values) {
  if (USE_HSL) {
    UserColor = UserColor.setLightness(values[0]);
    sliderLabelEls[2].innerText = UserColor.getLightness();
  } else {
    UserColor = UserColor.setBlue(Math.round(values[0]));
    sliderLabelEls[2].innerText = UserColor.getBlue();
  }
  updateOutput();
});

window.loadConfig(function (err, res) {
  tests = [].concat(_toConsumableArray(res));
  activeTest = tests[testNumber];
  var btns = tests.map(function (test, i) {
    return createTestButton(test.TEST_NAME);
  });
  btns.forEach(function (btn, i) {
    return btn.addEventListener('click', function (e) {
      pauseTest();
      testNumber = i;
      activeTest = tests[testNumber];
      resetTest();
      beginTest();
    });
  });
  beginTest();
});

},{"./helpers":1}],3:[function(require,module,exports){
'use strict';
var token = '%[a-f0-9]{2}';
var singleMatcher = new RegExp(token, 'gi');
var multiMatcher = new RegExp('(' + token + ')+', 'gi');

function decodeComponents(components, split) {
	try {
		// Try to decode the entire string first
		return decodeURIComponent(components.join(''));
	} catch (err) {
		// Do nothing
	}

	if (components.length === 1) {
		return components;
	}

	split = split || 1;

	// Split the array in 2 parts
	var left = components.slice(0, split);
	var right = components.slice(split);

	return Array.prototype.concat.call([], decodeComponents(left), decodeComponents(right));
}

function decode(input) {
	try {
		return decodeURIComponent(input);
	} catch (err) {
		var tokens = input.match(singleMatcher);

		for (var i = 1; i < tokens.length; i++) {
			input = decodeComponents(tokens, i).join('');

			tokens = input.match(singleMatcher);
		}

		return input;
	}
}

function customDecodeURIComponent(input) {
	// Keep track of all the replacements and prefill the map with the `BOM`
	var replaceMap = {
		'%FE%FF': '\uFFFD\uFFFD',
		'%FF%FE': '\uFFFD\uFFFD'
	};

	var match = multiMatcher.exec(input);
	while (match) {
		try {
			// Decode as big chunks as possible
			replaceMap[match[0]] = decodeURIComponent(match[0]);
		} catch (err) {
			var result = decode(match[0]);

			if (result !== match[0]) {
				replaceMap[match[0]] = result;
			}
		}

		match = multiMatcher.exec(input);
	}

	// Add `%C2` at the end of the map to make sure it does not replace the combinator before everything else
	replaceMap['%C2'] = '\uFFFD';

	var entries = Object.keys(replaceMap);

	for (var i = 0; i < entries.length; i++) {
		// Replace all decoded components
		var key = entries[i];
		input = input.replace(new RegExp(key, 'g'), replaceMap[key]);
	}

	return input;
}

module.exports = function (encodedURI) {
	if (typeof encodedURI !== 'string') {
		throw new TypeError('Expected `encodedURI` to be of type `string`, got `' + typeof encodedURI + '`');
	}

	try {
		encodedURI = encodedURI.replace(/\+/g, ' ');

		// Try the built in decoder first
		return decodeURIComponent(encodedURI);
	} catch (err) {
		// Fallback to a more advanced decoder
		return customDecodeURIComponent(encodedURI);
	}
};

},{}],4:[function(require,module,exports){
'use strict';

var isCallable = require('is-callable');

var toStr = Object.prototype.toString;
var hasOwnProperty = Object.prototype.hasOwnProperty;

var forEachArray = function forEachArray(array, iterator, receiver) {
    for (var i = 0, len = array.length; i < len; i++) {
        if (hasOwnProperty.call(array, i)) {
            if (receiver == null) {
                iterator(array[i], i, array);
            } else {
                iterator.call(receiver, array[i], i, array);
            }
        }
    }
};

var forEachString = function forEachString(string, iterator, receiver) {
    for (var i = 0, len = string.length; i < len; i++) {
        // no such thing as a sparse string.
        if (receiver == null) {
            iterator(string.charAt(i), i, string);
        } else {
            iterator.call(receiver, string.charAt(i), i, string);
        }
    }
};

var forEachObject = function forEachObject(object, iterator, receiver) {
    for (var k in object) {
        if (hasOwnProperty.call(object, k)) {
            if (receiver == null) {
                iterator(object[k], k, object);
            } else {
                iterator.call(receiver, object[k], k, object);
            }
        }
    }
};

var forEach = function forEach(list, iterator, thisArg) {
    if (!isCallable(iterator)) {
        throw new TypeError('iterator must be a function');
    }

    var receiver;
    if (arguments.length >= 3) {
        receiver = thisArg;
    }

    if (toStr.call(list) === '[object Array]') {
        forEachArray(list, iterator, receiver);
    } else if (typeof list === 'string') {
        forEachString(list, iterator, receiver);
    } else {
        forEachObject(list, iterator, receiver);
    }
};

module.exports = forEach;

},{"is-callable":6}],5:[function(require,module,exports){
(function (global){
var win;

if (typeof window !== "undefined") {
    win = window;
} else if (typeof global !== "undefined") {
    win = global;
} else if (typeof self !== "undefined"){
    win = self;
} else {
    win = {};
}

module.exports = win;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],6:[function(require,module,exports){
'use strict';

var fnToStr = Function.prototype.toString;

var constructorRegex = /^\s*class /;
var isES6ClassFn = function isES6ClassFn(value) {
	try {
		var fnStr = fnToStr.call(value);
		var singleStripped = fnStr.replace(/\/\/.*\n/g, '');
		var multiStripped = singleStripped.replace(/\/\*[.\s\S]*\*\//g, '');
		var spaceStripped = multiStripped.replace(/\n/mg, ' ').replace(/ {2}/g, ' ');
		return constructorRegex.test(spaceStripped);
	} catch (e) {
		return false; // not a function
	}
};

var tryFunctionObject = function tryFunctionObject(value) {
	try {
		if (isES6ClassFn(value)) { return false; }
		fnToStr.call(value);
		return true;
	} catch (e) {
		return false;
	}
};
var toStr = Object.prototype.toString;
var fnClass = '[object Function]';
var genClass = '[object GeneratorFunction]';
var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';

module.exports = function isCallable(value) {
	if (!value) { return false; }
	if (typeof value !== 'function' && typeof value !== 'object') { return false; }
	if (hasToStringTag) { return tryFunctionObject(value); }
	if (isES6ClassFn(value)) { return false; }
	var strClass = toStr.call(value);
	return strClass === fnClass || strClass === genClass;
};

},{}],7:[function(require,module,exports){
module.exports = isFunction

var toString = Object.prototype.toString

function isFunction (fn) {
  var string = toString.call(fn)
  return string === '[object Function]' ||
    (typeof fn === 'function' && string !== '[object RegExp]') ||
    (typeof window !== 'undefined' &&
     // IE8 and below
     (fn === window.setTimeout ||
      fn === window.alert ||
      fn === window.confirm ||
      fn === window.prompt))
};

},{}],8:[function(require,module,exports){
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/

'use strict';
/* eslint-disable no-unused-vars */
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (err) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

module.exports = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (getOwnPropertySymbols) {
			symbols = getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

},{}],9:[function(require,module,exports){
var trim = require('trim')
  , forEach = require('for-each')
  , isArray = function(arg) {
      return Object.prototype.toString.call(arg) === '[object Array]';
    }

module.exports = function (headers) {
  if (!headers)
    return {}

  var result = {}

  forEach(
      trim(headers).split('\n')
    , function (row) {
        var index = row.indexOf(':')
          , key = trim(row.slice(0, index)).toLowerCase()
          , value = trim(row.slice(index + 1))

        if (typeof(result[key]) === 'undefined') {
          result[key] = value
        } else if (isArray(result[key])) {
          result[key].push(value)
        } else {
          result[key] = [ result[key], value ]
        }
      }
  )

  return result
}
},{"for-each":4,"trim":12}],10:[function(require,module,exports){
'use strict';
var strictUriEncode = require('strict-uri-encode');
var objectAssign = require('object-assign');
var decodeComponent = require('decode-uri-component');

function encoderForArrayFormat(opts) {
	switch (opts.arrayFormat) {
		case 'index':
			return function (key, value, index) {
				return value === null ? [
					encode(key, opts),
					'[',
					index,
					']'
				].join('') : [
					encode(key, opts),
					'[',
					encode(index, opts),
					']=',
					encode(value, opts)
				].join('');
			};

		case 'bracket':
			return function (key, value) {
				return value === null ? encode(key, opts) : [
					encode(key, opts),
					'[]=',
					encode(value, opts)
				].join('');
			};

		default:
			return function (key, value) {
				return value === null ? encode(key, opts) : [
					encode(key, opts),
					'=',
					encode(value, opts)
				].join('');
			};
	}
}

function parserForArrayFormat(opts) {
	var result;

	switch (opts.arrayFormat) {
		case 'index':
			return function (key, value, accumulator) {
				result = /\[(\d*)\]$/.exec(key);

				key = key.replace(/\[\d*\]$/, '');

				if (!result) {
					accumulator[key] = value;
					return;
				}

				if (accumulator[key] === undefined) {
					accumulator[key] = {};
				}

				accumulator[key][result[1]] = value;
			};

		case 'bracket':
			return function (key, value, accumulator) {
				result = /(\[\])$/.exec(key);
				key = key.replace(/\[\]$/, '');

				if (!result) {
					accumulator[key] = value;
					return;
				} else if (accumulator[key] === undefined) {
					accumulator[key] = [value];
					return;
				}

				accumulator[key] = [].concat(accumulator[key], value);
			};

		default:
			return function (key, value, accumulator) {
				if (accumulator[key] === undefined) {
					accumulator[key] = value;
					return;
				}

				accumulator[key] = [].concat(accumulator[key], value);
			};
	}
}

function encode(value, opts) {
	if (opts.encode) {
		return opts.strict ? strictUriEncode(value) : encodeURIComponent(value);
	}

	return value;
}

function keysSorter(input) {
	if (Array.isArray(input)) {
		return input.sort();
	} else if (typeof input === 'object') {
		return keysSorter(Object.keys(input)).sort(function (a, b) {
			return Number(a) - Number(b);
		}).map(function (key) {
			return input[key];
		});
	}

	return input;
}

function extract(str) {
	var queryStart = str.indexOf('?');
	if (queryStart === -1) {
		return '';
	}
	return str.slice(queryStart + 1);
}

function parse(str, opts) {
	opts = objectAssign({arrayFormat: 'none'}, opts);

	var formatter = parserForArrayFormat(opts);

	// Create an object with no prototype
	// https://github.com/sindresorhus/query-string/issues/47
	var ret = Object.create(null);

	if (typeof str !== 'string') {
		return ret;
	}

	str = str.trim().replace(/^[?#&]/, '');

	if (!str) {
		return ret;
	}

	str.split('&').forEach(function (param) {
		var parts = param.replace(/\+/g, ' ').split('=');
		// Firefox (pre 40) decodes `%3D` to `=`
		// https://github.com/sindresorhus/query-string/pull/37
		var key = parts.shift();
		var val = parts.length > 0 ? parts.join('=') : undefined;

		// missing `=` should be `null`:
		// http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
		val = val === undefined ? null : decodeComponent(val);

		formatter(decodeComponent(key), val, ret);
	});

	return Object.keys(ret).sort().reduce(function (result, key) {
		var val = ret[key];
		if (Boolean(val) && typeof val === 'object' && !Array.isArray(val)) {
			// Sort object keys, not values
			result[key] = keysSorter(val);
		} else {
			result[key] = val;
		}

		return result;
	}, Object.create(null));
}

exports.extract = extract;
exports.parse = parse;

exports.stringify = function (obj, opts) {
	var defaults = {
		encode: true,
		strict: true,
		arrayFormat: 'none'
	};

	opts = objectAssign(defaults, opts);

	if (opts.sort === false) {
		opts.sort = function () {};
	}

	var formatter = encoderForArrayFormat(opts);

	return obj ? Object.keys(obj).sort(opts.sort).map(function (key) {
		var val = obj[key];

		if (val === undefined) {
			return '';
		}

		if (val === null) {
			return encode(key, opts);
		}

		if (Array.isArray(val)) {
			var result = [];

			val.slice().forEach(function (val2) {
				if (val2 === undefined) {
					return;
				}

				result.push(formatter(key, val2, result.length));
			});

			return result.join('&');
		}

		return encode(key, opts) + '=' + encode(val, opts);
	}).filter(function (x) {
		return x.length > 0;
	}).join('&') : '';
};

exports.parseUrl = function (str, opts) {
	return {
		url: str.split('?')[0] || '',
		query: parse(extract(str), opts)
	};
};

},{"decode-uri-component":3,"object-assign":8,"strict-uri-encode":11}],11:[function(require,module,exports){
'use strict';
module.exports = function (str) {
	return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
		return '%' + c.charCodeAt(0).toString(16).toUpperCase();
	});
};

},{}],12:[function(require,module,exports){

exports = module.exports = trim;

function trim(str){
  return str.replace(/^\s*|\s*$/g, '');
}

exports.left = function(str){
  return str.replace(/^\s*/, '');
};

exports.right = function(str){
  return str.replace(/\s*$/, '');
};

},{}],13:[function(require,module,exports){
module.exports = urlSetQuery
function urlSetQuery (url, query) {
  if (query) {
    // remove optional leading symbols
    query = query.trim().replace(/^(\?|#|&)/, '')

    // don't append empty query
    query = query ? ('?' + query) : query

    var parts = url.split(/[\?\#]/)
    var start = parts[0]
    if (query && /\:\/\/[^\/]*$/.test(start)) {
      // e.g. http://foo.com -> http://foo.com/
      start = start + '/'
    }
    var match = url.match(/(\#.*)$/)
    url = start + query
    if (match) { // add hash back in
      url = url + match[0]
    }
  }
  return url
}

},{}],14:[function(require,module,exports){
var queryString = require('query-string')
var setQuery = require('url-set-query')
var assign = require('object-assign')
var ensureHeader = require('./lib/ensure-header.js')

// this is replaced in the browser
var request = require('./lib/request.js')

var mimeTypeJson = 'application/json'
var noop = function () {}

module.exports = xhrRequest
function xhrRequest (url, opt, cb) {
  if (!url || typeof url !== 'string') {
    throw new TypeError('must specify a URL')
  }
  if (typeof opt === 'function') {
    cb = opt
    opt = {}
  }
  if (cb && typeof cb !== 'function') {
    throw new TypeError('expected cb to be undefined or a function')
  }

  cb = cb || noop
  opt = opt || {}

  var defaultResponse = opt.json ? 'json' : 'text'
  opt = assign({ responseType: defaultResponse }, opt)

  var headers = opt.headers || {}
  var method = (opt.method || 'GET').toUpperCase()
  var query = opt.query
  if (query) {
    if (typeof query !== 'string') {
      query = queryString.stringify(query)
    }
    url = setQuery(url, query)
  }

  // allow json response
  if (opt.responseType === 'json') {
    ensureHeader(headers, 'Accept', mimeTypeJson)
  }

  // if body content is json
  if (opt.json && method !== 'GET' && method !== 'HEAD') {
    ensureHeader(headers, 'Content-Type', mimeTypeJson)
    opt.body = JSON.stringify(opt.body)
  }

  opt.method = method
  opt.url = url
  opt.headers = headers
  delete opt.query
  delete opt.json

  return request(opt, cb)
}

},{"./lib/ensure-header.js":15,"./lib/request.js":17,"object-assign":8,"query-string":10,"url-set-query":13}],15:[function(require,module,exports){
module.exports = ensureHeader
function ensureHeader (headers, key, value) {
  var lower = key.toLowerCase()
  if (!headers[key] && !headers[lower]) {
    headers[key] = value
  }
}

},{}],16:[function(require,module,exports){
module.exports = getResponse
function getResponse (opt, resp) {
  if (!resp) return null
  return {
    statusCode: resp.statusCode,
    headers: resp.headers,
    method: opt.method,
    url: opt.url,
    // the XHR object in browser, http response in Node
    rawRequest: resp.rawRequest ? resp.rawRequest : resp
  }
}

},{}],17:[function(require,module,exports){
var xhr = require('xhr')
var normalize = require('./normalize-response')
var noop = function () {}

module.exports = xhrRequest
function xhrRequest (opt, cb) {
  delete opt.uri

  // for better JSON.parse error handling than xhr module
  var useJson = false
  if (opt.responseType === 'json') {
    opt.responseType = 'text'
    useJson = true
  }

  var req = xhr(opt, function xhrRequestResult (err, resp, body) {
    if (useJson && !err) {
      try {
        var text = resp.rawRequest.responseText
        body = JSON.parse(text)
      } catch (e) {
        err = e
      }
    }

    resp = normalize(opt, resp)
    if (err) cb(err, null, resp)
    else cb(err, body, resp)
    cb = noop
  })

  // Patch abort() so that it also calls the callback, but with an error
  var onabort = req.onabort
  req.onabort = function () {
    var ret = onabort.apply(req, Array.prototype.slice.call(arguments))
    cb(new Error('XHR Aborted'))
    cb = noop
    return ret
  }

  return req
}

},{"./normalize-response":16,"xhr":18}],18:[function(require,module,exports){
"use strict";
var window = require("global/window")
var isFunction = require("is-function")
var parseHeaders = require("parse-headers")
var xtend = require("xtend")

module.exports = createXHR
// Allow use of default import syntax in TypeScript
module.exports.default = createXHR;
createXHR.XMLHttpRequest = window.XMLHttpRequest || noop
createXHR.XDomainRequest = "withCredentials" in (new createXHR.XMLHttpRequest()) ? createXHR.XMLHttpRequest : window.XDomainRequest

forEachArray(["get", "put", "post", "patch", "head", "delete"], function(method) {
    createXHR[method === "delete" ? "del" : method] = function(uri, options, callback) {
        options = initParams(uri, options, callback)
        options.method = method.toUpperCase()
        return _createXHR(options)
    }
})

function forEachArray(array, iterator) {
    for (var i = 0; i < array.length; i++) {
        iterator(array[i])
    }
}

function isEmpty(obj){
    for(var i in obj){
        if(obj.hasOwnProperty(i)) return false
    }
    return true
}

function initParams(uri, options, callback) {
    var params = uri

    if (isFunction(options)) {
        callback = options
        if (typeof uri === "string") {
            params = {uri:uri}
        }
    } else {
        params = xtend(options, {uri: uri})
    }

    params.callback = callback
    return params
}

function createXHR(uri, options, callback) {
    options = initParams(uri, options, callback)
    return _createXHR(options)
}

function _createXHR(options) {
    if(typeof options.callback === "undefined"){
        throw new Error("callback argument missing")
    }

    var called = false
    var callback = function cbOnce(err, response, body){
        if(!called){
            called = true
            options.callback(err, response, body)
        }
    }

    function readystatechange() {
        if (xhr.readyState === 4) {
            setTimeout(loadFunc, 0)
        }
    }

    function getBody() {
        // Chrome with requestType=blob throws errors arround when even testing access to responseText
        var body = undefined

        if (xhr.response) {
            body = xhr.response
        } else {
            body = xhr.responseText || getXml(xhr)
        }

        if (isJson) {
            try {
                body = JSON.parse(body)
            } catch (e) {}
        }

        return body
    }

    function errorFunc(evt) {
        clearTimeout(timeoutTimer)
        if(!(evt instanceof Error)){
            evt = new Error("" + (evt || "Unknown XMLHttpRequest Error") )
        }
        evt.statusCode = 0
        return callback(evt, failureResponse)
    }

    // will load the data & process the response in a special response object
    function loadFunc() {
        if (aborted) return
        var status
        clearTimeout(timeoutTimer)
        if(options.useXDR && xhr.status===undefined) {
            //IE8 CORS GET successful response doesn't have a status field, but body is fine
            status = 200
        } else {
            status = (xhr.status === 1223 ? 204 : xhr.status)
        }
        var response = failureResponse
        var err = null

        if (status !== 0){
            response = {
                body: getBody(),
                statusCode: status,
                method: method,
                headers: {},
                url: uri,
                rawRequest: xhr
            }
            if(xhr.getAllResponseHeaders){ //remember xhr can in fact be XDR for CORS in IE
                response.headers = parseHeaders(xhr.getAllResponseHeaders())
            }
        } else {
            err = new Error("Internal XMLHttpRequest Error")
        }
        return callback(err, response, response.body)
    }

    var xhr = options.xhr || null

    if (!xhr) {
        if (options.cors || options.useXDR) {
            xhr = new createXHR.XDomainRequest()
        }else{
            xhr = new createXHR.XMLHttpRequest()
        }
    }

    var key
    var aborted
    var uri = xhr.url = options.uri || options.url
    var method = xhr.method = options.method || "GET"
    var body = options.body || options.data
    var headers = xhr.headers = options.headers || {}
    var sync = !!options.sync
    var isJson = false
    var timeoutTimer
    var failureResponse = {
        body: undefined,
        headers: {},
        statusCode: 0,
        method: method,
        url: uri,
        rawRequest: xhr
    }

    if ("json" in options && options.json !== false) {
        isJson = true
        headers["accept"] || headers["Accept"] || (headers["Accept"] = "application/json") //Don't override existing accept header declared by user
        if (method !== "GET" && method !== "HEAD") {
            headers["content-type"] || headers["Content-Type"] || (headers["Content-Type"] = "application/json") //Don't override existing accept header declared by user
            body = JSON.stringify(options.json === true ? body : options.json)
        }
    }

    xhr.onreadystatechange = readystatechange
    xhr.onload = loadFunc
    xhr.onerror = errorFunc
    // IE9 must have onprogress be set to a unique function.
    xhr.onprogress = function () {
        // IE must die
    }
    xhr.onabort = function(){
        aborted = true;
    }
    xhr.ontimeout = errorFunc
    xhr.open(method, uri, !sync, options.username, options.password)
    //has to be after open
    if(!sync) {
        xhr.withCredentials = !!options.withCredentials
    }
    // Cannot set timeout with sync request
    // not setting timeout on the xhr object, because of old webkits etc. not handling that correctly
    // both npm's request and jquery 1.x use this kind of timeout, so this is being consistent
    if (!sync && options.timeout > 0 ) {
        timeoutTimer = setTimeout(function(){
            if (aborted) return
            aborted = true//IE9 may still call readystatechange
            xhr.abort("timeout")
            var e = new Error("XMLHttpRequest timeout")
            e.code = "ETIMEDOUT"
            errorFunc(e)
        }, options.timeout )
    }

    if (xhr.setRequestHeader) {
        for(key in headers){
            if(headers.hasOwnProperty(key)){
                xhr.setRequestHeader(key, headers[key])
            }
        }
    } else if (options.headers && !isEmpty(options.headers)) {
        throw new Error("Headers cannot be set on an XDomainRequest object")
    }

    if ("responseType" in options) {
        xhr.responseType = options.responseType
    }

    if ("beforeSend" in options &&
        typeof options.beforeSend === "function"
    ) {
        options.beforeSend(xhr)
    }

    // Microsoft Edge browser sends "undefined" when send is called with undefined value.
    // XMLHttpRequest spec says to pass null as body to indicate no body
    // See https://github.com/naugtur/xhr/issues/100.
    xhr.send(body || null)

    return xhr


}

function getXml(xhr) {
    // xhr.responseXML will throw Exception "InvalidStateError" or "DOMException"
    // See https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseXML.
    try {
        if (xhr.responseType === "document") {
            return xhr.responseXML
        }
        var firefoxBugTakenEffect = xhr.responseXML && xhr.responseXML.documentElement.nodeName === "parsererror"
        if (xhr.responseType === "" && !firefoxBugTakenEffect) {
            return xhr.responseXML
        }
    } catch (e) {}

    return null
}

function noop() {}

},{"global/window":5,"is-function":7,"parse-headers":9,"xtend":19}],19:[function(require,module,exports){
module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}]},{},[2]);
