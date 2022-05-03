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

const { remote } = require('webdriverio');
// The minimum log level we will report as an error.
// var CONSOLE_LOG_THRESHOLD = 900;
// var CONSOLE_ERRORS_TO_IGNORE = [
//   // These "localhost:9099" are errors related to communicating with the
//   // Firebase emulator, which would never occur in production, so we just ignore
//   // them.
//   _.escapeRegExp(
//     'http://localhost:9099/www.googleapis.com/identitytoolkit/v3/' +
//     'relyingparty/getAccountInfo?key=fake-api-key'),
//   _.escapeRegExp(
//     'http://localhost:9099/www.googleapis.com/identitytoolkit/v3/' +
//     'relyingparty/verifyPassword?key=fake-api-key'),
//   // This error covers the case when the PencilCode site uses an
//   // invalid SSL certificate (which can happen when it expires).
//   // In such cases, we ignore the error since it is out of our control.
//   _.escapeRegExp(
//     'https://pencilcode.net/lib/pencilcodeembed.js - Failed to ' +
//     'load resource: net::ERR_CERT_DATE_INVALID'),
// ];

// var isInDevMode = function() {
//   return browser.params.devMode === 'true';
// };

// var checkForConsoleErrors = async function(
//     errorsToIgnore, skipDebugging = true) {
//   const browser = await remote({
//     capabilities: {
//       browserName: 'chrome'
//     }
//   });
//   errorsToIgnore = errorsToIgnore.concat(CONSOLE_ERRORS_TO_IGNORE);

//   var browserLogs = await browser.log('browser');
//   var browserErrors = browserLogs.filter(logEntry => (
//     logEntry.level.value > CONSOLE_LOG_THRESHOLD &&
//     errorsToIgnore.every(e => logEntry.message.match(e) === null)));
//   expect(browserErrors).toEqual([]);
// };

var expectErrorPage = async function(errorNum) {
  var errorContainer = $('.protractor-test-error-container');
  await waitFor.visibilityOf(
    errorContainer,
    'Protractor test error container taking too long to appear');
  expect(await errorContainer.getText()).
    toMatch(`Error ${errorNum}`);
};

// exports.checkForConsoleErrors = checkForConsoleErrors;
exports.expectErrorPage = expectErrorPage;
// exports.isInDevMode = isInDevMode;
