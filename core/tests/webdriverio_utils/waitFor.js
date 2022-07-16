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
 * @fileoverview Utilities for delaying actions with WebdriverIO's
 * wdio-wait-for.
 */

var until = require('wdio-wait-for');
var fs = require('fs');
var Constants = require('./WebdriverioConstants');
// When running tests on mobile via browserstack, the localhost
// might take some time to establish a connection with the
// server since the mobile tests are run on a real
// mobile device.
var DEFAULT_WAIT_TIME_MSECS = browser.isMobile ? 20000 : 10000;
var DEFAULT_WAIT_TIME_MSECS_FOR_NEW_TAB = 15000;

var alertToBePresent = async() => {
  await browser.waitUntil(
    await until.alertIsPresent(),
    {
      timeout: DEFAULT_WAIT_TIME_MSECS,
      timeoutMsg: 'Alert box took too long to appear.'
    });
};

// Wait for current url to change to a specific url.
var urlToBe = async function(url) {
  await browser.waitUntil(async function() {
    return await browser.getUrl() === url;
  },
  {
    timeout: DEFAULT_WAIT_TIME_MSECS,
    timeoutMsg: 'Url takes too long to change'
  });
};

/**
 * @param {Object} element - Clickable element such as button, link or tab.
 * @param {string} errorMessage - Error message when element is not clickable.
 */
var elementToBeClickable = async function(element, errorMessage) {
  await browser.waitUntil(
    await until.elementToBeClickable(element),
    {
      timeout: DEFAULT_WAIT_TIME_MSECS,
      timeoutMsg: errorMessage
    });
};

/**
 * @param {Object} element - Element expected to disappear from DOM and does not
 *                           have height or width.
 * @param {string} errorMessage - Error message when element is still visible.
 */
var invisibilityOf = async function(element, errorMessage) {
  await browser.waitUntil(
    await until.invisibilityOf(element),
    {
      timeout: DEFAULT_WAIT_TIME_MSECS,
      timeoutMsg: errorMessage
    });
};

/**
 * Consider adding this method after each browser.url() call.
 */
var pageToFullyLoad = async function() {
  var loadingMessage = $('.e2e-test-loading-fullpage');
  await browser.waitUntil(
    await until.invisibilityOf(loadingMessage),
    {
      timeout: 15000,
      timeoutMsg: 'Page takes more than 15 secs to load'
    });
};

/**
 * @param {Object} element - Element expected to contain a text.
 * @param {string} text - Text value to compare to element's text.
 * @param {string} errorMessage - Error message when element does not contain
 *                                provided text.
 */
var textToBePresentInElement = async function(element, text, errorMessage) {
  await browser.waitUntil(
    await until.textToBePresentInElement(element, text),
    {
      timeout: DEFAULT_WAIT_TIME_MSECS,
      timeoutMsg: errorMessage
    });
};

/**
 * @param {Object} element - Element is expected to be present on the DOM but
 *                           This does not mean that the element is visible.
 * @param {string} errorMessage - Error message when element is not present.
 */
var presenceOf = async function(element, errorMessage) {
  await browser.waitUntil(
    await until.presenceOf(element),
    {
      timeout: DEFAULT_WAIT_TIME_MSECS,
      timeoutMsg: errorMessage
    });
};

/**
 * @param {Object} element - Element expected to be present in the DOM and has
 *                           height and width that is greater than 0.
 * @param {string} errorMessage - Error message when element is invisible.
 */
var visibilityOf = async function(element, errorMessage) {
  await browser.waitUntil(
    await until.visibilityOf(element),
    {
      timeout: DEFAULT_WAIT_TIME_MSECS,
      timeoutMsg: errorMessage
    });
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
  await browser.waitUntil(async function() {
    return await element.getAttribute(attribute) === value;
  },
  {
    timeout: DEFAULT_WAIT_TIME_MSECS,
    timeoutMsg: errorMessage
  });
};

