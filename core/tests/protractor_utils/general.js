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

var editor = require('./editor.js');

// Time (in ms) to wait when the system needs time for some computations.
var WAIT_TIME = 4000;

// Optionally accepts a waitTime integer in milliseconds.
var waitForSystem = function() {
  var waitTime;
  if (arguments.length === 1) {
    waitTime = arguments[0];
  } else {
    waitTime = WAIT_TIME;
  }
  protractor.getInstance().sleep(waitTime);
};

// We will report all console logs of level greater than this.
var CONSOLE_LOG_THRESHOLD = 900;
var CONSOLE_ERRORS_TO_IGNORE = [
  // This error arises when a logout event takes place before a page has fully
  // loaded.
  'http://localhost:4445/third_party/static/angularjs-1.3.13/angular.js 11607:24'
];

var checkForConsoleErrors = function(errorsToIgnore) {
  var irrelevantErrors = errorsToIgnore.concat(CONSOLE_ERRORS_TO_IGNORE);
  browser.manage().logs().get('browser').then(function(browserLogs) {
    var fatalErrors = [];
    for (var i = 0; i < browserLogs.length; i++) {
      if (browserLogs[i].level.value > CONSOLE_LOG_THRESHOLD) {
        var errorFatal = true;
        for (var j = 0; j < irrelevantErrors.length; j++) {
          if (browserLogs[i].message.match(irrelevantErrors[j])) {
            errorFatal = false;
          }
        }
        if (errorFatal) {
          fatalErrors.push(browserLogs[i]);
        }
      }
    }
    expect(fatalErrors).toEqual([]);
  });
};


var SERVER_URL_PREFIX = 'http://localhost:4445';
var GALLERY_URL_SUFFIX = '/gallery';
var EDITOR_URL_SLICE = '/create/';
var PLAYER_URL_SLICE = '/explore/';
var LOGIN_URL_SUFFIX = '/_ah/login';
var ADMIN_URL_SUFFIX = '/admin';
var SCRIPTS_URL_SLICE = '/scripts/';
var EXPLORATION_ID_LENGTH = 12;

var FIRST_STATE_DEFAULT_NAME = 'First Card';


var _getExplorationId = function(currentUrlPrefix) {
  return {
    then: function(callbackFunction) {
      browser.getCurrentUrl().then(function(url) {
        expect(url.slice(0, currentUrlPrefix.length)).toBe(currentUrlPrefix);
        var explorationId = url.slice(
          currentUrlPrefix.length,
          currentUrlPrefix.length + EXPLORATION_ID_LENGTH);
        return callbackFunction(explorationId);
      });
    }
  };
};

// If we are currently in the editor, this will return a promise with the
// exploration ID.
var getExplorationIdFromEditor = function() {
  return _getExplorationId(SERVER_URL_PREFIX + EDITOR_URL_SLICE);
};

// Likewise for the player
var getExplorationIdFromPlayer = function() {
  return _getExplorationId(SERVER_URL_PREFIX + PLAYER_URL_SLICE);
};

// The explorationId here should be a string, not a promise.
var openEditor = function(explorationId) {
  browser.get(EDITOR_URL_SLICE + explorationId);
  protractor.getInstance().waitForAngular();
  editor.exitTutorialIfNecessary();
};

var openPlayer = function(explorationId) {
  browser.get(PLAYER_URL_SLICE + explorationId);
};

// Takes the user from an exploration editor to its player.
// NOTE: we do not use the preview button because that will open a new window.
var moveToPlayer = function() {
  getExplorationIdFromEditor().then(openPlayer);
};

// Takes the user from the exploration player to its editor.
var moveToEditor = function() {
  getExplorationIdFromPlayer().then(openEditor);
};

var expect404Error = function() {
  expect(element(by.css('.protractor-test-error-container')).getText()).
    toMatch('Error 404');
};

// TODO(sll): see if it is possible to remove this once the scrolling in
// ConversationSkin.js is changed to use ng-animate instead of jQuery.
var scrollElementIntoView = function(elementToScrollTo) {
  browser.executeScript(function(elem) {
    elem.scrollIntoView(false);
  }, elementToScrollTo);
};



exports.waitForSystem = waitForSystem;
exports.checkForConsoleErrors = checkForConsoleErrors;

exports.SERVER_URL_PREFIX = SERVER_URL_PREFIX;
exports.GALLERY_URL_SUFFIX = GALLERY_URL_SUFFIX;
exports.EDITOR_URL_SLICE = EDITOR_URL_SLICE;
exports.LOGIN_URL_SUFFIX = LOGIN_URL_SUFFIX;
exports.ADMIN_URL_SUFFIX = ADMIN_URL_SUFFIX;
exports.SCRIPTS_URL_SLICE = SCRIPTS_URL_SLICE;
exports.FIRST_STATE_DEFAULT_NAME = FIRST_STATE_DEFAULT_NAME;

exports.getExplorationIdFromEditor = getExplorationIdFromEditor;
exports.getExplorationIdFromPlayer = getExplorationIdFromPlayer;
exports.openEditor = openEditor;
exports.openPlayer = openPlayer;
exports.moveToPlayer = moveToPlayer;
exports.moveToEditor = moveToEditor;
exports.expect404Error = expect404Error;

exports.scrollElementIntoView = scrollElementIntoView;
