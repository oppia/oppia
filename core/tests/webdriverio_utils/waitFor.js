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
const { default: $ } = require('webdriverio/build/commands/browser/$');
// When running tests on mobile via browserstack, the localhost
// might take some time to establish a connection with the
// server since the mobile tests are run on a real
// mobile device.
var DEFAULT_WAIT_TIME_MSECS = browser.isMobile ? 20000 : 10000;
var DEFAULT_WAIT_TIME_MSECS_FOR_NEW_TAB = 15000;

var toastInfoElement = $('.toast-info');
var toastSuccessElement = $('.toast-success');
var loadingMessage = $('.protractor-test-loading-message');

var alertToBePresent = async() => {
  await browser.waitUntil(
    until.alertIsPresent(),
    {
      timeout: DEFAULT_WAIT_TIME_MSECS,
      timeoutMsg: 'Alert box took too long to appear.'
    });
};

/**
 * @param {Object} element - Clickable element such as button, link or tab.
 * @param {string} errorMessage - Error message when element is not clickable.
 */
var elementToBeClickable = async function(element, errorMessage) {
  await element.waitForClickable(
    {
      timeout: DEFAULT_WAIT_TIME_MSECS,
      timeoutMsg: errorMessage
    });
};

/**
 * @param {Object} element - Clickable element such as button, link or tab.
 * @param {string} errorMessage - Error message when element is not clickable.
 */
var elementToBeClickable = async function(element, errorMessage) {
  await element.waitForClickable({
    timeout: DEFAULT_WAIT_TIME_MSECS,
    timeoutMsg: errorMessage,
  });
};

/**
 * Consider adding this method after each browser.url() call.
 */
var pageToFullyLoad = async function() {
  var loadingMessage = await $('.protractor-test-loading-fullpage');
  await loadingMessage.waitForExist({
    timeout: 15000,
    reverse: true,
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
  await element.waitForDisplayed({
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
  await browser.waitUntil(
    await element.getAttribute(attribute) === value,
    {
      timeout: DEFAULT_WAIT_TIME_MSECS,
      timeoutMsg: errorMessage
    });
};

var fadeInToComplete = async function(element, errorMessage) {
  await visibilityOf(element, 'Editor taking too long to appear');
  await browser.waitUntil(
    await element.getCSSProperty('opacity') === '1',
    {
      timeout: DEFAULT_WAIT_TIME_MSECS,
      timeoutMsg: errorMessage
    });
};

var modalPopupToAppear = async function() {
  await visibilityOf(
    $('.modal-body'), 'Modal taking too long to appear.');
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
