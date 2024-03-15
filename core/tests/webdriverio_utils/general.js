// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * with webdriverio.
 */

var _ = require('lodash');

var ExplorationEditorPage = require('../webdriverio_utils/ExplorationEditorPage.js');
var waitFor = require('./waitFor.js');
var dragAndDropScript = require('html-dnd').code;
var action = require('../webdriverio_utils/action.js');

var dragAndDrop = async function (fromElement, toElement) {
  await waitFor.visibilityOf(
    fromElement,
    'fromElement taking too long to load'
  );
  await waitFor.visibilityOf(toElement, 'toElement taking too long to load');
  await browser.execute(dragAndDropScript, fromElement, toElement);
};

var scrollToTop = async function () {
  await browser.execute('window.scrollTo(0,0);');
};

// The minimum log level we will report as an error.
var CONSOLE_LOG_THRESHOLD = 900;
var CONSOLE_ERRORS_TO_IGNORE = [
  // These "localhost:9099" are errors related to communicating with the
  // Firebase emulator, which would never occur in production, so we just ignore
  // them.
  _.escapeRegExp(
    'http://localhost:9099/www.googleapis.com/identitytoolkit/v3/' +
      'relyingparty/getAccountInfo?key=fake-api-key'
  ),
  _.escapeRegExp(
    'http://localhost:9099/www.googleapis.com/identitytoolkit/v3/' +
      'relyingparty/verifyPassword?key=fake-api-key'
  ),
  // This error covers the case when the PencilCode site uses an
  // invalid SSL certificate (which can happen when it expires).
  // In such cases, we ignore the error since it is out of our control.
  _.escapeRegExp(
    'https://pencilcode.net/lib/pencilcodeembed.js - Failed to ' +
      'load resource: net::ERR_CERT_DATE_INVALID'
  ),
  // These errors are related to the gtag script that is used to track events.
  // They are of the form "Failed to load resource: the server responded
  // with a status of 405", this happens when the HTTP method used for a
  // network call is refused by the server. The network call is triggered
  // automatically by the gtag script, so we have no control over it. The 405
  // error was observed on other websites (e.g. https://edu.google.com/) that
  // use gtag and it does not affect the user experience in any way.
  // Considering these reasons, the error may be ignored.
  new RegExp(
    'https://www.googletagmanager.com/a.* Failed to load resource: ' +
      'the server responded with a status of 405 ()',
    'g'
  ),
];

var checkForConsoleErrors = async function (
  errorsToIgnore,
  skipDebugging = true
) {
  errorsToIgnore = errorsToIgnore.concat(CONSOLE_ERRORS_TO_IGNORE);
  // The mobile tests run on the latest version of Chrome.
  // The newer versions report 'Slow Network' as a console error.
  // This causes the tests to fail, therefore, we remove such logs.
  if (browser.isMobile) {
    errorsToIgnore.push(_.escapeRegExp(' Slow network is detected.'));
  }

  var browserLogs = await browser.getLogs('browser');
  var browserErrors = browserLogs.filter(
    logEntry =>
      logEntry.level.value > CONSOLE_LOG_THRESHOLD &&
      errorsToIgnore.every(e => logEntry.message.match(e) === null)
  );
  expect(browserErrors).toEqual([]);
};

var isInDevMode = async function () {
  return (await browser.config.params.devMode) === 'true';
};

var SERVER_URL_PREFIX = 'http://localhost:8181';
var EDITOR_URL_SLICE = '/create/';
var PLAYER_URL_SLICE = '/explore/';
var USER_PREFERENCES_URL = '/preferences';
var LOGIN_URL_SUFFIX = '/login';
var LOGOUT_URL_SUFFIX = '/logout';
var MODERATOR_URL_SUFFIX = '/moderator';
var BLOG_PAGE_URL_SUFFIX = '/blog';
var BLOG_PAGE_SEARCH_URL_PREFIX = '/blog/search/find';
// Note that this only works in dev, due to the use of cache slugs in prod.
var SCRIPTS_URL_SLICE = '/assets/scripts/';
var EXPLORATION_ID_LENGTH = 12;

var FIRST_STATE_DEFAULT_NAME = 'Introduction';

var _getExplorationId = async function (currentUrlPrefix) {
  var url = await browser.getUrl();
  expect(url.slice(0, currentUrlPrefix.length)).toBe(currentUrlPrefix);
  var explorationId = url.slice(
    currentUrlPrefix.length,
    currentUrlPrefix.length + EXPLORATION_ID_LENGTH
  );
  return explorationId;
};

