// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Utilities for delaying actions with Protractor's
 * ExpectedConditions.
 */

var until = protractor.ExpectedConditions;
var fs = require('fs');
var Constants = require('./ProtractorConstants');
// When running tests on mobile via browserstack, the localhost
// might take some time to establish a connection with the
// server since the mobile tests are run on a real
// mobile device.
var DEFAULT_WAIT_TIME_MSECS = browser.isMobile ? 20000 : 10000;
var DEFAULT_WAIT_TIME_MSECS_FOR_NEW_TAB = 15000;

var toastInfoElement = element(by.css('.toast-info'));
var toastSuccessElement = element(by.css('.toast-success'));
var loadingMessage = element(by.css('.e2e-test-loading-message'));

var alertToBePresent = async function() {
  await browser.wait(
    until.alertIsPresent(),
    DEFAULT_WAIT_TIME_MSECS,
    'Alert box took too long to appear.\n' + new Error().stack + '\n');
};

/**
 * @param {Object} element - Clickable element such as button, link or tab.
 * @param {string} errorMessage - Error message when element is not clickable.
 */
var elementToBeClickable = async function(element, errorMessage) {
  await browser.wait(
    until.elementToBeClickable(element),
    DEFAULT_WAIT_TIME_MSECS,
    errorMessage + '\n' + new Error().stack + '\n');
};

/**
 * @param {Object} element - Element expected to disappear from DOM and does not
 *                           have height or width.
 * @param {string} errorMessage - Error message when element is still visible.
 */
var invisibilityOf = async function(element, errorMessage) {
  await browser.wait(
    await until.invisibilityOf(element),
    DEFAULT_WAIT_TIME_MSECS,
    errorMessage + '\n' + new Error().stack + '\n');
};

/**
 * Consider adding this method after each browser.get() call.
 */
var pageToFullyLoad = async function() {
  // Completely wait for page to load to avoid XMLHTTPReq error on page refresh:
  // https://github.com/angular/angular.js/issues/14219#issuecomment-251605766
  // and browser.waitForAngular's flakiness
  // https://github.com/angular/protractor/issues/2954.
  var loadingMessage = element(by.css('.e2e-test-loading-fullpage'));
  await browser.driver.wait(
    until.invisibilityOf(loadingMessage),
    15000,
    'Page takes more than 15 secs to load\n' + new Error().stack + '\n');
};

/**
 * @param {Object} element - Element expected to contain a text.
 * @param {string} text - Text value to compare to element's text.
 * @param {string} errorMessage - Error message when element does not contain
 *                                provided text.
 */
var textToBePresentInElement = async function(element, text, errorMessage) {
  await browser.wait(
    until.textToBePresentInElement(element, text),
    DEFAULT_WAIT_TIME_MSECS,
    errorMessage + '\n' + new Error().stack + '\n');
};

/**
 * @param {Object} element - Element is expected to be present on the DOM but
 *                           This does not mean that the element is visible.
 * @param {string} errorMessage - Error message when element is not present.
 */
var presenceOf = async function(element, errorMessage) {
  await browser.wait(
    await until.presenceOf(element),
    DEFAULT_WAIT_TIME_MSECS,
    errorMessage + '\n' + new Error().stack + '\n');
};

/**
 * @param {Object} element - Element expected to be present in the DOM and has
 *                           height and width that is greater than 0.
 * @param {string} errorMessage - Error message when element is invisible.
 */
var visibilityOf = async function(element, errorMessage) {
  await browser.wait(
    await until.visibilityOf(element),
    DEFAULT_WAIT_TIME_MSECS,
    errorMessage + '\n' + new Error().stack + '\n');
};

/**
 * @param {Object} element - Element who attribute we are waiting to
 *                           for
 * @param {Object} attribute - Name of attribute
 * @param {Object} value - Value we are waiting attribute to have
 * @param {Object} errorMessage - Error message in case wait times out
 */
var elementAttributeToBe = async function(
    element, attribute, value, errorMessage
) {
  await browser.wait(
    async function() {
      return await element.getAttribute(attribute) === value;
    },
    DEFAULT_WAIT_TIME_MSECS,
    errorMessage + '\n' + new Error().stack + '\n');
};

