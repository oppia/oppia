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
 * @fileoverview Utilities for delaying actions with WebdriverIO's
 * ExpectedConditions.
 */

var until = require('wdio-wait-for');

var DEFAULT_WAIT_TIME_MSECS = 10000;

var alertToBePresent = async() => {
  await browser.waitUntil(
    until.alertIsPresent(),
    {
      timeout: DEFAULT_WAIT_TIME_MSECS,
      timeoutMsg: 'Alert box took too long to appear.'
    });
};

/**
 * Consider adding this method after each browser.get() call.
 */
var pageToFullyLoad = async() => {
  var loadingMessage = await $('.protractor-test-loading-fullpage');
  await browser.waitUntil(
    until.invisibilityOf(loadingMessage),
    {
      timeout: 15000,
      timeoutMsg: 'Page takes more than 15 secs to load'
    });
};

/**
 * @param {Object} element - Element is expected to be present on the DOM but
 *                           This does not mean that the element is visible.
 * @param {string} errorMessage - Error message when element is not present.
 */
var presenceOf = async(element, errorMessage) => {
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
var visibilityOf = async(element, errorMessage) => {
  await browser.waitUntil(
    await until.visibilityOf(element),
    {
      timeout: DEFAULT_WAIT_TIME_MSECS,
      timeoutMsg: errorMessage
    });
};

exports.alertToBePresent = alertToBePresent;
exports.pageToFullyLoad = pageToFullyLoad;
exports.presenceOf = presenceOf;
exports.visibilityOf = visibilityOf;
