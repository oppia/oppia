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
// When running tests on mobile via browserstack, the localhost
// might take some time to establish a connection with the
// server since the mobile tests are run on a real
// mobile device.
var DEFAULT_WAIT_TIME_MSECS = browser.isMobile ? 20000 : 10000;

var toastInfoElement = element(by.css('.toast-info'));
var toastSuccessElement = element(by.css('.toast-success'));

var alertToBePresent = async function() {
  await browser.wait(
    until.alertIsPresent(), DEFAULT_WAIT_TIME_MSECS,
    'Alert box took too long to appear.');
};

/**
 * @param {Object} element - Clickable element such as button, link or tab.
 * @param {string} errorMessage - Error message when element is not clickable.
 */
var elementToBeClickable = async function(element, errorMessage) {
  await browser.wait(
    until.elementToBeClickable(element), DEFAULT_WAIT_TIME_MSECS, errorMessage);
};

/**
 * @param {Object} element - Element expected to disappear from DOM and does not
 *                           have height or width.
 * @param {string} errorMessage - Error message when element is still visible.
 */
var invisibilityOf = async function(element, errorMessage) {
  await browser.wait(
    await until.invisibilityOf(element),
    DEFAULT_WAIT_TIME_MSECS, errorMessage);
};

/**
 * Consider adding this method after each browser.get() call.
 */
var pageToFullyLoad = async function() {
  // Completely wait for page to load to avoid XMLHTTPReq error on page refresh:
  // https://github.com/angular/angular.js/issues/14219#issuecomment-251605766
  // and browser.waitForAngular's flakiness
  // https://github.com/angular/protractor/issues/2954.
  var loadingMessage = element(by.css('[ng-show="loadingMessage"]'));
  await browser.driver.wait(until.invisibilityOf(loadingMessage), 15000,
    'Page takes more than 15 secs to load');
};

/**
 * @param {Object} element - Element expected to contain a text.
 * @param {string} text - Text value to compare to element's text.
 * @param {string} errorMessage - Error message when element does not contain
 *                                provided text.
 */
var textToBePresentInElement = async function(element, text, errorMessage) {
  await browser.wait(
    until.textToBePresentInElement(element, text), DEFAULT_WAIT_TIME_MSECS,
    errorMessage);
};

/**
 * @param {Object} element - Element is expected to be present on the DOM but
 *                           This does not mean that the element is visible.
 * @param {string} errorMessage - Error message when element is not present.
 */
var presenceOf = async function(element, errorMessage) {
  await browser.wait(
    await until.presenceOf(element),
    DEFAULT_WAIT_TIME_MSECS, errorMessage);
};

/**
 * @param {Object} element - Element expected to be present in the DOM and has
 *                           height and width that is greater than 0.
 * @param {string} errorMessage - Error message when element is invisible.
 */
var visibilityOf = async function(element, errorMessage) {
  await browser.wait(
    await until.visibilityOf(element),
    DEFAULT_WAIT_TIME_MSECS, errorMessage);
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
  await browser.wait(async function() {
    return await element.getAttribute(attribute) === value;
  }, DEFAULT_WAIT_TIME_MSECS, errorMessage);
};

/**
* Wait for new tab is opened
*/
var newTabToBeCreated = async function(errorMessage, urlToMatch) {
  var currentHandles = [];

  await browser.wait(async function() {
    var handles = await browser.driver.getAllWindowHandles();
    await browser.waitForAngularEnabled(false);
    await browser.switchTo().window(await handles.pop());
    var url = await browser.getCurrentUrl();
    await browser.waitForAngularEnabled(true);
    return await url.match(urlToMatch);
  }, DEFAULT_WAIT_TIME_MSECS, errorMessage);
};

/**
 * @param {string} url - URL to redirect
 */
var urlRedirection = async function(url) {
  // Checks that the current URL matches the expected text.
  await browser.wait(until.urlIs(url), DEFAULT_WAIT_TIME_MSECS,
    'URL redirection took too long');
};

var visibilityOfInfoToast = async function(errorMessage) {
  await visibilityOf(toastInfoElement, errorMessage);
};

var invisibilityOfInfoToast = async function(errorMessage) {
  await invisibilityOf(toastInfoElement, errorMessage);
};

var visibilityOfSuccessToast = async function(errorMessage) {
  await invisibilityOf(toastSuccessElement, errorMessage);
};

var modalPopupToAppear = async function() {
  await visibilityOf(
    element(by.css('.modal-body')), 'Modal taking too long to appear.');
};

exports.alertToBePresent = alertToBePresent;
exports.elementToBeClickable = elementToBeClickable;
exports.invisibilityOf = invisibilityOf;
exports.pageToFullyLoad = pageToFullyLoad;
exports.textToBePresentInElement = textToBePresentInElement;
exports.presenceOf = presenceOf;
exports.visibilityOf = visibilityOf;
exports.presenceOf = presenceOf;
exports.elementAttributeToBe = elementAttributeToBe;
exports.newTabToBeCreated = newTabToBeCreated;
exports.urlRedirection = urlRedirection;
exports.invisibilityOfInfoToast = invisibilityOfInfoToast;
exports.visibilityOfInfoToast = visibilityOfInfoToast;
exports.visibilityOfSuccessToast = visibilityOfSuccessToast;
exports.modalPopupToAppear = modalPopupToAppear;