/**
* Wait for new tab is opened
*/
var newTabToBeCreated = async function(errorMessage, urlToMatch) {
  await browser.waitUntil(async function() {
    var handles = await browser.getWindowHandles();
    await browser.switchToWindow(await handles.pop());
    var url = await browser.getUrl();
    return await url.match(urlToMatch);
  },
  {
    timeout: DEFAULT_WAIT_TIME_MSECS_FOR_NEW_TAB,
    timeoutMsg: errorMessage
  });
};

/**
 * @param {string} url - URL to redirect
 */
var urlRedirection = async function(url) {
  // Checks that the current URL matches the expected text.
  await browser.waitUntil(
    await until.urlIs(url),
    {
      timeout: DEFAULT_WAIT_TIME_MSECS,
      timeoutMsg: 'URL redirection took too long'
    });
};

var visibilityOfInfoToast = async function(errorMessage) {
  var toastInfoElement = $('.toast-info');
  await visibilityOf(toastInfoElement, errorMessage);
};

var invisibilityOfInfoToast = async function(errorMessage) {
  var toastInfoElement = $('.toast-info');
  await invisibilityOf(toastInfoElement, errorMessage);
};

var invisibilityOfLoadingMessage = async function(errorMessage) {
  var loadingMessage = $('.e2e-test-loading-message');
  await invisibilityOf(loadingMessage, errorMessage);
};

var visibilityOfSuccessToast = async function(errorMessage) {
  var toastSuccessElement = $('.toast-success');
  await visibilityOf(toastSuccessElement, errorMessage);
};

var fadeInToComplete = async function(element, errorMessage) {
  await visibilityOf(element, 'Editor taking too long to appear');
  await browser.waitUntil(async function() {
    return (await element.getCSSProperty('opacity')).value === 1;
  },
  {
    timeout: DEFAULT_WAIT_TIME_MSECS,
    timeoutMsg: errorMessage
  });
};

var modalPopupToAppear = async function() {
  await visibilityOf(
    $('.modal-body'), 'Modal taking too long to appear.');
};

/**
 * Check if a file has been downloaded
 */
var fileToBeDownloaded = async function(filename) {
  var name = Constants.DOWNLOAD_PATH + '/' + filename;
  await browser.waitUntil(function() {
    return fs.existsSync(name);
  },
  {
    timeout: DEFAULT_WAIT_TIME_MSECS,
    timeoutMsg: 'File was not downloaded!'
  });
};


var clientSideRedirection = async function(
    action, check, waitForCallerSpecifiedConditions) {
  // Action triggering redirection.
  await action();

  // The action only triggers the redirection but does not wait for it to
  // complete. Manually waiting for redirection here.
  await browser.waitUntil(async() => {
    var url = await browser.getUrl();
    // Condition to wait on.
    return check(decodeURIComponent(url));
  },
  {
    timeout: DEFAULT_WAIT_TIME_MSECS
  });

  // Waiting for caller specified conditions.
  await waitForCallerSpecifiedConditions();
};

exports.DEFAULT_WAIT_TIME_MSECS = DEFAULT_WAIT_TIME_MSECS;
exports.alertToBePresent = alertToBePresent;
exports.urlToBe = urlToBe;
exports.elementToBeClickable = elementToBeClickable;
exports.invisibilityOf = invisibilityOf;
exports.pageToFullyLoad = pageToFullyLoad;
exports.textToBePresentInElement = textToBePresentInElement;
exports.visibilityOf = visibilityOf;
exports.presenceOf = presenceOf;
exports.elementAttributeToBe = elementAttributeToBe;
exports.invisibilityOfInfoToast = invisibilityOfInfoToast;
exports.invisibilityOfLoadingMessage = invisibilityOfLoadingMessage;
exports.visibilityOfInfoToast = visibilityOfInfoToast;
exports.visibilityOfSuccessToast = visibilityOfSuccessToast;
exports.fadeInToComplete = fadeInToComplete;
exports.modalPopupToAppear = modalPopupToAppear;
exports.fileToBeDownloaded = fileToBeDownloaded;
exports.newTabToBeCreated = newTabToBeCreated;
exports.urlRedirection = urlRedirection;
exports.clientSideRedirection = clientSideRedirection;