/**
* Wait for new tab is opened
*/
var newTabToBeCreated = async function(errorMessage, urlToMatch) {
  await browser.wait(
    async function() {
      var handles = await browser.driver.getAllWindowHandles();
      await browser.waitForAngularEnabled(false);
      await browser.switchTo().window(await handles.pop());
      var url = await browser.getCurrentUrl();
      await browser.waitForAngularEnabled(true);
      return await url.match(urlToMatch);
    },
    DEFAULT_WAIT_TIME_MSECS_FOR_NEW_TAB,
    errorMessage + '\n' + new Error().stack + '\n');
};

/**
 * @param {string} url - URL to redirect
 */
var urlRedirection = async function(url) {
  // Checks that the current URL matches the expected text.
  await browser.wait(
    until.urlIs(url),
    DEFAULT_WAIT_TIME_MSECS,
    'URL redirection took too long\n' + new Error().stack + '\n');
};

var visibilityOfInfoToast = async function(errorMessage) {
  await visibilityOf(toastInfoElement, errorMessage);
};

var invisibilityOfInfoToast = async function(errorMessage) {
  await invisibilityOf(toastInfoElement, errorMessage);
};

var invisibilityOfLoadingMessage = async function(errorMessage) {
  await invisibilityOf(loadingMessage, errorMessage);
};

var visibilityOfSuccessToast = async function(errorMessage) {
  await visibilityOf(toastSuccessElement, errorMessage);
};

var fadeInToComplete = async function(element, errorMessage) {
  await visibilityOf(element, 'Editor taking too long to appear');
  await browser.driver.wait(
    async function() {
      return await element.getCssValue('opacity') === '1';
    },
    DEFAULT_WAIT_TIME_MSECS,
    errorMessage + '\n' + new Error().stack + '\n');
};

var modalPopupToAppear = async function() {
  await visibilityOf(
    element(by.css('.modal-body')), 'Modal taking too long to appear.');
};

/**
 * Check if a file has been downloaded
 */
var fileToBeDownloaded = async function(filename) {
  var name = Constants.DOWNLOAD_PATH + '/' + filename;
  await browser.driver.wait(function() {
    return fs.existsSync(name);
  },
  DEFAULT_WAIT_TIME_MSECS,
  'File was not downloaded!\n' + new Error().stack + '\n');
};

var clientSideRedirection = async function(
    action, check, waitForCallerSpecifiedConditions) {
  // Client side redirection is known to cause "both angularJS testability
  // and angular testability are undefined" flake.
  // As suggested by protractor devs here (http://git.io/v4gXM), waiting for
  // angular is disabled during client side redirects.
  await browser.waitForAngularEnabled(false);

  // Action triggering redirection.
  await action();

  // The action only triggers the redirection but does not wait for it to
  // complete. Manually waiting for redirection here.
  await browser.driver.wait(async() => {
    var url = await browser.driver.getCurrentUrl();
    // Condition to wait on.
    return check(decodeURIComponent(url));
  }, DEFAULT_WAIT_TIME_MSECS);

  // Waiting for caller specified conditions.
  await waitForCallerSpecifiedConditions();

  // Client side redirection is complete, enabling wait for angular here.
  await browser.waitForAngularEnabled(true);
};

exports.DEFAULT_WAIT_TIME_MSECS = DEFAULT_WAIT_TIME_MSECS;
exports.alertToBePresent = alertToBePresent;
exports.elementToBeClickable = elementToBeClickable;
exports.invisibilityOf = invisibilityOf;
exports.pageToFullyLoad = pageToFullyLoad;
exports.textToBePresentInElement = textToBePresentInElement;
exports.visibilityOf = visibilityOf;
exports.presenceOf = presenceOf;
exports.elementAttributeToBe = elementAttributeToBe;
exports.newTabToBeCreated = newTabToBeCreated;
exports.urlRedirection = urlRedirection;
exports.invisibilityOfInfoToast = invisibilityOfInfoToast;
exports.invisibilityOfLoadingMessage = invisibilityOfLoadingMessage;
exports.visibilityOfInfoToast = visibilityOfInfoToast;
exports.visibilityOfSuccessToast = visibilityOfSuccessToast;
exports.fadeInToComplete = fadeInToComplete;
exports.modalPopupToAppear = modalPopupToAppear;
exports.fileToBeDownloaded = fileToBeDownloaded;
exports.clientSideRedirection = clientSideRedirection;
