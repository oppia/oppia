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
 * @fileoverview End-to-end tests for checking back button functionality.
 */

var editor = require('../protractor_utils/editor.js');
var general = require('../protractor_utils/general.js');
var library = require('../protractor_utils/library.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

describe('backBrowserButton', function() {
  var EXPLORATION_TITLE = 'Sample Exploration';
  var EXPLORATION_OBJECTIVE = 'To explore something';
  var EXPLORATION_CATEGORY = 'Random';
  var EXPLORATION_LANGUAGE = 'English';

  var visitSplashPage = function() {
    browser.get(general.SERVER_URL_PREFIX);
  };
  var nextpage = function() {
    browser.get(general.SERVER_URL_PREFIX + '/dashboard?mode=create');
  };

  it('Checks Back Button Functionality', function() {
    visitSplashPage();
    element(by.css('.protractor-test-create-activity')).click();
    users.createUser('user1@backBrowserButton.com',
                     'creatorBackBrowserButton');
    users.login('user1@backBrowserButton.com');
    general.waitForSystem();
    nextpage();
    editor.exitTutorialIfNecessary();
    browser.navigate().back();
    expect(browser.getCurrentUrl()).
      toEqual('http://localhost:9001/dashboard?mode=create#/');
    general.waitForSystem();
    browser.get(general.LIBRARY_URL_SUFFIX);
    workflow.createExploration();
    browser.navigate().back();
    general.waitForSystem();
    expect(browser.getCurrentUrl()).
      toEqual('http://localhost:9001/dashboard?mode=create#/');
    browser.navigate().back();
    general.waitForSystem();
    expect(browser.getCurrentUrl()).
      toEqual('http://localhost:9001/library');
    browser.navigate().forward();
    general.waitForSystem();
    expect(browser.getCurrentUrl()).
      toEqual('http://localhost:9001/dashboard?mode=create#/');
    browser.navigate().forward();
    general.waitForSystem();
    expect(browser.getLocationAbsUrl()).toEqual('/gui/Introduction');
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
