// Copyright 2019 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Encoder for encoding raw audio to mp3.
 */

(function() {
  'use strict';
  // es5 style worker
  // command message systems for worker

  // for karma tests prevent automatic loading from main thread
  if('function' === typeof importScripts){
    console.warn('MP3 conversion worker started.');
    importScripts('/third_party/static/lamejs-1.2.0/lame.min.js');
  }

  self.onmessage = function(e) {
    switch (e.data.cmd) {
      case 'init':
        init();
        break;
      case 'encode':
        encode(e.data.buf);
        break;
      case 'finish':
        finish();
        break;
    }
  };

  var buffer, mp3Encoder, maxSamples = 1152, samples;
  var init = function() {
    mp3Encoder = new lamejs.Mp3Encoder(1, 44100, 128);
    clearBuffer();
  };

  var encode = function(input) {
    samples = convertBuffer(input);
    var remaining = samples.length;
    // make remaining greater than 0 check
    // because that will not exclude data from encoding
    for (var i = 0; remaining >= 0; i += maxSamples) {
      var mono = samples.subarray(i, i + maxSamples);
      var mp3buf = mp3Encoder.encodeBuffer(mono);
      appendToBuffer(mp3buf);
      remaining -= maxSamples;
    }
  };

  var finish = function() {
    appendToBuffer(mp3Encoder.flush());
    console.warn('done encoding, size=', buffer.length);
    self.postMessage({
      cmd: 'end',
      buf: buffer
    });
    clearBuffer(); // free up memory
  };

  var clearBuffer = function() {
    buffer = [];
  };

  var appendToBuffer = function(mp3Buf) {
    buffer.push(new Int8Array(mp3Buf));
  };

  // from mic to mp3 format
  var convertBuffer = function(arrayBuffer) {
    var data = new Float32Array(arrayBuffer);
    var out = new Int16Array(arrayBuffer.length);
    floatTo16BitPCM(data, out);
    return out;
  };

  // convert from 32 bit float to 16 bit int
  var floatTo16BitPCM = function floatTo16BitPCM(input, output) {
    // var offset = 0;
    for (var i = 0; i < input.length; i++) {
      var s = Math.max(-1, Math.min(1, input[i]));
      output[i] = (s < 0 ? s * 0x8000 : s * 0x7FFF);
    }
  };
})();
