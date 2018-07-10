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
var waitTime = 5000;

/**
 * @param {string} errorMessage - Error message when alert does not pop up.
 * @param {int} [waitTime] - Optional wait time (in milliseconds) parameter.
 */
var alertIsPresent = function(errorMessage) {
  if (arguments.length === 2) {
    waitTime = arguments[1];
  }
  return browser.wait(until.alertIsPresent(), waitTime, errorMessage);
};

/**
 * @param {Object} element - Clickable element such as button, link or tab.
 * @param {string} errorMessage - Error message when element is not clickable.
 * @param {int} [waitTime] - Optional wait time (in milliseconds) parameter.
 */
var elementToBeClickable = function(element, errorMessage) {
  if (arguments.length === 3) {
    waitTime = arguments[2];
  }
  return browser.wait(until.elementToBeClickable(element), waitTime,
    errorMessage);
};

/**
 * @param {Object} element - Element expected to disappear from DOM and does not
 *                           have height or width.
 * @param {string} errorMessage - Error message when element is still visible.
 * @param {int} [waitTime] - Optional wait time (in milliseconds) parameter.
 */
var invisibilityOf = function(element, errorMessage) {
  if (arguments.length === 3) {
    waitTime = arguments[2];
  }
  return browser.wait(until.invisibilityOf(element), waitTime, errorMessage);
};

/**
 * Consider adding this method after each browser.get() call.
 */
var loadingMessage = function() {
  // Completely wait for page to load to avoid XMLHTTPReq error on page refresh:
  // https://github.com/angular/angular.js/issues/14219#issuecomment-251605766
  // and browser.waitForAngular()'s flakiness
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
  if (arguments.length === 4) {
    waitTime = arguments[3];
  }
  return browser.wait(until.textToBePresentInElement(element, text), waitTime,
    errorMessage);
};

/**
 * @param {Object} element - Element expected to be present in the DOM and has
 *                           height and width that is greater than 0.
 * @param {string} errorMessage - Error message when element is invisible.
 */
var visibilityOf = function(element, errorMessage) {
  if (arguments.length === 3) {
    waitTime = arguments[2];
  }
  return browser.wait(until.visibilityOf(element), waitTime, errorMessage);
};

exports.alertIsPresent = alertIsPresent;
exports.elementToBeClickable = elementToBeClickable;
exports.invisibilityOf = invisibilityOf;
exports.loadingMessage = loadingMessage;
exports.textToBePresentInElement = textToBePresentInElement;
exports.visibilityOf = visibilityOf;
