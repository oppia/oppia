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

var alertToBePresent = function() {
  return browser.wait(
    until.alertIsPresent(), DEFAULT_WAIT_TIME_MSECS,
    'Alert box took too long to appear.');
};

/**
 * @param {Object} element - Clickable element such as button, link or tab.
 * @param {string} errorMessage - Error message when element is not clickable.
 */
var elementToBeClickable = function(element, errorMessage) {
  return browser.wait(
    until.elementToBeClickable(element), DEFAULT_WAIT_TIME_MSECS, errorMessage);
};

/**
 * @param {Object} element - Element expected to disappear from DOM and does not
 *                           have height or width.
 * @param {string} errorMessage - Error message when element is still visible.
 */
var invisibilityOf = function(element, errorMessage) {
  return browser.wait(
    until.invisibilityOf(element), DEFAULT_WAIT_TIME_MSECS, errorMessage);
};

/**
 * Consider adding this method after each browser.get() call.
 */
var pageToFullyLoad = function() {
  // Completely wait for page to load to avoid XMLHTTPReq error on page refresh:
  // https://github.com/angular/angular.js/issues/14219#issuecomment-251605766
  // and browser.waitForAngular's flakiness
  // https://github.com/angular/protractor/issues/2954.
  var loadingMessage = element(by.css('[ng-show="loadingMessage"]'));
  return browser.wait(until.invisibilityOf(loadingMessage), 15000,
    'Page takes more than 15 secs to load');
};

/**
 * @param {Object} element - Element expected to contain a text.
 * @param {string} text - Text value to compare to element's text.
 * @param {string} errorMessage - Error message when element does not contain
 *                                provided text.
 */
var textToBePresentInElement = function(element, text, errorMessage) {
  return browser.wait(
    until.textToBePresentInElement(element, text), DEFAULT_WAIT_TIME_MSECS,
    errorMessage);
};

/**
 * @param {Object} element - Element expected to be present in the DOM and has
 *                           height and width that is greater than 0.
 * @param {string} errorMessage - Error message when element is invisible.
 */
var visibilityOf = function(element, errorMessage) {
  return browser.wait(
    until.visibilityOf(element), DEFAULT_WAIT_TIME_MSECS, errorMessage);
};

exports.alertToBePresent = alertToBePresent;
exports.elementToBeClickable = elementToBeClickable;
exports.invisibilityOf = invisibilityOf;
exports.pageToFullyLoad = pageToFullyLoad;
exports.textToBePresentInElement = textToBePresentInElement;
exports.visibilityOf = visibilityOf;
