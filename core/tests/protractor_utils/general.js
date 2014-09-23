// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Minor general functional components for end-to-end testing
 * with protractor.
 *
 * @author Jacob Davis (jacobdavis11@gmail.com)
 */

// Time (in ms) to wait when the system needs time for some computations.
var WAIT_TIME = 4000;

var waitForSystem = function() {
  protractor.getInstance().sleep(WAIT_TIME);
};

var SERVER_URL_PREFIX = 'http://localhost:4445';
var EDITOR_URL_SLICE = '/create/';
var PLAYER_URL_SLICE = '/explore/';
var LOGIN_URL_SUFFIX = '/_ah/login';
var ADMIN_URL_SUFFIX = '/admin';
var EXPLORATION_ID_LENGTH = 12;

// If we are currently in the editor, this will return a promise with the 
// exploration ID.
var getExplorationIdFromEditor = function() {
  return {
    then: function(callbackFunction) {
      browser.getCurrentUrl().then(function(url) {
        var expectedPrefix = SERVER_URL_PREFIX + EDITOR_URL_SLICE;
        expect(url.slice(0, expectedPrefix.length)).toBe(expectedPrefix);
        var explorationId = url.slice(
          expectedPrefix.length, expectedPrefix.length + EXPLORATION_ID_LENGTH
        );
        return callbackFunction(explorationId);
      });
    }
  };
};

// The explorationId here should be a string, not a promise.
var openEditor = function(explorationId) {
  browser.get(EDITOR_URL_SLICE + explorationId);
  protractor.getInstance().waitForAngular();
};

var openPlayer = function(explorationId) {
  browser.get(PLAYER_URL_SLICE + explorationId);
};

// Takes the user from an exploration editor to its player.
// NOTE: we do not use the preview button because that will open a new window.
var moveToPlayer = function() {
  getExplorationIdFromEditor().then(openPlayer);
};

var expect404Error = function() {
  expect(element(by.css('.oppia-wide-panel-content')).getText()).
    toMatch('Error 404');
};

exports.waitForSystem = waitForSystem;
exports.SERVER_URL_PREFIX = SERVER_URL_PREFIX;
exports.LOGIN_URL_SUFFIX = LOGIN_URL_SUFFIX;
exports.ADMIN_URL_SUFFIX = ADMIN_URL_SUFFIX;

exports.getExplorationIdFromEditor = getExplorationIdFromEditor;
exports.openEditor = openEditor;
exports.openPlayer = openPlayer;
exports.moveToPlayer = moveToPlayer;
exports.expect404Error = expect404Error;