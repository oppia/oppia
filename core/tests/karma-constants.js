// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Loads constants for the Karma test environment.
 */

/* This should be kept in parity with how CONSTANTS is set in base.html */
var constants = (function() {
  var request = new XMLHttpRequest();
  /* The overrideMimeType method was not implemented in IE prior to IE11. */
  if (request.overrideMimeType) {
    request.overrideMimeType('application/json');
  }
  request.open(
   'GET', GLOBALS.ASSET_DIR_PREFIX + '/assets/constants.json', false);
  request.send(null);
  return JSON.parse(request.responseText);
})();
