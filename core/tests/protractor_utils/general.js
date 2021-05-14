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

var _ = require('lodash');

var ExplorationEditorPage = require(
  '../protractor_utils/ExplorationEditorPage.js');
var waitFor = require('./waitFor.js');
var dragAndDropScript = require('html-dnd').code;
var action = require('../protractor_utils/action.js');

var dragAndDrop = async function(fromElement, toElement) {
  await waitFor.visibilityOf(
    fromElement,
    'fromElement taking too long to load');
  await waitFor.visibilityOf(
    toElement,
    'toElement taking too long to load');
  await browser.executeScript(dragAndDropScript, fromElement, toElement);
};

var scrollToTop = async function() {
  await browser.executeScript('window.scrollTo(0,0);');
};

// The minimum log level we will report as an error.
var CONSOLE_LOG_THRESHOLD = 900;
var CONSOLE_ERRORS_TO_IGNORE = [
  // These "localhost:9099" are errors related to communicating with the
  // Firebase emulator, which would never occur in production, so we just ignore
  // them.
  _.escapeRegExp(
    'http://localhost:9099/www.googleapis.com/identitytoolkit/v3/' +
    'relyingparty/getAccountInfo?key=fake-api-key'),
  _.escapeRegExp(
    'http://localhost:9099/www.googleapis.com/identitytoolkit/v3/' +
    'relyingparty/verifyPassword?key=fake-api-key'),
];

var checkForConsoleErrors = async function(errorsToIgnore) {
  errorsToIgnore = errorsToIgnore.concat(CONSOLE_ERRORS_TO_IGNORE);
  // The mobile tests run on the latest version of Chrome.
  // The newer versions report 'Slow Network' as a console error.
  // This causes the tests to fail, therefore, we remove such logs.
  if (browser.isMobile) {
    errorsToIgnore.push(_.escapeRegExp(' Slow network is detected.'));
  }

  const browserLogs = await browser.manage().logs().get('browser');
  const browserErrors = browserLogs.filter(logEntry => (
    logEntry.level.value > CONSOLE_LOG_THRESHOLD &&
    errorsToIgnore.every(e => logEntry.message.match(e) === null)));
  expect(browserErrors).toEqual([]);
};

var isInDevMode = function() {
  return browser.params.devMode === 'true';
};

var SERVER_URL_PREFIX = 'http://localhost:9001';
var EDITOR_URL_SLICE = '/create/';
var PLAYER_URL_SLICE = '/explore/';
var USER_PREFERENCES_URL = '/preferences';
var LOGIN_URL_SUFFIX = '/login';
var LOGOUT_URL_SUFFIX = '/logout';
var MODERATOR_URL_SUFFIX = '/moderator';
// Note that this only works in dev, due to the use of cache slugs in prod.
var SCRIPTS_URL_SLICE = '/assets/scripts/';
var EXPLORATION_ID_LENGTH = 12;

var FIRST_STATE_DEFAULT_NAME = 'Introduction';

var _getExplorationId = async function(currentUrlPrefix) {
  var url = await browser.getCurrentUrl();
  expect(url.slice(0, currentUrlPrefix.length)).toBe(currentUrlPrefix);
  var explorationId = url.slice(
    currentUrlPrefix.length,
    currentUrlPrefix.length + EXPLORATION_ID_LENGTH);
  return explorationId;
};

// If we are currently in the editor, this will return a promise with the
// exploration ID.
var getExplorationIdFromEditor = async function() {
  return await _getExplorationId(SERVER_URL_PREFIX + EDITOR_URL_SLICE);
};

// Likewise for the player.
var getExplorationIdFromPlayer = async function() {
  return await _getExplorationId(SERVER_URL_PREFIX + PLAYER_URL_SLICE);
};

// The explorationId here should be a string, not a promise.
var openEditor = async function(explorationId, welcomeModalIsShown) {
  await browser.get(EDITOR_URL_SLICE + explorationId);
  await waitFor.pageToFullyLoad();
  var explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
  var explorationEditorMainTab = explorationEditorPage.getMainTab();
  if (welcomeModalIsShown) {
    await explorationEditorMainTab.exitTutorial();
  }
};

var openPlayer = async function(explorationId) {
  await browser.get(PLAYER_URL_SLICE + explorationId);
  await waitFor.pageToFullyLoad();
};

// Takes the user from an exploration editor to its player.
// NOTE: we do not use the preview button because that will open a new window.
var moveToPlayer = async function() {
  var explorationId = await getExplorationIdFromEditor();
  await openPlayer(explorationId);
};

// Takes the user from the exploration player to its editor.
var moveToEditor = async function(welcomeModalIsShown) {
  var explorationId = await getExplorationIdFromPlayer();
  await openEditor(explorationId, welcomeModalIsShown);
};

var expectErrorPage = async function(errorNum) {
  var errorContainer = element(
    by.css('.protractor-test-error-container'));
  await waitFor.visibilityOf(
    errorContainer,
    'Protractor test error container taking too long to appear');
  expect(await errorContainer.getText()).
    toMatch(`Error ${errorNum}`);
};

