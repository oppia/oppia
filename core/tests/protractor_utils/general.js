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
 */

var ExplorationEditorPage = require(
  '../protractor_utils/ExplorationEditorPage.js');
var until = protractor.ExpectedConditions;

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
  browser.sleep(waitTime);
};

var waitForLoadingMessage = function() {
  // Consider adding this method after each browser.get() call going to an
  // Angular page destination. Completely wait for page to load to
  // avoid XMLHTTPReq error on page refresh:
  // https://github.com/angular/angular.js/issues/14219#issuecomment-251605766
  // and browser.waitForAngular's flakiness
  // https://github.com/angular/protractor/issues/2954.
  var loadingMessage = element(by.css('[ng-show="loadingMessage"]'));
  return browser.wait(until.invisibilityOf(loadingMessage), 15000,
    'Page takes more than 15 secs to load');
};

var scrollToTop = function() {
  browser.executeScript('window.scrollTo(0,0);');
};

// We will report all console logs of level greater than this.
var CONSOLE_LOG_THRESHOLD = 900;
var CONSOLE_ERRORS_TO_IGNORE = [];

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

var SERVER_URL_PREFIX = 'http://localhost:9001';
var EDITOR_URL_SLICE = '/create/';
var PLAYER_URL_SLICE = '/explore/';
var USER_PREFERENCES_URL = '/preferences';
var LOGIN_URL_SUFFIX = '/_ah/login';
var MODERATOR_URL_SUFFIX = '/moderator';
// Note that this only works in dev, due to the use of cache slugs in prod.
var SCRIPTS_URL_SLICE = '/assets/scripts/';
var EXPLORATION_ID_LENGTH = 12;

var FIRST_STATE_DEFAULT_NAME = 'Introduction';

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
  waitForLoadingMessage();
  var explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
  var explorationEditorMainTab = explorationEditorPage.getMainTab();
  explorationEditorMainTab.exitTutorial();
};

var openPlayer = function(explorationId) {
  browser.get(PLAYER_URL_SLICE + explorationId);
  waitForLoadingMessage();
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

// Checks no untranslated values are shown in the page.
var ensurePageHasNoTranslationIds = function() {
  // The use of the InnerHTML is hacky, but is faster than checking each
  // individual component that contains text.
  element(by.css('.oppia-base-container')).getAttribute('innerHTML').then(
    function(promiseValue) {
      // First remove all the attributes translate and variables that are
      // not displayed
      var REGEX_TRANSLATE_ATTR = new RegExp('translate="I18N_', 'g');
      var REGEX_NG_VARIABLE = new RegExp('<\\[\'I18N_', 'g');
      var REGEX_NG_TOP_NAV_VISIBILITY =
        new RegExp('ng-show="navElementsVisibilityStatus.I18N_', 'g');
      expect(promiseValue.replace(REGEX_TRANSLATE_ATTR, '')
        .replace(REGEX_NG_VARIABLE, '')
        .replace(REGEX_NG_TOP_NAV_VISIBILITY, '')).not.toContain('I18N');
    });
};

var acceptAlert = function() {
  browser.wait(until.alertIsPresent(), 5000).then( function(activeAlert) {
    if (activeAlert) {
      return browser.switchTo().alert().accept().then(
        function() {
          return true;
        },
        function() {
          return false;
        }
      );
    }
  });
};

var _getUniqueLogMessages = function(logs) {
  // Returns unique log messages.
  var logsDict = {};
  for (var i = 0; i < logs.length; i++) {
    if (!logsDict.hasOwnProperty(logs[i].message)) {
      logsDict[logs[i].message] = true;
    }
  }
  return Object.keys(logsDict);
};

var checkConsoleErrorsExist = function(expectedErrors) {
  // Checks that browser logs match entries in expectedErrors array.
  browser.manage().logs().get('browser').then(function(browserLogs) {
    // Some browsers such as chrome raise two errors for a missing resource.
    // To keep consistent behaviour across browsers, we keep only the logs
    // that have a unique value for their message attribute.
    var uniqueLogMessages = _getUniqueLogMessages(browserLogs);
    expect(uniqueLogMessages.length).toBe(expectedErrors.length);
    for (var i = 0; i < expectedErrors.length; i++) {
      var errorPresent = false;
      for (var j = 0; j < uniqueLogMessages.length; j++) {
        if (uniqueLogMessages[j].match(expectedErrors[i])) {
          errorPresent = true;
        }
      }
      expect(errorPresent).toBe(true);
    }
  });
};

exports.acceptAlert = acceptAlert;
exports.waitForSystem = waitForSystem;
exports.waitForLoadingMessage = waitForLoadingMessage;
exports.scrollToTop = scrollToTop;
exports.checkForConsoleErrors = checkForConsoleErrors;

exports.SERVER_URL_PREFIX = SERVER_URL_PREFIX;
exports.USER_PREFERENCES_URL = USER_PREFERENCES_URL;
exports.EDITOR_URL_SLICE = EDITOR_URL_SLICE;
exports.LOGIN_URL_SUFFIX = LOGIN_URL_SUFFIX;
exports.MODERATOR_URL_SUFFIX = MODERATOR_URL_SUFFIX;
exports.SCRIPTS_URL_SLICE = SCRIPTS_URL_SLICE;
exports.FIRST_STATE_DEFAULT_NAME = FIRST_STATE_DEFAULT_NAME;

exports.getExplorationIdFromEditor = getExplorationIdFromEditor;
exports.getExplorationIdFromPlayer = getExplorationIdFromPlayer;
exports.openEditor = openEditor;
exports.openPlayer = openPlayer;
exports.moveToPlayer = moveToPlayer;
exports.moveToEditor = moveToEditor;
exports.expect404Error = expect404Error;

exports.ensurePageHasNoTranslationIds = ensurePageHasNoTranslationIds;

exports.checkConsoleErrorsExist = checkConsoleErrorsExist;
