// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview This file imports the MIDI.js library.
 */

import {AppConstants} from 'app.constants';
import 'midi/build/MIDI.js';
window.Base64Binary = require('midi/inc/shim/Base64binary.js');

var soundfontPath: string;

if (AppConstants.DEV_MODE) {
  soundfontPath = '/dist/oppia-angular/midi/examples/soundfont/';
} else {
  soundfontPath = '/dist/oppia-angular-prod/midi/examples/soundfont/';
}

$(document).ready(function () {
  MIDI.loadPlugin({
    soundfontUrl: soundfontPath,
    instrument: 'acoustic_grand_piano',
    callback: function () {},
  });
});