// Checks no untranslated values are shown in the page.
var ensurePageHasNoTranslationIds = async function() {
  // The use of the InnerHTML is hacky, but is faster than checking each
  // individual component that contains text.
  var oppiaBaseContainer = element(by.css(
    '.oppia-base-container'));
  await waitFor.visibilityOf(
    oppiaBaseContainer,
    'Oppia base container taking too long to appear.');
  var promiseValue = await oppiaBaseContainer.getAttribute('innerHTML');
  // First remove all the attributes translate and variables that are
  // not displayed.
  var REGEX_TRANSLATE_ATTR = new RegExp('translate="I18N_', 'g');
  var REGEX_NGB_TOOLTIP_ATTR = new RegExp(
    'tooltip="I18N_|tooltip="\'I18N_', 'g');
  var REGEX_NG_VARIABLE = new RegExp('<\\[\'I18N_', 'g');
  var REGEX_NG_TOP_NAV_VISIBILITY = (
    new RegExp('ng-show="\\$ctrl.navElementsVisibilityStatus.I18N_', 'g'));
  expect(
    promiseValue.replace(REGEX_TRANSLATE_ATTR, '')
      .replace(REGEX_NGB_TOOLTIP_ATTR, '')
      .replace(REGEX_NG_VARIABLE, '')
      .replace(REGEX_NG_TOP_NAV_VISIBILITY, '')).not.toContain('I18N');
};

var acceptPrompt = async function(promptResponse) {
  await waitFor.alertToBePresent();
  const alert = await browser.switchTo().alert();
  await alert.sendKeys(promptResponse);
  await alert.accept();
  await waitFor.pageToFullyLoad();
};

var acceptAlert = async function() {
  await waitFor.alertToBePresent();
  await (await browser.switchTo().alert()).accept();
  await waitFor.pageToFullyLoad();
};

var closeCurrentTabAndSwitchTo = async function(destHandle) {
  await browser.driver.close();
  await browser.switchTo().window(destHandle);
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

var checkConsoleErrorsExist = async function(expectedErrors) {
  // Checks that browser logs match entries in expectedErrors array.
  var browserLogs = await browser.manage().logs().get('browser');
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
};

var goToHomePage = async function() {
  var oppiaMainLogo = element(by.css('.protractor-test-oppia-main-logo'));
  await action.click('Oppia Main Logo', oppiaMainLogo);
  return await waitFor.pageToFullyLoad();
};

var openProfileDropdown = async function() {
  var profileDropdown = element(
    by.css('.protractor-test-profile-dropdown'));
  await action.click(
    'Profile dropdown taking too long to be clickable.',
    profileDropdown);
};

var navigateToTopicsAndSkillsDashboardPage = async function() {
  await openProfileDropdown();
  var topicsAndSkillsDashboardLink = element(by.css(
    '.protractor-test-topics-and-skills-dashboard-link'));
  await action.click(
    'Topics and skills dashboard link from dropdown',
    topicsAndSkillsDashboardLink);
  await waitFor.pageToFullyLoad();
};

exports.acceptAlert = acceptAlert;
exports.acceptPrompt = acceptPrompt;
exports.scrollToTop = scrollToTop;
exports.checkForConsoleErrors = checkForConsoleErrors;
exports.isInDevMode = isInDevMode;

exports.SERVER_URL_PREFIX = SERVER_URL_PREFIX;
exports.USER_PREFERENCES_URL = USER_PREFERENCES_URL;
exports.EDITOR_URL_SLICE = EDITOR_URL_SLICE;
exports.LOGIN_URL_SUFFIX = LOGIN_URL_SUFFIX;
exports.LOGOUT_URL_SUFFIX = LOGOUT_URL_SUFFIX;
exports.MODERATOR_URL_SUFFIX = MODERATOR_URL_SUFFIX;
exports.SCRIPTS_URL_SLICE = SCRIPTS_URL_SLICE;
exports.FIRST_STATE_DEFAULT_NAME = FIRST_STATE_DEFAULT_NAME;

exports.getExplorationIdFromEditor = getExplorationIdFromEditor;
exports.getExplorationIdFromPlayer = getExplorationIdFromPlayer;
exports.openEditor = openEditor;
exports.openPlayer = openPlayer;
exports.moveToPlayer = moveToPlayer;
exports.moveToEditor = moveToEditor;
exports.expectErrorPage = expectErrorPage;
exports.closeCurrentTabAndSwitchTo = closeCurrentTabAndSwitchTo;
exports.dragAndDrop = dragAndDrop;

exports.ensurePageHasNoTranslationIds = ensurePageHasNoTranslationIds;

exports.checkConsoleErrorsExist = checkConsoleErrorsExist;

exports.goToHomePage = goToHomePage;
exports.openProfileDropdown = openProfileDropdown;
exports.navigateToTopicsAndSkillsDashboardPage = (
  navigateToTopicsAndSkillsDashboardPage);