// If we are currently in the editor, this will return a promise with the
// exploration ID.
var getExplorationIdFromEditor = async function () {
  return await _getExplorationId(SERVER_URL_PREFIX + EDITOR_URL_SLICE);
};

// Likewise for the player.
var getExplorationIdFromPlayer = async function () {
  return await _getExplorationId(SERVER_URL_PREFIX + PLAYER_URL_SLICE);
};

// The explorationId here should be a string, not a promise.
var openEditor = async function (explorationId, welcomeModalIsShown) {
  await browser.url(EDITOR_URL_SLICE + explorationId);
  await waitFor.pageToFullyLoad();
  var explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
  var explorationEditorMainTab = explorationEditorPage.getMainTab();
  if (welcomeModalIsShown) {
    await explorationEditorMainTab.exitTutorial();
  }
};

var openPlayer = async function (explorationId) {
  await browser.url(PLAYER_URL_SLICE + explorationId);
  await waitFor.pageToFullyLoad();
};

// Takes the user from an exploration editor to its player.
// NOTE: we do not use the preview button because that will open a new window.
var moveToPlayer = async function () {
  var explorationId = await getExplorationIdFromEditor();
  await openPlayer(explorationId);
};

// Takes the user from the exploration player to its editor.
var moveToEditor = async function (welcomeModalIsShown) {
  var explorationId = await getExplorationIdFromPlayer();
  await openEditor(explorationId, welcomeModalIsShown);
};

var expectErrorPage = async errorNum => {
  var errorContainer = $('.e2e-test-error-container');
  await waitFor.visibilityOf(
    errorContainer,
    'Protractor test error container taking too long to appear'
  );
  await expect(await errorContainer.getText()).toMatch(`Error ${errorNum}`);
};

// Checks no untranslated values are shown in the page.
var ensurePageHasNoTranslationIds = async function () {
  // The use of the InnerHTML is hacky, but is faster than checking each
  // individual component that contains text.
  var oppiaBaseContainer = $('.e2e-test-base-container');
  await waitFor.visibilityOf(
    oppiaBaseContainer,
    'Oppia base container taking too long to appear.'
  );

  // We are using getHTML for getting the innerHTML by passing
  // false argument to it.
  let promiseValue = await oppiaBaseContainer.getHTML(false);

  // First remove all the attributes translate and variables that are
  // not displayed.
  var REGEX_TRANSLATE_ATTR = new RegExp('translate="I18N_', 'g');
  var REGEX_NGB_TOOLTIP_ATTR = new RegExp(
    'tooltip="I18N_|tooltip="\'I18N_',
    'g'
  );
  var REGEX_NG_VARIABLE = new RegExp("<\\['I18N_", 'g');
  var REGEX_NG_TOP_NAV_VISIBILITY = new RegExp(
    'ng-show="\\$ctrl.navElementsVisibilityStatus.I18N_',
    'g'
  );
  await expect(
    promiseValue
      .replace(REGEX_TRANSLATE_ATTR, '')
      .replace(REGEX_NGB_TOOLTIP_ATTR, '')
      .replace(REGEX_NG_VARIABLE, '')
      .replace(REGEX_NG_TOP_NAV_VISIBILITY, '')
  ).not.toContain('I18N');
};

var acceptPrompt = async function (promptResponse) {
  await waitFor.alertToBePresent();
  await browser.sendAlertText(promptResponse);
  await browser.acceptAlert();
  await waitFor.pageToFullyLoad();
};

var acceptAlert = async function () {
  await waitFor.alertToBePresent();
  await browser.acceptAlert();
  await waitFor.pageToFullyLoad();
};

var closeCurrentTabAndSwitchTo = async function (destHandle) {
  await browser.closeWindow();
  await browser.switchToWindow(destHandle);
};

var _getUniqueLogMessages = function (logs) {
  // Returns unique log messages.
  var logsDict = {};
  for (var i = 0; i < logs.length; i++) {
    if (!logsDict.hasOwnProperty(logs[i].message)) {
      logsDict[logs[i].message] = true;
    }
  }
  return Object.keys(logsDict);
};

