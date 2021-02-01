// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Utilities for performing actions on element.
 */

var waitFor = require('./waitFor.js');

var autoSaveIndicatorElement = element(
  by.css('.protractor-autosave-indicator'));

// Waits for the invisibility of the autosave message.
var waitForAutosave = async function() {
  await waitFor.invisibilityOf(
    autoSaveIndicatorElement, 'Auto save indicator didn\'t disappear');
};

var clear = async function(inputName, inputElement) {
  await click(inputName, inputElement);
  await inputElement.clear();
};

var click = async function(elementName, clickableElement) {
  await waitFor.visibilityOf(
    clickableElement, `${elementName} is not visible.`);
  await waitFor.elementToBeClickable(
    clickableElement, `${elementName} is not clickable.`);

  await clickableElement.click();
};

var select = async function(selectorName, selectorElement, optionToSelect) {
  await click(selectorName, selectorElement);
  var optionElement = selectorElement.element(
    by.cssContainingText('option', optionToSelect));
  await optionElement.click();
};

var select2 = async function(selectorName, selectorElement, optionToSelect) {
  await click(selectorName, selectorElement);
  var select2Results = element(by.css('.select2-results'));
  await waitFor.visibilityOf(
    select2Results, `${selectorName} options are not visible.`);
  var option = select2Results.element(
    by.cssContainingText('li', optionToSelect));
  await click(`${optionToSelect} in ${selectorName}`, option);
};

var sendKeys = async function(
    inputName, inputElement, keys, clickInputElement = true) {
  if (clickInputElement) {
    await click(inputName, inputElement);
  }
  await inputElement.sendKeys(keys);
};

exports.clear = clear;
exports.click = click;
exports.select = select;
exports.select2 = select2;
exports.sendKeys = sendKeys;
exports.waitForAutosave = waitForAutosave;