var checkConsoleErrorsExist = async function (expectedErrors) {
  // Checks that browser logs match entries in expectedErrors array.
  var browserLogs = await browser.getLogs('browser');
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

// This function checks if any text is selected on the page.
var expectNoTextToBeSelected = async function () {
  expect(
    await browser.execute(function () {
      var selection = window.getSelection();
      return selection.toString() === '';
    })
  ).toBe(true);
};

var goToHomePage = async function () {
  var oppiaMainLogo = $('.e2e-test-oppia-main-logo');
  await action.click('Oppia Main Logo', oppiaMainLogo);
  return await waitFor.pageToFullyLoad();
};

var openProfileDropdown = async function () {
  var profileDropdown = $('.e2e-test-profile-dropdown');
  await action.click(
    'Profile dropdown taking too long to be clickable.',
    profileDropdown
  );
};

var openAboutDropdown = async function () {
  var aboutDropdown = $('.e2e-test-about-oppia-list-item');
  await action.click('About dropdown', aboutDropdown);
};

var navigateToTopicsAndSkillsDashboardPage = async function () {
  await openProfileDropdown();
  var topicsAndSkillsDashboardLink = $(
    '.e2e-test-topics-and-skills-dashboard-link'
  );
  await waitFor.clientSideRedirection(
    async () => {
      await action.click(
        'Topics and skills dashboard link from dropdown',
        topicsAndSkillsDashboardLink
      );
    },
    url => {
      return /topics-and-skills-dashboard/.test(url);
    },
    async () => {
      await waitFor.pageToFullyLoad();
    }
  );
};

var goOnline = async function () {
  // Download throughput refers to the maximum number of bytes that can be
  // downloaded in a given time.
  // Upload throughput refers to the maximum number of bytes that can be
  // uploaded in a given time.
  // For Oppia, any speed above 150KB/s is considered good. These values
  // are set to be large enough to download and upload a few files and are
  // found empirically.
  await browser.throttle({
    offline: false,
    downloadThroughput: 450 * 1024,
    uploadThroughput: 150 * 1024,
    latency: 150,
  });
};

var goOffline = async function () {
  // Download throughput refers to the maximum number of bytes that can be
  // downloaded in a given time.
  // Upload throughput refers to the maximum number of bytes that can be
  // uploaded in a given time.
  await browser.throttle({
    offline: true,
    downloadThroughput: 0,
    uploadThroughput: 0,
    latency: 0,
  });
};

// This can help us chain stack traces across async promises.
// It's hard to debug without printing error line in caller function,
// so we want to add caller function errStack to stack trace.
// The red stack trace is from webdriverio function. We do not want to
// pass error message to the function because it decrease generality.
// See the black log for the full stack trace when you use this function.
/**
 * Call func. If func errors, print the full stack trace,
 * including the lines from the caller function.
 * @param {function} func - Function you want to call.
 * @param {string} errStack - Put this: new Error().stack.
 */
var callFunctionAndCollectFullStackTraceOnError = async function (
  func,
  errStack
) {
  try {
    await func();
  } catch (error) {
    error.stack =
      error.stack + '\n' + errStack.substring(errStack.indexOf('\n') + 1);
    throw error;
  }
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
exports.BLOG_PAGE_URL_SUFFIX = BLOG_PAGE_URL_SUFFIX;
exports.BLOG_PAGE_SEARCH_URL_PREFIX = BLOG_PAGE_SEARCH_URL_PREFIX;

exports.getExplorationIdFromEditor = getExplorationIdFromEditor;
exports.getExplorationIdFromPlayer = getExplorationIdFromPlayer;
exports.openEditor = openEditor;
exports.openPlayer = openPlayer;
exports.moveToPlayer = moveToPlayer;
exports.moveToEditor = moveToEditor;
exports.expectErrorPage = expectErrorPage;
exports.closeCurrentTabAndSwitchTo = closeCurrentTabAndSwitchTo;
exports.dragAndDrop = dragAndDrop;
exports.openAboutDropdown = openAboutDropdown;
exports.expectNoTextToBeSelected = expectNoTextToBeSelected;

exports.ensurePageHasNoTranslationIds = ensurePageHasNoTranslationIds;

exports.checkConsoleErrorsExist = checkConsoleErrorsExist;

exports.goToHomePage = goToHomePage;
exports.openProfileDropdown = openProfileDropdown;
exports.navigateToTopicsAndSkillsDashboardPage =
  navigateToTopicsAndSkillsDashboardPage;

exports.goOffline = goOffline;
exports.goOnline = goOnline;
exports.callFunctionAndCollectFullStackTraceOnError =
  callFunctionAndCollectFullStackTraceOnError;
